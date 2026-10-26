"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, FileText, Film, Images, Smartphone } from "lucide-react";
import { contentPlan } from "@/lib/mock-data";
import type { ContentFormat, ContentState } from "@/lib/types";

const WEEKDAYS = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];

const FORMAT: Record<ContentFormat, { icon: typeof Film; cls: string }> = {
  Reels: { icon: Film, cls: "border-l-brand" },
  Blog: { icon: FileText, cls: "border-l-ink" },
  Stories: { icon: Smartphone, cls: "border-l-amber-500" },
  Carousel: { icon: Images, cls: "border-l-blue-600" },
};

const STATE: Record<ContentState, { label: string; cls: string }> = {
  idea: { label: "Идея", cls: "bg-muted text-ink-subtle" },
  draft: { label: "Черновик", cls: "bg-amber-50 text-amber-800" },
  ready: { label: "Готово", cls: "bg-emerald-50 text-emerald-800" },
  published: { label: "Опубликовано", cls: "bg-ink text-white" },
};

function mondayOf(d: Date) {
  const m = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
  return m;
}

export function ContentCalendar() {
  // The week is resolved in the browser so prerendering never depends on the build date.
  const [monday, setMonday] = useState<Date | null>(null);
  const [today, setToday] = useState<string>("");

  useEffect(() => {
    const now = new Date();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only date
    setMonday(mondayOf(now));
    setToday(now.toDateString());
  }, []);

  const shiftWeek = (weeks: number) =>
    setMonday((m) => (m ? new Date(m.getFullYear(), m.getMonth(), m.getDate() + weeks * 7) : m));

  const days = WEEKDAYS.map((name, i) => {
    const date = monday ? new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i) : null;
    return { name, i, date };
  });
  const fmt = (d: Date) => d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center rounded-lg border border-line bg-surface shadow-sm">
          <button onClick={() => shiftWeek(-1)} aria-label="Предыдущая неделя" className="p-2 text-ink-muted hover:text-brand"><ChevronLeft className="size-4" /></button>
          <span className="min-w-44 px-2 text-center text-sm font-semibold tabular-nums">
            {days[0].date && days[6].date ? `${fmt(days[0].date)} — ${fmt(days[6].date)}` : "…"}
          </span>
          <button onClick={() => shiftWeek(1)} aria-label="Следующая неделя" className="p-2 text-ink-muted hover:text-brand"><ChevronRight className="size-4" /></button>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-ink-muted">
          {(Object.keys(FORMAT) as ContentFormat[]).map((f) => {
            const Icon = FORMAT[f].icon;
            return <span key={f} className="inline-flex items-center gap-1"><Icon className="size-3.5" aria-hidden />{f}</span>;
          })}
        </div>
        <span className="ml-auto rounded-lg bg-brand-soft px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-brand">Шаблон недели · демо</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {days.map(({ name, i, date }) => {
          const items = contentPlan.filter((c) => c.weekday === i).sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
          const isToday = date?.toDateString() === today;
          return (
            <section key={name} className={`flex min-h-40 flex-col rounded-xl border bg-surface p-3 shadow-sm ${isToday ? "border-brand ring-1 ring-brand" : "border-line"}`}>
              <header className="mb-3 flex items-baseline justify-between">
                <h2 className={`text-sm font-bold ${i >= 5 ? "text-ink-muted" : ""}`}>{name}</h2>
                {date && <span className={`text-xs tabular-nums ${isToday ? "font-bold text-brand" : "text-ink-muted"}`}>{fmt(date)}</span>}
              </header>
              <div className="flex flex-col gap-2">
                {items.map((c) => {
                  const Icon = FORMAT[c.format].icon;
                  return (
                    <article key={c.id} className={`rounded-lg border border-line border-l-4 bg-canvas p-2.5 transition-all duration-200 hover:shadow-md ${FORMAT[c.format].cls}`}>
                      <div className="mb-1 flex items-center gap-1.5 text-xs text-ink-muted">
                        <Icon className="size-3.5" aria-hidden />
                        <span className="font-semibold">{c.format}</span>
                        {c.time && <span className="ml-auto tabular-nums">{c.time}</span>}
                      </div>
                      <h3 className="text-sm font-semibold leading-snug">{c.title}</h3>
                      <p className="mt-1 text-xs text-ink-muted">{c.channel} · {c.owner}</p>
                      <span className={`mt-2 inline-block rounded px-1.5 py-0.5 text-[11px] font-semibold ${STATE[c.state].cls}`}>{STATE[c.state].label}</span>
                    </article>
                  );
                })}
                {items.length === 0 && <p className="py-4 text-center text-xs text-ink-muted">Нет публикаций</p>}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
