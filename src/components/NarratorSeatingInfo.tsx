import React, { useState } from 'react';
import { Player, Role } from '../types';
import { useTranslation } from '../LanguageContext';
import { ROLES_CONFIG } from '../constants';

interface NarratorSeatingInfoProps {
  players: Player[];
  onComplete: () => void;
}

const NarratorSeatingInfo: React.FC<NarratorSeatingInfoProps> = ({ players, onComplete }) => {
  const { t } = useTranslation();
  const [showInfo, setShowInfo] = useState(true);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [showDescription, setShowDescription] = useState(false);

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

  const currentRoleInfo = currentPlayer ? getRoleInfo(currentPlayer.role.id) : null;

  const handleInfoContinue = () => {
    setShowInfo(false);
  };

  const handleReveal = () => {
    setIsRevealed(true);
  };

  const handleNext = () => {
    if (!isLastPlayer) {
      setCurrentPlayerIndex(prev => prev + 1);
      setIsRevealed(false);
      setShowDescription(false);
    } else {
      // Letzter Spieler -> Spiel starten
      onComplete();
    }
  };

  if (showInfo) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="w-full max-w-2xl bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-12 text-white">
          <h1 className="text-4xl font-bold text-center mb-8">{t('narrator_seating_info_title')}</h1>
          <p className="text-center mb-8 text-xl text-white/80">
            {t('narrator_seating_info_message')}
          </p>
          <button
            onClick={handleInfoContinue}
            className="w-full bg-blue-600 text-white font-bold py-4 px-6 rounded-xl hover:bg-blue-700 transition text-lg shadow-lg"
          >
            {t('continue')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="w-full max-w-2xl bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-12 text-white">
        <h1 className="text-3xl font-bold mb-8 text-center">{t('card_reveal_title')}</h1>

        <div className="w-full border-2 border-blue-400 border-dashed rounded-lg p-8 flex flex-col justify-center items-center text-center min-h-[250px]">
          
          <p className="text-2xl font-semibold mb-6">{currentPlayer.name}</p>

          {!isRevealed ? (
            <button 
              onClick={handleReveal} 
              className="bg-blue-600 text-white font-bold py-4 px-10 rounded-xl hover:bg-blue-700 transition text-xl shadow-lg"
            >
              {t('reveal_role')}
            </button>
          ) : (
            <div className="w-full">
              <h2 className="text-4xl font-bold text-green-400 mb-6">{currentRoleInfo?.name}</h2>

              {showDescription && (
                <p className="text-base text-white/80 mb-6 px-4">{currentRoleInfo?.description}</p>
              )}

              <div className="flex gap-4 mt-4">
                {!showDescription && (
                  <button 
                    onClick={() => setShowDescription(true)} 
                    className="bg-blue-500 text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-600 transition flex-1 text-lg"
                  >
                    {t('explanation')}
                  </button>
                )}
                <button 
                  onClick={handleNext} 
                  className="bg-green-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-green-700 transition flex-1 text-lg shadow-lg"
                >
                  {isLastPlayer ? t('continue') : t('next_player')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NarratorSeatingInfo;