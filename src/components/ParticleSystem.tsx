import { useEffect, useRef, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

const PARTICLE_COLORS = [
  'rgba(139, 92, 246, 0.8)',
  'rgba(59, 130, 246, 0.8)',
  'rgba(6, 182, 212, 0.8)',
  'rgba(168, 85, 247, 0.6)',
];

export function ParticleSystem() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, vx: 0, vy: 0, lastX: 0, lastY: 0, lastTime: Date.now() });
  const animationRef = useRef<number | null>(null);

  const createParticle = useCallback((x: number, y: number, vx: number, vy: number): Particle => {
    return {
      x,
      y,
      vx: vx * 0.3 + (Math.random() - 0.5) * 2,
      vy: vy * 0.3 + (Math.random() - 0.5) * 2,
      life: 1,
      maxLife: 0.8 + Math.random() * 0.4,
      size: 1 + Math.random() * 2,
      color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)]
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      const timeDiff = now - mouseRef.current.lastTime;
      
      if (timeDiff > 0) {
        const dx = e.clientX - mouseRef.current.lastX;
        const dy = e.clientY - mouseRef.current.lastY;
        const speed = Math.sqrt(dx * dx + dy * dy) / timeDiff;
        
        mouseRef.current.vx = dx;
        mouseRef.current.vy = dy;
        
        // Only create particles when moving fast enough
        if (speed > 0.3) {
          const numParticles = Math.min(Math.floor(speed * 3), 5);
          for (let i = 0; i < numParticles; i++) {
            particlesRef.current.push(
              createParticle(
                e.clientX + (Math.random() - 0.5) * 10,
                e.clientY + (Math.random() - 0.5) * 10,
                -dx * 0.1,
                -dy * 0.1
              )
            );
          }
        }
      }
      
      mouseRef.current.lastX = e.clientX;
      mouseRef.current.lastY = e.clientY;
      mouseRef.current.lastTime = now;
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particlesRef.current = particlesRef.current.filter(p => {
        p.life -= 0.016 / p.maxLife;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.02; // slight gravity
        p.vx *= 0.99;
        p.vy *= 0.99;
        
        if (p.life <= 0) return false;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fillStyle = p.color.replace('0.8', `${p.life * 0.8}`).replace('0.6', `${p.life * 0.6}`);
        ctx.fill();
        
        return true;
      });
      
      // Limit particles to prevent performance issues
      if (particlesRef.current.length > 100) {
        particlesRef.current = particlesRef.current.slice(-100);
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [createParticle]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.7 }}
    />
  );
}
