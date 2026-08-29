"use client";

import { useState } from "react";

const SCALES: { key: "energy" | "sleepQuality" | "muscleSoreness" | "stress"; label: string; lowLabel: string; highLabel: string }[] = [
  { key: "energy", label: "Energía", lowLabel: "Agotado", highLabel: "A tope" },
  { key: "sleepQuality", label: "Calidad de sueño", lowLabel: "Muy mal", highLabel: "Excelente" },
  { key: "muscleSoreness", label: "Dolor muscular", lowLabel: "Nada", highLabel: "Mucho" },
  { key: "stress", label: "Estrés", lowLabel: "Nada", highLabel: "Mucho" },
];

type Scores = Record<(typeof SCALES)[number]["key"], number>;

export function CheckinModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [scores, setScores] = useState<Scores>({
    energy: 3,
    sleepQuality: 3,
    muscleSoreness: 3,
    stress: 3,
  });
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...scores, notes: notes.trim() || undefined }),
      });

      if (!res.ok) throw new Error("Falló el guardado.");

      onSaved();
    } catch {
      setError("No se pudo guardar el check-in. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-sm rounded-t-3xl bg-white p-6 dark:bg-zinc-950 sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">
            ¿Cómo te sientes hoy?
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-5">
          {SCALES.map(({ key, label, lowLabel, highLabel }) => (
            <div key={key}>
              <div className="flex items-baseline justify-between">
                <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {label}
                </label>
                <span className="text-xs text-zinc-400">{scores[key]}/5</span>
              </div>
              <div className="mt-2 flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setScores((prev) => ({ ...prev, [key]: value }))}
                    className={`h-9 flex-1 rounded-lg text-sm font-medium transition-colors ${
                      scores[key] === value
                        ? "bg-red-600 text-white"
                        : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-white/10 dark:text-zinc-400 dark:hover:bg-white/15"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <div className="mt-1 flex justify-between text-[11px] text-zinc-400">
                <span>{lowLabel}</span>
                <span>{highLabel}</span>
              </div>
            </div>
          ))}

          <div>
            <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Algo más que quieras contarle a tu coach (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Ej. me molesta un poco la rodilla derecha"
              className="mt-2 w-full resize-none rounded-xl border border-black/10 bg-transparent p-3 text-sm text-zinc-950 outline-none focus:border-red-500 dark:border-white/15 dark:text-white"
            />
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="h-11 rounded-full bg-red-600 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Guardar check-in"}
          </button>
        </form>
      </div>
    </div>
  );
}
