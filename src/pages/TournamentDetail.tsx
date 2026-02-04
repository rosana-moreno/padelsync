import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Trash } from 'lucide-react';
import { useTournament } from '@/hooks/useTournament';
import {
  addPlayer as addGlobalPlayer,
  loadPlayers,
  loadTournament,
} from '@/lib/storage';
import { seedGlobalPlayers, fillTournamentSingles } from '@/lib/seed';
import { generateId, getCurrentTimestamp } from '@/lib/utils';
import type { Player } from '@/lib/types';

function formatDate(value: string) {
  if (!value) return 'Date not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

export default function TournamentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    tournament,
    loading,
    registerSingle,
    registerDoubles,
    setTournamentData,
    removeRegisteredPlayer,
    removeWaitingPlayer,
    removePlayerFromPair,
    removePair,
  } = useTournament(id ?? null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'single' | 'double'>('single');
  const [singleSelection, setSingleSelection] = useState('');
  const [doubleSelection, setDoubleSelection] = useState({ player1Id: '', player2Id: '' });
  const [lastCreatedPlayerId, setLastCreatedPlayerId] = useState<string | null>(null);
  const [newPlayer, setNewPlayer] = useState<{
    name: string;
    phone: string;
    email: string;
    courtPosition: 'drive' | 'backhand' | 'indifferent';
    gender: '' | 'female' | 'male';
  }>({
    name: '',
    phone: '',
    email: '',
    courtPosition: 'indifferent',
    gender: '',
  });
  const isDev = useMemo(() => import.meta.env.DEV, []);

  const refreshPlayers = () => {
    setPlayers(loadPlayers());
  };

  const refreshTournament = () => {
    if (!id) return;
    const updated = loadTournament(id);
    if (updated) {
      setTournamentData(updated);
    }
  };

  useEffect(() => {
    refreshPlayers();
  }, []);

  const handleModeChange = (nextMode: 'single' | 'double') => {
    setMode(nextMode);
    const lastId = lastCreatedPlayerId;
    if (!lastId) return;
    if (nextMode === 'single') {
      setSingleSelection(lastId);
      return;
    }
    setDoubleSelection((prev) => {
      if (!prev.player1Id) {
        return { ...prev, player1Id: lastId };
      }
      if (!prev.player2Id) {
        return { ...prev, player2Id: lastId };
      }
      return prev;
    });
  };

  if (loading) {
    return <p className="text-muted-foreground">Loading tournament...</p>;
  }

  if (!tournament) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Tournament not found</h1>
        <Button variant="secondary" onClick={() => navigate('/')}>
          Back to tournaments
        </Button>
      </div>
    );
  }

  const locationSummary = `${tournament.location.clubName} • ${tournament.location.address}`;
  const playersLocked = tournament.playersLocked;

  const playerNameById = new Map(players.map((player) => [player.id, player.name]));
  const resolveName = (playerId: string) =>
    playerNameById.get(playerId) ?? `Unknown player (${playerId})`;

  const waitingPlayers = tournament.waitingListIds.map((playerId) => ({
    id: playerId,
    name: resolveName(playerId),
  }));

  const pairedIds = new Set(
    tournament.pairs.flatMap((pair) => [pair.player1Id, pair.player2Id])
  );
  const registeredSingles = tournament.playerIds
    .filter((playerId) => !pairedIds.has(playerId))
    .map((playerId) => ({
      id: playerId,
      name: resolveName(playerId),
    }));
  const registeredPairs = tournament.pairs.map((pair) => ({
    id: pair.id,
    player1Id: pair.player1Id,
    player2Id: pair.player2Id,
    player1Name: resolveName(pair.player1Id),
    player2Name: resolveName(pair.player2Id),
  }));

  const availablePlayers = players.filter(
    (player) =>
      !tournament.playerIds.includes(player.id) &&
      !tournament.waitingListIds.includes(player.id)
  );

  const handleAddPlayer = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!newPlayer.name.trim() || !newPlayer.phone.trim()) {
      setError('Name and phone are required.');
      return;
    }
    const now = getCurrentTimestamp();
    const created = {
      id: generateId(),
      name: newPlayer.name.trim(),
      phone: newPlayer.phone.trim(),
      email: newPlayer.email.trim() || undefined,
      gender: newPlayer.gender || undefined,
      courtPosition: (newPlayer.courtPosition as Player['courtPosition']) ?? 'indifferent',
      createdAt: now,
      updatedAt: now,
    };
    addGlobalPlayer(created);
    setNewPlayer({ name: '', phone: '', email: '', courtPosition: 'indifferent', gender: '' });
    refreshPlayers();
    setLastCreatedPlayerId(created.id);
    if (mode === 'single') {
      setSingleSelection(created.id);
    } else {
      setDoubleSelection((prev) => {
        if (!prev.player1Id) {
          return { ...prev, player1Id: created.id };
        }
        if (!prev.player2Id) {
          return { ...prev, player2Id: created.id };
        }
        return prev;
      });
    }
  };

  const handleRegisterSingle = () => {
    setError(null);
    const result = registerSingle(singleSelection);
    if (!result.ok) {
      setError(result.error ?? 'Unable to register player.');
      return;
    }
    setSingleSelection('');
  };

  const handleRegisterDoubles = () => {
    setError(null);
    const result = registerDoubles(doubleSelection.player1Id, doubleSelection.player2Id);
    if (!result.ok) {
      setError(result.error ?? 'Unable to register players.');
      return;
    }
    setDoubleSelection({ player1Id: '', player2Id: '' });
  };

  const handleSeedPlayers = () => {
    seedGlobalPlayers(20);
    refreshPlayers();
  };

  const handleFillTournament = () => {
    if (!tournament.id) return;
    const pool =
      tournament.name === 'Weekend Cup'
        ? 'male'
        : 'mixed';
    fillTournamentSingles(tournament.id, 4, { pool });
    refreshTournament();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{tournament.name}</h1>
        <p className="text-muted-foreground">{formatDate(tournament.tournamentDate)}</p>
      </div>
      <div className="space-y-1 text-sm text-muted-foreground">
        <div>Location: {locationSummary}</div>
        <div>Status: {tournament.status}</div>
      </div>

      {isDev && (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={handleSeedPlayers}>
            Seed players
          </Button>
          <Button variant="secondary" onClick={handleFillTournament}>
            Fill tournament + waiting list
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Tournament Registration</h2>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={mode === 'single' ? 'default' : 'secondary'}
            onClick={() => handleModeChange('single')}
            disabled={playersLocked}
          >
            Register single
          </Button>
          <Button
            variant={mode === 'double' ? 'default' : 'secondary'}
            onClick={() => handleModeChange('double')}
            disabled={playersLocked}
          >
            Register double
          </Button>
        </div>

        {mode === 'single' ? (
          <div className="grid gap-3 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Select player</label>
              <select
                className="w-full rounded-md border px-3 py-2"
                value={singleSelection}
                onChange={(event) => setSingleSelection(event.target.value)}
                disabled={playersLocked}
              >
                <option value="">Select a player</option>
                {availablePlayers.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleRegisterSingle} disabled={playersLocked || !singleSelection}>
                Register single
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Player A</label>
              <select
                className="w-full rounded-md border px-3 py-2"
                value={doubleSelection.player1Id}
                onChange={(event) =>
                  setDoubleSelection((prev) => ({ ...prev, player1Id: event.target.value }))
                }
                disabled={playersLocked}
              >
                <option value="">Select player A</option>
                {availablePlayers.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Player B</label>
              <select
                className="w-full rounded-md border px-3 py-2"
                value={doubleSelection.player2Id}
                onChange={(event) =>
                  setDoubleSelection((prev) => ({ ...prev, player2Id: event.target.value }))
                }
                disabled={playersLocked}
              >
                <option value="">Select player B</option>
                {availablePlayers.map((player) => (
                  <option key={player.id} value={player.id} disabled={player.id === doubleSelection.player1Id}>
                    {player.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleRegisterDoubles}
                disabled={
                  playersLocked ||
                  !doubleSelection.player1Id ||
                  !doubleSelection.player2Id ||
                  doubleSelection.player1Id === doubleSelection.player2Id
                }
              >
                Register double
              </Button>
            </div>
          </div>
        )}

        <form className="grid gap-3 md:grid-cols-2" onSubmit={handleAddPlayer}>
          <div>
            <label className="block text-sm font-medium mb-1">New player name *</label>
            <input
              className="w-full rounded-md border px-3 py-2"
              value={newPlayer.name}
              onChange={(event) => setNewPlayer((prev) => ({ ...prev, name: event.target.value }))}
              disabled={playersLocked}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone *</label>
            <input
              className="w-full rounded-md border px-3 py-2"
              value={newPlayer.phone}
              onChange={(event) => setNewPlayer((prev) => ({ ...prev, phone: event.target.value }))}
              disabled={playersLocked}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Gender</label>
            <select
              className="w-full rounded-md border px-3 py-2"
              value={newPlayer.gender}
              onChange={(event) =>
                setNewPlayer((prev) => ({
                  ...prev,
                  gender: event.target.value as '' | 'female' | 'male',
                }))
              }
              disabled={playersLocked}
            >
              <option value="">Not specified</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              className="w-full rounded-md border px-3 py-2"
              value={newPlayer.email}
              onChange={(event) => setNewPlayer((prev) => ({ ...prev, email: event.target.value }))}
              disabled={playersLocked}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Court Position</label>
            <select
              className="w-full rounded-md border px-3 py-2"
              value={newPlayer.courtPosition}
              onChange={(event) =>
                setNewPlayer((prev) => ({
                  ...prev,
                  courtPosition: event.target.value as 'drive' | 'backhand' | 'indifferent',
                }))
              }
              disabled={playersLocked}
            >
              <option value="indifferent">Indifferent</option>
              <option value="drive">Drive</option>
              <option value="backhand">Backhand</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={playersLocked}>
              Create player
            </Button>
          </div>
        </form>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold mb-2">
              Registered: {tournament.playerIds.length} / {tournament.settings?.maxPlayers ?? 0}
            </h3>
            {registeredPairs.length === 0 && registeredSingles.length === 0 ? (
              <p className="text-muted-foreground text-sm">No registered players yet.</p>
            ) : (
              <div className="space-y-3">
                {registeredPairs.map((pair) => (
                  <div key={pair.id} className="rounded-md border p-2 text-sm space-y-2">
                    <div className="font-medium">
                      {pair.player1Name} + {pair.player2Name}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePair(pair.id)}
                        disabled={playersLocked}
                        aria-label="Remove pair"
                      >
                        <Trash className="h-4 w-4" />
                        <span className="ml-2">Remove pair</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePlayerFromPair(pair.id, 'player1')}
                        disabled={playersLocked}
                        aria-label={`Remove ${pair.player1Name} from pair`}
                      >
                        <Trash className="h-4 w-4" />
                        <span className="ml-2">Remove {pair.player1Name}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePlayerFromPair(pair.id, 'player2')}
                        disabled={playersLocked}
                        aria-label={`Remove ${pair.player2Name} from pair`}
                      >
                        <Trash className="h-4 w-4" />
                        <span className="ml-2">Remove {pair.player2Name}</span>
                      </Button>
                    </div>
                  </div>
                ))}
                {registeredSingles.map((player) => (
                  <div
                    key={player.id}
                    className="rounded-md border p-2 text-sm flex items-center justify-between"
                  >
                    <span>{player.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRegisteredPlayer(player.id)}
                      disabled={playersLocked}
                      aria-label="Remove player"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {waitingPlayers.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">
                Waiting list: {waitingPlayers.length}
              </h3>
              <ul className="space-y-2">
                {waitingPlayers.map((player) => (
                  <li
                    key={player.id}
                    className="rounded-md border p-2 text-sm flex items-center justify-between"
                  >
                    <span>{player.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeWaitingPlayer(player.id)}
                      disabled={playersLocked}
                      aria-label="Remove waiting list player"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <Button variant="secondary" onClick={() => navigate('/')}>
        Back to tournaments
      </Button>
    </div>
  );
}
