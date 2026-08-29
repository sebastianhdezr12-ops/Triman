"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "../actions";
import { GoogleButton } from "@/components/auth/google-button";

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, undefined);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-white px-6 dark:bg-black">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
          Bienvenido de vuelta
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Inicia sesión para hablar con tu coach.
        </p>

        <form action={action} className="mt-8 flex flex-col gap-3">
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
            placeholder="Contraseña"
            autoComplete="current-password"
            className="h-11 rounded-xl border border-black/10 bg-transparent px-4 text-sm text-zinc-950 outline-none focus:border-red-500 dark:border-white/15 dark:text-white"
          />

          {state && "error" in state && (
            <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-1 h-11 rounded-full bg-red-600 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
          >
            {pending ? "Entrando…" : "Iniciar sesión"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-zinc-400">
          <span className="h-px flex-1 bg-black/10 dark:bg-white/10" />
          o
          <span className="h-px flex-1 bg-black/10 dark:bg-white/10" />
        </div>

        <GoogleButton />

        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          ¿No tienes cuenta?{" "}
          <Link href="/signup" className="font-medium text-red-600 dark:text-red-400">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}
