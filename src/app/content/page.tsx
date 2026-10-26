import type { Metadata } from "next";
import { PageHeader } from "@/components/app-shell";
import { ContentCalendar } from "@/components/content-calendar";

export const metadata: Metadata = { title: "Контент-план · IMOSTA Command Center" };

export default function ContentPage() {
  return (
    <>
      <PageHeader title="Контент-план" subtitle="Reels, сторис и статьи блога на неделю — понедельник–воскресенье" />
      <ContentCalendar />
    </>
  );
}
