import type Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { isCoachId } from "@/lib/coaches";
import { anthropic, CHAT_MODEL } from "@/lib/anthropic";
import { buildSystemPrompt, buildUserContextBlock } from "@/lib/coach-prompts";
import { COACH_TOOLS, executeCoachTool } from "@/lib/coach-tools";
import type { CoachId, Message } from "@/lib/supabase/database.types";

type Supabase = Awaited<ReturnType<typeof createClient>>;

const MAX_TOOL_ITERATIONS = 4;
const HISTORY_LIMIT = 20;
const FALLBACK_ERROR_TEXT =
  "Se me cortó la conexión a mitad de la respuesta. ¿Puedes intentar de nuevo en un momento?";

async function getOrCreateConversation(supabase: Supabase, userId: string, coachId: CoachId) {
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

function toMessageContent(content: string, imageUrl: string | null): Anthropic.MessageParam["content"] {
  if (!imageUrl) return content;
  return [
    { type: "image", source: { type: "url", url: imageUrl } },
    { type: "text", text: content || "¿Qué opinas de esta foto?" },
  ];
}

function historyToMessages(history: Message[]): Anthropic.MessageParam[] {
  return history.map((m) => ({
    role: m.role,
    content: toMessageContent(m.content, m.image_url),
  }));
}

async function loadContext(supabase: Supabase, userId: string, coachId: CoachId) {
  const [{ data: profile }, { data: checkins }, { data: activePlan }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase
      .from("readiness_checkins")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("training_plans")
      .select("*")
      .eq("user_id", userId)
      .eq("coach_id", coachId)
      .eq("status", "active")
      .maybeSingle(),
  ]);

  const [{ data: activePlanSessions }, { data: recentActivities }] = await Promise.all([
    activePlan
      ? supabase
          .from("training_sessions")
          .select("*")
          .eq("plan_id", activePlan.id)
          .order("session_date", { ascending: true })
      : Promise.resolve({ data: [] }),
    supabase
      .from("strava_activities")
      .select("*")
      .eq("user_id", userId)
      .order("start_date", { ascending: false })
      .limit(5),
  ]);

  if (!profile) throw new Error("Perfil no encontrado.");

  return {
    profile,
    checkins: checkins ?? [],
    activePlan: activePlan ?? null,
    activePlanSessions: activePlanSessions ?? [],
    recentActivities: recentActivities ?? [],
  };
}

async function runCoachStream(params: {
  supabase: Supabase;
  userId: string;
  coachId: CoachId;
  systemPrompt: string;
  contextBlock: string;
  initialMessages: Anthropic.MessageParam[];
  onText: (chunk: string) => void;
}): Promise<string> {
  const { supabase, userId, coachId, systemPrompt, contextBlock, onText } = params;
  const messages: Anthropic.MessageParam[] = [...params.initialMessages];
  let fullText = "";

  for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
    const stream = anthropic.messages.stream({
      model: CHAT_MODEL,
      max_tokens: 4096,
      system: [
        { type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } },
        { type: "text", text: contextBlock },
      ],
      tools: COACH_TOOLS,
      messages,
    });

    stream.on("text", (delta) => {
      fullText += delta;
      onText(delta);
    });

    const message = await stream.finalMessage();

    if (message.stop_reason === "tool_use") {
      messages.push({ role: "assistant", content: message.content });

      const toolUseBlocks = message.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
      );

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const tool of toolUseBlocks) {
        const result = await executeCoachTool(supabase, userId, coachId, tool.name, tool.input);
        toolResults.push({
          type: "tool_result",
          tool_use_id: tool.id,
          content: JSON.stringify(result),
        });
      }

      messages.push({ role: "user", content: toolResults });
      continue;
    }

    break;
  }

  return fullText;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("No autenticado.", { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const coachId = String(body?.coachId ?? "");
  const content = String(body?.content ?? "").trim();
  const imageUrl = body?.imageUrl ? String(body.imageUrl) : null;

  if (!isCoachId(coachId) || (!content && !imageUrl)) {
    return new Response("Solicitud inválida.", { status: 400 });
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
    return new Response("No se pudo guardar el mensaje.", { status: 500 });
  }

  const { data: history } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);

  const orderedHistory = (history ?? []).slice().reverse();
  // The user's new message was just inserted, so it's already the last item.
  const priorHistory = orderedHistory.slice(0, -1);

  const context = await loadContext(supabase, user.id, coachId);
  const systemPrompt = buildSystemPrompt(coachId);
  const contextBlock = buildUserContextBlock(context);

  const initialMessages: Anthropic.MessageParam[] = [
    ...historyToMessages(priorHistory),
    { role: "user", content: toMessageContent(content, imageUrl) },
  ];

  const encoder = new TextEncoder();

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      let fullText = "";
      try {
        fullText = await runCoachStream({
          supabase,
          userId: user.id,
          coachId,
          systemPrompt,
          contextBlock,
          initialMessages,
          onText: (chunk) => controller.enqueue(encoder.encode(chunk)),
        });
      } catch (err) {
        console.error("Chat stream error:", err);
        if (!fullText) {
          controller.enqueue(encoder.encode(FALLBACK_ERROR_TEXT));
          fullText = FALLBACK_ERROR_TEXT;
        }
      }

      await supabase.from("messages").insert({
        conversation_id: conversationId,
        user_id: user.id,
        coach_id: coachId,
        role: "assistant",
        content: fullText || FALLBACK_ERROR_TEXT,
      });

      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Conversation-Id": conversationId,
    },
  });
}
