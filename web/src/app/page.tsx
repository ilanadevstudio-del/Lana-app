import { Sparkle } from "./_components/sparkle";

// Placeholder — verifies fonts, tokens, icons and motion are wired up.
// Replaced when we design the Home screen.
export default function Page() {
  return (
    <main className="flex flex-1 items-center justify-center px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <Sparkle />
        <h1 className="font-serif text-5xl tracking-tight">
          Less managing. <em>More doing.</em>
        </h1>
        <p className="text-muted">Lana — scaffold ready.</p>
      </div>
    </main>
  );
}
