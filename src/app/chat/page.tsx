import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";

export default async function ChatIndexPage() {
  const { profile } = await requireProfile();
  redirect(`/chat/${profile.preferred_coach}`);
}
