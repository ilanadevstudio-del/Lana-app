import { AssistantLayout } from "@/components/assistant/assistant-layout";

export default function Layout({ children }: LayoutProps<"/assistant">) {
  return <AssistantLayout>{children}</AssistantLayout>;
}
