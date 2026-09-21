# Nida AI frontend

Portfolio site for Nida Asghar / Nida AI — AI Agent & Automation Engineer. Next.js App Router, TypeScript, Tailwind CSS, Framer Motion, and Lucide React.

## Run

```bash
cd frontend
npm install
npm run dev
```

Dev server: `http://localhost:43127` (`0.0.0.0`).

```bash
npm run lint
npm run typecheck
npm run build
```

## Stack

- Next.js 16 App Router
- TypeScript (strict)
- Tailwind CSS 4
- Framer Motion
- Lucide React

No auth, database, or AI APIs in this frontend. Contact is a layout-only form.

## Layout

- `app/` — root layout, metadata, and homepage composition
- `components/layout` — navbar, mobile menu, footer
- `components/sections` — hero, services, projects, about, contact
- `components/ui` — shared primitives
- `data/` — navigation, services, projects
- `lib/` — constants, class helper, motion variants
- `types/` — `NavItem`, `Service`, `Project`

## Resume

`Download Resume` links to `/resume/resume.pdf`.
