// src/components/NarratorGame.tsx - FINAL & KOMPLETT (Nacht + Tag)

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Player } from '../types';
import { useTranslation } from '../LanguageContext';
import { audioManager } from '../services/AudioManager';
import { NarratorGameLogic, RoleCallSequence } from '../services/NarratorSystem';
import NarratorDayPhase from './NarratorDayPhase';
import Modal from './Modal';
import { ROLES_CONFIG } from '../constants';

type GamePhase = 'night' | 'day' | 'game_over';

interface NarratorGameProps {
  players: Player[];
  onGameEnd: (winner: string) => void;
  onNavigate: (page: 'home') => void;
  onGoToRoleSelection: () => void;
}

interface SelectionState {
  waisenkind?: string;
  amor_first?: string;
  amor_second?: string;
  urwolf?: string;
  wildkind?: string;
  seherin?: string;
  heiler?: string;
  werwolf?: string;
  dieb?: string;
  gaukler?: string;
  obdachlos?: string;
  fuchs?: string;
  floetenspieler_first?: string;
  floetenspieler_second?: string;
}

const NarratorGame: React.FC<NarratorGameProps> = ({
  players: initialPlayers,
  onGameEnd,
  onNavigate,
  onGoToRoleSelection,
}) => {
  const { t, locale } = useTranslation();

  // State - Nacht
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [currentRound, setCurrentRound] = useState(1);
  const [currentPhase, setCurrentPhase] = useState<GamePhase>('night');
  const [roleCalls, setRoleCalls] = useState<RoleCallSequence[]>([]);
  const [currentCallIndex, setCurrentCallIndex] = useState(0);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [showNextButton, setShowNextButton] = useState(false);
  const [pauseTimer, setPauseTimer] = useState<NodeJS.Timeout | null>(null);

  // State - Auswahlen
  const [selections, setSelections] = useState<SelectionState>({});
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [selectionType, setSelectionType] = useState<keyof SelectionState | null>(null);
  const [nightDeaths, setNightDeaths] = useState<string[]>([]);

  // Aktueller Call und Text
  const currentRoleCall = roleCalls[currentCallIndex] || null;
  const currentText =
    currentRoleCall && currentTextIndex < currentRoleCall.textSequence.length
      ? currentRoleCall.textSequence[currentTextIndex]
      : null;

  const getRoleInfo = (roleId: string) => {
    const roleConfig = ROLES_CONFIG.find((r) => r.id === roleId);
    if (!roleConfig) return { name: roleId, description: '' };
    return {
      name: t(roleConfig.nameKey),
      description: t(roleConfig.descriptionKey),
    };
  };

  // Generiere Rollen-Sequenz
  useEffect(() => {
    if (currentPhase === 'night') {
      const calls =
        currentRound === 1
          ? NarratorGameLogic.generateRound1Sequence(players)
          : NarratorGameLogic.generateRound2PlusSequence(players, currentRound);
      setRoleCalls(calls);
      setCurrentCallIndex(0);
      setCurrentTextIndex(0);
      setShowNextButton(false);
    }
  }, [currentRound, currentPhase, players]);

  // Starte Audio
  useEffect(() => {
    if (!currentText || isAudioPlaying || currentPhase !== 'night') return;

    const playAudio = () => {
      setIsAudioPlaying(true);

      audioManager.playAudio(locale as any, currentText, () => {
        setIsAudioPlaying(false);

        const isClosingEyesText = currentText === 'narrator_close_eyes';
        const isOpeningEyesText = currentText === 'narrator_open_eyes';

        if (isClosingEyesText || isOpeningEyesText) {
          const timer = setTimeout(() => {
            proceedToNextText();
          }, 5000);
          setPauseTimer(timer);
        } else if (currentRoleCall?.requiresUserInteraction) {
          setShowNextButton(true);
        } else {
          proceedToNextText();
        }
      });
    };

    playAudio();

    return () => {
      if (pauseTimer) clearTimeout(pauseTimer);
    };
  }, [currentText, isAudioPlaying, currentRoleCall, locale, currentPhase]);

  // Gehe zum nächsten Text
  const proceedToNextText = useCallback(() => {
    if (!currentRoleCall) return;

    if (currentTextIndex < currentRoleCall.textSequence.length - 1) {
      setCurrentTextIndex((prev) => prev + 1);
      setShowNextButton(false);
    } else {
      if (currentCallIndex < roleCalls.length - 1) {
        setCurrentCallIndex((prev) => prev + 1);
        setCurrentTextIndex(0);
        setShowNextButton(false);
      } else {
        // Nacht vorbei
        setCurrentPhase('day');
      }
    }
  }, [currentCallIndex, currentTextIndex, currentRoleCall, roleCalls]);

  // Handler Weiter-Button
  const handleContinue = useCallback(() => {
    audioManager.stopAudio();
    setShowNextButton(false);
    if (pauseTimer) clearTimeout(pauseTimer);

    // Prüfe ob Interaktion nötig
    if (currentRoleCall?.roleId === 'waisenkind' && !selections.waisenkind) {
      setSelectionType('waisenkind');
      setShowSelectionModal(true);
    } else if (currentRoleCall?.roleId === 'amor' && !selections.amor_first) {
      setSelectionType('amor_first');
      setShowSelectionModal(true);
    } else if (
      currentRoleCall?.roleId === 'amor' &&
      selections.amor_first &&
      !selections.amor_second
    ) {
      setSelectionType('amor_second');
      setShowSelectionModal(true);
    } else if (currentRoleCall?.roleId === 'urwolf' && !selections.urwolf) {
      setSelectionType('urwolf');
      setShowSelectionModal(true);
    } else if (currentRoleCall?.roleId === 'das_wilde_kind' && !selections.wildkind) {
      setSelectionType('wildkind');
      setShowSelectionModal(true);
    } else if (currentRoleCall?.roleId === 'seherin' && !selections.seherin) {
      setSelectionType('seherin');
      setShowSelectionModal(true);
    } else if (currentRoleCall?.roleId === 'heiler_beschuetzer' && !selections.heiler) {
      setSelectionType('heiler');
      setShowSelectionModal(true);
    } else if (currentRoleCall?.roleId === 'werwolf' && !selections.werwolf) {
      setSelectionType('werwolf');
      setShowSelectionModal(true);
    } else if (currentRoleCall?.roleId === 'dieb' && !selections.dieb) {
      setSelectionType('dieb');
      setShowSelectionModal(true);
    } else if (currentRoleCall?.roleId === 'gaukler' && !selections.gaukler) {
      setSelectionType('gaukler');
      setShowSelectionModal(true);
    } else if (currentRoleCall?.roleId === 'der_obdachlose' && !selections.obdachlos) {
      setSelectionType('obdachlos');
      setShowSelectionModal(true);
    } else if (currentRoleCall?.roleId === 'der_fuchs' && !selections.fuchs) {
      setSelectionType('fuchs');
      setShowSelectionModal(true);
    } else if (
      currentRoleCall?.roleId === 'floetenspieler' &&
      !selections.floetenspieler_first
    ) {
      setSelectionType('floetenspieler_first');
      setShowSelectionModal(true);
    } else if (
      currentRoleCall?.roleId === 'floetenspieler' &&
      selections.floetenspieler_first &&
      !selections.floetenspieler_second
    ) {
      setSelectionType('floetenspieler_second');
      setShowSelectionModal(true);
    } else {
      proceedToNextText();
    }
  }, [currentRoleCall, selections, pauseTimer, proceedToNextText]);

  // Handler Auswahl
  const handleSelection = useCallback(
    (value: string) => {
      if (!selectionType) return;

      setSelections((prev) => ({
        ...prev,
        [selectionType]: value,
      }));

      setShowSelectionModal(false);
      setSelectionType(null);
      proceedToNextText();
    },
    [selectionType, proceedToNextText]
  );

  // Hilfsfunktion: Lebende Spieler
  const getAlivePlayers = useMemo(
    () => players.filter((p) => p.status === 'alive'),
    [players]
  );

  // Tag starten
  if (currentPhase === 'day') {
    return (
      <NarratorDayPhase
        players={players}
        nightDeaths={nightDeaths}
        onPlayersUpdate={(updatedPlayers) => {
          setPlayers(updatedPlayers);
        }}
        onContinueToNextRound={() => {
          setCurrentRound(currentRound + 1);
          setCurrentPhase('night');
          setSelections({});
          setNightDeaths([]);
        }}
        onGameEnd={onGameEnd}
        currentRound={currentRound}
        locale={locale}
        t={t}
      />
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-xl shadow-lg p-8 text-[#333]">
      <h1 className="text-2xl font-bold mb-4 text-center text-green-700">
        Erzähler-Modus aktiv
      </h1>

      {/* Status */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <p className="font-semibold mb-2">
          Runde {currentRound} - 🌙 Nacht
        </p>
        {currentRoleCall && currentRoleCall.playerNames.length > 0 && (
          <>
            <p className="text-gray-700 font-semibold">
              {getRoleInfo(currentRoleCall.roleId).name}
            </p>
            <p className="text-gray-600 text-sm">
              {currentRoleCall.playerNames.join(', ')}
            </p>
          </>
        )}
        <p className="text-sm text-gray-500 mt-2">
          ({currentCallIndex + 1} / {roleCalls.length})
        </p>
      </div>

      {/* Audio Status */}
      {isAudioPlaying && (
        <div className="text-center mb-4">
          <p className="text-gray-600 animate-pulse">🔊 Audio wird abgespielt...</p>
        </div>
      )}

      {/* Weiter-Button */}
      {showNextButton && !isAudioPlaying && (
        <button
          onClick={handleContinue}
          className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition mb-4"
        >
          Weiter
        </button>
      )}

      {/* Control Buttons */}
      <div className="space-y-2">
        <div className="flex space-x-2">
          <button
            onClick={() => audioManager.stopAudio()}
            className="flex-1 bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition"
          >
            Stopp
          </button>
          <button
            onClick={onGoToRoleSelection}
            className="flex-1 bg-orange-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-700 transition"
          >
            Restart
          </button>
          <button
            onClick={() => onNavigate('home')}
            className="flex-1 bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition"
          >
            Home
          </button>
        </div>
      </div>

      {/* Selection Modal */}
      {showSelectionModal && selectionType && (
        <Modal
          title="Auswahl"
          onClose={() => {
            setShowSelectionModal(false);
            setSelectionType(null);
          }}
          size="md"
          isOpaque={true}
        >
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {getAlivePlayers
              .filter((p) => {
                if (selectionType === 'waisenkind')
                  return p.originalRole.id === 'waisenkind' ? false : true;
                if (selectionType === 'seherin')
                  return p.originalRole.id === 'seherin' ? false : true;
                return true;
              })
              .map((player) => (
                <button
                  key={player.name}
                  onClick={() => handleSelection(player.name)}
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
};

export default NarratorGame;