export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <span
      aria-hidden
      className="bg-brand grid shrink-0 place-items-center rounded-full font-semibold text-white shadow-[0_6px_20px_-6px_var(--accent)] ring-2 ring-white/70 dark:ring-white/10"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
