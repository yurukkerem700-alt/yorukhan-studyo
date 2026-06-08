import { useRef, useState, useCallback } from 'react';

interface CyberButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const variants = {
  primary: {
    gradient: 'from-purple-600 via-violet-600 to-purple-600',
    border: 'border-purple-500/30',
    glow: 'shadow-purple-500/30',
    text: 'text-white'
  },
  secondary: {
    gradient: 'from-gray-600 via-gray-500 to-gray-600',
    border: 'border-gray-500/30',
    glow: 'shadow-gray-500/30',
    text: 'text-white'
  },
  danger: {
    gradient: 'from-red-600 via-rose-600 to-red-600',
    border: 'border-red-500/30',
    glow: 'shadow-red-500/30',
    text: 'text-white'
  },
  success: {
    gradient: 'from-emerald-600 via-green-600 to-emerald-600',
    border: 'border-emerald-500/30',
    glow: 'shadow-emerald-500/30',
    text: 'text-white'
  }
};

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg'
};

export function CyberButton({ 
  children, 
  onClick, 
  type = 'button',
  disabled = false,
  variant = 'primary',
  size = 'md',
  className = ''
}: CyberButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  
  const style = variants[variant];
  const sizeClass = sizes[size];

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
    
    if (distance < 50) {
      const factor = 1 - distance / 50;
      setPosition({
        x: distanceX * factor * 0.15,
        y: distanceY * factor * 0.15
      });
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setPosition({ x: 0, y: 0 });
  }, []);

  return (
    <button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className={`
        relative group overflow-hidden rounded-xl font-semibold
        transition-all duration-300
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClass}
        ${className}
      `}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}
    >
      {/* Glow background */}
      <div className={`absolute inset-0 bg-gradient-to-r ${style.gradient} opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500`}></div>
      
      {/* Glass background */}
      <div className={`absolute inset-0 bg-gray-800/80 backdrop-blur-sm border ${style.border} rounded-xl`}></div>
      
      {/* Animated border */}
      <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
        <div className={`absolute inset-0 rounded-xl`} style={{
          background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)`,
          animation: 'shimmer 2s infinite'
        }}></div>
      </div>
      
      {/* Scan line effect */}
      <div className="absolute inset-0 overflow-hidden rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent h-1/2 animate-pulse"></div>
      </div>
      
      {/* Content */}
      <div className={`relative ${style.text} flex items-center justify-center gap-2`}>
        {children}
      </div>
      
      {/* Corner accents */}
      <div className={`absolute top-0 left-0 w-2 h-2 border-t border-l ${style.border} rounded-tl-xl opacity-50`}></div>
      <div className={`absolute top-0 right-0 w-2 h-2 border-t border-r ${style.border} rounded-tr-xl opacity-50`}></div>
      <div className={`absolute bottom-0 left-0 w-2 h-2 border-b border-l ${style.border} rounded-bl-xl opacity-50`}></div>
      <div className={`absolute bottom-0 right-0 w-2 h-2 border-b border-r ${style.border} rounded-br-xl opacity-50`}></div>
    </button>
  );
}

// Icon button variant
export function CyberIconButton({ 
  children, 
  onClick,
  variant = 'primary',
  className = ''
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  className?: string;
}) {
  const style = variants[variant];
  
  return (
    <button
      onClick={onClick}
      className={`
        relative group p-3 rounded-xl overflow-hidden
        bg-gray-800/60 backdrop-blur-sm border ${style.border}
        hover:border-opacity-60 transition-all duration-300
        ${className}
      `}
    >
      {/* Glow on hover */}
      <div className={`absolute inset-0 bg-gradient-to-r ${style.gradient} opacity-0 group-hover:opacity-20 blur-lg transition-opacity duration-300`}></div>
      
      {/* Content */}
      <div className={`relative bg-gradient-to-r ${style.gradient} bg-clip-text text-transparent`}>
        {children}
      </div>
    </button>
  );
}
