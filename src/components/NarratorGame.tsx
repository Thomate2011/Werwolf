// src/components/NarratorGame.tsx - KORRIGIERT

import React, { useState } from 'react';
import { Player, Role } from '../types';
import NarratorSeatingInfo from './NarratorSeatingInfo';
import NarratorGameStart from './NarratorGameStart';
import NarratorNightFlow from './NarratorNightFlow';
import NarratorDayPhase from './NarratorDayPhase';

interface NarratorGameProps {
  players: Player[];
  onGameEnd: (winner: string) => void;
  onNavigate: () => void;
  onGoToRoleSelection: () => void;
  thiefExtraRoles: Role[];
  jesterExtraRoles: Role[];
}

type GamePhase = 'seating' | 'intro' | 'night' | 'day' | 'end';

const NarratorGame: React.FC<NarratorGameProps> = ({
  players,
  onGameEnd,
  onNavigate,
  onGoToRoleSelection,
  thiefExtraRoles,
  jesterExtraRoles,
}) => {
  const [gamePhase, setGamePhase] = useState<GamePhase>('seating');
  const [currentRound, setCurrentRound] = useState(1);
  const [gamePlayers, setGamePlayers] = useState<Player[]>(players);
  const [nightDeaths, setNightDeaths] = useState<string[]>([]);
  const [hunterDeaths, setHunterDeaths] = useState<string[]>([]);

  const handleSeatingConfirm = () => {
    setGamePhase('intro');
  };

  const handleIntroComplete = () => {
    setGamePhase('night');
  };

  const handleNightComplete = (deadPlayers: string[], updatedPlayers: Player[], hunters: string[]) => {
    setNightDeaths(deadPlayers);
    setHunterDeaths(hunters);
    setGamePlayers(updatedPlayers);
    setGamePhase('day');
  };

  const handleDayComplete = (updatedPlayers: Player[]) => {
    setGamePlayers(updatedPlayers);
    
    // Prüfe Gewinn-Bedingung
    const alivePlayers = updatedPlayers.filter((p) => p.status === 'alive');
    const aliveWerewolves = alivePlayers.filter((p) =>
      ['werwolf', 'der_grosse_boese_werwolf', 'der_weisse_werwolf', 'urwolf'].includes(p.role.id)
    );
    const aliveVillagers = alivePlayers.filter((p) =>
      !['werwolf', 'der_grosse_boese_werwolf', 'der_weisse_werwolf', 'urwolf'].includes(p.role.id)
    );

    if (aliveWerewolves.length === 0) {
      onGameEnd('villagers');
    } else if (aliveVillagers.length === 0) {
      onGameEnd('werewolves');
    } else {
      // Nächste Runde
      setCurrentRound((prev) => prev + 1);
      setGamePhase('night');
    }
  };

  if (gamePhase === 'seating') {
    return (
      <NarratorSeatingInfo
        onConfirm={handleSeatingConfirm}
        onBack={onGoToRoleSelection}
      />
    );
  }

  if (gamePhase === 'intro') {
    return <NarratorGameStart onStart={handleIntroComplete} />;
  }

  if (gamePhase === 'night') {
    return (
      <NarratorNightFlow
        players={gamePlayers}
        currentRound={currentRound}
        thiefExtraRoles={thiefExtraRoles}
        jesterExtraRoles={jesterExtraRoles}
        onNightComplete={handleNightComplete}
      />
    );
  }

  if (gamePhase === 'day') {
    return (
      <NarratorDayPhase
        players={gamePlayers}
        nightDeaths={nightDeaths}
        hunterDeaths={hunterDeaths}
        onDayComplete={handleDayComplete}
        onGameEnd={onGameEnd}
      />
    );
  }

  return null;
};

export default NarratorGame;