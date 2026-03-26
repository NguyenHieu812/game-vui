'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, RotateCcw, Plus, X, Sparkles, BookOpen } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playSound } from '@/lib/sounds';

interface Player {
  id: string;
  name: string;
  color: string;
}

const WHEEL_COLORS = [
  '#fde047', '#f87171', '#60a5fa', '#4ade80', 
  '#c084fc', '#f472b6', '#fb923c', '#2dd4bf'
];

const triggerConfetti = () => {
  const duration = 3000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#facc15', '#f87171', '#60a5fa']
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#facc15', '#f87171', '#60a5fa']
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };
  frame();
};

export default function LuckyWheel() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [newName, setNewName] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<Player | null>(null);
  const [rotation, setRotation] = useState(0);

  const addPlayer = () => {
    if (!newName.trim()) return;
    if (players.length >= 12) {
      alert('Tối đa 12 người chơi thôi nhé!');
      return;
    }
    
    const newPlayer: Player = {
      id: Math.random().toString(36).substring(7),
      name: newName.trim(),
      color: WHEEL_COLORS[players.length % WHEEL_COLORS.length]
    };
    
    setPlayers([...players, newPlayer]);
    setNewName('');
  };

  const removePlayer = (id: string) => {
    setPlayers(players.filter(p => p.id !== id));
  };

  const spinWheel = () => {
    if (players.length < 2) {
      alert('Cần ít nhất 2 người để quay!');
      return;
    }

    setIsSpinning(true);
    setWinner(null);
    playSound('tick');

    // Calculate spin
    // eslint-disable-next-line react-hooks/purity
    const spins = Math.floor(Math.random() * 5) + 5; // 5 to 10 full spins
    // eslint-disable-next-line react-hooks/purity
    const randomDegree = Math.floor(Math.random() * 360);
    const totalRotation = rotation + (spins * 360) + randomDegree;
    
    setRotation(totalRotation);

    // Calculate winner
    // The pointer is at the top (0 degrees or 360 degrees)
    // We need to find which slice is at the top after rotation
    setTimeout(() => {
      const normalizedRotation = totalRotation % 360;
      const sliceAngle = 360 / players.length;
      
      // The wheel rotates clockwise. The pointer is at 0 degrees (top).
      // If we rotate by X degrees, the slice that was at 360 - X is now at the top.
      // Actually, SVG starts 0 at right (3 o'clock). Let's adjust.
      // Let's just use a simple math:
      // Pointer is at top (-90 deg in standard math, but let's say it's at 270 deg of the wheel).
      // It's easier to just calculate based on the visual rotation.
      
      // Let's refine the winner calculation:
      // Each slice is `sliceAngle` degrees.
      // Slice 0 starts at 0 degrees, goes to `sliceAngle`.
      // If wheel rotates by `R` degrees, Slice 0 is now at `R` to `R + sliceAngle`.
      // Pointer is at top. Let's say top is 270 degrees in SVG space, or we can just rotate the whole SVG by -90 deg initially.
      // If SVG is rotated -90 deg initially, 0 is at top.
      // So pointer is at 0 degrees.
      // After rotating `R` degrees, the angle at the pointer is `360 - (R % 360)`.
      const pointerAngle = (360 - (normalizedRotation % 360)) % 360;
      const winningIndex = Math.floor(pointerAngle / sliceAngle);
      
      const winningPlayer = players[winningIndex];
      
      setWinner(winningPlayer);
      setIsSpinning(false);
      playSound('win');
      triggerConfetti();
    }, 5000); // Match the animation duration
  };

  const resetWheel = () => {
    setWinner(null);
  };

  // SVG Wheel Generation
  const createWheelSlices = () => {
    if (players.length === 0) return null;
    if (players.length === 1) {
      return <circle cx="50" cy="50" r="50" fill={players[0].color} />;
    }

    const sliceAngle = 360 / players.length;
    let currentAngle = 0;

    return players.map((player, index) => {
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      
      // Convert polar to cartesian
      const startX = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
      const startY = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
      const endX = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
      const endY = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);

      const largeArcFlag = sliceAngle > 180 ? 1 : 0;

      const pathData = [
        `M 50 50`,
        `L ${startX} ${startY}`,
        `A 50 50 0 ${largeArcFlag} 1 ${endX} ${endY}`,
        `Z`
      ].join(' ');

      // Calculate text position
      const textAngle = startAngle + sliceAngle / 2;
      const textX = 50 + 30 * Math.cos((Math.PI * textAngle) / 180);
      const textY = 50 + 30 * Math.sin((Math.PI * textAngle) / 180);

      currentAngle += sliceAngle;

      return (
        <g key={player.id}>
          <path d={pathData} fill={player.color} stroke="#fff" strokeWidth="1" />
          <text
            x={textX}
            y={textY}
            fill="#000"
            fontSize="4"
            fontWeight="bold"
            textAnchor="middle"
            alignmentBaseline="middle"
            transform={`rotate(${textAngle}, ${textX}, ${textY})`}
            className="opacity-70"
          >
            {player.name}
          </text>
        </g>
      );
    });
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border-4 border-purple-200 p-6 md:p-8 w-full">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-purple-600 flex items-center gap-2">
            <Sparkles className="w-8 h-8" />
            Vòng Quay May Mắn
          </h2>
          <p className="text-slate-500 font-medium">Thêm tên và quay để tìm người may mắn!</p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-purple-50 text-purple-800 p-4 rounded-2xl mb-6 text-sm border border-purple-100">
        <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
          <BookOpen className="w-5 h-5" /> Hướng dẫn chơi:
        </h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Nhập tên người chơi vào ô trống và ấn nút <strong>+</strong> (tối đa 12 người).</li>
          <li>Ấn <strong>Quay ngay</strong> để bắt đầu vòng quay may mắn.</li>
          <li>Mũi tên chỉ vào ai khi vòng quay dừng lại, người đó sẽ chiến thắng!</li>
        </ul>
      </div>

      {/* Setup Area */}
      {!isSpinning && !winner && (
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
              placeholder="Tên người chơi..."
              className="px-4 py-3 rounded-2xl border-2 border-purple-200 focus:border-purple-400 focus:outline-none w-full md:w-48 font-medium"
              maxLength={15}
            />
            <button
              onClick={addPlayer}
              disabled={players.length >= 12}
              className="p-3 bg-purple-100 text-purple-600 rounded-2xl hover:bg-purple-200 transition-colors disabled:opacity-50"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8 items-center justify-center mb-8">
        {/* Wheel Container */}
        <div className="relative w-64 h-64 md:w-80 md:h-80 flex-shrink-0">
          {/* Pointer */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 text-4xl filter drop-shadow-md">
            👇
          </div>
          
          {/* Wheel */}
          <div className="w-full h-full rounded-full border-4 border-purple-300 shadow-inner overflow-hidden relative bg-slate-100">
            {players.length > 0 ? (
              <motion.svg
                viewBox="0 0 100 100"
                className="w-full h-full origin-center"
                initial={{ rotate: -90 }} // Start with 0 degrees at top
                animate={{ rotate: rotation - 90 }}
                transition={{ duration: 5, ease: [0.2, 0.8, 0.2, 1] }} // Custom ease for spinning effect
              >
                {createWheelSlices()}
              </motion.svg>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-purple-300 font-bold text-center p-4">
                Chưa có ai tham gia!
              </div>
            )}
          </div>
        </div>

        {/* Player List */}
        <div className="w-full md:w-64 flex flex-col gap-2 max-h-80 overflow-y-auto pr-2">
          <AnimatePresence>
            {players.map((player) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center justify-between p-3 rounded-xl border-2 border-slate-100 bg-white shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: player.color }}
                  ></div>
                  <span className="font-bold text-slate-700">{player.name}</span>
                </div>
                {!isSpinning && !winner && (
                  <button
                    onClick={() => removePlayer(player.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
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
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-3xl font-bold text-purple-600 mb-2">
              Chúc mừng <span className="px-3 py-1 rounded-xl text-white" style={{ backgroundColor: winner.color }}>{winner.name}</span>!
            </h3>
            <p className="text-slate-500 font-medium mb-6">Là người may mắn nhất hôm nay!</p>
            <button
              onClick={resetWheel}
              className="px-8 py-4 bg-purple-500 text-white rounded-full font-bold text-xl hover:bg-purple-600 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 mx-auto"
            >
              <RotateCcw className="w-6 h-6" />
              Quay lại nào
            </button>
          </motion.div>
        ) : (
          <button
            onClick={spinWheel}
            disabled={isSpinning || players.length < 2}
            className="px-8 py-4 bg-green-500 text-white rounded-full font-bold text-xl hover:bg-green-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Play className="w-6 h-6" />
            {isSpinning ? 'Đang quay...' : 'Quay ngay!'}
          </button>
        )}
      </div>
    </div>
  );
}
