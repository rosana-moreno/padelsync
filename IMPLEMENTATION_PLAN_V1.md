# Padelsync V1 Implementation Plan

**Overall Progress:** `28%` (2 of 7 phases complete)

## TLDR

Build Padelsync V1: a React + TypeScript tournament management app with local-only persistence. Single-category Round Robin tournaments, organizer-only interface. Core features: player/pair management, match generation, tournament lifecycle, rankings. Desktop-first, no backend, no auth.

---

## Critical Decisions

Key architectural/implementation choices based on confirmed product rules:

- **Tournament Start Control:** Manual "Start Tournament" button (not automatic on match creation) - status transitions to `in_progress` only on explicit admin action
- **playersLocked Flag:** New boolean flag controls structural edits (players, pairs, match regeneration) - becomes `true` when tournament starts, irreversible
- **Match Generation Timing:** Allowed only when `status === 'draft'` AND `playersLocked === false` - destructive regeneration with confirmation
- **Status vs matches.length:** Status is independent of match count - can have matches in `draft` status until "Start Tournament" is clicked
- **Persistence Strategy:** localStorage with versioning - one key per tournament + summary list
- **State Management:** React hooks only (no Zustand/Redux) - `useTournament` hook manages tournament state
- **Waiting List Promotion:** Manual replacement UI required - admin can replace players with waiting list members (NOT deferred)

---

## Phase 1: Project Setup, Types & State Foundation

**Goal:** Initialize project infrastructure, define all TypeScript types, and create tournament state management hook.

**Status:** 🟩 **DONE**

**Phase 1 Accepted:** ✅ All deliverables implemented. Project infrastructure, TypeScript types, localStorage abstraction, and tournament state management hook are complete and stable. Storage consistency bug fixed (summaries auto-sync). Ready for Phase 2.

**Phase 1.1: Domain Model Extension (Location & Contact Info)**  
✅ Added required `Player.phone` and required `Tournament.location` fields. Storage version bumped to `1.1` and load normalization ensures safe defaults for missing fields.

**Scope:**
- 🟩 Vite + React + TypeScript setup
- 🟩 Tailwind CSS configuration
- 🟩 shadcn/ui initialization and base components
- 🟩 React Router setup with 3 routes
- 🟩 Basic folder structure per ARCHITECTURE_V1.md
- 🟩 localStorage abstraction utilities
- 🟩 All type definitions from ARCHITECTURE_V1.md
- 🟩 Add `playersLocked: boolean` to Tournament interface
- 🟩 TournamentStatus type ('draft' | 'in_progress' | 'completed')
- 🟩 Player, Pair, Match, Tournament interfaces
- 🟩 RankingsEntry interface
- 🟩 TournamentSummary interface
- 🟩 Helper types (ID, MatchStatus, MatchResult, etc.)
- 🟩 `useTournament(tournamentId)` hook
- 🟩 Load from localStorage on mount
- 🟩 Sync to localStorage on state changes
- 🟩 Provide tournament data and mutation functions
- 🟩 Handle missing tournament (404 case)
- 🟩 Atomic updates (replace entire tournament object)
- ❌ No business rule validation yet
- ❌ No UI components yet

**Key Components/Files:**
- `package.json` - Dependencies (react, react-router-dom, typescript, tailwind, etc.)
- `vite.config.ts` - Vite configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.js` - Tailwind setup
- `src/main.tsx` - App entry point
- `src/App.tsx` - Router setup
- `src/index.css` - Global styles + Tailwind imports
- `src/pages/` - Route components (TournamentList, TournamentDetail, CreateTournament) - skeletons
- `src/components/layout/` - Header, Layout components
- `src/components/ui/` - shadcn/ui base components (Button, Card, etc.)
- `src/lib/storage.ts` - localStorage abstraction
- `src/lib/types.ts` - All type definitions
- `src/lib/utils.ts` - Helper functions
- `src/hooks/useTournament.ts` - Main tournament state hook
- Helper functions for tournament CRUD operations

**Main Risks & Mitigations:**
- **Risk:** shadcn/ui setup complexity
  - **Mitigation:** Follow official shadcn/ui installation docs, test base components early
- **Risk:** TypeScript configuration issues
  - **Mitigation:** Use standard React + TypeScript + Vite template, verify types compile
- **Risk:** Missing required fields from architecture
  - **Mitigation:** Cross-reference ARCHITECTURE_V1.md section 2 line-by-line
- **Risk:** Type mismatches with localStorage serialization
  - **Mitigation:** Ensure all types are JSON-serializable (no functions, Dates as strings)
- **Risk:** localStorage sync race conditions
  - **Mitigation:** Use useEffect with proper dependencies, single source of truth
- **Risk:** Data corruption on failed writes
  - **Mitigation:** Try-catch around all localStorage operations, validate JSON

---

## Phase 2: Tournament List, Creation & Basic UI

**Goal:** Implement tournament list page, tournament creation flow, and basic tournament detail skeleton.

**Status:** 🟩 **DONE**

**Phase 2 Accepted:** ✅ Tournament list, creation flow, detail skeleton, and supporting components are complete. Sorting by `tournamentDate` is implemented and dev-only seed data is available. No player/pair/match features have started (Phase 3 not started).

**Scope:**
- ✅ TournamentList page - displays all tournaments
- ✅ CreateTournament page - form to create new tournament
- ✅ TournamentCard component - displays tournament summary
- ✅ Load tournament summaries from localStorage
- ✅ Create new tournament → save → navigate to detail
- ✅ Basic tournament settings (name, description, tournamentDate, maxPlayers, location: clubName/address/phone/contactPerson)
- ✅ TournamentDetail page skeleton - main tournament view structure
- ✅ Basic layout and navigation
- ✅ Sort by tournamentDate (upcoming first)
- ✅ Required tournamentDate
- ✅ Location fields: clubName/address required; phone optional; contactPerson optional
- ✅ Dev-only seed demo data (idempotent, non-destructive)
- ❌ No player/pair management yet
- ❌ No match features yet

**Key Components/Files:**
- `src/pages/TournamentList.tsx` - Home page with tournament list
- `src/pages/CreateTournament.tsx` - New tournament form
- `src/pages/TournamentDetail.tsx` - Main tournament view (skeleton)
- `src/components/tournament/TournamentCard.tsx` - Tournament summary card
- `src/components/ui/` - Form components (Input, Button, Card)
- Update `src/lib/storage.ts` - Tournament summary list management

**Main Risks & Mitigations:**
- **Risk:** Form validation missing required fields
  - **Mitigation:** Add basic validation (name required, maxPlayers must be positive integer if set)
- **Risk:** Duplicate tournament names
  - **Mitigation:** Allow duplicates for V1 (can add validation later if needed)
- **Risk:** Navigation not working after creation
  - **Mitigation:** Test navigation flow, ensure tournament ID is generated correctly

---

## Phase 3: Player & Pair Management with Waiting List

**Goal:** Implement complete player and pair management including waiting list display and manual player replacement.

**Scope:**
- ✅ PlayerList component - displays all players
- ✅ PlayerForm component - add new player
- ✅ Waiting list display (players exceeding maxPlayers)
- ✅ FIFO waiting list ordering
- ✅ Remove player functionality
- ✅ Manual player replacement - admin can replace a player with someone from waiting list
- ✅ Replacement UI (select player to replace, select replacement from waiting list)
- ✅ PairList component - displays all pairs
- ✅ PairEditor component - create/edit pairs
- ✅ Support incomplete pairs (player2Id === null)
- ✅ Auto-pairing UI (create pair from single player)
- ✅ Display pair names (computed from player names)
- ✅ Enforce playersLocked rule (disable editing when locked)
- ✅ Visual indicators for locked state
- ❌ No match generation yet
- ❌ No pair completion logic yet (deferred to match generation)

**Key Components/Files:**
- `src/components/tournament/PlayerList.tsx` - Player list with waiting list section
- `src/components/tournament/PlayerForm.tsx` - Add player form
- `src/components/tournament/PlayerReplacement.tsx` - Replace player UI (select player + waiting list member)
- `src/components/tournament/PairList.tsx` - Pair list display
- `src/components/tournament/PairEditor.tsx` - Create/edit pair form/modal
- `src/components/ui/` - List, Badge, Select components
- Update `src/hooks/useTournament.ts` - Add player/pair mutation functions including replacePlayer
- Helper functions to compute pair names from player IDs

**Main Risks & Mitigations:**
- **Risk:** playersLocked check not enforced
  - **Mitigation:** Disable UI controls when `playersLocked === true`, add validation in hook
- **Risk:** Waiting list calculation incorrect
  - **Mitigation:** Calculate based on `players.length > settings.maxPlayers`, test edge cases (no maxPlayers, exact match)
- **Risk:** Player removal breaks references
  - **Mitigation:** Prevent removal when `playersLocked === true`, validate in hook
- **Risk:** Player replacement not updating all references
  - **Mitigation:** Update player ID in all pairs that reference the replaced player, validate references
- **Risk:** Pair editing allowed when playersLocked
  - **Mitigation:** Disable edit controls, validate in hook, show clear message
- **Risk:** Incomplete pairs not clearly displayed
  - **Mitigation:** Visual indicator (badge/icon) for incomplete pairs, show "Waiting for partner"

---

## Phase 4: Match Generation & Display

**Goal:** Implement Round Robin match generation with preconditions, confirmation, and match list display.

**Scope:**
- ✅ GenerateMatchesButton component
- ✅ Round Robin algorithm (each pair plays every other pair once)
- ✅ Precondition checks (status === 'draft', playersLocked === false, minimum pairs exist)
- ✅ Confirmation dialog before generation
- ✅ Destructive regeneration (clear existing matches)
- ✅ Regeneration confirmation (warn about clearing existing matches)
- ✅ Auto-complete incomplete pairs (naive logic)
- ✅ Create matches with required scheduledDate/scheduledTime (defaults)
- ✅ Update tournament matches array
- ✅ MatchList component - displays all matches
- ✅ MatchCard component - individual match display
- ✅ Show pair names, scheduled date/time
- ✅ Match status display
- ✅ Sort matches by scheduled date/time
- ❌ No match result entry yet
- ❌ No match editing yet

**Key Components/Files:**
- `src/components/tournament/GenerateMatchesButton.tsx` - Button with confirmation
- `src/hooks/useMatchGeneration.ts` - Round Robin algorithm
- `src/components/tournament/MatchList.tsx` - Match list container
- `src/components/tournament/MatchCard.tsx` - Individual match card
- `src/lib/utils.ts` - Helper functions for pair combinations, match sorting
- Update `src/hooks/useTournament.ts` - Add generateMatches function
- Dialog component from shadcn/ui for confirmation

**Main Risks & Mitigations:**
- **Risk:** Round Robin algorithm incorrect
  - **Mitigation:** Test with small examples (3 pairs = 3 matches, 4 pairs = 6 matches), verify no duplicate matches
- **Risk:** Incomplete pairs not handled
  - **Mitigation:** Auto-complete with naive logic (first available player), log warnings for edge cases
- **Risk:** Matches created without date/time
  - **Mitigation:** Use default date/time (today + sequential times, or require admin input before generation)
- **Risk:** Regeneration allowed when it shouldn't be
  - **Mitigation:** Check `status === 'draft'` AND `playersLocked === false` before enabling button
- **Risk:** Date/time display formatting
  - **Mitigation:** Use date formatting library or native Intl.DateTimeFormat, handle timezone consistently
- **Risk:** Performance with many matches
  - **Mitigation:** Acceptable for V1 scale, can virtualize later if needed

---

## Phase 5: Tournament Lifecycle, Start Button & Match Results

**Goal:** Implement tournament start button, lifecycle management, and match result entry.

**Scope:**
- ✅ StartTournamentButton component
- ✅ Enabled only when matches exist
- ✅ On click: status → 'in_progress', playersLocked → true
- ✅ One-way transition (irreversible)
- ✅ Disable player/pair editing when locked
- ✅ Visual indicators for locked state
- ✅ Status display/indicator
- ✅ Manual status change to 'completed' (when in_progress)
- ✅ Visual status indicators (badges)
- ✅ Prevent invalid status transitions
- ✅ Match result entry UI (select winner: pair1 or pair2)
- ✅ Optional score field (free-form text)
- ✅ Update match result and score
- ✅ Mark match as completed
- ✅ Only allow result entry when tournament is in_progress
- ❌ No rankings calculation yet

**Key Components/Files:**
- `src/components/tournament/StartTournamentButton.tsx` - Button component
- Update `src/components/tournament/MatchCard.tsx` - Add result entry form
- Update `src/hooks/useTournament.ts` - Add startTournament, updateStatus, updateMatchResult functions
- Update `src/pages/TournamentDetail.tsx` - Add start button, status display/control
- Update PlayerList, PairList - Show locked state visually
- `src/components/ui/` - Badge, Select, Input components

**Main Risks & Mitigations:**
- **Risk:** Start Tournament clicked when no matches
  - **Mitigation:** Disable button when `matches.length === 0`, show tooltip explaining why
- **Risk:** playersLocked not persisted
  - **Mitigation:** Ensure playersLocked is saved to localStorage, verify on reload
- **Risk:** Structural edits still possible after start
  - **Mitigation:** Disable all edit controls, validate in hook functions, show clear locked message
- **Risk:** Invalid status transitions allowed
  - **Mitigation:** Only allow 'in_progress' → 'completed', validate in hook
- **Risk:** Result entry allowed when tournament not started
  - **Mitigation:** Only show result entry when `status === 'in_progress'`, validate in hook
- **Risk:** Match result overwritten accidentally
  - **Mitigation:** Show confirmation or clear visual indicator when result exists, allow editing
- **Risk:** Score format confusion
  - **Mitigation:** Label as "optional", show example format in placeholder, don't validate format

---

## Phase 6: Rankings, Polish & Edge Cases

**Goal:** Calculate and display rankings, handle edge cases, improve UX with loading/error states.

**Scope:**
- ✅ useRankings hook - calculate rankings from matches
- ✅ RankingsTable component - display rankings
- ✅ Calculate wins, losses, matches played, win rate
- ✅ Sort by win rate (or wins if tie)
- ✅ Handle pairs with no matches (0 matches played)
- ✅ Rankings based ONLY on win/loss (score ignored)
- ✅ Loading states (spinner while loading tournament)
- ✅ Error states (tournament not found, localStorage error)
- ✅ Empty states (no tournaments, no players, no matches)
- ✅ Form validation feedback
- ✅ Confirmation dialogs where needed
- ✅ Responsive layout (desktop-first)
- ✅ Basic error boundaries
- ❌ No advanced tie-breaking yet
- ❌ No mobile optimization
- ❌ No advanced error recovery

**Key Components/Files:**
- `src/hooks/useRankings.ts` - Rankings calculation logic
- `src/components/tournament/RankingsTable.tsx` - Rankings display
- `src/components/common/LoadingSpinner.tsx` - Loading indicator
- `src/components/common/EmptyState.tsx` - Empty state messages
- Update `src/pages/TournamentDetail.tsx` - Add rankings section
- Update all pages - Add loading/error/empty states
- Error boundary component (optional for V1)

**Main Risks & Mitigations:**
- **Risk:** Rankings calculated incorrectly
  - **Mitigation:** Test with known scenarios (all wins, all losses, mixed), verify math, ensure score is NOT used
- **Risk:** Performance with many matches
  - **Mitigation:** Memoize calculation, recalculate only when matches change
- **Risk:** Division by zero (win rate when no matches)
  - **Mitigation:** Handle 0 matches played case, show "N/A" or 0% win rate
- **Risk:** Poor UX on errors
  - **Mitigation:** Show clear error messages, provide recovery actions (retry, go back)
- **Risk:** localStorage quota exceeded
  - **Mitigation:** Show warning if approaching limit, handle gracefully
- **Risk:** Data corruption not handled
  - **Mitigation:** Validate JSON on load, show error if corrupted, offer to reset

---

## Phase 7: Testing & Validation

**Goal:** Manual testing of all features, verify business rules, fix critical bugs.

**Scope:**
- ✅ Test tournament creation
- ✅ Test player add/remove (before and after start)
- ✅ Test player replacement with waiting list (before and after start)
- ✅ Test pair creation/editing (before and after start)
- ✅ Test match generation (preconditions, regeneration with confirmation)
- ✅ Test start tournament (one-way, locks players, irreversible)
- ✅ Test match result entry
- ✅ Test rankings calculation (verify score NOT used)
- ✅ Test tournament status transitions
- ✅ Test localStorage persistence (refresh, close/reopen)
- ✅ Test edge cases (no players, no pairs, no matches, no maxPlayers)
- ✅ Test waiting list (FIFO ordering, promotion via replacement)
- ✅ Test playersLocked enforcement (all structural edits disabled)
- ❌ No automated tests (V1 scope)
- ❌ No performance testing (acceptable for V1 scale)

**Key Components/Files:**
- Manual testing checklist
- Bug fixes as needed

**Main Risks & Mitigations:**
- **Risk:** Business rules not enforced
  - **Mitigation:** Test each rule explicitly, verify UI and hook validation, especially playersLocked and match generation preconditions
- **Risk:** Data loss on refresh
  - **Mitigation:** Test localStorage persistence thoroughly, verify all mutations save including playersLocked flag
- **Risk:** State inconsistencies
  - **Mitigation:** Test state transitions, verify no invalid states possible, test status + playersLocked combinations
- **Risk:** Waiting list replacement not working
  - **Mitigation:** Test replacement in various scenarios (replacing player in pairs, replacing waiting list member)

---

## Out of Scope for V1

Explicitly NOT implementing:
- ❌ Player accounts/auth
- ❌ Backend/database
- ❌ Multi-category tournaments
- ❌ Advanced match generation (optimization, drive/revés preferences)
- ❌ Tournament templates
- ❌ Export/import
- ❌ Mobile optimization
- ❌ Automated tests
- ❌ Match scheduling UI (matches have date/time but no calendar view)
- ❌ Advanced waiting list automation (manual replacement only)

---

**Status:** ⏳ Planning complete. Ready for `/execute` phase-by-phase implementation.
