import { BottomNav } from "@/components/shell/bottom-nav";
import { MobileHeader } from "@/components/shell/mobile-header";
import { Sidebar } from "@/components/shell/sidebar";
import { homeData } from "@/lib/mock/home";

export default function AppLayout({ children }: LayoutProps<"/">) {
  const { firstName } = homeData.user; // replaced by the authenticated user

  return (
    <>
      <Sidebar userName={firstName} />
      <div className="md:pl-72">
        <MobileHeader userName={firstName} />
        <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-4 md:px-8 md:pb-8 md:pt-12">{children}</main>
      </div>
      <BottomNav />
    </>
  );
}
