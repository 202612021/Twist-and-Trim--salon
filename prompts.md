# Prompts Log — Salon Queue Management System

All prompts used during the development of the Salon Queue Management System, in chronological order.

---

### Prompt 1: Initial Requirements & Document Setup
> "canteern is just for example implement in salon salon is main start"
- **Action**: Identified that the lab assignment requires implementing the Salon Queue Management System based on `Salon Queue Management System - Vibe coding guide (MSc IT Handout)` instead of the Canteen example.
- **Created**: `AGENTS.md`, `docs/01-brief.md`, `docs/02-screens.md`, and `docs/03-flows-rules.md`. Initialized git repository.

---

### Prompt 2: Full-Stack Architecture Scaffold & Environment Setup
> "Set up React + Vite + TypeScript + Tailwind, Express backend, SQLite and Socket.IO. Create a clean modular folder structure, configure concurrent local development scripts, add a backend health-check endpoint, and verify that frontend and backend both run on localhost."
- **Action**: Installed Node.js LTS and Git. Configured Vite React + TypeScript + Tailwind CSS in `client/` and Express + SQLite (`node:sqlite` DatabaseSync) + Socket.IO in `server/`. Added `/api/health` and verified both localhost:5173 and localhost:5000 run concurrently.

---

### Prompt 3: Home & Join Queue Screens (Customer View)
> "Build Screen 1 (Home) and Screen 2 (Join Queue) from docs/02-screens.md with dummy services and barbers. Validate phone numbers and the 3-service limit. Mobile-first, charcoal + gold theme."
- **Action**: Built `Home.tsx` with live waiting count, barber status chips, and `Join Queue` CTA. Built `JoinQueue.tsx` with name input, 10-digit phone validation, service cards (multi-select, max 3), barber selector ('Any' or specific), live duration/price calculation, and deduplication logic.

---

### Prompt 4: My Status Screen with Live Alerts
> "After Confirm, give a token (S-1, S-2…) and open My Status. Show position and estimated wait using the rule in docs/03-flows-rules.md. Add the 'Start coming' and 'It's your turn' states."
- **Action**: Built `MyStatus.tsx` featuring large token `#S-X`, position in line, estimated wait countdown, banner when 2nd in line ("Start coming to the salon!"), full-screen radiant gold alert when called ("It's your turn! Go to {barber}"), synthesized Web Audio chime, and cancellation modal for `Waiting` status.

---

### Prompt 5: Reception Dashboard & Barber View
> "Build the Reception Dashboard and Barber View. Customers who join from a phone must appear automatically. Call next must follow the barber-preference rules exactly. Start/Done and On break must update Reception, TV and customer phone within 5 seconds."
- **Action**: Built `ReceptionDashboard.tsx` (tablet/desktop layout) with barber station status cards, live waiting queue with >60m amber warning, call next button, no-show and cancel actions, and walk-in entry modal. Built `BarberView.tsx` with current customer details, running service timer, Start/Done buttons, next customer preview, and break toggle.

---

### Prompt 6: Waiting Area TV Display (1080p)
> "Build the Now Serving display (Screen 6) for a 1920×1080 TV. Text readable from 5 metres. Newly ready/called tokens blink for 5 seconds."
- **Action**: Built `WaitingDisplay.tsx` featuring high-contrast dark charcoal + gold typography, live clock, barber stations showing current serving tokens, "Up Next" list of next 5 tokens with estimated wait times, and a 5-second gold flashing animation with audio chime when a token is called.

---

### Prompt 7: Owner Settings & Admin Management
> "Build Screen 7. Services list (name EN/GU, minutes, price, on/off), Barbers on duty today toggle, Queue switch: Open/Closed for online joining, today's summary cards."
- **Action**: Built `OwnerSettings.tsx` with real-time metric cards (Customers Served, Today's Revenue, Average Wait Time, No-Shows), global online queue toggle, barber duty toggles, and full CRUD modal for services catalog with English/Gujarati translations.

---

### Prompt 8: End-to-End Verification & Automated Test Suite
> "Perform a complete end-to-end audit using docs/03-flows-rules.md. Test customer ordering, token generation, daily reset, cancellation, quantity limits, sold-out handling, status transitions, collected orders, TV display, admin CRUD, time restrictions, persistence, and synchronization across multiple windows."
- **Action**: Developed 11 automated unit and integration tests covering token sequence, forward-only status machine, barber preference preservation, phone deduplication, 3-service limit, phone validation, and online queue open/close enforcement. All 11 tests passed with zero failures.
