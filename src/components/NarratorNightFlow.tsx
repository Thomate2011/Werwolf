// src/components/NarratorNightFlow.tsx - MIT TODES-VERARBEITUNG & ÜBERGABE

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Player, Role } from '../types';
import { useTranslation } from '../LanguageContext';
import { audioManager } from '../services/AudioManager';
import { gameStateManager } from '../services/GameStateManager';
import { NightPhaseLogic } from '../services/NightPhaseLogic';
import Modal from './Modal';
import LanguageSelector from './LanguageSelector';
import { ROLES_CONFIG } from '../constants';

interface NarratorNightFlowProps {
  players: Player[];
  currentRound: number;
  onNightComplete: (updatedPlayers: Player[], nightDeaths: string[], hunterDeaths: string[]) => void;
  onNavigateHome: () => void;
  onRestart: () => void;
  thiefExtraRoles?: Role[];
  jesterExtraRoles?: Role[];
}

type PhaseKey = 
  | 'pure_soul' | 'close_eyes' | 'orphan' | 'thief' | 'jester' | 'bitter_old_man'
  | 'amor_select' | 'amor_lovers_wake' | 'wolfhound' | 'three_brothers' | 'two_sisters'
  | 'wild_child' | 'judge' | 'seer' | 'healer' | 'werewolves' | 'urwolf' | 'hexe'
  | 'piper' | 'homeless' | 'fox' | 'big_bad_wolf' | 'white_wolf' | 'open_eyes' | 'end';

interface Phase {
  key: PhaseKey;
  audioKey: string;
  hasAction: boolean;
  pauseAfterMs: number;
}

interface NightState {
  werewolvesTarget: string | null;
  healerProtected: string | null;
  hexeHealTarget: string | null;
  hexePoisonTarget: string | null;
  bigBadWolfTarget: string | null;
  whiteWolfTarget: string | null;
  amorLovers: string[];
}

const NarratorNightFlow: React.FC<NarratorNightFlowProps> = ({
  players,
  currentRound,
  onNightComplete,
  onNavigateHome,
  onRestart,
  thiefExtraRoles = [],
  jesterExtraRoles = [],
}) => {
  const { t, locale } = useTranslation();

  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [modifiedPlayers, setModifiedPlayers] = useState<Player[]>(players);
  const [nightState, setNightState] = useState<NightState>({
    werewolvesTarget: null,
    healerProtected: null,
    hexeHealTarget: null,
    hexePoisonTarget: null,
    bigBadWolfTarget: null,
    whiteWolfTarget: null,
    amorLovers: [],
  });
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionTitle, setActionTitle] = useState('');
  const [actionContent, setActionContent] = useState<React.ReactNode>(null);
  const [selectionCount, setSelectionCount] = useState(0);
  const [selectedGreisNames, setSelectedGreisNames] = useState<string[]>([]);
  const [seerRevealedRole, setSeerRevealedRole] = useState<Role | null>(null);
  const [foxResult, setFoxResult] = useState<{ hasWerewolf: boolean } | null>(null);

  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);

  const phaseSequence = useMemo<Phase[]>(() => {
    const seq: Phase[] = [];

    if (currentRound === 1 && modifiedPlayers.some(p => p.originalRole.id === 'reine_seele' && p.status === 'alive')) {
      seq.push({ key: 'pure_soul', audioKey: 'narrator_reine_seele', hasAction: false, pauseAfterMs: 0 });
    }

    seq.push({ key: 'close_eyes', audioKey: 'narrator_close_eyes', hasAction: false, pauseAfterMs: 5000 });

    const allRoles: PhaseKey[] = ['orphan', 'thief', 'jester', 'bitter_old_man', 'amor_select', 'wolfhound', 'three_brothers', 'two_sisters', 'wild_child', 'judge', 'seer', 'healer', 'werewolves', 'urwolf', 'hexe', 'piper', 'homeless', 'fox'];
    
    allRoles.forEach(key => {
      if (shouldIncludeRole(key)) {
        seq.push({ key, audioKey: getAudioKey(key), hasAction: true, pauseAfterMs: 5000 });
      }
    });

    if (currentRound >= 2) {
      if (currentRound % 2 === 0 && shouldIncludeRole('big_bad_wolf')) {
        seq.push({ key: 'big_bad_wolf', audioKey: 'narrator_big_bad_wolf_open', hasAction: true, pauseAfterMs: 5000 });
      }
      if (currentRound % 2 === 0 && shouldIncludeRole('white_wolf')) {
        seq.push({ key: 'white_wolf', audioKey: 'narrator_white_wolf_open', hasAction: true, pauseAfterMs: 5000 });
      }
    }

    seq.push({ key: 'open_eyes', audioKey: 'narrator_open_eyes', hasAction: false, pauseAfterMs: 0 });
    seq.push({ key: 'end', audioKey: '', hasAction: false, pauseAfterMs: 0 });

    return seq;
  }, [currentRound, modifiedPlayers]);

  const shouldIncludeRole = (roleKey: PhaseKey): boolean => {
    const roleMap: Record<PhaseKey, string[]> = {
      pure_soul: ['reine_seele'],
      close_eyes: [],
      orphan: ['waisenkind'],
      thief: ['dieb'],
      jester: ['gaukler'],
      bitter_old_man: ['der_verbitterte_greis'],
      amor_select: ['amor'],
      amor_lovers_wake: ['amor'],
      wolfhound: ['der_wolfshund'],
      three_brothers: ['die_drei_brueder'],
      two_sisters: ['die_zwei_schwestern'],
      wild_child: ['das_wilde_kind'],
      judge: ['der_stotternde_richter'],
      seer: ['seherin'],
      healer: ['heiler_beschuetzer'],
      werewolves: ['werwolf'],
      urwolf: ['urwolf'],
      hexe: ['hexe'],
      piper: ['floetenspieler'],
      homeless: ['der_obdachlose'],
      fox: ['der_fuchs'],
      big_bad_wolf: ['der_grosse_boese_werwolf'],
      white_wolf: ['der_weisse_werwolf'],
      open_eyes: [],
      end: [],
    };

    return roleMap[roleKey].some(roleId => 
      modifiedPlayers.some(p => p.originalRole.id === roleId && p.status === 'alive')
    );
  };

  const getAudioKey = (roleKey: PhaseKey): string => {
    const audioMap: Record<PhaseKey, string> = {
      pure_soul: 'narrator_reine_seele',
      close_eyes: 'narrator_close_eyes',
      orphan: 'narrator_waisenkind_open',
      thief: 'narrator_dieb_open',
      jester: 'narrator_gaukler_open',
      bitter_old_man: 'narrator_verbitterte_greis_open',
      amor_select: 'narrator_amor_open',
      amor_lovers_wake: 'narrator_amor_wake',
      wolfhound: 'narrator_wolfshund_open',
      three_brothers: 'narrator_drei_brueder_open',
      two_sisters: 'narrator_zwei_schwestern_open',
      wild_child: 'narrator_wilde_kind_open',
      judge: 'narrator_richter_open',
      seer: 'narrator_seherin_open',
      healer: 'narrator_heiler_open',
      werewolves: 'narrator_werwolf_open',
      urwolf: 'narrator_urwolf_open',
      hexe: 'narrator_hexe_open',
      piper: 'narrator_piper_open',
      homeless: 'narrator_homeless_open',
      fox: 'narrator_fox_open',
      big_bad_wolf: 'narrator_big_bad_wolf_open',
      white_wolf: 'narrator_white_wolf_open',
      open_eyes: 'narrator_open_eyes',
      end: '',
    };
    return audioMap[roleKey] || '';
  };

  const currentPhase = phaseSequence[currentPhaseIndex];

  useEffect(() => {
    if (!currentPhase || isPaused) return;

    if (currentPhase.key === 'end') {
      // Todes-Verarbeitung
      const deathResult = NightPhaseLogic.processNightDeaths(
        nightState.werewolvesTarget,
        nightState.hexeHealTarget,
        nightState.hexePoisonTarget,
        nightState.bigBadWolfTarget,
        nightState.whiteWolfTarget,
        nightState.healerProtected,
        modifiedPlayers
      );

      onNightComplete(deathResult.updatedPlayers, deathResult.deadPlayers, deathResult.hunterDeaths || []);
      return;
    }

    if (currentPhase.pauseAfterMs > 0 && currentPhase.audioKey) {
      const playAudio = () => {
        setIsAudioPlaying(true);
        audioManager.playAudio(locale as any, currentPhase.audioKey, () => {
          setIsAudioPlaying(false);

          if (currentPhase.hasAction && currentPhase.key !== 'three_brothers' && currentPhase.key !== 'two_sisters') {
            showActionForPhase(currentPhase.key);
          } else {
            setIsPaused(true);
            const timer = setTimeout(() => {
              setIsPaused(false);
              handleNextPhase();
            }, currentPhase.pauseAfterMs);
            pauseTimerRef.current = timer;
          }
        });
      };

      if (!isAudioPlaying) {
        playAudio();
      }

      return () => {
        if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
      };
    } else if (currentPhase.pauseAfterMs > 0 && !currentPhase.audioKey) {
      setIsPaused(true);
      const timer = setTimeout(() => {
        setIsPaused(false);
        handleNextPhase();
      }, currentPhase.pauseAfterMs);
      pauseTimerRef.current = timer;
    }
  }, [currentPhaseIndex, currentPhase, isAudioPlaying, isPaused]);

  const showActionForPhase = (phaseKey: PhaseKey) => {
    switch (phaseKey) {
      case 'werewolves':
        showWerewolvesModal();
        break;
      case 'healer':
        showHealerModal();
        break;
      case 'hexe':
        showHexeModal();
        break;
      case 'big_bad_wolf':
        showBigBadWolfModal();
        break;
      case 'white_wolf':
        showWhiteWolfModal();
        break;
      default:
        closeAndNext();
    }
  };

  // Vereinfachte Modals (die wichtigsten für Todes-Tracking)

  const showWerewolvesModal = () => {
    setActionTitle(t('narrator_select_werwolf'));
    setActionContent(
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {NightPhaseLogic.getValidWerewolfTargets(modifiedPlayers).map(p => (
          <button
            key={p.name}
            onClick={() => {
              setNightState(prev => ({ ...prev, werewolvesTarget: p.name }));
              closeAndNext();
            }}
            className="w-full p-3 bg-red-100 text-left rounded-lg hover:bg-red-200"
          >
            {p.name}
          </button>
        ))}
      </div>
    );
    setShowActionModal(true);
  };

  const showHealerModal = () => {
    const healer = modifiedPlayers.find(p => p.originalRole.id === 'heiler_beschuetzer');
    if (!healer) {
      closeAndNext();
      return;
    }

    setActionTitle(t('narrator_select_heiler'));
    setActionContent(
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {modifiedPlayers
          .filter(p => p.status === 'alive')
          .filter(p => NightPhaseLogic.canHealerHeal(p.name))
          .map(p => (
            <button
              key={p.name}
              onClick={() => {
                NightPhaseLogic.handleHealerSelect(healer.name, p.name, modifiedPlayers);
                setNightState(prev => ({ ...prev, healerProtected: p.name }));
                closeAndNext();
              }}
              className="w-full p-3 bg-green-100 text-left rounded-lg hover:bg-green-200"
            >
              {p.name}
            </button>
          ))}
      </div>
    );
    setShowActionModal(true);
  };

  const showHexeModal = () => {
    const hexe = modifiedPlayers.find(p => p.originalRole.id === 'hexe');
    if (!hexe) {
      closeAndNext();
      return;
    }

    const canHeal = NightPhaseLogic.canUseHealPotion();
    const canPoison = NightPhaseLogic.canUsePoisonPotion();

    setActionTitle(t('narrator_select_hexe_action'));
    setActionContent(
      <div className="space-y-3">
        <button
          disabled={!canHeal}
          onClick={() => {
            NightPhaseLogic.handleHexeHeal();
            setNightState(prev => ({ ...prev, hexeHealTarget: nightState.werewolvesTarget }));
            closeAndNext();
          }}
          className={`w-full p-3 rounded-lg font-bold transition ${
            canHeal
              ? 'bg-green-100 hover:bg-green-200'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {t('narrator_hexe_heal_button')} {!canHeal ? '(benutzt)' : ''}
        </button>
        <button
          disabled={!canPoison}
          onClick={() => {
            NightPhaseLogic.handleHexePoison();
            setActionTitle('Gifttrank - Ziel auswählen');
            setActionContent(
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {modifiedPlayers.filter(p => p.status === 'alive').map(p => (
                  <button
                    key={p.name}
                    onClick={() => {
                      NightPhaseLogic.handleHexePoisonTarget(p.name);
                      setNightState(prev => ({ ...prev, hexePoisonTarget: p.name }));
                      closeAndNext();
                    }}
                    className="w-full p-3 bg-purple-100 text-left rounded-lg hover:bg-purple-200"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            );
          }}
          className={`w-full p-3 rounded-lg font-bold transition ${
            canPoison
              ? 'bg-purple-100 hover:bg-purple-200'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {t('narrator_hexe_poison_button')} {!canPoison ? '(benutzt)' : ''}
        </button>
        <button
          onClick={closeAndNext}
          className="w-full p-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold"
        >
          {t('narrator_hexe_nothing_button')}
        </button>
      </div>
    );
    setShowActionModal(true);
  };

  const showBigBadWolfModal = () => {
    setActionTitle(t('narrator_select_big_bad_wolf'));
    setActionContent(
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {NightPhaseLogic.getValidWerewolfTargets(modifiedPlayers).map(p => (
          <button
            key={p.name}
            onClick={() => {
              NightPhaseLogic.handleBigBadWolfSelect(p.name, modifiedPlayers);
              setNightState(prev => ({ ...prev, bigBadWolfTarget: p.name }));
              closeAndNext();
            }}
            className="w-full p-3 bg-red-200 text-left rounded-lg hover:bg-red-300"
          >
            {p.name}
          </button>
        ))}
      </div>
    );
    setShowActionModal(true);
  };

  const showWhiteWolfModal = () => {
    setActionTitle(t('narrator_select_white_wolf'));
    setActionContent(
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {NightPhaseLogic.getWerewolfTargets(modifiedPlayers).map(p => (
          <button
            key={p.name}
            onClick={() => {
              NightPhaseLogic.handleWhiteWolfSelect(p.name);
              setNightState(prev => ({ ...prev, whiteWolfTarget: p.name }));
              closeAndNext();
            }}
            className="w-full p-3 bg-gray-100 text-left rounded-lg hover:bg-gray-200"
          >
            {p.name}
          </button>
        ))}
      </div>
    );
    setShowActionModal(true);
  };

  const closeAndNext = () => {
    setShowActionModal(false);
    setIsPaused(true);
    const timer = setTimeout(() => {
      setIsPaused(false);
      handleNextPhase();
    }, currentPhase?.pauseAfterMs || 5000);
    pauseTimerRef.current = timer;
  };

  const handleNextPhase = useCallback(() => {
    audioManager.stopAudio();
    setShowActionModal(false);
    setCurrentPhaseIndex(prev => prev + 1);
  }, []);

  const handleSkipPause = useCallback(() => {
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    setIsPaused(false);
    handleNextPhase();
  }, [handleNextPhase]);

  return (
    <div className="relative">
      <div className="absolute top-4 right-4 z-50">
        <LanguageSelector />
      </div>

      <div className="w-full max-w-lg mx-auto bg-white rounded-xl shadow-lg p-8 text-[#333]">
        <h1 className="text-2xl font-bold mb-4 text-center text-green-700">
          🌙 Nacht - Runde {currentRound}
        </h1>

        {currentPhase && (
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-gray-600">
              ({currentPhaseIndex + 1} / {phaseSequence.length})
            </p>
          </div>
        )}

        {isPaused && (
          <div className="text-center mb-4 p-3 bg-yellow-50 rounded-lg">
            <p className="text-gray-700">⏸️ Pause...</p>
            <button
              onClick={handleSkipPause}
              className="mt-2 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700"
            >
              {t('next')}
            </button>
          </div>
        )}

        {isAudioPlaying && (
          <div className="text-center mb-4 p-3 bg-yellow-50 rounded-lg">
            <p className="text-gray-700 animate-pulse">🔊 Audio läuft...</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => {
              audioManager.stopAudio();
              if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
              setShowActionModal(false);
            }}
            className="w-full bg-red-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-700"
          >
            {t('stop')}
          </button>
          <button
            onClick={handleNextPhase}
            className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700"
          >
            {t('next')}
          </button>
        </div>

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

      {showActionModal && (
        <Modal
          title={actionTitle}
          onClose={() => setShowActionModal(false)}
          size="md"
          isOpaque={true}
        >
          {actionContent}
        </Modal>
      )}
    </div>
  );
};

export default NarratorNightFlow;