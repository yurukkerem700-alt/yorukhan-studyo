import { useState, useEffect, useRef, useCallback } from 'react';

interface DragonGameProps {
  onClose: () => void;
  onFeedback: (rating: number, liked: boolean) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface DataCube {
  x: number;
  y: number;
  size: number;
  pulse: number;
}

export function DragonArcadeGame({ onClose, onFeedback }: DragonGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const particlesRef = useRef<Particle[]>([]);
  const dataCubesRef = useRef<DataCube[]>([]);
  const mouseRef = useRef({ x: 400, y: 300 });
  const animationRef = useRef<number | undefined>(undefined);

  // Dragon skeleton structure
  const dragonRef = useRef({
    segments: 20,
    segLength: 15,
    baseX: 400,
    baseY: 300,
    angle: 0,
    velocity: { x: 0, y: 0 }
  });

  // Initialize data cubes
  useEffect(() => {
    const spawnCube = () => {
      if (dataCubesRef.current.length < 8) {
        dataCubesRef.current.push({
          x: 50 + Math.random() * 700,
          y: 50 + Math.random() * 500,
          size: 20,
          pulse: Math.random() * Math.PI * 2
        });
      }
    };
    
    const interval = setInterval(spawnCube, 2000);
    spawnCube();
    spawnCube();
    spawnCube();
    
    return () => clearInterval(interval);
  }, []);

  // Timer
  useEffect(() => {
    if (gameOver || showFeedback) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameOver(true);
          setShowFeedback(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [gameOver, showFeedback]);

  // Mouse tracking
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }, []);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dragon = dragonRef.current;
    const positions: { x: number; y: number }[] = [];
    for (let i = 0; i < dragon.segments; i++) {
      positions.push({ x: dragon.baseX, y: dragon.baseY });
    }

    const gameLoop = () => {
      // Clear with fade effect
      ctx.fillStyle = 'rgba(5, 10, 25, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw matrix background grid
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Update dragon head position (follow mouse with easing)
      const dx = mouseRef.current.x - positions[0].x;
      const dy = mouseRef.current.y - positions[0].y;
      positions[0].x += dx * 0.15;
      positions[0].y += dy * 0.15;

      // Update body segments
      for (let i = 1; i < positions.length; i++) {
        const prevX = positions[i - 1].x;
        const prevY = positions[i - 1].y;
        const currX = positions[i].x;
        const currY = positions[i].y;
        
        const angle = Math.atan2(currY - prevY, currX - prevX);
        positions[i].x = prevX + Math.cos(angle) * dragon.segLength;
        positions[i].y = prevY + Math.sin(angle) * dragon.segLength;
      }

      // Spawn particles from head
      if (Math.random() < 0.3) {
        particlesRef.current.push({
          x: positions[0].x,
          y: positions[0].y,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2 + 1,
          life: 60,
          maxLife: 60,
          color: Math.random() > 0.5 ? '#00f3ff' : '#a855f7',
          size: 2 + Math.random() * 3
        });
      }

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        
        if (p.life <= 0) return false;
        
        const alpha = p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;
        
        return true;
      });

      // Draw data cubes
      dataCubesRef.current.forEach((cube, index) => {
        cube.pulse += 0.05;
        const pulseScale = 1 + Math.sin(cube.pulse) * 0.2;
        
        // Check collision with dragon head
        const distToHead = Math.hypot(positions[0].x - cube.x, positions[0].y - cube.y);
        if (distToHead < cube.size * pulseScale + 15) {
          // Collect cube
          setScore(s => s + 10);
          // Explosion particles
          for (let i = 0; i < 15; i++) {
            particlesRef.current.push({
              x: cube.x,
              y: cube.y,
              vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 0.5) * 8,
              life: 30,
              maxLife: 30,
              color: '#22c55e',
              size: 3 + Math.random() * 4
            });
          }
          // Remove cube and spawn new one
          dataCubesRef.current.splice(index, 1);
          setTimeout(() => {
            dataCubesRef.current.push({
              x: 50 + Math.random() * 700,
              y: 50 + Math.random() * 500,
              size: 20,
              pulse: Math.random() * Math.PI * 2
            });
          }, 1000);
          return;
        }
        
        // Draw cube
        ctx.save();
        ctx.translate(cube.x, cube.y);
        ctx.rotate(cube.pulse * 0.5);
        ctx.scale(pulseScale, pulseScale);
        
        // Glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#22c55e';
        
        // Cube shape
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.strokeRect(-cube.size/2, -cube.size/2, cube.size, cube.size);
        
        // Inner glow
        ctx.fillStyle = 'rgba(34, 197, 94, 0.3)';
        ctx.fillRect(-cube.size/2, -cube.size/2, cube.size, cube.size);
        
        // Data symbol
        ctx.fillStyle = '#22c55e';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('01', 0, 4);
        
        ctx.restore();
      });

      // Draw dragon skeleton
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00f3ff';
      
      // Draw spine
      ctx.beginPath();
      ctx.moveTo(positions[0].x, positions[0].y);
      for (let i = 1; i < positions.length; i++) {
        ctx.lineTo(positions[i].x, positions[i].y);
      }
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Draw ribs
      for (let i = 2; i < positions.length - 2; i += 2) {
        const pos = positions[i];
        const nextPos = positions[i + 1];
        const angle = Math.atan2(nextPos.y - pos.y, nextPos.x - pos.x);
        
        ctx.beginPath();
        const ribLength = 12 + Math.sin(i * 0.5) * 5;
        ctx.moveTo(
          pos.x + Math.cos(angle + Math.PI/2) * ribLength,
          pos.y + Math.sin(angle + Math.PI/2) * ribLength
        );
        ctx.lineTo(pos.x, pos.y);
        ctx.lineTo(
          pos.x + Math.cos(angle - Math.PI/2) * ribLength,
          pos.y + Math.sin(angle - Math.PI/2) * ribLength
        );
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.7)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      // Draw head
      ctx.beginPath();
      ctx.arc(positions[0].x, positions[0].y, 12, 0, Math.PI * 2);
      ctx.fillStyle = '#00f3ff';
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#00f3ff';
      ctx.fill();
      
      // Eyes
      const eyeOffset = 5;
      ctx.fillStyle = '#fff';
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(positions[0].x - eyeOffset, positions[0].y - 4, 3, 0, Math.PI * 2);
      ctx.arc(positions[0].x + eyeOffset, positions[0].y - 4, 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Pupils (follow mouse direction)
      const pupilAngle = Math.atan2(mouseRef.current.y - positions[0].y, mouseRef.current.x - positions[0].x);
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(positions[0].x - eyeOffset + Math.cos(pupilAngle) * 1.5, positions[0].y - 4 + Math.sin(pupilAngle) * 1.5, 1.5, 0, Math.PI * 2);
      ctx.arc(positions[0].x + eyeOffset + Math.cos(pupilAngle) * 1.5, positions[0].y - 4 + Math.sin(pupilAngle) * 1.5, 1.5, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.shadowBlur = 0;
      
      animationRef.current = requestAnimationFrame(gameLoop);
    };
    
    gameLoop();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const handleFeedbackSubmit = (rating: number, liked: boolean) => {
    onFeedback(rating, liked);
    setShowFeedback(false);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-950">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 h-14 bg-gray-900/90 backdrop-blur border-b border-cyan-500/20 flex items-center justify-between px-4 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">🐉</span>
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">İskelet Ejderha</h3>
            <p className="text-gray-500 text-xs">Mini Simülasyon</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Score */}
          <div className="bg-gray-800/50 border border-cyan-500/20 rounded-lg px-4 py-1.5">
            <span className="text-gray-400 text-xs">SKOR: </span>
            <span className="text-cyan-400 font-bold">{score}</span>
          </div>
          
          {/* Timer */}
          <div className="bg-gray-800/50 border border-purple-500/20 rounded-lg px-4 py-1.5">
            <span className="text-gray-400 text-xs">SÜRE: </span>
            <span className={`font-bold ${timeLeft <= 10 ? 'text-red-400' : 'text-purple-400'}`}>{timeLeft}s</span>
          </div>
          
          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="cursor-none"
        onMouseMove={handleMouseMove}
        style={{ background: 'linear-gradient(to bottom, #050a19, #0a1628)' }}
      />
      
      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900/80 backdrop-blur border border-gray-700/50 rounded-xl px-6 py-3">
        <p className="text-gray-400 text-sm text-center">
          🖱️ Fareyi hareket ettirerek ejderhayı kontrol et • <span className="text-green-400">Yeşil küpleri</span> topla!
        </p>
      </div>
      
      {/* Feedback Widget */}
      {showFeedback && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900/95 border border-purple-500/30 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl shadow-purple-500/20">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center">
                <span className="text-3xl">🎮</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Simülasyon Tamamlandı!</h3>
              <p className="text-gray-400">Skorun: <span className="text-cyan-400 font-bold text-2xl">{score}</span></p>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-300 text-sm text-center mb-4">Bu deneysel mini simülasyonu sevdiniz mi?</p>
              
              {/* Thumbs */}
              <div className="flex justify-center gap-4 mb-4">
                <button
                  onClick={() => handleFeedbackSubmit(5, true)}
                  className="w-14 h-14 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-xl flex items-center justify-center text-2xl transition-all hover:scale-110"
                >
                  👍
                </button>
                <button
                  onClick={() => handleFeedbackSubmit(1, false)}
                  className="w-14 h-14 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl flex items-center justify-center text-2xl transition-all hover:scale-110"
                >
                  👎
                </button>
              </div>
              
              {/* Stars */}
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => handleFeedbackSubmit(star, star >= 4)}
                    className="w-10 h-10 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 rounded-lg flex items-center justify-center text-xl transition-all hover:scale-110"
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold py-3 rounded-xl transition-all border border-gray-700"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}