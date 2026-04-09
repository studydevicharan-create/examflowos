# ExamFlowOS

A study and revision app built with React, Vite, and Tailwind CSS. Originally created on Lovable, migrated to Replit.

## Architecture

- **Frontend only** — pure client-side React SPA, no backend server
- **Vite** dev server on port 5000
- **React Router** for client-side routing
- **Tailwind CSS + shadcn/ui** for styling and UI components
- **TanStack Query** for data management
- **IndexedDB (idb-keyval)** for local data persistence
- **Framer Motion** for animations

## Key Pages

- `/` — Home
- `/subjects` — Subjects list
- `/subjects/:id` — Subject detail
- `/topic/:nodeId` — Topic detail
- `/recall` — Recall practice
- `/recall/session` — Active recall session
- `/stats` — Statistics
- `/settings` — Settings

## Running the App

```bash
npm run dev
```

Starts the Vite dev server at `http://localhost:5000`.

## Building for Production

```bash
npm run build
```

Outputs static files to `dist/`.

## Notes

- `lovable-tagger` dev dependency has been removed from the Vite config (Replit-incompatible)
- Server host set to `0.0.0.0` and `allowedHosts: true` for Replit proxy compatibility
