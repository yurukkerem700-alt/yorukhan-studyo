import { useEffect, useRef, useCallback } from 'react';

interface InteractionData {
  hoverDuration: number;
  clickCount: number;
  rapidMovements: number;
  totalMovement: number;
  magneticInteractions: number;
  velocities: number[];
  sessionStart: number;
}

export function useInteractionTracker() {
  const dataRef = useRef<InteractionData>({
    hoverDuration: 0,
    clickCount: 0,
    rapidMovements: 0,
    totalMovement: 0,
    magneticInteractions: 0,
    velocities: [],
    sessionStart: Date.now()
  });
  
  const lastPosRef = useRef({ x: 0, y: 0 });
  const lastTimeRef = useRef(Date.now());
  const hoverStartRef = useRef<number | null>(null);
  const magneticStartRef = useRef<number | null>(null);

  const trackMouseMove = useCallback((e: React.MouseEvent) => {
    const now = Date.now();
    const dt = now - lastTimeRef.current;
    
    if (dt > 0 && dt < 100) {
      const dx = e.clientX - lastPosRef.current.x;
      const dy = e.clientY - lastPosRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const velocity = distance / dt;
      
      dataRef.current.totalMovement += distance;
      dataRef.current.velocities.push(velocity);
      
      if (dataRef.current.velocities.length > 50) {
        dataRef.current.velocities.shift();
      }
      
      if (velocity > 1.5) {
        dataRef.current.rapidMovements++;
      }
    }
    
    lastPosRef.current = { x: e.clientX, y: e.clientY };
    lastTimeRef.current = now;
  }, []);

  const trackHoverStart = useCallback(() => {
    hoverStartRef.current = Date.now();
  }, []);

  const trackHoverEnd = useCallback(() => {
    if (hoverStartRef.current) {
      const duration = Date.now() - hoverStartRef.current;
      dataRef.current.hoverDuration += duration;
      hoverStartRef.current = null;
    }
  }, []);

  const trackMagneticStart = useCallback(() => {
    magneticStartRef.current = Date.now();
    dataRef.current.magneticInteractions++;
  }, []);

  const trackMagneticEnd = useCallback(() => {
    magneticStartRef.current = null;
  }, []);

  const trackClick = useCallback(() => {
    dataRef.current.clickCount++;
  }, []);

  const getMetrics = useCallback(() => {
    const avgVelocity = dataRef.current.velocities.length > 0
      ? dataRef.current.velocities.reduce((a, b) => a + b, 0) / dataRef.current.velocities.length
      : 0;
    
    return {
      hoverDuration: dataRef.current.hoverDuration,
      clickCount: dataRef.current.clickCount,
      rapidMovements: dataRef.current.rapidMovements,
      totalMovement: dataRef.current.totalMovement,
      magneticInteractions: dataRef.current.magneticInteractions,
      avgVelocity,
      sessionDuration: Date.now() - dataRef.current.sessionStart
    };
  }, []);

  const getInteractionLabel = useCallback(() => {
    const metrics = getMetrics();
    const { rapidMovements, avgVelocity, hoverDuration, clickCount, magneticInteractions } = metrics;
    
    if (rapidMovements > 20 || avgVelocity > 0.8) {
      return 'Sabırsız';
    }
    
    if (hoverDuration > 5000 && clickCount > 5 && magneticInteractions > 2) {
      return 'Kaşif';
    }
    
    if (hoverDuration > 3000 && rapidMovements < 10) {
      return 'Odaklanmış';
    }
    
    return 'Normal';
  }, [getMetrics]);

  useEffect(() => {
    return () => {
      dataRef.current = {
        hoverDuration: 0,
        clickCount: 0,
        rapidMovements: 0,
        totalMovement: 0,
        magneticInteractions: 0,
        velocities: [],
        sessionStart: Date.now()
      };
    };
  }, []);

  return {
    trackMouseMove,
    trackHoverStart,
    trackHoverEnd,
    trackMagneticStart,
    trackMagneticEnd,
    trackClick,
    getMetrics,
    getInteractionLabel
  };
}