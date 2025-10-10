import React, { useState } from 'react';
import { useTranslation } from '../LanguageContext';
import LanguageSelector from './LanguageSelector';

interface PlayerEntryPageProps {
  onNext: (players: string[]) => void;
  initialPlayerNames: string[];
}

const PlayerEntryPage: React.FC<PlayerEntryPageProps> = ({ onNext, initialPlayerNames }) => {
  const [playerNames, setPlayerNames] = useState(initialPlayerNames.join('\n'));
  const [errors, setErrors] = useState<string[]>([]);
  const { t } = useTranslation();

  const handleNext = () => {
    const names = playerNames.split('\n').map(name => name.trim()).filter(name => name.length > 0);
    const uniqueNames = new Set(names);
    const currentErrors: string[] = [];

    if (names.length !== uniqueNames.size) {
      currentErrors.push(t('player_entry_error_duplicate'));
    }
    
    if (names.length < 4) {
       currentErrors.push(t('player_entry_error_min_players'));
    }
    
    setErrors(currentErrors);

    if (currentErrors.length === 0) {
      onNext(names);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-[#333] relative">
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>
      
      <h1 className="text-2xl font-bold mb-2">{t('player_entry_title')}</h1>
      <p className="mb-4 text-sm text-gray-600">
        {t('player_entry_desc')}
        <br/>
        <span className="font-semibold">{t('player_entry_rules')}</span> {t('player_entry_rule_1')} {t('player_entry_rule_2')}
      </p>
      <textarea
        value={playerNames}
        onChange={(e) => setPlayerNames(e.target.value)}
        placeholder={t('player_entry_placeholder')}
        className="w-full h-48 p-3 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
      ></textarea>
      {errors.length > 0 && (
        <div className="mt-2 space-y-1">
          {errors.map((error, index) => (
             <p key={index} className="text-[#ff0000] text-sm">{error}</p>
          ))}
        </div>
      )}
      <button
        onClick={handleNext}
        className="w-full bg-[#2e7d32] text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition duration-300 mt-6"
      >
        {t('next_to_role_selection')}
      </button>
    </div>
  );
};

export default PlayerEntryPage;