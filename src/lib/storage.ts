import type { Player, Tournament, TournamentSummary } from './types';

const STORAGE_VERSION = '1.1';
const TOURNAMENTS_KEY = 'padelsync_tournaments';
const PLAYERS_KEY = 'padelsync_players';
const VERSION_KEY = 'padelsync_version';
const TOURNAMENT_PREFIX = 'padelsync_tournament_';

/**
 * Get storage key for a specific tournament
 */
function getTournamentKey(id: string): string {
  return `${TOURNAMENT_PREFIX}${id}`;
}

/**
 * Check if localStorage is available
 */
function isStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get version from localStorage
 */
export function getStorageVersion(): string | null {
  if (!isStorageAvailable()) return null;
  try {
    return localStorage.getItem(VERSION_KEY);
  } catch {
    return null;
  }
}

/**
 * Set version in localStorage
 */
export function setStorageVersion(version: string = STORAGE_VERSION): void {
  if (!isStorageAvailable()) return;
  try {
    localStorage.setItem(VERSION_KEY, version);
  } catch (error) {
    console.error('Failed to set storage version:', error);
  }
}

/**
 * Initialize storage version if not present
 */
export function initializeStorage(): void {
  const currentVersion = getStorageVersion();
  if (!currentVersion) {
    setStorageVersion();
  }
  // Future: Add migration logic here if version changes
}

/**
 * Load tournament from localStorage
 */
export function loadTournament(id: string): Tournament | null {
  if (!isStorageAvailable()) return null;
  try {
    const key = getTournamentKey(id);
    const data = localStorage.getItem(key);
    if (!data) return null;
    const parsed = JSON.parse(data) as Tournament;
    return normalizeTournament(parsed);
  } catch (error) {
    console.error(`Failed to load tournament ${id}:`, error);
    return null;
  }
}

/**
 * Normalize tournament data to tolerate missing fields from older versions
 */
function normalizeTournament(tournament: Tournament): Tournament {
  const normalizedLocation = tournament.location ?? {
    clubName: '',
    address: '',
    phone: '',
    contactPerson: undefined,
  };
  const normalizedTournamentDate = tournament.tournamentDate ?? '';
  const normalizedPlayerIds = tournament.playerIds ?? [];
  const normalizedWaitingListIds = tournament.waitingListIds ?? [];
  const normalizedPairs = (tournament.pairs ?? []).filter(
    (pair) => pair.player1Id && pair.player2Id
  );

  return {
    ...tournament,
    tournamentDate: normalizedTournamentDate,
    location: normalizedLocation,
    playerIds: normalizedPlayerIds,
    waitingListIds: normalizedWaitingListIds,
    pairs: normalizedPairs,
  };
}

/**
 * Save tournament to localStorage
 * Also updates the tournament summary in padelsync_tournaments to keep them in sync
 */
export function saveTournament(tournament: Tournament): void {
  if (!isStorageAvailable()) return;
  try {
    const key = getTournamentKey(tournament.id);
    localStorage.setItem(key, JSON.stringify(tournament));
    // Update summary after saving full tournament to keep summaries in sync
    updateTournamentSummary(tournament);
  } catch (error) {
    console.error(`Failed to save tournament ${tournament.id}:`, error);
    throw error;
  }
}

/**
 * Delete tournament from localStorage
 * Also removes the tournament summary from padelsync_tournaments to keep them in sync
 */
export function deleteTournament(id: string): void {
  if (!isStorageAvailable()) return;
  try {
    const key = getTournamentKey(id);
    localStorage.removeItem(key);
    // Remove summary after deleting full tournament to keep summaries in sync
    removeTournamentSummary(id);
  } catch (error) {
    console.error(`Failed to delete tournament ${id}:`, error);
  }
}

/**
 * Load all tournament summaries from localStorage
 */
export function loadTournamentSummaries(): TournamentSummary[] {
  if (!isStorageAvailable()) return [];
  try {
    const data = localStorage.getItem(TOURNAMENTS_KEY);
    if (!data) return [];
    return JSON.parse(data) as TournamentSummary[];
  } catch (error) {
    console.error('Failed to load tournament summaries:', error);
    return [];
  }
}

/**
 * Save tournament summary list to localStorage
 */
export function saveTournamentSummaries(summaries: TournamentSummary[]): void {
  if (!isStorageAvailable()) return;
  try {
    localStorage.setItem(TOURNAMENTS_KEY, JSON.stringify(summaries));
  } catch (error) {
    console.error('Failed to save tournament summaries:', error);
    throw error;
  }
}

/**
 * Update tournament summary in the list
 */
export function updateTournamentSummary(tournament: Tournament): void {
  const summaries = loadTournamentSummaries();
  const index = summaries.findIndex(s => s.id === tournament.id);
  
  const summary: TournamentSummary = {
    id: tournament.id,
    name: tournament.name,
    status: tournament.status,
    tournamentDate: tournament.tournamentDate,
    clubName: tournament.location.clubName,
    playerCount: tournament.playerIds.length,
    matchCount: tournament.matches.length,
    createdAt: tournament.createdAt,
  };
  
  if (index >= 0) {
    summaries[index] = summary;
  } else {
    summaries.push(summary);
  }
  
  saveTournamentSummaries(summaries);
}

/**
 * Add tournament summary to the list
 */
export function addTournamentSummary(tournament: Tournament): void {
  updateTournamentSummary(tournament);
}

/**
 * Remove tournament summary from the list
 */
export function removeTournamentSummary(id: string): void {
  const summaries = loadTournamentSummaries();
  const filtered = summaries.filter(s => s.id !== id);
  saveTournamentSummaries(filtered);
}

/**
 * Load all global players from localStorage
 */
export function loadPlayers(): Player[] {
  if (!isStorageAvailable()) return [];
  try {
    const data = localStorage.getItem(PLAYERS_KEY);
    if (!data) return [];
    return JSON.parse(data) as Player[];
  } catch (error) {
    console.error('Failed to load players:', error);
    return [];
  }
}

/**
 * Save global players to localStorage
 */
export function savePlayers(players: Player[]): void {
  if (!isStorageAvailable()) return;
  try {
    localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
  } catch (error) {
    console.error('Failed to save players:', error);
    throw error;
  }
}

/**
 * Add a global player (idempotent by ID)
 */
export function addPlayer(player: Player): void {
  const players = loadPlayers();
  const exists = players.some((p) => p.id === player.id);
  if (exists) return;
  savePlayers([...players, player]);
}

/**
 * Update a global player (by ID)
 */
export function updatePlayer(player: Player): void {
  const players = loadPlayers();
  const updated = players.map((p) => (p.id === player.id ? player : p));
  savePlayers(updated);
}

/**
 * Delete a global player (by ID)
 */
export function deletePlayer(id: string): void {
  const players = loadPlayers();
  const filtered = players.filter((p) => p.id !== id);
  savePlayers(filtered);
}
