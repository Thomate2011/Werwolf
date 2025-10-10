import React from 'react';
import { useTranslation } from '../LanguageContext';
import LanguageSelector from './LanguageSelector';

interface HomePageProps {
  onStart: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onStart }) => {
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-center text-[#333] relative">
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>
      
      <h1 className="text-3xl font-bold text-[#2e7d32] mb-4">{t('home_welcome')}</h1>
      <p className="mb-6">{t('home_description')}</p>
      <hr className="border-t border-[#ccc] my-6" />
      <button
        onClick={onStart}
        className="w-full bg-[#2e7d32] text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition duration-300"
      >
        {t('start_game')}
      </button>
    </div>
  );
};

export default HomePage;