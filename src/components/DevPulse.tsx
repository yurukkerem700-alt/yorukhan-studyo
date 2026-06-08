import { useState, useEffect } from 'react';

interface DevPulseProps {
  visitorCount: number;
  projectCount: number;
}

type PulseState = 'active' | 'building' | 'creating' | 'idle';

const pulseMessages: Record<PulseState, { text: string; color: string }> = {
  active: { text: 'AKTİF HAFİF ETKİLEŞİM', color: 'text-green-400' },
  building: { text: 'KURUCU ENJEKSİYON MODUNDA', color: 'text-cyan-400' },
  creating: { text: 'SİBER SENTEZ SÜRECİNDE', color: 'text-purple-400' },
  idle: { text: 'BEKLEME MODU', color: 'text-gray-400' }
};

export function DevPulse({ visitorCount, projectCount }: DevPulseProps) {
  const [pulseState, setPulseState] = useState<PulseState>('active');
  const [heartbeatPhase, setHeartbeatPhase] = useState(0);

  // Determine pulse state based on activity
  useEffect(() => {
    const interval = setInterval(() => {
      setHeartbeatPhase(prev => (prev + 1) % 4);
      
      // Randomly cycle through states for demo
      const states: PulseState[] = ['active', 'building', 'creating', 'idle'];
      const random = Math.random();
      
      if (visitorCount > 5) {
        setPulseState('active');
      } else if (random < 0.1) {
        setPulseState(states[Math.floor(Math.random() * states.length)]);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [visitorCount]);

  const currentPulse = pulseMessages[pulseState];

  return (
    <div className="flex items-center gap-3">
      {/* Heartbeat icon */}
      <div className="relative">
        <div className={`absolute inset-0 bg-green-500/30 rounded-full blur-md animate-pulse`} />
        <div className={`relative w-4 h-4 transition-transform duration-300 ${heartbeatPhase % 2 === 0 ? 'scale-100' : 'scale-90'}`}>
          <svg 
            className="w-full h-full text-green-400" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path 
              fillRule="evenodd" 
              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" 
              clipRule="evenodd" 
            />
          </svg>
        </div>
      </div>
      
      {/* Status text */}
      <div className="flex items-center gap-2">
        <span className="text-gray-500 text-xs uppercase tracking-wider">Sistem Durumu:</span>
        <span className={`text-xs font-semibold uppercase tracking-wider ${currentPulse.color} animate-pulse`}>
          {currentPulse.text}
        </span>
      </div>
      
      {/* Stats */}
      <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-700/50">
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
          <span className="text-gray-400 text-xs">{projectCount} Proje</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
          <span className="text-gray-400 text-xs">{visitorCount} Ziyaretçi</span>
        </div>
      </div>
    </div>
  );
}