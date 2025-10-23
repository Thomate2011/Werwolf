import React, { useState } from 'react';
import { Player } from '../types';
import { useTranslation } from '../LanguageContext';
import LanguageSelector from './LanguageSelector';
import { ROLES_CONFIG } from '../constants';

interface CardRevealPageProps {
  players: Player[];
  onComplete: () => void;
  narratorMode: boolean;
}

const CardRevealPage: React.FC<CardRevealPageProps> = ({ 
  players, 
  onComplete,
  narratorMode
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
    }
  };
  
  const handleShowOverview = () => {
    if (narratorMode) {
      // Erzähler-Modus: Direkt weiter ohne Modal
      onComplete();
    } else {
      // Normal-Modus: Zur Übersicht
      onComplete();
    }
  };

  return (
    <div className="w-full max-w-[90%] mx-auto bg-white rounded-xl shadow-lg p-8 text-[#333]">
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>
      
      <h1 className="text-2xl font-bold mb-6 text-center">{t('card_reveal_title')}</h1>

      {/* Spielerkästchen - kompakt wie Image 2 */}
      <div className="w-full border-2 border-blue-400 border-dashed rounded-lg p-6 flex flex-col justify-center items-center text-center min-h-[200px]">
        
        {/* Spielername (oben) */}
        <p className="text-lg font-semibold mb-4">{currentPlayer.name}</p>

        {/* Hauptbereich - je nach Status */}
        {!isRevealed ? (
          <button 
            onClick={handleReveal} 
            className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition text-lg"
          >
            {t('reveal_role')}
          </button>
        ) : (
          <div className="w-full">
            {/* Rolle - große, fette Schrift */}
            <h2 className="text-3xl font-bold text-green-700 mb-4">{currentRoleInfo.name}</h2>

            {/* Erklärung - nur wenn sichtbar */}
            {showDescription && (
              <p className="text-sm text-gray-600 mb-4 px-2">{currentRoleInfo.description}</p>
            )}

            {/* Buttons - NEBENEINANDER */}
            <div className="flex gap-3 mt-2">
              {!showDescription && (
                <button 
                  onClick={() => setShowDescription(true)} 
                  className="bg-blue-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-600 transition flex-1"
                >
                  {t('explanation')}
                </button>
              )}
              {!isLastPlayer ? (
                <button 
                  onClick={handleNext} 
                  className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 transition flex-1"
                >
                  {t('next_player')}
                </button>
              ) : (
                <button 
                  onClick={handleShowOverview} 
                  className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 transition flex-1"
                >
                  {narratorMode ? t('to_game') : t('overview')}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CardRevealPage;