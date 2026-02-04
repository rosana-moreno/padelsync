/**
 * Unique identifier for entities
 */
export type ID = string;

/**
 * Tournament status lifecycle
 * Used for UI and lifecycle only, does not override tournamentStarted rules
 */
export type TournamentStatus = 'draft' | 'in_progress' | 'completed';

/**
 * Player registration type
 */
export type RegistrationType = 'singles' | 'pair';

/**
 * Match status
 */
export type MatchStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

/**
 * Match result (winner)
 */
export type MatchResult = 'pair1' | 'pair2' | null;

/**
 * Player entity
 * Represents a single person who can participate
 */
export interface Player {
  id: ID;
  name: string;
  phone: string; // Required for V1.1
  email?: string; // Optional
  gender?: 'female' | 'male'; // Optional
  courtPosition?: 'drive' | 'backhand' | 'indifferent'; // Optional (default: indifferent)
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

/**
 * Pair entity
 * Represents two players playing together
 * Can be pre-made (both players specified) or auto-generated (one player, waiting for partner)
 */
export interface Pair {
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
export interface Match {
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
export interface Tournament {
  id: ID;
  name: string;
  description?: string;
  status: TournamentStatus;
  playersLocked: boolean; // Controls structural edits - becomes true when tournament starts, irreversible
  tournamentDate: string; // REQUIRED (ISO date or timestamp)
  location: {
    clubName: string; // REQUIRED
    address: string; // REQUIRED (used for maps later)
    phone?: string; // OPTIONAL
    contactPerson?: string; // OPTIONAL
  };
  createdAt: string;
  updatedAt: string;
  
  // Registered and waiting list players (global player IDs)
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
export interface RankingsEntry {
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
export interface TournamentSummary {
  id: ID;
  name: string;
  status: TournamentStatus;
  tournamentDate: string; // REQUIRED (ISO date or timestamp)
  clubName: string; // REQUIRED (from location)
  playerCount: number;
  matchCount: number;
  createdAt: string;
}
