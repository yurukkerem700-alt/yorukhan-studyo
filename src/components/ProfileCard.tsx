import { CharacterProfile } from '../lib/heuristicEngine';

interface ProfileCardProps {
  visitorName: string;
  sessionDuration: number;
  totalClicks: number;
  profile: CharacterProfile;
  index: number;
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  if (minutes > 0) return `${minutes}dk ${seconds}sn`;
  return `${seconds}sn`;
}

function getProgressGradient(value: number): string {
  if (value >= 70) return 'from-emerald-400 via-green-400 to-emerald-400';
  if (value >= 40) return 'from-amber-400 via-yellow-400 to-amber-400';
  return 'from-rose-400 via-red-400 to-rose-400';
}

function getBadgeStyle(label: string): { gradient: string; glow: string; icon: string } {
  if (label.includes('Avcı') || label.includes('Kilitli')) {
    return { 
      gradient: 'from-red-500 via-orange-500 to-amber-500', 
      glow: 'shadow-orange-500/40',
      icon: '🎯'
    };
  }
  if (label.includes('Kaşif') || label.includes('Merak')) {
    return { 
      gradient: 'from-purple-500 via-violet-500 to-fuchsia-500', 
      glow: 'shadow-purple-500/40',
      icon: '🔍'
    };
  }
  if (label.includes('Stratejist') || label.includes('Soğukkanlı')) {
    return { 
      gradient: 'from-cyan-500 via-blue-500 to-indigo-500', 
      glow: 'shadow-blue-500/40',
      icon: '🧠'
    };
  }
  if (label.includes('Sabırsız') || label.includes('Baskı')) {
    return { 
      gradient: 'from-orange-500 via-red-500 to-rose-500', 
      glow: 'shadow-red-500/40',
      icon: '⚡'
    };
  }
  if (label.includes('Pragmatik') || label.includes('Sonuç')) {
    return { 
      gradient: 'from-emerald-500 via-teal-500 to-cyan-500', 
      glow: 'shadow-teal-500/40',
      icon: '✓'
    };
  }
  return { 
    gradient: 'from-gray-500 via-slate-500 to-zinc-500', 
    glow: 'shadow-gray-500/40',
    icon: '•'
  };
}

export function ProfileCard({ visitorName, sessionDuration, totalClicks, profile, index }: ProfileCardProps) {
  const badge = getBadgeStyle(profile.primaryLabel);
  
  return (
    <div 
      className="relative group"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Card glow */}
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${badge.gradient} rounded-2xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-500`}></div>
      
      {/* Main card */}
      <div className="relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-5 hover:border-gray-600/50 transition-all duration-300">
        
        {/* HUD corners */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-purple-500/30 rounded-tl-2xl"></div>
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-500/30 rounded-tr-2xl"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-500/30 rounded-bl-2xl"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-purple-500/30 rounded-br-2xl"></div>
        
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Avatar with ring */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl blur opacity-50"></div>
              <div className="relative w-12 h-12 bg-gradient-to-br from-purple-600 to-cyan-600 rounded-xl flex items-center justify-center text-white text-xl font-bold">
                {visitorName.charAt(0).toUpperCase()}
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold text-lg">{visitorName}</h4>
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{formatDuration(sessionDuration)}</span>
              </div>
            </div>
          </div>
          
          {/* Click count */}
          <div className="bg-gray-700/30 border border-gray-600/30 px-3 py-1.5 rounded-lg">
            <span className="text-cyan-400 font-bold text-sm">{totalClicks}</span>
            <span className="text-gray-500 text-xs ml-1">aksiyon</span>
          </div>
        </div>
        
        {/* Character Badge */}
        <div className="mb-5">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r ${badge.gradient} shadow-lg ${badge.glow}`}>
            <span className="text-lg">{badge.icon}</span>
            <span className="text-white font-bold text-sm tracking-wide">{profile.primaryLabel}</span>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {/* Merak */}
          <div className="bg-gray-800/50 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Merak</span>
              <span className="text-white font-bold text-sm">{profile.curiosity}%</span>
            </div>
            <div className="h-1 bg-gray-700/50 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${getProgressGradient(profile.curiosity)} rounded-full transition-all duration-1000`}
                style={{ width: `${profile.curiosity}%` }}
              />
            </div>
          </div>
          
          {/* Sabır */}
          <div className="bg-gray-800/50 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Sabır</span>
              <span className="text-white font-bold text-sm">{profile.patience}%</span>
            </div>
            <div className="h-1 bg-gray-700/50 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${getProgressGradient(profile.patience)} rounded-full transition-all duration-1000`}
                style={{ width: `${profile.patience}%` }}
              />
            </div>
          </div>
          
          {/* Kararlılık */}
          <div className="bg-gray-800/50 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Kararlılık</span>
              <span className="text-white font-bold text-sm">{profile.determination}%</span>
            </div>
            <div className="h-1 bg-gray-700/50 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${getProgressGradient(profile.determination)} rounded-full transition-all duration-1000`}
                style={{ width: `${profile.determination}%` }}
              />
            </div>
          </div>
        </div>
        
        {/* Traits */}
        {profile.traits.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {profile.traits.map((trait, i) => (
              <span 
                key={i}
                className="text-[10px] px-2 py-1 rounded-full bg-gray-700/30 text-gray-400 border border-gray-600/30"
              >
                {trait}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}