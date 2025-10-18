import React, { useEffect, useState } from 'react';
import { useTranslation } from '../LanguageContext';
import { audioManager } from '../services/AudioManager';

interface NarratorGameStartProps {
  onStart: () => void;
}

const NarratorGameStart: React.FC<NarratorGameStartProps> = ({ onStart }) => {
  const { t, locale } = useTranslation();
  const [audioPlayed, setAudioPlayed] = useState(false);

  useEffect(() => {
    if (!audioPlayed) {
      audioManager.playAudio(
        locale as any,
        'narrator_intro',
        () => {
          setAudioPlayed(true);
        }
      );
    }

    return () => {
      audioManager.stopAudio();
    };
  }, [audioPlayed]);

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-center text-[#333]">
      <h1 className="text-2xl font-bold mb-6 text-green-700">
        {t('narrator_game_start_title')}
      </h1>

      <p className="mb-8 text-lg text-gray-600">
        {t('narrator_game_start_listening')}
      </p>

      <button
        onClick={() => {
          audioManager.stopAudio();
          onStart();
        }}
        disabled={!audioPlayed}
        className={`w-full font-bold py-3 px-4 rounded-lg transition ${
          audioPlayed
            ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
            : 'bg-gray-400 text-gray-200 cursor-not-allowed'
        }`}
      >
        {audioPlayed
          ? t('narrator_game_start_button')
          : t('narrator_game_start_waiting')}
      </button>

      {audioPlayed && (
        <p className="mt-4 text-sm text-gray-500">
          {t('narrator_game_start_ready')}
        </p>
      )}
    </div>
  );
};

export default NarratorGameStart;