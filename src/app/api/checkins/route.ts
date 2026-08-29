import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function toScale(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 5) return null;
  return n;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const energy = toScale(body?.energy);
  const sleepQuality = toScale(body?.sleepQuality);
  const muscleSoreness = toScale(body?.muscleSoreness);
  const stress = toScale(body?.stress);
  const notes = body?.notes ? String(body.notes).trim().slice(0, 1000) : null;

  if (energy === null || sleepQuality === null || muscleSoreness === null || stress === null) {
    return NextResponse.json(
      { error: "Todas las escalas deben ser un número entre 1 y 5." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("readiness_checkins")
    .insert({
      user_id: user.id,
      energy,
      sleep_quality: sleepQuality,
      muscle_soreness: muscleSoreness,
      stress,
      notes,
    })
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "No se pudo guardar el check-in." }, { status: 500 });
  }

  return NextResponse.json({ checkin: data });
}
