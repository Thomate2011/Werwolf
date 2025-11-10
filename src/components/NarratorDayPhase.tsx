// src/components/NarratorDayPhase.tsx - MOBILE-OPTIMIERT & VOLLSTÄNDIG

import React, { useState, useEffect } from 'react';
import { Player } from '../types';
import { useTranslation } from '../LanguageContext';
import { gameStateManager } from '../services/GameStateManager';
import { audioManager } from '../services/AudioManager';
import LanguageSelector from './LanguageSelector';
import Modal from './Modal';

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
  const [showPauseModal, setShowPauseModal] = useState(false);

  useEffect(() => {
    const shouldGrowl = gameStateManager.checkBearAlert(dayPlayers);
    setBearGrowled(shouldGrowl);
  }, []);

  const handlePauseClick = () => {
    audioManager.stopAudio();
    setShowPauseModal(true);
  };

  const handlePauseContinue = () => {
    setShowPauseModal(false);
    if (phase === 'judge_close_eyes' || phase === 'judge_audio' || phase === 'judge_eyes_close' || phase === 'judge_eyes_open') {
      const tempPhase = phase;
      setPhase('show_deaths');
      setTimeout(() => {
        setPhase(tempPhase);
      }, 100);
    }
  };

  const handlePauseRestart = () => {
    audioManager.stopAudio();
    onRestart();
  };

  const handlePauseHome = () => {
    audioManager.stopAudio();
    onGoHome();
  };

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

  const handleShowDayDeaths = () => {
    const winnerCheck = checkWinCondition(dayPlayers);
    if (winnerCheck) {
      setWinner(winnerCheck);
      setPhase('win_screen');
    } else {
      onDayComplete(dayPlayers);
    }
  };

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
        <div className="w-full max-w-lg bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl p-8 text-white relative">
          
          <div className="absolute top-4 left-4">
            <button
              onClick={handlePauseClick}
              className="p-2 hover:bg-white/20 rounded-full transition"
              title={t('pause_button')}
            >
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1"/>
                <rect x="14" y="4" width="4" height="16" rx="1"/>
              </svg>
            </button>
          </div>

          <div className="absolute top-4 right-4">
            <LanguageSelector />
          </div>

          <div className="text-center space-y-6 mt-8">
            <div className="text-6xl">{t('win_screen_emoji')}</div>
            <h1 className="text-3xl font-bold">{getWinnerText()}</h1>
            
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="text-center">
                <button
                  onClick={onRestart}
                  className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-lg shadow-lg transition transform hover:scale-105"
                >
                  {t('restart')}
                </button>
                <p className="text-xs text-white/70 mt-2">{t('win_screen_restart_info')}</p>
              </div>
              
              <div className="text-center">
                <button
                  onClick={onGoHome}
                  className="w-full py-4 px-6 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-lg shadow-lg transition transform hover:scale-105"
                >
                  {t('to_homepage')}
                </button>
                <p className="text-xs text-white/70 mt-2">{t('win_screen_home_info')}</p>
              </div>
            </div>
          </div>
        </div>

        {showPauseModal && (
          <Modal title={t('pause_modal_title')} onClose={() => setShowPauseModal(false)} isOpaque={true}>
            <div className="space-y-4">
              <button
                onClick={handlePauseContinue}
                className="w-full py-3 px-6 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition"
              >
                {t('pause_continue')}
              </button>
              <button
                onClick={handlePauseRestart}
                className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition"
              >
                {t('pause_restart')}
              </button>
              <button
                onClick={handlePauseHome}
                className="w-full py-3 px-6 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition"
              >
                {t('pause_home')}
              </button>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-orange-900 via-red-900 to-pink-900">
      <div className="w-full max-w-lg bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl p-8 text-white relative">
        
        <div className="absolute top-4 left-4">
          <button
            onClick={handlePauseClick}
            className="p-2 hover:bg-white/20 rounded-full transition"
            title={t('pause_button')}
          >
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1"/>
              <rect x="14" y="4" width="4" height="16" rx="1"/>
            </svg>
          </button>
        </div>

        <div className="absolute top-4 right-4">
          <LanguageSelector />
        </div>

        {phase === 'show_deaths' && (
          <div className="mt-8">
            {bearGrowled && (
              <div className="mb-4 text-center">
                <div className="text-4xl mb-3">🐻💢</div>
                <p className="text-xl font-bold text-yellow-400">{t('day_bear_growl')}</p>
              </div>
            )}
            
            <h1 className="text-2xl font-bold text-center mb-6">
              🌅 {t('day_deaths_title')}
            </h1>

            {nightDeaths.length === 0 ? (
              <div className="text-center space-y-4">
                <p className="text-2xl">🌙✨</p>
                <p className="text-lg text-white/80">{t('day_no_deaths')}</p>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {nightDeaths.map((name) => (
                  <div
                    key={name}
                    className="bg-red-600/30 border-2 border-red-500 rounded-lg p-4 text-center transform hover:scale-105 transition"
                  >
                    <p className="text-2xl font-bold">💀 {name}</p>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleShowDeaths}
              className="w-full py-3 px-6 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-lg shadow-lg transition-all"
            >
              {t('next')}
            </button>
          </div>
        )}

        {phase === 'maid_action' && (
          <div className="mt-8">
            <h1 className="text-2xl font-bold text-center mb-6">
              👩🏼 {t('day_maid_choice_title')}
            </h1>
            <p className="text-base text-center mb-6 text-white/80">
              {t('day_maid_choice_desc')}
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {nightDeaths.map((deadName) => (
                <button
                  key={deadName}
                  onClick={() => handleMaidAction(true, deadName)}
                  className="py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition"
                >
                  {deadName}
                </button>
              ))}
            </div>

            <button
              onClick={() => handleMaidAction(false)}
              className="w-full py-2 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition"
            >
              {t('day_maid_nothing')}
            </button>
          </div>
        )}

        {phase === 'hunter_action' && (
          <div className="mt-8">
            <h1 className="text-2xl font-bold text-center mb-6">
              🏹 {t('day_hunter_shoots_title')}
            </h1>
            <div className="bg-red-600/30 border-2 border-red-500 rounded-lg p-4 text-center mb-6">
              <p className="text-2xl font-bold">{hunterDeaths[currentHunterIndex]}</p>
            </div>
            <p className="text-base text-center mb-6 text-white/80">
              {t('day_hunter_choose_target')}
            </p>

            <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto">
              {dayPlayers
                .filter(p => p.status === 'alive')
                .map((player) => (
                  <button
                    key={player.name}
                    onClick={() => handleHunterShoot(player.name)}
                    className="py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition transform hover:scale-105"
                  >
                    {player.name}
                  </button>
                ))}
            </div>
          </div>
        )}

        {phase === 'discussion' && (
          <div className="mt-8">
            <h1 className="text-2xl font-bold text-center mb-6">
              💬 {t('day_discussion_title')}
            </h1>
            <p className="text-base text-center mb-6 text-white/80">
              {t('day_discussion_desc')}
            </p>
            <div className="text-center text-4xl mb-6">🗣️</div>
            <button
              onClick={() => setPhase('voting')}
              className="w-full py-3 px-6 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-lg shadow-lg transition-all"
            >
              {t('day_voting_title')}
            </button>
          </div>
        )}

        {phase === 'voting' && (
          <div className="mt-8">
            <h1 className="text-2xl font-bold text-center mb-6">
              🗳️ {t('day_voting_title')}
            </h1>
            <p className="text-base text-center mb-6 text-white/80">
              {t('day_voting_desc')}
            </p>

            <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto mb-4">
              {dayPlayers
                .filter(p => p.status === 'alive')
                .map((player) => (
                  <button
                    key={player.name}
                    onClick={() => handleVoting(player.name)}
                    className="py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg transition transform hover:scale-105"
                  >
                    {player.name}
                  </button>
                ))}
            </div>

            {scapegoatAlive && (
              <button
                onClick={handleScapegoatDeath}
                className="w-full py-3 px-6 bg-yellow-600 hover:bg-yellow-700 text-white font-bold text-lg rounded-lg shadow-lg transition-all"
              >
                🐐 {t('day_voting_scapegoat')}
              </button>
            )}
          </div>
        )}

        {(phase === 'judge_close_eyes' || phase === 'judge_audio') && (
          <div className="text-center space-y-6 mt-12">
            <div className="text-4xl animate-pulse">🎙️</div>
            <div className="flex justify-center gap-2">
              <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}

        {phase === 'judge_decision' && (
          <div className="mt-8">
            <h1 className="text-2xl font-bold text-center mb-6">
              ⚖️ {t('day_judge_decision_title')}
            </h1>
            <p className="text-lg text-center mb-8 text-white/90">
              {t('day_judge_decision_desc')}
            </p>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleJudgeDecision(true)}
                className="py-6 px-4 bg-green-600 hover:bg-green-700 text-white font-bold text-xl rounded-lg transition transform hover:scale-105"
              >
                ✅ {t('day_judge_yes')}
              </button>
              <button
                onClick={() => handleJudgeDecision(false)}
                className="py-6 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xl rounded-lg transition transform hover:scale-105"
              >
                ❌ {t('day_judge_no')}
              </button>
            </div>
          </div>
        )}

        {(phase === 'judge_eyes_close' || phase === 'judge_eyes_open') && (
          <div className="text-center space-y-6 mt-12">
            <div className="text-4xl animate-pulse">🎙️</div>
            <div className="flex justify-center gap-2">
              <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}

        {phase === 'judge_announcement' && (
          <div className="mt-8">
            <h1 className="text-2xl font-bold text-center mb-6">
              ⚖️ {t('day_judge_decision_title')}
            </h1>
            <div className="bg-blue-600/30 border-2 border-blue-500 rounded-lg p-6 text-center mb-6">
              {judgeWantsSecondVote ? (
                <>
                  <div className="text-4xl mb-3">✅</div>
                  <p className="text-xl font-bold">{t('day_judge_second_vote_yes')}</p>
                </>
              ) : (
                <>
                  <div className="text-4xl mb-3">❌</div>
                  <p className="text-xl font-bold">{t('day_judge_second_vote_no')}</p>
                </>
              )}
            </div>
            <button
              onClick={handleJudgeAnnouncement}
              className="w-full py-3 px-6 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-lg shadow-lg transition-all"
            >
              {t('next')}
            </button>
          </div>
        )}

        {phase === 'second_voting' && (
          <div className="mt-8">
            <h1 className="text-2xl font-bold text-center mb-6">
              🗳️ {t('day_second_voting_title')}
            </h1>
            <p className="text-base text-center mb-6 text-white/80">
              {t('day_second_voting_desc')}
            </p>

            <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto mb-4">
              {dayPlayers
                .filter(p => p.status === 'alive')
                .map((player) => (
                  <button
                    key={player.name}
                    onClick={() => handleSecondVoting(player.name)}
                    className="py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg transition transform hover:scale-105"
                  >
                    {player.name}
                  </button>
                ))}
            </div>

            {scapegoatAlive && (
              <button
                onClick={handleScapegoatDeath}
                className="w-full py-3 px-6 bg-yellow-600 hover:bg-yellow-700 text-white font-bold text-lg rounded-lg shadow-lg transition-all"
              >
                🐐 {t('day_voting_scapegoat')}
              </button>
            )}
          </div>
        )}

        {phase === 'show_day_deaths' && (
          <div className="mt-8">
            <h1 className="text-2xl font-bold text-center mb-6">
              ⚰️ {t('day_deaths_of_day_title')}
            </h1>

            {dayDeaths.length === 0 ? (
              <div className="text-center space-y-4">
                <p className="text-2xl">✨</p>
                <p className="text-lg text-white/80">{t('day_deaths_of_day_none')}</p>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {dayDeaths.map((name) => (
                  <div
                    key={name}
                    className="bg-red-600/30 border-2 border-red-500 rounded-lg p-4 text-center transform hover:scale-105 transition"
                  >
                    <p className="text-2xl font-bold">💀 {name}</p>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleShowDayDeaths}
              className="w-full py-3 px-6 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-lg shadow-lg transition-all"
            >
              {t('next')}
            </button>
          </div>
        )}
      </div>

      {showPauseModal && (
        <Modal title={t('pause_modal_title')} onClose={() => setShowPauseModal(false)} isOpaque={true}>
          <div className="space-y-4">
            <button
              onClick={handlePauseContinue}
              className="w-full py-3 px-6 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition"
            >
              {t('pause_continue')}
            </button>
            <button
              onClick={handlePauseRestart}
              className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition"
            >
              {t('pause_restart')}
            </button>
            <button
              onClick={handlePauseHome}
              className="w-full py-3 px-6 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition"
            >
              {t('pause_home')}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default NarratorDayPhase;