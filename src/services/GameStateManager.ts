// src/services/GameStateManager.ts - Zentrale Verwaltung aller Spiel-States

import { Player, Role } from '../types';

export interface GameState {
  // Heiler Memory (nur letzte geheilte Person pro Runde)
  healerLastHealed: string | null;
  
  // Flötenspieler - markierte Spieler (bleiben ganze Partie)
  piperEnchanted: string[];
  
  // Wolfshund - welche Rolle wurde gewählt (geheim)
  wolfhundChoice: 'dorfbewohner' | 'werwolf' | null;
  
  // Wildes Kind - welcher Spieler ist Vorbild (geheim)
  wildChildModel: string | null;
  
  // Verbitterter Greis - Gruppen (geheim, nur im Backend)
  bitterOldManGroup1: string[];
  bitterOldManGroup2: string[];
  bitterOldManHasWon: boolean;
  
  // Richter - Codewort
  judgeCodeword: string | null;
  
  // Liebe (Amor)
  lovers: string[];
  
  // Hexe - Tränke (einmalig pro Spiel)
  hexeHealPotionUsed: boolean;
  hexePoisonPotionUsed: boolean;
  
  // Obdachlos - wo übernachtet
  homelessSleepingAt: string | null;
  
  // Fuchs - hat Fähigkeit verloren?
  foxHasLostAbility: boolean;
  
  // Ritter - wer ist infiziert (stirbt nächste Nacht)
  knightInfected: string | null;
  
  // Bären-Alarm (Position-basiert, geheim)
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
      hexeHealPotionUsed: false,
      hexePoisonPotionUsed: false,
      homelessSleepingAt: null,
      foxHasLostAbility: false,
      knightInfected: null,
      bearAlertPlayers: [],
    };
  }

  // Heiler
  setHealerHeal(playerName: string): void {
    this.state.healerLastHealed = playerName;
  }

  canHealerHeal(playerName: string): boolean {
    return playerName !== this.state.healerLastHealed;
  }

  // Flötenspieler
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

  // Wolfshund
  setWolfhundChoice(choice: 'dorfbewohner' | 'werwolf'): void {
    this.state.wolfhundChoice = choice;
  }

  getWolfhundChoice(): 'dorfbewohner' | 'werwolf' | null {
    return this.state.wolfhundChoice;
  }

  // Wildes Kind
  setWildChildModel(playerName: string): void {
    this.state.wildChildModel = playerName;
  }

  getWildChildModel(): string | null {
    return this.state.wildChildModel;
  }

  // Verbitterter Greis - Gruppen
  setBitterOldManGroups(group1: string[], group2: string[]): void {
    this.state.bitterOldManGroup1 = group1;
    this.state.bitterOldManGroup2 = group2;
  }

  checkBitterOldManWin(deadPlayers: Player[]): boolean {
    if (this.state.bitterOldManGroup1.length === 0 || this.state.bitterOldManGroup2.length === 0) {
      return false;
    }

    const bitterOldMans = deadPlayers.filter(p => p.originalRole.id === 'der_verbitterte_greis');
    if (bitterOldMans.length > 0) return false; // Greis ist tot

    const group1AllDead = this.state.bitterOldManGroup1.every(name => 
      deadPlayers.find(p => p.name === name)
    );

    const group2AllDead = this.state.bitterOldManGroup2.every(name => 
      deadPlayers.find(p => p.name === name)
    );

    return group1AllDead || group2AllDead;
  }

  // Richter
  setJudgeCodeword(codeword: string): void {
    this.state.judgeCodeword = codeword;
  }

  getJudgeCodeword(): string | null {
    return this.state.judgeCodeword;
  }

  // Amor
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

  // Hexe
  useHealPotion(): void {
    this.state.hexeHealPotionUsed = true;
  }

  canUseHealPotion(): boolean {
    return !this.state.hexeHealPotionUsed;
  }

  usePoisonPotion(): void {
    this.state.hexePoisonPotionUsed = true;
  }

  canUsePoisonPotion(): boolean {
    return !this.state.hexePoisonPotionUsed;
  }

  // Obdachlos
  setHomelessSleepingAt(playerName: string): void {
    this.state.homelessSleepingAt = playerName;
  }

  getHomelessSleepingAt(): string | null {
    return this.state.homelessSleepingAt;
  }

  // Fuchs
  setFoxLostAbility(): void {
    this.state.foxHasLostAbility = true;
  }

  foxHasAbility(): boolean {
    return !this.state.foxHasLostAbility;
  }

  // Ritter
  setKnightInfected(playerName: string): void {
    this.state.knightInfected = playerName;
  }

  getKnightInfected(): string | null {
    return this.state.knightInfected;
  }

  // Bär
  setBearAlert(players: string[]): void {
    this.state.bearAlertPlayers = players;
  }

  getBearAlert(): string[] {
    return this.state.bearAlertPlayers;
  }

  // Reset für neue Nacht
  resetNightState(): void {
    this.state.homelessSleepingAt = null;
    this.state.knightInfected = null;
  }

  // Vollständiger State
  getFullState(): GameState {
    return { ...this.state };
  }
}

export const gameStateManager = new GameStateManager();