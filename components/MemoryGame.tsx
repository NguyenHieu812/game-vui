'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, RotateCcw, AlertCircle, Timer, CheckCircle2, XCircle, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type GamePhase = 'setup' | 'ready' | 'shuffling' | 'memorize' | 'playing' | 'gameover';

interface MemoryCard {
  id: string;
  value: number;
  isFlipped: boolean;
  isMatched: boolean;
}

export default function MemoryGame() {
  const [phase, setPhase] = useState<GamePhase>('setup');
  const [inputValue, setInputValue] = useState('');
  const [numbers, setNumbers] = useState<number[]>([]);
  const [maxMistakes, setMaxMistakes] = useState(3);
  
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [pairStatus, setPairStatus] = useState<'matched' | 'mismatched' | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameResult, setGameResult] = useState<'win' | 'lose' | 'timeup' | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle adding numbers
  const handleAddNumber = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(inputValue);
    if (!isNaN(num) && num >= 1 && num <= 1000) {
      if (numbers.length < 10) {
        setNumbers([...numbers, num]);
        setInputValue('');
      }
    }
  };

  const handleRemoveNumber = (index: number) => {
    setNumbers(numbers.filter((_, i) => i !== index));
  };

  // Start game setup
  const handleStartSetup = () => {
    if (numbers.length === 0) return;
    
    // Create pairs and shuffle
    let newCards: MemoryCard[] = [];
    numbers.forEach((num) => {
      newCards.push({ id: Math.random().toString(36).substr(2, 9), value: num, isFlipped: false, isMatched: false });
      newCards.push({ id: Math.random().toString(36).substr(2, 9), value: num, isFlipped: false, isMatched: false });
    });
    
    setCards(newCards);
    setPhase('ready');
    setMistakes(0);
    setScore(0);
    setTimeLeft(60);
    setGameResult(null);
    setSelectedIndices([]);
    setPairStatus(null);
  };

  // Shuffle array
  const shuffleCards = (array: MemoryCard[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Start memorize phase
  const handleReady = () => {
    setPhase('shuffling');
    
    // Shuffle animation phase (5 seconds)
    // We can just shuffle them a few times visually or just wait 5 seconds
    let shuffleCount = 0;
    const shuffleInterval = setInterval(() => {
      setCards(prev => shuffleCards(prev));
      shuffleCount++;
      if (shuffleCount >= 10) { // 10 shuffles over 5 seconds (every 500ms)
        clearInterval(shuffleInterval);
        
        // Move to memorize phase
        setPhase('memorize');
        setCards(prev => prev.map(c => ({ ...c, isFlipped: true })));
        
        // Wait 5 seconds, then hide and start playing
        setTimeout(() => {
          setCards(prev => prev.map(c => ({ ...c, isFlipped: false })));
          setPhase('playing');
        }, 5000);
      }
    }, 500);
  };

  const handleGameOver = (result: 'win' | 'lose' | 'timeup') => {
    setPhase('gameover');
    setGameResult(result);
  };

  // Timer logic
  useEffect(() => {
    if (phase === 'playing' && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (phase === 'playing' && timeLeft === 0) {
      setTimeout(() => handleGameOver('timeup'), 0);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [phase, timeLeft]);

  // Handle card click
  const handleCardClick = (index: number) => {
    if (phase !== 'playing') return;
    if (cards[index].isFlipped || cards[index].isMatched) return;
    if (selectedIndices.length >= 2) return;

    const newSelected = [...selectedIndices, index];
    setSelectedIndices(newSelected);
    
    // Flip the clicked card
    const newCards = [...cards];
    newCards[index] = { ...newCards[index], isFlipped: true };
    setCards(newCards);

    if (newSelected.length === 2) {
      const [firstIndex, secondIndex] = newSelected;
      
      if (newCards[firstIndex].value === newCards[secondIndex].value) {
        // Match
        setPairStatus('matched');
        setTimeout(() => {
          setCards(prev => {
            const updated = [...prev];
            updated[firstIndex] = { ...updated[firstIndex], isMatched: true };
            updated[secondIndex] = { ...updated[secondIndex], isMatched: true };
            return updated;
          });
          setSelectedIndices([]);
          setPairStatus(null);
          setScore(prev => prev + 1);
        }, 1400);
      } else {
        // No match
        setPairStatus('mismatched');
        setTimeout(() => {
          setCards(prev => {
            const updated = [...prev];
            updated[firstIndex] = { ...updated[firstIndex], isFlipped: false };
            updated[secondIndex] = { ...updated[secondIndex], isFlipped: false };
            return updated;
          });
          setSelectedIndices([]);
          setPairStatus(null);
          setMistakes(prev => prev + 1);
        }, 1400);
      }
    }
  };

  // Check win/lose conditions
  useEffect(() => {
    if (phase === 'playing') {
      if (score === numbers.length && numbers.length > 0) {
        handleGameOver('win');
      } else if (mistakes >= maxMistakes) {
        handleGameOver('lose');
      }
    }
  }, [score, mistakes, phase, numbers.length, maxMistakes]);

  const handleReset = () => {
    setPhase('setup');
    setNumbers([]);
    setInputValue('');
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-slate-50 rounded-3xl shadow-sm border-2 border-slate-100">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Lật Thẻ Ghi Nhớ</h2>
        <p className="text-slate-500">Tìm các cặp số giống nhau trước khi hết giờ!</p>
      </div>

      {phase === 'setup' && (
        <Card className="p-6 max-w-md mx-auto bg-white border-2 border-slate-200 shadow-sm">
          <form onSubmit={handleAddNumber} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="number-input">Nhập số (1 - 1000, tối đa 10 số)</Label>
              <div className="flex gap-2">
                <Input
                  id="number-input"
                  type="number"
                  min="1"
                  max="1000"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ví dụ: 42"
                  disabled={numbers.length >= 10}
                  className="text-lg"
                />
                <Button type="submit" disabled={numbers.length >= 10 || !inputValue}>
                  Thêm
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 min-h-[40px] p-3 bg-slate-50 rounded-lg border border-slate-200">
              {numbers.length === 0 && (
                <span className="text-slate-400 text-sm italic">Chưa có số nào được chọn</span>
              )}
              <AnimatePresence>
                {numbers.map((num, idx) => (
                  <motion.div
                    key={`${num}-${idx}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Badge 
                      variant="secondary" 
                      className="text-lg py-1 px-3 flex items-center gap-2 bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer"
                      onClick={() => handleRemoveNumber(idx)}
                    >
                      {num}
                      <XCircle className="w-4 h-4" />
                    </Badge>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mistakes-input">Số lần sai tối đa</Label>
              <Input
                id="mistakes-input"
                type="number"
                min="0"
                value={maxMistakes}
                onChange={(e) => setMaxMistakes(parseInt(e.target.value) || 0)}
                className="text-lg"
              />
            </div>

            <Button 
              type="button" 
              className="w-full text-lg h-12 bg-blue-600 hover:bg-blue-700"
              onClick={handleStartSetup}
              disabled={numbers.length === 0}
            >
              <Play className="w-5 h-5 mr-2" />
              Tạo Bàn Chơi
            </Button>
          </form>
        </Card>
      )}

      {(phase === 'ready' || phase === 'shuffling' || phase === 'memorize' || phase === 'playing') && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-sm">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <Timer className="w-5 h-5 text-blue-500" />
                <span className="text-xl w-16">{timeLeft}s</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-xl">Lỗi: <span className={mistakes > maxMistakes * 0.7 ? 'text-red-500' : ''}>{mistakes}/{maxMistakes}</span></span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-700 font-semibold">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="text-xl">Điểm: {score}/{numbers.length}</span>
            </div>
          </div>

          {phase === 'shuffling' && (
            <div className="w-full">
              <div className="flex justify-between text-sm font-medium text-slate-500 mb-2">
                <span>Đang xáo trộn thẻ bài...</span>
                <span>5 giây</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 animate-shrink rounded-full" />
              </div>
            </div>
          )}

          {phase === 'memorize' && (
            <div className="w-full">
              <div className="flex justify-between text-sm font-medium text-slate-500 mb-2">
                <span>Ghi nhớ các thẻ bài!</span>
                <span>5 giây</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 animate-shrink rounded-full" />
              </div>
            </div>
          )}

          {phase === 'ready' && (
            <div className="flex justify-center py-8">
              <Button onClick={handleReady} size="lg" className="text-xl px-8 py-6 bg-green-500 hover:bg-green-600 animate-bounce">
                Sẵn Sàng!
              </Button>
            </div>
          )}

          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 md:gap-4 justify-center">
            {cards.map((card, index) => {
              const isSelected = selectedIndices.includes(index);
              const isCheckingMatch = isSelected && selectedIndices.length === 2 && pairStatus === 'matched';
              const isCheckingMismatch = isSelected && selectedIndices.length === 2 && pairStatus === 'mismatched';
              
              let borderColor = 'border-slate-200';
              if (isCheckingMatch) borderColor = 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]';
              else if (isCheckingMismatch) borderColor = 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]';

              return (
                <motion.div
                  key={card.id}
                  className={`relative aspect-[3/4] cursor-pointer [perspective:1000px] ${card.isMatched ? 'invisible' : ''}`}
                  onClick={() => handleCardClick(index)}
                  animate={
                    isCheckingMatch ? { scale: [1, 1.1, 1], transition: { duration: 0.4, delay: 0.4 } } :
                    isCheckingMismatch ? { x: [0, -8, 8, -8, 8, 0], transition: { duration: 0.4, delay: 0.4 } } :
                    {}
                  }
                  whileHover={phase === 'playing' && !card.isFlipped && !card.isMatched && selectedIndices.length < 2 ? { scale: 1.05, y: -5 } : {}}
                  whileTap={phase === 'playing' && !card.isFlipped && !card.isMatched && selectedIndices.length < 2 ? { scale: 0.95 } : {}}
                >
                  <motion.div
                    className="w-full h-full relative [transform-style:preserve-3d] transition-transform duration-500"
                    animate={{ rotateY: card.isFlipped ? 180 : 0 }}
                  >
                    {/* Front (Hidden) */}
                    <div className="absolute w-full h-full [backface-visibility:hidden] bg-blue-500 rounded-xl border-4 border-blue-600 shadow-md flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-blue-400/50 flex items-center justify-center">
                        <span className="text-blue-200 font-bold text-xl">?</span>
                      </div>
                    </div>
                    
                    {/* Back (Revealed) */}
                    <div className={`absolute w-full h-full [backface-visibility:hidden] bg-white rounded-xl border-4 ${borderColor} shadow-md flex items-center justify-center [transform:rotateY(180deg)] transition-colors duration-300`}>
                      <span className="text-3xl md:text-4xl font-bold text-slate-800">{card.value}</span>
                      
                      {isCheckingMatch && (
                        <div className="absolute inset-0 flex items-center justify-center bg-green-500/10 rounded-lg z-10">
                          <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', delay: 0.4 }}>
                            <Check className="w-16 h-16 text-green-500 drop-shadow-md" strokeWidth={4} />
                          </motion.div>
                        </div>
                      )}
                      
                      {isCheckingMismatch && (
                        <div className="absolute inset-0 flex items-center justify-center bg-red-500/10 rounded-lg z-10">
                          <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', delay: 0.4 }}>
                            <X className="w-16 h-16 text-red-500 drop-shadow-md" strokeWidth={4} />
                          </motion.div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {phase === 'gameover' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-lg border-4 text-center"
          style={{
            borderColor: gameResult === 'win' ? '#22c55e' : '#ef4444'
          }}
        >
          <div className="text-6xl mb-4">
            {gameResult === 'win' ? '🎉' : gameResult === 'timeup' ? '⏰' : '💥'}
          </div>
          <h3 className={`text-3xl font-bold mb-2 ${
            gameResult === 'win' ? 'text-green-600' : 'text-red-600'
          }`}>
            {gameResult === 'win' ? 'Chiến Thắng!' : gameResult === 'timeup' ? 'Hết Giờ!' : 'Thua Cuộc!'}
          </h3>
          
          <div className="space-y-2 my-6 text-lg text-slate-600">
            <p>Bạn đã tìm được: <strong className="text-slate-800 text-2xl">{score}</strong> cặp số</p>
            <p>Số lần sai: <strong className="text-slate-800">{mistakes}</strong></p>
          </div>

          <Button onClick={handleReset} size="lg" className="w-full text-lg h-14 bg-blue-600 hover:bg-blue-700">
            <RotateCcw className="w-5 h-5 mr-2" />
            Chơi Lại
          </Button>
        </motion.div>
      )}
    </div>
  );
}
