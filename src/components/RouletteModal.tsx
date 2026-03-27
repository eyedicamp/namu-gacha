'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface RouletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReward: (reward: number) => void;
}

const ROULETTE_SEGMENTS = [2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 4, 6] as const;
const SEGMENT_COLORS = [
  '#7c3aed', '#2563eb', '#9333ea', '#0891b2', '#7e22ce', '#1d4ed8',
  '#a855f7', '#f59e0b', '#ef4444', '#f97316', '#3b82f6', '#8b5cf6',
] as const;

export default function RouletteModal({ isOpen, onClose, onReward }: RouletteModalProps) {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [canReroll, setCanReroll] = useState(true);

  const segmentAngle = 360 / ROULETTE_SEGMENTS.length;


  const resetState = () => {
    setResult(null);
    setCanReroll(true);
    setIsSpinning(false);
  };

  const wheelBackground = useMemo(() => {
    const parts = ROULETTE_SEGMENTS.map((_, i) => {
      const start = i * segmentAngle;
      const end = start + segmentAngle;
      return `${SEGMENT_COLORS[i % SEGMENT_COLORS.length]} ${start}deg ${end}deg`;
    });

    return `conic-gradient(from -90deg, ${parts.join(', ')})`;
  }, [segmentAngle]);

  const handleClose = () => {
    if (isSpinning) return;
    resetState();
    onClose();
  };

  const spinToIndex = (chosenIndex: number) => {
    setResult(null);
    setIsSpinning(true);

    // 선택된 칸의 "중심"이 포인터(상단) 위치에 오도록 회전값 계산
    const targetOffset = chosenIndex * segmentAngle + segmentAngle / 2;
    const spinAngle = rotation + 360 * 6 - targetOffset;
    setRotation(spinAngle);

    window.setTimeout(() => {
      setResult(ROULETTE_SEGMENTS[chosenIndex]);
      setIsSpinning(false);
    }, 4200);
  };

  const handleSpin = () => {
    if (isSpinning) return;
    const chosenIndex = Math.floor(Math.random() * ROULETTE_SEGMENTS.length);
    spinToIndex(chosenIndex);
  };

  const handleReroll = () => {
    if (!canReroll || isSpinning) return;
    setCanReroll(false);
    const chosenIndex = Math.floor(Math.random() * ROULETTE_SEGMENTS.length);
    spinToIndex(chosenIndex);
  };

  const handleClaim = () => {
    if (result === null || isSpinning) return;
    onReward(result);
    resetState();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="relative w-full max-w-lg rounded-3xl border border-purple-400/40 bg-gradient-to-b from-gray-900 to-black p-6 shadow-[0_0_80px_rgba(168,85,247,0.35)]">
              <div className="mb-4 text-center">
                <h2 className="text-3xl font-black tracking-tight text-white">🎡 보너스 룰렛</h2>
              </div>

              <div className="relative mx-auto mb-6 h-80 w-80">
                <div className="absolute -top-5 left-1/2 z-20 -translate-x-1/2 text-5xl text-yellow-300 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]">
                  ▼
                </div>

                <motion.div
                  className="absolute inset-0 rounded-full border-8 border-white/25 shadow-[0_0_50px_rgba(59,130,246,0.45)]"
                  style={{ background: wheelBackground }}
                  animate={{ rotate: rotation }}
                  transition={{ duration: 4.2, ease: [0.08, 0.72, 0.16, 1] }}
                >
                  {ROULETTE_SEGMENTS.map((value, idx) => {
                    const angle = idx * segmentAngle + segmentAngle / 2;
                    return (
                      <div
                        key={`${value}-${idx}`}
                        className="absolute left-1/2 top-1/2"
                        style={{ transform: `rotate(${angle}deg) translateY(-135px) rotate(${-angle}deg)` }}
                      >
                        <span className="block -translate-x-1/2 -translate-y-1/2 text-sm font-black text-white drop-shadow-[0_0_8px_rgba(0,0,0,0.95)]">
                          +{value}
                        </span>
                      </div>
                    );
                  })}
                </motion.div>

                <div className="absolute left-1/2 top-1/2 z-10 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-yellow-200 bg-gradient-to-br from-yellow-300 to-orange-500 shadow-[0_0_40px_rgba(251,191,36,0.9)]" />
              </div>

              <div className="text-center">
                {result !== null && (
                  <motion.div
                    className="mb-4"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: [0.9, 1.15, 1] }}
                    transition={{ duration: 0.6 }}
                  >
                    <p className="text-sm text-gray-300">🎉 축하합니다! 획득 보상</p>
                    <p className="text-5xl font-black text-transparent bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 bg-clip-text drop-shadow-[0_0_30px_rgba(249,115,22,0.8)]">
                      +{result}회
                    </p>
                  </motion.div>
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleClose}
                    disabled={isSpinning}
                    className="flex-1 rounded-xl border border-white/20 bg-white/5 py-3 font-semibold text-gray-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    닫기
                  </button>

                  {result === null ? (
                    <motion.button
                      onClick={handleSpin}
                      disabled={isSpinning}
                      className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-blue-600 py-3 font-black text-white shadow-[0_0_30px_rgba(168,85,247,0.7)] disabled:cursor-not-allowed disabled:opacity-60"
                      whileHover={{ scale: isSpinning ? 1 : 1.04 }}
                      whileTap={{ scale: isSpinning ? 1 : 0.98 }}
                    >
                      {isSpinning ? '회전 중...' : '🎯 룰렛 돌리기'}
                    </motion.button>
                  ) : (
                    <>
                      {canReroll && (
                        <motion.button
                          onClick={handleReroll}
                          disabled={isSpinning}
                          className="flex-1 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 py-3 font-black text-white shadow-[0_0_30px_rgba(56,189,248,0.55)] disabled:cursor-not-allowed disabled:opacity-60"
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          🔁 다시 돌리기 (1회)
                        </motion.button>
                      )}

                      <motion.button
                        onClick={handleClaim}
                        disabled={isSpinning}
                        className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-lime-500 py-3 font-black text-gray-900 shadow-[0_0_30px_rgba(132,204,22,0.7)] disabled:cursor-not-allowed disabled:opacity-60"
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        ✅ 보상 받기
                      </motion.button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}