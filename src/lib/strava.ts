import "server-only";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID!;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET!;
const STRAVA_SCOPE = "activity:read_all";
const ACTIVITIES_PER_PAGE = 20;

export function getStravaAuthorizeUrl(redirectUri: string, state: string) {
  const url = new URL("https://www.strava.com/oauth/authorize");
  url.searchParams.set("client_id", STRAVA_CLIENT_ID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("approval_prompt", "auto");
  url.searchParams.set("scope", STRAVA_SCOPE);
  url.searchParams.set("state", state);
  return url.toString();
}

interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete?: { id: number };
}

export async function exchangeStravaCode(code: string): Promise<StravaTokenResponse> {
  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) throw new Error(`Strava token exchange failed: ${res.status}`);
  return res.json();
}

async function refreshStravaToken(refreshToken: string): Promise<StravaTokenResponse> {
  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) throw new Error(`Strava token refresh failed: ${res.status}`);
  return res.json();
}

/**
 * Returns a valid access token for the user's Strava connection, refreshing
 * it first (and persisting the refreshed tokens) if it's expired or about
 * to expire. Returns null if the user has no Strava connection.
 */
export async function getValidStravaAccessToken(
  supabase: Supabase,
  userId: string
): Promise<string | null> {
  const { data: connection } = await supabase
    .from("strava_connections")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!connection) return null;

  const expiresAt = new Date(connection.expires_at).getTime();
  const isExpiringSoon = expiresAt - Date.now() < 5 * 60 * 1000;

  if (!isExpiringSoon) return connection.access_token;

  const refreshed = await refreshStravaToken(connection.refresh_token);

  await supabase
    .from("strava_connections")
    .update({
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token,
      expires_at: new Date(refreshed.expires_at * 1000).toISOString(),
    })
    .eq("user_id", userId);

  return refreshed.access_token;
}

export interface StravaApiActivity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  start_date: string;
  moving_time: number;
  distance: number;
  average_speed: number | null;
  average_heartrate: number | null;
  average_watts: number | null;
}

export async function fetchStravaActivities(accessToken: string): Promise<StravaApiActivity[]> {
  const url = new URL("https://www.strava.com/api/v3/athlete/activities");
  url.searchParams.set("per_page", String(ACTIVITIES_PER_PAGE));

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error(`Strava activities fetch failed: ${res.status}`);
  return res.json();
}

/**
 * Fetches the user's recent Strava activities and upserts them into
 * strava_activities. Returns the number of activities synced, or null if
 * the user isn't connected.
 */
export async function syncStravaActivities(
  supabase: Supabase,
  userId: string
): Promise<number | null> {
  const accessToken = await getValidStravaAccessToken(supabase, userId);
  if (!accessToken) return null;

  const activities = await fetchStravaActivities(accessToken);

  if (activities.length === 0) return 0;

  const rows = activities.map((a) => ({
    id: a.id,
    user_id: userId,
    name: a.name,
    sport_type: a.sport_type ?? a.type,
    start_date: a.start_date,
    moving_time_seconds: a.moving_time,
    distance_meters: a.distance,
    average_speed: a.average_speed,
    average_heartrate: a.average_heartrate,
    average_watts: a.average_watts,
    raw: a as unknown as Record<string, unknown>,
  }));

  const { error } = await supabase.from("strava_activities").upsert(rows, { onConflict: "id" });
  if (error) throw new Error(`Failed to store Strava activities: ${error.message}`);

  return rows.length;
}
