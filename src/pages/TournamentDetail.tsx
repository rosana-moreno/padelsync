import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTournament } from '@/hooks/useTournament';

function formatDate(value: string) {
  if (!value) return 'Date not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

export default function TournamentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tournament, loading } = useTournament(id ?? null);

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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">{tournament.name}</h1>
        <p className="text-muted-foreground">{formatDate(tournament.tournamentDate)}</p>
      </div>
      <div className="space-y-1 text-sm text-muted-foreground">
        <div>Location: {locationSummary}</div>
        <div>Status: {tournament.status}</div>
      </div>
      <Button variant="secondary" onClick={() => navigate('/')}>
        Back to tournaments
      </Button>
    </div>
  );
}
