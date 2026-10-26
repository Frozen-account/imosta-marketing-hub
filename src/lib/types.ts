export type Agent = "Claude" | "Gemini" | "Human";
export type Category = "Meta Ads" | "Reels" | "Blog" | "Forms";
export type Priority = "high" | "medium" | "low";
export type Status = "backlog" | "todo" | "in_progress" | "review" | "done";

export interface Task {
  id: string;
  title: string;
  description?: string;
  agent: Agent;
  category: Category;
  priority: Priority;
  status: Status;
  due?: string; // ISO date, YYYY-MM-DD
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

export type ContentFormat = "Reels" | "Blog" | "Stories" | "Carousel";
export type ContentState = "idea" | "draft" | "ready" | "published";

export interface ContentItem {
  id: string;
  weekday: number; // 0 = Monday … 6 = Sunday
  time?: string;
  format: ContentFormat;
  title: string;
  channel: string;
  owner: Agent;
  state: ContentState;
}
