import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from '../LanguageContext';
import { audioManager } from '../services/AudioManager';
import LanguageSelector from './LanguageSelector';

interface NarratorGameStartProps {
  onStart: () => void;
}

const NarratorGameStart: React.FC<NarratorGameStartProps> = ({ onStart }) => {
  const { t, locale } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [canProceed, setCanProceed] = useState(false);
  const hasTriedAudio = useRef(false);

  useEffect(() => {
    if (!hasTriedAudio.current) {
      hasTriedAudio.current = true;
      setIsPlaying(true);

      audioManager.playAudio(
        locale,
        'narrator_intro',
        () => {
          setIsPlaying(false);
          setCanProceed(true);
        },
        (error) => {
          console.error('Audio error:', error);
          setIsPlaying(false);
          setCanProceed(true);
        }
      );
    }
  }, [locale]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="w-full max-w-lg bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl p-8 text-white relative">
        
        <div className="absolute top-4 right-4">
          <LanguageSelector />
        </div>

        <div className="text-center space-y-6">
          <h1 className="text-2xl font-bold mb-4">{t('narrator_game_start_title')}</h1>

          {isPlaying ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="animate-pulse text-5xl">🎙️</div>
              </div>
              <p className="text-lg text-white/80">{t('narrator_game_start_listening')}</p>
              <div className="flex justify-center gap-2 mt-4">
                <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-5xl">✅</div>
              <p className="text-lg text-white/90">{t('narrator_game_start_ready')}</p>
              <button
                onClick={onStart}
                disabled={!canProceed}
                className={`w-full py-3 px-6 rounded-lg font-bold transition-all ${
                  canProceed
                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                {t('narrator_game_start_button')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NarratorGameStart;