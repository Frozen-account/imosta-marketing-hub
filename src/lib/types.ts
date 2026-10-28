export const STATUSES = ["backlog", "in_progress", "review", "done"] as const;
export const PRIORITIES = ["high", "medium", "low"] as const;
export const ASSIGNEES = ["Claude", "Gemini", "Human"] as const;
export const PROJECTS = ["JDG", "Spolka", "Meta Ads", "Webinar", "Forms", "English Expansion", "Video Education"] as const;

export type Status = (typeof STATUSES)[number];
export type Priority = (typeof PRIORITIES)[number];
export type Assignee = (typeof ASSIGNEES)[number];
export type Project = (typeof PROJECTS)[number];

export interface Task {
  id: string;
  title: string;
  status: Status;
  priority: Priority;
  assignee: Assignee;
  project: Project;
  tags: string[];
  notes?: string;
  due?: string; // YYYY-MM or YYYY-MM-DD
  link?: string; // internal path, e.g. /projects/english-expansion
  scheduledDate?: string; // YYYY-MM-DD
  scheduledTime?: string; // HH:MM, 24h; requires scheduledDate
  durationMinutes?: number;
}

export type Schedule = Pick<Task, "scheduledDate" | "scheduledTime" | "durationMinutes">;

export const CONTENT_FORMATS = ["Reels", "Screen recording", "Blog"] as const;
export const CONTENT_STATUSES = ["idea", "scripted", "recorded", "published"] as const;

export type ContentFormat = (typeof CONTENT_FORMATS)[number];
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export interface ContentItem {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string;
  format: ContentFormat;
  title: string;
  channel: string;
  owner: Assignee;
  status: ContentStatus;
}

export interface ProjectDoc {
  slug: string;
  title: string;
  summary: string;
  status?: string; // frontmatter, e.g. "active"
  body: string;
}

export type LeadSegment = "JDG" | "Spolka" | "Консультация";

export interface Lead {
  id: string;
  createdAt: string; // ISO datetime
  segment: LeadSegment;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content?: string;
}
