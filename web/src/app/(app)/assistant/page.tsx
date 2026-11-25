import { AssistantView } from "@/components/assistant/assistant-view";
import { homeData } from "@/lib/mock/home";

export default function AssistantPage() {
  return <AssistantView userName={homeData.user.firstName} />;
}
