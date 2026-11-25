import { BottomNav } from "@/components/shell/bottom-nav";
import { Sidebar } from "@/components/shell/sidebar";
import { homeData } from "@/lib/mock/home";

export default function AppLayout({ children }: LayoutProps<"/">) {
  const { firstName } = homeData.user; // replaced by the authenticated user

  return (
    <>
      <Sidebar userName={firstName} />
      {/* Pages own their container: most use <PageContainer>, the assistant is full-height. */}
      <div className="md:pl-72">{children}</div>
      <BottomNav />
    </>
  );
}
