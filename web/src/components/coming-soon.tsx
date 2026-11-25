import { Orb } from "@/components/orb";

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <Orb size={88} />
      <h1 className="mt-6 text-4xl font-semibold tracking-tight">
        <span className="text-gradient">{title}</span>
      </h1>
      <p className="mt-2 max-w-sm text-muted">{description}</p>
      <p className="glass mt-5 rounded-full px-3.5 py-1.5 text-sm font-medium text-subtle">Coming soon</p>
    </div>
  );
}
