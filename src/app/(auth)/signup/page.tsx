"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signupAction } from "../actions";
import { GoogleButton } from "@/components/auth/google-button";

export default function SignupPage() {
  const [state, action, pending] = useActionState(signupAction, undefined);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-white px-6 dark:bg-black">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
          Crea tu cuenta
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Empieza a entrenar con IA en minutos.
        </p>

        <form action={action} className="mt-8 flex flex-col gap-3">
          <input
            name="full_name"
            type="text"
            required
            placeholder="Nombre"
            autoComplete="name"
            className="h-11 rounded-xl border border-black/10 bg-transparent px-4 text-sm text-zinc-950 outline-none focus:border-red-500 dark:border-white/15 dark:text-white"
          />
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            autoComplete="email"
            className="h-11 rounded-xl border border-black/10 bg-transparent px-4 text-sm text-zinc-950 outline-none focus:border-red-500 dark:border-white/15 dark:text-white"
          />
          <input
            name="password"
            type="password"
            required
            placeholder="Contraseña (mín. 8 caracteres)"
            autoComplete="new-password"
            className="h-11 rounded-xl border border-black/10 bg-transparent px-4 text-sm text-zinc-950 outline-none focus:border-red-500 dark:border-white/15 dark:text-white"
          />

          {state && "error" in state && (
            <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
          )}
          {state && "info" in state && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">{state.info}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-1 h-11 rounded-full bg-red-600 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
          >
            {pending ? "Creando cuenta…" : "Crear cuenta"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-zinc-400">
          <span className="h-px flex-1 bg-black/10 dark:bg-white/10" />
          o
          <span className="h-px flex-1 bg-black/10 dark:bg-white/10" />
        </div>

        <GoogleButton />

        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-red-600 dark:text-red-400">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
