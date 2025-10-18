type Locale = 'de' | 'en' | 'fr' | 'es' | 'pt' | 'it' | 'ru' | 'is' | 'sv' | 'zh' | 'ja' | 'tr' | 'ar' | 'ko' | 'hi' | 'bn' | 'pl' | 'da' | 'cs' | 'fi' | 'no' | 'hu' | 'nl' | 'ro' | 'he' | 'emoji';

class AudioManager {
  private currentAudio: HTMLAudioElement | null = null;
  private isPlaying = false;

  playAudio(
    locale: Locale,
    textKey: string,
    onComplete?: () => void,
    onError?: (error: Error) => void
  ): void {
    this.stopAudio();

    const audioPath = `/audio/${locale}/${textKey}.mp3`;
    this.currentAudio = new Audio(audioPath);

    this.isPlaying = true;

    this.currentAudio.onended = () => {
      this.isPlaying = false;
      onComplete?.();
    };

    this.currentAudio.onerror = () => {
      this.isPlaying = false;
      const error = new Error(`Audio file not found: ${audioPath}`);
      console.error(error);
      onError?.(error);
    };

    this.currentAudio.play().catch((err) => {
      this.isPlaying = false;
      console.error('Failed to play audio:', err);
      onError?.(err);
    });
  }

  stopAudio(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.isPlaying = false;
  }

  getIsPlaying(): boolean {
    return this.isPlaying && this.currentAudio !== null && !this.currentAudio.paused;
  }

  setVolume(volume: number): void {
    if (this.currentAudio) {
      this.currentAudio.volume = Math.max(0, Math.min(1, volume));
    }
  }

  getCurrentTime(): number {
    return this.currentAudio?.currentTime ?? 0;
  }

  getDuration(): number {
    return this.currentAudio?.duration ?? 0;
  }
}

export const audioManager = new AudioManager();
export default AudioManager;