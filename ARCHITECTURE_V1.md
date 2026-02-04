# Padelsync V1 Architecture Proposal

**Status:** Exploration & Planning  
**Date:** 2024  
**Scope:** Single-category tournaments, organizer-only, local-only persistence

---

## 1. Proposed Frontend Architecture

### High-Level Folder Structure

```
padelsync/
├── src/
│   ├── main.tsx                 # App entry point
│   ├── App.tsx                  # Root component, routing setup
│   ├── index.css                # Global styles + Tailwind imports
│   │
│   ├── pages/                   # Route-level components
│   │   ├── TournamentList.tsx   # Home: list of tournaments
│   │   ├── TournamentDetail.tsx # Single tournament view
│   │   └── CreateTournament.tsx # New tournament creation
│   │
│   ├── components/              # Shared UI components
│   │   ├── ui/                  # shadcn/ui components (Button, Card, etc.)
│   │   ├── layout/              # Layout components
│   │   │   ├── Header.tsx
│   │   │   └── Layout.tsx
│   │   ├── tournament/          # Tournament-specific components
│   │   │   ├── TournamentCard.tsx
│   │   │   ├── PlayerList.tsx
│   │   │   ├── PlayerForm.tsx
│   │   │   ├── PairList.tsx
│   │   │   ├── PairEditor.tsx
│   │   │   ├── GenerateMatchesButton.tsx
│   │   │   ├── MatchList.tsx
│   │   │   ├── MatchCard.tsx
│   │   │   └── RankingsTable.tsx
│   │   └── common/              # Generic reusable components
│   │       ├── LoadingSpinner.tsx
│   │       └── EmptyState.tsx
│   │
│   ├── lib/                     # Utilities & helpers
│   │   ├── storage.ts           # localStorage abstraction
│   │   ├── types.ts             # Shared TypeScript types
│   │   └── utils.ts             # Helper functions
│   │
│   ├── hooks/                   # Custom React hooks
│   │   ├── useTournament.ts     # Tournament state management
│   │   ├── useLocalStorage.ts   # Generic localStorage hook
│   │   ├── useRankings.ts       # Rankings calculation logic
│   │   └── useMatchGeneration.ts # Round robin match generation logic
│   │
│   └── assets/                  # Static assets
│       └── icons/               # Lucide icons (if custom)
│
├── public/
│   └── vite.svg
│
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

### Routing Strategy

**Approach:** React Router (v6) with client-side routing

**Routes:**
- `/` → TournamentList (home page)
- `/tournament/:id` → TournamentDetail (main tournament view)
- `/tournament/new` → CreateTournament (new tournament form)

**Rationale:**
- Simple, flat routing structure for V1
- No nested routes needed yet (can add later for match details, etc.)
- Direct URL access to tournaments supports bookmarking

### Component Boundaries

**Pages (Route Components):**
- Own the route-level state
- Orchestrate data fetching/hydration
- Compose feature components

**Feature Components (`components/tournament/`):**
- Domain-specific UI (PlayerList, MatchList, etc.)
- Receive data via props
- Emit events via callbacks

**UI Components (`components/ui/`):**
- Pure presentational components (shadcn/ui)
- No business logic
- Reusable across features

**Layout Components:**
- Header, navigation, page wrappers
- Consistent app shell

### State Ownership

**Tournament State:**
- Lives in `useTournament` hook
- Manages single tournament data (players, pairs, matches)
- Syncs to localStorage on changes
- Used by TournamentDetail page

**Tournament List State:**
- Lives in TournamentList page component
- Manages array of tournament summaries
- Loaded from localStorage on mount

**Local State (Forms, UI):**
- Component-level `useState` for:
  - Form inputs
  - Modal open/close
  - Temporary UI state

**No Global State Management:**
- No Zustand/Redux for V1
- Props drilling acceptable for V1 scope
- Can refactor later if needed

---

## 2. Core Data Models

### TypeScript Types/Interfaces

```typescript
// lib/types.ts

/**
 * Unique identifier for entities
 */
type ID = string;

/**
 * Tournament status lifecycle
 * Used for UI and lifecycle only, does not override tournamentStarted rules
 */
type TournamentStatus = 'draft' | 'in_progress' | 'completed';

/**
 * Player registration type
 */
type RegistrationType = 'singles' | 'pair';

/**
 * Match status
 */
type MatchStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

/**
 * Match result (winner)
 */
type MatchResult = 'pair1' | 'pair2' | null;

/**
 * Player entity
 * Represents a single person who can participate
 */
interface Player {
  id: ID;
  name: string;
  phone: string; // REQUIRED
  email?: string; // Optional for V1, may be used for contact
  gender?: 'female' | 'male'; // Optional
  courtPosition?: 'drive' | 'backhand' | 'indifferent'; // Optional
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

/**
 * Pair entity
 * Represents two players playing together
 * Can be pre-made (both players specified) or auto-generated (one player, waiting for partner)
 */
interface Pair {
  id: ID;
  player1Id: ID; // Required
  player2Id: ID; // Required
  createdAt: string;
  updatedAt: string;
  // Denormalized for display (optional, can be computed)
  player1Name?: string;
  player2Name?: string;
}

/**
 * Match entity
 * 4 players total: 2 pairs competing
 * scheduledDate and scheduledTime are REQUIRED fields
 */
interface Match {
  id: ID;
  tournamentId: ID;
  pair1Id: ID; // First pair
  pair2Id: ID; // Second pair
  status: MatchStatus;
  scheduledDate: string; // ISO date string (REQUIRED)
  scheduledTime: string; // HH:mm format (REQUIRED)
  result: MatchResult; // null until completed
  score?: string; // Free-form text for now (e.g., "6-4, 6-2")
  completedAt?: string; // ISO timestamp
  createdAt: string;
  updatedAt: string;
}

/**
 * Tournament entity
 * Root aggregate for V1
 */
interface Tournament {
  id: ID;
  name: string;
  description?: string;
  status: TournamentStatus;
  location: {
    clubName: string; // REQUIRED
    address: string; // REQUIRED (used for maps later)
    phone: string; // REQUIRED
    contactPerson?: string; // OPTIONAL
  };
  createdAt: string;
  updatedAt: string;
 
  // ID-based relationships (global players)
  playerIds: ID[];
  waitingListIds: ID[];
  pairs: Pair[];
  matches: Match[];
  
  // Metadata
  settings?: {
    allowAutoPairing?: boolean; // Can app auto-generate pairs?
    maxPlayers?: number; // Max players per tournament (defined by admin, activates waiting list when exceeded)
  };
}

/**
 * Rankings calculation result
 * Derived data, not stored (computed on demand)
 */
interface RankingsEntry {
  pairId: ID;
  pairName: string; // Computed from player names
  wins: number;
  losses: number;
  matchesPlayed: number;
  winRate: number; // wins / matchesPlayed
  // Future: points, sets won/lost, etc.
}

/**
 * Tournament summary (for list view)
 * Lightweight version for performance
 */
interface TournamentSummary {
  id: ID;
  name: string;
  status: TournamentStatus;
  playerCount: number;
  matchCount: number;
  createdAt: string;
}
```

### Design Decisions

**1. Pair as Separate Entity:**
- **Decision:** Yes, separate `Pair` entity
- **Rationale:**
  - Players can exist without pairs (singles registration)
  - Pairs can be edited independently
  - Matches reference pairs, not individual players
  - Supports auto-pairing workflow (one player → pair with null partner)

**2. Embedded vs Referenced:**
- **Decision:** Referenced players (IDs) in Tournament
- **Rationale:**
  - Players are global across tournaments
  - Tournaments store only IDs for registration + waiting list
  - Pairs remain tournament-scoped

**3. Rankings: Derived vs Stored:**
- **Decision:** Derived (computed on demand)
- **Rationale:**
  - Rankings change when matches are added/updated
  - Storing would require invalidation logic
  - Computation is cheap for V1 scale
  - Can cache later if performance becomes issue

**4. Match Result Type:**
- **Decision:** Simple `'pair1' | 'pair2' | null`
- **Rationale:**
  - V1 doesn't need detailed scoring breakdown
  - Score is free-form text for flexibility
  - Can add structured scoring later

**5. Tournament Start Definition:**
- **Decision:** `tournamentStarted = matches.length > 0`
- **Rationale:**
  - Simple, unambiguous trigger
  - Once any match exists, tournament has started
  - Used to enforce business rules (see Business Rules section)

**6. Match Generation Format:**
- **Decision:** Round Robin (each pair plays every other pair once)
- **Rationale:**
  - Simple, fair format for V1
  - All pairs get equal opportunity
  - Easy to understand and implement
  - Future formats (elimination, Swiss, etc.) can be added later

---

## 3. State & Persistence Strategy

### Where State Lives

**Tournament Data:**
- Primary: `useTournament(tournamentId)` hook
- Loads from localStorage on mount
- Updates localStorage on every mutation
- Returns `{ tournament, updateTournament, addPlayer, ... }` interface

**Tournament List:**
- Primary: `TournamentList` page component
- Loads all tournament summaries on mount
- Creates new tournaments via form → saves → navigates to detail

**Form State:**
- Local component state (`useState`)
- Not persisted until submitted

### localStorage Strategy

**Storage Keys:**
```
padelsync_tournaments        → Array<TournamentSummary>
padelsync_tournament_{id}    → Tournament (full object)
padelsync_players            → Array<Player>
padelsync_version            → "1.1" (for future migrations)
```

**DEV Seed Helpers (V1):**
- DEV-only seed helpers create demo tournaments + players using fixed IDs
- Demo data is created via storage helpers (same plumbing as real usage)
- Idempotent + non-destructive (no duplicates, no overwrites)

**Storage Structure:**
- One key per tournament (for performance)
- Summary list for quick loading
- Version key for future migration support

**Hydration Flow:**

1. **App Bootstrap (`App.tsx`):**
   ```typescript
   // Pseudo-code
   - Check localStorage version
   - If version mismatch → run migration (future)
   - Load tournament summaries
   - Initialize routing
   ```

2. **Tournament Detail Page:**
   ```typescript
   // Pseudo-code
   - useTournament(id) hook called
   - Hook checks localStorage for `padelsync_tournament_{id}`
   - If found → parse JSON, return tournament
   - If not found → return null (show 404)
   - Subscribe to updates → sync to localStorage
   ```

3. **Updates:**
   ```typescript
   // Pseudo-code
   - User action (add player, create match, etc.)
   - Update React state via hook
   - useEffect watches state changes
   - On change → JSON.stringify → localStorage.setItem
   - Update tournament summary if needed
   ```

### Safety & Versioning

**Versioning Approach:**
- Simple version string in localStorage
- V1: `"1.1"`
- Future: Check version on load, run migration if needed

**Corruption Prevention:**
- Try-catch around all localStorage operations
- Validate JSON before parsing
- Fallback to empty state if corruption detected
- Log errors (console.error for V1)

**Breaking Changes:**
- V1: No migrations needed (fresh start)
- Future: Version check → migration function
- Migration pattern:
  ```typescript
  if (version < "2.0") {
    migrateV1ToV2(data);
  }
  ```

**Update Safety:**
- Atomic updates: replace entire tournament object
- No partial updates to avoid inconsistency
- Summary list updated separately (can be async)

---

## 3.5. Business Rules

### Tournament Start Definition

**Rule:** `tournamentStarted = matches.length > 0`

- Tournament is considered "started" when at least one match exists
- This is a computed property, not stored in the database
- Used to enforce player and pair editing rules

### Player & Pair Management Rules

**Before Tournament Started (`matches.length === 0`):**
- ✅ Admin can remove players
- ✅ Admin can replace players (new player or from waiting list)
- ✅ Admin can edit or dissolve pairs freely

**After Tournament Started (`matches.length > 0`):**
- ❌ Admin cannot remove players
- ❌ Admin cannot edit pair composition
- ✅ Admin can only replace players at the match level (when editing individual matches)

### Match Scheduling Rules

- `scheduledDate` and `scheduledTime` are **REQUIRED** fields
- Matches **cannot be created** without both date and time
- Admin can edit date/time at any time (even after match completion)

### Tournament Status

- Status values: `'draft' | 'in_progress' | 'completed'`
- **If matches exist (`matches.length > 0`), tournament status MUST be `in_progress`**
- Status transitions:
  - `draft` → `in_progress` automatically when the first match is created
  - `completed` is set manually by the admin
- Used for UI display and lifecycle tracking only
- **Does not override** `tournamentStarted` rules

### Waiting List Rules

- Waiting list = players exceeding `maxPlayers` (if `settings.maxPlayers` is set)
- Order is FIFO (first-in, first-out)
- Promotion is manual only (admin action required)
- Promotion can:
  - Create a new pair (if two players are promoted)
  - Fill an incomplete pair (if one player is promoted to an existing incomplete pair)

### Rankings Rules

- Rankings in V1 are based only on win/loss record
- Match `score` field is optional, free-form text, and not used in rankings calculation
- Future versions may extend rankings logic to include points, sets won/lost, etc.

### Match Generation Rules (V1)

**Tournament Format:**
- Round Robin format (each pair plays every other pair once)

**Trigger:**
- Match generation is triggered manually by the admin via a "Generate Matches" button
- Button is only visible/enabled when preconditions are met

**Preconditions:**
- Tournament has not started (`matches.length === 0`)
- Required minimum players/pairs exist (minimum depends on round robin requirements)

**On Generation:**
- System creates all matches for the round robin tournament
- Tournament status automatically transitions to `in_progress`
- All matches are created with required `scheduledDate` and `scheduledTime` (admin must set these after generation, or system can use defaults)

**Pair Completion:**
- Incomplete pairs may be auto-completed by the system during match generation
- V1 uses naive/simple logic (no optimization)
- Partner assignment rules (drive/revés/preferences) are explicitly **OUT OF SCOPE** for V1 and deferred

### Tournament Limits Rules

- **No limit on number of tournaments** (admin can create unlimited tournaments)
- **Max players per tournament** is defined by admin via `settings.maxPlayers`
- **Waiting list activates** when players exceed `maxPlayers`
- If `maxPlayers` is not set, there is no limit and no waiting list

---

## 4. Open Questions / Ambiguities

### Resolved Questions ✅

1. **Player Removal:** ✅ **RESOLVED**
   - Before tournament started: Admin can remove players
   - After tournament started: Admin cannot remove players
   - See Business Rules section (3.5)

2. **Pair Editing:** ✅ **RESOLVED**
   - Before tournament started: Admin can edit or dissolve pairs freely
   - After tournament started: Admin cannot edit pair composition
   - See Business Rules section (3.5)

3. **Match Scheduling:** ✅ **RESOLVED**
   - `scheduledDate` and `scheduledTime` are REQUIRED fields
   - Matches cannot be created without both
   - Admin can edit date/time at any time
   - See Business Rules section (3.5)

4. **Tournament Status:** ✅ **RESOLVED**
   - Status: `'draft' | 'in_progress' | 'completed'`
   - If matches exist, status MUST be `in_progress` (automatic transition)
   - `completed` is set manually by admin
   - Used for UI/lifecycle only, does not override `tournamentStarted` rules
   - See Business Rules section (3.5)

5. **Waiting List:** ✅ **RESOLVED**
   - Waiting list = players exceeding `maxPlayers` (if set)
   - Order is FIFO, promotion is manual only
   - Can create new pair or fill incomplete pair
   - See Business Rules section (3.5)

6. **Score Entry:** ✅ **RESOLVED**
   - Rankings based only on win/loss in V1
   - Score is optional, free-form, not used in rankings
   - See Business Rules section (3.5)

7. **Match Generation:** ✅ **RESOLVED**
   - Tournament format: Round Robin
   - Triggered manually by admin via "Generate Matches" button
   - Preconditions: tournament not started, minimum players/pairs exist
   - On generation: creates all round robin matches, status auto-transitions to `in_progress`
   - Incomplete pairs may be auto-completed (naive logic, no optimization)
   - Partner assignment rules (drive/revés/preferences) OUT OF SCOPE for V1
   - See Business Rules section (3.5)

8. **Tournament Limits:** ✅ **RESOLVED**
   - No limit on number of tournaments
   - Max players per tournament defined by admin (`settings.maxPlayers`)
   - Waiting list activates when players exceed `maxPlayers`
   - See Business Rules section (3.5)

### Remaining Questions

None - all product questions resolved.

### Technical Questions

9. **Routing:**
   - Should we use React Router or simpler state-based navigation?
   - **Assumption:** React Router for URL support

10. **Error Handling:**
    - How should we surface localStorage errors to user?
    - Toast notifications? Inline errors?
    - **Assumption:** Simple alert/toast for V1

11. **Data Validation:**
    - Should we validate data on load? (e.g., required fields)
    - What happens with invalid data?
    - **Assumption:** Basic validation, graceful degradation

---

## 5. Risks & Future-Proofing Notes

### Known Risks

**1. Player Removal After Matches Exist:**
- **Risk:** Removing player breaks match references
- **Mitigation:** ✅ **RESOLVED**
  - Prevent removal after tournament started (`matches.length > 0`)
  - UI should disable remove button when tournament has started
  - See Business Rules section (3.5)

**2. Pair Editing After Matches:**
- **Risk:** Changing pair composition invalidates match results
- **Mitigation:** ✅ **RESOLVED**
  - Lock pair editing after tournament started (`matches.length > 0`)
  - UI should disable pair editing when tournament has started
  - See Business Rules section (3.5)

**3. Match Scheduling Validation:**
- **Risk:** Creating matches without required date/time
- **Mitigation:** ✅ **RESOLVED**
  - Form validation: require both `scheduledDate` and `scheduledTime`
  - TypeScript types enforce required fields
  - See Business Rules section (3.5)

**4. localStorage Size Limits:**
- **Risk:** Large tournaments exceed 5-10MB limit
- **Mitigation:**
  - Monitor size (estimate: ~1KB per match)
  - Warn if approaching limit
  - Future: pagination or compression

**5. Concurrent Edits (Multiple Tabs):**
- **Risk:** User opens same tournament in two tabs, edits conflict
- **Mitigation:**
  - V1: Last write wins (acceptable for organizer-only)
  - Future: Add timestamp-based conflict resolution

**6. Rankings Consistency:**
- **Risk:** Rankings calculated incorrectly if data changes
- **Mitigation:**
  - Recalculate on every render (acceptable for V1 scale)
  - Memoize if performance issues arise

**7. Data Loss on Browser Clear:**
- **Risk:** User clears localStorage → all data lost
- **Mitigation:**
  - V1: Acceptable risk (organizer-only, local tool)
  - Future: Export/import feature

**8. Browser Compatibility:**
- **Risk:** localStorage not available (private mode, old browsers)
- **Mitigation:**
  - Check availability on load
  - Show error message if unavailable
  - Fallback to in-memory only (with warning)

### Future-Proofing Notes

**What We're NOT Solving (Deferred):**

1. **Multi-category tournaments** — V1 is single-category only
2. **Player accounts/auth** — V1 is organizer-only
3. **Backend/database** — V1 is local-only
4. **Real-time collaboration** — V1 is single-user
5. **Advanced match generation** — V1 uses Round Robin with naive pair completion; optimization, drive/revés preferences, and other formats deferred
6. **Detailed scoring** — Free-form text for V1, not used in rankings
7. **Tournament templates** — Manual creation only
8. **Export/import** — Not in V1 scope
9. **Mobile optimization** — Desktop-first for V1
10. **Offline PWA** — Basic localStorage only
11. **Partner assignment optimization** — Drive/revés/preferences rules explicitly OUT OF SCOPE for V1

**Assumptions Made:**

1. **Single organizer** — No multi-user concerns
2. **Desktop browser** — Mobile not prioritized
3. **Modern browser** — ES6+, localStorage support
4. **Small-to-medium tournaments** — <100 players, <50 matches
5. **Manual match entry** — Organizer enters results manually
6. **No real-time requirements** — Data only persists on refresh

**Migration Path Considerations:**

- Version key in localStorage for future migrations
- Tournament structure is self-contained (easy to extract)
- Can move to backend later by:
  - Adding API layer
  - Replacing `useTournament` hook implementation
  - Keeping same data models

---

## Summary

This architecture provides:

✅ **Clean separation** of pages, components, and logic  
✅ **Simple state management** via hooks (no Zustand needed)  
✅ **Robust persistence** with localStorage + versioning  
✅ **Type-safe data models** with TypeScript  
✅ **Scalable structure** that can grow without major refactors  

**Next Steps:**
1. ✅ All product questions resolved
2. Confirm routing approach
3. Validate data model decisions
4. Proceed to implementation plan

---

**Status:** ✅ Exploration complete. All business rules and product decisions finalized. Ready for implementation planning.
