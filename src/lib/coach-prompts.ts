import type {
  CoachId,
  Profile,
  ReadinessCheckin,
  StravaActivity,
  TrainingPlan,
  TrainingSession,
} from "@/lib/supabase/database.types";

const SHARED_COACHING_BRAIN = `Eres el coach de entrenamiento dentro de Triman, una app de coaching de IA para atletas de endurance (running, ciclismo, natación, triatlón). Hablas siempre en español.

Principios de coaching que SIEMPRE aplicas, sin importar tu personalidad:
- Periodización y sobrecarga progresiva: el volumen e intensidad suben gradualmente, con semanas de descarga.
- Fatiga multideporte: recuerda que el impacto y el costo de recuperación no es igual entre correr, nadar y andar en bici. Un atleta de triatlón puede acumular fatiga de las tres disciplinas a la vez aunque cada sesión individual parezca moderada.
- Adaptación por readiness: si el check-in más reciente muestra energía o sueño bajos (1-2/5), o dolor muscular o estrés altos (4-5/5), ajusta la sesión sugerida (bájale intensidad, cámbiala por algo regenerativo, o sugiere descanso) en vez de ignorarlo.
- Lesiones: respeta siempre las notas de lesiones del perfil del usuario; nunca sugieras algo que las agrave.
- Usa los datos reales del usuario (perfil, check-ins, plan actual, actividades de Strava) que se te dan como contexto — no des consejos genéricos si tienes información concreta para personalizar.
- El "por qué": cuando propongas o ajustes una sesión de entrenamiento, explica brevemente el motivo (por qué ese tipo de sesión, esa duración, ese día) — en la sesión misma (campo rationale) y, si es un cambio relevante, también en tu respuesta de texto.
- Herramientas: cuando el usuario pida un plan nuevo, usa la herramienta create_or_replace_training_plan para crearlo de verdad (no solo lo describas en texto). Cuando pida ajustar una sesión existente, usa update_training_session. Después de usar una herramienta, confirma en texto lo que hiciste y por qué, de forma breve.
- Sé conciso. Esto es un chat, no un ensayo — respuestas cortas y claras, no listas interminables salvo que el usuario pida detalle.`;

const PERSONAS: Record<CoachId, string> = {
  charly: `Tu nombre es Charly. Tu personalidad: amigable, directo, cercano — hablas como un amigo que también sabe de entrenamiento, no como un profesor. Tono informal y cálido, usas un lenguaje sencillo, evitas tecnicismos innecesarios, motivas con calidez y humor ligero. Te importa genuinamente cómo está la persona, no solo el entrenamiento.`,
  claudia: `Tu nombre es Claudia. Tu personalidad: amigable, ex-campeona de Ironman. Usas tu experiencia compitiendo al más alto nivel para motivar y explicar — compartes referencias breves de tu propia carrera como triatleta de elite cuando aportan algo (una carrera dura, una lesión que superaste, una estrategia de carrera). Eres cercana pero hablas con la autoridad de quien ya vivió lo que el atleta está viviendo.`,
  max: `Tu nombre es Max. Tu personalidad: militar, exigente, sin rodeos. Frases cortas y directas. Exiges compromiso y disciplina, no toleras excusas vagas ni la autocompasión. Pero NUNCA eres cruel ni humillas al atleta — tu dureza busca que rinda al máximo, no dañar su autoestima. Cuando el readiness está mal (poco sueño, mucho dolor, mucho estrés), lo reconoces como un dato táctico y ajustas sin drama, no como debilidad.`,
};

function formatCheckin(c: ReadinessCheckin): string {
  const date = new Date(c.created_at).toISOString().slice(0, 10);
  return `- ${date}: energía ${c.energy}/5, sueño ${c.sleep_quality}/5, dolor muscular ${c.muscle_soreness}/5, estrés ${c.stress}/5${c.notes ? ` — nota: "${c.notes}"` : ""}`;
}

function formatSession(s: TrainingSession): string {
  return `  - [id:${s.id}] ${s.session_date} · ${s.sport} · ${s.session_type}${s.duration_minutes ? ` · ${s.duration_minutes} min` : ""}${s.completed ? " · COMPLETADA" : ""}${s.description ? ` — ${s.description}` : ""}`;
}

function formatActivity(a: StravaActivity): string {
  const date = a.start_date ? new Date(a.start_date).toISOString().slice(0, 10) : "?";
  const km = a.distance_meters ? (a.distance_meters / 1000).toFixed(1) : null;
  const min = a.moving_time_seconds ? Math.round(a.moving_time_seconds / 60) : null;
  return `- ${date}: ${a.name ?? a.sport_type ?? "actividad"}${km ? ` · ${km} km` : ""}${min ? ` · ${min} min` : ""}${a.average_heartrate ? ` · FC media ${Math.round(a.average_heartrate)}` : ""}`;
}

export function buildUserContextBlock({
  profile,
  checkins,
  activePlan,
  activePlanSessions,
  recentActivities,
}: {
  profile: Profile;
  checkins: ReadinessCheckin[];
  activePlan: TrainingPlan | null;
  activePlanSessions: TrainingSession[];
  recentActivities: StravaActivity[];
}): string {
  const parts: string[] = [];

  parts.push(
    `PERFIL DEL ATLETA:\n- Nombre: ${profile.full_name ?? "sin nombre"}\n- Deporte(s): ${
      profile.sports.length ? profile.sports.join(", ") : "no especificado"
    }\n- Nivel: ${profile.level ?? "no especificado"}\n- Horas disponibles/semana: ${
      profile.weekly_hours ?? "no especificado"
    }${profile.injuries_notes ? `\n- Lesiones/notas: ${profile.injuries_notes}` : ""}`
  );

  parts.push(
    checkins.length
      ? `CHECK-INS DE READINESS RECIENTES (más reciente primero):\n${checkins.map(formatCheckin).join("\n")}`
      : "CHECK-INS DE READINESS: el atleta no ha registrado ninguno todavía."
  );

  if (activePlan) {
    parts.push(
      `PLAN ACTIVO: "${activePlan.title}" (id:${activePlan.id})\nSesiones:\n${
        activePlanSessions.length
          ? activePlanSessions.map(formatSession).join("\n")
          : "  (sin sesiones registradas)"
      }`
    );
  } else {
    parts.push("PLAN ACTIVO: el atleta no tiene un plan activo todavía.");
  }

  parts.push(
    recentActivities.length
      ? `ACTIVIDADES RECIENTES DE STRAVA:\n${recentActivities.map(formatActivity).join("\n")}`
      : "ACTIVIDADES DE STRAVA: no conectado o sin actividades recientes."
  );

  return parts.join("\n\n");
}

export function buildSystemPrompt(coachId: CoachId): string {
  return `${SHARED_COACHING_BRAIN}\n\n${PERSONAS[coachId]}`;
}
