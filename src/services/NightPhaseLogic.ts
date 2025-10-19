// src/services/NightPhaseLogic.ts - ALLE ACTION-HANDLER & KOMPLEXE LOGIK

import { Player, Role } from '../types';
import { gameStateManager } from './GameStateManager';

export interface NightDeathResult {
  deadPlayers: string[];
  updatedPlayers: Player[];
  hunterDeaths?: string[];
}

export class NightPhaseLogic {
  // ============ NACHBAR-LOGIK ============
  static getNeighbors(playerName: string, allPlayers: Player[]): string[] {
    const aliveNames = allPlayers.filter(p => p.status === 'alive').map(p => p.name);
    const idx = aliveNames.indexOf(playerName);
    if (idx === -1) return [];
    
    const left = aliveNames[(idx - 1 + aliveNames.length) % aliveNames.length];
    const right = aliveNames[(idx + 1) % aliveNames.length];
    return [left, right];
  }

  static isWerewolf(playerName: string, allPlayers: Player[]): boolean {
    const player = allPlayers.find(p => p.name === playerName);
    if (!player) return false;
    
    const werewolfRoles = ['werwolf', 'der_grosse_boese_werwolf', 'der_weisse_werwolf', 'urwolf'];
    if (werewolfRoles.includes(player.role.id)) return true;
    
    // Wildes Kind als Werwolf?
    if (player.originalRole.id === 'das_wilde_kind') {
      const model = gameStateManager.getWildChildModel();
      if (model) {
        const modelPlayer = allPlayers.find(p => p.name === model);
        if (modelPlayer && werewolfRoles.includes(modelPlayer.role.id)) return true;
      }
    }
    
    // Wolfshund als Werwolf?
    if (player.originalRole.id === 'der_wolfshund' && gameStateManager.getWolfhundChoice() === 'werwolf') {
      return true;
    }
    
    return false;
  }

  // ============ WAISENKIND ============
  static handleOrphanSelect(orphanName: string, selectedName: string, players: Player[]): Player[] {
    const newPlayers = [...players];
    const orphanIdx = newPlayers.findIndex(p => p.name === orphanName);
    const selectedIdx = newPlayers.findIndex(p => p.name === selectedName);

    if (orphanIdx !== -1 && selectedIdx !== -1) {
      const selectedRole = newPlayers[selectedIdx].role;
      newPlayers[orphanIdx].role = selectedRole;
    }

    return newPlayers;
  }

  // ============ DIEB ============
  static handleThiefCardSelect(thiefName: string, selectedCard: Role, players: Player[]): Player[] {
    const newPlayers = [...players];
    const thiefIdx = newPlayers.findIndex(p => p.name === thiefName);

    if (thiefIdx !== -1) {
      newPlayers[thiefIdx].role = selectedCard;
    }

    return newPlayers;
  }

  // ============ GAUKLER ============
  static handleJesterCardSelect(jesterName: string, selectedCard: Role, players: Player[]): Player[] {
    const newPlayers = [...players];
    const jesterIdx = newPlayers.findIndex(p => p.name === jesterName);

    if (jesterIdx !== -1) {
      newPlayers[jesterIdx].role = selectedCard;
    }

    return newPlayers;
  }

  // ============ VERBITTERTER GREIS ============
  static validateGreisSelection(selected: string[], allPlayers: Player[]): boolean {
    const aliveCount = allPlayers.filter(p => p.status === 'alive').length;
    return selected.length === Math.floor(aliveCount / 2);
  }

  static handleGreisGroupSelect(greisFamilyName: string, group1Names: string[], group2Names: string[], players: Player[]): Player[] {
    gameStateManager.setBitterOldManGroups(group1Names, group2Names);
    return players;
  }

  // ============ AMOR ============
  static handleAmorSelect(lover1: string, lover2: string, players: Player[]): Player[] {
    gameStateManager.setLovers(lover1, lover2);
    return players;
  }

  // ============ WOLFSHUND ============
  static handleWolfhundChoose(choice: 'dorfbewohner' | 'werwolf', wolfhundName: string, players: Player[]): Player[] {
    gameStateManager.setWolfhundChoice(choice);
    const newPlayers = [...players];
    const wolfhundIdx = newPlayers.findIndex(p => p.name === wolfhundName);

    if (wolfhundIdx !== -1) {
      if (choice === 'werwolf') {
        const werwolfRole = newPlayers.find(p => p.originalRole.id === 'werwolf')?.role;
        if (werwolfRole) {
          newPlayers[wolfhundIdx].role = werwolfRole;
        }
      }
    }

    return newPlayers;
  }

  // ============ WILDES KIND ============
  static handleWildChildSelect(wildChildName: string, modelName: string, players: Player[]): Player[] {
    gameStateManager.setWildChildModel(modelName);
    return players;
  }

  // ============ RICHTER ============
  static handleJudgeCodeword(codeword: string): void {
    gameStateManager.setJudgeCodeword(codeword);
  }

  // ============ SEHERIN ============
  static handleSeerSelect(seerName: string, targetName: string, players: Player[]): Role | null {
    const target = players.find(p => p.name === targetName);
    return target?.role || null;
  }

  // ============ HEILER ============
  static canHealerHeal(targetName: string): boolean {
    return gameStateManager.canHealerHeal(targetName);
  }

  static handleHealerSelect(healerName: string, targetName: string, players: Player[]): Player[] {
    gameStateManager.setHealerHeal(targetName);
    return players;
  }

  // ============ WERWÖLFE ============
  static getValidWerewolfTargets(allPlayers: Player[]): Player[] {
    return allPlayers.filter(p => 
      p.status === 'alive' && 
      !['werwolf', 'der_grosse_boese_werwolf', 'der_weisse_werwolf', 'urwolf'].includes(p.role.id)
    );
  }

  static handleWerewolvesSelect(selectedName: string, allPlayers: Player[]): string {
    return selectedName;
  }

  // ============ URWOLF ============
  static handleUrwolfSelect(targetName: string, players: Player[]): Player[] {
    const newPlayers = [...players];
    const targetIdx = newPlayers.findIndex(p => p.name === targetName);

    if (targetIdx !== -1) {
      const werwolfRole = newPlayers.find(p => p.originalRole.id === 'werwolf')?.role;
      if (werwolfRole) {
        newPlayers[targetIdx].role = werwolfRole;
      }
    }

    return newPlayers;
  }

  // ============ HEXE ============
  static canUseHealPotion(): boolean {
    return gameStateManager.canUseHealPotion();
  }

  static canUsePoisonPotion(): boolean {
    return gameStateManager.canUsePoisonPotion();
  }

  static handleHexeHeal(): void {
    gameStateManager.useHealPotion();
  }

  static handleHexePoison(): void {
    gameStateManager.usePoisonPotion();
  }

  static handleHexePoisonTarget(targetName: string): string {
    return targetName;
  }

  // ============ FLÖTENSPIELER ============
  static handlePiperSelect(person1: string, person2: string): void {
    gameStateManager.addPiperEnchanted(person1);
    gameStateManager.addPiperEnchanted(person2);
  }

  static getAlreadyEnchanted(allPlayers: Player[]): string[] {
    return allPlayers
      .filter(p => gameStateManager.isPiperEnchanted(p.name))
      .map(p => p.name);
  }

  // ============ OBDACHLOS ============
  static handleHomelessSelect(homelessName: string, targetName: string, players: Player[]): Player[] {
    gameStateManager.setHomelessSleepingAt(targetName);
    return players;
  }

  // ============ FUCHS ============
  static handleFoxSelect(foxName: string, targetName: string, players: Player[]): { hasWerewolf: boolean; players: Player[] } {
    const neighbors = this.getNeighbors(targetName, players);
    const checkNames = [targetName, ...neighbors];

    const hasWerewolf = checkNames.some(name => this.isWerewolf(name, players));

    if (!hasWerewolf) {
      gameStateManager.setFoxLostAbility();
    }

    return { hasWerewolf, players };
  }

  // ============ GROSSER BÖSER WOLF ============
  static handleBigBadWolfSelect(selectedName: string, allPlayers: Player[]): string {
    return selectedName;
  }

  // ============ WEISSER WERWOLF ============
  static getWerewolfTargets(allPlayers: Player[]): Player[] {
    return allPlayers.filter(p => 
      p.status === 'alive' && 
      ['werwolf', 'der_grosse_boese_werwolf', 'urwolf'].includes(p.role.id)
    );
  }

  static handleWhiteWolfSelect(selectedName: string): string {
    return selectedName;
  }

  // ============ HAUPT-TODES-VERARBEITUNG ============
  static processNightDeaths(
    werewolvesTarget: string | null,
    hexeHealTarget: string | null,
    hexePoisonTarget: string | null,
    bigBadWolfTarget: string | null,
    whiteWolfTarget: string | null,
    healerProtected: string | null,
    allPlayers: Player[]
  ): NightDeathResult {
    let newPlayers = [...allPlayers];
    const deathSet = new Set<string>();
    const hunterDeaths: string[] = [];

    // 1. Werwölfe töten
    if (werewolvesTarget && !this.isProtected(werewolvesTarget, healerProtected, hexeHealTarget)) {
      deathSet.add(werewolvesTarget);
    }

    // 2. Großer böser Wolf tötet zweites Opfer
    if (bigBadWolfTarget && !this.isProtected(bigBadWolfTarget, healerProtected, hexeHealTarget)) {
      deathSet.add(bigBadWolfTarget);
    }

    // 3. Hexe Gift
    if (hexePoisonTarget && !this.isProtected(hexePoisonTarget, healerProtected, hexeHealTarget)) {
      deathSet.add(hexePoisonTarget);
    }

    // 4. Weißer Wolf tötet Werwolf
    if (whiteWolfTarget) {
      deathSet.add(whiteWolfTarget);
    }

    // 5. Obdachlos-Logik
    const homelessAt = gameStateManager.getHomelessSleepingAt();
    if (homelessAt && deathSet.has(homelessAt)) {
      const homeless = newPlayers.find(p => p.originalRole.id === 'der_obdachlose');
      if (homeless) {
        deathSet.add(homeless.name);
      }
    }

    // 6. Verliebte-Logik
    const lovers = gameStateManager.getLovers();
    if (lovers.length === 2) {
      if (deathSet.has(lovers[0])) {
        deathSet.add(lovers[1]);
      }
      if (deathSet.has(lovers[1])) {
        deathSet.add(lovers[0]);
      }
    }

    // 7. Ritter-Infiziert-Logik
    const knightInfected = gameStateManager.getKnightInfected();
    if (knightInfected) {
      deathSet.add(knightInfected);
    }

    // 8. Jäger-Tracking
    deathSet.forEach(deadName => {
      const deadPlayer = newPlayers.find(p => p.name === deadName);
      if (deadPlayer?.originalRole.id === 'jaeger') {
        hunterDeaths.push(deadName);
      }
    });

    // Deaths anwenden
    newPlayers = newPlayers.map(p => 
      deathSet.has(p.name) ? { ...p, status: 'dead' } : p
    );

    // GameStateManager für nächste Runde reset
    gameStateManager.resetNightState();

    return {
      deadPlayers: Array.from(deathSet),
      updatedPlayers: newPlayers,
      hunterDeaths,
    };
  }

  private static isProtected(playerName: string, healerProtected: string | null, hexeHealed: string | null): boolean {
    return playerName === healerProtected || playerName === hexeHealed;
  }
}