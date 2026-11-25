/** Static, lightweight orb for message avatars. The live <Orb> is reserved for headers and hero spots. */
export function OrbAvatar({ size = 28 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="relative block shrink-0 overflow-hidden rounded-full"
      style={{ width: size, height: size }}
    >
      <span
        className="absolute -inset-1/3 blur-[4px]"
        style={{
          background: "conic-gradient(from 40deg, #a5b4fc, #f0abfc, #c4b5fd, #7dd3fc, #f9a8d4, #a5b4fc)",
        }}
      />
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle at 32% 26%, rgb(255 255 255 / 0.9), transparent 42%)",
          boxShadow: "inset -3px -4px 8px rgb(88 56 180 / 0.3)",
        }}
      />
    </span>
  );
}
