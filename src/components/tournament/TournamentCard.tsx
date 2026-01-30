import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { TournamentSummary } from '@/lib/types';

interface TournamentCardProps {
  tournament: TournamentSummary;
}

function formatDate(value: string) {
  if (!value) return 'Date not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

export default function TournamentCard({ tournament }: TournamentCardProps) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tournament.name}</CardTitle>
        <CardDescription>{formatDate(tournament.tournamentDate)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1 text-sm text-muted-foreground">
        <div>Club: {tournament.clubName}</div>
        <div>Status: {tournament.status}</div>
        <div>Players: {tournament.playerCount}</div>
        <div>Matches: {tournament.matchCount}</div>
      </CardContent>
      <CardFooter>
        <Button variant="secondary" onClick={() => navigate(`/tournaments/${tournament.id}`)}>
          View
        </Button>
      </CardFooter>
    </Card>
  );
}
