# IMOSTA Marketing Hub

Knowledge base and internal Command Center for the IMOSTA digital marketing team.

- `IMOSTA-SSOT.md` — brand, design system, funnels, lead requirements (single source of truth)
- `ads/`, `content/`, `backlog/`, `scripts/` — marketing artifacts
- `src/` — Command Center web app (Next.js 16, App Router, TypeScript, Tailwind CSS v4)

## Command Center

| Route        | View                                   | Data source            |
| ------------ | -------------------------------------- | ---------------------- |
| `/tasks`     | Kanban: Backlog → In Progress → Review → Done | `backlog/tasks.json` |
| `/projects`  | Markdown documentation reader          | `projects/*.md`        |
| `/content`   | Weekly calendar (Mon–Sun): Idea → Scripted → Recorded → Published | `content/calendar.json` |
| `/analytics` | Lead counter and UTM attribution table | demo data (`src/lib/mock-data.ts`) |

Data is Git-driven: edit the files, commit, push — Vercel rebuilds and the dashboard updates.
Files are validated at build time (`src/lib/data.ts`); an invalid status, assignee, project or date fails the build with the file and entry index.

Allowed values (see `src/lib/types.ts`):
- task `status`: `backlog`, `in_progress`, `review`, `done` · `priority`: `high`, `medium`, `low`
- `assignee` / `owner`: `Claude`, `Gemini`, `Human` · `project`: `JDG`, `Spolka`, `Meta Ads`, `Webinar`, `Forms`, `English Expansion`, `Video Education`, `Marketing`
- optional task scheduling: `scheduledDate` (`YYYY-MM-DD`), `scheduledTime` (`HH:MM`, needs a date), `durationMinutes` (15–720)
- content `format`: `Reels`, `Screen recording`, `Blog` · `status`: `idea`, `scripted`, `recorded`, `published`
- `projects/*.md` may start with a `---` block containing `title:`, `summary:` and optional `status:` / `category:`

Brand tokens (`brand`, `ink`, `canvas`, …) are defined in `src/app/globals.css` under `@theme`.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
```

### Deploy

Import the repo in Vercel (framework preset: Next.js, root directory: repo root). No env vars are needed yet.
The app has no authentication — protect the deployment with Vercel Deployment Protection before sharing the URL.
