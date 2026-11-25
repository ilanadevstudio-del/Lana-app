/** Fixed, slowly drifting pastel blobs behind the whole app. Colours come from theme tokens. */
export function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -left-[20%] -top-[25%] h-[75vmax] w-[75vmax] rounded-full blur-[100px]"
        style={{
          background: "radial-gradient(circle, var(--blob-1), transparent 65%)",
          animation: "drift 26s ease-in-out infinite",
        }}
      />
      <div
        className="absolute -right-[25%] top-[10%] h-[70vmax] w-[70vmax] rounded-full blur-[100px]"
        style={{
          background: "radial-gradient(circle, var(--blob-2), transparent 65%)",
          animation: "drift 32s ease-in-out infinite reverse",
        }}
      />
      <div
        className="absolute -bottom-[35%] left-[15%] h-[65vmax] w-[65vmax] rounded-full blur-[100px]"
        style={{
          background: "radial-gradient(circle, var(--blob-3), transparent 65%)",
          animation: "drift 38s ease-in-out infinite",
        }}
      />
    </div>
  );
}
