import { useState, useEffect, useCallback } from 'react';
import type { Tournament } from '@/lib/types';
import {
  loadTournament,
  saveTournament,
  initializeStorage,
} from '@/lib/storage';
import { generateId, getCurrentTimestamp } from '@/lib/utils';

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

  const removePair = useCallback((pairId: string) => {
    setTournament((prev) => {
      if (!prev) return prev;
      if (prev.playersLocked) return prev;
      const pair = prev.pairs.find((item) => item.id === pairId);
      if (!pair) return prev;
      const nextPairs = prev.pairs.filter((item) => item.id !== pairId);
      const nextPlayerIds = prev.playerIds.filter(
        (id) => id !== pair.player1Id && id !== pair.player2Id
      );
      const nextWaitingListIds = prev.waitingListIds.filter(
        (id) => id !== pair.player1Id && id !== pair.player2Id
      );
      return {
        ...prev,
        pairs: nextPairs,
        playerIds: nextPlayerIds,
        waitingListIds: nextWaitingListIds,
        updatedAt: getCurrentTimestamp(),
      };
    });
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

  const registerSingle = useCallback((playerId: string) => {
    if (!playerId) {
      return { ok: false, error: 'Player is required.' };
    }
    let result: { ok: boolean; error?: string } = { ok: true };
    setTournament((prev) => {
      if (!prev) {
        result = { ok: false, error: 'Tournament not found.' };
        return prev;
      }
      if (prev.playersLocked) {
        result = { ok: false, error: 'Players are locked.' };
        return prev;
      }
      const alreadyRegistered =
        prev.playerIds.includes(playerId) || prev.waitingListIds.includes(playerId);
      if (alreadyRegistered) {
        result = { ok: false, error: 'Player is already registered.' };
        return prev;
      }
      const maxPlayers = prev.settings?.maxPlayers ?? 0;
      const canRegister = maxPlayers === 0 || prev.playerIds.length < maxPlayers;

      const nextPlayerIds = canRegister
        ? [...prev.playerIds, playerId]
        : prev.playerIds;
      const nextWaitingListIds = canRegister
        ? prev.waitingListIds
        : [...prev.waitingListIds, playerId];

      return {
        ...prev,
        playerIds: nextPlayerIds,
        waitingListIds: nextWaitingListIds,
        updatedAt: getCurrentTimestamp(),
      };
    });
    return result;
  }, []);

  const registerDoubles = useCallback((player1Id: string, player2Id: string) => {
    if (!player1Id || !player2Id) {
      return { ok: false, error: 'Both players are required.' };
    }
    if (player1Id === player2Id) {
      return { ok: false, error: 'Players must be different.' };
    }
    let result: { ok: boolean; error?: string } = { ok: true };
    setTournament((prev) => {
      if (!prev) {
        result = { ok: false, error: 'Tournament not found.' };
        return prev;
      }
      if (prev.playersLocked) {
        result = { ok: false, error: 'Players are locked.' };
        return prev;
      }
      const alreadyRegistered =
        prev.playerIds.includes(player1Id) ||
        prev.playerIds.includes(player2Id) ||
        prev.waitingListIds.includes(player1Id) ||
        prev.waitingListIds.includes(player2Id);
      if (alreadyRegistered) {
        result = { ok: false, error: 'One or both players are already registered.' };
        return prev;
      }
      const maxPlayers = prev.settings?.maxPlayers ?? 0;
      const remainingSlots = maxPlayers === 0 ? Number.POSITIVE_INFINITY : maxPlayers - prev.playerIds.length;
      const canRegisterBoth = remainingSlots >= 2;

      const nextPlayerIds = canRegisterBoth
        ? [...prev.playerIds, player1Id, player2Id]
        : prev.playerIds;
      const nextWaitingListIds = canRegisterBoth
        ? prev.waitingListIds
        : [...prev.waitingListIds, player1Id, player2Id];
      const nextPairs = canRegisterBoth
        ? [
            ...prev.pairs,
            {
              id: generateId(),
              player1Id,
              player2Id,
              createdAt: getCurrentTimestamp(),
              updatedAt: getCurrentTimestamp(),
            },
          ]
        : prev.pairs;

      return {
        ...prev,
        playerIds: nextPlayerIds,
        waitingListIds: nextWaitingListIds,
        pairs: nextPairs,
        updatedAt: getCurrentTimestamp(),
      };
    });
    return result;
  }, []);

  const removeRegisteredPlayer = useCallback((playerId: string) => {
    setTournament((prev) => {
      if (!prev) return prev;
      if (prev.playersLocked) return prev;
      const relatedPair = prev.pairs.find(
        (pair) => pair.player1Id === playerId || pair.player2Id === playerId
      );
      const nextPairs = relatedPair
        ? prev.pairs.filter((pair) => pair.id !== relatedPair.id)
        : prev.pairs;
      return {
        ...prev,
        pairs: nextPairs,
        playerIds: prev.playerIds.filter((id) => id !== playerId),
        waitingListIds: prev.waitingListIds.filter((id) => id !== playerId),
        updatedAt: getCurrentTimestamp(),
      };
    });
  }, []);

  const removeWaitingPlayer = useCallback((playerId: string) => {
    setTournament((prev) => {
      if (!prev) return prev;
      if (prev.playersLocked) return prev;
      const relatedPair = prev.pairs.find(
        (pair) => pair.player1Id === playerId || pair.player2Id === playerId
      );
      const nextPairs = relatedPair
        ? prev.pairs.filter((pair) => pair.id !== relatedPair.id)
        : prev.pairs;
      return {
        ...prev,
        pairs: nextPairs,
        playerIds: prev.playerIds.filter((id) => id !== playerId),
        waitingListIds: prev.waitingListIds.filter((id) => id !== playerId),
        updatedAt: getCurrentTimestamp(),
      };
    });
  }, []);

  const removePlayerFromPair = useCallback(
    (pairId: string, which: 'player1' | 'player2') => {
      setTournament((prev) => {
        if (!prev) return prev;
        if (prev.playersLocked) return prev;
        const pair = prev.pairs.find((item) => item.id === pairId);
        if (!pair) return prev;
        const removedId = which === 'player1' ? pair.player1Id : pair.player2Id;
        const nextPairs = prev.pairs.filter((item) => item.id !== pairId);
        return {
          ...prev,
          pairs: nextPairs,
          playerIds: prev.playerIds.filter((id) => id !== removedId),
          waitingListIds: prev.waitingListIds.filter((id) => id !== removedId),
          updatedAt: getCurrentTimestamp(),
        };
      });
    },
    []
  );

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
    registerSingle,
    registerDoubles,
    removeRegisteredPlayer,
    removeWaitingPlayer,
    removePlayerFromPair,
  };
}
