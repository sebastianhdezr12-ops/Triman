import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isCoachId } from "@/lib/coaches";
import { exchangeStravaCode, syncStravaActivities } from "@/lib/strava";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const coach = isCoachId(state ?? "") ? state! : "charly";
  const errorParam = searchParams.get("error");

  const backToChat = new URL(`/chat/${coach}`, origin);

  if (errorParam || !code) {
    backToChat.searchParams.set("strava_error", "denied");
    return NextResponse.redirect(backToChat);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  try {
    const tokens = await exchangeStravaCode(code);
    if (!tokens.athlete) throw new Error("Strava no devolvió el atleta.");

    const { error } = await supabase.from("strava_connections").upsert(
      {
        user_id: user.id,
        strava_athlete_id: tokens.athlete.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(tokens.expires_at * 1000).toISOString(),
        scope: "activity:read_all",
      },
      { onConflict: "user_id" }
    );

    if (error) throw new Error(error.message);

    await syncStravaActivities(supabase, user.id);
  } catch (err) {
    console.error("Strava connect error:", err);
    backToChat.searchParams.set("strava_error", "1");
    return NextResponse.redirect(backToChat);
  }

  backToChat.searchParams.set("strava_connected", "1");
  return NextResponse.redirect(backToChat);
}
