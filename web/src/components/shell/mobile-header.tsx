import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { ThemeToggle } from "@/components/theme-toggle";

export function MobileHeader({ userName }: { userName: string }) {
  return (
    <header className="flex items-center justify-between px-4 pt-4 md:hidden">
      <Link href="/settings" aria-label="Account settings">
        <Avatar name={userName} size={42} />
      </Link>
      <ThemeToggle />
    </header>
  );
}
