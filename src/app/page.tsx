'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GachaResult } from '@/types/gacha';
import GachaCard from '@/components/GachaCard';
import Navigation from '@/components/Navigation';
import RouletteModal from '@/components/RouletteModal';

type Phase = 'idle' | 'loading' | 'result';

export default function Home() {
  const [result, setResult] = useState<GachaResult | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [pullCount, setPullCount] = useState(0);
  const [remaining, setRemaining] = useState<number>(10);
  const [isDevMode, setIsDevMode] = useState(false);
  
  // 룰렛 보상 관련 상태
  const [rouletteCount, setRouletteCount] = useState(0);
  const [isRouletteOpen, setIsRouletteOpen] = useState(false);

  useEffect(() => {
    const isDev = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';
    setIsDevMode(isDev);
  }, []);

  useEffect(() => {
    if (isDevMode) {
      setRemaining(999);
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const stored = localStorage.getItem('gacha_daily');
    const rouletteStored = localStorage.getItem('gacha_roulette_daily');
    
    if (stored) {
      const data = JSON.parse(stored);
      if (data.date === today) {
        setPullCount(data.count);
        setRemaining(10 - data.count);
      } else {
        localStorage.setItem('gacha_daily', JSON.stringify({ date: today, count: 0 }));
        setPullCount(0);
        setRemaining(10);
      }
    } else {
      localStorage.setItem('gacha_daily', JSON.stringify({ date: today, count: 0 }));
    }

    if (rouletteStored) {
      const rouletteData = JSON.parse(rouletteStored);
      if (rouletteData.date === today) {
        setRouletteCount(rouletteData.count);
      } else {
        localStorage.setItem('gacha_roulette_daily', JSON.stringify({ date: today, count: 0 }));
        setRouletteCount(0);
      }
    } else {
      localStorage.setItem('gacha_roulette_daily', JSON.stringify({ date: today, count: 0 }));
    }
  }, [isDevMode]);

  const saveToHistory = (gachaResult: GachaResult) => {
    const history = localStorage.getItem('gacha_history');
    const items: GachaResult[] = history ? JSON.parse(history) : [];
    
    const newItem: GachaResult = {
      ...gachaResult,
      pulledAt: new Date().toISOString(),
      id: `${Date.now()}-${Math.random()}`,
    };
    
    items.unshift(newItem);
    
    if (items.length > 100) {
      items.pop();
    }
    
    localStorage.setItem('gacha_history', JSON.stringify(items));
  };

  const handleGacha = async () => {
    if (!isDevMode && remaining <= 0) {
      setError('오늘의 뽑기 횟수를 모두 사용했습니다! 룰렛을 돌려 횟수를 추가하세요.');
      return;
    }

    setPhase('loading');
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/gacha');
      
      if (!res.ok) throw new Error('API 요청 실패');
      
      const data: GachaResult = await res.json();

      const delay = getRevealDelay(data.rarity);
      await new Promise((resolve) => setTimeout(resolve, delay));

      setResult(data);
      saveToHistory(data);
      
      if (!isDevMode) {
        const today = new Date().toISOString().split('T')[0];
        const newCount = pullCount + 1;
        localStorage.setItem('gacha_daily', JSON.stringify({ date: today, count: newCount }));
        
        setPullCount(newCount);
        setRemaining(10 - newCount);
      }
      
      setPhase('result');
      
    } catch {
      setError('문서를 가져오는 데 실패했습니다. 다시 시도해주세요.');
      setPhase('idle');
    }
  };

  // 룰렛 열기
  const handleOpenRoulette = () => {
    if (rouletteCount >= 2) {
      setError('오늘 룰렛 사용 횟수를 모두 사용했습니다! (최대 2회)');
      return;
    }
    setIsRouletteOpen(true);
  };

  // 룰렛 보상 적용
  const handleRouletteReward = (reward: number) => {
    const today = new Date().toISOString().split('T')[0];
    const newRouletteCount = rouletteCount + 1;

    localStorage.setItem('gacha_roulette_daily', JSON.stringify({ date: today, count: newRouletteCount }));
    setRouletteCount(newRouletteCount);

    const stored = localStorage.getItem('gacha_daily');
    if (stored) {
      const data = JSON.parse(stored);
      const newCount = Math.max(0, data.count - reward);
      localStorage.setItem('gacha_daily', JSON.stringify({ date: today, count: newCount }));
      setPullCount(newCount);
      setRemaining(10 - newCount);
    }

    setError(`✅ 룰렛 보상 획득! 뽑기 횟수 +${reward} 추가되었습니다.`);
    setTimeout(() => setError(null), 3500);
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6 overflow-hidden pt-24">
      <Navigation />
      
      <RouletteModal
        isOpen={isRouletteOpen}
        onClose={() => setIsRouletteOpen(false)}
        onReward={handleRouletteReward}
      />
      
      <motion.h1
        className="text-4xl font-bold mb-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        🎰 나무가챠
      </motion.h1>
      <motion.p
        className="text-gray-400 mb-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        나무위키 랜덤 문서 뽑기
      </motion.p>

      <motion.div
        className="mb-4 px-6 py-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
      >
        <p className="text-sm text-gray-300">
          {isDevMode ? (
            <span className="text-green-400 font-bold">🔧 개발 모드 (무제한)</span>
          ) : (
            <>
              남은 기회: <span className="text-xl font-bold text-yellow-400">{remaining}</span> / 10
            </>
          )}
        </p>
      </motion.div>

      {!isDevMode && remaining === 0 && rouletteCount < 2 && (
        <motion.button
          onClick={handleOpenRoulette}
          className="mb-4 px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 transition-all"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🎡 룰렛으로 추가 횟수 얻기 (+2~+15) ({2 - rouletteCount}회 남음)
        </motion.button>
      )}

      <motion.button
        onClick={handleGacha}
        disabled={phase === 'loading' || (!isDevMode && remaining <= 0)}
        className={`
          px-8 py-4 rounded-2xl text-xl font-bold
          transition-all duration-300 cursor-pointer
          ${phase === 'loading' || (!isDevMode && remaining <= 0)
            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500'
          }
        `}
        whileHover={phase !== 'loading' && (isDevMode || remaining > 0) ? { scale: 1.05 } : {}}
        whileTap={phase !== 'loading' && (isDevMode || remaining > 0) ? { scale: 0.95 } : {}}
      >
        {phase === 'loading' ? '뽑는 중...' : (!isDevMode && remaining <= 0) ? '오늘 뽑기 종료' : '🎲 뽑기!'}
      </motion.button>

      {!isDevMode && pullCount > 0 && (
        <motion.p
          className="mt-3 text-xs text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          오늘 {pullCount}회 뽑기
        </motion.p>
      )}

      <AnimatePresence>
        {error && (
          <motion.p
            className={`mt-6 ${error.includes('✅') ? 'text-green-400' : 'text-red-400'}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="mt-10 w-full max-w-md flex flex-col items-center min-h-[320px]">
        <AnimatePresence mode="wait">
          {phase === 'loading' && (
            <motion.div
              key="loading"
              className="flex flex-col items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.25 }}
            >
              <motion.div
                className="w-32 h-44 rounded-xl bg-gradient-to-br from-purple-600/30 to-blue-600/30 border border-purple-500/30"
                animate={{
                  rotateY: [0, 180, 360],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{ transformStyle: 'preserve-3d' }}
              />
              <motion.p
                className="mt-4 text-gray-400 text-sm"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                문서를 뽑고 있습니다...
              </motion.p>
            </motion.div>
          )}

          {phase === 'result' && result && (
            <motion.div
              key={`result-${result.title}`}
              className="w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
            >
              <GachaCard result={result} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

function getRevealDelay(rarity: string): number {
  switch (rarity) {
    case 'Mythic': return 2000;
    case 'Legendary': return 1500;
    case 'Epic': return 1000;
    case 'Rare': return 600;
    default: return 300;
  }
}