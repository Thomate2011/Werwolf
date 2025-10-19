import React, { useEffect, useState } from 'react';
import { useTranslation } from '../LanguageContext';
import { audioManager } from '../services/AudioManager';
import LanguageSelector from './LanguageSelector';

interface NarratorGameStartProps {
  onStart: () => void;
}

const NarratorGameStart: React.FC<NarratorGameStartProps> = ({ onStart }) => {
  const { t, locale } = useTranslation();
  const [audioPlayed, setAudioPlayed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!audioPlayed && !isPlaying) {
      setIsPlaying(true);
      audioManager.playAudio(
        locale as any,
        'narrator_intro',
        () => {
          setIsPlaying(false);
          setAudioPlayed(true);
        },
        (error) => {
          console.error('Audio error:', error);
          setIsPlaying(false);
          setAudioPlayed(true); // Trotzdem weitermachen
        }
      );
    }

    return () => {
      audioManager.stopAudio();
    };
  }, [audioPlayed, isPlaying, locale]);

  return (
    <div className="relative w-full min-h-screen bg-white flex items-center justify-center p-4">
      <div className="absolute top-4 right-4 z-50">
        <LanguageSelector />
      </div>

      <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-center text-[#333]">
        <h1 className="text-2xl font-bold mb-6 text-green-700">
          {t('narrator_game_start_title')}
        </h1>

        <p className="mb-8 text-lg text-gray-600">
          {t('narrator_game_start_listening')}
        </p>

        {isPlaying && (
          <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
            <p className="text-gray-700 animate-pulse">🔊 {t('narrator_game_start_waiting')}</p>
          </div>
        )}

        <button
          onClick={() => {
            audioManager.stopAudio();
            onStart();
          }}
          disabled={!audioPlayed && isPlaying}
          className={`w-full font-bold py-3 px-4 rounded-lg transition ${
            audioPlayed || !isPlaying
              ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
              : 'bg-gray-400 text-gray-200 cursor-not-allowed'
          }`}
        >
          {audioPlayed
            ? t('narrator_game_start_button')
            : isPlaying
            ? t('narrator_game_start_waiting')
            : t('narrator_game_start_ready')}
        </button>

        {audioPlayed && (
          <p className="mt-4 text-sm text-gray-500">
            {t('narrator_game_start_ready')}
          </p>
        )}
      </div>
    </div>
  );
};

export default NarratorGameStart;