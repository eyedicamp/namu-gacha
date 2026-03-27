'use client';

import { motion } from 'framer-motion';
import { GachaRarity } from '@/types/gacha';

interface Particle {
  id: number;
  size: number;
  delay: number;
  duration: number;
  angle: number;
  distance: number;
  color: string;
  shape: 'circle' | 'diamond' | 'star';
}

const PARTICLE_CONFIGS: Record<'Epic' | 'Legendary' | 'Mythic', {
  count: number;
  colors: string[];
  minSize: number;
  maxSize: number;
  minDistance: number;
  maxDistance: number;
}> = {
  Epic: {
    count: 16,
    colors: ['#a855f7', '#c084fc', '#7c3aed', '#e9d5ff'],
    minSize: 4,
    maxSize: 8,
    minDistance: 80,
    maxDistance: 180,
  },
  Legendary: {
    count: 24,
    colors: ['#eab308', '#facc15', '#fde047', '#fef9c3', '#f59e0b', '#ffffff'],
    minSize: 4,
    maxSize: 10,
    minDistance: 100,
    maxDistance: 220,
  },
  Mythic: {
    count: 36,
    colors: ['#ef4444', '#f97316', '#eab308', '#facc15', '#ffffff', '#fbbf24'],
    minSize: 5,
    maxSize: 12,
    minDistance: 120,
    maxDistance: 280,
  },
};

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function generateParticles(rarity: 'Epic' | 'Legendary' | 'Mythic'): Particle[] {
  const config = PARTICLE_CONFIGS[rarity];
  const particles: Particle[] = [];
  const shapes: Particle['shape'][] = ['circle', 'diamond', 'star'];

  for (let i = 0; i < config.count; i++) {
    particles.push({
      id: i,
      size: rand(config.minSize, config.maxSize),
      delay: rand(0.05, 0.35),
      duration: rand(0.6, 1.2),
      angle: (360 / config.count) * i + rand(-15, 15),
      distance: rand(config.minDistance, config.maxDistance),
      color: config.colors[Math.floor(Math.random() * config.colors.length)],
      shape: shapes[Math.floor(Math.random() * shapes.length)],
    });
  }
  return particles;
}

function generateRingParticles(rarity: 'Legendary' | 'Mythic'): Particle[] {
  const count = rarity === 'Mythic' ? 20 : 12;
  const config = PARTICLE_CONFIGS[rarity];
  const particles: Particle[] = [];

  for (let i = 0; i < count; i++) {
    particles.push({
      id: 1000 + i,
      size: rand(3, 6),
      delay: rand(0.2, 0.5),
      duration: rand(0.8, 1.4),
      angle: (360 / count) * i,
      distance: rand(config.maxDistance, config.maxDistance + 80),
      color: config.colors[Math.floor(Math.random() * config.colors.length)],
      shape: 'circle',
    });
  }
  return particles;
}

function ParticleShape({ particle }: { particle: Particle }) {
  const rad = (particle.angle * Math.PI) / 180;
  const targetX = Math.cos(rad) * particle.distance;
  const targetY = Math.sin(rad) * particle.distance;

  const baseStyle = {
    position: 'absolute' as const,
    left: '50%',
    top: '50%',
    pointerEvents: 'none' as const,
  };

  if (particle.shape === 'diamond') {
    return (
      <motion.div
        style={{
          ...baseStyle,
          width: particle.size,
          height: particle.size,
          backgroundColor: particle.color,
          rotate: '45deg',
          marginLeft: -particle.size / 2,
          marginTop: -particle.size / 2,
        }}
        initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
        animate={{
          x: targetX,
          y: targetY,
          opacity: [0, 1, 1, 0],
          scale: [0, 1.5, 0],
        }}
        transition={{
          duration: particle.duration,
          delay: particle.delay,
          ease: 'easeOut',
        }}
      />
    );
  }

  if (particle.shape === 'star') {
    return (
      <motion.div
        style={{
          ...baseStyle,
          color: particle.color,
          fontSize: particle.size * 2,
          lineHeight: 1,
          marginLeft: -particle.size,
          marginTop: -particle.size,
        }}
        initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
        animate={{
          x: targetX,
          y: targetY,
          opacity: [0, 1, 1, 0],
          scale: [0, 1.2, 0],
          rotate: [0, 180],
        }}
        transition={{
          duration: particle.duration,
          delay: particle.delay,
          ease: 'easeOut',
        }}
      >
        ✦
      </motion.div>
    );
  }

  return (
    <motion.div
      style={{
        ...baseStyle,
        width: particle.size,
        height: particle.size,
        borderRadius: '50%',
        backgroundColor: particle.color,
        boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
        marginLeft: -particle.size / 2,
        marginTop: -particle.size / 2,
      }}
      initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
      animate={{
        x: targetX,
        y: targetY,
        opacity: [0, 1, 1, 0],
        scale: [0, 1.5, 0.5],
      }}
      transition={{
        duration: particle.duration,
        delay: particle.delay,
        ease: 'easeOut',
      }}
    />
  );
}

export default function RarityParticles({ rarity }: { rarity: GachaRarity }) {
  if (!['Epic', 'Legendary', 'Mythic'].includes(rarity)) return null;

  const r = rarity as 'Epic' | 'Legendary' | 'Mythic';
  const particles = generateParticles(r);
  const ringParticles = rarity !== 'Epic'
    ? generateRingParticles(rarity as 'Legendary' | 'Mythic')
    : [];

  const shockwaveColor = {
    Epic: 'rgba(168, 85, 247, 0.4)',
    Legendary: 'rgba(234, 179, 8, 0.5)',
    Mythic: 'rgba(239, 68, 68, 0.6)',
  }[r];

  const shockwaveSize = { Epic: 300, Legendary: 450, Mythic: 600 }[r];

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'visible',
        zIndex: 10,
      }}
    >
      {/* 충격파 링 — opacity: 0에서 시작해서 네모 안 보임 */}
      <motion.div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          borderRadius: '50%',
          border: `2px solid ${shockwaveColor}`,
          translateX: '-50%',
          translateY: '-50%',
        }}
        initial={{ width: 0, height: 0, opacity: 0 }}
        animate={{
          width: shockwaveSize,
          height: shockwaveSize,
          opacity: [0, 0.8, 0],
        }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />

      {/* Mythic 두 번째 충격파 */}
      {rarity === 'Mythic' && (
        <motion.div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            borderRadius: '50%',
            border: '3px solid rgba(249, 115, 22, 0.5)',
            translateX: '-50%',
            translateY: '-50%',
          }}
          initial={{ width: 0, height: 0, opacity: 0 }}
          animate={{
            width: 700,
            height: 700,
            opacity: [0, 0.7, 0],
          }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.15 }}
        />
      )}

      {/* 중심 폭발 글로우 — opacity: 0에서 시작 */}
      <motion.div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${shockwaveColor} 0%, transparent 70%)`,
          translateX: '-50%',
          translateY: '-50%',
        }}
        initial={{ width: 0, height: 0, opacity: 0 }}
        animate={{
          width: rarity === 'Mythic' ? 400 : 250,
          height: rarity === 'Mythic' ? 400 : 250,
          opacity: [0, 1, 0],
        }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />

      {/* 메인 파티클 */}
      {particles.map((p) => (
        <ParticleShape key={p.id} particle={p} />
      ))}

      {/* 링 파티클 */}
      {ringParticles.map((p) => (
        <ParticleShape key={p.id} particle={p} />
      ))}

      {/* Mythic 전용: 떨어지는 불씨 */}
      {rarity === 'Mythic' && <MythicEmbers />}
    </div>
  );
}

function MythicEmbers() {
  const embers = Array.from({ length: 20 }, (_, i) => ({
    id: 2000 + i,
    x: rand(-200, 200),
    delay: rand(0.3, 1.2),
    duration: rand(1.5, 2.5),
    size: rand(3, 7),
    color: ['#ef4444', '#f97316', '#eab308', '#facc15'][Math.floor(Math.random() * 4)],
  }));

  return (
    <>
      {embers.map((ember) => (
        <motion.div
          key={ember.id}
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            width: ember.size,
            height: ember.size,
            borderRadius: '50%',
            backgroundColor: ember.color,
            boxShadow: `0 0 ${ember.size * 3}px ${ember.color}`,
            pointerEvents: 'none',
          }}
          initial={{ x: ember.x, y: -50, opacity: 0 }}
          animate={{
            y: 400,
            opacity: [0, 1, 1, 0],
            x: ember.x + rand(-30, 30),
          }}
          transition={{
            duration: ember.duration,
            delay: ember.delay,
            ease: 'easeIn',
          }}
        />
      ))}
    </>
  );
}