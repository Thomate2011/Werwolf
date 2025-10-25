// src/services/GameStateManager.ts - AKTUALISIERT

import { Player } from '../types';

export interface GameState {
  healerLastHealed: string | null;
  piperEnchanted: string[];
  wolfhundChoice: 'dorfbewohner' | 'werwolf' | null;
  wildChildModel: string | null;
  bitterOldManGroup1: string[];
  bitterOldManGroup2: string[];
  bitterOldManHasWon: boolean;
  judgeCodeword: string | null;
  lovers: string[];
  
  // HEXEN-TRÄNKE (einmalig pro SPIEL)
  hexeHealPotionUsedEver: boolean;
  hexePoisonPotionUsedEver: boolean;
  
  homelessSleepingAt: string | null;
  foxHasLostAbility: boolean;
  knightInfected: string | null;
  bearAlertPlayers: string[];
}

export class GameStateManager {
  private state: GameState;

  constructor() {
    this.state = {
      healerLastHealed: null,
      piperEnchanted: [],
      wolfhundChoice: null,
      wildChildModel: null,
      bitterOldManGroup1: [],
      bitterOldManGroup2: [],
      bitterOldManHasWon: false,
      judgeCodeword: null,
      lovers: [],
      hexeHealPotionUsedEver: false,
      hexePoisonPotionUsedEver: false,
      homelessSleepingAt: null,
      foxHasLostAbility: false,
      knightInfected: null,
      bearAlertPlayers: [],
    };
  }

  // ============ HEILER ============
  setHealerHeal(playerName: string): void {
    this.state.healerLastHealed = playerName;
  }

  canHealerHeal(playerName: string): boolean {
    return playerName !== this.state.healerLastHealed;
  }

  // ============ FLÖTENSPIELER ============
  addPiperEnchanted(playerName: string): void {
    if (!this.state.piperEnchanted.includes(playerName)) {
      this.state.piperEnchanted.push(playerName);
    }
  }

  isPiperEnchanted(playerName: string): boolean {
    return this.state.piperEnchanted.includes(playerName);
  }

  getPiperEnchantedCount(): number {
    return this.state.piperEnchanted.length;
  }

  // ============ WOLFSHUND ============
  setWolfhundChoice(choice: 'dorfbewohner' | 'werwolf'): void {
    this.state.wolfhundChoice = choice;
  }

  getWolfhundChoice(): 'dorfbewohner' | 'werwolf' | null {
    return this.state.wolfhundChoice;
  }

  // ============ WILDES KIND ============
  setWildChildModel(playerName: string): void {
    this.state.wildChildModel = playerName;
  }

  getWildChildModel(): string | null {
    return this.state.wildChildModel;
  }

  // ============ VERBITTERTER GREIS - GRUPPEN ============
  setBitterOldManGroups(group1: string[], group2: string[]): void {
    this.state.bitterOldManGroup1 = group1;
    this.state.bitterOldManGroup2 = group2;
  }

  checkBitterOldManWin(deadPlayers: Player[]): boolean {
    if (this.state.bitterOldManGroup1.length === 0 || this.state.bitterOldManGroup2.length === 0) {
      return false;
    }

    const bitterOldMans = deadPlayers.filter(p => p.originalRole.id === 'der_verbitterte_greis');
    if (bitterOldMans.length > 0) return false;

    const group1AllDead = this.state.bitterOldManGroup1.every(name => 
      deadPlayers.find(p => p.name === name)
    );

    const group2AllDead = this.state.bitterOldManGroup2.every(name => 
      deadPlayers.find(p => p.name === name)
    );

    return group1AllDead || group2AllDead;
  }

  // ============ RICHTER ============
  setJudgeCodeword(codeword: string): void {
    this.state.judgeCodeword = codeword;
  }

  getJudgeCodeword(): string | null {
    return this.state.judgeCodeword;
  }

  // ============ AMOR / VERLIEBTE ============
  setLovers(player1: string, player2: string): void {
    this.state.lovers = [player1, player2];
  }

  getLovers(): string[] {
    return this.state.lovers;
  }

  areLovers(player1: string, player2: string): boolean {
    return (
      (this.state.lovers[0] === player1 && this.state.lovers[1] === player2) ||
      (this.state.lovers[0] === player2 && this.state.lovers[1] === player1)
    );
  }

  // ============ HEXE - TRÄNKE (einmalig pro SPIEL) ============
  useHealPotion(): void {
    this.state.hexeHealPotionUsedEver = true;
  }

  canUseHealPotion(): boolean {
    return !this.state.hexeHealPotionUsedEver;
  }

  usePoisonPotion(): void {
    this.state.hexePoisonPotionUsedEver = true;
  }

  canUsePoisonPotion(): boolean {
    return !this.state.hexePoisonPotionUsedEver;
  }

  // ============ OBDACHLOS ============
  setHomelessSleepingAt(playerName: string): void {
    this.state.homelessSleepingAt = playerName;
  }

  getHomelessSleepingAt(): string | null {
    return this.state.homelessSleepingAt;
  }

  // ============ FUCHS ============
  setFoxLostAbility(): void {
    this.state.foxHasLostAbility = true;
  }

  foxHasAbility(): boolean {
    return !this.state.foxHasLostAbility;
  }

  // ============ RITTER ============
  setKnightInfected(playerName: string): void {
    this.state.knightInfected = playerName;
  }

  getKnightInfected(): string | null {
    return this.state.knightInfected;
  }

  // ============ BÄRENFÜHRER ============
  setBearAlert(players: string[]): void {
    this.state.bearAlertPlayers = players;
  }

  getBearAlert(): string[] {
    return this.state.bearAlertPlayers;
  }

  // Prüft ob Bärenführer neben Werwolf sitzt
  checkBearAlert(players: Player[]): boolean {
    const bearLeader = players.find(p => 
      p.originalRole.id === 'der_baerenfuehrer' && 
      p.status === 'alive'
    );
    
    if (!bearLeader) return false;

    // Finde Index des Bärenführers
    const alivePlayersOrdered = players.filter(p => p.status === 'alive');
    const bearIndex = alivePlayersOrdered.findIndex(p => p.name === bearLeader.name);
    
    if (bearIndex === -1) return false;

    // Nachbarn
    const leftIndex = (bearIndex - 1 + alivePlayersOrdered.length) % alivePlayersOrdered.length;
    const rightIndex = (bearIndex + 1) % alivePlayersOrdered.length;
    
    const leftNeighbor = alivePlayersOrdered[leftIndex];
    const rightNeighbor = alivePlayersOrdered[rightIndex];

    const werewolfRoles = ['werwolf', 'der_grosse_boese_werwolf', 'der_weisse_werwolf', 'urwolf'];
    
    return (
      werewolfRoles.includes(leftNeighbor.role.id) ||
      werewolfRoles.includes(rightNeighbor.role.id)
    );
  }

  // ============ RESET FÜR NÄCHSTE RUNDE ============
  resetNightState(): void {
    this.state.homelessSleepingAt = null;
    this.state.knightInfected = null;
    this.state.bearAlertPlayers = [];
  }

  // ============ VOLLSTÄNDIGER STATE ============
  getFullState(): GameState {
    return { ...this.state };
  }

  // ============ KOMPLETTER RESET (Neue Partie) ============
  resetAll(): void {
    this.state = {
      healerLastHealed: null,
      piperEnchanted: [],
      wolfhundChoice: null,
      wildChildModel: null,
      bitterOldManGroup1: [],
      bitterOldManGroup2: [],
      bitterOldManHasWon: false,
      judgeCodeword: null,
      lovers: [],
      hexeHealPotionUsedEver: false,
      hexePoisonPotionUsedEver: false,
      homelessSleepingAt: null,
      foxHasLostAbility: false,
      knightInfected: null,
      bearAlertPlayers: [],
    };
  }
}

export const gameStateManager = new GameStateManager();