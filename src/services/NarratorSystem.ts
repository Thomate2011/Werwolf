// src/services/NarratorSystem.ts - KOMPLETTES NARRATOR-SYSTEM

import { Player, Role } from '../types';

export interface RoleCallSequence {
  roleId: string;
  playerNames: string[];
  textSequence: string[];
  requiresUserInteraction: boolean;
  pauseAfterMs: number;
}

export class NarratorGameLogic {
  static hasBadGuys(players: Player[]): boolean {
    return players.some(
      (p) =>
        p.role.id === 'werwolf' ||
        p.role.id === 'der_grosse_boese_werwolf' ||
        p.role.id === 'der_weisse_werwolf'
    );
  }

  static getAlivePlayers(players: Player[]): Player[] {
    return players.filter((p) => p.status === 'alive');
  }

  static findPlayersByOriginalRole(players: Player[], roleId: string): Player[] {
    return players.filter(
      (p) => p.originalRole.id === roleId && p.status === 'alive'
    );
  }

  static generateRound1Sequence(players: Player[]): RoleCallSequence[] {
    const sequences: RoleCallSequence[] = [];

    // Reine Seele
    const pureSoulPlayers = this.findPlayersByOriginalRole(players, 'reine_seele');
    if (pureSoulPlayers.length > 0) {
      sequences.push({
        roleId: 'reine_seele',
        playerNames: pureSoulPlayers.map((p) => p.name),
        textSequence: ['narrator_reine_seele'],
        requiresUserInteraction: false,
        pauseAfterMs: 5000,
      });
    }

    // Alle schließen Augen
    sequences.push({
      roleId: 'close_eyes',
      playerNames: [],
      textSequence: ['narrator_close_eyes'],
      requiresUserInteraction: false,
      pauseAfterMs: 5000,
    });

    // Alle Rollen Runde 1
    const roleOrder = [
      {
        id: 'waisenkind',
        texts: ['narrator_waisenkind_open', 'narrator_waisenkind_intro', 'narrator_waisenkind_show_role', 'narrator_waisenkind_ability', 'narrator_waisenkind_close'],
      },
      { id: 'dieb', texts: ['narrator_dieb_open', 'narrator_dieb_action', 'narrator_dieb_close'] },
      { id: 'gaukler', texts: ['narrator_gaukler_open', 'narrator_gaukler_intro', 'narrator_gaukler_action', 'narrator_gaukler_selected', 'narrator_gaukler_close'], checkWerwolf: true },
      { id: 'der_verbitterte_greis', texts: ['narrator_verbitterte_greis_open', 'narrator_verbitterte_greis_intro', 'narrator_verbitterte_greis_warning', 'narrator_verbitterte_greis_close'] },
      { id: 'amor', texts: ['narrator_amor_open', 'narrator_amor_intro', 'narrator_amor_tap', 'narrator_amor_close', 'narrator_amor_wake', 'narrator_amor_explanation', 'narrator_amor_sleep'] },
      { id: 'der_wolfshund', texts: ['narrator_wolfshund_open', 'narrator_wolfshund_intro', 'narrator_wolfshund_action', 'narrator_wolfshund_close'] },
      { id: 'die_drei_brueder', texts: ['narrator_drei_brueder_open', 'narrator_drei_brueder_intro', 'narrator_drei_brueder_explanation', 'narrator_drei_brueder_close'], pauseAfter: true },
      { id: 'die_zwei_schwestern', texts: ['narrator_zwei_schwestern_open', 'narrator_zwei_schwestern_intro', 'narrator_zwei_schwestern_explanation', 'narrator_zwei_schwestern_close'], pauseAfter: true },
      { id: 'das_wilde_kind', texts: ['narrator_wilde_kind_open', 'narrator_wilde_kind_intro', 'narrator_wilde_kind_explanation', 'narrator_wilde_kind_close'] },
      { id: 'der_stotternde_richter', texts: ['narrator_richter_open', 'narrator_richter_intro', 'narrator_richter_instruction', 'narrator_richter_close'] },
      { id: 'seherin', texts: ['narrator_seherin_open', 'narrator_seherin_intro', 'narrator_seherin_show', 'narrator_seherin_close'] },
      { id: 'heiler_beschuetzer', texts: ['narrator_heiler_open', 'narrator_heiler_intro', 'narrator_heiler_protection', 'narrator_heiler_rule', 'narrator_heiler_close'] },
      { id: 'werwolf', texts: ['narrator_werwolf_open', 'narrator_werwolf_intro', 'narrator_werwolf_close'] },
      { id: 'urwolf', texts: ['narrator_urwolf_open', 'narrator_urwolf_intro', 'narrator_urwolf_tap', 'narrator_urwolf_close', 'narrator_urwolf_info'] },
      { id: 'hexe', texts: ['narrator_hexe_open', 'narrator_hexe_intro', 'narrator_hexe_action', 'narrator_hexe_close'] },
      { id: 'floetenspieler', texts: ['narrator_piper_open', 'narrator_piper_intro', 'narrator_piper_tap', 'narrator_piper_close', 'narrator_piper_wake', 'narrator_piper_win', 'narrator_piper_sleep'] },
      { id: 'der_obdachlose', texts: ['narrator_homeless_open', 'narrator_homeless_intro', 'narrator_homeless_rule', 'narrator_homeless_restriction', 'narrator_homeless_close'] },
      { id: 'der_fuchs', texts: ['narrator_fox_open', 'narrator_fox_intro', 'narrator_fox_explanation', 'narrator_fox_result_yes', 'narrator_fox_result_no', 'narrator_fox_close'] },
    ];

    for (const role of roleOrder) {
      let rolePlayers = this.findPlayersByOriginalRole(players, role.id);

      // Gaukler nur wenn nicht Werwolf
      if (role.id === 'gaukler') {
        rolePlayers = rolePlayers.filter((p) => p.role.id !== 'werwolf');
      }

      if (rolePlayers.length > 0) {
        sequences.push({
          roleId: role.id,
          playerNames: rolePlayers.map((p) => p.name),
          textSequence: role.texts,
          requiresUserInteraction: true,
          pauseAfterMs: role.pauseAfter ? 5000 : 0,
        });
      }
    }

    // Nacht ist vorbei
    sequences.push({
      roleId: 'open_eyes',
      playerNames: [],
      textSequence: ['narrator_open_eyes'],
      requiresUserInteraction: false,
      pauseAfterMs: 5000,
    });

    return sequences;
  }

  static generateRound2PlusSequence(
    players: Player[],
    currentRound: number
  ): RoleCallSequence[] {
    const sequences: RoleCallSequence[] = [];

    // Alle schließen Augen
    sequences.push({
      roleId: 'close_eyes',
      playerNames: [],
      textSequence: ['narrator_close_eyes'],
      requiresUserInteraction: false,
      pauseAfterMs: 5000,
    });

    // Alle Rollen Runde 2+
    const roleOrder = [
      { id: 'gaukler', texts: ['narrator_gaukler_open', 'narrator_gaukler_intro', 'narrator_gaukler_action', 'narrator_gaukler_selected', 'narrator_gaukler_close'], onlyEven: false },
      { id: 'seherin', texts: ['narrator_seherin_open', 'narrator_seherin_intro', 'narrator_seherin_show', 'narrator_seherin_close'], onlyEven: false },
      { id: 'heiler_beschuetzer', texts: ['narrator_heiler_open', 'narrator_heiler_intro', 'narrator_heiler_protection', 'narrator_heiler_rule', 'narrator_heiler_close'], onlyEven: false },
      { id: 'werwolf', texts: ['narrator_werwolf_open', 'narrator_werwolf_intro', 'narrator_werwolf_close'], onlyEven: false },
      { id: 'der_grosse_boese_werwolf', texts: ['narrator_big_bad_wolf_open', 'narrator_big_bad_wolf_intro', 'narrator_big_bad_wolf_close'], onlyEven: true },
      { id: 'der_weisse_werwolf', texts: ['narrator_white_wolf_open', 'narrator_white_wolf_intro', 'narrator_white_wolf_close'], onlyEven: true },
      { id: 'hexe', texts: ['narrator_hexe_open', 'narrator_hexe_intro', 'narrator_hexe_action', 'narrator_hexe_close'], onlyEven: false },
      { id: 'floetenspieler', texts: ['narrator_piper_open', 'narrator_piper_intro', 'narrator_piper_tap', 'narrator_piper_close', 'narrator_piper_wake', 'narrator_piper_win', 'narrator_piper_sleep'], onlyEven: false },
      { id: 'der_obdachlose', texts: ['narrator_homeless_open', 'narrator_homeless_intro', 'narrator_homeless_rule', 'narrator_homeless_restriction', 'narrator_homeless_close'], onlyEven: false },
      { id: 'der_fuchs', texts: ['narrator_fox_open', 'narrator_fox_intro', 'narrator_fox_explanation', 'narrator_fox_result_yes', 'narrator_fox_result_no', 'narrator_fox_close'], onlyEven: false },
    ];

    for (const role of roleOrder) {
      if (role.onlyEven && currentRound % 2 !== 0) continue;

      let rolePlayers = this.findPlayersByOriginalRole(players, role.id);

      if (role.id === 'gaukler') {
        rolePlayers = rolePlayers.filter((p) => p.role.id !== 'werwolf');
      }

      if (rolePlayers.length > 0) {
        sequences.push({
          roleId: role.id,
          playerNames: rolePlayers.map((p) => p.name),
          textSequence: role.texts,
          requiresUserInteraction: true,
          pauseAfterMs: 0,
        });
      }
    }

    // Nacht ist vorbei
    sequences.push({
      roleId: 'open_eyes',
      playerNames: [],
      textSequence: ['narrator_open_eyes'],
      requiresUserInteraction: false,
      pauseAfterMs: 5000,
    });

    return sequences;
  }
}