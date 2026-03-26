'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gamepad2, ArrowLeft } from 'lucide-react';
import DuckRace from '@/components/DuckRace';
import LuckyWheel from '@/components/LuckyWheel';
import ShellGame from '@/components/ShellGame';

type GameState = 'menu' | 'duck-race' | 'lucky-wheel' | 'shell-game';

export default function Home() {
  const [gameState, setGameState] = useState<GameState>('menu');

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto flex flex-col items-center">
      {/* Header */}
      <header className="w-full flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-2xl shadow-sm border-2 border-yellow-200">
            <Gamepad2 className="w-8 h-8 text-yellow-500" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
            Kids Game Studio
          </h1>
        </div>
        {gameState !== 'menu' && (
          <button
            onClick={() => setGameState('menu')}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all border-2 border-slate-100 text-slate-600 font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <div className="w-full flex-1 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {gameState === 'menu' && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl"
            >
              <GameCard
                title="Đua Vịt Siêu Tốc"
                description="Chọn những chú vịt đáng yêu và xem ai sẽ về đích đầu tiên!"
                icon="🦆"
                color="bg-orange-100 border-orange-300 text-orange-700"
                onClick={() => setGameState('duck-race')}
              />
              <GameCard
                title="Vòng Quay May Mắn"
                description="Thêm tên của bạn và quay để tìm ra người chiến thắng!"
                icon="🎡"
                color="bg-purple-100 border-purple-300 text-purple-700"
                onClick={() => setGameState('lucky-wheel')}
              />
              <GameCard
                title="Cốc Đỏ Tìm Bóng"
                description="Xáo trộn bóng trong cốc đỏ, thử tài tinh mắt của bạn!"
                icon="🥤"
                color="bg-red-100 border-red-300 text-red-700"
                onClick={() => setGameState('shell-game')}
              />
            </motion.div>
          )}

          {gameState === 'duck-race' && (
            <motion.div
              key="duck-race"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full"
            >
              <DuckRace />
            </motion.div>
          )}

          {gameState === 'lucky-wheel' && (
            <motion.div
              key="lucky-wheel"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full"
            >
              <LuckyWheel />
            </motion.div>
          )}

          {gameState === 'shell-game' && (
            <motion.div
              key="shell-game"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full"
            >
              <ShellGame />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

function GameCard({ title, description, icon, color, onClick }: any) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative overflow-hidden p-8 rounded-3xl border-4 text-left transition-all shadow-sm hover:shadow-xl ${color}`}
    >
      <div className="absolute -right-4 -top-4 text-8xl opacity-20 rotate-12">
        {icon}
      </div>
      <div className="relative z-10">
        <div className="text-5xl mb-4">{icon}</div>
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p className="opacity-90 font-medium leading-relaxed">{description}</p>
      </div>
    </motion.button>
  );
}
