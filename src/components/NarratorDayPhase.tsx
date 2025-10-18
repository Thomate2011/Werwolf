// src/components/NarratorDayPhase.tsx - TAG-PHASE MIT ALLEN FEATURES

import React, { useState, useMemo, useCallback } from 'react';
import { Player } from '../types';
import { useTranslation } from '../LanguageContext';
import { gameStateManager } from '../services/GameStateManager';
import Modal from './Modal';
import LanguageSelector from './LanguageSelector';
import { ROLES_CONFIG } from '../constants';

type DayPhase = 'deaths' | 'maid_action' | 'hunter_action' | 'discussion' | 'voting' | 'game_over';

interface NarratorDayPhaseProps {
  players: Player[];
  nightDeaths: string[];
  currentRound: number;
  onPlayersUpdate: (players: Player[]) => void;
  onContinueToNextRound: (players: Player[], deaths: string[]) => void;
  onGameEnd: (winner: string) => void;
  onNavigateHome: () => void;
  onRestart: () => void;
  locale: string;
  t: (key: string) => string;
}

const NarratorDayPhase: React.FC<NarratorDayPhaseProps> = ({
  players,
  nightDeaths,
  currentRound,
  onPlayersUpdate,
  onContinueToNextRound,
  onGameEnd,
  onNavigateHome,
  onRestart,
  locale,
  t,
}) => {
  const [dayPhase, setDayPhase] = useState<DayPhase>('deaths');
  const [modifiedPlayers, setModifiedPlayers] = useState<Player[]>(players);
  const [showMaidAction, setShowMaidAction] = useState(false);
  const [showHunterAction, setShowHunterAction] = useState(false);
  const [showVoting, setShowVoting] = useState(false);
  const [selectedForVoting, setSelectedForVoting] = useState<string | null>(null);

  const getRoleInfo = (roleId: string) => {
    const roleConfig = ROLES_CONFIG.find((r) => r.id === roleId);
    if (!roleConfig) return { name: roleId };
    return { name: t(roleConfig.nameKey) };
  };

  const getAlivePlayers = useMemo(
    () => modifiedPlayers.filter((p) => p.status === 'alive'),
    [modifiedPlayers]
  );

  const hasMaid = modifiedPlayers.some(p => p.originalRole.id === 'ergebene_magd' && p.status === 'alive');
  const hasHunterInDeaths = nightDeaths.some(name => {
    const player = modifiedPlayers.find(p => p.name === name);
    return player?.originalRole.id === 'jaeger';
  });

  const handleMaidAction = useCallback((targetName: string) => {
    const newPlayers = [...modifiedPlayers];
    const maidIndex = newPlayers.findIndex(p => p.originalRole.id === 'ergebene_magd' && p.status === 'alive');
    const targetIndex = newPlayers.findIndex(p => p.name === targetName);

    if (maidIndex !== -1 && targetIndex !== -1) {
      // Maid nimmt Rolle des Toten an
      const targetRole = newPlayers[targetIndex].role;
      newPlayers[maidIndex].role = targetRole;
    }

    setModifiedPlayers(newPlayers);
    setShowMaidAction(false);
  }, [modifiedPlayers]);

  const handleHunterShot = useCallback((targetName: string) => {
    const newPlayers = [...modifiedPlayers];
    const targetIndex = newPlayers.findIndex(p => p.name === targetName);

    if (targetIndex !== -1) {
      newPlayers[targetIndex].status = 'dead';
    }

    setModifiedPlayers(newPlayers);
    setShowHunterAction(false);
  }, [modifiedPlayers]);

  const handleVote = useCallback((playerName: string) => {
    const newPlayers = [...modifiedPlayers];
    const playerIndex = newPlayers.findIndex(p => p.name === playerName);

    if (playerIndex !== -1) {
      newPlayers[playerIndex].status = 'dead';
    }

    setModifiedPlayers(newPlayers);
    setSelectedForVoting(playerName);
    setShowVoting(false);
  }, [modifiedPlayers]);

  // Phase: Deaths
  if (dayPhase === 'deaths') {
    return (
      <div className="relative">
        <div className="absolute top-4 right-4 z-50">
          <LanguageSelector />
        </div>

        <div className="w-full max-w-lg mx-auto bg-white rounded-xl shadow-lg p-8 text-[#333]">
          <h1 className="text-2xl font-bold mb-4 text-center text-yellow-700">
            ☀️ Tagesphase - Runde {currentRound}
          </h1>

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

          {/* Maid Button */}
          {hasMaid && (
            <button
              onClick={() => setShowMaidAction(true)}
              className="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-700 transition mb-4"
            >
              {t('narrator_day_maid_choice')}
            </button>
          )}

          {/* Continue Button */}
          <button
            onClick={() => {
              if (hasHunterInDeaths) {
                setDayPhase('hunter_action');
              } else {
                setDayPhase('discussion');
              }
            }}
            className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition"
          >
            {t('next')}
          </button>
        </div>

        {/* Maid Modal */}
        {showMaidAction && (
          <Modal
            title={t('narrator_day_maid_choice')}
            onClose={() => setShowMaidAction(false)}
            isOpaque={true}
          >
            <p className="mb-4 font-semibold">{t('narrator_day_maid_choice')}</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {nightDeaths.map((name) => (
                <button
                  key={name}
                  onClick={() => handleMaidAction(name)}
                  className="w-full p-3 bg-gray-100 text-left rounded-lg hover:bg-gray-200"
                >
                  {name}
                </button>
              ))}
            </div>
          </Modal>
        )}
      </div>
    );
  }

  // Phase: Hunter Action
  if (dayPhase === 'hunter_action') {
    return (
      <div className="relative">
        <div className="absolute top-4 right-4 z-50">
          <LanguageSelector />
        </div>

        <div className="w-full max-w-lg mx-auto bg-white rounded-xl shadow-lg p-8 text-[#333]">
          <h1 className="text-2xl font-bold mb-4 text-center text-yellow-700">
            ☀️ Jäger-Schuss
          </h1>

          <div className="bg-orange-50 p-4 rounded-lg mb-6">
            <p className="font-bold mb-2">{t('narrator_day_hunter_shoots')}</p>
            <p className="text-gray-700 text-sm">Wähle ein Opfer für den Jäger.</p>
          </div>

          <button
            onClick={() => setShowHunterAction(true)}
            className="w-full bg-orange-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-orange-700 transition mb-4"
          >
            Jäger wählen
          </button>

          <button
            onClick={() => setDayPhase('discussion')}
            className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition"
          >
            {t('next')}
          </button>
        </div>

        {showHunterAction && (
          <Modal
            title="Jäger wählen"
            onClose={() => setShowHunterAction(false)}
            isOpaque={true}
          >
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {getAlivePlayers.map((player) => (
                <button
                  key={player.name}
                  onClick={() => handleHunterShot(player.name)}
                  className="w-full p-3 bg-gray-100 text-left rounded-lg hover:bg-gray-200"
                >
                  {player.name}
                </button>
              ))}
            </div>
          </Modal>
        )}
      </div>
    );
  }

  // Phase: Discussion
  if (dayPhase === 'discussion') {
    return (
      <div className="relative">
        <div className="absolute top-4 right-4 z-50">
          <LanguageSelector />
        </div>

        <div className="w-full max-w-lg mx-auto bg-white rounded-xl shadow-lg p-8 text-[#333]">
          <h1 className="text-2xl font-bold mb-4 text-center text-yellow-700">
            ☀️ Diskussionsphase
          </h1>

          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <p className="font-bold mb-2">{t('narrator_day_discussion')}</p>
            <p className="text-gray-700 text-sm">Besprecht, wer der Werwolf sein könnte.</p>
          </div>

          <button
            onClick={() => setDayPhase('voting')}
            className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition"
          >
            Zur Abstimmung
          </button>
        </div>
      </div>
    );
  }

  // Phase: Voting
  if (dayPhase === 'voting') {
    return (
      <div className="relative">
        <div className="absolute top-4 right-4 z-50">
          <LanguageSelector />
        </div>

        <div className="w-full max-w-lg mx-auto bg-white rounded-xl shadow-lg p-8 text-[#333]">
          <h1 className="text-2xl font-bold mb-4 text-center text-yellow-700">
            ☀️ Abstimmung
          </h1>

          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <p className="font-bold mb-2">{t('narrator_day_voting')}</p>
          </div>

          <button
            onClick={() => setShowVoting(true)}
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition"
          >
            Person wählen
          </button>
        </div>

        {showVoting && (
          <Modal
            title="Abstimmung"
            onClose={() => setShowVoting(false)}
            isOpaque={true}
          >
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {getAlivePlayers.map((player) => (
                <button
                  key={player.name}
                  onClick={() => handleVote(player.name)}
                  className="w-full p-3 bg-gray-100 text-left rounded-lg hover:bg-gray-200"
                >
                  {player.name}
                </button>
              ))}
            </div>
          </Modal>
        )}
      </div>
    );
  }

  return null;
};

export default NarratorDayPhase;