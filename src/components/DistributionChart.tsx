import { useMemo } from 'react';

interface DistributionChartProps {
  distribution: Record<string, number>;
}

const CHART_COLORS = [
  { main: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.5)' },
  { main: '#06b6d4', glow: 'rgba(6, 182, 212, 0.5)' },
  { main: '#10b981', glow: 'rgba(16, 185, 129, 0.5)' },
  { main: '#f59e0b', glow: 'rgba(245, 158, 11, 0.5)' },
  { main: '#ef4444', glow: 'rgba(239, 68, 68, 0.5)' },
  { main: '#ec4899', glow: 'rgba(236, 72, 153, 0.5)' },
];

export function DistributionChart({ distribution }: DistributionChartProps) {
  const total = useMemo(() => {
    return Object.values(distribution).reduce((sum, count) => sum + count, 0);
  }, [distribution]);
  
  const segments = useMemo(() => {
    const entries = Object.entries(distribution);
    let currentAngle = -90;
    
    return entries.map(([label, count], index) => {
      const percentage = total > 0 ? (count / total) * 100 : 0;
      const angle = (percentage / 100) * 360;
      const startAngle = currentAngle;
      currentAngle += angle;
      
      return {
        label,
        count,
        percentage: percentage.toFixed(1),
        color: CHART_COLORS[index % CHART_COLORS.length],
        startAngle,
        angle
      };
    });
  }, [distribution, total]);

  const createArcPath = (startAngle: number, angle: number, radius: number = 70) => {
    if (angle <= 0) return '';
    
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = ((startAngle + angle) * Math.PI) / 180;
    
    const x1 = 100 + radius * Math.cos(startRad);
    const y1 = 100 + radius * Math.sin(startRad);
    const x2 = 100 + radius * Math.cos(endRad);
    const y2 = 100 + radius * Math.sin(endRad);
    
    const largeArc = angle > 180 ? 1 : 0;
    
    if (angle >= 359.9) {
      return `M 100 30 A 70 70 0 1 1 99.9 30 Z`;
    }
    
    return `M 100 100 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  if (total === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 border border-gray-700/50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <span className="text-purple-400">◆</span> Karakter Dağılımı
        </h3>
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-2xl flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-500">Ziyaretçi verisi bekleniyor...</p>
          <p className="text-gray-600 text-sm mt-2">Analiz için yeterli veri toplandıysa görünecek</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 border border-gray-700/50 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
        <span className="text-purple-400">◆</span> Karakter Dağılımı
      </h3>
      
      <div className="flex flex-col lg:flex-row items-center gap-8">
        {/* Pie Chart */}
        <div className="relative">
          {/* Outer glow */}
          <div className="absolute inset-0 bg-purple-500/10 rounded-full blur-2xl"></div>
          
          <svg viewBox="0 0 200 200" className="w-52 h-52 relative">
            {/* Background ring */}
            <circle
              cx="100"
              cy="100"
              r="70"
              fill="none"
              stroke="rgba(55, 65, 81, 0.3)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            
            {/* Segments with glow filter */}
            <defs>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {segments.map((segment, index) => (
              <path
                key={index}
                d={createArcPath(segment.startAngle, segment.angle)}
                fill={segment.color.main}
                filter="url(#glow)"
                className="transition-all duration-500 hover:opacity-80"
                style={{ transformOrigin: 'center' }}
              />
            ))}
            
            {/* Center circle */}
            <circle
              cx="100"
              cy="100"
              r="45"
              fill="#030712"
              stroke="rgba(139, 92, 246, 0.2)"
              strokeWidth="1"
            />
            
            {/* Total text */}
            <text
              x="100"
              y="92"
              textAnchor="middle"
              className="fill-white text-3xl font-bold"
              style={{ fontFamily: 'system-ui' }}
            >
              {total}
            </text>
            <text
              x="100"
              y="115"
              textAnchor="middle"
              className="fill-gray-400 text-xs"
              style={{ fontFamily: 'system-ui' }}
            >
              ziyaretçi
            </text>
          </svg>
        </div>
        
        {/* Legend with bars */}
        <div className="flex-1 space-y-4 w-full">
          {segments.map((segment, index) => (
            <div key={index} className="group">
              <div className="flex items-center gap-3 mb-1.5">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-offset-2 ring-offset-gray-900 transition-all group-hover:scale-110"
                  style={{ 
                    backgroundColor: segment.color.main,
                    boxShadow: `0 0 10px ${segment.color.glow}`
                  }}
                />
                <span className="text-white text-sm font-medium">{segment.label}</span>
                <span className="text-gray-500 text-sm ml-auto">{segment.count}</span>
                <span className="text-gray-400 text-xs">({segment.percentage}%)</span>
              </div>
              {/* Animated bar */}
              <div className="h-1.5 bg-gray-800/50 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ 
                    width: `${segment.percentage}%`,
                    backgroundColor: segment.color.main,
                    boxShadow: `0 0 8px ${segment.color.glow}`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}