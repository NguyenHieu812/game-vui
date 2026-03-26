'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, RotateCcw, HelpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playSound } from '@/lib/sounds';

type GameState = 'setup' | 'hiding' | 'shuffling' | 'guessing' | 'won' | 'lost';

interface Cup {
  id: number;
  hasBall: boolean;
  isRevealed: boolean;
}

const triggerConfetti = () => {
  const duration = 3000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 5, angle: 60, spread: 55, origin: { x: 0 },
      colors: ['#facc15', '#ef4444', '#3b82f6']
    });
    confetti({
      particleCount: 5, angle: 120, spread: 55, origin: { x: 1 },
      colors: ['#facc15', '#ef4444', '#3b82f6']
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
};

export default function ShellGame() {
  const [cupCount, setCupCount] = useState<number>(3);
  const [gameState, setGameState] = useState<GameState>('setup');
  const [cups, setCups] = useState<Cup[]>([]);
  const [isCupsLifted, setIsCupsLifted] = useState(true);

  const initGame = (count: number) => {
    const newCups = Array.from({ length: count }, (_, i) => ({
      id: i,
      hasBall: false,
      isRevealed: false,
    }));
    // Randomly place ball
    const ballIndex = Math.floor(Math.random() * count);
    newCups[ballIndex].hasBall = true;
    setCups(newCups);
    setIsCupsLifted(true);
    setGameState('hiding');
    playSound('pop');
    
    // Sequence: show ball -> lower cups -> shuffle
    setTimeout(() => {
      setIsCupsLifted(false);
      playSound('pop');
      setTimeout(() => {
        setGameState('shuffling');
        startShuffling(newCups);
      }, 1000);
    }, 2000);
  };

  const startShuffling = (initialCups: Cup[]) => {
    let currentCups = [...initialCups];
    let shuffles = 0;
    const maxShuffles = cupCount * 3 + 5; // More cups = more shuffles
    
    const shuffleInterval = setInterval(() => {
      if (shuffles >= maxShuffles) {
        clearInterval(shuffleInterval);
        setGameState('guessing');
        return;
      }
      
      // Pick two random indices to swap
      const idx1 = Math.floor(Math.random() * currentCups.length);
      let idx2 = Math.floor(Math.random() * currentCups.length);
      while (idx1 === idx2) {
        idx2 = Math.floor(Math.random() * currentCups.length);
      }
      
      const newCups = [...currentCups];
      const temp = newCups[idx1];
      newCups[idx1] = newCups[idx2];
      newCups[idx2] = temp;
      
      currentCups = newCups;
      setCups(currentCups);
      playSound('shuffle');
      shuffles++;
    }, 400); // Speed of shuffle
  };

  const handleCupClick = (id: number) => {
    if (gameState !== 'guessing') return;
    
    const cupIndex = cups.findIndex(c => c.id === id);
    if (cups[cupIndex].isRevealed) return;

    const newCups = [...cups];
    newCups[cupIndex].isRevealed = true;
    setCups(newCups);

    if (newCups[cupIndex].hasBall) {
      setGameState('won');
      playSound('win');
      triggerConfetti();
      // Reveal all other cups after a delay
      setTimeout(() => {
        setCups(prev => prev.map(c => ({ ...c, isRevealed: true })));
      }, 1500);
    } else {
      playSound('fail');
      // Check if all empty cups are revealed
      const unrevealedEmpty = newCups.filter(c => !c.hasBall && !c.isRevealed);
      if (unrevealedEmpty.length === 0) {
        setGameState('lost');
        setTimeout(() => {
          setCups(prev => prev.map(c => ({ ...c, isRevealed: true })));
        }, 1000);
      }
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border-4 border-red-200 p-6 md:p-8 w-full">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-red-600 flex items-center gap-2">
            <HelpCircle className="w-8 h-8" />
            Cốc Đỏ Tìm Bóng
          </h2>
          <p className="text-slate-500 font-medium">Theo dõi quả bóng vàng và tìm ra nó!</p>
        </div>

        {gameState === 'setup' && (
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">Số cốc:</span>
            {[3, 4, 5].map(num => (
              <button
                key={num}
                onClick={() => setCupCount(num)}
                className={`w-10 h-10 rounded-xl font-bold transition-colors ${cupCount === num ? 'bg-red-500 text-white' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
              >
                {num}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="min-h-[300px] flex flex-col items-center justify-center bg-red-50 rounded-3xl border-4 border-red-100 p-8 mb-8 overflow-hidden">
        {gameState === 'setup' ? (
          <button
            onClick={() => initGame(cupCount)}
            className="px-8 py-4 bg-green-500 text-white rounded-full font-bold text-xl hover:bg-green-600 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <Play className="w-6 h-6" />
            Bắt đầu chơi!
          </button>
        ) : (
          <div className="flex gap-4 md:gap-8 justify-center items-end h-48 w-full">
            <AnimatePresence>
              {cups.map((cup) => {
                const isLifted = isCupsLifted || cup.isRevealed;
                return (
                  <motion.div
                    key={cup.id}
                    layout
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="relative flex flex-col items-center justify-end w-20 md:w-28 h-40 cursor-pointer"
                    onClick={() => handleCupClick(cup.id)}
                  >
                    {/* Ball */}
                    {cup.hasBall && (
                      <div className="absolute bottom-0 w-12 h-12 md:w-16 md:h-16 bg-yellow-400 rounded-full shadow-inner border-4 border-yellow-500 z-0"></div>
                    )}
                    
                    {/* Cup */}
                    <motion.div
                      animate={{ y: isLifted ? -60 : 0 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                      className="absolute bottom-0 w-full h-32 md:h-40 bg-red-500 rounded-t-2xl rounded-b-md shadow-lg border-b-8 border-red-700 z-10 flex flex-col items-center justify-start pt-4"
                    >
                      <div className="w-1/2 h-2 bg-red-400 rounded-full opacity-50"></div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center justify-center min-h-[80px]">
        {gameState === 'guessing' && (
          <p className="text-2xl font-bold text-red-500 animate-pulse">Quả bóng ở đâu nhỉ?</p>
        )}
        {(gameState === 'won' || gameState === 'lost') && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <h3 className={`text-3xl font-bold mb-4 ${gameState === 'won' ? 'text-green-600' : 'text-red-600'}`}>
              {gameState === 'won' ? 'Tuyệt vời! Bạn đã tìm thấy!' : 'Tiếc quá, thử lại nhé!'}
            </h3>
            <button
              onClick={() => setGameState('setup')}
              className="px-8 py-4 bg-red-500 text-white rounded-full font-bold text-xl hover:bg-red-600 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 mx-auto"
            >
              <RotateCcw className="w-6 h-6" />
              Chơi lại nào
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
