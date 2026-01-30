import { saveTournament, loadTournamentSummaries } from './storage';
import { getCurrentTimestamp } from './utils';
import type { Tournament } from './types';

const DEMO_1_ID = 'demo-tournament-1';
const DEMO_2_ID = 'demo-tournament-2';

function isoDateDaysFromNow(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

export function seedDemoTournaments(): { created: number } {
  if (!import.meta.env.DEV) {
    return { created: 0 };
  }
  const existing = loadTournamentSummaries();
  const existingIds = new Set(existing.map((summary) => summary.id));

  const now = getCurrentTimestamp();

  const tournaments: Tournament[] = [
    {
      id: DEMO_1_ID,
      name: 'Padelsync Demo Open',
      description: 'Demo tournament for UI testing',
      status: 'draft',
      playersLocked: false,
      tournamentDate: isoDateDaysFromNow(7),
      location: {
        clubName: 'Club Norte',
        address: 'Calle Example 123, Madrid',
        phone: '+34 600 000 001',
        contactPerson: 'Laura Perez',
      },
      createdAt: now,
      updatedAt: now,
      players: [],
      pairs: [],
      matches: [],
      settings: {
        maxPlayers: 16,
      },
    },
    {
      id: DEMO_2_ID,
      name: 'Weekend Cup',
      description: 'Second demo tournament for sorting tests',
      status: 'draft',
      playersLocked: false,
      tournamentDate: isoDateDaysFromNow(21),
      location: {
        clubName: 'Arena Sur',
        address: 'Avenida Padel 45, Valencia',
        phone: '+34 600 000 002',
        contactPerson: 'Miguel Soto',
      },
      createdAt: now,
      updatedAt: now,
      players: [],
      pairs: [],
      matches: [],
      settings: {
        maxPlayers: 16,
      },
    },
  ];

  let created = 0;
  tournaments.forEach((tournament) => {
    if (existingIds.has(tournament.id)) {
      return;
    }
    saveTournament(tournament);
    created += 1;
  });

  return { created };
}
