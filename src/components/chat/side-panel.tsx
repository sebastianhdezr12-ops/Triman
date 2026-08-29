import type {
  CoachId,
  ReadinessCheckin,
  StravaActivity,
  TrainingPlan,
  TrainingSession,
} from "@/lib/supabase/database.types";

const CHECKIN_LABELS: { key: keyof ReadinessCheckin; label: string }[] = [
  { key: "energy", label: "Energía" },
  { key: "sleep_quality", label: "Sueño" },
  { key: "muscle_soreness", label: "Dolor muscular" },
  { key: "stress", label: "Estrés" },
];

function formatActivity(a: StravaActivity) {
  const date = a.start_date ? new Date(a.start_date).toLocaleDateString("es") : "";
  const km = a.distance_meters ? `${(a.distance_meters / 1000).toFixed(1)} km` : null;
  const min = a.moving_time_seconds ? `${Math.round(a.moving_time_seconds / 60)} min` : null;
  return { date, name: a.name ?? a.sport_type ?? "Actividad", detail: [km, min].filter(Boolean).join(" · ") };
}

export function SidePanel({
  coachId,
  activePlan,
  activePlanSessions,
  latestCheckin,
  onOpenCheckin,
  stravaConnected,
  recentActivities,
  onSyncStrava,
  syncingStrava,
}: {
  coachId: CoachId;
  activePlan: TrainingPlan | null;
  activePlanSessions: TrainingSession[];
  latestCheckin: ReadinessCheckin | null;
  onOpenCheckin: () => void;
  stravaConnected: boolean;
  recentActivities: StravaActivity[];
  onSyncStrava: () => void;
  syncingStrava: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
        <h3 className="text-sm font-semibold text-zinc-950 dark:text-white">Plan actual</h3>
        {activePlan ? (
          <div className="mt-2 flex flex-col gap-2">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{activePlan.title}</p>
            <ul className="flex flex-col gap-1.5">
              {activePlanSessions.slice(0, 5).map((session) => (
                <li key={session.id} className="text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    {session.session_date}
                  </span>{" "}
                  · {session.sport} · {session.session_type}
                  {session.duration_minutes ? ` · ${session.duration_minutes} min` : ""}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Sin plan activo todavía. Pídele a tu coach que te arme uno.
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-950 dark:text-white">Último check-in</h3>
          <button
            type="button"
            onClick={onOpenCheckin}
            className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400"
          >
            {latestCheckin ? "Actualizar" : "Registrar"}
          </button>
        </div>
        {latestCheckin ? (
          <div className="mt-2 grid grid-cols-2 gap-2">
            {CHECKIN_LABELS.map(({ key, label }) => (
              <div key={key} className="text-xs">
                <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
                <div className="font-semibold text-zinc-900 dark:text-white">
                  {String(latestCheckin[key])}/5
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Aún no registras cómo te sientes hoy.
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-950 dark:text-white">Strava</h3>
          {stravaConnected ? (
            <button
              type="button"
              onClick={onSyncStrava}
              disabled={syncingStrava}
              className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50 dark:text-red-400"
            >
              {syncingStrava ? "Sincronizando…" : "Sincronizar"}
            </button>
          ) : (
            <a
              href={`/api/strava/connect?coach=${coachId}`}
              className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400"
            >
              Conectar
            </a>
          )}
        </div>
        {stravaConnected ? (
          recentActivities.length ? (
            <ul className="mt-2 flex flex-col gap-1.5">
              {recentActivities.slice(0, 5).map((a) => {
                const f = formatActivity(a);
                return (
                  <li key={a.id} className="text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{f.date}</span>{" "}
                    · {f.name}
                    {f.detail ? ` · ${f.detail}` : ""}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Conectado, sin actividades recientes todavía.
            </p>
          )
        ) : (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">No conectado todavía.</p>
        )}
      </div>
    </div>
  );
}
