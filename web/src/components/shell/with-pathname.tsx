"use client";

import { Suspense, type ReactNode } from "react";
import { usePathname } from "next/navigation";

type Render = (pathname: string | null) => ReactNode;

/**
 * Renders `children(pathname)`. Under Cache Components, the pathname of a route with unknown
 * dynamic params isn't available during prerendering, so the fallback renders the same UI with
 * no active item and the real pathname streams in. This keeps the shell prerendered on every route.
 */
export function WithPathname({ children }: { children: Render }) {
  return (
    <Suspense fallback={children(null)}>
      <Live render={children} />
    </Suspense>
  );
}

function Live({ render }: { render: Render }) {
  return render(usePathname());
}
