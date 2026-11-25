import { Suspense } from "react";
import type { Metadata } from "next";
import { ConversationView } from "@/components/assistant/conversation-view";

export const metadata: Metadata = { title: "Conversation" };

export default function ConversationPage({ params }: PageProps<"/assistant/[id]">) {
  return (
    <Suspense>
      <Conversation params={params} />
    </Suspense>
  );
}

async function Conversation({ params }: { params: PageProps<"/assistant/[id]">["params"] }) {
  const { id } = await params;
  return <ConversationView id={id} />;
}
