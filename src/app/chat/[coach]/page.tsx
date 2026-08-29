import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { isCoachId } from "@/lib/coaches";
import { ChatShell } from "@/components/chat/chat-shell";

export default async function ChatCoachPage({ params }: PageProps<"/chat/[coach]">) {
  const { coach } = await params;
  if (!isCoachId(coach)) {
    notFound();
  }

  const { userId, profile } = await requireProfile();
  const supabase = await createClient();

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id")
    .eq("user_id", userId)
    .eq("coach_id", coach)
    .maybeSingle();

  const { data: messages } = conversation
    ? await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true })
    : { data: [] };

  const { data: activePlan } = await supabase
    .from("training_plans")
    .select("*")
    .eq("user_id", userId)
    .eq("coach_id", coach)
    .eq("status", "active")
    .maybeSingle();

  const { data: activePlanSessions } = activePlan
    ? await supabase
        .from("training_sessions")
        .select("*")
        .eq("plan_id", activePlan.id)
        .order("session_date", { ascending: true })
    : { data: [] };

  const { data: latestCheckin } = await supabase
    .from("readiness_checkins")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <ChatShell
      key={coach}
      coachId={coach}
      profile={profile}
      initialMessages={messages ?? []}
      activePlan={activePlan ?? null}
      activePlanSessions={activePlanSessions ?? []}
      latestCheckin={latestCheckin ?? null}
    />
  );
}
