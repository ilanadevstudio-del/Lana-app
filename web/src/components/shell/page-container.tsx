import type { ReactNode } from "react";
import { homeData } from "@/lib/mock/home";
import { MobileHeader } from "./mobile-header";

/** Standard scrolling page: mobile header + centred content column. */
export function PageContainer({ children }: { children: ReactNode }) {
  return (
    <>
      <MobileHeader userName={homeData.user.firstName} />
      <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-4 md:px-8 md:pb-8 md:pt-12">{children}</main>
    </>
  );
}
