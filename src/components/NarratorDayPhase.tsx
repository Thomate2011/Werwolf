// src/components/NarratorDayPhase.tsx - KOMPLETT mit Jäger, Sündenbock, etc.

import React, { useState } from 'react';
import { Player } from '../types';
import { useTranslation } from '../LanguageContext';
import { gameStateManager } from '../services/GameStateManager';

interface NarratorDayPhaseProps {
  players: Player[];
  nightDeaths: string[];
  hunterDeaths: string[];
  onDayComplete: (updatedPlayers: Player[]) => void;
  onGameEnd: (winner: string) => void;
}

type DayPhase = 'show_deaths' | 'maid_action' | 'hunter_action' | 'discussion' | 'voting' | 'second_voting' | 'show_day_deaths' | 'check_win';

const NarratorDayPhase: React.FC<NarratorDayPhaseProps> = ({
  players,
  nightDeaths,
  hunterDeaths,
  onDayComplete,
  onGameEnd,
}) => {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<DayPhase>('show_deaths');
  const [dayPlayers, setDayPlayers] = useState<Player[]>(players);
  const [dayDeaths, setDayDeaths] = useState<string[]>([]);
  const [currentHunterIndex, setCurrentHunterIndex] = useState(0);
  const [votedOutPlayer, setVotedOutPlayer] = useState<string | null>(null);

  // ============ TOD-ANZEIGE ============
  const handleShowDeaths = () => {
    // Prüfe ob Ergebene Magd existiert und lebt
    const maid = dayPlayers.find(p => 
      p.originalRole.id === 'ergebene_magd' && 
      p.status === 'alive'
    );

    if (maid && nightDeaths.length > 0) {
      setPhase('maid_action');
    } else if (hunterDeaths.length > 0) {
      setPhase('hunter_action');
    } else {
      setPhase('discussion');
    }
  };

  // ============ ERGEBENE MAGD ============
  const handleMaidAction = (takeOver: boolean, deadPlayerName?: string) => {
    if (takeOver && deadPlayerName) {
      const maid = dayPlayers.find(p => p.originalRole.id === 'ergebene_magd');
      const deadPlayer = dayPlayers.find(p => p.name === deadPlayerName);
      
      if (maid && deadPlayer) {
        const newPlayers = dayPlayers.map(p => {
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
      setPhase('discussion');
    }
  };

  // ============ JÄGER-SCHUSS ============
  const handleHunterShoot = (targetName: string) => {
    const newDeaths = [...dayDeaths, targetName];
    setDayDeaths(newDeaths);

    const newPlayers = dayPlayers.map(p =>
      p.name === targetName ? { ...p, status: 'dead' as const } : p
    );
    setDayPlayers(newPlayers);

    // Prüfe ob weiterer Jäger gestorben ist
    const targetPlayer = newPlayers.find(p => p.name === targetName);
    const isAnotherHunter = targetPlayer?.originalRole.id === 'jaeger';

    if (isAnotherHunter) {
      // Nächster Jäger
      setCurrentHunterIndex(prev => prev + 1);
    } else if (currentHunterIndex < hunterDeaths.length - 1) {
      // Noch mehr Jäger aus der Nacht
      setCurrentHunterIndex(prev => prev + 1);
    } else {
      setPhase('discussion');
    }
  };

  // ============ ABSTIMMUNG ============
  const handleVoting = (selectedName: string) => {
    setVotedOutPlayer(selectedName);

    const votedPlayer = dayPlayers.find(p => p.name === selectedName);
    if (!votedPlayer) return;

    // Dorfdepp darf nicht sterben
    if (votedPlayer.originalRole.id === 'dorfdepp') {
      // Dorfdepp verliert Stimmrecht aber stirbt nicht
      setPhase('show_day_deaths');
      return;
    }

    // Engel gewinnt wenn in Runde 1 abgestimmt
    if (votedPlayer.originalRole.id === 'der_engel') {
      onGameEnd('angel');
      return;
    }

    // Sündenbock bei Gleichstand
    const scapegoat = dayPlayers.find(p => 
      p.originalRole.id === 'suendenbock' && 
      p.status === 'alive'
    );
    
    // Für Demo: Annahme es gibt Gleichstand wenn Sündenbock da ist
    // In echter Implementierung: Zähle Stimmen
    
    // Richter Codewort prüfen (vereinfacht)
    const judge = dayPlayers.find(p => 
      p.originalRole.id === 'der_stotternde_richter' &&
      p.status === 'alive'
    );

    // Normale Abstimmung
    const newDeaths = [...dayDeaths, selectedName];
    setDayDeaths(newDeaths);

    const newPlayers = dayPlayers.map(p =>
      p.name === selectedName ? { ...p, status: 'dead' as const } : p
    );
    setDayPlayers(newPlayers);

    // Prüfe ob Jäger
    if (votedPlayer.originalRole.id === 'jaeger') {
      setPhase('hunter_action');
      setCurrentHunterIndex(0);
    } else {
      setPhase('show_day_deaths');
    }
  };

  // ============ TAG-TOTE ANZEIGEN ============
  const handleShowDayDeaths = () => {
    setPhase('check_win');
  };

  // ============ GEWINN-PRÜFUNG ============
  const checkWinCondition = () => {
    const alivePlayers = dayPlayers.filter(p => p.status === 'alive');
    
    // Flötenspieler Sieg
    const piper = dayPlayers.find(p => p.originalRole.id === 'floetenspieler');
    const allEnchanted = alivePlayers.every(p => 
      gameStateManager.isPiperEnchanted(p.name)
    );
    if (piper && piper.status === 'alive' && allEnchanted) {
      onGameEnd('piper');
      return;
    }

    // Verbitterter Greis
    if (gameStateManager.checkBitterOldManWin(dayPlayers.filter(p => p.status === 'dead'))) {
      onGameEnd('bitter_old_man');
      return;
    }

    // Verliebte
    const lovers = gameStateManager.getLovers();
    if (lovers.length === 2) {
      const lover1Alive = alivePlayers.find(p => p.name === lovers[0]);
      const lover2Alive = alivePlayers.find(p => p.name === lovers[1]);
      if (lover1Alive && lover2Alive && alivePlayers.length === 2) {
        onGameEnd('lovers');
        return;
      }
    }

    // Werwölfe vs Dorfbewohner
    const werewolfRoles = ['werwolf', 'der_grosse_boese_werwolf', 'der_weisse_werwolf', 'urwolf'];
    const aliveWerewolves = alivePlayers.filter(p => werewolfRoles.includes(p.role.id));
    const aliveVillagers = alivePlayers.filter(p => !werewolfRoles.includes(p.role.id));

    // Weißer Werwolf alleine
    const whiteWolf = alivePlayers.find(p => p.role.id === 'der_weisse_werwolf');
    if (whiteWolf && alivePlayers.length === 1) {
      onGameEnd('white_wolf');
      return;
    }

    if (aliveWerewolves.length === 0) {
      onGameEnd('villagers');
    } else if (aliveVillagers.length === 0) {
      onGameEnd('werewolves');
    } else {
      // Nächste Runde
      onDayComplete(dayPlayers);
    }
  };

  // ============ RENDER ============

  if (phase === 'show_deaths') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-orange-900 via-red-900 to-pink-900">
        <div className="w-full max-w-3xl bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-12 text-white">
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
            🗳️ {t('narrator_day_voting')}
          </h1>
          <p className="text-xl text-center mb-8 text-white/80">
            Wählt gemeinsam eine Person aus
          </p>

          <div className="grid grid-cols-2 gap-4">
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
                  {name === votedOutPlayer && (
                    <p className="text-sm text-white/60 mt-2">Durch Abstimmung</p>
                  )}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={checkWinCondition}
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