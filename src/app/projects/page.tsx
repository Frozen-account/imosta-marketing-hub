import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { getProjectDocs } from "@/lib/data";

export const metadata: Metadata = { title: "Проекты · IMOSTA Command Center" };

// Pages with a custom UI under src/app/projects/<slug>/ rather than a projects/*.md file.
const CUSTOM_PAGES = [
  { slug: "english-expansion", title: "English-speaking expansion", summary: "Strategy & SOP: market pivot, Tandem team profile, hard skills, monthly SLA" },
];

export default function ProjectsPage() {
  const docs = [...CUSTOM_PAGES, ...getProjectDocs()];
  return (
    <>
      <PageHeader title="Проекты" subtitle="Документация из папки projects/ в репозитории" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {docs.map((d) => (
          <Link
            key={d.slug}
            href={`/projects/${d.slug}`}
            className="group flex flex-col rounded-xl border border-line bg-surface p-5 shadow-sm transition-all duration-200 hover:border-brand hover:shadow-md"
          >
            <FileText className="mb-3 size-5 text-brand" aria-hidden />
            <h2 className="font-bold">{d.title}</h2>
            {d.summary && <p className="mt-1 flex-1 text-sm text-ink-muted">{d.summary}</p>}
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-ink-subtle group-hover:text-brand">
              /projects/{d.slug} <ArrowRight className="size-3.5" aria-hidden />
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
