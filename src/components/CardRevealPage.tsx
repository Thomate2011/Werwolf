import React, { useState } from 'react';
import { Player } from '../types';
import Modal from './Modal';
import { useTranslation } from '../LanguageContext';
import LanguageSelector from './LanguageSelector';

interface CardRevealPageProps {
  players: Player[];
  onComplete: () => void;
}

const CardRevealPage: React.FC<CardRevealPageProps> = ({ players, onComplete }) => {
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const { t } = useTranslation();
  
  const isLastPlayer = currentPlayerIndex === players.length - 1;
  const currentPlayer = players[currentPlayerIndex];

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
    setShowCompletionModal(true);
  };

  const handleProceedToOverview = () => {
    setShowCompletionModal(false);
    onComplete();
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-[#333] relative">
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>
      
      <h1 className="text-2xl font-bold mb-6 text-center">{t('card_reveal_title')}</h1>

      <div className="w-full border-2 border-dashed border-blue-400 rounded-lg p-6 flex flex-col justify-center items-center text-center">
        {!showDescription && <p className="text-xl font-semibold mb-4">{currentPlayer.name}</p>}
        
        {!isRevealed ? (
          <button onClick={handleReveal} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition">
            {t('reveal_role')}
          </button>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-green-700 mb-2">{currentPlayer.role.name}</h2>
            {showDescription && <p className="text-gray-600 mb-4">{currentPlayer.role.description}</p>}
            
            <div className="flex space-x-4 mt-4">
              {!showDescription && (
                <button onClick={() => setShowDescription(true)} className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition">
                  {t('explanation')}
                </button>
              )}
              {!isLastPlayer ? (
                 <button onClick={handleNext} className="bg-[#2e7d32] text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition">
                    {t('next_player')}
                 </button>
              ) : (
                 <button onClick={handleShowOverview} className="bg-[#2e7d32] text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition">
                    {t('overview')}
                 </button>
              )}
            </div>
          </>
        )}
      </div>
      
      {showCompletionModal && (
        <Modal title={t('all_roles_revealed')} onClose={() => setShowCompletionModal(false)} isOpaque={true}>
          <p className="text-center">{t('give_to_narrator')}</p>
          <button 
            onClick={handleProceedToOverview} 
            className="mt-6 w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition"
          >
            {t('to_overview')}
          </button>
        </Modal>
      )}

    </div>
  );
};

export default CardRevealPage;