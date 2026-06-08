interface StatsOverviewProps {
  totalVisitors: number;
  totalClicks: number;
  avgSessionDuration: number;
  topCharacter: string;
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

const statsConfig = [
  {
    key: 'visitors',
    label: 'Toplam Ziyaretçi',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    gradient: 'from-emerald-400 to-green-400',
    bgGradient: 'from-emerald-500/10 to-green-500/10',
    borderColor: 'border-emerald-500/20',
    glowColor: 'rgba(16, 185, 129, 0.3)'
  },
  {
    key: 'clicks',
    label: 'Toplam Etkileşim',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
      </svg>
    ),
    gradient: 'from-cyan-400 to-blue-400',
    bgGradient: 'from-cyan-500/10 to-blue-500/10',
    borderColor: 'border-cyan-500/20',
    glowColor: 'rgba(6, 182, 212, 0.3)'
  },
  {
    key: 'duration',
    label: 'Ort. Oturum',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    gradient: 'from-purple-400 to-violet-400',
    bgGradient: 'from-purple-500/10 to-violet-500/10',
    borderColor: 'border-purple-500/20',
    glowColor: 'rgba(139, 92, 246, 0.3)'
  },
  {
    key: 'character',
    label: 'Baskın Karakter',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    gradient: 'from-amber-400 to-orange-400',
    bgGradient: 'from-amber-500/10 to-orange-500/10',
    borderColor: 'border-amber-500/20',
    glowColor: 'rgba(245, 158, 11, 0.3)'
  }
];

export function StatsOverview({ totalVisitors, totalClicks, avgSessionDuration, topCharacter }: StatsOverviewProps) {
  const values = {
    visitors: totalVisitors,
    clicks: totalClicks,
    duration: formatDuration(avgSessionDuration),
    character: topCharacter || '-'
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statsConfig.map((stat) => (
        <div 
          key={stat.key}
          className={`relative group bg-gradient-to-br ${stat.bgGradient} border ${stat.borderColor} rounded-2xl p-5 hover:border-opacity-60 transition-all duration-300 overflow-hidden`}
        >
          {/* Glow effect */}
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ background: `radial-gradient(circle at center, ${stat.glowColor} 0%, transparent 70%)` }}
          ></div>
          
          {/* Icon */}
          <div className="relative mb-3">
            <div className={`bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
              {stat.icon}
            </div>
          </div>
          
          {/* Label */}
          <p className="relative text-gray-400 text-xs uppercase tracking-wider mb-1">{stat.label}</p>
          
          {/* Value */}
          <p className={`relative text-2xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent ${stat.key === 'character' ? 'text-base truncate' : ''}`}>
            {values[stat.key as keyof typeof values]}
          </p>
          
          {/* Decorative corner */}
          <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
            <div className={`absolute top-2 right-2 w-8 h-8 border-t border-r ${stat.borderColor} transform rotate-45 translate-x-4 -translate-y-4 opacity-50`}></div>
          </div>
        </div>
      ))}
    </div>
  );
}