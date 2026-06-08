import { useState, useCallback } from 'react';

interface MagneticConfig {
  strength?: number;
  radius?: number;
}

export function useMagneticEffect(config: MagneticConfig = {}) {
  const { strength = 0.3, radius = 40 } = config;
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isNear, setIsNear] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>, rect: DOMRect) => {
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
    
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
  }, [strength, radius]);

  const handleMouseLeave = useCallback(() => {
    setIsNear(false);
    setPosition({ x: 0, y: 0 });
  }, []);

  return {
    position,
    isNear,
    handleMouseMove,
    handleMouseLeave,
    style: {
      transform: `translate(${position.x}px, ${position.y}px)`,
      transition: isNear ? 'transform 0.15s ease-out' : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
    }
  };
}

export function useInteractionTracker() {
  const [metrics, setMetrics] = useState({
    hoverDuration: 0,
    clickVelocity: 0,
    mouseVelocity: 0,
    interactionCount: 0,
    lastMoveTime: Date.now(),
    totalMovement: 0,
    rapidMovements: 0
  });

  const [hoverStart, setHoverStart] = useState<number | null>(null);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });

  const trackHoverStart = useCallback(() => {
    setHoverStart(Date.now());
  }, []);

  const trackHoverEnd = useCallback(() => {
    if (hoverStart) {
      const duration = Date.now() - hoverStart;
      setMetrics(prev => ({
        ...prev,
        hoverDuration: prev.hoverDuration + duration,
        interactionCount: prev.interactionCount + 1
      }));
      setHoverStart(null);
    }
  }, [hoverStart]);

  const trackMouseMove = useCallback((e: React.MouseEvent) => {
    const now = Date.now();
    const timeDiff = now - metrics.lastMoveTime;
    
    if (timeDiff > 0) {
      const distance = Math.sqrt(
        Math.pow(e.clientX - lastPosition.x, 2) + 
        Math.pow(e.clientY - lastPosition.y, 2)
      );
      
      const velocity = distance / timeDiff;
      
      setMetrics(prev => {
        const newTotalMovement = prev.totalMovement + distance;
        const newRapidMovements = velocity > 1 ? prev.rapidMovements + 1 : prev.rapidMovements;
        
        return {
          ...prev,
          mouseVelocity: velocity,
          totalMovement: newTotalMovement,
          rapidMovements: newRapidMovements,
          lastMoveTime: now
        };
      });
    }
    
    setLastPosition({ x: e.clientX, y: e.clientY });
  }, [metrics.lastMoveTime, lastPosition]);

  const trackClick = useCallback(() => {
    setMetrics(prev => ({
      ...prev,
      interactionCount: prev.interactionCount + 1
    }));
  }, []);

  const getInteractionLabel = useCallback(() => {
    const { hoverDuration, interactionCount, rapidMovements, mouseVelocity } = metrics;
    const avgVelocity = mouseVelocity;
    
    if (rapidMovements > 20 || avgVelocity > 0.8) {
      return 'Sabırsız';
    } else if (hoverDuration > 5000 && interactionCount > 5) {
      return 'Kaşif';
    } else if (hoverDuration > 3000) {
      return 'Odaklanmış';
    } else {
      return 'Normal';
    }
  }, [metrics]);

  return {
    metrics,
    trackHoverStart,
    trackHoverEnd,
    trackMouseMove,
    trackClick,
    getInteractionLabel
  };
}
