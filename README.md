# IMOSTA Marketing Hub

Knowledge base and internal Command Center for the IMOSTA digital marketing team.

- `IMOSTA-SSOT.md` — brand, design system, funnels, lead requirements (single source of truth)
- `ads/`, `content/`, `backlog/`, `scripts/` — marketing artifacts
- `src/` — Command Center web app (Next.js 16, App Router, TypeScript, Tailwind CSS v4)

## Command Center

| Route        | View                                                   |
| ------------ | ------------------------------------------------------ |
| `/tasks`     | Kanban board (agent: Claude / Gemini / Human; category: Meta Ads, Reels, Blog, Forms) |
| `/analytics` | Lead counter and UTM attribution table                 |
| `/content`   | Weekly content calendar (Mon–Sun)                      |

Data is mock (`src/lib/mock-data.ts`). Task board changes persist in the browser's localStorage only.
Brand tokens (`brand`, `ink`, `canvas`, …) are defined in `src/app/globals.css` under `@theme`.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
```

### Deploy

Import the repo in Vercel (framework preset: Next.js, root directory: repo root). No env vars are needed yet.
The app has no authentication — protect the deployment with Vercel Deployment Protection before sharing the URL.
