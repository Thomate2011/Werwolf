// src/components/NarratorGame.tsx - MIT PROPS

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

type GamePhase = 'seating_and_cards' | 'intro' | 'night' | 'day' | 'end';

const NarratorGame: React.FC<NarratorGameProps> = ({
  players,
  onGameEnd,
  onNavigate,
  onGoToRoleSelection,
  thiefExtraRoles,
  jesterExtraRoles,
}) => {
  const [gamePhase, setGamePhase] = useState<GamePhase>('seating_and_cards');
  const [currentRound, setCurrentRound] = useState(1);
  const [currentDay, setCurrentDay] = useState(1);
  const [gamePlayers, setGamePlayers] = useState<Player[]>(players);
  const [nightDeaths, setNightDeaths] = useState<string[]>([]);
  const [hunterDeaths, setHunterDeaths] = useState<string[]>([]);

  const handleSeatingAndCardsComplete = () => {
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
    setCurrentRound(prev => prev + 1);
    setCurrentDay(prev => prev + 1);
    setGamePhase('night');
  };

  if (gamePhase === 'seating_and_cards') {
    return (
      <NarratorSeatingInfo
        players={gamePlayers}
        onComplete={handleSeatingAndCardsComplete}
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
        onRestart={onGoToRoleSelection}
        onGoHome={onNavigate}
      />
    );
  }

  if (gamePhase === 'day') {
    return (
      <NarratorDayPhase
        players={gamePlayers}
        nightDeaths={nightDeaths}
        hunterDeaths={hunterDeaths}
        currentDay={currentDay}
        onDayComplete={handleDayComplete}
        onGameEnd={onGameEnd}
        onRestart={onGoToRoleSelection}
        onGoHome={onNavigate}
      />
    );
  }

  return null;
};

export default NarratorGame;