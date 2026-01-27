import { useState, useEffect, useCallback } from 'react';
import type { Tournament } from '@/lib/types';
import {
  loadTournament,
  saveTournament,
  initializeStorage,
} from '@/lib/storage';

/**
 * Hook for managing tournament state with localStorage sync
 */
export function useTournament(tournamentId: string | null) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Initialize storage on mount
  useEffect(() => {
    initializeStorage();
  }, []);

  // Load tournament from localStorage on mount or when ID changes
  useEffect(() => {
    if (!tournamentId) {
      setTournament(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const loaded = loadTournament(tournamentId);
      setTournament(loaded);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load tournament');
      setError(error);
      setTournament(null);
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  // Sync tournament to localStorage whenever it changes
  // saveTournament() automatically updates BOTH storage keys:
  // - padelsync_tournament_{id} (full tournament)
  // - padelsync_tournaments (summary list)
  useEffect(() => {
    if (!tournament) return;

    try {
      saveTournament(tournament);
    } catch (err) {
      console.error('Failed to sync tournament to localStorage:', err);
      // Don't set error state here to avoid infinite loops
      // Error is logged for debugging
    }
  }, [tournament]);

  /**
   * Update tournament (atomic replacement)
   */
  const updateTournament = useCallback((updates: Partial<Tournament>) => {
    setTournament((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
    });
  }, []);

  /**
   * Replace entire tournament object
   */
  const setTournamentData = useCallback((data: Tournament | null) => {
    setTournament(data);
  }, []);

  // Mutation function scaffolding (to be implemented in later phases)
  // These are placeholders that will be filled in as features are added

  const addPlayer = useCallback(() => {
    // TODO: Implement in Phase 3
    throw new Error('Not implemented yet');
  }, []);

  const removePlayer = useCallback(() => {
    // TODO: Implement in Phase 3
    throw new Error('Not implemented yet');
  }, []);

  const replacePlayer = useCallback(() => {
    // TODO: Implement in Phase 3
    throw new Error('Not implemented yet');
  }, []);

  const addPair = useCallback(() => {
    // TODO: Implement in Phase 3
    throw new Error('Not implemented yet');
  }, []);

  const updatePair = useCallback(() => {
    // TODO: Implement in Phase 3
    throw new Error('Not implemented yet');
  }, []);

  const removePair = useCallback(() => {
    // TODO: Implement in Phase 3
    throw new Error('Not implemented yet');
  }, []);

  const generateMatches = useCallback(() => {
    // TODO: Implement in Phase 4
    throw new Error('Not implemented yet');
  }, []);

  const updateMatchResult = useCallback(() => {
    // TODO: Implement in Phase 5
    throw new Error('Not implemented yet');
  }, []);

  const startTournament = useCallback(() => {
    // TODO: Implement in Phase 5
    throw new Error('Not implemented yet');
  }, []);

  const updateStatus = useCallback(() => {
    // TODO: Implement in Phase 5
    throw new Error('Not implemented yet');
  }, []);

  return {
    tournament,
    loading,
    error,
    updateTournament,
    setTournamentData,
    // Mutation functions (placeholders)
    addPlayer,
    removePlayer,
    replacePlayer,
    addPair,
    updatePair,
    removePair,
    generateMatches,
    updateMatchResult,
    startTournament,
    updateStatus,
  };
}
