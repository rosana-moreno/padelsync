# Padelsync V1

Padelsync is a **local-only** tournament management web app for padel organizers.  
V1 focuses on **single-category tournaments**, an **organizer-only flow**, and **no backend**.

This repository contains the **foundational baseline** of the product: core domain models, local persistence, routing and layout scaffolding, and documentation for future phases.

---

## V1 Baseline Summary

This repository represents the **V1 baseline** of Padelsync.  
It consolidates **Phase 1 (foundation)** and **Phase 1.1 (domain model extensions)** into a single initial version.

### Phase 1 — Foundation
- Vite + React + TypeScript project setup
- Tailwind CSS + shadcn/ui base components
- React Router wiring (3 routes)
- Layout scaffolding (Header + Layout)
- Core domain types and utilities
- `localStorage` abstraction (full tournaments + summaries)
- `useTournament` hook for loading and syncing tournament state

### Phase 1.1 — Domain Model Extension
- Added required fields:
  - `Tournament.location`
    - `clubName`
    - `address`
    - `phone`
    - `contactPerson?` (optional)
  - `Player.phone`
- Storage schema version set to **v1.1**
- `loadTournament()` safely normalizes missing `location` and `phone` fields

### Documentation
- `ARCHITECTURE_V1.md` — architecture overview
- `IMPLEMENTATION_PLAN_V1.md` — phased delivery plan

### Scope Guarantees
- No business rule enforcement yet
- No Phase 2 UI flows implemented
- Tournament summaries and full tournament data remain in sync

---

## V1 Scope

### Included
- Single-category tournaments
- Organizer-only workflow (no authentication)
- Player and pair management
- Round-robin match generation
- Manual “start tournament” flow
- Rankings based on win/loss
- Local persistence via `localStorage`

### Not Included
- Backend or database
- Authentication or permissions
- Payments
- Multi-category tournaments
- Advanced match scheduling logic
- Deployment configuration

---

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- lucide-react
- Local persistence via `localStorage` (schema-versioned)

---

## Local Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Install
```bash
npm install
