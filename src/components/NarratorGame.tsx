// src/components/NarratorGame.tsx - KORRIGIERT MIT ALLEN PHASEN

import React, { useState, useCallback } from 'react';
import { Player, Role } from '../types';
import { useTranslation } from '../LanguageContext';
import CardRevealPage from './CardRevealPage';
import NarratorSeatingInfo from './NarratorSeatingInfo';
import NarratorGameStart from './NarratorGameStart';
import NarratorNightFlow from './NarratorNightFlow';
import NarratorDayPhase from './NarratorDayPhase';
import LanguageSelector from './LanguageSelector';

type GamePhase = 'seating_info' | 'card_reveal' | 'game_start' | 'night' | 'day' | 'game_over';

interface NarratorGameProps {
  players: Player[];
  onGameEnd: (winner: string) => void;
  onNavigate: (page: 'home') => void;
  onGoToRoleSelection: () => void;
  thiefExtraRoles: Role[];
  jesterExtraRoles: Role[];
}

const NarratorGame: React.FC<NarratorGameProps> = ({
  players: initialPlayers,
  onGameEnd,
  onNavigate,
  onGoToRoleSelection,
  thiefExtraRoles,
  jesterExtraRoles,
}) => {
  const { t } = useTranslation();

  const [currentPhase, setCurrentPhase] = useState<GamePhase>('seating_info');
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [currentRound, setCurrentRound] = useState(1);
  const [nightDeaths, setNightDeaths] = useState<string[]>([]);
  const [hunterDeaths, setHunterDeaths] = useState<string[]>([]);

  const handleNightComplete = useCallback((updatedPlayers: Player[], deaths: string[], hunters: string[]) => {
    setPlayers(updatedPlayers);
    setNightDeaths(deaths);
    setHunterDeaths(hunters);
    setCurrentPhase('day');
  }, []);

  const handleDayComplete = useCallback((updatedPlayers: Player[]) => {
    setPlayers(updatedPlayers);
    setCurrentRound(prev => prev + 1);
    setCurrentPhase('night');
  }, []);

  // Seating Info - Modal VOR Karten
  if (currentPhase === 'seating_info') {
    return (
      <div className="relative">
        <div className="absolute top-4 right-4 z-50">
          <LanguageSelector />
        </div>
        <NarratorSeatingInfo onConfirm={() => setCurrentPhase('card_reveal')} />
      </div>
    );
  }

  // Card Reveal - Karten verteilen
  if (currentPhase === 'card_reveal') {
    return (
      <div className="relative">
        <div className="absolute top-4 right-4 z-50">
          <LanguageSelector />
        </div>
        <CardRevealPage
          players={players}
          onComplete={() => setCurrentPhase('game_start')}
          narratorMode={true}
        />
      </div>
    );
  }

  // Game Start - Modal NACH Karten
  if (currentPhase === 'game_start') {
    return (
      <div className="relative">
        <div className="absolute top-4 right-4 z-50">
          <LanguageSelector />
        </div>
        <NarratorGameStart onStart={() => setCurrentPhase('night')} />
      </div>
    );
  }

  // Night Phase
  if (currentPhase === 'night') {
    return (
      <NarratorNightFlow
        players={players}
        currentRound={currentRound}
        onNightComplete={handleNightComplete}
        onNavigateHome={onNavigate}
        onRestart={onGoToRoleSelection}
        thiefExtraRoles={thiefExtraRoles}
        jesterExtraRoles={jesterExtraRoles}
      />
    );
  }

  // Day Phase
  if (currentPhase === 'day') {
    return (
      <NarratorDayPhase
        players={players}
        nightDeaths={nightDeaths}
        hunterDeaths={hunterDeaths}
        currentRound={currentRound}
        onContinueToNextNight={handleDayComplete}
        onGameEnd={(winner) => {
          onGameEnd(winner);
        }}
        onNavigateHome={onNavigate}
        onRestart={onGoToRoleSelection}
      />
    );
  }

  return null;
};

export default NarratorGame;