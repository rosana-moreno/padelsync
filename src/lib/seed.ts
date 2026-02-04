import { loadTournament, saveTournament, loadTournamentSummaries, loadPlayers, savePlayers } from './storage';
import { getCurrentTimestamp } from './utils';
import type { Player, Tournament } from './types';

const DEMO_1_ID = 'demo-tournament-padelsync';
const DEMO_2_ID = 'demo-tournament-weekend';

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
      playerIds: [],
      waitingListIds: [],
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
      playerIds: [],
      waitingListIds: [],
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

export function seedDemoData(): { createdTournaments: number; filled: number } {
  if (!import.meta.env.DEV) {
    return { createdTournaments: 0, filled: 0 };
  }

  seedGlobalPlayers(20);

  const existing = loadTournamentSummaries();
  const existingIds = new Set(existing.map((summary) => summary.id));
  const now = getCurrentTimestamp();

  const demoTournaments: Tournament[] = [
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
      playerIds: [],
      waitingListIds: [],
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
      playerIds: [],
      waitingListIds: [],
      pairs: [],
      matches: [],
      settings: {
        maxPlayers: 16,
      },
    },
  ];

  let createdTournaments = 0;
  demoTournaments.forEach((tournament) => {
    if (existingIds.has(tournament.id)) {
      return;
    }
    saveTournament(tournament);
    createdTournaments += 1;
  });

  let filled = 0;
  filled += fillTournamentSingles(DEMO_1_ID, 4, { pool: 'mixed' }).added;
  filled += fillTournamentSingles(DEMO_2_ID, 4, { pool: 'male' }).added;

  return { createdTournaments, filled };
}

export function seedGlobalPlayers(count: number): { created: number } {
  if (!import.meta.env.DEV) {
    return { created: 0 };
  }
  if (count <= 0) return { created: 0 };

  const demoWomenNames = [
    'Laura Perez',
    'Maria Gomez',
    'Ana Torres',
    'Lucia Ruiz',
    'Carmen Diaz',
    'Elena Morales',
    'Sofia Navarro',
    'Paula Castillo',
    'Marta Ortega',
    'Patricia Romero',
    'Adriana Santos',
    'Beatriz Vega',
    'Clara Mendez',
    'Daniela Flores',
    'Irene Ramos',
    'Julia Herrera',
    'Lidia Suarez',
    'Nuria Molina',
    'Olivia Santos',
    'Veronica Ruiz',
  ];
  const demoMenNames = [
    'Carlos Martinez',
    'Javier Lopez',
    'Miguel Soto',
    'Diego Herrera',
    'Alejandro Ruiz',
    'Sergio Gomez',
    'Pablo Navarro',
    'David Castillo',
    'Ruben Ortega',
    'Luis Romero',
    'Andres Santos',
    'Jorge Vega',
    'Hector Mendez',
    'Ivan Flores',
    'Manuel Ramos',
    'Adrian Garcia',
    'Raul Suarez',
    'Oscar Molina',
    'Fernando Ruiz',
    'Ricardo Torres',
  ];

  const existing = loadPlayers();
  const existingIds = new Set(existing.map((player) => player.id));
  const now = getCurrentTimestamp();

  const newPlayers: Player[] = [];
  const limit = Math.min(count, demoWomenNames.length, demoMenNames.length);
  for (let i = 1; i <= limit; i += 1) {
    const femaleId = `demo-f-${i}`;
    if (!existingIds.has(femaleId)) {
      newPlayers.push({
        id: femaleId,
        name: demoWomenNames[i - 1],
        phone: `+34 600 100 ${String(i).padStart(3, '0')}`,
        gender: 'female',
        courtPosition: 'indifferent',
        createdAt: now,
        updatedAt: now,
      });
    }
    const maleId = `demo-m-${i}`;
    if (!existingIds.has(maleId)) {
      newPlayers.push({
        id: maleId,
        name: demoMenNames[i - 1],
        phone: `+34 600 200 ${String(i).padStart(3, '0')}`,
        gender: 'male',
        courtPosition: 'indifferent',
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  if (newPlayers.length === 0) {
    return { created: 0 };
  }

  savePlayers([...existing, ...newPlayers]);
  return { created: newPlayers.length };
}

type FillPool = 'mixed' | 'male';

export function fillTournamentSingles(
  tournamentId: string,
  overflowCount: number,
  options?: { pool?: FillPool }
) {
  if (!import.meta.env.DEV) {
    return { added: 0, waitingList: 0 };
  }
  const safeOverflow = Math.max(0, overflowCount);
  const tournament = loadTournament(tournamentId);
  if (!tournament) return { added: 0, waitingList: 0 };

  const maxPlayers = tournament.settings?.maxPlayers ?? 0;
  if (maxPlayers <= 0) return { added: 0, waitingList: 0 };

  const existingIds = new Set([...tournament.playerIds, ...tournament.waitingListIds]);
  const players = loadPlayers();
  const available = players.filter((player) => !existingIds.has(player.id));
  const pool = options?.pool ?? 'mixed';
  const availableWomen = available.filter((player) => player.gender === 'female');
  const availableMen = available.filter((player) => player.gender === 'male');
  const availableMixed: Player[] = [];
  const maxLen = Math.max(availableWomen.length, availableMen.length);
  for (let i = 0; i < maxLen; i += 1) {
    if (availableWomen[i]) availableMixed.push(availableWomen[i]);
    if (availableMen[i]) availableMixed.push(availableMen[i]);
  }
  const source = pool === 'male' ? availableMen : availableMixed;

  let added = 0;
  let waitingList = 0;

  const newPlayerIds = [...tournament.playerIds];
  const newWaitingListIds = [...tournament.waitingListIds];

  for (const player of source) {
    if (newPlayerIds.length < maxPlayers) {
      newPlayerIds.push(player.id);
      added += 1;
      continue;
    }
    if (waitingList < safeOverflow) {
      newWaitingListIds.push(player.id);
      waitingList += 1;
      continue;
    }
    break;
  }

  if (added > 0 || waitingList > 0) {
    saveTournament({
      ...tournament,
      playerIds: newPlayerIds,
      waitingListIds: newWaitingListIds,
      updatedAt: getCurrentTimestamp(),
    });
  }

  return { added, waitingList };
}
