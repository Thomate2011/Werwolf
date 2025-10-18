  export type Page = 
    | "home" 
    | "player-entry" 
    | "role-selection" 
    | "card-reveal" 
    | "narrator-mode-selector" 
    | "narrator-seating" 
    | "narrator-game-start" 
    | "narrator-game" 
    | "overview" 
    | "narrator";

export interface Role {
    id: string;
    name: string;
    description: string;
}

export interface Player {
    name: string;
    role: Role;
    originalRole: Role;
    status: "alive" | "dead";
}