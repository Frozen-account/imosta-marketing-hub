// Demo data until the board, leads and calendar are backed by a real store.
import type { ContentItem, Lead, Task } from "./types";

export const initialTasks: Task[] = [
  { id: "t1", title: "UTM-атрибуция в формах jdg.imosta.pl и imosta.pl", description: "localStorage last-touch, блок источника в Telegram", agent: "Claude", category: "Forms", priority: "high", status: "review" },
  { id: "t2", title: "Проверить Meta Pixel (Lead) в GTM-5T867S9", description: "Событие generate_lead → Lead, Consent Mode v2", agent: "Human", category: "Meta Ads", priority: "high", status: "todo" },
  { id: "t3", title: "Креативы для кампании JDG «Старт за 24 часа»", description: "3 статики + 2 видео 9:16, RU/UA", agent: "Gemini", category: "Meta Ads", priority: "high", status: "in_progress" },
  { id: "t4", title: "Калькулятор налога: Ryczałt / Skala / Liniowy", agent: "Claude", category: "Forms", priority: "medium", status: "backlog" },
  { id: "t5", title: "Reels: «3 ошибки при выборе формы налогообложения»", agent: "Gemini", category: "Reels", priority: "medium", status: "todo", due: "2026-10-29" },
  { id: "t6", title: "Статья: Estoński CIT vs классический CIT в 2027", description: "Экспертная вычитка — Татьяна Бакаева", agent: "Gemini", category: "Blog", priority: "medium", status: "backlog" },
  { id: "t7", title: "Чек-лист безопасности Zarząd (art. 299 KSH) — лид-магнит", agent: "Human", category: "Blog", priority: "low", status: "backlog" },
  { id: "t8", title: "Убрать фейковую отправку формы на /landing", agent: "Claude", category: "Forms", priority: "high", status: "in_progress" },
  { id: "t9", title: "Анонс вебинара OPRIMO 15.11 — серия сторис", agent: "Gemini", category: "Reels", priority: "medium", status: "done" },
];

const campaigns: Array<Omit<Lead, "id" | "createdAt"> & { count: number }> = [
  { segment: "JDG", utm_source: "facebook", utm_medium: "paid_social", utm_campaign: "jdg_start_24h", utm_content: "video_hook_a", count: 18 },
  { segment: "JDG", utm_source: "facebook", utm_medium: "paid_social", utm_campaign: "jdg_start_24h", utm_content: "static_calc", count: 9 },
  { segment: "JDG", utm_source: "instagram", utm_medium: "paid_social", utm_campaign: "jdg_ryczalt_reels", utm_content: "reels_3_mistakes", count: 7 },
  { segment: "Spolka", utm_source: "facebook", utm_medium: "paid_social", utm_campaign: "spolka_estonski_cit", utm_content: "carousel_cit", count: 6 },
  { segment: "Spolka", utm_source: "google", utm_medium: "cpc", utm_campaign: "spolka_ksiegowosc_search", count: 5 },
  { segment: "Консультация", utm_source: "(direct)", utm_medium: "(none)", utm_campaign: "(none)", count: 4 },
  { segment: "JDG", utm_source: "google", utm_medium: "organic", utm_campaign: "(none)", count: 3 },
];

export const mockLeads: Lead[] = campaigns.flatMap(({ count, ...c }, ci) =>
  Array.from({ length: count }, (_, i) => ({
    ...c,
    id: `l${ci}-${i}`,
    createdAt: new Date(Date.UTC(2026, 9, 1 + ((i * 3 + ci) % 26), 9 + (i % 9))).toISOString(),
  })),
);

export const contentPlan: ContentItem[] = [
  { id: "c1", weekday: 0, time: "10:00", format: "Reels", title: "3 ошибки при выборе формы налогообложения", channel: "Instagram", owner: "Gemini", state: "ready" },
  { id: "c2", weekday: 1, time: "12:00", format: "Blog", title: "Ulga na start и Mały ZUS Plus: что выбрать", channel: "imosta.pl/blog", owner: "Gemini", state: "draft" },
  { id: "c3", weekday: 2, time: "18:00", format: "Stories", title: "Анонс вебинара OPRIMO 15.11", channel: "Instagram", owner: "Human", state: "ready" },
  { id: "c4", weekday: 3, time: "10:00", format: "Carousel", title: "Estoński CIT: 0% пока прибыль в компании", channel: "Instagram / Facebook", owner: "Gemini", state: "idea" },
  { id: "c5", weekday: 3, time: "17:00", format: "Reels", title: "Татьяна Бакаева: KSeF за 60 секунд", channel: "Instagram", owner: "Human", state: "draft" },
  { id: "c6", weekday: 4, time: "11:00", format: "Blog", title: "Ответственность Zarząd по art. 299 KSH", channel: "imosta.pl/blog", owner: "Gemini", state: "idea" },
  { id: "c7", weekday: 5, time: "12:00", format: "Reels", title: "JDG за 24 часа — как это работает", channel: "Instagram / TikTok", owner: "Gemini", state: "idea" },
];
