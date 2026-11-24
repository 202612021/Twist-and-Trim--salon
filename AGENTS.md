# AGENTS.md — Salon Queue Management

Queue app for a salon: customers join from their phone, see wait time, get called; reception and barbers manage the queue; TV display.

## Read first
- docs/01-brief.md -> features + what NOT to build
- docs/02-screens.md -> every screen's layout and behaviour
- docs/03-flows-rules.md -> flows, queue rules, test checklist

## Stack
- Frontend: React 18 / 19 + Vite + TypeScript + Tailwind CSS + Lucide Icons + Socket.IO client.
- Backend: Express + SQLite (better-sqlite3 or sqlite3) + Socket.IO.
- Scripts: `npm run dev` (starts both frontend on localhost:5173 and backend on localhost:5000 concurrently).

## Working Rules
- Theme: dark charcoal (#1F2937, #111827) + gold accent (#D4A017, #F59E0B); rounded cards.
- All labels via EN/GU language dictionary; no hard-coded display strings without translation support.
- Queue rules (status machine, barber matching, wait time estimate) live in one unified business logic module reused across API and sockets.
- Never add features from the 'Don't build' list (no online payment, no SMS gateway, no complex auth).
- Keep all screens responsive: mobile-first for Customer & Barber views, tablet/desktop for Reception & TV display.
