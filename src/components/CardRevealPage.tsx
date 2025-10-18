// src/components/CardRevealPage.tsx - Volle Breite, nicht zusammengequetscht

import React, { useState } from 'react';
import { Player } from '../types';
import { useTranslation } from '../LanguageContext';
import { ROLES_CONFIG } from '../constants';
import LanguageSelector from './LanguageSelector';

interface CardRevealPageProps {
  players: Player[];
  onComplete: () => void;
  narratorMode?: boolean;
}

const CardRevealPage: React.FC<CardRevealPageProps> = ({ 
  players, 
  onComplete,
  narratorMode = false
}) => {
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const { t } = useTranslation();
  
  const isLastPlayer = currentPlayerIndex === players.length - 1;
  const currentPlayer = players[currentPlayerIndex];

  const getRoleInfo = (roleId: string) => {
    const roleConfig = ROLES_CONFIG.find(r => r.id === roleId);
    if (!roleConfig) return { name: roleId, description: '' };
    return {
      name: t(roleConfig.nameKey),
      description: t(roleConfig.descriptionKey)
    };
  };

  const currentRoleInfo = getRoleInfo(currentPlayer.role.id);

  const handleReveal = () => {
    setIsRevealed(true);
  };
  
  const handleNext = () => {
    if (!isLastPlayer) {
      setCurrentPlayerIndex(prev => prev + 1);
      setIsRevealed(false);
      setShowDescription(false);
    } else {
      onComplete();
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-white flex items-center justify-center p-4">
      <div className="absolute top-4 right-4 z-50">
        <LanguageSelector />
      </div>

      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-8 text-center">{t('card_reveal_title')}</h1>

        <div className="w-full border-4 border-dashed border-blue-400 rounded-lg p-8 flex flex-col justify-center items-center text-center min-h-96">
          {!showDescription && (
            <p className="text-2xl font-bold mb-6">{currentPlayer.name}</p>
          )}
          
          {!isRevealed ? (
            <button 
              onClick={handleReveal} 
              className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition text-lg"
            >
              {t('reveal_role')}
            </button>
          ) : (
            <>
              <h2 className="text-3xl font-bold text-green-700 mb-4">{currentRoleInfo.name}</h2>
              {showDescription && (
                <p className="text-gray-600 mb-6 max-w-xl text-base leading-relaxed">{currentRoleInfo.description}</p>
              )}
              
              <div className="flex flex-wrap justify-center gap-3 mt-6">
                {!showDescription && (
                  <button 
                    onClick={() => setShowDescription(true)} 
                    className="bg-blue-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-600 transition"
                  >
                    {t('explanation')}
                  </button>
                )}
                <button 
                  onClick={handleNext} 
                  className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition"
                >
                  {isLastPlayer ? t('continue') : t('next')}
                </button>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          Spieler {currentPlayerIndex + 1} / {players.length}
        </div>
      </div>
    </div>
  );
};

export default CardRevealPage;