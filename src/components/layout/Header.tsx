import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold">
            Padelsync
          </Link>
          <nav>
            <Link
              to="/"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Tournaments
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
