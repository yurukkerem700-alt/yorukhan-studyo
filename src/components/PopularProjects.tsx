import { useMemo } from 'react';

interface PopularProject {
  name: string;
  clicks: number;
  category: string;
}

interface PopularProjectsProps {
  telemetryLogs: Array<{ 
    project_name?: string;
    visitor_name?: string;
  }>;
  projects: Array<{
    id: number;
    name: string;
    category: string;
  }>;
}

export function PopularProjects({ telemetryLogs, projects }: PopularProjectsProps) {
  const popularProjects = useMemo(() => {
    const clickCounts: Record<string, number> = {};
    
    telemetryLogs.forEach(log => {
      if (log.project_name) {
        clickCounts[log.project_name] = (clickCounts[log.project_name] || 0) + 1;
      }
    });
    
    const sorted = Object.entries(clickCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    return sorted.map(([name, clicks]) => {
      const project = projects.find(p => p.name === name);
      return {
        name,
        clicks,
        category: project?.category || 'unknown'
      };
    });
  }, [telemetryLogs, projects]);

  const maxClicks = Math.max(...popularProjects.map(p => p.clicks), 1);

  if (popularProjects.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 border border-gray-700/50 rounded-2xl p-6">
      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
        <span className="text-amber-400">★</span>
        En Popüler Projeler
      </h3>
      
      <div className="space-y-4">
        {popularProjects.map((project, index) => (
          <div key={project.name} className="group">
            <div className="flex items-center gap-3 mb-2">
              {/* Rank Badge */}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                index === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                index === 1 ? 'bg-gray-400/20 text-gray-300 border border-gray-400/30' :
                index === 2 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                'bg-gray-700/50 text-gray-500'
              }`}>
                {index + 1}
              </div>
              
              {/* Project Name */}
              <span className="text-white text-sm font-medium flex-1 truncate">{project.name}</span>
              
              {/* Click Count */}
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                <span className="text-cyan-400 font-bold text-sm">{project.clicks}</span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="h-1.5 bg-gray-800/50 rounded-full overflow-hidden ml-9">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  index === 0 ? 'bg-gradient-to-r from-amber-400 to-yellow-400' :
                  index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-300' :
                  index === 2 ? 'bg-gradient-to-r from-orange-400 to-amber-400' :
                  'bg-gradient-to-r from-cyan-500 to-blue-500'
                }`}
                style={{ width: `${(project.clicks / maxClicks) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}