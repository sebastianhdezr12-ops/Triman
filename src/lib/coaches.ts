import type { CoachId } from "@/lib/supabase/database.types";

export interface CoachMeta {
  id: CoachId;
  name: string;
  tagline: string;
  accent: string;
}

export const COACHES: Record<CoachId, CoachMeta> = {
  charly: {
    id: "charly",
    name: "Charly",
    tagline: "Tu amigo que también es coach",
    accent: "#DC2626",
  },
  claudia: {
    id: "claudia",
    name: "Claudia",
    tagline: "Ex-campeona Ironman",
    accent: "#DC2626",
  },
  max: {
    id: "max",
    name: "Max",
    tagline: "Disciplina militar, cero rodeos",
    accent: "#DC2626",
  },
};

export const COACH_LIST = Object.values(COACHES);

export function isCoachId(value: string): value is CoachId {
  return value === "charly" || value === "claudia" || value === "max";
}

export const SPORT_OPTIONS = [
  "running",
  "ciclismo",
  "natación",
  "triatlón",
  "trail running",
  "duatlón",
] as const;

export const LEVEL_OPTIONS = [
  { value: "beginner", label: "Principiante" },
  { value: "intermediate", label: "Intermedio" },
  { value: "advanced", label: "Avanzado" },
  { value: "elite", label: "Elite" },
] as const;
