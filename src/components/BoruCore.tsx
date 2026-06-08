import { useState, useRef, useEffect, useCallback } from 'react';

interface BoruCoreProps {
  onClick: () => void;
  isActive: boolean;
  hasNewMessage: boolean;
}

export function BoruCore({ onClick, isActive, hasNewMessage }: BoruCoreProps) {
  const [pulsePhase, setPulsePhase] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setPulsePhase(prev => (prev + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <button
      onClick={onClick}
      className={`
        fixed bottom-6 right-6 z-50
        w-16 h-16 rounded-full
        flex items-center justify-center
        cursor-pointer
        transition-all duration-500
        ${isActive ? 'scale-90 opacity-0' : 'scale-100 opacity-100'}
      `}
      title="BÖRÜ AI Terminali"
    >
      {/* Outer glow rings */}
      <div 
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, transparent 30%, rgba(0, 255, 200, 0.1) 70%, transparent 100%)`,
          transform: `scale(${1.5 + Math.sin(pulsePhase * 0.1) * 0.2})`,
          animation: 'pulse 3s ease-in-out infinite'
        }}
      />
      <div 
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, transparent 40%, rgba(0, 255, 200, 0.15) 80%, transparent 100%)`,
          transform: `scale(${1.3 + Math.cos(pulsePhase * 0.08) * 0.15})`,
          animation: 'pulse 2.5s ease-in-out infinite',
          animationDelay: '0.5s'
        }}
      />
      
      {/* Core container */}
      <div 
        className="relative w-14 h-14 rounded-full bg-gradient-to-br from-gray-900 to-gray-800 border border-cyan-500/30"
        style={{
          boxShadow: `
            0 0 20px rgba(0, 255, 200, 0.3),
            0 0 40px rgba(0, 255, 200, 0.1),
            inset 0 0 20px rgba(0, 255, 200, 0.1)
          `
        }}
      >
        {/* Inner core */}
        <div 
          className="absolute inset-2 rounded-full"
          style={{
            background: `
              radial-gradient(circle at 30% 30%, 
                rgba(0, 255, 200, 0.4) 0%,
                rgba(0, 200, 255, 0.2) 50%,
                transparent 70%
              )
            `,
            animation: 'pulse 2s ease-in-out infinite'
          }}
        />
        
        {/* Sound wave lines */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 56 56">
          {/* Animated arcs */}
          {[...Array(3)].map((_, i) => (
            <circle
              key={i}
              cx="28"
              cy="28"
              r={8 + i * 4}
              fill="none"
              stroke="rgba(0, 255, 200, 0.3)"
              strokeWidth="1"
              strokeDasharray="4 4"
              style={{
                transform: `rotate(${pulsePhase + i * 30}deg)`,
                transformOrigin: 'center',
                opacity: 0.5 - i * 0.1
              }}
            />
          ))}
        </svg>
        
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="w-6 h-6 rounded-full bg-cyan-400/20"
            style={{
              boxShadow: '0 0 10px rgba(0, 255, 200, 0.5)',
              animation: 'pulse 1.5s ease-in-out infinite'
            }}
          />
        </div>
        
        {/* New message indicator */}
        {hasNewMessage && (
          <div 
            className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-400 rounded-full animate-pulse"
            style={{ boxShadow: '0 0 10px rgba(0, 255, 200, 0.8)' }}
          />
        )}
      </div>
      
      {/* Label */}
      <div 
        className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap"
        style={{ 
          fontFamily: 'monospace',
          fontSize: '10px',
          color: 'rgba(0, 255, 200, 0.7)',
          letterSpacing: '2px'
        }}
      >
        BÖRÜ
      </div>
    </button>
  );
}