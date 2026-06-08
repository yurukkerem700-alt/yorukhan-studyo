import { useRef, useState, useCallback } from 'react';

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  strength?: number;
}

export function MagneticButton({ children, className = '', onClick, strength = 0.25 }: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isNear, setIsNear] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
    
    const radius = 50;
    
    if (distance < radius) {
      setIsNear(true);
      const factor = 1 - distance / radius;
      setPosition({
        x: distanceX * factor * strength,
        y: distanceY * factor * strength
      });
    } else {
      setIsNear(false);
      setPosition({ x: 0, y: 0 });
    }
  }, [strength]);

  const handleMouseLeave = useCallback(() => {
    setIsNear(false);
    setPosition({ x: 0, y: 0 });
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: isNear ? 'transform 0.12s ease-out' : 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}
    >
      {children}
    </div>
  );
}
