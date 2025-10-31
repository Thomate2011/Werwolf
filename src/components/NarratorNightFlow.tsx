// src/components/NarratorNightFlow.tsx - VOLLSTÄNDIG KORRIGIERT & KOMPLETT

import React, { useState, useEffect } from 'react';
import { Player, Role } from '../types';
import { useTranslation } from '../LanguageContext';
import { audioManager } from '../services/AudioManager';
import { NightPhaseLogic } from '../services/NightPhaseLogic';
import { gameStateManager } from '../services/GameStateManager';

interface NarratorNightFlowProps {
  players: Player[];
  currentRound: number;
  thiefExtraRoles: Role[];
  jesterExtraRoles: Role[];
  onNightComplete: (deadPlayers: string[], updatedPlayers: Player[], hunterDeaths: string[]) => void;
}

type FlowState = 'playing_audio' | 'pause' | 'show_action' | 'show_continue';

interface NightActionState {
  werewolfTarget: string | null;
  bigBadWolfTarget: string | null;
  whiteWolfTarget: string | null;
  hexeHealUsed: boolean;
  hexePoisonTarget: string | null;
  healerProtected: string | null;
  seerChecked: string[];
  foxChecked: string[];
}

const AUDIO_NAME_MAP: Record<string, string> = {
  'der_verbitterte_greis': 'verbitterte_greis',
  'der_wolfshund': 'wolfshund',
  'die_drei_brueder': 'drei_brueder',
  'die_zwei_schwestern': 'zwei_schwestern',
  'das_wilde_kind': 'wilde_kind',
  'floetenspieler': 'piper',
  'der_obdachlose': 'homeless',
  'der_grosse_boese_werwolf': 'big_bad_wolf',
  'der_weisse_werwolf': 'white_wolf',
  'der_fuchs': 'fox',
};

const NarratorNightFlow: React.FC<NarratorNightFlowProps> = ({
  players,
  currentRound,
  thiefExtraRoles,
  jesterExtraRoles,
  onNightComplete,
}) => {
  const { t, locale } = useTranslation();
  
  const [flowState, setFlowState] = useState<FlowState>('playing_audio');
  const [roleSequence, setRoleSequence] = useState<string[]>([]);
  const [currentRoleIndex, setCurrentRoleIndex] = useState(0);
  const [currentAudioPhase, setCurrentAudioPhase] = useState<'open' | 'action' | 'close' | 'wake' | 'sleep'>('open');
  const [modifiedPlayers, setModifiedPlayers] = useState<Player[]>(players);
  const [displayText, setDisplayText] = useState<string>('');
  
  const [nightActions, setNightActions] = useState<NightActionState>({
    werewolfTarget: null,
    bigBadWolfTarget: null,
    whiteWolfTarget: null,
    hexeHealUsed: false,
    hexePoisonTarget: null,
    healerProtected: null,
    seerChecked: [],
    foxChecked: [],
  });

  useEffect(() => {
    const sequence = generateRoleSequence(modifiedPlayers, currentRound);
    console.log('🌙 Nacht-Sequenz Runde', currentRound, ':', sequence);
    setRoleSequence(sequence);
  }, [modifiedPlayers, currentRound]);

  const currentRole = roleSequence[currentRoleIndex];

  useEffect(() => {
    if (flowState !== 'playing_audio' || !currentRole) return;

    let audioKey = '';
    
    if (currentRole === 'close_eyes') {
      audioKey = 'narrator_close_eyes';
    } else if (currentRole === 'open_eyes') {
      audioKey = 'narrator_open_eyes';
    } else if (currentRole === 'reine_seele') {
      audioKey = 'narrator_reine_seele';
    } else {
      const mappedRole = AUDIO_NAME_MAP[currentRole] || currentRole;
      
      if (currentAudioPhase === 'open') {
        audioKey = `narrator_${mappedRole}_open`;
      } else if (currentAudioPhase === 'close') {
        audioKey = `narrator_${mappedRole}_close`;
      } else if (currentAudioPhase === 'action') {
        if (currentRole === 'amor') {
          audioKey = 'narrator_amor_tap';
        } else if (currentRole === 'urwolf') {
          audioKey = 'narrator_urwolf_tap';
        } else if (currentRole === 'floetenspieler') {
          audioKey = 'narrator_piper_tap';
        }
      } else if (currentAudioPhase === 'wake') {
        if (currentRole === 'amor') {
          audioKey = 'narrator_amor_wake';
        } else if (currentRole === 'floetenspieler') {
          audioKey = 'narrator_piper_wake';
        }
      } else if (currentAudioPhase === 'sleep') {
        if (currentRole === 'amor') {
          audioKey = 'narrator_amor_sleep';
        } else if (currentRole === 'floetenspieler') {
          audioKey = 'narrator_piper_sleep';
        }
      }
    }

    if (!audioKey) {
      console.warn('⚠️ Kein Audio-Key für:', currentRole, currentAudioPhase);
      handleAfterAudio();
      return;
    }

    console.log('🔊 Spiele Audio:', audioKey);

    audioManager.playAudio(
      locale,
      audioKey,
      () => handleAfterAudio(),
      (error) => {
        console.error('❌ Audio Fehler:', error);
        handleAfterAudio();
      }
    );
  }, [flowState, currentRole, currentAudioPhase, locale]);

  const handleAfterAudio = () => {
    if (currentRole === 'close_eyes') {
      proceedToNext();
      return;
    }

    if (currentRole === 'open_eyes') {
      proceedToNext();
      return;
    }

    if (currentRole === 'reine_seele') {
      setFlowState('show_continue');
      setDisplayText('Reine Seele hat sich zu erkennen gegeben.');
      return;
    }

    if (currentAudioPhase === 'open') {
      setFlowState('show_action');
    } else if (currentAudioPhase === 'action') {
      if (currentRole === 'amor' || currentRole === 'floetenspieler') {
        setCurrentAudioPhase('close');
        setFlowState('playing_audio');
      } else if (currentRole === 'urwolf') {
        setFlowState('show_continue');
        setDisplayText('Infizierung wurde durchgeführt.');
      }
    } else if (currentAudioPhase === 'close') {
      if (currentRole === 'amor' || currentRole === 'floetenspieler') {
        setCurrentAudioPhase('wake');
        setFlowState('playing_audio');
      } else {
        setFlowState('pause');
        setTimeout(() => {
          proceedToNext();
        }, 3000);
      }
    } else if (currentAudioPhase === 'wake') {
      setFlowState('show_continue');
      if (currentRole === 'amor') {
        setDisplayText('Verliebte, schaut euch an, wer euer Partner ist.');
      } else if (currentRole === 'floetenspieler') {
        setDisplayText('Verzauberte, schaut euch an, wer ebenfalls verzaubert ist.');
      }
    } else if (currentAudioPhase === 'sleep') {
      setFlowState('pause');
      setTimeout(() => {
        proceedToNext();
      }, 3000);
    }
  };

  const handleActionComplete = () => {
    if (['amor', 'urwolf', 'floetenspieler'].includes(currentRole)) {
      setCurrentAudioPhase('action');
      setFlowState('playing_audio');
    } else {
      setCurrentAudioPhase('close');
      setFlowState('playing_audio');
    }
  };

  const handleContinueClick = () => {
    if (currentRole === 'amor' || currentRole === 'floetenspieler') {
      setCurrentAudioPhase('sleep');
      setFlowState('playing_audio');
    } else if (currentRole === 'urwolf') {
      setCurrentAudioPhase('close');
      setFlowState('playing_audio');
    } else if (currentRole === 'reine_seele') {
      proceedToNext();
    }
  };

  const proceedToNext = () => {
    if (currentRoleIndex >= roleSequence.length - 1) {
      finishNight();
    } else {
      setCurrentRoleIndex(prev => prev + 1);
      setCurrentAudioPhase('open');
      setFlowState('playing_audio');
      setDisplayText('');
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

  const renderAction = () => {
    switch (currentRole) {
      case 'waisenkind':
        return <ActionOrphan players={modifiedPlayers} onComplete={(name, role) => {
          const orphan = modifiedPlayers.find(p => p.originalRole.id === 'waisenkind');
          if (orphan) {
            const updated = NightPhaseLogic.handleOrphanSelect(orphan.name, name, modifiedPlayers);
            setModifiedPlayers(updated);
          }
          setDisplayText(`Vorbild: ${name} - Rolle: ${role.name}`);
          setTimeout(() => {
            handleActionComplete();
          }, 3000);
        }} />;

      case 'dieb':
        return <ActionThief cards={thiefExtraRoles} onComplete={(card) => {
          const thief = modifiedPlayers.find(p => p.originalRole.id === 'dieb');
          if (thief) {
            const updated = NightPhaseLogic.handleThiefCardSelect(thief.name, card, modifiedPlayers);
            setModifiedPlayers(updated);
          }
          handleActionComplete();
        }} />;

      case 'gaukler':
        return <ActionJester cards={jesterExtraRoles} onComplete={(card) => {
          const jester = modifiedPlayers.find(p => p.originalRole.id === 'gaukler');
          if (jester) {
            const updated = NightPhaseLogic.handleJesterCardSelect(jester.name, card, modifiedPlayers);
            setModifiedPlayers(updated);
          }
          handleActionComplete();
        }} />;

      case 'amor':
        return <ActionCupid players={modifiedPlayers} onComplete={(l1, l2) => {
          NightPhaseLogic.handleAmorSelect(l1, l2, modifiedPlayers);
          handleActionComplete();
        }} />;

      case 'urwolf':
        return <ActionAlphaWolf players={modifiedPlayers} onComplete={(name) => {
          const updated = NightPhaseLogic.handleUrwolfSelect(name, modifiedPlayers);
          setModifiedPlayers(updated);
          handleActionComplete();
        }} />;

      case 'floetenspieler':
        return <ActionPiper players={modifiedPlayers} alreadyEnchanted={NightPhaseLogic.getAlreadyEnchanted(modifiedPlayers)} onComplete={(p1, p2) => {
          NightPhaseLogic.handlePiperSelect(p1, p2);
          handleActionComplete();
        }} />;

      case 'der_verbitterte_greis':
        return <ActionBitterOldMan players={modifiedPlayers} onComplete={(g1, g2) => {
          NightPhaseLogic.handleGreisGroupSelect(g1, g2, modifiedPlayers);
          handleActionComplete();
        }} />;

      case 'der_wolfshund':
        return <ActionWolfhound onComplete={(choice) => {
          const wolfhound = modifiedPlayers.find(p => p.originalRole.id === 'der_wolfshund');
          if (wolfhound) {
            const updated = NightPhaseLogic.handleWolfhundChoose(choice, wolfhound.name, modifiedPlayers);
            setModifiedPlayers(updated);
          }
          handleActionComplete();
        }} />;

      case 'das_wilde_kind':
        return <ActionWildChild players={modifiedPlayers} onComplete={(name) => {
          const updated = NightPhaseLogic.handleWildChildSelect(name, modifiedPlayers);
          setModifiedPlayers(updated);
          handleActionComplete();
        }} />;

      case 'die_drei_brueder':
        return <ActionSiblings text="Schaut euch an, wer eure Geschwister sind." onComplete={handleActionComplete} />;

      case 'die_zwei_schwestern':
        return <ActionSiblings text="Schaut euch an, wer eure Geschwister sind." onComplete={handleActionComplete} />;

      case 'seherin':
        return <ActionSeer 
          players={modifiedPlayers} 
          alreadyChecked={nightActions.seerChecked}
          onComplete={(checkedName) => {
            setNightActions(prev => ({ 
              ...prev, 
              seerChecked: [...prev.seerChecked, checkedName] 
            }));
            handleActionComplete();
          }} 
        />;

      case 'heiler_beschuetzer':
        return <ActionHealer players={modifiedPlayers} onComplete={(name) => {
          setNightActions(prev => ({ ...prev, healerProtected: name }));
          NightPhaseLogic.handleHealerSelect(name, modifiedPlayers);
          handleActionComplete();
        }} />;

      case 'werwolf':
        return <ActionWerewolves players={modifiedPlayers} onComplete={(name) => {
          setNightActions(prev => ({ ...prev, werewolfTarget: name }));
          handleActionComplete();
        }} />;

      case 'hexe':
        return <ActionWitch 
          players={modifiedPlayers} 
          victimName={nightActions.werewolfTarget}
          healPotionUsed={gameStateManager.canUseHealPotion() === false}
          poisonPotionUsed={gameStateManager.canUsePoisonPotion() === false}
          onComplete={(heal, poisonTarget) => {
            if (heal) {
              gameStateManager.useHealPotion();
              setNightActions(prev => ({ ...prev, hexeHealUsed: true }));
            }
            if (poisonTarget) {
              gameStateManager.usePoisonPotion();
              setNightActions(prev => ({ ...prev, hexePoisonTarget: poisonTarget }));
            }
            handleActionComplete();
          }} 
        />;

      case 'der_obdachlose':
        return <ActionHomeless players={modifiedPlayers} onComplete={(name) => {
          const updated = NightPhaseLogic.handleHomelessSelect(name, modifiedPlayers);
          setModifiedPlayers(updated);
          handleActionComplete();
        }} />;

      case 'der_fuchs':
        return <ActionFox 
          players={modifiedPlayers} 
          alreadyChecked={nightActions.foxChecked}
          onComplete={(name) => {
            setNightActions(prev => ({ 
              ...prev, 
              foxChecked: [...prev.foxChecked, name] 
            }));
            const result = NightPhaseLogic.handleFoxSelect(name, modifiedPlayers);
            setModifiedPlayers(result.players);
            
            setFlowState('show_action');
            if (result.hasWerewolf) {
              setDisplayText('✅ Einer der Drei ist ein Werwolf!');
            } else {
              setDisplayText('❌ Keiner der Drei ist ein Werwolf. Du hast deine Fähigkeit verloren!');
            }
            
            setTimeout(() => {
              setDisplayText('');
              handleActionComplete();
            }, 3000);
          }} 
        />;

      case 'der_grosse_boese_werwolf':
        return <ActionBigBadWolf players={modifiedPlayers} onComplete={(name) => {
          setNightActions(prev => ({ ...prev, bigBadWolfTarget: name }));
          handleActionComplete();
        }} />;

      case 'der_weisse_werwolf':
        return <ActionWhiteWolf players={modifiedPlayers} onComplete={(name) => {
          setNightActions(prev => ({ ...prev, whiteWolfTarget: name }));
          handleActionComplete();
        }} />;

      default:
        console.warn('⚠️ Keine Aktion für Rolle:', currentRole);
        return null;
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900">
      <div className="w-full max-w-3xl bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 text-white">
        
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Rolle {currentRoleIndex + 1} / {roleSequence.length}</span>
            <span>Runde {currentRound}</span>
          </div>
          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${((currentRoleIndex + 1) / roleSequence.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {flowState === 'playing_audio' && (
          <div className="text-center space-y-6">
            <div className="text-6xl animate-pulse">🎙️</div>
            <p className="text-sm text-white/60">Aktuelle Rolle: {currentRole}</p>
            <div className="flex justify-center gap-2">
              <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}

        {flowState === 'pause' && (
          <div className="text-center space-y-6">
            {/* Pause */}
          </div>
        )}

        {flowState === 'show_action' && (
          <div className="space-y-6">
            {displayText && (
              <div className="bg-blue-600/30 border-2 border-blue-500 rounded-xl p-6 text-center mb-4">
                <p className="text-2xl font-bold">{displayText}</p>
              </div>
            )}
            {renderAction()}
          </div>
        )}

        {flowState === 'show_continue' && (
          <div className="text-center space-y-6">
            {displayText && <p className="text-2xl text-white/90">{displayText}</p>}
            <button
              onClick={handleContinueClick}
              className="w-full py-4 px-8 bg-green-600 hover:bg-green-700 text-white font-bold text-xl rounded-xl shadow-lg"
            >
              {t('next')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

function generateRoleSequence(players: Player[], round: number): string[] {
  const sequence: string[] = [];
  const alive = players.filter(p => p.status === 'alive');
  
  console.log(`🎮 Generiere Sequenz für Runde ${round}:`);
  console.log('  Lebende Spieler:', alive.map(p => `${p.name} (${p.originalRole.id})`));
  
  const hasRole = (roleId: string) => {
    const found = alive.some(p => p.originalRole.id === roleId);
    console.log(`  ✓ hasRole('${roleId}'): ${found}`);
    return found;
  };

  if (round === 1 && hasRole('reine_seele')) {
    sequence.push('reine_seele');
  }

  sequence.push('close_eyes');

  if (round === 1) {
    if (hasRole('waisenkind')) sequence.push('waisenkind');
    if (hasRole('dieb')) sequence.push('dieb');
    if (hasRole('gaukler')) {
      const jester = alive.find(p => p.originalRole.id === 'gaukler');
      if (jester && jester.role.id !== 'werwolf') sequence.push('gaukler');
    }
    if (hasRole('der_verbitterte_greis')) sequence.push('der_verbitterte_greis');
    if (hasRole('amor')) sequence.push('amor');
    if (hasRole('der_wolfshund')) sequence.push('der_wolfshund');
    if (hasRole('die_drei_brueder')) sequence.push('die_drei_brueder');
    if (hasRole('die_zwei_schwestern')) sequence.push('die_zwei_schwestern');
    if (hasRole('das_wilde_kind')) sequence.push('das_wilde_kind');
  }

  if (hasRole('seherin')) sequence.push('seherin');
  if (hasRole('heiler_beschuetzer')) sequence.push('heiler_beschuetzer');
  
  if (hasRole('werwolf') || hasRole('der_grosse_boese_werwolf') || hasRole('der_weisse_werwolf') || hasRole('urwolf')) {
    sequence.push('werwolf');
  }

  if (hasRole('urwolf') && round === 1) sequence.push('urwolf');
  if (hasRole('der_grosse_boese_werwolf') && round % 2 === 0) sequence.push('der_grosse_boese_werwolf');
  if (hasRole('der_weisse_werwolf') && round % 2 === 0) sequence.push('der_weisse_werwolf');
  if (hasRole('hexe')) sequence.push('hexe');
  if (hasRole('floetenspieler')) sequence.push('floetenspieler');
  if (hasRole('der_obdachlose')) sequence.push('der_obdachlose');
  if (hasRole('der_fuchs')) sequence.push('der_fuchs');

  sequence.push('open_eyes');

  console.log('  📋 Final sequence:', sequence);
  
  return sequence;
}
// TEIL 2: ACTION COMPONENTS für NarratorNightFlow.tsx
// Diese Komponenten NACH generateRoleSequence() einfügen!

const ActionOrphan: React.FC<{ players: Player[]; onComplete: (name: string, role: Role) => void }> = ({ players, onComplete }) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const orphan = players.find(p => p.originalRole.id === 'waisenkind');
  const available = players.filter(p => p.status === 'alive' && p.name !== orphan?.name);

  const handleConfirm = () => {
    if (!selected) return;
    const selectedPlayer = players.find(p => p.name === selected);
    if (selectedPlayer) {
      onComplete(selected, selectedPlayer.role);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center">👶 Wähle ein Vorbild</h2>
      <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
        {available.map((p) => (
          <button key={p.name} onClick={() => setSelected(p.name)} className={`py-3 px-4 rounded-xl font-bold transition ${selected === p.name ? 'bg-blue-600 text-white' : 'bg-white/20 hover:bg-white/30'}`}>
            {p.name}
          </button>
        ))}
      </div>
      <button onClick={handleConfirm} disabled={!selected} className={`w-full py-3 rounded-xl font-bold ${selected ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 cursor-not-allowed'}`}>
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
      <h2 className="text-2xl font-bold text-center">🃏 Wähle eine Karte</h2>
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <button key={card.id} onClick={() => setSelected(card)} className={`py-4 px-4 rounded-xl font-bold transition ${selected?.id === card.id ? 'bg-blue-600 text-white' : 'bg-white/20 hover:bg-white/30'}`}>
            {card.name}
          </button>
        ))}
      </div>
      <button onClick={() => selected && onComplete(selected)} disabled={!selected} className={`w-full py-3 rounded-xl font-bold ${selected ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 cursor-not-allowed'}`}>
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
      <h2 className="text-2xl font-bold text-center">🎭 Wähle eine Rolle</h2>
      <div className="grid grid-cols-3 gap-3">
        {cards.map((card) => (
          <button key={card.id} onClick={() => setSelected(card)} className={`py-4 px-3 rounded-xl font-bold transition text-sm ${selected?.id === card.id ? 'bg-blue-600 text-white' : 'bg-white/20 hover:bg-white/30'}`}>
            {card.name}
          </button>
        ))}
      </div>
      <button onClick={() => selected && onComplete(selected)} disabled={!selected} className={`w-full py-3 rounded-xl font-bold ${selected ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 cursor-not-allowed'}`}>
        {t('confirm')}
      </button>
    </div>
  );
};

const ActionCupid: React.FC<{ players: Player[]; onComplete: (l1: string, l2: string) => void }> = ({ players, onComplete }) => {
  const { t } = useTranslation();
  const [lover1, setLover1] = useState<string | null>(null);
  const [lover2, setLover2] = useState<string | null>(null);
  const alive = players.filter(p => p.status === 'alive');
  const handlePlayerClick = (name: string) => {
    if (lover1 === name) setLover1(null);
    else if (lover2 === name) setLover2(null);
    else if (!lover1) setLover1(name);
    else if (!lover2) setLover2(name);
  };
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center">💘 Wähle 2 Verliebte</h2>
      <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
        {alive.map((p) => (
          <button key={p.name} onClick={() => handlePlayerClick(p.name)} className={`py-3 px-4 rounded-xl font-bold transition ${lover1 === p.name || lover2 === p.name ? 'bg-pink-600 text-white' : 'bg-white/20 hover:bg-white/30'}`}>
            {p.name}
          </button>
        ))}
      </div>
      <button onClick={() => lover1 && lover2 && onComplete(lover1, lover2)} disabled={!lover1 || !lover2} className={`w-full py-3 rounded-xl font-bold ${lover1 && lover2 ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 cursor-not-allowed'}`}>
        {t('confirm')}
      </button>
    </div>
  );
};

const ActionAlphaWolf: React.FC<{ players: Player[]; onComplete: (name: string) => void }> = ({ players, onComplete }) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const targets = players.filter(p => !['werwolf', 'der_grosse_boese_werwolf', 'der_weisse_werwolf', 'urwolf'].includes(p.role.id) && p.status === 'alive');
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center">🌙 Verwandle jemanden</h2>
      <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
        {targets.map((p) => (
          <button key={p.name} onClick={() => setSelected(p.name)} className={`py-3 px-4 rounded-xl font-bold transition ${selected === p.name ? 'bg-purple-600 text-white' : 'bg-white/20 hover:bg-white/30'}`}>
            {p.name}
          </button>
        ))}
      </div>
      <button onClick={() => selected && onComplete(selected)} disabled={!selected} className={`w-full py-3 rounded-xl font-bold ${selected ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 cursor-not-allowed'}`}>
        {t('confirm')}
      </button>
    </div>
  );
};

const ActionPiper: React.FC<{ players: Player[]; alreadyEnchanted: string[]; onComplete: (p1: string, p2: string) => void }> = ({ players, alreadyEnchanted, onComplete }) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string[]>([]);
  const piper = players.find(p => p.originalRole.id === 'floetenspieler');
  const available = players.filter(p => p.status === 'alive' && !alreadyEnchanted.includes(p.name) && p.name !== piper?.name);
  const togglePlayer = (name: string) => {
    if (selected.includes(name)) setSelected(selected.filter(n => n !== name));
    else if (selected.length < 2) setSelected([...selected, name]);
  };
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center">🎵 Wähle 2 Personen</h2>
      <p className="text-center text-sm">Gewählt: {selected.length} / 2</p>
      <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
        {available.map((p) => (
          <button key={p.name} onClick={() => togglePlayer(p.name)} className={`py-3 px-4 rounded-xl font-bold transition ${selected.includes(p.name) ? 'bg-blue-600 text-white' : 'bg-white/20 hover:bg-white/30'}`}>
            {p.name}
          </button>
        ))}
      </div>
      <button onClick={() => selected.length === 2 && onComplete(selected[0], selected[1])} disabled={selected.length !== 2} className={`w-full py-3 rounded-xl font-bold ${selected.length === 2 ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 cursor-not-allowed'}`}>
        {t('confirm')}
      </button>
    </div>
  );
};

const ActionBitterOldMan: React.FC<{ players: Player[]; onComplete: (g1: string[], g2: string[]) => void }> = ({ players, onComplete }) => {
  const { t } = useTranslation();
  const [group1, setGroup1] = useState<string[]>([]);
  const alive = players.filter(p => p.status === 'alive');
  const halfCount = Math.floor(alive.length / 2);
  const togglePlayer = (name: string) => {
    if (group1.includes(name)) setGroup1(group1.filter(n => n !== name));
    else if (group1.length < halfCount) setGroup1([...group1, name]);
  };
  const group2 = alive.filter(p => !group1.includes(p.name)).map(p => p.name);
  const isValid = group1.length === halfCount;
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center">👴 Wähle die Hälfte</h2>
      <p className="text-center text-sm">Gewählt: {group1.length} / {halfCount}</p>
      <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
        {alive.map((p) => (
          <button key={p.name} onClick={() => togglePlayer(p.name)} className={`py-3 px-4 rounded-xl font-bold transition ${group1.includes(p.name) ? 'bg-blue-600 text-white' : 'bg-white/20 hover:bg-white/30'}`}>
            {p.name}
          </button>
        ))}
      </div>
      <button onClick={() => isValid && onComplete(group1, group2)} disabled={!isValid} className={`w-full py-3 rounded-xl font-bold ${isValid ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 cursor-not-allowed'}`}>
        {t('confirm')}
      </button>
    </div>
  );
};

const ActionWolfhound: React.FC<{ onComplete: (choice: 'dorfbewohner' | 'werwolf') => void }> = ({ onComplete }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center">🐺 Wähle deine Seite</h2>
      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => onComplete('dorfbewohner')} className="py-6 px-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-lg">
          👨‍🌾 Dorfbewohner
        </button>
        <button onClick={() => onComplete('werwolf')} className="py-6 px-4 bg-red-600 hover:bg-red-700 rounded-xl font-bold text-lg">
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
  const available = players.filter(p => p.status === 'alive' && p.name !== wildChild?.name);
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center">🌲 Wähle dein Vorbild</h2>
      <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
        {available.map((p) => (
          <button key={p.name} onClick={() => setSelected(p.name)} className={`py-3 px-4 rounded-xl font-bold transition ${selected === p.name ? 'bg-blue-600 text-white' : 'bg-white/20 hover:bg-white/30'}`}>
            {p.name}
          </button>
        ))}
      </div>
      <button onClick={() => selected && onComplete(selected)} disabled={!selected} className={`w-full py-3 rounded-xl font-bold ${selected ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 cursor-not-allowed'}`}>
        {t('confirm')}
      </button>
    </div>
  );
};

const ActionSiblings: React.FC<{ text: string; onComplete: () => void }> = ({ text, onComplete }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-4 text-center">
      <h2 className="text-2xl font-bold">👨‍👩‍👧‍👦</h2>
      <p className="text-xl text-white/90">{text}</p>
      <button onClick={onComplete} className="w-full py-4 px-8 bg-green-600 hover:bg-green-700 text-white font-bold text-xl rounded-xl shadow-lg">
        {t('next')}
      </button>
    </div>
  );
};

const ActionSeer: React.FC<{ players: Player[]; alreadyChecked: string[]; onComplete: (checkedName: string) => void }> = ({ players, alreadyChecked, onComplete }) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const seer = players.find(p => p.originalRole.id === 'seherin');
  const available = players.filter(p => p.status === 'alive' && p.name !== seer?.name);
  const selectedPlayer = players.find(p => p.name === selected);
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center">🔮 Wähle eine Person</h2>
      {!revealed ? (
        <>
          <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
            {available.map((p) => {
              const wasChecked = alreadyChecked.includes(p.name);
              return (
                <button key={p.name} onClick={() => setSelected(p.name)} className={`py-3 px-4 rounded-xl font-bold transition ${selected === p.name ? 'bg-blue-600 text-white' : wasChecked ? 'bg-gray-700 text-white/60' : 'bg-white/20 hover:bg-white/30'}`}>
                  {p.name} {wasChecked && '✓'}
                </button>
              );
            })}
          </div>
          <button onClick={() => setRevealed(true)} disabled={!selected} className={`w-full py-3 rounded-xl font-bold ${selected ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-600 cursor-not-allowed'}`}>
            Rolle aufdecken
          </button>
        </>
      ) : (
        <>
          <div className="bg-purple-600/30 border-2 border-purple-500 rounded-xl p-6 text-center">
            <p className="text-xl mb-2">{selectedPlayer?.name}</p>
            <p className="text-3xl font-bold">{selectedPlayer?.role.name}</p>
          </div>
          <button onClick={() => selected && onComplete(selected)} className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-xl font-bold">
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
  const alive = players.filter(p => p.status === 'alive');
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center">🩺 Wähle jemanden</h2>
      <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
        {alive.map((p) => (
          <button key={p.name} onClick={() => setSelected(p.name)} className={`py-3 px-4 rounded-xl font-bold transition ${selected === p.name ? 'bg-blue-600 text-white' : 'bg-white/20 hover:bg-white/30'}`}>
            {p.name}
          </button>
        ))}
      </div>
      <button onClick={() => selected && onComplete(selected)} disabled={!selected} className={`w-full py-3 rounded-xl font-bold ${selected ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 cursor-not-allowed'}`}>
        {t('confirm')}
      </button>
    </div>
  );
};

const ActionWerewolves: React.FC<{ players: Player[]; onComplete: (name: string) => void }> = ({ players, onComplete }) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const targets = players.filter(p => !['werwolf', 'der_grosse_boese_werwolf', 'der_weisse_werwolf', 'urwolf'].includes(p.role.id) && p.status === 'alive');
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center">🐺 Wähle ein Opfer</h2>
      <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
        {targets.map((p) => (
          <button key={p.name} onClick={() => setSelected(p.name)} className={`py-3 px-4 rounded-xl font-bold transition ${selected === p.name ? 'bg-red-600 text-white' : 'bg-white/20 hover:bg-white/30'}`}>
            {p.name}
          </button>
        ))}
      </div>
      <button onClick={() => selected && onComplete(selected)} disabled={!selected} className={`w-full py-3 rounded-xl font-bold ${selected ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 cursor-not-allowed'}`}>
        {t('confirm')}
      </button>
    </div>
  );
};

const ActionWitch: React.FC<{ players: Player[]; victimName: string | null; healPotionUsed: boolean; poisonPotionUsed: boolean; onComplete: (heal: boolean, poisonTarget: string | null) => void }> = ({ players, victimName, healPotionUsed, poisonPotionUsed, onComplete }) => {
  const { t } = useTranslation();
  const [healed, setHealed] = useState(false);
  const [poisonTarget, setPoisonTarget] = useState<string | null>(null);
  const witch = players.find(p => p.originalRole.id === 'hexe');
  const alive = players.filter(p => p.status === 'alive' && p.name !== witch?.name && p.name !== victimName);
  const handleHealClick = () => {
    if (healPotionUsed || !victimName) return;
    setHealed(!healed);
  };
  const handlePoisonClick = (name: string) => {
    if (poisonPotionUsed) return;
    setPoisonTarget(poisonTarget === name ? null : name);
  };
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center">🧪 Hexe</h2>
      {victimName && (
        <div className="bg-red-600/30 border-2 border-red-500 rounded-xl p-4 text-center">
          <p className="text-sm">Opfer der Werwölfe:</p>
          <p className="text-xl font-bold">💀 {victimName}</p>
        </div>
      )}
      <div className="space-y-3">
        <button onClick={handleHealClick} disabled={healPotionUsed || !victimName} className={`w-full py-4 rounded-xl font-bold transition ${healed ? 'bg-green-600 text-white' : healPotionUsed || !victimName ? 'bg-gray-600 cursor-not-allowed text-white/50' : 'bg-green-500 hover:bg-green-600'}`}>
          {healed ? '✅ Geheilt' : healPotionUsed ? '❌ Heiltrank verbraucht' : '💚 Heilen'}
        </button>
        <p className="text-center font-bold">☠️ Vergiften</p>
        {poisonPotionUsed ? (
          <p className="text-center text-white/60">❌ Gifttrank verbraucht</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
            {alive.map((p) => (
              <button key={p.name} onClick={() => handlePoisonClick(p.name)} className={`py-3 px-4 rounded-xl font-bold transition ${poisonTarget === p.name ? 'bg-purple-600 text-white' : 'bg-white/20 hover:bg-white/30'}`}>
                {p.name}
              </button>
            ))}
          </div>
        )}
      </div>
      <button onClick={() => onComplete(healed, poisonTarget)} className="w-full py-3 rounded-xl font-bold bg-purple-600 hover:bg-purple-700">
        {t('confirm')}
      </button>
    </div>
  );
};

const ActionHomeless: React.FC<{ players: Player[]; onComplete: (name: string) => void }> = ({ players, onComplete }) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const homeless = players.find(p => p.originalRole.id === 'der_obdachlose');
  const available = players.filter(p => p.status === 'alive' && p.name !== homeless?.name);
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center">🏚️ Wo übernachtest du?</h2>
      <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
        {available.map((p) => (
          <button key={p.name} onClick={() => setSelected(p.name)} className={`py-3 px-4 rounded-xl font-bold transition ${selected === p.name ? 'bg-blue-600 text-white' : 'bg-white/20 hover:bg-white/30'}`}>
            {p.name}
          </button>
        ))}
      </div>
      <button onClick={() => selected && onComplete(selected)} disabled={!selected} className={`w-full py-3 rounded-xl font-bold ${selected ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 cursor-not-allowed'}`}>
        {t('confirm')}
      </button>
    </div>
  );
};

const ActionFox: React.FC<{ players: Player[]; alreadyChecked: string[]; onComplete: (name: string) => void }> = ({ players, alreadyChecked, onComplete }) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const alive = players.filter(p => p.status === 'alive');
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center">🦊 Wähle eine Person</h2>
      <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
        {alive.map((p) => {
          const wasChecked = alreadyChecked.includes(p.name);
          return (
            <button key={p.name} onClick={() => setSelected(p.name)} className={`py-3 px-4 rounded-xl font-bold transition ${selected === p.name ? 'bg-blue-600 text-white' : wasChecked ? 'bg-gray-700 text-white/60' : 'bg-white/20 hover:bg-white/30'}`}>
              {p.name} {wasChecked && '✓'}
            </button>
          );
        })}
      </div>
      <button onClick={() => selected && onComplete(selected)} disabled={!selected} className={`w-full py-3 rounded-xl font-bold ${selected ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 cursor-not-allowed'}`}>
        {t('confirm')}
      </button>
    </div>
  );
};

const ActionBigBadWolf: React.FC<{ players: Player[]; onComplete: (name: string) => void }> = ({ players, onComplete }) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const targets = players.filter(p => !['werwolf', 'der_grosse_boese_werwolf', 'der_weisse_werwolf', 'urwolf'].includes(p.role.id) && p.status === 'alive');
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center">🐺💀 2. Opfer</h2>
      <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
        {targets.map((p) => (
          <button key={p.name} onClick={() => setSelected(p.name)} className={`py-3 px-4 rounded-xl font-bold transition ${selected === p.name ? 'bg-red-600 text-white' : 'bg-white/20 hover:bg-white/30'}`}>
            {p.name}
          </button>
        ))}
      </div>
      <button onClick={() => selected && onComplete(selected)} disabled={!selected} className={`w-full py-3 rounded-xl font-bold ${selected ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 cursor-not-allowed'}`}>
        {t('confirm')}
      </button>
    </div>
  );
};

// TEIL 3: Weißer Wolf + Export
// Diese Action-Komponente vervollständigt die Datei!

const ActionWhiteWolf: React.FC<{ players: Player[]; onComplete: (name: string) => void }> = ({ players, onComplete }) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const werewolves = players.filter(p => ['werwolf', 'der_grosse_boese_werwolf', 'urwolf'].includes(p.role.id) && p.status === 'alive');
  
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center">⚪🐺 Töte einen Werwolf</h2>
      <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
        {werewolves.map((p) => (
          <button 
            key={p.name} 
            onClick={() => setSelected(p.name)} 
            className={`py-3 px-4 rounded-xl font-bold transition ${
              selected === p.name ? 'bg-red-600 text-white' : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            {p.name}
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