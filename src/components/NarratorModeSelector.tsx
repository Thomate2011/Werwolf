
import React, { useState } from 'react';
import { Player } from '../types';
import Modal from './Modal';
import { useTranslation } from '../LanguageContext';

interface NarratorModeSelectorProps {
  players: Player[];
  onSelectMode: (mode: 'narrator' | 'normal') => void;
  onBack: () => void;
}

const NarratorModeSelector: React.FC<NarratorModeSelectorProps> = ({
  players,
  onSelectMode,
  onBack,
}) => {
  const { t } = useTranslation();
  const [showError, setShowError] = useState(false);

  // Prüfe ob mindestens ein Bösewicht vorhanden ist
  const hasBadGuys = players.some(
    (p) =>
      p.role.id === 'werwolf' ||
      p.role.id === 'der_grosse_boese_werwolf' ||
      p.role.id === 'der_weisse_werwolf'
  );

  const handleNarratorMode = () => {
    if (!hasBadGuys) {
      setShowError(true);
      return;
    }
    onSelectMode('narrator');
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-[#333]">
      <h1 className="text-2xl font-bold mb-6 text-center">{t('narrator_mode_title')}</h1>
      
      <p className="text-center mb-8 text-gray-600">
        {t('narrator_mode_description')}
      </p>

      <div className="space-y-4">
        <button
          onClick={handleNarratorMode}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition"
        >
          {t('with_narrator')}
        </button>
        
        <button
          onClick={() => onSelectMode('normal')}
          className="w-full bg-gray-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-700 transition"
        >
          {t('without_narrator')}
        </button>

        <button
          onClick={onBack}
          className="w-full bg-red-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-700 transition"
        >
          {t('back')}
        </button>
      </div>

      {showError && (
        <Modal
          title={t('narrator_mode_error_title')}
          onClose={() => setShowError(false)}
          isOpaque={true}
        >
          <p className="text-center mb-4">
            {t('narrator_mode_error_message')}
          </p>
          <button
            onClick={() => {
              setShowError(false);
              onBack();
            }}
            className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition"
          >
            {t('to_role_selection')}
          </button>
        </Modal>
      )}
    </div>
  );
};

export default NarratorModeSelector;