"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarPlus, ChevronLeft, ChevronRight, ClipboardCopy, Clock, ExternalLink, Inbox, PanelRightClose,
  PanelRightOpen, RotateCcw, X,
} from "lucide-react";
import { PRIORITY } from "@/components/kanban-board";
import type { Schedule, Task } from "@/lib/types";

const START_HOUR = 8;
const END_HOUR = 20;
const HOUR_PX = 64;
const STORAGE_KEY = "imosta-hub:schedule:v1";
const TIME_OPTIONS = Array.from({ length: (END_HOUR - START_HOUR) * 2 }, (_, i) => {
  const m = START_HOUR * 60 + i * 30;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
});
const DURATIONS = [30, 60, 90, 120, 180, 240];

const INITIATIVE_LABEL: Record<string, string> = {
  "/projects/english-expansion": "English Expansion",
  "/projects/video-education": "Video Education",
};

type Overrides = Record<string, Schedule | null>; // null = unscheduled in this browser

// --- date helpers (local time) ---
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const mondayOf = (d: Date) => addDays(d, -((d.getDay() + 6) % 7));
const toMinutes = (hhmm: string) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
const fmtTime = (mins: number) => `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
const fmtShort = (d: Date) => d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });

function loadOverrides(): Overrides {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const data: unknown = raw ? JSON.parse(raw) : {};
    return data && typeof data === "object" && !Array.isArray(data) ? (data as Overrides) : {};
  } catch {
    return {};
  }
}

function saveOverrides(o: Overrides) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(o));
  } catch {}
}

function applyOverrides(tasks: Task[], overrides: Overrides): Task[] {
  return tasks.map((t) => {
    if (!(t.id in overrides)) return t;
    const o = overrides[t.id];
    return { ...t, scheduledDate: o?.scheduledDate, scheduledTime: o?.scheduledTime, durationMinutes: o?.durationMinutes };
  });
}

interface Block { task: Task; start: number; end: number; lane: number; lanes: number }

// Side-by-side lanes for overlapping blocks within one day.
function layoutDay(tasks: Task[]): Block[] {
  const items = tasks
    .map((task) => {
      const start = toMinutes(task.scheduledTime!);
      return { task, start, end: start + (task.durationMinutes ?? 60), lane: 0, lanes: 1 };
    })
    .sort((a, b) => a.start - b.start || b.end - a.end);
  let cluster: Block[] = [];
  let laneEnds: number[] = [];
  let clusterEnd = -1;
  const flush = () => { cluster.forEach((b) => (b.lanes = laneEnds.length)); cluster = []; laneEnds = []; };
  for (const b of items) {
    if (b.start >= clusterEnd) flush();
    const lane = laneEnds.findIndex((end) => end <= b.start);
    b.lane = lane === -1 ? laneEnds.length : lane;
    laneEnds[b.lane] = b.end;
    cluster.push(b);
    clusterEnd = Math.max(clusterEnd, b.end);
  }
  flush();
  return items;
}

export function WeeklySchedule({ tasks }: { tasks: Task[] }) {
  const [overrides, setOverrides] = useState<Overrides>({});
  const [loaded, setLoaded] = useState(false);
  const [anchor, setAnchor] = useState<Date | null>(null); // selected day; the week is derived from it
  const [now, setNow] = useState<Date | null>(null);
  const [view, setView] = useState<"week" | "day">("week");
  const [editing, setEditing] = useState<Task | null>(null);
  const [trayOpen, setTrayOpen] = useState(true);
  const [allPriorities, setAllPriorities] = useState(false);
  const [copied, setCopied] = useState(false);

  // Dates and browser storage are client-only, so prerendering never depends on build time.
  useEffect(() => {
    const d = new Date();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client init
    setNow(d);
    setAnchor(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
    setOverrides(loadOverrides());
    setLoaded(true);
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (loaded) saveOverrides(overrides);
  }, [overrides, loaded]);

  const merged = useMemo(() => applyOverrides(tasks, overrides), [tasks, overrides]);
  const days = anchor ? (view === "week" ? Array.from({ length: 7 }, (_, i) => addDays(mondayOf(anchor), i)) : [anchor]) : [];
  const todayIso = now ? iso(now) : "";
  const unscheduled = merged.filter((t) => !t.scheduledDate && t.status !== "done" && (allPriorities || t.priority === "high"));
  const changeCount = Object.keys(overrides).length;

  const shift = (dir: number) => setAnchor((a) => (a ? addDays(a, dir * (view === "week" ? 7 : 1)) : a));
  const goToday = () => now && setAnchor(new Date(now.getFullYear(), now.getMonth(), now.getDate()));

  const setSchedule = (id: string, s: Schedule | null) => setOverrides((o) => ({ ...o, [id]: s }));
  const resetTask = (id: string) => setOverrides((o) => { const n = { ...o }; delete n[id]; return n; });

  async function copyJson() {
    const text = JSON.stringify(merged, null, 2) + "\n";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Скопируйте JSON вручную:", text);
    }
  }

  const range =
    days.length === 0 ? "…"
      : view === "week"
        ? `${fmtShort(days[0])} – ${fmtShort(days[6])} ${days[6].getFullYear()}`
        : days[0].toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center rounded-lg border border-line bg-surface shadow-sm">
          <button onClick={() => shift(-1)} aria-label={view === "week" ? "Предыдущая неделя" : "Предыдущий день"} className="p-2 text-ink-muted hover:text-brand"><ChevronLeft className="size-4" /></button>
          <button onClick={goToday} className="border-x border-line px-3 py-1.5 text-sm font-semibold hover:text-brand">Сегодня</button>
          <button onClick={() => shift(1)} aria-label={view === "week" ? "Следующая неделя" : "Следующий день"} className="p-2 text-ink-muted hover:text-brand"><ChevronRight className="size-4" /></button>
        </div>
        <span className="rounded-lg bg-ink px-3 py-1.5 text-sm font-semibold text-white tabular-nums first-letter:uppercase">{range}</span>
        <div className="inline-flex rounded-lg border border-line bg-surface p-0.5 shadow-sm" role="group" aria-label="Вид">
          {(["week", "day"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={`rounded-md px-3 py-1 text-sm font-semibold transition-colors ${view === v ? "bg-brand text-white" : "text-ink-muted hover:text-ink"}`}
            >
              {v === "week" ? "Неделя" : "День"}
            </button>
          ))}
        </div>
        <button
          onClick={() => setTrayOpen((o) => !o)}
          className="ml-auto inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink-muted shadow-sm hover:text-ink"
          aria-expanded={trayOpen}
        >
          {trayOpen ? <PanelRightClose className="size-4" aria-hidden /> : <PanelRightOpen className="size-4" aria-hidden />}
          Без времени
          <span className="rounded-full bg-brand px-1.5 text-xs text-white">{unscheduled.length}</span>
        </button>
      </div>

      {changeCount > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
          <span><strong>{changeCount}</strong> изм. сохранено только в этом браузере. Чтобы команда их увидела, скопируйте JSON в <code className="text-xs">backlog/tasks.json</code> и закоммитьте.</span>
          <div className="ml-auto flex gap-2">
            <button onClick={copyJson} className="inline-flex items-center gap-1.5 rounded-md bg-surface px-2.5 py-1 font-semibold ring-1 ring-amber-300 hover:bg-amber-100">
              <ClipboardCopy className="size-4" aria-hidden /> {copied ? "Скопировано" : "Скопировать JSON"}
            </button>
            <button
              onClick={() => window.confirm("Отменить все локальные изменения расписания?") && setOverrides({})}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-semibold hover:bg-amber-100"
            >
              <RotateCcw className="size-4" aria-hidden /> Сбросить
            </button>
          </div>
        </div>
      )}

      <div className={`grid gap-4 ${trayOpen ? "lg:grid-cols-[1fr_18rem]" : ""}`}>
        {/* Time grid */}
        <div className="overflow-x-auto rounded-xl border border-line bg-surface shadow-sm">
          <div className={view === "week" ? "min-w-[860px]" : ""}>
            <div className="grid border-b border-line" style={{ gridTemplateColumns: `3.5rem repeat(${Math.max(days.length, 1)}, minmax(0, 1fr))` }}>
              <div />
              {days.map((d) => {
                const isToday = iso(d) === todayIso;
                return (
                  <button
                    key={iso(d)}
                    onClick={() => { setAnchor(d); setView("day"); }}
                    className={`border-l border-line px-2 py-2.5 text-left transition-colors hover:bg-canvas ${isToday ? "bg-brand-soft/60" : ""}`}
                    title="Открыть день"
                  >
                    <span className={`block text-xs font-bold uppercase tracking-wider ${isToday ? "text-brand" : "text-ink-muted"}`}>
                      {d.toLocaleDateString("ru-RU", { weekday: "short" })}
                    </span>
                    <span className={`text-lg font-extrabold tabular-nums ${isToday ? "text-brand" : ""}`}>{d.getDate()}</span>
                  </button>
                );
              })}
            </div>

            {/* All-day row: tasks with a date but no time yet */}
            <div className="grid border-b border-line bg-canvas/60" style={{ gridTemplateColumns: `3.5rem repeat(${Math.max(days.length, 1)}, minmax(0, 1fr))` }}>
              <div className="flex items-start justify-end px-2 py-2 text-right text-[10px] font-bold uppercase leading-tight tracking-wider text-ink-muted">Весь<br />день</div>
              {days.map((d) => {
                const allDay = merged.filter((t) => t.scheduledDate === iso(d) && !t.scheduledTime);
                return (
                  <div key={iso(d)} className="flex min-h-10 flex-col gap-1 border-l border-line p-1">
                    {allDay.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setEditing(t)}
                        title="Назначить время"
                        className="flex items-center gap-1.5 rounded-md border border-dashed border-brand/50 bg-surface px-1.5 py-1 text-left text-[11px] font-semibold leading-snug transition-colors hover:border-brand hover:bg-brand-soft/40"
                      >
                        <span className={`size-1.5 shrink-0 rounded-full ${PRIORITY[t.priority].dot}`} aria-hidden />
                        <span className="line-clamp-2 flex-1">{t.title}</span>
                        <CalendarPlus className="size-3.5 shrink-0 text-brand" aria-hidden />
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>

            <div className="grid" style={{ gridTemplateColumns: `3.5rem repeat(${Math.max(days.length, 1)}, minmax(0, 1fr))` }}>
              <div className="relative" style={{ height: (END_HOUR - START_HOUR) * HOUR_PX }}>
                {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => (
                  <span key={i} className="absolute right-2 -translate-y-1/2 text-[11px] font-semibold text-ink-muted tabular-nums" style={{ top: i * HOUR_PX }}>
                    {i === 0 ? "" : `${String(START_HOUR + i).padStart(2, "0")}:00`}
                  </span>
                ))}
              </div>
              {days.map((d) => {
                const key = iso(d);
                const isToday = key === todayIso;
                const blocks = layoutDay(merged.filter((t) => t.scheduledDate === key && t.scheduledTime));
                const nowMin = now ? now.getHours() * 60 + now.getMinutes() : -1;
                const showNow = isToday && nowMin >= START_HOUR * 60 && nowMin <= END_HOUR * 60;
                return (
                  <div key={key} className={`relative border-l border-line ${isToday ? "bg-brand-soft/20" : ""}`} style={{ height: (END_HOUR - START_HOUR) * HOUR_PX }}>
                    {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => (
                      <div key={i} className="absolute inset-x-0 border-t border-line/70" style={{ top: i * HOUR_PX }} aria-hidden />
                    ))}
                    {blocks.map((b) => {
                      const top = ((Math.max(b.start, START_HOUR * 60) - START_HOUR * 60) / 60) * HOUR_PX;
                      const bottom = ((Math.min(b.end, END_HOUR * 60) - START_HOUR * 60) / 60) * HOUR_PX;
                      const pr = PRIORITY[b.task.priority];
                      const initiative = b.task.link ? INITIATIVE_LABEL[b.task.link] : undefined;
                      const projectLabel = b.task.project;
                      return (
                        <button
                          key={b.task.id}
                          onClick={() => setEditing(b.task)}
                          className="absolute overflow-hidden rounded-lg border border-line border-l-4 bg-surface p-1.5 text-left shadow-sm transition-all duration-200 hover:z-10 hover:shadow-md"
                          style={{
                            top: top + 1,
                            height: Math.max(bottom - top - 2, 22),
                            left: `calc(${(b.lane / b.lanes) * 100}% + 2px)`,
                            width: `calc(${100 / b.lanes}% - 4px)`,
                            borderLeftColor: "var(--color-brand)",
                          }}
                        >
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-ink-muted tabular-nums">
                            <span className={`size-1.5 shrink-0 rounded-full ${pr.dot}`} aria-label={`Приоритет: ${pr.label}`} />
                            {fmtTime(b.start)}–{fmtTime(b.end)}
                          </span>
                          <span className="mt-0.5 line-clamp-2 text-xs font-semibold leading-snug">{b.task.title}</span>
                          <span className="mt-1 flex flex-wrap gap-1">
                            <span className="rounded bg-ink px-1 py-px text-[10px] font-semibold text-white">{projectLabel}</span>
                            {initiative && initiative !== projectLabel && (
                              <span className="rounded bg-muted px-1 py-px text-[10px] font-semibold text-ink-subtle ring-1 ring-line">{initiative}</span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                    {showNow && (
                      <div className="pointer-events-none absolute inset-x-0 z-20 flex items-center" style={{ top: ((nowMin - START_HOUR * 60) / 60) * HOUR_PX }} aria-hidden>
                        <span className="-ml-1 size-2.5 rounded-full bg-brand" />
                        <span className="h-0.5 flex-1 bg-brand" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Unscheduled tray */}
        {trayOpen && (
          <aside className="flex flex-col rounded-xl border border-line bg-surface p-4 shadow-sm" aria-label="Задачи без времени">
            <h2 className="flex items-center gap-2 font-bold"><Inbox className="size-4 text-brand" aria-hidden /> Без времени</h2>
            <label className="mt-2 flex items-center gap-2 text-xs text-ink-muted">
              <input type="checkbox" checked={allPriorities} onChange={(e) => setAllPriorities(e.target.checked)} className="accent-[var(--color-brand)]" />
              Показать все приоритеты (не только High)
            </label>
            <ul className="mt-3 flex flex-col gap-2">
              {unscheduled.map((t) => (
                <li key={t.id} className="rounded-lg border border-line bg-canvas p-3">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold">
                    <span className={`size-1.5 rounded-full ${PRIORITY[t.priority].dot}`} aria-hidden />
                    <span className={PRIORITY[t.priority].text}>{PRIORITY[t.priority].label}</span>
                    <span className="ml-auto rounded bg-ink px-1 py-px text-[10px] text-white">{t.project}</span>
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-snug">{t.title}</p>
                  <button
                    onClick={() => setEditing(t)}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-brand px-2.5 py-1 text-xs font-bold text-white transition-colors hover:bg-brand-dark"
                  >
                    <CalendarPlus className="size-3.5" aria-hidden /> Назначить время
                  </button>
                </li>
              ))}
              {unscheduled.length === 0 && <li className="py-4 text-center text-xs text-ink-muted">Все задачи распланированы</li>}
            </ul>
          </aside>
        )}
      </div>

      {editing && (
        <ScheduleDialog
          task={merged.find((t) => t.id === editing.id) ?? editing}
          defaultDate={anchor ? iso(anchor) : todayIso}
          overridden={editing.id in overrides}
          onClose={() => setEditing(null)}
          onSave={(s) => { setSchedule(editing.id, s); setEditing(null); }}
          onReset={() => { resetTask(editing.id); setEditing(null); }}
        />
      )}
    </div>
  );
}

const fieldCls = "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";

function ScheduleDialog({ task, defaultDate, overridden, onClose, onSave, onReset }: {
  task: Task;
  defaultDate: string;
  overridden: boolean;
  onClose: () => void;
  onSave: (s: Schedule | null) => void;
  onReset: () => void;
}) {
  const [date, setDate] = useState(task.scheduledDate ?? defaultDate);
  const [time, setTime] = useState(task.scheduledTime && TIME_OPTIONS.includes(task.scheduledTime) ? task.scheduledTime : "10:00");
  const [duration, setDuration] = useState(task.durationMinutes ?? 60);
  // Date-only tasks open with a time selected, since the point is usually to assign one.
  const [allDay, setAllDay] = useState(false);
  const pr = PRIORITY[task.priority];
  const endsLate = toMinutes(time) + duration > END_HOUR * 60;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-title"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border-t-4 border-t-brand bg-surface p-5 shadow-2xl"
      >
        <div className="flex items-start gap-3">
          <h2 id="schedule-title" className="flex-1 text-lg font-bold leading-snug">{task.title}</h2>
          <button onClick={onClose} aria-label="Закрыть" className="rounded-md p-1 text-ink-muted hover:text-ink"><X className="size-5" /></button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5 text-xs font-semibold">
          <span className="rounded-md bg-ink px-2 py-0.5 text-white">{task.project}</span>
          <span className={`inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 ${pr.text}`}><span className={`size-1.5 rounded-full ${pr.dot}`} />{pr.label}</span>
          <span className="rounded-md bg-muted px-2 py-0.5 text-ink-subtle">{task.assignee}</span>
          <span className="rounded-md bg-muted px-2 py-0.5 text-ink-subtle">{task.status.replace("_", " ")}</span>
        </div>
        {task.notes && <p className="mt-3 text-sm text-ink-muted">{task.notes}</p>}
        {task.tags.length > 0 && <p className="mt-2 text-xs text-ink-subtle">{task.tags.map((t) => `#${t}`).join(" ")}</p>}
        {task.link && (
          <Link href={task.link} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
            Открыть проект <ExternalLink className="size-3.5" aria-hidden />
          </Link>
        )}

        <form
          className="mt-5 border-t border-line pt-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!date) return;
            onSave(allDay ? { scheduledDate: date } : { scheduledDate: date, scheduledTime: time, durationMinutes: duration });
          }}
        >
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold"><Clock className="size-4 text-brand" aria-hidden /> {task.scheduledTime ? "Перенести" : "Назначить время"}</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="text-xs font-semibold text-ink-muted">Дата
              <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={`mt-1 ${fieldCls}`} />
            </label>
            <label className="text-xs font-semibold text-ink-muted">Начало
              <select value={time} disabled={allDay} onChange={(e) => setTime(e.target.value)} className={`mt-1 ${fieldCls} disabled:opacity-50`}>
                {TIME_OPTIONS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-ink-muted">Длительность
              <select value={duration} disabled={allDay} onChange={(e) => setDuration(Number(e.target.value))} className={`mt-1 ${fieldCls} disabled:opacity-50`}>
                {DURATIONS.map((d) => <option key={d} value={d}>{d < 60 ? `${d} мин` : `${d / 60} ч`}</option>)}
              </select>
            </label>
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm text-ink-subtle">
            <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} className="accent-[var(--color-brand)]" />
            На весь день (без конкретного времени)
          </label>
          {!allDay && endsLate && <p className="mt-2 text-xs text-amber-700">Блок заканчивается после 20:00 — в сетке он будет обрезан.</p>}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {task.scheduledDate && (
              <button type="button" onClick={() => onSave(null)} className="rounded-lg px-3 py-2 text-sm font-semibold text-ink-muted hover:text-brand">Снять с расписания</button>
            )}
            {overridden && (
              <button type="button" onClick={onReset} className="rounded-lg px-3 py-2 text-sm font-semibold text-ink-muted hover:text-ink">Как в tasks.json</button>
            )}
            <button type="button" onClick={onClose} className="ml-auto rounded-lg px-4 py-2 text-sm font-semibold text-ink-muted hover:text-ink">Отмена</button>
            <button type="submit" className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-brand-dark hover:shadow-md">Сохранить</button>
          </div>
        </form>
      </div>
    </div>
  );
}
