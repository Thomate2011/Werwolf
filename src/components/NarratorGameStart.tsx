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
      {/* Nur Container - Keine weiße Box! */}
      <div className="w-full max-w-2xl bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-12 text-white relative">
        
        {/* Welt-Symbol INNERHALB des Containers */}
        <div className="absolute top-6 right-6">
          <LanguageSelector />
        </div>

        <div className="text-center space-y-8">
          <h1 className="text-4xl font-bold mb-4">{t('narrator_game_start_title')}</h1>

          {isPlaying ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="animate-pulse text-6xl">🎙️</div>
              </div>
              <p className="text-xl text-white/80">{t('narrator_game_start_listening')}</p>
              <div className="flex justify-center gap-2 mt-4">
                <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-6xl">✅</div>
              <p className="text-xl text-white/90">{t('narrator_game_start_ready')}</p>
              <button
                onClick={onStart}
                disabled={!canProceed}
                className={`w-full py-4 px-8 rounded-xl font-bold text-xl transition-all ${
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