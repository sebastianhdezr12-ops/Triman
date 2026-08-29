import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncStravaActivities } from "@/lib/strava";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  try {
    const count = await syncStravaActivities(supabase, user.id);
    if (count === null) {
      return NextResponse.json({ error: "No conectado con Strava." }, { status: 400 });
    }
    return NextResponse.json({ synced: count });
  } catch (err) {
    console.error("Strava sync error:", err);
    return NextResponse.json({ error: "No se pudo sincronizar con Strava." }, { status: 500 });
  }
}
