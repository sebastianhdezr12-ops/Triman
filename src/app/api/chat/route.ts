import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isCoachId } from "@/lib/coaches";
import type { CoachId, Message } from "@/lib/supabase/database.types";

async function getOrCreateConversation(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  coachId: CoachId
) {
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("user_id", userId)
    .eq("coach_id", coachId)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("conversations")
    .insert({ user_id: userId, coach_id: coachId })
    .select("id")
    .single();

  if (error || !created) throw new Error("No se pudo crear la conversación.");
  return created.id;
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
  const coachId = String(body?.coachId ?? "");
  const content = String(body?.content ?? "").trim();
  const imageUrl = body?.imageUrl ? String(body.imageUrl) : null;

  if (!isCoachId(coachId) || (!content && !imageUrl)) {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const conversationId = await getOrCreateConversation(supabase, user.id, coachId);

  const { data: userMessage, error: insertError } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      user_id: user.id,
      coach_id: coachId,
      role: "user",
      content,
      image_url: imageUrl,
    })
    .select("*")
    .single();

  if (insertError || !userMessage) {
    return NextResponse.json({ error: "No se pudo guardar el mensaje." }, { status: 500 });
  }

  const response: { userMessage: Message; assistantMessage: Message | null } = {
    userMessage,
    assistantMessage: null,
  };

  return NextResponse.json(response);
}
