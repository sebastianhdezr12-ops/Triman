"use client";

import Link from "next/link";
import { COACH_LIST } from "@/lib/coaches";
import type { CoachId } from "@/lib/supabase/database.types";

export function CoachSwitcher({ activeCoach }: { activeCoach: CoachId }) {
  return (
    <div className="flex gap-1 rounded-full bg-zinc-100 p-1 dark:bg-white/5">
      {COACH_LIST.map((coach) => (
        <Link
          key={coach.id}
          href={`/chat/${coach.id}`}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            activeCoach === coach.id
              ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-800 dark:text-white"
              : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          {coach.name}
        </Link>
      ))}
    </div>
  );
}
