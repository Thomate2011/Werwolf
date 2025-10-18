// src/components/NarratorNightFlow.tsx - KOMPLETTER NACHT-FLOW MIT ALLEN ROLLEN

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Player } from '../types';
import { useTranslation } from '../LanguageContext';
import { audioManager } from '../services/AudioManager';
import { gameStateManager } from '../services/GameStateManager';
import Modal from './Modal';
import LanguageSelector from './LanguageSelector';
import { ROLES_CONFIG } from '../constants';

interface NarratorNightFlowProps {
  players: Player[];
  currentRound: number;
  onNightComplete: (updatedPlayers: Player[]) => void;
  onNavigateHome: () => void;
  onRestart: () => void;
}

type ActionType = 
  | 'none'
  | 'waisenkind' | 'dieb' | 'gaukler' | 'greis' | 'amor' | 'wolfshund' 
  | 'richter' | 'seherin' | 'heiler' | 'werwolf' | 'urwolf' | 'hexe'
  | 'piper' | 'homeless' | 'fuchs' | 'big_bad_wolf' | 'white_wolf';

interface NightState {
  currentRoleIndex: number;
  isPlayingAudio: boolean;
  currentAction: ActionType;
  selections: Record<string, any>;
  showActionModal: boolean;
  modifiedPlayers: Player[];
}

const NarratorNightFlow: React.FC<NarratorNightFlowProps> = ({
  players,
  currentRound,
  onNightComplete,
  onNavigateHome,
  onRestart,
}) => {
  const { t, locale } = useTranslation();
  const [nightState, setNightState] = useState<NightState>({
    currentRoleIndex: 0,
    isPlayingAudio: false,
    currentAction: 'none',
    selections: {},
    showActionModal: false,
    modifiedPlayers: players,
  });

  const [pauseTimer, setPauseTimer] = useState<NodeJS.Timeout | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const getRoleInfo = (roleId: string) => {
    const roleConfig = ROLES_CONFIG.find((r) => r.id === roleId);
    if (!roleConfig) return { name: roleId };
    return { name: t(roleConfig.nameKey) };
  };

  const getAlivePlayers = useMemo(
    () => nightState.modifiedPlayers.filter((p) => p.status === 'alive'),
    [nightState.modifiedPlayers]
  );

  // Rollen-Sequenz für diese Nacht
  const roleSequence = useMemo(() => {
    const sequence: { roleId: string; key: string; requiresAction: boolean }[] = [];

    // Reine Seele (nur Runde 1)
    if (currentRound === 1 && players.some(p => p.originalRole.id === 'reine_seele' && p.status === 'alive')) {
      sequence.push({ roleId: 'reine_seele', key: 'narrator_reine_seele', requiresAction: false });
    }

    // Dorfbewohner - Augen schließen (5s Pause)
    sequence.push({ roleId: 'close_eyes', key: 'narrator_close_eyes', requiresAction: false });

    // Alle Rollen Runde 1
    if (currentRound === 1) {
      const roles = [
        { id: 'waisenkind', key: 'narrator_waisenkind_open', action: true },
        { id: 'dieb', key: 'narrator_dieb_open', action: true },
        { id: 'gaukler', key: 'narrator_gaukler_open', action: true },
        { id: 'der_verbitterte_greis', key: 'narrator_verbitterte_greis_open', action: true },
        { id: 'amor', key: 'narrator_amor_open', action: true },
        { id: 'der_wolfshund', key: 'narrator_wolfshund_open', action: true },
        { id: 'die_drei_brueder', key: 'narrator_drei_brueder_open', action: false },
        { id: 'die_zwei_schwestern', key: 'narrator_zwei_schwestern_open', action: false },
        { id: 'das_wilde_kind', key: 'narrator_wilde_kind_open', action: true },
        { id: 'der_stotternde_richter', key: 'narrator_richter_open', action: true },
        { id: 'seherin', key: 'narrator_seherin_open', action: true },
        { id: 'heiler_beschuetzer', key: 'narrator_heiler_open', action: true },
        { id: 'werwolf', key: 'narrator_werwolf_open', action: true },
        { id: 'urwolf', key: 'narrator_urwolf_open', action: true },
        { id: 'hexe', key: 'narrator_hexe_open', action: true },
        { id: 'floetenspieler', key: 'narrator_piper_open', action: true },
        { id: 'der_obdachlose', key: 'narrator_homeless_open', action: true },
        { id: 'der_fuchs', key: 'narrator_fox_open', action: true },
      ];

      roles.forEach(role => {
        if (nightState.modifiedPlayers.some(p => p.originalRole.id === role.id && p.status === 'alive')) {
          sequence.push({ roleId: role.id, key: role.key, requiresAction: role.action });
          sequence.push({ roleId: `${role.id}_pause`, key: '', requiresAction: false }); // 5s Pause nach jeder Rolle
        }
      });
    } else {
      // Runde 2+: Nur Gaukler, Seherin, Heiler, Werwölfe, Hexe, Flötenspieler, Obdachlos, Fuchs
      const roles = [
        { id: 'gaukler', key: 'narrator_gaukler_open', action: true },
        { id: 'seherin', key: 'narrator_seherin_open', action: true },
        { id: 'heiler_beschuetzer', key: 'narrator_heiler_open', action: true },
        { id: 'werwolf', key: 'narrator_werwolf_open', action: true },
        { id: 'der_grosse_boese_werwolf', key: 'narrator_big_bad_wolf_open', action: true },
        { id: 'der_weisse_werwolf', key: 'narrator_white_wolf_open', action: true },
        { id: 'hexe', key: 'narrator_hexe_open', action: true },
        { id: 'floetenspieler', key: 'narrator_piper_open', action: true },
        { id: 'der_obdachlose', key: 'narrator_homeless_open', action: true },
        { id: 'der_fuchs', key: 'narrator_fox_open', action: true },
      ];

      roles.forEach(role => {
        if (nightState.modifiedPlayers.some(p => p.originalRole.id === role.id && p.status === 'alive')) {
          sequence.push({ roleId: role.id, key: role.key, requiresAction: role.action });
          sequence.push({ roleId: `${role.id}_pause`, key: '', requiresAction: false });
        }
      });
    }

    // Augen öffnen
    sequence.push({ roleId: 'open_eyes', key: 'narrator_open_eyes', requiresAction: false });

    return sequence;
  }, [currentRound, nightState.modifiedPlayers, t]);

  const currentRole = roleSequence[nightState.currentRoleIndex];

  // Audio Management
  useEffect(() => {
    if (!currentRole || nightState.isPlayingAudio || isPaused) return;

    if (currentRole.key === '') {
      // Pause (5 Sekunden)
      setIsPaused(true);
      const timer = setTimeout(() => {
        setIsPaused(false);
        handleNext();
      }, 5000);
      setPauseTimer(timer);
      return;
    }

    // Spiele Audio
    setNightState(prev => ({ ...prev, isPlayingAudio: true }));
    audioManager.playAudio(locale as any, currentRole.key, () => {
      setNightState(prev => ({ ...prev, isPlayingAudio: false }));
      
      // Wenn Action nötig ist, zeige sie
      if (currentRole.requiresAction) {
        setNightState(prev => ({
          ...prev,
          currentAction: currentRole.roleId as ActionType,
          showActionModal: true,
        }));
      }
    });
  }, [currentRole, nightState.isPlayingAudio, isPaused, locale]);

  const handleNext = useCallback(() => {
    audioManager.stopAudio();
    if (pauseTimer) clearTimeout(pauseTimer);
    setIsPaused(false);

    setNightState(prev => ({
      ...prev,
      currentRoleIndex: prev.currentRoleIndex + 1,
      currentAction: 'none',
      showActionModal: false,
    }));
  }, [pauseTimer]);

  // Nacht beendet
  if (nightState.currentRoleIndex >= roleSequence.length) {
    onNightComplete(nightState.modifiedPlayers);
    return null;
  }

  return (
    <div className="relative">
      <div className="absolute top-4 right-4 z-50">
        <LanguageSelector />
      </div>

      <div className="w-full max-w-lg mx-auto bg-white rounded-xl shadow-lg p-8 text-[#333]">
        <h1 className="text-2xl font-bold mb-4 text-center text-green-700">
          🌙 Nacht - Runde {currentRound}
        </h1>

        {currentRole && (
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-gray-600">
              ({nightState.currentRoleIndex + 1} / {roleSequence.length})
            </p>
          </div>
        )}

        {isPaused && (
          <div className="text-center mb-4 p-3 bg-yellow-50 rounded-lg">
            <p className="text-gray-700">⏸️ Pause... (überspring mit Weiter)</p>
          </div>
        )}

        {nightState.isPlayingAudio && (
          <div className="text-center mb-4 p-3 bg-yellow-50 rounded-lg">
            <p className="text-gray-700 animate-pulse">🔊 Audio läuft...</p>
          </div>
        )}

        {/* Control Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => {
              audioManager.stopAudio();
              if (pauseTimer) clearTimeout(pauseTimer);
              setIsPaused(false);
            }}
            className="w-full bg-red-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-700 transition"
          >
            {t('stop')}
          </button>
          <button
            onClick={handleNext}
            className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition"
          >
            {t('next')}
          </button>
        </div>

        {/* Restart und Home */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <button
              onClick={onRestart}
              className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition"
            >
              {t('restart')}
            </button>
            <p className="text-xs text-gray-500 mt-1">{t('restart_info')}</p>
          </div>
          <div className="text-center">
            <button
              onClick={onNavigateHome}
              className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition"
            >
              {t('to_homepage')}
            </button>
            <p className="text-xs text-gray-500 mt-1">{t('homepage_info')}</p>
          </div>
        </div>
      </div>

      {/* Action Modals */}
      {nightState.showActionModal && (
        <Modal
          title="Auswahl"
          onClose={() => {}}
          size="md"
          isOpaque={true}
        >
          <p>Action für {nightState.currentAction}</p>
          <button
            onClick={handleNext}
            className="mt-4 w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg"
          >
            {t('continue')}
          </button>
        </Modal>
      )}
    </div>
  );
};

export default NarratorNightFlow;