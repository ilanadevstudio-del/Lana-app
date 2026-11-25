import type { Metadata } from "next";
import { NewConversation } from "@/components/assistant/new-conversation";

export const metadata: Metadata = { title: "Assistant" };

export default function AssistantPage() {
  return <NewConversation />;
}
