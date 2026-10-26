"use client";

import { useEffect, useMemo, useState } from "react";
import { Bot, Flag, Plus, RotateCcw, Sparkles, Trash2, User, X } from "lucide-react";
import { initialTasks } from "@/lib/mock-data";
import type { Agent, Category, Priority, Status, Task } from "@/lib/types";

const STORAGE_KEY = "imosta-hub:tasks:v1";

export const COLUMNS: { id: Status; title: string }[] = [
  { id: "backlog", title: "Бэклог" },
  { id: "todo", title: "К работе" },
  { id: "in_progress", title: "В работе" },
  { id: "review", title: "Ревью" },
  { id: "done", title: "Готово" },
];

const AGENTS: Agent[] = ["Claude", "Gemini", "Human"];
const CATEGORIES: Category[] = ["Meta Ads", "Reels", "Blog", "Forms"];

const AGENT_STYLE: Record<Agent, { cls: string; icon: typeof Bot }> = {
  Claude: { cls: "bg-orange-50 text-orange-800 ring-orange-200", icon: Bot },
  Gemini: { cls: "bg-blue-50 text-blue-800 ring-blue-200", icon: Sparkles },
  Human: { cls: "bg-muted text-ink ring-line", icon: User },
};

const PRIORITY: Record<Priority, { label: string; cls: string }> = {
  high: { label: "Высокий", cls: "text-brand" },
  medium: { label: "Средний", cls: "text-amber-600" },
  low: { label: "Низкий", cls: "text-ink-muted" },
};

// Browser storage can be unavailable (private mode, blocked site data) — the board still works in memory.
function loadTasks(): Task[] | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Task[]) : null;
  } catch {
    return null;
  }
}

function saveTasks(tasks: Task[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {}
}

export function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [loaded, setLoaded] = useState(false);
  const [agentFilter, setAgentFilter] = useState<Agent | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<Status | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const stored = loadTasks();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from browser storage
    if (stored) setTasks(stored);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveTasks(tasks);
  }, [tasks, loaded]);

  const visible = useMemo(
    () =>
      tasks.filter(
        (t) => (agentFilter === "all" || t.agent === agentFilter) && (categoryFilter === "all" || t.category === categoryFilter),
      ),
    [tasks, agentFilter, categoryFilter],
  );

  const moveTask = (id: string, status: Status) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  const deleteTask = (id: string) => setTasks((prev) => prev.filter((t) => t.id !== id));
  const addTask = (task: Omit<Task, "id">) =>
    setTasks((prev) => [...prev, { ...task, id: `t${Date.now().toString(36)}` }]);
  const reset = () => {
    if (window.confirm("Вернуть демо-задачи? Ваши изменения на доске будут удалены.")) setTasks(initialTasks);
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <FilterSelect label="Агент" value={agentFilter} options={AGENTS} onChange={(v) => setAgentFilter(v as Agent | "all")} />
        <FilterSelect label="Категория" value={categoryFilter} options={CATEGORIES} onChange={(v) => setCategoryFilter(v as Category | "all")} />
        <div className="ml-auto flex gap-2">
          <button onClick={reset} className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink-muted shadow-sm transition-all duration-200 hover:text-ink hover:shadow-md">
            <RotateCcw className="size-4" aria-hidden /> Сбросить
          </button>
          <button onClick={() => setAdding(true)} className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-brand-dark hover:shadow-md">
            <Plus className="size-4" aria-hidden /> Задача
          </button>
        </div>
      </div>

      {adding && <NewTaskForm onCancel={() => setAdding(false)} onSave={(t) => { addTask(t); setAdding(false); }} />}

      <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4 md:mx-0 md:px-0">
        {COLUMNS.map((col) => {
          const items = visible.filter((t) => t.status === col.id);
          return (
            <section
              key={col.id}
              aria-label={col.title}
              onDragOver={(e) => { e.preventDefault(); setDropTarget(col.id); }}
              onDragLeave={() => setDropTarget((c) => (c === col.id ? null : c))}
              onDrop={(e) => {
                e.preventDefault();
                if (dragId) moveTask(dragId, col.id);
                setDragId(null); setDropTarget(null);
              }}
              className={`flex w-72 shrink-0 snap-start flex-col rounded-xl border p-3 transition-colors duration-200 ${
                dropTarget === col.id ? "border-brand bg-brand-soft/60" : "border-line bg-muted/60"
              }`}
            >
              <header className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-sm font-bold uppercase tracking-wider text-ink-subtle">{col.title}</h2>
                <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-bold text-ink-muted ring-1 ring-line">{items.length}</span>
              </header>
              <div className="flex min-h-24 flex-1 flex-col gap-2.5">
                {items.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    dragging={dragId === task.id}
                    onDragStart={() => setDragId(task.id)}
                    onDragEnd={() => { setDragId(null); setDropTarget(null); }}
                    onMove={(s) => moveTask(task.id, s)}
                    onDelete={() => deleteTask(task.id)}
                  />
                ))}
                {items.length === 0 && (
                  <p className="rounded-lg border border-dashed border-line px-3 py-6 text-center text-xs text-ink-muted">Перетащите задачу сюда</p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function TaskCard({ task, dragging, onDragStart, onDragEnd, onMove, onDelete }: {
  task: Task;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onMove: (s: Status) => void;
  onDelete: () => void;
}) {
  const agent = AGENT_STYLE[task.agent];
  const AgentIcon = agent.icon;
  const pr = PRIORITY[task.priority];
  return (
    <article
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; onDragStart(); }}
      onDragEnd={onDragEnd}
      className={`group cursor-grab rounded-xl border border-line bg-surface p-3.5 shadow-sm transition-all duration-200 hover:shadow-md active:cursor-grabbing ${dragging ? "opacity-40" : ""}`}
    >
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ${agent.cls}`}>
          <AgentIcon className="size-3" aria-hidden /> {task.agent}
        </span>
        <span className="rounded-md bg-ink px-2 py-0.5 text-xs font-semibold text-white">{task.category}</span>
      </div>
      <h3 className="text-sm font-semibold leading-snug">{task.title}</h3>
      {task.description && <p className="mt-1 text-xs leading-relaxed text-ink-muted">{task.description}</p>}
      <div className="mt-3 flex items-center gap-2 text-xs">
        <span className={`inline-flex items-center gap-1 font-semibold ${pr.cls}`}>
          <Flag className="size-3" aria-hidden /> {pr.label}
        </span>
        {task.due && <span className="text-ink-muted">до {new Date(task.due + "T00:00:00").toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}</span>}
        <div className="ml-auto flex items-center gap-1">
          <label className="sr-only" htmlFor={`move-${task.id}`}>Статус</label>
          <select
            id={`move-${task.id}`}
            value={task.status}
            onChange={(e) => onMove(e.target.value as Status)}
            className="rounded-md border border-line bg-surface px-1.5 py-1 text-xs text-ink-subtle focus:border-brand focus:outline-none"
          >
            {COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <button onClick={onDelete} aria-label="Удалить задачу" className="rounded-md p-1 text-ink-muted transition-colors hover:bg-brand-soft hover:text-brand">
            <Trash2 className="size-3.5" aria-hidden />
          </button>
        </div>
      </div>
    </article>
  );
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <label className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm shadow-sm">
      <span className="font-semibold text-ink-muted">{label}:</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="bg-transparent font-semibold focus:outline-none">
        <option value="all">Все</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

const inputCls = "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";

function NewTaskForm({ onSave, onCancel }: { onSave: (t: Omit<Task, "id">) => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [agent, setAgent] = useState<Agent>("Claude");
  const [category, setCategory] = useState<Category>("Meta Ads");
  const [priority, setPriority] = useState<Priority>("medium");
  const [due, setDue] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        onSave({ title: title.trim(), description: description.trim() || undefined, agent, category, priority, status: "backlog", due: due || undefined });
      }}
      className="mb-5 rounded-xl border border-line border-t-4 border-t-brand bg-surface p-4 shadow-md"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-bold">Новая задача → Бэклог</h2>
        <button type="button" onClick={onCancel} aria-label="Закрыть" className="rounded-md p-1 text-ink-muted hover:text-ink"><X className="size-4" /></button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <input autoFocus required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название задачи" className={`${inputCls} md:col-span-2`} />
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Описание (необязательно)" className={`${inputCls} md:col-span-2`} />
        <select value={agent} onChange={(e) => setAgent(e.target.value as Agent)} className={inputCls} aria-label="Агент">
          {AGENTS.map((a) => <option key={a}>{a}</option>)}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value as Category)} className={inputCls} aria-label="Категория">
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className={inputCls} aria-label="Приоритет">
          {(Object.keys(PRIORITY) as Priority[]).map((p) => <option key={p} value={p}>{PRIORITY[p].label}</option>)}
        </select>
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={inputCls} aria-label="Срок" />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm font-semibold text-ink-muted hover:text-ink">Отмена</button>
        <button type="submit" className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-brand-dark hover:shadow-md">Добавить</button>
      </div>
    </form>
  );
}
