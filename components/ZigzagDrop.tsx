'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, RotateCcw, Plus, X, ArrowDown, BookOpen } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playSound } from '@/lib/sounds';

interface Player {
  id: string;
  name: string;
  color: string;
}

const BALL_COLORS = [
  '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'
];

interface Ball {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  name: string;
  finished: boolean;
}

interface Peg {
  x: number;
  y: number;
  r: number;
}

interface Obstacle {
  x: number;
  y: number;
  w: number;
  h: number;
  active: boolean;
  timer: number;
}

const triggerConfetti = () => {
  const duration = 3000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 5, angle: 60, spread: 55, origin: { x: 0 },
      colors: ['#facc15', '#ef4444', '#3b82f6', '#10b981']
    });
    confetti({
      particleCount: 5, angle: 120, spread: 55, origin: { x: 1 },
      colors: ['#facc15', '#ef4444', '#3b82f6', '#10b981']
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
};

export default function ZigzagDrop() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [newName, setNewName] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [winner, setWinner] = useState<Player | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  
  const ballsRef = useRef<Ball[]>([]);
  const pegsRef = useRef<Peg[]>([]);
  const obstaclesRef = useRef<Obstacle[]>([]);
  
  const playersRef = useRef(players);
  useEffect(() => { playersRef.current = players; }, [players]);
  
  const winnerRef = useRef(winner);
  useEffect(() => { winnerRef.current = winner; }, [winner]);

  const drawFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw pegs
    ctx.fillStyle = '#cbd5e1';
    pegsRef.current.forEach(peg => {
      ctx.beginPath();
      ctx.arc(peg.x, peg.y, peg.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw obstacles
    obstaclesRef.current.forEach(obs => {
      if (obs.active) {
        ctx.fillStyle = '#f87171';
        ctx.fillRect(obs.x - obs.w/2, obs.y - obs.h/2, obs.w, obs.h);
        ctx.strokeStyle = '#b91c1c';
        ctx.lineWidth = 2;
        ctx.strokeRect(obs.x - obs.w/2, obs.y - obs.h/2, obs.w, obs.h);
      }
    });

    // Draw balls
    ballsRef.current.forEach(ball => {
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, 12, 0, Math.PI * 2);
      ctx.fillStyle = ball.color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ball.name.substring(0, 2).toUpperCase(), ball.x, ball.y);
    });
  };

  // Initialize pegs and obstacles
  useEffect(() => {
    const pegs: Peg[] = [];
    const rows = 12;
    const cols = 9;
    const spacingX = 600 / cols;
    const spacingY = 500 / rows;
    
    for (let i = 2; i < rows; i++) {
      const isOffset = i % 2 === 0;
      const currentCols = isOffset ? cols + 1 : cols;
      for (let j = 0; j < currentCols; j++) {
        pegs.push({
          x: j * spacingX + (isOffset ? 0 : spacingX / 2),
          y: i * spacingY,
          r: 6
        });
      }
    }
    pegsRef.current = pegs;

    const obstacles: Obstacle[] = [];
    for (let i = 0; i < 6; i++) {
      obstacles.push({
        x: 100 + Math.random() * 400,
        y: 150 + Math.random() * 300,
        w: 60 + Math.random() * 40,
        h: 12,
        active: false,
        timer: Math.random() * 100
      });
    }
    obstaclesRef.current = obstacles;
    
    // Initial draw
    drawFrame();
    
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const updatePhysics = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Update obstacles
    obstaclesRef.current.forEach(obs => {
      obs.timer--;
      if (obs.timer <= 0) {
        obs.active = !obs.active;
        obs.timer = 60 + Math.random() * 120; // 1 to 3 seconds at 60fps
      }
    });

    let allFinished = true;
    let currentWinner: Player | null = null;
    let playedTick = false;

    // Update balls
    ballsRef.current.forEach(ball => {
      if (ball.finished) return;
      allFinished = false;

      // Physics
      ball.vy += 0.2; // gravity
      ball.vx *= 0.99; // friction
      ball.vy *= 0.99;

      ball.x += ball.vx;
      ball.y += ball.vy;

      const radius = 12;

      // Wall collisions
      if (ball.x < radius) {
        ball.x = radius;
        ball.vx *= -0.6;
      } else if (ball.x > canvas.width - radius) {
        ball.x = canvas.width - radius;
        ball.vx *= -0.6;
      }

      // Peg collisions
      pegsRef.current.forEach(peg => {
        const dx = ball.x - peg.x;
        const dy = ball.y - peg.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < radius + peg.r) {
          // Resolve collision
          const angle = Math.atan2(dy, dx);
          const overlap = radius + peg.r - dist;
          ball.x += Math.cos(angle) * overlap;
          ball.y += Math.sin(angle) * overlap;
          
          // Bounce
          const nx = dx / dist;
          const ny = dy / dist;
          const p = 2 * (ball.vx * nx + ball.vy * ny) / 2;
          ball.vx = ball.vx - p * nx * 0.7;
          ball.vy = ball.vy - p * ny * 0.7;

          // Add some randomness
          ball.vx += (Math.random() - 0.5) * 2;
          
          if (!playedTick && Math.random() > 0.8) {
            playSound('tick');
            playedTick = true;
          }
        }
      });

      // Obstacle collisions
      obstaclesRef.current.forEach(obs => {
        if (!obs.active) return;
        const hw = obs.w / 2;
        const hh = obs.h / 2;
        
        let closestX = Math.max(obs.x - hw, Math.min(ball.x, obs.x + hw));
        let closestY = Math.max(obs.y - hh, Math.min(ball.y, obs.y + hh));
        
        const dx = ball.x - closestX;
        const dy = ball.y - closestY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < radius) {
          if (Math.abs(dx) > Math.abs(dy)) {
            ball.vx *= -0.6;
            ball.x += dx > 0 ? radius - dist : -(radius - dist);
          } else {
            ball.vy *= -0.6;
            ball.y += dy > 0 ? radius - dist : -(radius - dist);
          }
          if (!playedTick && Math.random() > 0.5) {
            playSound('pop');
            playedTick = true;
          }
        }
      });

      // Finish line
      if (ball.y > canvas.height - radius) {
        ball.y = canvas.height - radius;
        ball.finished = true;
        ball.vx = 0;
        ball.vy = 0;
        if (!winnerRef.current && !currentWinner) {
          currentWinner = playersRef.current.find(p => p.id === ball.id) || null;
        }
      }
    });

    drawFrame();

    if (currentWinner && !winnerRef.current) {
      setWinner(currentWinner);
      playSound('win');
      triggerConfetti();
    }

    if (!allFinished) {
      requestRef.current = requestAnimationFrame(updatePhysics);
    } else {
      setIsPlaying(false);
    }
  };

  const addPlayer = () => {
    if (!newName.trim()) return;
    if (players.length >= 5) {
      alert('Tối đa 5 người chơi thôi nhé!');
      return;
    }
    
    const newPlayer: Player = {
      id: Math.random().toString(36).substring(7),
      name: newName.trim(),
      color: BALL_COLORS[players.length % BALL_COLORS.length]
    };
    
    setPlayers([...players, newPlayer]);
    setNewName('');
    
    // Add ball for preview
    ballsRef.current.push({
      id: newPlayer.id,
      name: newPlayer.name,
      color: newPlayer.color,
      x: 100 + players.length * 100,
      y: 30,
      vx: 0,
      vy: 0,
      finished: false
    });
    drawFrame();
  };

  const removePlayer = (id: string) => {
    setPlayers(players.filter(p => p.id !== id));
    ballsRef.current = ballsRef.current.filter(b => b.id !== id);
    drawFrame();
  };

  const startGame = () => {
    if (players.length < 1) {
      alert('Cần ít nhất 1 người chơi!');
      return;
    }
    
    setIsPlaying(true);
    setWinner(null);
    playSound('pop');

    // Reset balls
    const spacing = 600 / (players.length + 1);
    ballsRef.current = players.map((p, i) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      x: spacing * (i + 1) + (Math.random() * 20 - 10),
      y: 30 + (Math.random() * 10),
      vx: (Math.random() - 0.5) * 4,
      vy: 0,
      finished: false
    }));

    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    requestRef.current = requestAnimationFrame(updatePhysics);
  };

  const resetGame = () => {
    setIsPlaying(false);
    setWinner(null);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    
    // Reset balls to top
    const spacing = 600 / (players.length + 1);
    ballsRef.current = players.map((p, i) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      x: spacing * (i + 1),
      y: 30,
      vx: 0,
      vy: 0,
      finished: false
    }));
    drawFrame();
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border-4 border-emerald-200 p-6 md:p-8 w-full">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-emerald-600 flex items-center gap-2">
            <ArrowDown className="w-8 h-8" />
            Thả Bóng Zick Zac
          </h2>
          <p className="text-slate-500 font-medium">Thả bóng rơi qua mê cung, ai xuống trước sẽ thắng!</p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl mb-6 text-sm border border-emerald-100">
        <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
          <BookOpen className="w-5 h-5" /> Hướng dẫn chơi:
        </h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Thêm tên người chơi (tối đa 5 người). Mỗi người sẽ có một quả bóng màu riêng.</li>
          <li>Ấn <strong>Thả bóng!</strong> để tất cả bóng cùng rơi xuống mê cung.</li>
          <li>Các chướng ngại vật màu đỏ sẽ xuất hiện ngẫu nhiên để cản đường.</li>
          <li>Quả bóng nào rơi xuống đáy mê cung đầu tiên sẽ giành chiến thắng!</li>
        </ul>
      </div>

      {/* Setup Area */}
      {!isPlaying && !winner && (
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
              placeholder="Tên người chơi..."
              className="px-4 py-3 rounded-2xl border-2 border-emerald-200 focus:border-emerald-400 focus:outline-none w-full md:w-48 font-medium"
              maxLength={10}
            />
            <button
              onClick={addPlayer}
              disabled={players.length >= 5}
              className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl hover:bg-emerald-200 transition-colors disabled:opacity-50"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Players List */}
      {!isPlaying && !winner && players.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-8">
          <AnimatePresence>
            {players.map((player) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-white px-4 py-2 rounded-full font-bold flex items-center gap-2 shadow-sm"
                style={{ backgroundColor: player.color }}
              >
                <div className="w-3 h-3 rounded-full bg-white/50"></div>
                {player.name}
                <button
                  onClick={() => removePlayer(player.id)}
                  className="ml-1 hover:bg-white/20 rounded-full p-1 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Game Area */}
      <div className="flex flex-col items-center justify-center mb-8">
        <div className="relative w-full max-w-[600px] aspect-square bg-slate-50 rounded-3xl border-4 border-slate-200 overflow-hidden shadow-inner">
          <canvas
            ref={canvasRef}
            width={600}
            height={600}
            className="w-full h-full"
          />
        </div>
      </div>

      {/* Controls & Winner */}
      <div className="flex flex-col items-center justify-center min-h-[100px]">
        {winner ? (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="text-center"
          >
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-3xl font-bold text-emerald-600 mb-2">
              Chúc mừng <span className="px-3 py-1 rounded-xl text-white" style={{ backgroundColor: winner.color }}>{winner.name}</span>!
            </h3>
            <p className="text-slate-500 font-medium mb-6">Đã thoát khỏi mê cung đầu tiên!</p>
            <button
              onClick={resetGame}
              className="px-8 py-4 bg-emerald-500 text-white rounded-full font-bold text-xl hover:bg-emerald-600 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 mx-auto"
            >
              <RotateCcw className="w-6 h-6" />
              Chơi lại nào
            </button>
          </motion.div>
        ) : (
          <div className="flex gap-4">
            <button
              onClick={startGame}
              disabled={isPlaying || players.length < 1}
              className="px-8 py-4 bg-green-500 text-white rounded-full font-bold text-xl hover:bg-green-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Play className="w-6 h-6" />
              Thả bóng!
            </button>
            {isPlaying && (
              <button
                onClick={resetGame}
                className="px-6 py-4 bg-slate-200 text-slate-700 rounded-full font-bold text-lg hover:bg-slate-300 transition-all"
              >
                Dừng lại
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
