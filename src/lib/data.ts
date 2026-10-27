// Git-driven data: tasks, content plan and project docs live as files in the repo and are read at build time.
// Sync reads keep pages fully static (see Next.js caching docs: "Predictable values").
import "server-only";
import fs from "node:fs";
import path from "node:path";
import {
  ASSIGNEES, CONTENT_FORMATS, CONTENT_STATUSES, PRIORITIES, PROJECTS, STATUSES,
  type ContentItem, type ProjectDoc, type Task,
} from "./types";

const ROOT = process.cwd();
const TASKS_FILE = path.join(ROOT, "backlog", "tasks.json");
const CALENDAR_FILE = path.join(ROOT, "content", "calendar.json");
const PROJECTS_DIR = path.join(ROOT, "projects");

type Rec = Record<string, unknown>;

// Agents edit these files by hand, so a typo should fail the build with a clear message instead of rendering garbage.
function fail(file: string, index: number, msg: string): never {
  throw new Error(`${path.relative(ROOT, file)} [${index}]: ${msg}`);
}

function str(file: string, i: number, r: Rec, key: string, optional = false): string | undefined {
  const v = r[key];
  if (v === undefined && optional) return undefined;
  if (typeof v !== "string" || !v.trim()) fail(file, i, `"${key}" must be a non-empty string`);
  return v;
}

function oneOf<T extends string>(file: string, i: number, r: Rec, key: string, allowed: readonly T[]): T {
  const v = r[key];
  if (!allowed.includes(v as T)) fail(file, i, `"${key}" must be one of ${allowed.join(", ")} (got ${JSON.stringify(v)})`);
  return v as T;
}

function readJsonArray(file: string): Rec[] {
  const data: unknown = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!Array.isArray(data)) throw new Error(`${path.relative(ROOT, file)} must contain a JSON array`);
  return data as Rec[];
}

export function getTasks(): Task[] {
  return readJsonArray(TASKS_FILE).map((r, i) => {
    const tags = r.tags ?? [];
    if (!Array.isArray(tags) || tags.some((t) => typeof t !== "string")) fail(TASKS_FILE, i, `"tags" must be an array of strings`);
    const due = str(TASKS_FILE, i, r, "due", true);
    if (due && !/^\d{4}-\d{2}(-\d{2})?$/.test(due)) fail(TASKS_FILE, i, `"due" must be YYYY-MM or YYYY-MM-DD`);
    const link = str(TASKS_FILE, i, r, "link", true);
    if (link && !link.startsWith("/")) fail(TASKS_FILE, i, `"link" must be an internal path starting with /`);
    return {
      id: str(TASKS_FILE, i, r, "id")!,
      title: str(TASKS_FILE, i, r, "title")!,
      status: oneOf(TASKS_FILE, i, r, "status", STATUSES),
      priority: oneOf(TASKS_FILE, i, r, "priority", PRIORITIES),
      assignee: oneOf(TASKS_FILE, i, r, "assignee", ASSIGNEES),
      project: oneOf(TASKS_FILE, i, r, "project", PROJECTS),
      tags: tags as string[],
      notes: str(TASKS_FILE, i, r, "notes", true),
      due,
      link,
    };
  });
}

export function getContentPlan(): ContentItem[] {
  return readJsonArray(CALENDAR_FILE).map((r, i) => {
    const date = str(CALENDAR_FILE, i, r, "date")!;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) fail(CALENDAR_FILE, i, `"date" must be YYYY-MM-DD`);
    return {
      id: str(CALENDAR_FILE, i, r, "id")!,
      date,
      time: str(CALENDAR_FILE, i, r, "time", true),
      format: oneOf(CALENDAR_FILE, i, r, "format", CONTENT_FORMATS),
      title: str(CALENDAR_FILE, i, r, "title")!,
      channel: str(CALENDAR_FILE, i, r, "channel")!,
      owner: oneOf(CALENDAR_FILE, i, r, "owner", ASSIGNEES),
      status: oneOf(CALENDAR_FILE, i, r, "status", CONTENT_STATUSES),
    };
  });
}

// Minimal frontmatter: a leading `---` block of `key: value` lines (title, summary).
function parseDoc(slug: string, raw: string): ProjectDoc {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
  const meta: Record<string, string> = {};
  if (match) {
    for (const line of match[1].split(/\r?\n/)) {
      const kv = /^(\w+):\s*(.*)$/.exec(line);
      if (kv) meta[kv[1]] = kv[2].trim();
    }
  }
  const body = match ? raw.slice(match[0].length) : raw;
  const heading = /^#\s+(.+)$/m.exec(body)?.[1];
  return { slug, title: meta.title || heading || slug, summary: meta.summary || "", body };
}

export function getProjectDocs(): ProjectDoc[] {
  return fs
    .readdirSync(PROJECTS_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => parseDoc(f.slice(0, -3), fs.readFileSync(path.join(PROJECTS_DIR, f), "utf8")));
}

// Unknown slugs render on request, where projects/ may not be bundled — treat a missing folder as "not found".
export function getProjectDoc(slug: string): ProjectDoc | undefined {
  try {
    return getProjectDocs().find((d) => d.slug === slug);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw err;
  }
}
