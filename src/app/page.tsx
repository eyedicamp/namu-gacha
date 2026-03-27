'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GachaResult } from '@/types/gacha';
import GachaCard from '@/components/GachaCard';

type Phase = 'idle' | 'loading' | 'result';

export default function Home() {
  const [result, setResult] = useState<GachaResult | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [pullCount, setPullCount] = useState(0);

  const handleGacha = async () => {
    setPhase('loading');
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/gacha');
      if (!res.ok) throw new Error('API 요청 실패');
      const data: GachaResult = await res.json();

      // 등급에 따라 서스펜스 딜레이
      const delay = getRevealDelay(data.rarity);
      await new Promise((resolve) => setTimeout(resolve, delay));

      setResult(data);
      setPullCount((prev) => prev + 1);
      setPhase('result');
    } catch {
      setError('문서를 가져오는 데 실패했습니다. 다시 시도해주세요.');
      setPhase('idle');
    }
  };

  return (
    <main className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-6">
      {/* 🎨 배경 레이어 1: 베이스 그라데이션 */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-red-500 to-pink-500"
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          backgroundSize: '200% 200%',
        }}
      />

      {/* 🎨 배경 레이어 2: 오버레이 그라데이션 */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-tl from-purple-600 via-blue-500 to-cyan-400 opacity-70"
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          backgroundSize: '200% 200%',
        }}
      />

      {/* ✨ 떠다니는 빛 효과 1 */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-300/40 rounded-full blur-3xl"
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* ✨ 떠다니는 빛 효과 2 */}
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-400/40 rounded-full blur-3xl"
        animate={{
          x: [0, -80, 0],
          y: [0, 60, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
      />

      {/* ✨ 떠다니는 빛 효과 3 */}
      <motion.div
        className="absolute top-1/2 right-1/3 w-64 h-64 bg-blue-400/30 rounded-full blur-3xl"
        animate={{
          x: [0, 50, 0],
          y: [0, -80, 0],
          scale: [1, 1.4, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
      />

      {/* 🌟 반짝이는 파티클들 */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* 📄 콘텐츠 (위에 표시) */}
      <div className="relative z-10 flex flex-col items-center text-white">
        {/* 타이틀 */}
        <motion.h1
          className="text-4xl font-bold mb-2 drop-shadow-lg"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          🎰 나무가챠
        </motion.h1>
        <motion.p
          className="text-white/80 mb-10 drop-shadow-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          나무위키 랜덤 문서 뽑기
        </motion.p>

        {/* 뽑기 버튼 */}
        <motion.button
          onClick={handleGacha}
          disabled={phase === 'loading'}
          className={`
            px-8 py-4 rounded-2xl text-xl font-bold
            transition-all duration-300 cursor-pointer
            shadow-2xl
            ${phase === 'loading'
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500'
            }
          `}
          whileHover={phase !== 'loading' ? { scale: 1.05, boxShadow: '0 0 30px rgba(168, 85, 247, 0.6)' } : {}}
          whileTap={phase !== 'loading' ? { scale: 0.95 } : {}}
        >
          {phase === 'loading' ? '뽑는 중...' : '🎲 뽑기!'}
        </motion.button>

        {/* 뽑기 카운터 */}
        {pullCount > 0 && (
          <motion.p
            className="mt-3 text-xs text-white/60 drop-shadow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            총 {pullCount}회 뽑기
          </motion.p>
        )}

        {/* 에러 */}
        <AnimatePresence>
          {error && (
            <motion.p
              className="mt-6 text-red-300 drop-shadow-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* 로딩 & 결과 */}
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
                {/* 회전하는 카드 실루엣 */}
                <motion.div
                  className="w-32 h-44 rounded-xl bg-gradient-to-br from-purple-600/30 to-blue-600/30 border border-purple-500/30 shadow-2xl"
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
                  className="mt-4 text-white/70 text-sm drop-shadow"
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