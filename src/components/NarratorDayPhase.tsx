// src/components/NarratorDayPhase.tsx - MIT RICHTER AM TAG 1

import React, { useState, useEffect } from 'react';
import { Player } from '../types';
import { useTranslation } from '../LanguageContext';
import { gameStateManager } from '../services/GameStateManager';
import { audioManager } from '../services/AudioManager';

interface NarratorDayPhaseProps {
  players: Player[];
  nightDeaths: string[];
  hunterDeaths: string[];
  currentDay: number;
  onDayComplete: (updatedPlayers: Player[]) => void;
  onGameEnd: (winner: string) => void;
  onRestart: () => void;
  onGoHome: () => void;
}

type DayPhase = 
  | 'show_deaths' 
  | 'maid_action' 
  | 'hunter_action' 
  | 'discussion' 
  | 'voting' 
  | 'judge_close_eyes'
  | 'judge_audio'
  | 'judge_decision'
  | 'judge_eyes_close'
  | 'judge_eyes_open'
  | 'judge_announcement'
  | 'second_voting'
  | 'show_day_deaths' 
  | 'win_screen';

const NarratorDayPhase: React.FC<NarratorDayPhaseProps> = ({
  players,
  nightDeaths,
  hunterDeaths,
  currentDay,
  onDayComplete,
  onGameEnd,
  onRestart,
  onGoHome,
}) => {
  const { t, locale } = useTranslation();
  const [phase, setPhase] = useState<DayPhase>('show_deaths');
  const [dayPlayers, setDayPlayers] = useState<Player[]>(players);
  const [dayDeaths, setDayDeaths] = useState<string[]>([]);
  const [currentHunterIndex, setCurrentHunterIndex] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);
  const [bearGrowled, setBearGrowled] = useState(false);
  const [firstVotedPlayer, setFirstVotedPlayer] = useState<string | null>(null);
  const [judgeWantsSecondVote, setJudgeWantsSecondVote] = useState(false);

  // Bärenführer Check beim Mount
  useEffect(() => {
    const shouldGrowl = gameStateManager.checkBearAlert(dayPlayers);
    setBearGrowled(shouldGrowl);
  }, []);

  const checkWinCondition = (currentPlayers: Player[]): string | null => {
    const alivePlayers = currentPlayers.filter(p => p.status === 'alive');
    
    const piper = currentPlayers.find(p => p.originalRole.id === 'floetenspieler');
    if (piper && piper.status === 'alive') {
      const allEnchanted = alivePlayers.every(p => 
        gameStateManager.isPiperEnchanted(p.name) || p.name === piper.name
      );
      if (allEnchanted) return 'piper';
    }

    if (gameStateManager.checkBitterOldManWin(currentPlayers.filter(p => p.status === 'dead'))) {
      return 'bitter_old_man';
    }

    const lovers = gameStateManager.getLovers();
    if (lovers.length === 2) {
      const lover1Alive = alivePlayers.find(p => p.name === lovers[0]);
      const lover2Alive = alivePlayers.find(p => p.name === lovers[1]);
      if (lover1Alive && lover2Alive && alivePlayers.length === 2) {
        return 'lovers';
      }
    }

    const werewolfRoles = ['werwolf', 'der_grosse_boese_werwolf', 'der_weisse_werwolf', 'urwolf'];
    const aliveWerewolves = alivePlayers.filter(p => werewolfRoles.includes(p.role.id));
    const aliveNonWerewolves = alivePlayers.filter(p => !werewolfRoles.includes(p.role.id));

    const whiteWolf = alivePlayers.find(p => p.role.id === 'der_weisse_werwolf');
    if (whiteWolf && alivePlayers.length === 1) return 'white_wolf';

    if (aliveWerewolves.length > 0 && aliveNonWerewolves.length === 0) return 'werewolves';
    if (aliveWerewolves.length === 0 && aliveNonWerewolves.length > 0) return 'villagers';

    return null;
  };

  // ============ TOD-ANZEIGE ============
  const handleShowDeaths = () => {
    const maid = dayPlayers.find(p => 
      p.originalRole.id === 'ergebene_magd' && 
      p.status === 'alive'
    );

    if (maid && nightDeaths.length > 0) {
      setPhase('maid_action');
    } else if (hunterDeaths.length > 0) {
      setPhase('hunter_action');
    } else {
      const winnerCheck = checkWinCondition(dayPlayers);
      if (winnerCheck) {
        setWinner(winnerCheck);
        setPhase('win_screen');
      } else {
        setPhase('discussion');
      }
    }
  };

  // ============ ERGEBENE MAGD ============
  const handleMaidAction = (takeOver: boolean, deadPlayerName?: string) => {
    let newPlayers = [...dayPlayers];
    
    if (takeOver && deadPlayerName) {
      const maid = newPlayers.find(p => p.originalRole.id === 'ergebene_magd');
      const deadPlayer = newPlayers.find(p => p.name === deadPlayerName);
      
      if (maid && deadPlayer) {
        newPlayers = newPlayers.map(p => {
          if (p.name === maid.name) {
            return { ...p, role: deadPlayer.role };
          }
          return p;
        });
        setDayPlayers(newPlayers);
      }
    }

    if (hunterDeaths.length > 0) {
      setPhase('hunter_action');
    } else {
      const winnerCheck = checkWinCondition(newPlayers);
      if (winnerCheck) {
        setWinner(winnerCheck);
        setPhase('win_screen');
      } else {
        setPhase('discussion');
      }
    }
  };

  // ============ JÄGER-SCHUSS ============
  const handleHunterShoot = (targetName: string) => {
    const newDeaths = [...dayDeaths, targetName];
    setDayDeaths(newDeaths);

    let newPlayers = dayPlayers.map(p =>
      p.name === targetName ? { ...p, status: 'dead' as const } : p
    );

    const lovers = gameStateManager.getLovers();
    if (lovers.includes(targetName)) {
      const otherLover = lovers.find(l => l !== targetName);
      if (otherLover) {
        newPlayers = newPlayers.map(p =>
          p.name === otherLover ? { ...p, status: 'dead' as const } : p
        );
        newDeaths.push(otherLover);
        setDayDeaths(newDeaths);
      }
    }

    setDayPlayers(newPlayers);

    const targetPlayer = newPlayers.find(p => p.name === targetName);
    const isAnotherHunter = targetPlayer?.originalRole.id === 'jaeger';

    if (isAnotherHunter) {
      setCurrentHunterIndex(prev => prev + 1);
    } else if (currentHunterIndex < hunterDeaths.length - 1) {
      setCurrentHunterIndex(prev => prev + 1);
    } else {
      const winnerCheck = checkWinCondition(newPlayers);
      if (winnerCheck) {
        setWinner(winnerCheck);
        setPhase('win_screen');
      } else {
        setPhase('discussion');
      }
    }
  };

  // ============ ERSTE ABSTIMMUNG ============
  const handleVoting = (selectedName: string) => {
    const votedPlayer = dayPlayers.find(p => p.name === selectedName);
    if (!votedPlayer) return;

    if (votedPlayer.originalRole.id === 'dorfdepp') {
      setPhase('show_day_deaths');
      return;
    }

    if (votedPlayer.originalRole.id === 'der_engel') {
      setWinner('angel');
      setPhase('win_screen');
      return;
    }

    const newDeaths = [...dayDeaths, selectedName];
    setDayDeaths(newDeaths);

    let newPlayers = dayPlayers.map(p =>
      p.name === selectedName ? { ...p, status: 'dead' as const } : p
    );

    const lovers = gameStateManager.getLovers();
    if (lovers.includes(selectedName)) {
      const otherLover = lovers.find(l => l !== selectedName);
      if (otherLover) {
        newPlayers = newPlayers.map(p =>
          p.name === otherLover ? { ...p, status: 'dead' as const } : p
        );
        newDeaths.push(otherLover);
        setDayDeaths(newDeaths);
      }
    }

    setDayPlayers(newPlayers);
    setFirstVotedPlayer(selectedName);

    const winnerCheck = checkWinCondition(newPlayers);
  if (winnerCheck) {
    setWinner(winnerCheck);
    setPhase('win_screen');
    return; 
  }

    // Richter nur am Tag 1 UND wenn er noch lebt
    const judgeAlive = newPlayers.find(p => 
      p.originalRole.id === 'der_stotternde_richter' && 
      p.status === 'alive'
    );

    if (currentDay === 1 && judgeAlive) {
      setPhase('judge_close_eyes');
    } else if (votedPlayer.originalRole.id === 'jaeger') {
      setPhase('hunter_action');
      setCurrentHunterIndex(0);
    } else {
      const winnerCheck = checkWinCondition(newPlayers);
      if (winnerCheck) {
        setWinner(winnerCheck);
        setPhase('win_screen');
      } else {
        setPhase('show_day_deaths');
      }
    }
  };

  // ============ RICHTER AUDIO SEQUENZ ============
  useEffect(() => {
    if (phase === 'judge_close_eyes') {
      audioManager.playAudio(
        locale,
        'narrator_close_eyes',
        () => {
          setTimeout(() => {
            setPhase('judge_audio');
          }, 3000);
        },
        () => {
          setPhase('judge_audio');
        }
      );
    } else if (phase === 'judge_audio') {
      audioManager.playAudio(
        locale,
        'narrator_richter_open',
        () => {
          setPhase('judge_decision');
        },
        () => {
          setPhase('judge_decision');
        }
      );
    } else if (phase === 'judge_eyes_close') {
      audioManager.playAudio(
        locale,
        'narrator_richter_close',
        () => {
          setTimeout(() => {
            setPhase('judge_eyes_open');
          }, 3000);
        },
        () => {
          setPhase('judge_eyes_open');
        }
      );
    } else if (phase === 'judge_eyes_open') {
      audioManager.playAudio(
        locale,
        'narrator_open_eyes',
        () => {
          setTimeout(() => {
            setPhase('judge_announcement');
          }, 3000);
        },
        () => {
          setPhase('judge_announcement');
        }
      );
    }
  }, [phase, locale]);

  const handleJudgeDecision = (wantsSecond: boolean) => {
    setJudgeWantsSecondVote(wantsSecond);
    setPhase('judge_eyes_close');
  };

  const handleJudgeAnnouncement = () => {
    if (judgeWantsSecondVote) {
      setPhase('second_voting');
    } else {
      // Prüfe ob Jäger gestorben ist
      const firstVoted = dayPlayers.find(p => p.name === firstVotedPlayer);
      if (firstVoted?.originalRole.id === 'jaeger') {
        setPhase('hunter_action');
        setCurrentHunterIndex(0);
      } else {
        const winnerCheck = checkWinCondition(dayPlayers);
        if (winnerCheck) {
          setWinner(winnerCheck);
          setPhase('win_screen');
        } else {
          setPhase('show_day_deaths');
        }
      }
    }
  };

  // ============ ZWEITE ABSTIMMUNG ============
  const handleSecondVoting = (selectedName: string) => {
    const votedPlayer = dayPlayers.find(p => p.name === selectedName);
    if (!votedPlayer) return;

    if (votedPlayer.originalRole.id === 'dorfdepp') {
      setPhase('show_day_deaths');
      return;
    }

    if (votedPlayer.originalRole.id === 'der_engel') {
      setWinner('angel');
      setPhase('win_screen');
      return;
    }

    const newDeaths = [...dayDeaths, selectedName];
    setDayDeaths(newDeaths);

    let newPlayers = dayPlayers.map(p =>
      p.name === selectedName ? { ...p, status: 'dead' as const } : p
    );

    const lovers = gameStateManager.getLovers();
    if (lovers.includes(selectedName)) {
      const otherLover = lovers.find(l => l !== selectedName);
      if (otherLover) {
        newPlayers = newPlayers.map(p =>
          p.name === otherLover ? { ...p, status: 'dead' as const } : p
        );
        newDeaths.push(otherLover);
        setDayDeaths(newDeaths);
      }
    }

    setDayPlayers(newPlayers);

    if (votedPlayer.originalRole.id === 'jaeger') {
      setPhase('hunter_action');
      setCurrentHunterIndex(0);
    } else {
      const winnerCheck = checkWinCondition(newPlayers);
      if (winnerCheck) {
        setWinner(winnerCheck);
        setPhase('win_screen');
      } else {
        setPhase('show_day_deaths');
      }
    }
  };

  // ============ SÜNDENBOCK STIRBT ============
  const handleScapegoatDeath = () => {
    const scapegoat = dayPlayers.find(p => 
      p.originalRole.id === 'suendenbock' && 
      p.status === 'alive'
    );
    
    if (!scapegoat) return;

    const newDeaths = [...dayDeaths, scapegoat.name];
    setDayDeaths(newDeaths);

    let newPlayers = dayPlayers.map(p =>
      p.name === scapegoat.name ? { ...p, status: 'dead' as const } : p
    );

    const lovers = gameStateManager.getLovers();
    if (lovers.includes(scapegoat.name)) {
      const otherLover = lovers.find(l => l !== scapegoat.name);
      if (otherLover) {
        newPlayers = newPlayers.map(p =>
          p.name === otherLover ? { ...p, status: 'dead' as const } : p
        );
        newDeaths.push(otherLover);
        setDayDeaths(newDeaths);
      }
    }

    setDayPlayers(newPlayers);

    const winnerCheck = checkWinCondition(newPlayers);
    if (winnerCheck) {
      setWinner(winnerCheck);
      setPhase('win_screen');
    } else {
      setPhase('show_day_deaths');
    }
  };

  // ============ TAG-TOTE ANZEIGEN ============
  const handleShowDayDeaths = () => {
    const winnerCheck = checkWinCondition(dayPlayers);
    if (winnerCheck) {
      setWinner(winnerCheck);
      setPhase('win_screen');
    } else {
      onDayComplete(dayPlayers);
    }
  };

  // ============ GEWINN-SCREEN ============
  const getWinnerText = (): string => {
    switch (winner) {
      case 'villagers': return t('narrator_game_end_villagers_win');
      case 'werewolves': return t('narrator_game_end_werewolves_win');
      case 'white_wolf': return t('narrator_game_end_white_wolf_wins');
      case 'piper': return t('narrator_game_end_piper_wins');
      case 'angel': return t('narrator_game_end_angel_wins');
      case 'bitter_old_man': return t('narrator_game_end_bitter_old_man_wins');
      case 'lovers': return t('narrator_game_end_lovers_win');
      default: return 'Unbekannter Gewinner';
    }
  };

  const scapegoatAlive = dayPlayers.some(p => 
    p.originalRole.id === 'suendenbock' && 
    p.status === 'alive'
  );

  if (phase === 'win_screen') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-yellow-600 via-orange-600 to-red-600">
        <div className="w-full max-w-3xl bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-12 text-white">
          <div className="text-center space-y-8">
            <div className="text-8xl">🎉</div>
            <h1 className="text-5xl font-bold">{getWinnerText()}</h1>
            
            <div className="grid grid-cols-2 gap-6 mt-12">
              <div className="text-center">
                <button
                  onClick={onRestart}
                  className="w-full py-6 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold text-2xl rounded-xl shadow-lg transition transform hover:scale-105"
                >
                  {t('restart')}
                </button>
                <p className="text-sm text-white/70 mt-3">Zur Rollenauswahl</p>
              </div>
              
              <div className="text-center">
                <button
                  onClick={onGoHome}
                  className="w-full py-6 px-8 bg-red-600 hover:bg-red-700 text-white font-bold text-2xl rounded-xl shadow-lg transition transform hover:scale-105"
                >
                  {t('to_homepage')}
                </button>
                <p className="text-sm text-white/70 mt-3">Kompletter Reset</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'show_deaths') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-orange-900 via-red-900 to-pink-900">
        <div className="w-full max-w-3xl bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-12 text-white">
          {bearGrowled && (
            <div className="mb-6 text-center">
              <div className="text-6xl mb-4">🐻💢</div>
              <p className="text-2xl font-bold text-yellow-400">GRRRR! Der Bär knurrt!</p>
            </div>
          )}
          
          <h1 className="text-4xl font-bold text-center mb-8">
            🌅 {t('narrator_day_deaths_title')}
          </h1>

          {nightDeaths.length === 0 ? (
            <div className="text-center space-y-6">
              <p className="text-3xl">🌙✨</p>
              <p className="text-2xl text-white/80">{t('narrator_day_no_deaths')}</p>
            </div>
          ) : (
            <div className="space-y-4 mb-8">
              {nightDeaths.map((name) => (
                <div
                  key={name}
                  className="bg-red-600/30 border-2 border-red-500 rounded-xl p-6 text-center transform hover:scale-105 transition"
                >
                  <p className="text-3xl font-bold">💀 {name}</p>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleShowDeaths}
            className="w-full py-4 px-8 bg-green-600 hover:bg-green-700 text-white font-bold text-xl rounded-xl shadow-lg transition-all"
          >
            {t('next')}
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'maid_action') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-purple-900 via-pink-900 to-red-900">
        <div className="w-full max-w-3xl bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-12 text-white">
          <h1 className="text-4xl font-bold text-center mb-8">
            👩🏼 {t('narrator_day_maid_button')}
          </h1>
          <p className="text-xl text-center mb-8 text-white/80">
            {t('narrator_day_maid_choice')}
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {nightDeaths.map((deadName) => (
              <button
                key={deadName}
                onClick={() => handleMaidAction(true, deadName)}
                className="py-4 px-6 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition"
              >
                {deadName}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleMaidAction(false)}
            className="w-full py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-xl transition"
          >
            Nichts tun
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'hunter_action') {
    const currentHunterName = hunterDeaths[currentHunterIndex];
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-red-900 to-orange-900">
        <div className="w-full max-w-3xl bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-12 text-white">
          <h1 className="text-4xl font-bold text-center mb-8">
            🏹 {t('narrator_day_hunter_shoots')}
          </h1>
          <div className="bg-red-600/30 border-2 border-red-500 rounded-xl p-6 text-center mb-8">
            <p className="text-3xl font-bold">{currentHunterName}</p>
          </div>
          <p className="text-xl text-center mb-8 text-white/80">
            Wähle ein Ziel für deinen letzten Schuss
          </p>

          <div className="grid grid-cols-2 gap-4">
            {dayPlayers
              .filter(p => p.status === 'alive')
              .map((player) => (
                <button
                  key={player.name}
                  onClick={() => handleHunterShoot(player.name)}
                  className="py-4 px-6 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition transform hover:scale-105"
                >
                  {player.name}
                </button>
              ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'discussion') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900">
        <div className="w-full max-w-3xl bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-12 text-white">
          <h1 className="text-4xl font-bold text-center mb-8">
            💬 {t('narrator_day_discussion')}
          </h1>
          <p className="text-xl text-center mb-8 text-white/80">
            Diskutiert jetzt, wer der Werwolf sein könnte
          </p>
          <div className="text-center text-6xl mb-8">🗣️</div>
          <button
            onClick={() => setPhase('voting')}
            className="w-full py-4 px-8 bg-green-600 hover:bg-green-700 text-white font-bold text-xl rounded-xl shadow-lg transition-all"
          >
            {t('narrator_day_voting')}
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'voting') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-yellow-900 via-orange-900 to-red-900">
        <div className="w-full max-w-3xl bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-12 text-white">
          <h1 className="text-4xl font-bold text-center mb-8">
            🗳️ Erste Abstimmung
          </h1>
          <p className="text-xl text-center mb-8 text-white/80">
            Wählt gemeinsam eine Person aus
          </p>

          <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto mb-6">
            {dayPlayers
              .filter(p => p.status === 'alive')
              .map((player) => (
                <button
                  key={player.name}
                  onClick={() => handleVoting(player.name)}
                  className="py-4 px-6 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition transform hover:scale-105"
                >
                  {player.name}
                </button>
              ))}
          </div>

          {scapegoatAlive && (
            <button
              onClick={handleScapegoatDeath}
              className="w-full py-4 px-8 bg-yellow-600 hover:bg-yellow-700 text-white font-bold text-xl rounded-xl shadow-lg transition-all"
            >
              🐐 Gleichstand - Sündenbock stirbt
            </button>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'judge_close_eyes' || phase === 'judge_audio') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900">
        <div className="w-full max-w-3xl bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-12 text-white">
          <div className="text-center space-y-6">
            <div className="text-6xl animate-pulse">🎙️</div>
            <div className="flex justify-center gap-2">
              <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'judge_decision') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900">
        <div className="w-full max-w-3xl bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-12 text-white">
          <h1 className="text-4xl font-bold text-center mb-8">
            ⚖️ Stotternder Richter
          </h1>
          <p className="text-2xl text-center mb-12 text-white/90">
            Soll eine zweite Abstimmung stattfinden?
          </p>

          <div className="grid grid-cols-2 gap-6">
            <button
              onClick={() => handleJudgeDecision(true)}
              className="py-8 px-6 bg-green-600 hover:bg-green-700 text-white font-bold text-2xl rounded-xl transition transform hover:scale-105"
            >
              ✅ Ja
            </button>
            <button
              onClick={() => handleJudgeDecision(false)}
              className="py-8 px-6 bg-red-600 hover:bg-red-700 text-white font-bold text-2xl rounded-xl transition transform hover:scale-105"
            >
              ❌ Nein
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'judge_eyes_close' || phase === 'judge_eyes_open') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900">
        <div className="w-full max-w-3xl bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-12 text-white">
          <div className="text-center space-y-6">
            <div className="text-6xl animate-pulse">🎙️</div>
            <div className="flex justify-center gap-2">
              <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'judge_announcement') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900">
        <div className="w-full max-w-3xl bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-12 text-white">
          <h1 className="text-4xl font-bold text-center mb-8">
            ⚖️ Richter Entscheidung
          </h1>
          <div className="bg-blue-600/30 border-2 border-blue-500 rounded-xl p-8 text-center mb-8">
            {judgeWantsSecondVote ? (
              <>
                <div className="text-6xl mb-4">✅</div>
                <p className="text-2xl font-bold">Der Richter hat eine zweite Abstimmung angeordnet!</p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">❌</div>
                <p className="text-2xl font-bold">Es gibt keine zweite Abstimmung.</p>
              </>
            )}
          </div>
          <button
            onClick={handleJudgeAnnouncement}
            className="w-full py-4 px-8 bg-green-600 hover:bg-green-700 text-white font-bold text-xl rounded-xl shadow-lg transition-all"
          >
            {t('next')}
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'second_voting') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-yellow-900 via-orange-900 to-red-900">
        <div className="w-full max-w-3xl bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-12 text-white">
          <h1 className="text-4xl font-bold text-center mb-8">
            🗳️ Zweite Abstimmung
          </h1>
          <p className="text-xl text-center mb-8 text-white/80">
            Wählt gemeinsam eine Person aus (keine Diskussion!)
          </p>

          <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto mb-6">
            {dayPlayers
              .filter(p => p.status === 'alive')
              .map((player) => (
                <button
                  key={player.name}
                  onClick={() => handleSecondVoting(player.name)}
                  className="py-4 px-6 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition transform hover:scale-105"
                >
                  {player.name}
                </button>
              ))}
          </div>

          {scapegoatAlive && (
            <button
              onClick={handleScapegoatDeath}
              className="w-full py-4 px-8 bg-yellow-600 hover:bg-yellow-700 text-white font-bold text-xl rounded-xl shadow-lg transition-all"
            >
              🐐 Gleichstand - Sündenbock stirbt
            </button>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'show_day_deaths') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-red-900 to-black">
        <div className="w-full max-w-3xl bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-12 text-white">
          <h1 className="text-4xl font-bold text-center mb-8">
            ⚰️ Tote des Tages
          </h1>

          {dayDeaths.length === 0 ? (
            <div className="text-center space-y-6">
              <p className="text-3xl">✨</p>
              <p className="text-2xl text-white/80">Niemand ist am Tag gestorben</p>
            </div>
          ) : (
            <div className="space-y-4 mb-8">
              {dayDeaths.map((name) => (
                <div
                  key={name}
                  className="bg-red-600/30 border-2 border-red-500 rounded-xl p-6 text-center transform hover:scale-105 transition"
                >
                  <p className="text-3xl font-bold">💀 {name}</p>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleShowDayDeaths}
            className="w-full py-4 px-8 bg-green-600 hover:bg-green-700 text-white font-bold text-xl rounded-xl shadow-lg transition-all"
          >
            {t('next')}
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default NarratorDayPhase;