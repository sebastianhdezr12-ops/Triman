import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, onboarding_completed")
    .eq("id", user.id)
    .single();

  if (profile?.onboarding_completed) {
    redirect("/chat");
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-white px-6 py-12 dark:bg-black">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
          Cuéntanos de ti
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Así tu coach puede armar un plan que sí tenga sentido para ti.
        </p>

        <OnboardingForm defaultFullName={profile?.full_name ?? ""} />
      </div>
    </div>
  );
}
