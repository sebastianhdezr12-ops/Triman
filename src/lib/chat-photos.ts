import "server-only";
import type { createClient } from "@/lib/supabase/server";
import type { Message } from "@/lib/supabase/database.types";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export const CHAT_PHOTOS_BUCKET = "chat-photos";

export async function signChatPhotoUrl(
  supabase: Supabase,
  path: string,
  expiresInSeconds: number
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(CHAT_PHOTOS_BUCKET)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data) return null;
  return data.signedUrl;
}

/**
 * Returns a copy of `messages` where any `image_url` (a storage path) is
 * replaced with a freshly signed, browser-viewable URL. Used to render the
 * message list — the private bucket means stored paths aren't directly
 * loadable in an <img> tag.
 */
export async function withSignedImageUrls(
  supabase: Supabase,
  messages: Message[],
  expiresInSeconds = 3600
): Promise<Message[]> {
  return Promise.all(
    messages.map(async (m) => {
      if (!m.image_url) return m;
      const signedUrl = await signChatPhotoUrl(supabase, m.image_url, expiresInSeconds);
      return signedUrl ? { ...m, image_url: signedUrl } : m;
    })
  );
}
