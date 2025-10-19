// src/components/NarratorDayPhase.tsx - KOMPLETTE TAG-PHASE MIT GEWINN-CHECKS

import React, { useState, useMemo, useCallback } from 'react';
import { Player } from '../types';
import { useTranslation } from '../LanguageContext';
import { gameStateManager } from '../services/GameStateManager';
import { NightPhaseLogic } from '../services/NightPhaseLogic';
import Modal from './Modal';
import LanguageSelector from './LanguageSelector';
import { ROLES_CONFIG } from '../constants';

type DayPhase = 'deaths' | 'maid_action' | 'hunter_action' | 'discussion' | 'voting' | 'game_over';

interface NarratorDayPhaseProps {
  players: Player[];
  nightDeaths: string[];
  hunterDeaths: string[];
  currentRound: number;
  onContinueToNextNight: (players: Player[]) => void;
  onGameEnd: (winner: string) => void;
  onNavigateHome: () => void;
  onRestart: () => void;
}

const NarratorDayPhase: React.FC<NarratorDayPhaseProps> = ({
  players,
  nightDeaths,
  hunterDeaths,
  currentRound,
  onContinueToNextNight,
  onGameEnd,
  onNavigateHome,
  onRestart,
}) => {
  const { t } = useTranslation();

  const [dayPhase, setDayPhase] = useState<DayPhase>('deaths');
  const [modifiedPlayers, setModifiedPlayers] = useState<Player[]>(players);
  const [showMaidModal, setShowMaidModal] = useState(false);
  const [showHunterModal, setShowHunterModal] = useState(false);
  const [showVotingModal, setShowVotingModal] = useState(false);
  const [votingResult, setVotingResult] = useState<string | null>(null);
  const [gameWinner, setGameWinner] = useState<string | null>(null);

  const getRoleInfo = (roleId: string) => {
    const roleConfig = ROLES_CONFIG.find((r) => r.id === roleId);
    if (!roleConfig) return { name: roleId };
    return { name: t(roleConfig.nameKey) };
  };

  const getAlivePlayers = useMemo(() => modifiedPlayers.filter((p) => p.status === 'alive'), [modifiedPlayers]);
  const getDeadPlayers = useMemo(() => modifiedPlayers.filter((p) => p.status === 'dead'), [modifiedPlayers]);

  // ============ GEWINN-BEDINGUNGEN ============
  const checkWinConditions = useCallback((currentPlayers: Player[]): string | null => {
    const alive = currentPlayers.filter((p) => p.status === 'alive');
    const werewolves = alive.filter((p) => NightPhaseLogic.isWerewolf(p.name, currentPlayers));
    const villagers = alive.filter((p) => !NightPhaseLogic.isWerewolf(p.name, currentPlayers));

    // 1. Werwölfe >= Dorfbewohner → Werwölfe gewinnen
    if (werewolves.length >= villagers.length) {
      return t('narrator_win_werewolves_end');
    }

    // 2. Keine Werwölfe mehr → Dorfbewohner gewinnen
    if (werewolves.length === 0) {
      return t('narrator_win_villagers_end');
    }

    // 3. Weißer Wolf allein → Weißer Wolf gewinnt
    const whiteWolf = alive.find((p) => p.role.id === 'der_weisse_werwolf');
    if (whiteWolf && werewolves.length === 1) {
      return t('narrator_win_white_wolf_end');
    }

    // 4. Flötenspieler alle verzaubert → Flötenspieler gewinnt
    const piper = alive.find((p) => p.originalRole.id === 'floetenspieler');
    if (piper && gameStateManager.getPiperEnchantedCount() === alive.length) {
      return t('narrator_win_piper_end');
    }

    // 5. Engel in R1 per Abstimmung gestorben → Engel gewinnt (wird separat gehandhabt)

    // 6. Verbitterter Greis Gruppe eliminiert → Greis gewinnt
    if (gameStateManager.checkBitterOldManWin(currentPlayers.filter((p) => p.status === 'dead'))) {
      return t('narrator_win_bitter_old_man_end');
    }

    // 7. Verliebte nur noch 2 → Verliebte gewinnen
    const lovers = gameStateManager.getLovers();
    if (lovers.length === 2) {
      const aliveLoveCount = alive.filter((p) => lovers.includes(p.name)).length;
      if (aliveLoveCount === 2 && alive.length === 2) {
        return t('narrator_win_lovers_end');
      }
    }

    return null;
  }, [t]);

  // ============ MAID ACTION ============
  const handleMaidAction = (deadPlayerName: string) => {
    const maid = modifiedPlayers.find((p) => p.role.id === 'ergebene_magd' && p.status === 'alive');
    const deadPlayer = modifiedPlayers.find((p) => p.name === deadPlayerName && p.status === 'dead');

    if (maid && deadPlayer) {
      const newPlayers = [...modifiedPlayers];
      const maidIdx = newPlayers.findIndex((p) => p.name === maid.name);
      const deadIdx = newPlayers.findIndex((p) => p.name === deadPlayer.name);

      // Maid nimmt Rolle des Toten an
      if (maidIdx !== -1 && deadIdx !== -1) {
        newPlayers[maidIdx].role = newPlayers[deadIdx].role;
      }

      setModifiedPlayers(newPlayers);
    }

    setShowMaidModal(false);
  };

  // ============ HUNTER ACTION ============
  const handleHunterShot = (targetName: string) => {
    const newPlayers = [...modifiedPlayers];
    const targetIdx = newPlayers.findIndex((p) => p.name === targetName);

    if (targetIdx !== -1) {
      newPlayers[targetIdx].status = 'dead';
    }

    setModifiedPlayers(newPlayers);
    setShowHunterModal(false);

    // Gewinn-Check nach Jäger-Schuss
    const winner = checkWinConditions(newPlayers);
    if (winner) {
      setGameWinner(winner);
      setDayPhase('game_over');
    }
  };

  // ============ VOTING ============
  const handleVoting = (selectedName: string) => {
    const newPlayers = [...modifiedPlayers];
    const selectedIdx = newPlayers.findIndex((p) => p.name === selectedName);

    if (selectedIdx !== -1) {
      newPlayers[selectedIdx].status = 'dead';
      setVotingResult(selectedName);

      // Checks nach Vote
      let playersAfterVote = newPlayers;

      // Engel in R1 per Abstimmung → Engel gewinnt
      const votedPlayer = newPlayers[selectedIdx];
      if (currentRound === 1 && votedPlayer.originalRole.id === 'der_engel') {
        setGameWinner(t('narrator_win_angel_end'));
        setDayPhase('game_over');
        setModifiedPlayers(playersAfterVote);
        setShowVotingModal(false);
        return;
      }

      // Jäger stirbt → Jäger schießt
      if (votedPlayer.originalRole.id === 'jaeger') {
        setShowHunterModal(true);
        setModifiedPlayers(playersAfterVote);
        setShowVotingModal(false);
        return;
      }

      // Verliebte sterben zusammen
      const lovers = gameStateManager.getLovers();
      if (lovers.includes(votedPlayer.name)) {
        const otherLover = lovers.find((n) => n !== votedPlayer.name);
        if (otherLover) {
          const otherIdx = playersAfterVote.findIndex((p) => p.name === otherLover);
          if (otherIdx !== -1) {
            playersAfterVote[otherIdx].status = 'dead';
          }
        }
      }

      setModifiedPlayers(playersAfterVote);

      // Gewinn-Check nach Vote
      const winner = checkWinConditions(playersAfterVote);
      if (winner) {
        setGameWinner(winner);
        setDayPhase('game_over');
        setShowVotingModal(false);
        return;
      }

      setShowVotingModal(false);
      setDayPhase('game_over'); // Für jetzt: Tag zu Ende
    }
  };

  // ============ RENDER PHASES ============

  if (dayPhase === 'deaths') {
    const hasMaid = modifiedPlayers.some((p) => p.role.id === 'ergebene_magd' && p.status === 'alive');

    // Gewinn-Check nach Nacht-Tode
    const winner = checkWinConditions(modifiedPlayers);
    if (winner) {
      return (
        <div className="relative">
          <div className="absolute top-4 right-4 z-50">
            <LanguageSelector />
          </div>
          <div className="w-full max-w-lg mx-auto bg-white rounded-xl shadow-lg p-8 text-[#333]">
            <h1 className="text-3xl font-bold mb-6 text-center text-green-700">{winner}</h1>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onRestart}
                className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700"
              >
                {t('restart')}
              </button>
              <button
                onClick={onNavigateHome}
                className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700"
              >
                {t('to_homepage')}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="relative">
        <div className="absolute top-4 right-4 z-50">
          <LanguageSelector />
        </div>

        <div className="w-full max-w-lg mx-auto bg-white rounded-xl shadow-lg p-8 text-[#333]">
          <h1 className="text-2xl font-bold mb-4 text-center text-yellow-700">☀️ Tagesphase</h1>

          <div className="bg-red-50 p-4 rounded-lg mb-6">
            <p className="font-bold mb-2">{t('narrator_day_deaths_title')}</p>
            {nightDeaths.length > 0 ? (
              <ul className="space-y-1">
                {nightDeaths.map((name) => (
                  <li key={name} className="text-red-700">
                    • {name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">{t('narrator_day_no_deaths')}</p>
            )}
          </div>

          {hasMaid && (
            <button
              onClick={() => setShowMaidModal(true)}
              className="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-700 transition mb-4"
            >
              {t('narrator_day_maid_button')}
            </button>
          )}

          <button
            onClick={() => setDayPhase('voting')}
            className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition"
          >
            {t('next')}
          </button>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="text-center">
              <button
                onClick={onRestart}
                className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700"
              >
                {t('restart')}
              </button>
              <p className="text-xs text-gray-500 mt-1">{t('restart_info')}</p>
            </div>
            <div className="text-center">
              <button
                onClick={onNavigateHome}
                className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700"
              >
                {t('to_homepage')}
              </button>
              <p className="text-xs text-gray-500 mt-1">{t('homepage_info')}</p>
            </div>
          </div>
        </div>

        {showMaidModal && (
          <Modal
            title={t('narrator_day_maid_button')}
            onClose={() => setShowMaidModal(false)}
            isOpaque={true}
          >
            <p className="mb-4 font-semibold">{t('narrator_day_maid_select_dead')}</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {getDeadPlayers.map((p) => (
                <button
                  key={p.name}
                  onClick={() => handleMaidAction(p.name)}
                  className="w-full p-3 bg-gray-100 text-left rounded-lg hover:bg-gray-200"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </Modal>
        )}
      </div>
    );
  }

  if (dayPhase === 'voting') {
    return (
      <div className="relative">
        <div className="absolute top-4 right-4 z-50">
          <LanguageSelector />
        </div>

        <div className="w-full max-w-lg mx-auto bg-white rounded-xl shadow-lg p-8 text-[#333]">
          <h1 className="text-2xl font-bold mb-4 text-center text-yellow-700">☀️ Abstimmung</h1>

          <p className="text-center text-gray-600 mb-6">{t('narrator_day_voting')}</p>

          <button
            onClick={() => setShowVotingModal(true)}
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition mb-4"
          >
            {t('narrator_day_voting_select')}
          </button>

          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <button
                onClick={onRestart}
                className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700"
              >
                {t('restart')}
              </button>
              <p className="text-xs text-gray-500 mt-1">{t('restart_info')}</p>
            </div>
            <div className="text-center">
              <button
                onClick={onNavigateHome}
                className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700"
              >
                {t('to_homepage')}
              </button>
              <p className="text-xs text-gray-500 mt-1">{t('homepage_info')}</p>
            </div>
          </div>
        </div>

        {showVotingModal && (
          <Modal
            title={t('narrator_day_voting_select')}
            onClose={() => setShowVotingModal(false)}
            isOpaque={true}
          >
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {getAlivePlayers.map((p) => (
                <button
                  key={p.name}
                  onClick={() => handleVoting(p.name)}
                  className="w-full p-3 bg-gray-100 text-left rounded-lg hover:bg-gray-200"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </Modal>
        )}

        {showHunterModal && (
          <Modal
            title={t('narrator_day_hunter_shoots')}
            onClose={() => setShowHunterModal(false)}
            isOpaque={true}
          >
            <p className="mb-4">{t('narrator_day_hunter_shoots')}</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {getAlivePlayers
                .filter((p) => !hunterDeaths.includes(p.name))
                .map((p) => (
                  <button
                    key={p.name}
                    onClick={() => handleHunterShot(p.name)}
                    className="w-full p-3 bg-orange-100 text-left rounded-lg hover:bg-orange-200"
                  >
                    {p.name}
                  </button>
                ))}
            </div>
          </Modal>
        )}
      </div>
    );
  }

  if (dayPhase === 'game_over') {
    return (
      <div className="relative">
        <div className="absolute top-4 right-4 z-50">
          <LanguageSelector />
        </div>

        <div className="w-full max-w-lg mx-auto bg-white rounded-xl shadow-lg p-8 text-[#333]">
          <h1 className="text-3xl font-bold mb-6 text-center text-green-700">🎉</h1>
          <p className="text-2xl font-bold text-center mb-8">{gameWinner}</p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onRestart}
              className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700"
            >
              {t('restart')}
            </button>
            <button
              onClick={onNavigateHome}
              className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700"
            >
              {t('to_homepage')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default NarratorDayPhase;