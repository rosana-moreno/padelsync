import { useParams } from 'react-router-dom';

export default function TournamentDetail() {
  const { id } = useParams<{ id: string }>();
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Tournament Detail</h1>
      <p className="text-muted-foreground">
        Tournament detail view for ID: {id}
      </p>
      <p className="text-muted-foreground mt-2">
        Full implementation will be added in Phase 2
      </p>
    </div>
  );
}
