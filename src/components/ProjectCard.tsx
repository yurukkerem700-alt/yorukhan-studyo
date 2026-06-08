import { useRef, useState, useCallback } from 'react';

interface Project {
  id: number;
  name: string;
  description: string;
  category: 'completed_games' | 'completed_apps' | 'dev_games' | 'dev_apps';
  image?: string;
  production_url?: string;
  github_url?: string;
  launch_type?: 'new_tab' | 'iframe' | 'download';
  status?: 'live' | 'beta' | 'maintenance';
}

interface ProjectCardProps {
  project: Project;
  onProjectClick: (project: Project) => void;
}

const categoryLabels: Record<string, string> = {
  'completed_games': 'TAMAMLANDI',
  'completed_apps': 'TAMAMLANDI',
  'dev_games': 'MUTFAKTA',
  'dev_apps': 'SİBER LAB'
};

const categoryColors: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  'completed_games': { 
    bg: 'bg-green-500/10', 
    text: 'text-green-400', 
    border: 'border-green-500/30',
    glow: 'shadow-green-500/20'
  },
  'completed_apps': { 
    bg: 'bg-blue-500/10', 
    text: 'text-blue-400', 
    border: 'border-blue-500/30',
    glow: 'shadow-blue-500/20'
  },
  'dev_games': { 
    bg: 'bg-yellow-500/10', 
    text: 'text-yellow-400', 
    border: 'border-yellow-500/30',
    glow: 'shadow-yellow-500/20'
  },
  'dev_apps': { 
    bg: 'bg-purple-500/10', 
    text: 'text-purple-400', 
    border: 'border-purple-500/30',
    glow: 'shadow-purple-500/20'
  }
};

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
  'live': {
    label: 'CANLI',
    color: 'text-green-400',
    bg: 'bg-green-500/20',
    border: 'border-green-500/50',
    icon: '🟢'
  },
  'beta': {
    label: 'BETA',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500/50',
    icon: '🟡'
  },
  'maintenance': {
    label: 'BAKIMDA',
    color: 'text-red-400',
    bg: 'bg-red-500/20',
    border: 'border-red-500/50',
    icon: '🔴'
  }
};

export function ProjectCard({ project, onProjectClick }: ProjectCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isBursting, setIsBursting] = useState(false);
  const [magneticPos, setMagneticPos] = useState({ x: 0, y: 0 });

  const colors = categoryColors[project.category] || categoryColors['completed_games'];
  const label = categoryLabels[project.category] || 'PROJE';
  const status = statusConfig[project.status || 'live'];
  const isMaintenance = project.status === 'maintenance';

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const rotateX = (e.clientY - centerY) / 25;
    const rotateY = -(e.clientX - centerX) / 25;
    setTilt({ x: rotateX, y: rotateY });
    
    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
    
    if (distance < 60) {
      const factor = 1 - distance / 60;
      setMagneticPos({
        x: distanceX * factor * 0.12,
        y: distanceY * factor * 0.12
      });
    }
  }, []);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
    setMagneticPos({ x: 0, y: 0 });
  }, []);

  const handleClick = useCallback(() => {
    if (isMaintenance) return;
    
    setIsBursting(true);
    setTimeout(() => {
      setIsBursting(false);
      onProjectClick(project);
    }, 350);
  }, [project, onProjectClick, isMaintenance]);

  return (
    <div
      ref={cardRef}
      className={`relative rounded-2xl cursor-pointer overflow-visible ${isMaintenance ? 'opacity-60' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translate(${magneticPos.x}px, ${magneticPos.y}px)`,
        transition: isHovered 
          ? 'transform 0.15s ease-out' 
          : 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transformStyle: 'preserve-3d'
      }}
    >
      {/* Glow Effect */}
      <div className={`absolute -inset-1 ${colors.bg} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
      
      {/* Main Card */}
      <div className={`relative bg-gray-900/80 backdrop-blur-sm border ${colors.border} rounded-2xl overflow-hidden transition-all duration-300 ${isHovered ? 'border-opacity-100 shadow-lg ' + colors.glow : ''}`}>
        
        {/* Top Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gray-800">
          <div 
            className={`h-full bg-gradient-to-r ${project.category.includes('completed') ? 'from-green-400 via-emerald-400 to-green-400' : 'from-purple-400 via-pink-400 to-purple-400'} transition-all duration-1000`}
            style={{ width: project.category.includes('completed') ? '100%' : '60%' }}
          />
        </div>
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3 z-10">
          <div className={`${status.bg} ${status.border} border backdrop-blur-sm rounded-lg px-2.5 py-1 flex items-center gap-1.5`}>
            <span className={`text-xs ${status.color} font-bold animate-pulse`}>{status.icon}</span>
            <span className={`text-[10px] font-bold tracking-wider ${status.color}`}>{status.label}</span>
          </div>
        </div>
        
        {/* Category Badge */}
        <div className="absolute top-3 right-3 z-10">
          <div className={`${colors.bg} ${colors.border} border backdrop-blur-sm rounded-lg px-2.5 py-1`}>
            <span className={`text-[10px] font-bold tracking-wider ${colors.text}`}>{label}</span>
          </div>
        </div>
        
        {/* Maintenance Lock Overlay */}
        {isMaintenance && (
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm z-20 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 bg-red-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="text-red-400 text-sm font-medium">Bakımda</p>
            </div>
          </div>
        )}
        
        {/* Image */}
        <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 relative overflow-hidden">
          {project.image ? (
            <img 
              src={project.image} 
              alt={project.name} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          )}
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-60"></div>
        </div>
        
        {/* Content */}
        <div className="p-5">
          <h3 className="text-white font-bold text-lg mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 transition-all duration-300">
            {project.name}
          </h3>
          <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed">
            {project.description}
          </p>
          
          {/* Launch Type Indicator */}
          {project.launch_type === 'iframe' && !isMaintenance && (
            <div className="flex items-center gap-1.5 mt-3">
              <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.583-4.583a1 1 0 012 0v11.166a1 1 0 01-2 0L15 14H5a1 1 0 01-1-1V9a1 1 0 011-1h10z" />
              </svg>
              <span className="text-cyan-400/80 text-xs font-medium">Site İçi Oynat</span>
            </div>
          )}
          
          {project.launch_type === 'download' && !isMaintenance && (
            <div className="flex items-center gap-1.5 mt-3">
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="text-green-400/80 text-xs font-medium">İndirilebilir</span>
            </div>
          )}
          
          {/* Bottom Stars/Progress */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-800/50">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <svg 
                  key={i} 
                  className={`w-3.5 h-3.5 ${i < (project.category.includes('completed') ? 5 : 3) ? 'text-yellow-400' : 'text-gray-700'} transition-colors`} 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            
            {project.category.includes('dev') && !isMaintenance && (
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></div>
                <span className="text-yellow-400/80 text-xs font-medium">Geliştiriliyor</span>
              </div>
            )}
            
            {project.category.includes('completed') && !isMaintenance && (
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-green-400/80 text-xs font-medium">Hazır</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Burst Effect */}
      {isBursting && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-20">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/40 via-purple-500/40 to-pink-500/40 animate-ping rounded-2xl"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 border-2 border-cyan-400/60 rounded-full animate-ping"></div>
          </div>
        </div>
      )}
    </div>
  );
}