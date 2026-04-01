'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, RotateCcw, Plus, X, Trophy, Flag, BookOpen, Map } from 'lucide-react';
import { playSound, startRaceMusic, stopRaceMusic } from '@/lib/sounds';

type MapType = 'straight' | 'curved' | 'winding';

interface Duck {
  id: string;
  name: string;
  progress: number;
  speed: number;
  color: string;
}

const DUCK_COLORS = [
  'bg-yellow-400', 'bg-red-400', 'bg-blue-400', 'bg-green-400', 
  'bg-purple-400', 'bg-pink-400', 'bg-orange-400', 'bg-teal-400'
];

const triggerConfetti = async () => {
  const confetti = (await import('canvas-confetti')).default;
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

export default function DuckRace() {
  const [ducks, setDucks] = useState<Duck[]>([]);
  const [newName, setNewName] = useState('');
  const [isRacing, setIsRacing] = useState(false);
  const [winner, setWinner] = useState<Duck | null>(null);
  const [mapType, setMapType] = useState<MapType>('straight');
  const animationRef = useRef<number | null>(null);

  const addDuck = () => {
    if (!newName.trim()) return;
    if (ducks.length >= 8) {
      alert('Tối đa 8 chú vịt thôi nhé!');
      return;
    }
    
    const newDuck: Duck = {
      id: Math.random().toString(36).substring(7),
      name: newName.trim(),
      progress: 0,
      speed: Math.random() * 0.1 + 0.05, // Random base speed
      color: DUCK_COLORS[ducks.length % DUCK_COLORS.length]
    };
    
    setDucks([...ducks, newDuck]);
    setNewName('');
  };

  const removeDuck = (id: string) => {
    setDucks(ducks.filter(d => d.id !== id));
  };

  const startRace = () => {
    if (ducks.length < 2) {
      alert('Cần ít nhất 2 chú vịt để bắt đầu đua!');
      return;
    }
    
    // Reset progress and assign new random speeds
    setDucks(ducks.map(d => ({
      ...d,
      progress: 0,
      speed: Math.random() * 0.1 + 0.05
    })));
    
    setWinner(null);
    setIsRacing(true);
    startRaceMusic();
  };

  const resetRace = () => {
    setIsRacing(false);
    setWinner(null);
    setDucks(ducks.map(d => ({ ...d, progress: 0 })));
    stopRaceMusic();
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
  };

  useEffect(() => {
    if (!isRacing) return;

    let lastTime = performance.now();

    const updateRace = (time: number) => {
      const deltaTime = time - lastTime;
      lastTime = time;

      setDucks(prevDucks => {
        let hasWinner = false;
        let winningDuck: Duck | null = null;
        
        const maxProgress = Math.max(...prevDucks.map(d => d.progress));

        const updatedDucks = prevDucks.map(duck => {
          if (hasWinner) return duck; // Stop updating if someone won

          // Randomly change base speed to simulate bursts of energy
          let newSpeed = duck.speed;
          if (Math.random() < 0.02) { // 2% chance per frame to change pace
            newSpeed = Math.random() * 0.1 + 0.05;
          }
          
          // Late game drama: wild speed changes near the finish line
          if (maxProgress > 70 && Math.random() < 0.05) {
            newSpeed = Math.random() * 0.2 + 0.02; // Can sprint or stumble
          }

          // Catch-up mechanic: ducks behind get a boost
          const distanceBehind = maxProgress - duck.progress;
          const catchUpBoost = distanceBehind > 5 ? (distanceBehind * 0.004) : 0;

          const currentFrameSpeed = Math.max(0.02, newSpeed + catchUpBoost);
          const newProgress = Math.min(100, duck.progress + currentFrameSpeed * (deltaTime / 16));

          if (newProgress >= 100 && !hasWinner) {
            hasWinner = true;
            winningDuck = { ...duck, progress: 100 };
          }

          return { ...duck, progress: newProgress, speed: newSpeed };
        });

        if (hasWinner && winningDuck) {
          setIsRacing(false);
          setWinner(winningDuck);
          stopRaceMusic();
          playSound('win');
          triggerConfetti();
          return updatedDucks;
        }

        return updatedDucks;
      });

      if (isRacing) {
        animationRef.current = requestAnimationFrame(updateRace);
      }
    };

    animationRef.current = requestAnimationFrame(updateRace);

    return () => {
      stopRaceMusic();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isRacing]);

  const getDuckY = (progress: number, mapType: MapType) => {
    if (mapType === 'curved') {
      return Math.sin((progress / 100) * Math.PI) * 40;
    }
    if (mapType === 'winding') {
      return Math.sin((progress / 100) * Math.PI * 4) * 25;
    }
    return 0;
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border-4 border-orange-200 p-6 md:p-8 w-full">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-orange-600 flex items-center gap-2">
            <Flag className="w-8 h-8" />
            Đua Vịt Siêu Tốc
          </h2>
          <p className="text-slate-500 font-medium">Thêm tên người chơi và bắt đầu cuộc đua!</p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-orange-50 text-orange-800 p-4 rounded-2xl mb-6 text-sm border border-orange-100">
        <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
          <BookOpen className="w-5 h-5" /> Hướng dẫn chơi:
        </h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Thêm tên các chú vịt tham gia (tối đa 8 vịt).</li>
          <li>Chọn địa hình đường đua (Thẳng, Cong, hoặc Uốn lượn).</li>
          <li>Ấn <strong>Bắt đầu đua</strong> và cổ vũ cho chú vịt của bạn!</li>
        </ul>
      </div>

      {/* Setup Area */}
      {!isRacing && !winner && (
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addDuck()}
              placeholder="Tên người chơi..."
              className="px-4 py-3 rounded-2xl border-2 border-orange-200 focus:border-orange-400 focus:outline-none w-full md:w-48 font-medium"
              maxLength={15}
            />
            <button
              onClick={addDuck}
              disabled={ducks.length >= 8}
              className="p-3 bg-orange-100 text-orange-600 rounded-2xl hover:bg-orange-200 transition-colors disabled:opacity-50"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 bg-orange-50 p-2 rounded-2xl border-2 border-orange-100 flex items-center gap-2 overflow-x-auto">
            <span className="font-bold text-orange-600 ml-2 whitespace-nowrap flex items-center gap-1">
              <Map className="w-4 h-4" /> Địa hình:
            </span>
            <button onClick={() => setMapType('straight')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${mapType === 'straight' ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-orange-600 hover:bg-orange-100'}`}>Đường thẳng</button>
            <button onClick={() => setMapType('curved')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${mapType === 'curved' ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-orange-600 hover:bg-orange-100'}`}>Đường cong</button>
            <button onClick={() => setMapType('winding')} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${mapType === 'winding' ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-orange-600 hover:bg-orange-100'}`}>Uốn lượn</button>
          </div>
        </div>
      )}

      {/* Ducks List */}
      {!isRacing && !winner && ducks.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-8">
          <AnimatePresence>
            {ducks.map((duck) => (
              <motion.div
                key={duck.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`${duck.color} text-white px-4 py-2 rounded-full font-bold flex items-center gap-2 shadow-sm`}
              >
                <span>🦆</span>
                {duck.name}
                <button
                  onClick={() => removeDuck(duck.id)}
                  className="ml-1 hover:bg-white/20 rounded-full p-1 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Race Track */}
      <div className="relative bg-blue-50 rounded-3xl p-4 md:p-6 border-4 border-blue-100 overflow-hidden mb-8">
        {/* Finish Line */}
        <div className="absolute right-[15%] top-0 bottom-0 w-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMDAwIi8+PHJlY3QgeD0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iI2ZmZiIvPjxyZWN0IHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNmZmYiLz48cmVjdCB4PSIxMCIgeT0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iIzAwMCIvPjwvc3ZnPg==')] opacity-50 z-0"></div>
        
        <div className="flex flex-col gap-4 relative z-10">
          {ducks.length === 0 ? (
            <div className="text-center py-12 text-blue-300 font-bold text-xl">
              Chưa có chú vịt nào! Hãy thêm tên ở trên nhé.
            </div>
          ) : (
            ducks.map((duck, index) => (
              <div key={duck.id} className="relative h-14 flex items-center">
                {/* Track Line */}
                <div className="absolute left-0 right-0 h-2 bg-blue-200/50 rounded-full top-1/2 -translate-y-1/2"></div>
                
                {/* Duck */}
                <motion.div
                  className="absolute left-0 flex flex-col items-center z-20"
                  style={{ left: `calc(${duck.progress}% * 0.85)` }}
                  animate={{ y: getDuckY(duck.progress, mapType) }}
                  transition={{ type: 'tween', ease: 'linear', duration: 0.1 }}
                >
                  <div className={`text-xs font-bold px-2 py-0.5 rounded-full text-white mb-1 whitespace-nowrap shadow-sm ${duck.color}`}>
                    {duck.name}
                  </div>
                  <div className="text-4xl filter drop-shadow-md transform -scale-x-100">
                    🦆
                  </div>
                </motion.div>
              </div>
            ))
          )}
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
            <h3 className="text-3xl font-bold text-orange-600 mb-2">
              Chúc mừng <span className={`px-3 py-1 rounded-xl text-white ${winner.color}`}>{winner.name}</span>!
            </h3>
            <p className="text-slate-500 font-medium mb-6">Đã về đích đầu tiên!</p>
            <button
              onClick={resetRace}
              className="px-8 py-4 bg-orange-500 text-white rounded-full font-bold text-xl hover:bg-orange-600 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 mx-auto"
            >
              <RotateCcw className="w-6 h-6" />
              Đua lại nào
            </button>
          </motion.div>
        ) : (
          <div className="flex gap-4">
            <button
              onClick={startRace}
              disabled={isRacing || ducks.length < 2}
              className="px-8 py-4 bg-green-500 text-white rounded-full font-bold text-xl hover:bg-green-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Play className="w-6 h-6" />
              Bắt đầu đua!
            </button>
            {isRacing && (
              <button
                onClick={resetRace}
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
