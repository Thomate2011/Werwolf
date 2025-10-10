import React, { useMemo } from 'react';
import { NARRATOR_TEXTS_KEYS } from '../constants';
import { Player } from '../types';
import { useTranslation } from '../LanguageContext';
import LanguageSelector from './LanguageSelector';

interface NarratorPageProps {
  onBack: () => void;
  activeRound: '1' | '2';
  setActiveRound: (round: '1' | '2') => void;
  players: Player[];
}

interface NarratorText {
  roleName: string;
  text: string;
}

const NarratorPage: React.FC<NarratorPageProps> = ({ onBack, activeRound, setActiveRound, players }) => {
  const { t } = useTranslation();
  
  const texts = useMemo(() => {
    const alivePlayersWithOriginalRole = (roleId: string) => players.some(p => p.originalRole.id === roleId && p.status === 'alive');

    const resultingTexts: NarratorText[] = [];
    
    // START: Universal Start Block
    if (activeRound === '1' && alivePlayersWithOriginalRole('reine_seele')) {
        resultingTexts.push({ 
            roleName: t('role_reine_seele_name'), 
            text: t('narrator_reine_seele_text_1')
        });
    }
    
    // IMMER "Alle Bürger schließen Augen" - auch bei Reiner Seele
    resultingTexts.push({ roleName: t('role_dorfbewohner_name'), text: t('narrator_alle_buerger_close_eyes') });
    
    // Filter and add main texts based on who is alive
    const mainTextKeys = NARRATOR_TEXTS_KEYS[activeRound].filter(item => {
      if (item.roleId === 'gaukler') {
        const jesterPlayer = players.find(p => p.originalRole.id === 'gaukler');
        return jesterPlayer && jesterPlayer.status === 'alive' && jesterPlayer.role.id !== 'werwolf';
      }
      return players.some(p => (p.originalRole.id === item.roleId) && p.status === 'alive');
    });

    const translatedMainTexts: NarratorText[] = mainTextKeys.map(item => ({
        roleName: t(item.roleNameKey),
        text: t(item.textKey)
    }));

    resultingTexts.push(...translatedMainTexts);

    // END: Universal End Block
    resultingTexts.push({ roleName: t('role_dorfbewohner_name'), text: t('narrator_alle_buerger_open_eyes') });

    return resultingTexts;
  }, [activeRound, players, t]);

  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-xl shadow-lg p-8 text-[#333] relative">
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <button onClick={onBack} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition">
          {t('back')}
        </button>
        <div className="flex space-x-2">
            <button 
                onClick={() => setActiveRound('1')}
                className={`font-bold py-2 px-4 rounded-lg transition ${activeRound === '1' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
                {t('narrator_round_1')}
            </button>
            <button 
                onClick={() => setActiveRound('2')}
                className={`font-bold py-2 px-4 rounded-lg transition ${activeRound === '2' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
                {t('narrator_round_2')}
            </button>
        </div>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        {texts.map((item, index) => (
          <div key={index} className="p-3 bg-gray-50 rounded-lg">
            <p className="font-bold text-green-800 mb-1">{item.roleName}:</p>
            <p className="text-gray-700" dangerouslySetInnerHTML={{ __html: item.text }}></p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NarratorPage;