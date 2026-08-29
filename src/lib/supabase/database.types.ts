export type CoachId = "charly" | "claudia" | "max";
export type MessageRole = "user" | "assistant";
export type SportLevel = "beginner" | "intermediate" | "advanced" | "elite";
export type PlanStatus = "active" | "archived";

export interface Profile {
  id: string;
  full_name: string | null;
  sports: string[];
  level: SportLevel | null;
  weekly_hours: number | null;
  injuries_notes: string | null;
  preferred_coach: CoachId;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  coach_id: CoachId;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  coach_id: CoachId;
  role: MessageRole;
  content: string;
  image_url: string | null;
  created_at: string;
}

export interface TrainingPlan {
  id: string;
  user_id: string;
  coach_id: CoachId;
  title: string;
  status: PlanStatus;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrainingSession {
  id: string;
  plan_id: string;
  user_id: string;
  session_date: string;
  sport: string;
  session_type: string;
  duration_minutes: number | null;
  description: string | null;
  rationale: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReadinessCheckin {
  id: string;
  user_id: string;
  energy: number;
  sleep_quality: number;
  muscle_soreness: number;
  stress: number;
  notes: string | null;
  created_at: string;
}

export interface StravaConnection {
  user_id: string;
  strava_athlete_id: number;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  scope: string | null;
  created_at: string;
  updated_at: string;
}

export interface StravaActivity {
  id: number;
  user_id: string;
  name: string | null;
  sport_type: string | null;
  start_date: string | null;
  moving_time_seconds: number | null;
  distance_meters: number | null;
  average_speed: number | null;
  average_heartrate: number | null;
  average_watts: number | null;
  raw: Record<string, unknown> | null;
  created_at: string;
}

// NOTE: every Row/Insert/Update below is a plain inline object literal
// (matching Supabase's own `supabase gen types` output), not a reference to
// the named interfaces above and not derived via `Partial<Row>`. Both
// `Partial<X>` and a named interface reference for `Row` break generic
// inference in @supabase/postgrest-js's `update()`/`insert()`
// (`RejectExcessProperties`), collapsing the accepted value type to `never`.

export interface Database {
  __InternalSupabase: {
    PostgrestVersion: "13";
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          sports: string[];
          level: SportLevel | null;
          weekly_hours: number | null;
          injuries_notes: string | null;
          preferred_coach: CoachId;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          sports?: string[];
          level?: SportLevel | null;
          weekly_hours?: number | null;
          injuries_notes?: string | null;
          preferred_coach?: CoachId;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          sports?: string[];
          level?: SportLevel | null;
          weekly_hours?: number | null;
          injuries_notes?: string | null;
          preferred_coach?: CoachId;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          coach_id: CoachId;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          coach_id: CoachId;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          coach_id?: CoachId;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          coach_id: CoachId;
          role: MessageRole;
          content: string;
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          coach_id: CoachId;
          role: MessageRole;
          content: string;
          image_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          user_id?: string;
          coach_id?: CoachId;
          role?: MessageRole;
          content?: string;
          image_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      training_plans: {
        Row: {
          id: string;
          user_id: string;
          coach_id: CoachId;
          title: string;
          status: PlanStatus;
          start_date: string | null;
          end_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          coach_id: CoachId;
          title: string;
          status?: PlanStatus;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          coach_id?: CoachId;
          title?: string;
          status?: PlanStatus;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      training_sessions: {
        Row: {
          id: string;
          plan_id: string;
          user_id: string;
          session_date: string;
          sport: string;
          session_type: string;
          duration_minutes: number | null;
          description: string | null;
          rationale: string | null;
          completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          plan_id: string;
          user_id: string;
          session_date: string;
          sport: string;
          session_type: string;
          duration_minutes?: number | null;
          description?: string | null;
          rationale?: string | null;
          completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          plan_id?: string;
          user_id?: string;
          session_date?: string;
          sport?: string;
          session_type?: string;
          duration_minutes?: number | null;
          description?: string | null;
          rationale?: string | null;
          completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      readiness_checkins: {
        Row: {
          id: string;
          user_id: string;
          energy: number;
          sleep_quality: number;
          muscle_soreness: number;
          stress: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          energy: number;
          sleep_quality: number;
          muscle_soreness: number;
          stress: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          energy?: number;
          sleep_quality?: number;
          muscle_soreness?: number;
          stress?: number;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      strava_connections: {
        Row: {
          user_id: string;
          strava_athlete_id: number;
          access_token: string;
          refresh_token: string;
          expires_at: string;
          scope: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          strava_athlete_id: number;
          access_token: string;
          refresh_token: string;
          expires_at: string;
          scope?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          strava_athlete_id?: number;
          access_token?: string;
          refresh_token?: string;
          expires_at?: string;
          scope?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      strava_activities: {
        Row: {
          id: number;
          user_id: string;
          name: string | null;
          sport_type: string | null;
          start_date: string | null;
          moving_time_seconds: number | null;
          distance_meters: number | null;
          average_speed: number | null;
          average_heartrate: number | null;
          average_watts: number | null;
          raw: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id: number;
          user_id: string;
          name?: string | null;
          sport_type?: string | null;
          start_date?: string | null;
          moving_time_seconds?: number | null;
          distance_meters?: number | null;
          average_speed?: number | null;
          average_heartrate?: number | null;
          average_watts?: number | null;
          raw?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          name?: string | null;
          sport_type?: string | null;
          start_date?: string | null;
          moving_time_seconds?: number | null;
          distance_meters?: number | null;
          average_speed?: number | null;
          average_heartrate?: number | null;
          average_watts?: number | null;
          raw?: Record<string, unknown> | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
  };
}
