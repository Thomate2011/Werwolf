// src/components/NarratorNightFlow.tsx - KOMPLETT mit allen Aktionen

import React, { useState, useEffect } from 'react';
import { Player, Role } from '../types';
import { useTranslation } from '../LanguageContext';
import { audioManager } from '../services/AudioManager';
import { NarratorGameLogic } from '../services/NarratorSystem';
import { NightPhaseLogic } from '../services/NightPhaseLogic';
import { gameStateManager } from '../services/GameStateManager';

interface NarratorNightFlowProps {
  players: Player[];
  currentRound: number;
  thiefExtraRoles: Role[];
  jesterExtraRoles: Role[];
  onNightComplete: (deadPlayers: string[], updatedPlayers: Player[], hunterDeaths: string[]) => void;
}

type FlowState = 'playing_audio' | 'waiting_for_action' | 'pause' | 'waiting_for_continue';

interface NightActionState {
  werewolfTarget: string | null;
  bigBadWolfTarget: string | null;
  whiteWolfTarget: string | null;
  hexeHealUsed: boolean;
  hexePoisonTarget: string | null;
  healerProtected: string | null;
}

const NarratorNightFlow: React.FC<NarratorNightFlowProps> = ({
  players,
  currentRound,
  thiefExtraRoles,
  jesterExtraRoles,
  onNightComplete,
}) => {
  const { t, locale } = useTranslation();
  
  const [flowState, setFlowState] = useState<FlowState>('playing_audio');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentRoleId, setCurrentRoleId] = useState<string | null>(null);
  const [modifiedPlayers, setModifiedPlayers] = useState<Player[]>(players);
  
  const [nightActions, setNightActions] = useState<NightActionState>({
    werewolfTarget: null,
    bigBadWolfTarget: null,
    whiteWolfTarget: null,
    hexeHealUsed: false,
    hexePoisonTarget: null,
    healerProtected: null,
  });

  // Audio-Sequenz generieren
  const audioSteps = currentRound === 1
    ? NarratorGameLogic.generateRound1Sequence(players)
    : NarratorGameLogic.generateRound2PlusSequence(players, currentRound);

  // Aktueller Schritt
  const currentStep = audioSteps[currentStepIndex];
  const totalSteps = audioSteps.length;

  // Audio abspielen
  useEffect(() => {
    if (flowState !== 'playing_audio' || !currentStep) return;

    const audioKey = currentStep.textSequence[0]; // Erstes Audio des Steps

    audioManager.playAudio(
      locale,
      audioKey,
      () => {
        // Audio fertig
        if (audioKey === 'narrator_close_eyes') {
          // 5 Sekunden Pause ohne Button
          setFlowState('pause');
          setTimeout(() => {
            handleContinue();
          }, 5000);
        } else if (currentStep.requiresUserInteraction) {
          // Aktion erforderlich
          setCurrentRoleId(currentStep.roleId);
          setFlowState('waiting_for_action');
        } else {
          // Warte auf grünen Button
          setFlowState('waiting_for_continue');
        }
      },
      (error) => {
        console.error('Audio error:', error);
        // Fallback: weiter ohne Audio
        if (currentStep.requiresUserInteraction) {
          setCurrentRoleId(currentStep.roleId);
          setFlowState('waiting_for_action');
        } else {
          setFlowState('waiting_for_continue');
        }
      }
    );
  }, [flowState, currentStepIndex, currentStep, locale]);

  const handleContinue = () => {
    if (currentStepIndex >= totalSteps - 1) {
      // Nacht vorbei - verarbeite alle Tode
      finishNight();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
      setFlowState('playing_audio');
    }
  };

  const finishNight = () => {
    const result = NightPhaseLogic.processNightDeaths(
      nightActions.werewolfTarget,
      nightActions.hexeHealUsed ? nightActions.werewolfTarget : null,
      nightActions.hexePoisonTarget,
      nightActions.bigBadWolfTarget,
      nightActions.whiteWolfTarget,
      nightActions.healerProtected,
      modifiedPlayers
    );

    onNightComplete(result.deadPlayers, result.updatedPlayers, result.hunterDeaths || []);
  };

  // ============ AKTIONEN ============

  const renderAction = () => {
    if (!currentRoleId) return null;

    switch (currentRoleId) {
      case 'reine_seele':
        return <ActionPureSoul onComplete={handleContinue} />;
      
      case 'waisenkind':
        return (
          <ActionOrphan
            players={modifiedPlayers}
            onComplete={(selectedName) => {
              const orphan = modifiedPlayers.find(p => p.originalRole.id === 'waisenkind');
              if (orphan) {
                const updated = NightPhaseLogic.handleOrphanSelect(orphan.name, selectedName, modifiedPlayers);
                setModifiedPlayers(updated);
              }
              handleContinue();
            }}
          />
        );

      case 'dieb':
        return (
          <ActionThief
            cards={thiefExtraRoles}
            onComplete={(selectedCard) => {
              const thief = modifiedPlayers.find(p => p.originalRole.id === 'dieb');
              if (thief) {
                const updated = NightPhaseLogic.handleThiefCardSelect(thief.name, selectedCard, modifiedPlayers);
                setModifiedPlayers(updated);
              }
              handleContinue();
            }}
          />
        );

      case 'gaukler':
        return (
          <ActionJester
            cards={jesterExtraRoles}
            onComplete={(selectedCard) => {
              const jester = modifiedPlayers.find(p => p.originalRole.id === 'gaukler');
              if (jester) {
                const updated = NightPhaseLogic.handleJesterCardSelect(jester.name, selectedCard, modifiedPlayers);
                setModifiedPlayers(updated);
              }
              handleContinue();
            }}
          />
        );

      case 'der_verbitterte_greis':
        return (
          <ActionBitterOldMan
            players={modifiedPlayers}
            onComplete={(group1, group2) => {
              NightPhaseLogic.handleGreisGroupSelect(group1, group2, modifiedPlayers);
              handleContinue();
            }}
          />
        );

      case 'amor':
        return (
          <ActionCupid
            players={modifiedPlayers}
            onComplete={(lover1, lover2) => {
              NightPhaseLogic.handleAmorSelect(lover1, lover2, modifiedPlayers);
              handleContinue();
            }}
          />
        );

      case 'der_wolfshund':
        return (
          <ActionWolfhound
            onComplete={(choice) => {
              const wolfhound = modifiedPlayers.find(p => p.originalRole.id === 'der_wolfshund');
              if (wolfhound) {
                const updated = NightPhaseLogic.handleWolfhundChoose(choice, wolfhound.name, modifiedPlayers);
                setModifiedPlayers(updated);
              }
              handleContinue();
            }}
          />
        );

      case 'das_wilde_kind':
        return (
          <ActionWildChild
            players={modifiedPlayers}
            onComplete={(modelName) => {
              const updated = NightPhaseLogic.handleWildChildSelect(modelName, modifiedPlayers);
              setModifiedPlayers(updated);
              handleContinue();
            }}
          />
        );

      case 'der_stotternde_richter':
        return (
          <ActionJudge
            onComplete={(codeword) => {
              NightPhaseLogic.handleJudgeCodeword(codeword);
              handleContinue();
            }}
          />
        );

      case 'seherin':
        return (
          <ActionSeer
            players={modifiedPlayers}
            onComplete={() => handleContinue()}
          />
        );

      case 'heiler_beschuetzer':
        return (
          <ActionHealer
            players={modifiedPlayers}
            onComplete={(protectedName) => {
              setNightActions(prev => ({ ...prev, healerProtected: protectedName }));
              NightPhaseLogic.handleHealerSelect(protectedName, modifiedPlayers);
              handleContinue();
            }}
          />
        );

      case 'werwolf':
        return (
          <ActionWerewolves
            players={modifiedPlayers}
            onComplete={(targetName) => {
              setNightActions(prev => ({ ...prev, werewolfTarget: targetName }));
              handleContinue();
            }}
          />
        );

      case 'urwolf':
        return (
          <ActionAlphaWolf
            players={modifiedPlayers}
            onComplete={(targetName) => {
              const updated = NightPhaseLogic.handleUrwolfSelect(targetName, modifiedPlayers);
              setModifiedPlayers(updated);
              handleContinue();
            }}
          />
        );

      case 'hexe':
        return (
          <ActionWitch
            players={modifiedPlayers}
            victimName={nightActions.werewolfTarget}
            canHeal={NightPhaseLogic.canUseHealPotion()}
            canPoison={NightPhaseLogic.canUsePoisonPotion()}
            onComplete={(heal, poisonTarget) => {
              if (heal) {
                NightPhaseLogic.handleHexeHeal();
                setNightActions(prev => ({ ...prev, hexeHealUsed: true }));
              }
              if (poisonTarget) {
                NightPhaseLogic.handleHexePoison();
                setNightActions(prev => ({ ...prev, hexePoisonTarget: poisonTarget }));
              }
              handleContinue();
            }}
          />
        );

      case 'floetenspieler':
        return (
          <ActionPiper
            players={modifiedPlayers}
            alreadyEnchanted={NightPhaseLogic.getAlreadyEnchanted(modifiedPlayers)}
            onComplete={(person1, person2) => {
              NightPhaseLogic.handlePiperSelect(person1, person2);
              handleContinue();
            }}
          />
        );

      case 'der_obdachlose':
        return (
          <ActionHomeless
            players={modifiedPlayers}
            onComplete={(targetName) => {
              const updated = NightPhaseLogic.handleHomelessSelect(targetName, modifiedPlayers);
              setModifiedPlayers(updated);
              handleContinue();
            }}
          />
        );

      case 'der_fuchs':
        return (
          <ActionFox
            players={modifiedPlayers}
            onComplete={(targetName) => {
              const result = NightPhaseLogic.handleFoxSelect(targetName, modifiedPlayers);
              setModifiedPlayers(result.players);
              handleContinue();
            }}
          />
        );

      case 'der_grosse_boese_werwolf':
        return (
          <ActionBigBadWolf
            players={modifiedPlayers}
            onComplete={(targetName) => {
              setNightActions(prev => ({ ...prev, bigBadWolfTarget: targetName }));
              handleContinue();
            }}
          />
        );

      case 'der_weisse_werwolf':
        return (
          <ActionWhiteWolf
            players={modifiedPlayers}
            onComplete={(targetName) => {
              setNightActions(prev => ({ ...prev, whiteWolfTarget: targetName }));
              handleContinue();
            }}
          />
        );

      default:
        return (
          <div className="text-center">
            <p className="text-xl mb-4">Aktion: {currentRoleId}</p>
            <button
              onClick={handleContinue}
              className="py-3 px-8 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl"
            >
              {t('next')}
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900">
      <div className="w-full max-w-3xl bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 text-white">
        
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Schritt {currentStepIndex + 1} / {totalSteps}</span>
            <span>Runde {currentRound}</span>
          </div>
          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        {flowState === 'playing_audio' && (
          <div className="text-center space-y-6">
            <div className="text-6xl animate-pulse">🎙️</div>
            <p className="text-2xl">{t('narrator_game_start_waiting')}</p>
            <div className="flex justify-center gap-2">
              <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}

        {flowState === 'pause' && (
          <div className="text-center space-y-6">
            <div className="text-6xl">⏸️</div>
            <p className="text-2xl">{t('narrator_pause_auto')}</p>
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white/60 animate-pulse"></div>
            </div>
          </div>
        )}

        {flowState === 'waiting_for_continue' && (
          <div className="text-center space-y-6">
            <div className="text-6xl">✋</div>
            <button
              onClick={handleContinue}
              className="w-full py-4 px-8 bg-green-600 hover:bg-green-700 text-white font-bold text-xl rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              {t('next')}
            </button>
          </div>
        )}

        {flowState === 'waiting_for_action' && (
          <div className="space-y-6">
            {renderAction()}
          </div>
        )}
      </div>
    </div>
  );
};

// ============ ALLE AKTIONS-KOMPONENTEN ============

const ActionPureSoul: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { t } = useTranslation();
  return (
    <div className="text-center space-y-4">
      <h2 className="text-3xl font-bold">✨ {t('role_reine_seele_name')}</h2>
      <p className="text-white/80">{t('narrator_reine_seele')}</p>
      <button onClick={onComplete} className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-xl font-bold">
        {t('next')}
      </button>
    </div>
  );
};

const ActionOrphan: React.FC<{ players: Player[]; onComplete: (name: string) => void }> = ({ players, onComplete }) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const orphan = players.find(p => p.originalRole.id === 'waisenkind');
  const availablePlayers = players.filter(p => p.status === 'alive' && p.name !== orphan?.name);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center">👶 {t('narrator_select_waisenkind')}</h2>
      <div className="grid grid-cols-2 gap-3">
        {availablePlayers.map((player) => (
          <button
            key={player.name}
            onClick={() => setSelected(player.name)}
            className={`py-3 px-4 rounded-xl font-bold transition ${
              selected === player.name
                ? 'bg-blue-600 text-white'
                : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            {player.name}
          </button>
        ))}
      </div>
      <button
        onClick={() => selected && onComplete(selected)}
        disabled={!selected}
        className={`w-full py-3 rounded-xl font-bold ${
          selected ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 cursor-not-allowed'
        }`}
      >
        {t('confirm')}
      </button>
    </div>
  );
};

const ActionThief: React.FC<{ cards: Role[]; onComplete: (card: Role) => void }> = ({ cards, onComplete }) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<Role | null>(null);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center">🃏 {t('narrator_select_dieb_cards')}</h2>
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => setSelected(card)}
            className={`py-4 px-4 rounded-xl font-bold transition ${
              selected?.id === card.id
                ? 'bg-blue-600 text-white'
                : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            {card.name}
          </button>
        ))}
      </div>
      <button
        onClick={() => selected && onComplete(selected)}
        disabled={!selected}
        className={`w-full py-3 rounded-xl font-bold ${
          selected ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 cursor-not-allowed'
        }`}
      >
        {t('confirm')}
      </button>
    </div>
  );
};

const ActionJester: React.FC<{ cards: Role[]; onComplete: (card: Role) => void }> = ({ cards, onComplete }) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<Role | null>(null);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center">🎭 {t('narrator_select_gaukler_cards')}</h2>
      <div className="grid grid-cols-3 gap-3">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => setSelected(card)}
            className={`py-4 px-4 rounded-xl font-bold transition text-sm ${
              selected?.id === card.id
                ? 'bg-blue-600 text-white'
                : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            {card.name}
          </button>
        ))}
      </div>
      <button
        onClick={() => selected && onComplete(selected)}
        disabled={!selected}
        className={`w-full py-3 rounded-xl font-bold ${
          selected ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 cursor-not-allowed'
        }`}
      >
        {t('confirm')}
      </button>
    </div>
  );
};

const ActionBitterOldMan: React.FC<{ players: Player[]; onComplete: (group1: string[], group2: string[]) => void }> = ({ players, onComplete }) => {
  const { t } = useTranslation();
  const [group1, setGroup1] = useState<string[]>([]);
  const alivePlayers = players.filter(p => p.status === 'alive');
  const halfCount = Math.floor(alivePlayers.length / 2);

  const togglePlayer = (name: string) => {
    if (group1.includes(name)) {
      setGroup1(group1.filter(n => n !== name));
    } else if (group1.length < halfCount) {
      setGroup1([...group1, name]);
    }
  };

  const group2 = alivePlayers.filter(p => !group1.includes(p.name)).map(p => p.name);
  const isValid = group1.length === halfCount;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center">👴 {t('narrator_select_greis_half')}</h2>
      <p className="text-center text-sm">Gewählt: {group1.length} / {halfCount}</p>
      <div className="grid grid-cols-2 gap-3">
        {alivePlayers.map((player) => (
          <button
            key={player.name}
            onClick={() => togglePlayer(player.name)}
            className={`py-3 px-4 rounded-xl font-bold transition ${
              group1.includes(player.name)
                ? 'bg-blue-600 text-white'
                : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            {player.name}
          </button>
        ))}
      </div>
      <button
        onClick={() => isValid && onComplete(group1, group2)}
        disabled={!isValid}
        className={`w-full py-3 rounded-xl font-bold ${
          isValid ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 cursor-not-allowed'
        }`}
      >
        {t('confirm')}
      </button>
    </div>
  );
};

const ActionCupid: React.FC<{ players: Player[]; onComplete: (lover1: string, lover2: string) => void }> = ({ players, onComplete }) => {
  const { t } = useTranslation();
  const [lover1, setLover1] = useState<string | null>(null);
  const [lover2, setLover2] = useState<string | null>(null);
  const alivePlayers = players.filter(p => p.status === 'alive');

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center">💘 {t('narrator_select_amor_first')}</h2>
      <div className="grid grid-cols-2 gap-3">
        {alivePlayers.map((player) => (
          <button
            key={player.name}
            onClick={() => {
              if (!lover1) setLover1(player.name);
              else if (!lover2 && player.name !== lover1) setLover2(player.name);
            }}
            className={`py-3 px-4 rounded-xl font-bold transition ${
              lover1 === player.name || lover2 === player.name
                ? 'bg-pink-600 text-white'
                : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            {player.name}
          </button>
        ))}
      </div>
      <button
        onClick={() => lover1 && lover2 && onComplete(lover1, lover2)}
        disabled={!lover1 || !lover2}
        className={`w-full py-3 rounded-xl font-bold ${
          lover1 && lover2 ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 cursor-not-allowed'
        }`}
      >
        {t('confirm')}
      </button>
    </div>
  );
};

const ActionWolfhound: React.FC<{ onComplete: (choice: 'dorfbewohner' | 'werwolf') => void }> = ({ onComplete }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center">🐺 {t('narrator_select_wolfshund_choice')}</h2>
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onComplete('dorfbewohner')}
          className="py-6 px-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-lg"
        >
          👨‍🌾 Dorfbewohner
        </button>
        <button
          onClick={() => onComplete('werwolf')}
          className="py-6 px-4 bg-red-600 hover:bg-red-700 rounded-xl font-bold text-lg"
        >
          🐺 Werwolf
        </button>
      </div>
    </div>
  );
};

const ActionWildChild: React.FC<{ players: Player[]; onComplete: (name: string) => void }> = ({ players, onComplete }) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const wildChild = players.find(p => p.originalRole.id === 'das_wilde_kind');
  const availablePlayers = players.filter(p => p.status === 'alive' && p.name !== wildChild?.name);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center">🌲 {t('narrator_select_waisenkind')}</h2>
      <div className="grid grid-cols-2 gap-3">
        {availablePlayers.map((player) => (
          <button
            key={player.name}
            onClick={() => setSelected(player.name)}
            className={`py-3 px-4 rounded-xl font-bold transition ${
              selected === player.name ? 'bg-blue-600 text-white' : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            {player.name}
          </button>
        ))}
      </div>
      <button
        onClick={() => selected && onComplete(selected)}
        disabled={!selected}
        className={`w-full py-3 rounded-xl font-bold ${
          selected ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 cursor-not-allowed'
        }`}
      >
        {t('confirm')}
      </button>
    </div>
  );
};

const ActionJudge: React.FC<{ onComplete: (codeword: string) => void }> = ({ onComplete }) => {
  const { t } = useTranslation();
  const [codeword, setCodeword] = useState('');

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center">⚖️ {t('narrator_select_richter_codeword')}</h2>
      <input
        type="text"
        value={codeword}
        onChange={(e) => setCodeword(e.target.value)}
        className="w-full py-3 px-4 bg-white/20 rounded-xl text-white placeholder-white/50"
        placeholder="Codewort..."
      />
      <button
        onClick={() => codeword && onComplete(codeword)}
        disabled={!codeword}
        className={`w-full py-3 rounded-xl font-bold ${
          codeword ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 cursor-not-allowed'
        }`}
      >
        {t('confirm')}
      </button>
    </div>
  );
};

const ActionSeer: React.FC<{ players: Player[]; onComplete: () => void }> = ({ players, onComplete }) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const seer = players.find(p => p.originalRole.id === 'seherin');
  const availablePlayers = players.filter(p => p.status === 'alive' && p.name !== seer?.name);
  const selectedPlayer = players.find(p => p.name === selected);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center">🔮 {t('narrator_select_seherin')}</h2>
      {!revealed ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            {availablePlayers.map((player) => (
              <button
                key={player.name}
                onClick={() => setSelected(player.name)}
                className={`py-3 px-4 rounded-xl font-bold transition ${
                  selected === player.name ? 'bg-blue-600 text-white' : 'bg-white/20 hover:bg-white/30'
                }`}
              >
                {player.name}
              </button>
            ))}
          </div>
          <button
            onClick={() => setRevealed(true)}
            disabled={!selected}
            className={`w-full py-3 rounded-xl font-bold ${
              selected ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-600 cursor-not-allowed'
            }`}
          >
            {t('reveal_role')}
          </button>
        </>
      ) : (
        <>
          <div className="bg-purple-600/30 border-2 border-purple-500 rounded-xl p-6 text-center">
            <p className="text-xl mb-2">{selectedPlayer?.name}</p>
            <p className="text-3xl font-bold">{selectedPlayer?.role.name}</p>
          </div>
          <button onClick={onComplete} className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-xl font-bold">
            {t('next')}
          </button>
        </>
      )}
    </div>
  );
};

const ActionHealer: React.FC<{ players: Player[]; onComplete: (name: string) => void }> = ({ players, onComplete }) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const alivePlayers = players.filter(p => p.status === 'alive');

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center">🩺 {t('narrator_select_heiler')}</h2>
      <div className="grid grid-cols-2 gap-3">
        {alivePlayers.map((player) => (
          <button
            key={player.name}
            onClick={() => setSelected(player.name)}
            className={`py-3 px-4 rounded-xl font-bold transition ${
              selected === player.name ? 'bg-blue-600 text-white' : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            {player.name}
          </button>
        ))}
      </div>
      <button
        onClick={() => selected && onComplete(selected)}
        disabled={!selected}
        className={`w-full py-3 rounded-xl font-bold ${
          selected ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 cursor-not-allowed'
        }`}
      >
        {t('confirm')}
      </button>
    </div>
  );
};

const ActionWerewolves: React.FC<{ players: Player[]; onComplete: (name: string) => void }> = ({ players, onComplete }) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const werewolves = players.filter(p => 
    ['werwolf', 'der_grosse_boese_werwolf', 'der_weisse_werwolf', 'urwolf'].includes(p.role.id) &&
    p.status === 'alive'
  );
  const targets = players.filter(p => 
    !['werwolf', 'der_grosse_boese_werwolf', 'der_weisse_werwolf', 'urwolf'].includes(p.role.id) &&
    p.status === 'alive'
  );

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center">🐺 {t('narrator_select_werwolf')}</h2>
      <div className="grid grid-cols-2 gap-3">
        {targets.map((player) => (
          <button
            key={player.name}
            onClick={() => setSelected(player.name)}
            className={`py-3 px-4 rounded-xl font-bold transition ${
              selected === player.name ? 'bg-red-600 text-white' : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            {player.name}
          </button>
        ))}
      </div>
      <button
        onClick={() => selected && onComplete(selected)}
        disabled={!selected}
        className={`w-full py-3 rounded-xl font-bold ${
          selected ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 cursor-not-allowed'
        }`}
      >
        {t('confirm')}
      </button>
    </div>
  );
};

const ActionAlphaWolf: React.FC<{ players: Player[]; onComplete: (name: string) => void }> = ({ players, onComplete }) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const targets = players.filter(p => 
    !['werwolf', 'der_grosse_boese_werwolf', 'der_weisse_werwolf', 'urwolf'].includes(p.role.id) &&
    p.status === 'alive'
  );

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center">🌙 {t('narrator_select_urwolf')}</h2>
      <p className="text-center text-sm text-white/80">Verwandle eine Person in einen Werwolf</p>
      <div className="grid grid-cols-2 gap-3">
        {targets.map((player) => (
          <button
            key={player.name}
            onClick={() => setSelected(player.name)}
            className={`py-3 px-4 rounded-xl font-bold transition ${
              selected === player.name ? 'bg-purple-600 text-white' : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            {player.name}
          </button>
        ))}
      </div>
      <button
        onClick={() => selected && onComplete(selected)}
        disabled={!selected}
        className={`w-full py-3 rounded-xl font-bold ${
          selected ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 cursor-not-allowed'
        }`}
      >
        {t('confirm')}
      </button>
    </div>
  );
};

const ActionWitch: React.FC<{ 
  players: Player[]; 
  victimName: string | null;
  canHeal: boolean;
  canPoison: boolean;
  onComplete: (heal: boolean, poisonTarget: string | null) => void;
}> = ({ players, victimName, canHeal, canPoison, onComplete }) => {
  const { t } = useTranslation();
  const [action, setAction] = useState<'none' | 'heal' | 'poison'>('none');
  const [poisonTarget, setPoisonTarget] = useState<string | null>(null);
  const alivePlayers = players.filter(p => p.status === 'alive');

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center">🧪 {t('narrator_select_hexe_action')}</h2>
      
      {victimName && (
        <div className="bg-red-600/30 border-2 border-red-500 rounded-xl p-4 text-center">
          <p className="text-sm">Opfer der Werwölfe:</p>
          <p className="text-xl font-bold">💀 {victimName}</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setAction('heal')}
          disabled={!canHeal || !victimName}
          className={`py-4 px-3 rounded-xl font-bold transition text-sm ${
            action === 'heal' ? 'bg-green-600 text-white' : 
            !canHeal || !victimName ? 'bg-gray-600 cursor-not-allowed' :
            'bg-white/20 hover:bg-white/30'
          }`}
        >
          {canHeal ? '💚 Heilen' : '❌ Heilen'}
        </button>
        <button
          onClick={() => setAction('poison')}
          disabled={!canPoison}
          className={`py-4 px-3 rounded-xl font-bold transition text-sm ${
            action === 'poison' ? 'bg-purple-600 text-white' :
            !canPoison ? 'bg-gray-600 cursor-not-allowed' :
            'bg-white/20 hover:bg-white/30'
          }`}
        >
          {canPoison ? '☠️ Vergiften' : '❌ Vergiften'}
        </button>
        <button
          onClick={() => setAction('none')}
          className={`py-4 px-3 rounded-xl font-bold transition text-sm ${
            action === 'none' ? 'bg-blue-600 text-white' : 'bg-white/20 hover:bg-white/30'
          }`}
        >
          ⏭️ Nichts
        </button>
      </div>

      {action === 'poison' && (
        <div className="grid grid-cols-2 gap-3">
          {alivePlayers.map((player) => (
            <button
              key={player.name}
              onClick={() => setPoisonTarget(player.name)}
              className={`py-3 px-4 rounded-xl font-bold transition ${
                poisonTarget === player.name ? 'bg-purple-600 text-white' : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              {player.name}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => onComplete(action === 'heal', action === 'poison' ? poisonTarget : null)}
        disabled={action === 'poison' && !poisonTarget}
        className={`w-full py-3 rounded-xl font-bold ${
          action === 'poison' && !poisonTarget ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
        }`}
      >
        {t('confirm')}
      </button>
    </div>
  );
};

const ActionPiper: React.FC<{ 
  players: Player[]; 
  alreadyEnchanted: string[];
  onComplete: (person1: string, person2: string) => void;
}> = ({ players, alreadyEnchanted, onComplete }) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string[]>([]);
  const availablePlayers = players.filter(p => 
    p.status === 'alive' && !alreadyEnchanted.includes(p.name)
  );

  const togglePlayer = (name: string) => {
    if (selected.includes(name)) {
      setSelected(selected.filter(n => n !== name));
    } else if (selected.length < 2) {
      setSelected([...selected, name]);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center">🎵 {t('narrator_select_piper')}</h2>
      <p className="text-center text-sm">Gewählt: {selected.length} / 2</p>
      <div className="grid grid-cols-2 gap-3">
        {availablePlayers.map((player) => (
          <button
            key={player.name}
            onClick={() => togglePlayer(player.name)}
            className={`py-3 px-4 rounded-xl font-bold transition ${
              selected.includes(player.name) ? 'bg-blue-600 text-white' : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            {player.name}
          </button>
        ))}
      </div>
      <button
        onClick={() => selected.length === 2 && onComplete(selected[0], selected[1])}
        disabled={selected.length !== 2}
        className={`w-full py-3 rounded-xl font-bold ${
          selected.length === 2 ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 cursor-not-allowed'
        }`}
      >
        {t('confirm')}
      </button>
    </div>
  );
};

const ActionHomeless: React.FC<{ players: Player[]; onComplete: (name: string) => void }> = ({ players, onComplete }) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const homeless = players.find(p => p.originalRole.id === 'der_obdachlose');
  const availablePlayers = players.filter(p => p.status === 'alive' && p.name !== homeless?.name);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center">🏚️ {t('narrator_select_homeless')}</h2>
      <div className="grid grid-cols-2 gap-3">
        {availablePlayers.map((player) => (
          <button
            key={player.name}
            onClick={() => setSelected(player.name)}
            className={`py-3 px-4 rounded-xl font-bold transition ${
              selected === player.name ? 'bg-blue-600 text-white' : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            {player.name}
          </button>
        ))}
      </div>
      <button
        onClick={() => selected && onComplete(selected)}
        disabled={!selected}
        className={`w-full py-3 rounded-xl font-bold ${
          selected ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 cursor-not-allowed'
        }`}
      >
        {t('confirm')}
      </button>
    </div>
  );
};

const ActionFox: React.FC<{ players: Player[]; onComplete: (name: string) => void }> = ({ players, onComplete }) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const alivePlayers = players.filter(p => p.status === 'alive');

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center">🦊 {t('narrator_select_fuchs')}</h2>
      <div className="grid grid-cols-2 gap-3">
        {alivePlayers.map((player) => (
          <button
            key={player.name}
            onClick={() => setSelected(player.name)}
            className={`py-3 px-4 rounded-xl font-bold transition ${
              selected === player.name ? 'bg-blue-600 text-white' : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            {player.name}
          </button>
        ))}
      </div>
      <button
        onClick={() => selected && onComplete(selected)}
        disabled={!selected}
        className={`w-full py-3 rounded-xl font-bold ${
          selected ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 cursor-not-allowed'
        }`}
      >
        {t('confirm')}
      </button>
    </div>
  );
};

const ActionBigBadWolf: React.FC<{ players: Player[]; onComplete: (name: string) => void }> = ({ players, onComplete }) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const targets = players.filter(p => 
    !['werwolf', 'der_grosse_boese_werwolf', 'der_weisse_werwolf', 'urwolf'].includes(p.role.id) &&
    p.status === 'alive'
  );

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center">🐺💀 {t('narrator_select_big_bad_wolf')}</h2>
      <p className="text-center text-sm text-white/80">Wähle ein 2. Opfer</p>
      <div className="grid grid-cols-2 gap-3">
        {targets.map((player) => (
          <button
            key={player.name}
            onClick={() => setSelected(player.name)}
            className={`py-3 px-4 rounded-xl font-bold transition ${
              selected === player.name ? 'bg-red-600 text-white' : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            {player.name}
          </button>
        ))}
      </div>
      <button
        onClick={() => selected && onComplete(selected)}
        disabled={!selected}
        className={`w-full py-3 rounded-xl font-bold ${
          selected ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 cursor-not-allowed'
        }`}
      >
        {t('confirm')}
      </button>
    </div>
  );
};

const ActionWhiteWolf: React.FC<{ players: Player[]; onComplete: (name: string) => void }> = ({ players, onComplete }) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const werewolves = players.filter(p => 
    ['werwolf', 'der_grosse_boese_werwolf', 'urwolf'].includes(p.role.id) &&
    p.status === 'alive'
  );

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center">⚪🐺 {t('narrator_select_white_wolf')}</h2>
      <p className="text-center text-sm text-white/80">Töte einen anderen Werwolf</p>
      <div className="grid grid-cols-2 gap-3">
        {werewolves.map((player) => (
          <button
            key={player.name}
            onClick={() => setSelected(player.name)}
            className={`py-3 px-4 rounded-xl font-bold transition ${
              selected === player.name ? 'bg-red-600 text-white' : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            {player.name}
          </button>
        ))}
      </div>
      <button
        onClick={() => selected && onComplete(selected)}
        disabled={!selected}
        className={`w-full py-3 rounded-xl font-bold ${
          selected ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 cursor-not-allowed'
        }`}
      >
        {t('confirm')}
      </button>
    </div>
  );
};

export default NarratorNightFlow;