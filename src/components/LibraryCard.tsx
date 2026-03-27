'use client';

import { motion } from 'framer-motion';
import { GachaResult } from '@/types/gacha';

interface LibraryCardProps {
  result: GachaResult;
  index: number;
}

const rarityColors = {
  Normal: 'from-gray-600 to-gray-700',
  Rare: 'from-blue-600 to-blue-700',
  Epic: 'from-purple-600 to-purple-700',
  Legendary: 'from-yellow-500 to-orange-600',
  Mythic: 'from-pink-500 to-red-600',
};

const rarityEmoji = {
  Normal: '⚪',
  Rare: '🔵',
  Epic: '🟣',
  Legendary: '🟡',
  Mythic: '🔴',
};

export default function LibraryCard({ result, index }: LibraryCardProps) {
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <motion.a
      href={result.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block p-4 rounded-xl bg-gradient-to-br ${rarityColors[result.rarity]} hover:scale-105 transition-transform cursor-pointer`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -5 }}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl">{rarityEmoji[result.rarity]}</span>
        <span className="text-xs text-white/60">
          {result.pulledAt && formatDate(result.pulledAt)}
        </span>
      </div>
      
      <h3 className="text-lg font-bold text-white mb-1 line-clamp-2">
        {result.title}
      </h3>
      
      <p className="text-xs text-white/80 font-medium">
        {result.rarity}
      </p>
    </motion.a>
  );
}