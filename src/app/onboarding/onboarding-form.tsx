"use client";

import { useActionState, useState } from "react";
import { completeOnboardingAction } from "./actions";
import { COACH_LIST, LEVEL_OPTIONS, SPORT_OPTIONS } from "@/lib/coaches";

export function OnboardingForm({ defaultFullName }: { defaultFullName: string }) {
  const [state, action, pending] = useActionState(completeOnboardingAction, undefined);
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [coach, setCoach] = useState<string>("charly");

  function toggleSport(sport: string) {
    setSelectedSports((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]
    );
  }

  return (
    <form action={action} className="mt-8 flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nombre</label>
        <input
          name="full_name"
          type="text"
          required
          defaultValue={defaultFullName}
          className="h-11 rounded-xl border border-black/10 bg-transparent px-4 text-sm text-zinc-950 outline-none focus:border-red-500 dark:border-white/15 dark:text-white"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Deporte(s) principal(es)
        </label>
        <div className="flex flex-wrap gap-2">
          {SPORT_OPTIONS.map((sport) => (
            <button
              key={sport}
              type="button"
              onClick={() => toggleSport(sport)}
              className={`rounded-full border px-3 py-1.5 text-sm capitalize transition-colors ${
                selectedSports.includes(sport)
                  ? "border-red-600 bg-red-600 text-white"
                  : "border-black/10 text-zinc-700 hover:border-black/20 dark:border-white/15 dark:text-zinc-300"
              }`}
            >
              {sport}
            </button>
          ))}
        </div>
        {selectedSports.map((sport) => (
          <input key={sport} type="hidden" name="sports" value={sport} />
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nivel</label>
        <select
          name="level"
          required
          defaultValue=""
          className="h-11 rounded-xl border border-black/10 bg-transparent px-4 text-sm text-zinc-950 outline-none focus:border-red-500 dark:border-white/15 dark:text-white dark:[color-scheme:dark]"
        >
          <option value="" disabled>
            Selecciona tu nivel
          </option>
          {LEVEL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Horas disponibles por semana
        </label>
        <input
          name="weekly_hours"
          type="number"
          min={1}
          max={40}
          step={0.5}
          required
          placeholder="8"
          className="h-11 rounded-xl border border-black/10 bg-transparent px-4 text-sm text-zinc-950 outline-none focus:border-red-500 dark:border-white/15 dark:text-white"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Elige tu coach
        </label>
        <div className="grid grid-cols-3 gap-2">
          {COACH_LIST.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCoach(c.id)}
              className={`rounded-xl border p-3 text-left transition-colors ${
                coach === c.id
                  ? "border-red-600 bg-red-50 dark:bg-red-500/10"
                  : "border-black/10 dark:border-white/15"
              }`}
            >
              <div className="text-sm font-semibold text-zinc-950 dark:text-white">{c.name}</div>
              <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{c.tagline}</div>
            </button>
          ))}
        </div>
        <input type="hidden" name="coach" value={coach} />
      </div>

      {state?.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-full bg-red-600 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Empezar"}
      </button>
    </form>
  );
}
