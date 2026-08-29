"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error: string } | { info: string } | undefined;

function readCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  return { email, password };
}

export async function loginAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const { email, password } = readCredentials(formData);
  if (!email || !password) {
    return { error: "Ingresa tu email y contraseña." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: "Email o contraseña incorrectos." };
  }

  redirect("/chat");
}

export async function signupAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const { email, password } = readCredentials(formData);
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (!fullName || !email || !password) {
    return { error: "Completa nombre, email y contraseña." };
  }
  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.session) {
    return {
      info: "Cuenta creada. Revisa tu correo para confirmar tu cuenta antes de iniciar sesión.",
    };
  }

  redirect("/onboarding");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
