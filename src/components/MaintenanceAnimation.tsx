import { useState, useEffect, useRef, useCallback } from 'react';

interface MaintenanceAnimationProps {
  projectName: string;
  onPlayGame: () => void;
  onGoBack: () => void;
}

export function MaintenanceAnimation({ projectName, onPlayGame, onGoBack }: MaintenanceAnimationProps) {
  const [progress, setProgress] = useState(0);
  const [showButtons, setShowButtons] = useState(false);
  const [glitchText, setGlitchText] = useState('');
  
  useEffect(() => {
    // Animate progress bar
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setShowButtons(true), 500);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
    
    return () => clearInterval(interval);
  }, []);
  
  // Glitch text effect
  useEffect(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*';
    const targetText = 'SİSTEM GÜNCELLEMESİ';
    let iteration = 0;
    
    const glitchInterval = setInterval(() => {
      setGlitchText(
        targetText
          .split('')
          .map((char, index) => {
            if (index < iteration) return targetText[index];
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join('')
      );
      
      iteration += 1/3;
      if (iteration >= targetText.length) {
        clearInterval(glitchInterval);
        setGlitchText(targetText);
      }
    }, 30);
    
    return () => clearInterval(glitchInterval);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Cyber background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-blue-950/20 to-gray-950">
        {/* Matrix rain effect */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute text-cyan-400 text-xs font-mono whitespace-nowrap animate-matrix-rain"
              style={{
                left: `${i * 5}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 10}s`
              }}
            >
              {[...Array(30)].map((_, j) => (
                <div key={j}>{String.fromCharCode(0x30A0 + Math.random() * 96)}</div>
              )).reverse()}
            </div>
          ))}
        </div>
      </div>
      
      {/* Modal content */}
      <div className="relative max-w-lg w-full mx-4">
        {/* Cyber corners */}
        <div className="absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 border-cyan-400"></div>
        <div className="absolute -top-2 -right-2 w-6 h-6 border-t-2 border-r-2 border-purple-400"></div>
        <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-2 border-l-2 border-purple-400"></div>
        <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-2 border-r-2 border-cyan-400"></div>
        
        <div className="bg-gray-900/95 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-8 shadow-2xl shadow-cyan-500/10">
          {/* Warning icon with pulse */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500/20 rounded-full animate-ping"></div>
              <div className="relative w-20 h-20 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full flex items-center justify-center border border-amber-500/30">
                <svg className="w-10 h-10 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Glitch title */}
          <h2 className="text-2xl font-bold text-center mb-4 font-mono tracking-wider">
            <span className="text-cyan-400">{glitchText}</span>
          </h2>
          
          {/* Project name with glow */}
          <div className="text-center mb-6">
            <span className="text-lg text-gray-300">{projectName}</span>
            <p className="text-gray-500 text-sm mt-1">şu anda KEJDER laboratuvarında optimize ediliyor</p>
          </div>
          
          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>Veri hatları yenileniyor...</span>
              <span>{Math.min(100, Math.round(progress))}%</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
            {/* Scanning line effect */}
            <div className="relative h-1 mt-1 bg-gray-800/50 rounded overflow-hidden">
              <div className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent animate-scan"></div>
            </div>
          </div>
          
          {/* BÖRÜ AI message */}
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">B</span>
              </div>
              <div>
                <p className="text-white text-sm font-medium mb-1">BÖRÜ AI</p>
                <p className="text-gray-400 text-sm">
                  Küçük bir simülasyona katılmak ister misiniz? Beklerken eğlenebilirsiniz.
                </p>
              </div>
            </div>
          </div>
          
          {/* Buttons */}
          {showButtons && (
            <div className="flex gap-3 animate-fade-in">
              <button
                onClick={onPlayGame}
                className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Evet, Ejderhayı Serbest Bırak
              </button>
              <button
                onClick={onGoBack}
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-xl transition-all border border-gray-700"
              >
                Geri Dön
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}