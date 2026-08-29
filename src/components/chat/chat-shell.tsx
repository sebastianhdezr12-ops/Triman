"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { logoutAction } from "@/app/(auth)/actions";
import { createClient } from "@/lib/supabase/client";
import { COACHES } from "@/lib/coaches";
import { CoachSwitcher } from "./coach-switcher";
import { SidePanel } from "./side-panel";
import { MessageBubble } from "./message-bubble";
import { CheckinModal } from "./checkin-modal";
import type {
  CoachId,
  Message,
  Profile,
  ReadinessCheckin,
  TrainingPlan,
  TrainingSession,
} from "@/lib/supabase/database.types";

export function ChatShell({
  coachId,
  profile,
  initialMessages,
  activePlan,
  activePlanSessions,
  latestCheckin,
}: {
  coachId: CoachId;
  profile: Profile;
  initialMessages: Message[];
  activePlan: TrainingPlan | null;
  activePlanSessions: TrainingSession[];
  latestCheckin: ReadinessCheckin | null;
}) {
  const coach = COACHES[coachId];
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<{
    path: string;
    previewUrl: string;
  } | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Solo se permiten imágenes.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("La imagen es muy pesada (máx. 8MB).");
      return;
    }

    setError(null);
    setUploadingImage(true);
    try {
      const supabase = createClient();
      const path = `${profile.id}/${coachId}/${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("chat-photos")
        .upload(path, file);

      if (uploadError) throw uploadError;
      setPendingImage({ path, previewUrl: URL.createObjectURL(file) });
    } catch {
      setError("No se pudo subir la imagen.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if ((!content && !pendingImage) || sending) return;

    setError(null);
    setInput("");
    setSending(true);
    const imageToSend = pendingImage;
    setPendingImage(null);

    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticMessage: Message = {
      id: optimisticId,
      conversation_id: "",
      user_id: profile.id,
      coach_id: coachId,
      role: "user",
      content,
      image_url: imageToSend?.previewUrl ?? null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    const assistantId = `streaming-${Date.now()}`;
    const assistantMessage: Message = {
      id: assistantId,
      conversation_id: "",
      user_id: profile.id,
      coach_id: coachId,
      role: "assistant",
      content: "",
      image_url: null,
      created_at: new Date().toISOString(),
    };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coachId, content, imagePath: imageToSend?.path }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Falló el envío.");
      }

      setMessages((prev) => [...prev, assistantMessage]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: m.content + chunk } : m
          )
        );
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId && m.id !== assistantId));
      setInput(content);
      if (imageToSend) setPendingImage(imageToSend);
      setError("No se pudo enviar el mensaje. Intenta de nuevo.");
    } finally {
      setSending(false);
    }
  }

  async function handleLogout() {
    await logoutAction();
  }

  function handleCheckinSaved() {
    setCheckinOpen(false);
    router.refresh();
  }

  return (
    <div className="flex h-dvh flex-col bg-white dark:bg-black">
      <header className="flex items-center justify-between gap-3 border-b border-black/5 px-4 py-3 dark:border-white/10">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-600 text-sm font-semibold text-white"
            aria-hidden
          >
            {coach.name[0]}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-950 dark:text-white">
              {coach.name}
            </p>
            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{coach.tagline}</p>
          </div>
        </div>

        <div className="hidden sm:block">
          <CoachSwitcher activeCoach={coachId} />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPanelOpen((v) => !v)}
            className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:border-white/15 dark:text-zinc-300 lg:hidden"
          >
            Plan
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:border-white/15 dark:text-zinc-300"
          >
            Salir
          </button>
        </div>
      </header>

      <div className="block border-b border-black/5 px-4 py-2 dark:border-white/10 sm:hidden">
        <CoachSwitcher activeCoach={coachId} />
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="mx-auto flex max-w-2xl flex-col gap-3">
              {messages.length === 0 && (
                <p className="text-center text-sm text-zinc-400 dark:text-zinc-500">
                  Escríbele a {coach.name} para empezar.
                </p>
              )}
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              <div ref={bottomRef} />
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="border-t border-black/5 px-4 py-3 dark:border-white/10"
          >
            {pendingImage && (
              <div className="mx-auto mb-2 flex max-w-2xl items-center gap-2">
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pendingImage.previewUrl}
                    alt="Foto a enviar"
                    className="h-14 w-14 rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setPendingImage(null)}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-xs text-white"
                    aria-label="Quitar imagen"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
            <div className="mx-auto flex max-w-2xl items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage || sending}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/10 text-zinc-500 transition-colors hover:text-zinc-900 disabled:opacity-50 dark:border-white/15 dark:text-zinc-400 dark:hover:text-white"
                aria-label="Adjuntar foto"
              >
                {uploadingImage ? "…" : "📷"}
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Escríbele a ${coach.name}…`}
                className="h-11 flex-1 rounded-full border border-black/10 bg-transparent px-4 text-sm text-zinc-950 outline-none focus:border-red-500 dark:border-white/15 dark:text-white"
              />
              <button
                type="submit"
                disabled={sending || (!input.trim() && !pendingImage)}
                className="h-11 shrink-0 rounded-full bg-red-600 px-5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                Enviar
              </button>
            </div>
            {error && (
              <p className="mx-auto mt-2 max-w-2xl text-xs text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
          </form>
        </div>

        <aside className="hidden w-80 shrink-0 overflow-y-auto border-l border-black/5 dark:border-white/10 lg:block">
          <SidePanel
            activePlan={activePlan}
            activePlanSessions={activePlanSessions}
            latestCheckin={latestCheckin}
            onOpenCheckin={() => setCheckinOpen(true)}
          />
        </aside>

        {panelOpen && (
          <div className="fixed inset-0 z-20 flex lg:hidden">
            <div
              className="flex-1 bg-black/40"
              onClick={() => setPanelOpen(false)}
              aria-hidden
            />
            <aside className="w-80 max-w-[85vw] overflow-y-auto bg-white dark:bg-black">
              <SidePanel
                activePlan={activePlan}
                activePlanSessions={activePlanSessions}
                latestCheckin={latestCheckin}
                onOpenCheckin={() => setCheckinOpen(true)}
              />
            </aside>
          </div>
        )}
      </div>

      {checkinOpen && (
        <CheckinModal onClose={() => setCheckinOpen(false)} onSaved={handleCheckinSaved} />
      )}
    </div>
  );
}
