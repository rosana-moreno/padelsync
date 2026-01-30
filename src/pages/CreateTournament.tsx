import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { saveTournament } from '@/lib/storage';
import { generateId, getCurrentTimestamp } from '@/lib/utils';
import type { Tournament } from '@/lib/types';

interface FormState {
  name: string;
  description: string;
  tournamentDate: string;
  maxPlayers: string;
  clubName: string;
  address: string;
  phone: string;
  contactPerson: string;
}

export default function CreateTournament() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    name: '',
    description: '',
    tournamentDate: '',
    maxPlayers: '16',
    clubName: '',
    address: '',
    phone: '',
    contactPerson: '',
  });

  const maxPlayersValue = useMemo(() => {
    const parsed = Number.parseInt(form.maxPlayers, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }, [form.maxPlayers]);

  const handleChange = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!form.tournamentDate.trim()) {
      setError('Tournament date is required.');
      return;
    }
    if (maxPlayersValue < 2) {
      setError('Max players must be an integer of at least 2.');
      return;
    }
    if (!form.clubName.trim() || !form.address.trim()) {
      setError('Club name and address are required.');
      return;
    }

    const now = getCurrentTimestamp();
    const tournament: Tournament = {
      id: generateId(),
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      status: 'draft',
      playersLocked: false,
      tournamentDate: form.tournamentDate.trim(),
      location: {
        clubName: form.clubName.trim(),
        address: form.address.trim(),
        phone: form.phone.trim() || undefined,
        contactPerson: form.contactPerson.trim() || undefined,
      },
      createdAt: now,
      updatedAt: now,
      players: [],
      pairs: [],
      matches: [],
      settings: {
        maxPlayers: maxPlayersValue,
      },
    };

    saveTournament(tournament);
    navigate(`/tournaments/${tournament.id}`);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Create Tournament</h1>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium mb-1">Name *</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            value={form.name}
            onChange={handleChange('name')}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            className="w-full rounded-md border px-3 py-2"
            rows={3}
            value={form.description}
            onChange={handleChange('description')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tournament Date *</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            type="date"
            value={form.tournamentDate}
            onChange={handleChange('tournamentDate')}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Max Players *</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            type="number"
            min={2}
            value={form.maxPlayers}
            onChange={handleChange('maxPlayers')}
            required
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1">Club Name *</label>
            <input
              className="w-full rounded-md border px-3 py-2"
              value={form.clubName}
              onChange={handleChange('clubName')}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Club Phone</label>
            <input
              className="w-full rounded-md border px-3 py-2"
              value={form.phone}
              onChange={handleChange('phone')}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Address *</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            value={form.address}
            onChange={handleChange('address')}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Contact Person</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            value={form.contactPerson}
            onChange={handleChange('contactPerson')}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit">Create tournament</Button>
      </form>
    </div>
  );
}
