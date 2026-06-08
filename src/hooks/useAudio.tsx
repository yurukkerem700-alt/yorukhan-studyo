import { useState, useRef, useEffect, useCallback } from 'react';

// Generate soft sounds using Web Audio API
const createAudioContext = () => {
  if (typeof window !== 'undefined' && window.AudioContext) {
    return new AudioContext();
  }
  return null;
};

export function useAudio() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const musicIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    audioContextRef.current = createAudioContext();
    return () => {
      if (musicIntervalRef.current) {
        clearInterval(musicIntervalRef.current);
      }
    };
  }, []);

  const generateHoverSound = useCallback(() => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.03, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  }, []);

  const generateClickSound = useCallback(() => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.08);
    
    gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.08);
  }, []);

  const playHoverSound = useCallback(() => {
    if (isMuted || !audioContextRef.current) return;
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    generateHoverSound();
  }, [isMuted, generateHoverSound]);

  const playClickSound = useCallback(() => {
    if (isMuted || !audioContextRef.current) return;
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    generateClickSound();
  }, [isMuted, generateClickSound]);

  // Generate ambient piano-like music
  const playAmbientMusic = useCallback(() => {
    if (!audioContextRef.current || isMuted || !isMusicPlaying) return;
    
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    // Piano-like notes (C major pentatonic)
    const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
    
    const playNote = (frequency: number, startTime: number, duration: number) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, startTime);
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, startTime);
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.02, startTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    // Play a random note
    const note = notes[Math.floor(Math.random() * notes.length)];
    const now = ctx.currentTime;
    playNote(note, now, 2 + Math.random() * 2);
  }, [isMuted, isMusicPlaying]);

  const toggleMusic = useCallback(() => {
    if (isMusicPlaying) {
      setIsMusicPlaying(false);
      if (musicIntervalRef.current) {
        clearInterval(musicIntervalRef.current);
        musicIntervalRef.current = null;
      }
    } else {
      setIsMuted(false);
      setIsMusicPlaying(true);
    }
  }, [isMusicPlaying]);

  useEffect(() => {
    if (isMusicPlaying && !isMuted && audioContextRef.current) {
      playAmbientMusic();
      musicIntervalRef.current = window.setInterval(playAmbientMusic, 4000);
    }
    
    return () => {
      if (musicIntervalRef.current) {
        clearInterval(musicIntervalRef.current);
      }
    };
  }, [isMusicPlaying, isMuted, playAmbientMusic]);

  return {
    playHoverSound,
    playClickSound,
    toggleMusic,
    isMusicPlaying,
    isMuted
  };
}

// Music Control Button Component
export function MusicControl({ 
  isPlaying, 
  isMuted, 
  onToggle 
}: { 
  isPlaying: boolean; 
  isMuted: boolean; 
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="fixed top-20 right-6 z-40 w-12 h-12 bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl flex items-center justify-center hover:bg-gray-700/80 transition-colors group"
      title={isMuted || !isPlaying ? 'Müzik Aç' : 'Müziği Kapat'}
    >
      {isMuted || !isPlaying ? (
        <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
      )}
    </button>
  );
}
