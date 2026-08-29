import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import type { createClient } from "@/lib/supabase/server";
import type { CoachId } from "@/lib/supabase/database.types";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export const COACH_TOOLS: Anthropic.Tool[] = [
  {
    name: "create_or_replace_training_plan",
    description:
      "Crea un nuevo plan de entrenamiento activo para el atleta, archivando cualquier plan activo anterior de este coach. Úsala cuando el atleta pida un plan nuevo o cuando propongas reescribir el plan desde cero.",
    input_schema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Título corto del plan, ej. 'Base 8 semanas — medio Ironman'.",
        },
        start_date: { type: "string", description: "Fecha de inicio, formato YYYY-MM-DD." },
        end_date: { type: "string", description: "Fecha de fin, formato YYYY-MM-DD." },
        sessions: {
          type: "array",
          description: "Sesiones del plan, una por día de entrenamiento.",
          items: {
            type: "object",
            properties: {
              session_date: { type: "string", description: "YYYY-MM-DD" },
              sport: { type: "string", description: "ej. running, ciclismo, natación" },
              session_type: {
                type: "string",
                description: "ej. 'rodaje suave', 'series', 'fondo', 'fuerza', 'descanso'",
              },
              duration_minutes: { type: "integer" },
              description: { type: "string", description: "Qué hacer en la sesión." },
              rationale: {
                type: "string",
                description: "El 'por qué' de esta sesión en el contexto del plan.",
              },
            },
            required: ["session_date", "sport", "session_type", "rationale"],
          },
        },
      },
      required: ["title", "sessions"],
    },
  },
  {
    name: "update_training_session",
    description:
      "Ajusta una sesión existente del plan activo (fecha, tipo, duración, descripción, el por qué, o márcala como completada). Úsala para cambios puntuales en vez de rehacer todo el plan.",
    input_schema: {
      type: "object",
      properties: {
        session_id: { type: "string", description: "El id de la sesión a modificar." },
        session_date: { type: "string", description: "YYYY-MM-DD" },
        sport: { type: "string" },
        session_type: { type: "string" },
        duration_minutes: { type: "integer" },
        description: { type: "string" },
        rationale: { type: "string" },
        completed: { type: "boolean" },
      },
      required: ["session_id"],
    },
  },
];

interface PlanSessionInput {
  session_date: string;
  sport: string;
  session_type: string;
  duration_minutes?: number;
  description?: string;
  rationale: string;
}

async function createOrReplaceTrainingPlan(
  supabase: Supabase,
  userId: string,
  coachId: CoachId,
  input: {
    title: string;
    start_date?: string;
    end_date?: string;
    sessions: PlanSessionInput[];
  }
) {
  await supabase
    .from("training_plans")
    .update({ status: "archived" })
    .eq("user_id", userId)
    .eq("coach_id", coachId)
    .eq("status", "active");

  const { data: plan, error: planError } = await supabase
    .from("training_plans")
    .insert({
      user_id: userId,
      coach_id: coachId,
      title: input.title,
      start_date: input.start_date ?? null,
      end_date: input.end_date ?? null,
    })
    .select("*")
    .single();

  if (planError || !plan) {
    return { error: "No se pudo crear el plan." };
  }

  if (input.sessions?.length) {
    const rows = input.sessions.map((s) => ({
      plan_id: plan.id,
      user_id: userId,
      session_date: s.session_date,
      sport: s.sport,
      session_type: s.session_type,
      duration_minutes: s.duration_minutes ?? null,
      description: s.description ?? null,
      rationale: s.rationale,
    }));

    const { error: sessionsError } = await supabase.from("training_sessions").insert(rows);
    if (sessionsError) {
      return { error: "El plan se creó pero hubo un error guardando las sesiones." };
    }
  }

  return { ok: true, plan_id: plan.id, sessions_created: input.sessions?.length ?? 0 };
}

async function updateTrainingSession(
  supabase: Supabase,
  userId: string,
  input: {
    session_id: string;
    session_date?: string;
    sport?: string;
    session_type?: string;
    duration_minutes?: number;
    description?: string;
    rationale?: string;
    completed?: boolean;
  }
) {
  const { session_id, ...update } = input;

  const { error } = await supabase
    .from("training_sessions")
    .update(update)
    .eq("id", session_id)
    .eq("user_id", userId);

  if (error) {
    return { error: "No se pudo actualizar la sesión." };
  }

  return { ok: true };
}

export async function executeCoachTool(
  supabase: Supabase,
  userId: string,
  coachId: CoachId,
  toolName: string,
  input: unknown
): Promise<unknown> {
  switch (toolName) {
    case "create_or_replace_training_plan":
      return createOrReplaceTrainingPlan(
        supabase,
        userId,
        coachId,
        input as Parameters<typeof createOrReplaceTrainingPlan>[3]
      );
    case "update_training_session":
      return updateTrainingSession(
        supabase,
        userId,
        input as Parameters<typeof updateTrainingSession>[2]
      );
    default:
      return { error: `Herramienta desconocida: ${toolName}` };
  }
}
