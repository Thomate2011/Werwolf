export type Page = 'home' | 'player-entry' | 'role-selection' | 'card-reveal' | 'overview' | 'narrator';

export interface Role {
  id: string;
  name: string;
  description: string;
}

export interface Player {
  name: string;
  role: Role;
  originalRole: Role;
  status: 'alive' | 'dead';
}