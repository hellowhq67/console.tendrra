import { redirect } from "next/navigation";
import { generateId } from "ai";

export default function ChatIndexPage() {
  const newChatId = generateId(16);
  redirect(`/dashboard/chat/${newChatId}`);
}
