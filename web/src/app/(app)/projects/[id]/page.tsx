import { Suspense } from "react";
import type { Metadata } from "next";
import { ProjectDetail } from "@/components/projects/project-detail";

export const metadata: Metadata = { title: "Project" };

export default function ProjectPage({ params }: PageProps<"/projects/[id]">) {
  return (
    <Suspense>
      <Project params={params} />
    </Suspense>
  );
}

async function Project({ params }: { params: PageProps<"/projects/[id]">["params"] }) {
  const { id } = await params;
  return <ProjectDetail id={id} />;
}
