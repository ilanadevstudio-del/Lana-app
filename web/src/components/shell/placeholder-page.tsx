import { Construction } from "lucide-react";
import { EmptyState } from "@/components/ui/feedback";
import { Page, PageHeader } from "./page";

/** Temporary stand-in for sections still being rebuilt on the new design system. */
export function PlaceholderPage({ title }: { title: string }) {
  return (
    <Page>
      <PageHeader title={title} />
      <div className="flex flex-1 items-center justify-center">
        <EmptyState icon={<Construction />} title={`${title} is being rebuilt`} description="This section moves to the new design next." />
      </div>
    </Page>
  );
}
