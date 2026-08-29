import type { Message } from "@/lib/supabase/database.types";

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-red-600 text-white"
            : "bg-zinc-100 text-zinc-900 dark:bg-white/10 dark:text-zinc-100"
        }`}
      >
        {message.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={message.image_url}
            alt="Foto adjunta"
            className="mb-2 max-h-64 rounded-xl object-cover"
          />
        )}
        {message.content}
      </div>
    </div>
  );
}
