"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isCoachId } from "@/lib/coaches";

export type OnboardingState = { error: string } | undefined;

export async function completeOnboardingAction(
  _prevState: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const fullName = String(formData.get("full_name") ?? "").trim();
  const sports = formData.getAll("sports").map(String);
  const level = String(formData.get("level") ?? "");
  const weeklyHoursRaw = String(formData.get("weekly_hours") ?? "");
  const coachId = String(formData.get("coach") ?? "");

  if (!fullName || sports.length === 0 || !level || !weeklyHoursRaw || !isCoachId(coachId)) {
    return { error: "Completa todos los campos antes de continuar." };
  }

  const weeklyHours = Number(weeklyHoursRaw);
  if (!Number.isFinite(weeklyHours) || weeklyHours <= 0) {
    return { error: "Ingresa un número válido de horas por semana." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      sports,
      level: level as never,
      weekly_hours: weeklyHours,
      preferred_coach: coachId,
      onboarding_completed: true,
    })
    .eq("id", user.id);

  if (error) {
    return { error: "No pudimos guardar tu perfil. Intenta de nuevo." };
  }

  const { error: convError } = await supabase
    .from("conversations")
    .upsert({ user_id: user.id, coach_id: coachId }, { onConflict: "user_id,coach_id" });

  if (convError) {
    return { error: "No pudimos preparar tu chat. Intenta de nuevo." };
  }

  redirect("/chat");
}
