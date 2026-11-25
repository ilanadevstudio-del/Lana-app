"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { DotsThreeOutlineIcon, XIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { Orb } from "@/components/orb";
import { NAV_ITEMS, isActive, type NavItem } from "./nav-items";

const byHref = (href: string) => NAV_ITEMS.find((i) => i.href === href)!;

const LEFT = [byHref("/"), byHref("/tasks")];
const RIGHT = [byHref("/calendar")];
const MORE = ["/integrations", "/memory", "/activity", "/settings"].map(byHref);

export function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = MORE.some((i) => isActive(pathname, i.href));
  const assistantActive = isActive(pathname, "/assistant");

  return (
    <>
      <nav
        aria-label="Primary"
        className="glass-strong fixed inset-x-3 bottom-3 z-40 flex h-16 items-center justify-around rounded-[26px] px-2 pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {LEFT.map((item) => (
          <Tab key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}

        <Link
          href="/assistant"
          aria-label="Assistant"
          aria-current={assistantActive ? "page" : undefined}
          className="-mt-8 rounded-full p-1.5 transition-transform active:scale-95"
        >
          <Orb size={54} state={assistantActive ? "listening" : "idle"} />
        </Link>

        {RIGHT.map((item) => (
          <Tab key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}

        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-label="More"
          aria-expanded={moreOpen}
          className={`relative grid h-12 w-14 place-items-center rounded-2xl ${moreActive ? "text-accent" : "text-muted"}`}
        >
          {moreActive && <ActivePill />}
          <DotsThreeOutlineIcon size={22} weight={moreActive ? "duotone" : "regular"} className="relative" />
        </button>
      </nav>

      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-label="More"
              className="glass-strong fixed inset-x-3 bottom-3 z-50 rounded-[28px] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:hidden"
              initial={{ y: "110%" }}
              animate={{ y: 0 }}
              exit={{ y: "110%" }}
              transition={{ type: "spring", stiffness: 380, damping: 34 }}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <p className="font-semibold">More</p>
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  aria-label="Close"
                  className="glass grid size-9 place-items-center rounded-full"
                >
                  <XIcon size={16} weight="bold" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {MORE.map(({ href, label, icon: Glyph }, i) => {
                  const active = isActive(pathname, href);
                  return (
                    <motion.div
                      key={href}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 + i * 0.04 }}
                    >
                      <Link
                        href={href}
                        onClick={() => setMoreOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={`glass flex items-center gap-3 rounded-2xl p-3.5 font-medium ${active ? "text-accent" : ""}`}
                      >
                        <Glyph size={22} weight="duotone" className="text-accent" />
                        {label}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function Tab({ item, active }: { item: NavItem; active: boolean }) {
  const { href, label, icon: Glyph } = item;
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={`relative grid h-12 w-14 place-items-center rounded-2xl transition-colors ${
        active ? "text-accent" : "text-muted"
      }`}
    >
      {active && <ActivePill />}
      <motion.span whileTap={{ scale: 0.85 }} className="relative">
        <Glyph size={22} weight={active ? "duotone" : "regular"} />
      </motion.span>
    </Link>
  );
}

function ActivePill() {
  return (
    <motion.span
      layoutId="bottom-nav-active"
      className="absolute inset-0 rounded-2xl bg-accent-soft"
      transition={{ type: "spring", stiffness: 420, damping: 34 }}
    />
  );
}
