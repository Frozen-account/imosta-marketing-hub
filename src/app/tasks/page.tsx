import type { Metadata } from "next";
import { PageHeader } from "@/components/app-shell";
import { KanbanBoard } from "@/components/kanban-board";

export const metadata: Metadata = { title: "Задачи · IMOSTA Command Center" };

export default function TasksPage() {
  return (
    <>
      <PageHeader title="Задачи" subtitle="Бэклог и активные задачи отдела: Claude, Gemini и команда. Изменения сохраняются в этом браузере." />
      <KanbanBoard />
    </>
  );
}
