import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import TournamentCard from '@/components/tournament/TournamentCard';
import { loadTournamentSummaries } from '@/lib/storage';
import { seedDemoTournaments } from '@/lib/seed';
import type { TournamentSummary } from '@/lib/types';

export default function TournamentList() {
  const navigate = useNavigate();
  const [summaries, setSummaries] = useState<TournamentSummary[]>([]);

  const canSeed = useMemo(() => import.meta.env.DEV, []);

  const refreshSummaries = () => {
    setSummaries(loadTournamentSummaries());
  };

  useEffect(() => {
    refreshSummaries();
  }, []);

  const handleSeed = () => {
    const result = seedDemoTournaments();
    if (result.created > 0) {
      refreshSummaries();
    }
  };

  const sortedSummaries = useMemo(() => {
    return [...summaries].sort((a, b) => {
      const aTime = a.tournamentDate ? new Date(a.tournamentDate).getTime() : Number.POSITIVE_INFINITY;
      const bTime = b.tournamentDate ? new Date(b.tournamentDate).getTime() : Number.POSITIVE_INFINITY;
      return aTime - bTime;
    });
  }, [summaries]);

  const hasTournaments = sortedSummaries.length > 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Tournaments</h1>
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate('/tournaments/new')}>Create tournament</Button>
          {canSeed && (
            <Button
              variant="secondary"
              onClick={handleSeed}
            >
              Seed demo data
            </Button>
          )}
        </div>
      </div>

      {hasTournaments ? (
        <div className="grid gap-4">
          {sortedSummaries.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>
      ) : (
        <div className="rounded-md border p-6">
          <h2 className="text-lg font-semibold mb-2">No tournaments yet</h2>
          <p className="text-muted-foreground mb-4">
            Create your first tournament to get started.
          </p>
        </div>
      )}
    </div>
  );
}
