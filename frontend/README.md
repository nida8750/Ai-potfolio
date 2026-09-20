# Nida AI frontend

Phase 1 of the Nida Asghar / Nida AI portfolio. Next.js App Router, TypeScript, Tailwind CSS, Framer Motion, and Lucide React. Content is data-driven from `data/*.ts` so Phase 2 can replace it with FastAPI + MongoDB.

## Run

```bash
npm install
npm run dev
```

Dev server: `http://localhost:43127` (`0.0.0.0`).

## Stack

- Next.js 16 App Router
- TypeScript (strict)
- Tailwind CSS 4
- Framer Motion
- Lucide React

No auth, database, or AI APIs in this phase.

## Layout

- `app/` — root layout and homepage composition
- `components/layout` — navbar, mobile menu, footer
- `components/sections` — hero, services, projects
- `components/ui` — shared primitives
- `data/` — navigation, services, projects
- `lib/` — constants, class helper, motion variants
- `types/` — `NavItem`, `Service`, `Project`

## Resume

`Download Resume` requests `/resume/resume.pdf`. If the file is missing, the UI shows a fallback message instead of a broken download.
