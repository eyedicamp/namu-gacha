'use client';

import { motion } from 'framer-motion';
import type { TargetAndTransition, Transition } from 'framer-motion';
import { GachaResult, GachaRarity, RARITY_CONFIG } from '@/types/gacha';
import RarityParticles from './RarityParticles';

// ★ 카드 뒤 은은한 글로우 설정 (등급별)
const BACK_GLOW: Record<GachaRarity, {
  color: string;
  size: number;
  opacity: [number, number];
  duration: number;
} | null> = {
  Normal: null,
  Rare: {
    color: 'rgba(59, 130, 246, 0.15)',
    size: 300,
    opacity: [0.1, 0.2],
    duration: 3,
  },
  Epic: {
    color: 'rgba(168, 85, 247, 0.25)',
    size: 400,
    opacity: [0.15, 0.35],
    duration: 2.5,
  },
  Legendary: {
    color: 'rgba(234, 179, 8, 0.35)',
    size: 500,
    opacity: [0.2, 0.5],
    duration: 2,
  },
  Mythic: {
    color: 'rgba(239, 68, 68, 0.45)',
    size: 600,
    opacity: [0.3, 0.65],
    duration: 1.8,
  },
};

const entranceVariants: Record<GachaRarity, {
  initial: TargetAndTransition;
  animate: TargetAndTransition;
  transition: Transition;
}> = {
  Normal: {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: 'easeOut' },
  },
  Rare: {
    initial: { opacity: 0, y: 50, scale: 0.9 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { duration: 0.5, ease: 'easeOut' },
  },
  Epic: {
    initial: { opacity: 0, scale: 0.5 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.6, type: 'spring', bounce: 0.4 },
  },
  Legendary: {
    initial: { opacity: 0, scale: 0.3 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.7, type: 'spring', bounce: 0.5 },
  },
  Mythic: {
    initial: { opacity: 0, scale: 0.1 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.8, type: 'spring', bounce: 0.6 },
  },
};

const glowVariants: Record<string, TargetAndTransition> = {
  Normal: {},
  Rare: {
    boxShadow: [
      '0 0 20px rgba(59,130,246,0.2)',
      '0 0 40px rgba(59,130,246,0.4)',
      '0 0 20px rgba(59,130,246,0.2)',
    ],
  },
  Epic: {
    boxShadow: [
      '0 0 20px rgba(168,85,247,0.3)',
      '0 0 60px rgba(168,85,247,0.5)',
      '0 0 20px rgba(168,85,247,0.3)',
    ],
  },
  Legendary: {
    boxShadow: [
      '0 0 30px rgba(234,179,8,0.3)',
      '0 0 80px rgba(234,179,8,0.6)',
      '0 0 30px rgba(234,179,8,0.3)',
    ],
  },
  Mythic: {
    boxShadow: [
      '0 0 40px rgba(239,68,68,0.4)',
      '0 0 100px rgba(239,68,68,0.7)',
      '0 0 40px rgba(239,68,68,0.4)',
    ],
  },
};

interface GachaCardProps {
  result: GachaResult;
}

export default function GachaCard({ result }: GachaCardProps) {
  const rarityStyle = RARITY_CONFIG[result.rarity];
  const entrance = entranceVariants[result.rarity];
  const glow = glowVariants[result.rarity];
  const backGlow = BACK_GLOW[result.rarity];
  const isHighRarity = ['Epic', 'Legendary', 'Mythic'].includes(result.rarity);

  return (
    <motion.div
      className="w-full relative"
      initial={entrance.initial}
      animate={entrance.animate}
      transition={entrance.transition}
    >
      {/* ★ 카드 뒤 은은한 글로우 (등급별 크기/밝기) */}
      {backGlow && (
        <motion.div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: backGlow.size,
            height: backGlow.size,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${backGlow.color} 0%, transparent 70%)`,
            translateX: '-50%',
            translateY: '-50%',
            pointerEvents: 'none',
            zIndex: 0,
          }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: backGlow.opacity,
          }}
          transition={{
            opacity: {
              duration: backGlow.duration,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut',
              delay: 0.5, // 카드 등장 후 시작
            },
          }}
        />
      )}

      {/* 파티클 이펙트 (Epic 이상) */}
      <RarityParticles rarity={result.rarity} />

      {/* 등급 텍스트 연출 (Epic 이상) */}
      {isHighRarity && (
        <motion.div
          className={`text-center text-3xl font-black mb-4 ${rarityStyle.color}`}
          initial={{ opacity: 0, scale: 2, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {rarityStyle.label}
        </motion.div>
      )}

      {/* 메인 카드 */}
      <motion.div
        className={`
          relative rounded-2xl border-2 overflow-hidden
          ${rarityStyle.bgColor} ${rarityStyle.borderColor}
        `}
        style={{ zIndex: 1 }}
        animate={glow}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Mythic 전용: 카드 내부 빛 스윕 */}
        {result.rarity === 'Mythic' && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 45%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.12) 55%, transparent 60%)',
            }}
            animate={{ x: ['-100%', '200%'] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 1.5,
              ease: 'easeInOut',
            }}
          />
        )}

        {/* Legendary 전용: 카드 내부 쉬머 */}
        {result.rarity === 'Legendary' && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(105deg, transparent 42%, rgba(234,179,8,0.08) 47%, rgba(234,179,8,0.15) 50%, rgba(234,179,8,0.08) 53%, transparent 58%)',
            }}
            animate={{ x: ['-100%', '200%'] }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              repeatDelay: 2,
              ease: 'easeInOut',
            }}
          />
        )}

        {/* 카드 내용물 */}
        <div className="relative p-6" style={{ zIndex: 1 }}>
          {/* 등급 뱃지 (Normal, Rare만) */}
          {!isHighRarity && (
            <motion.div
              className={`text-sm font-bold mb-3 ${rarityStyle.color}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              {rarityStyle.label}
            </motion.div>
          )}

          {/* 문서 제목 */}
          <motion.h2
            className="text-2xl font-bold mb-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            {result.title}
          </motion.h2>

          {/* 요약 */}
          <motion.p
            className="text-gray-300 text-sm leading-relaxed mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
          >
            {result.summary}
          </motion.p>

          {/* 메타 정보 */}
          <motion.div
            className="flex gap-4 text-xs text-gray-500 mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <span>📝 {result.contentLength.toLocaleString()}자</span>
          </motion.div>

          {/* 나무위키 링크 */}
          <motion.a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`
              inline-block px-4 py-2 rounded-lg text-sm font-medium
              ${rarityStyle.borderColor} border
              hover:bg-white/10 transition-colors
            `}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.48 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            📖 나무위키에서 읽기 →
          </motion.a>
        </div>
      </motion.div>
    </motion.div>
  );
}