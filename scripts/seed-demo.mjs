import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const content = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const DEMO_PASSWORD = "TrimanDemo123!";

const DEMO_USERS = [
  {
    email: "ana.demo@triman.app",
    full_name: "Ana Torres",
    sports: ["triatlón", "natación"],
    level: "intermediate",
    weekly_hours: 10,
    preferred_coach: "claudia",
    plan: {
      title: "Base 6 semanas — medio Ironman",
      sessions: [
        {
          session_date: daysFromNow(1),
          sport: "natación",
          session_type: "técnica",
          duration_minutes: 45,
          description: "Series de 8x100m con enfoque en catch temprano.",
          rationale: "Antes de sumar volumen, afinamos técnica para nadar más eficiente, no solo más.",
        },
        {
          session_date: daysFromNow(3),
          sport: "ciclismo",
          session_type: "fondo suave",
          duration_minutes: 90,
          description: "Rodaje en zona 2, cadencia alta (90+ rpm).",
          rationale: "Construir base aeróbica sin acumular fatiga de cara al fin de semana.",
        },
        {
          session_date: daysFromNow(5),
          sport: "running",
          session_type: "series",
          duration_minutes: 50,
          description: "6x800m a ritmo 10k con 2min de trote suave.",
          rationale: "Empezamos a meter algo de velocidad ahora que la base aeróbica está firme.",
        },
      ],
    },
    messages: [
      { role: "user", content: "Hola Claudia! Cómo debería encarar la primera semana del plan?" },
      {
        role: "assistant",
        content:
          "Hola Ana! Yo en mi primer medio Ironman cometí el error de meterle intensidad desde el día 1 — no lo hagas. Esta semana es pura base: nada suave, rueda en zona 2, y guarda las piernas para las series del jueves. Confía en el proceso, el fondo de hoy es el que te va a sostener en el mes 5 🙂",
      },
    ],
  },
  {
    email: "diego.demo@triman.app",
    full_name: "Diego Ramírez",
    sports: ["running"],
    level: "beginner",
    weekly_hours: 5,
    preferred_coach: "charly",
    plan: null,
    messages: [
      { role: "user", content: "Llevo dos semanas corriendo y me duelen las rodillas después de cada sesión, es normal?" },
      {
        role: "assistant",
        content:
          "Qué bueno que preguntes! Un poco de molestia al empezar es común, pero dolor que se repite cada sesión no lo ignoremos. Cuéntame: ¿es dolor agudo o más como una molestia sorda? Y de una, bájale el ritmo esta semana — mejor 3 trotes cortos y suaves que forzar el de siempre. Cuando quieras armamos un plan real, pero primero cuidemos esas rodillas.",
      },
    ],
  },
  {
    email: "sofia.demo@triman.app",
    full_name: "Sofía Méndez",
    sports: ["ciclismo", "running"],
    level: "advanced",
    weekly_hours: 12,
    preferred_coach: "max",
    plan: {
      title: "Bloque de fuerza — pre-temporada duatlón",
      sessions: [
        {
          session_date: daysFromNow(1),
          sport: "ciclismo",
          session_type: "series de fuerza",
          duration_minutes: 75,
          description: "5x6min a cadencia baja (60rpm), zona 4.",
          rationale: "Fuerza específica sobre la bici. Sin esto, no aguantas el segundo tramo de carrera.",
        },
        {
          session_date: daysFromNow(2),
          sport: "running",
          session_type: "descanso activo",
          duration_minutes: 30,
          description: "Trote muy suave o descanso total, tu decides.",
          rationale: "Ayer exigí fuerte. Hoy se recupera. No es opcional, es parte del plan.",
        },
      ],
    },
    checkin: { energy: 3, sleep_quality: 3, muscle_soreness: 4, stress: 2, notes: "piernas cargadas del bloque de fuerza" },
    messages: [
      { role: "user", content: "Max, tengo las piernas destrozadas del bloque de ayer. Sigo con el plan o descanso?" },
      {
        role: "assistant",
        content:
          "Dolor muscular en 4/5 después de un bloque de fuerza no es debilidad, es la respuesta esperada. Hoy toca descanso activo, como dice el plan — no lo cambiamos por capricho, lo cambiamos por datos, y tus datos dicen que la sesión de hoy YA es la de recuperación. Mañana volvemos con todo. Disciplina también es saber parar cuando el plan lo dice.",
      },
    ],
  },
];

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

async function seedUser(demo) {
  console.log(`\n--- ${demo.email} ---`);

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: demo.email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: demo.full_name },
  });

  let userId = created?.user?.id;

  if (createError) {
    if (createError.message?.includes("already been registered")) {
      const { data: list } = await supabase.auth.admin.listUsers();
      userId = list?.users?.find((u) => u.email === demo.email)?.id;
      console.log("  usuario ya existía, reutilizando id:", userId);
    } else {
      console.error("  ERROR creando usuario:", createError.message);
      return;
    }
  } else {
    console.log("  usuario creado:", userId);
  }

  if (!userId) return;

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: demo.full_name,
      sports: demo.sports,
      level: demo.level,
      weekly_hours: demo.weekly_hours,
      preferred_coach: demo.preferred_coach,
      onboarding_completed: true,
    })
    .eq("id", userId);

  if (profileError) console.error("  ERROR actualizando perfil:", profileError.message);
  else console.log("  perfil actualizado");

  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .upsert({ user_id: userId, coach_id: demo.preferred_coach }, { onConflict: "user_id,coach_id" })
    .select("id")
    .single();

  if (convError || !conversation) {
    console.error("  ERROR creando conversación:", convError?.message);
    return;
  }

  for (const m of demo.messages) {
    const { error } = await supabase.from("messages").insert({
      conversation_id: conversation.id,
      user_id: userId,
      coach_id: demo.preferred_coach,
      role: m.role,
      content: m.content,
    });
    if (error) console.error("  ERROR insertando mensaje:", error.message);
  }
  console.log(`  ${demo.messages.length} mensajes de ejemplo creados`);

  if (demo.plan) {
    const { data: plan, error: planError } = await supabase
      .from("training_plans")
      .insert({ user_id: userId, coach_id: demo.preferred_coach, title: demo.plan.title })
      .select("id")
      .single();

    if (planError || !plan) {
      console.error("  ERROR creando plan:", planError?.message);
    } else {
      const rows = demo.plan.sessions.map((s) => ({ ...s, plan_id: plan.id, user_id: userId }));
      const { error: sessionsError } = await supabase.from("training_sessions").insert(rows);
      if (sessionsError) console.error("  ERROR creando sesiones:", sessionsError.message);
      else console.log(`  plan "${demo.plan.title}" con ${rows.length} sesiones creado`);
    }
  }

  if (demo.checkin) {
    const { error } = await supabase.from("readiness_checkins").insert({ ...demo.checkin, user_id: userId });
    if (error) console.error("  ERROR creando check-in:", error.message);
    else console.log("  check-in de ejemplo creado");
  }
}

async function main() {
  for (const demo of DEMO_USERS) {
    await seedUser(demo);
  }

  console.log("\n=== Cuentas demo ===");
  console.log(`Password para las 3: ${DEMO_PASSWORD}`);
  for (const demo of DEMO_USERS) {
    console.log(`- ${demo.email} (coach: ${demo.preferred_coach})`);
  }
}

main().catch((err) => {
  console.error("ERROR:", err);
  process.exit(1);
});
