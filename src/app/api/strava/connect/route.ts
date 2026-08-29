import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isCoachId } from "@/lib/coaches";
import { getStravaAuthorizeUrl } from "@/lib/strava";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { searchParams, origin } = new URL(request.url);
  const coach = searchParams.get("coach");
  const state = isCoachId(coach ?? "") ? coach! : "charly";

  const redirectUri = `${origin}/api/strava/callback`;
  return NextResponse.redirect(getStravaAuthorizeUrl(redirectUri, state));
}
