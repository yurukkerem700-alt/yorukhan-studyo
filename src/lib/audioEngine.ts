import { useRef, useCallback, useEffect, useState } from 'react';

type SoundType = 'hover' | 'click' | 'boot' | 'success';

class AudioEngine {
  private audioContext: AudioContext | null = null;
  private isMuted: boolean = true;
  private isInitialized: boolean = false;

  init() {
    if (this.isInitialized) return;
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.isInitialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (!muted && !this.isInitialized) {
      this.init();
    }
  }

  getMuted() {
    return this.isMuted;
  }

  private createOscillator(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume: number = 0.1,
    attack: number = 0.01,
    decay: number = 0.1
  ) {
    if (!this.audioContext || this.isMuted) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + attack);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  playHover() {
    // Soft digital click
    this.createOscillator(800, 0.05, 'sine', 0.03, 0.005, 0.02);
  }

  playClick() {
    // Deeper click sound
    this.createOscillator(400, 0.08, 'triangle', 0.05, 0.01, 0.03);
    setTimeout(() => {
      this.createOscillator(600, 0.05, 'sine', 0.03, 0.01, 0.02);
    }, 20);
  }

  playBoot() {
    // Futuristic boot-up sequence
    if (!this.audioContext || this.isMuted) return;

    const notes = [200, 300, 450, 600, 800];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.createOscillator(freq, 0.15, 'sine', 0.06, 0.02, 0.08);
      }, i * 80);
    });
  }

  playSuccess() {
    // Success confirmation
    this.createOscillator(523, 0.1, 'sine', 0.05, 0.01, 0.05);
    setTimeout(() => {
      this.createOscillator(659, 0.1, 'sine', 0.05, 0.01, 0.05);
    }, 100);
    setTimeout(() => {
      this.createOscillator(784, 0.15, 'sine', 0.06, 0.01, 0.08);
    }, 200);
  }
}

// Singleton instance
const audioEngine = new AudioEngine();

export function useAudio() {
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    // Load mute preference
    const savedMuted = localStorage.getItem('yorkhan_audio_muted');
    if (savedMuted !== null) {
      const muted = savedMuted === 'true';
      setIsMuted(muted);
      audioEngine.setMuted(muted);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audioEngine.setMuted(newMuted);
    localStorage.setItem('yorkhan_audio_muted', String(newMuted));
    
    // Play a sound when unmuting
    if (!newMuted) {
      audioEngine.init();
      audioEngine.playSuccess();
    }
  }, [isMuted]);

  const playSound = useCallback((type: SoundType) => {
    if (isMuted) return;
    audioEngine.init();
    
    switch (type) {
      case 'hover':
        audioEngine.playHover();
        break;
      case 'click':
        audioEngine.playClick();
        break;
      case 'boot':
        audioEngine.playBoot();
        break;
      case 'success':
        audioEngine.playSuccess();
        break;
    }
  }, [isMuted]);

  return { isMuted, toggleMute, playSound };
}

export { audioEngine };