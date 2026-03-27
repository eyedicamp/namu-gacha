'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GachaResult } from '@/types/gacha';
import LibraryCard from '@/components/LibraryCard';
import Navigation from '@/components/Navigation';

type FilterType = 'all' | 'Normal' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';

export default function LibraryPage() {
  const [history, setHistory] = useState<GachaResult[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [stats, setStats] = useState({
    total: 0,
    Normal: 0,
    Rare: 0,
    Epic: 0,
    Legendary: 0,
    Mythic: 0,
  });

  useEffect(() => {
    const stored = localStorage.getItem('gacha_history');
    if (stored) {
      const items: GachaResult[] = JSON.parse(stored);
      setHistory(items);

      const newStats = {
        total: items.length,
        Normal: items.filter((i) => i.rarity === 'Normal').length,
        Rare: items.filter((i) => i.rarity === 'Rare').length,
        Epic: items.filter((i) => i.rarity === 'Epic').length,
        Legendary: items.filter((i) => i.rarity === 'Legendary').length,
        Mythic: items.filter((i) => i.rarity === 'Mythic').length,
      };
      setStats(newStats);
    }
  }, []);

  const filteredHistory =
    filter === 'all' ? history : history.filter((item) => item.rarity === filter);

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6 pt-32 sm:pt-24">
      <Navigation />

      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold mb-2">📚 나의 라이브러리</h1>
          <p className="text-gray-400">지금까지 뽑은 문서들</p>
        </motion.div>

        <motion.div
          className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-gray-400">전체</p>
          </div>
          <div className="bg-gray-600/20 backdrop-blur-sm rounded-xl p-4 border border-gray-500/30 text-center">
            <p className="text-2xl font-bold">{stats.Normal}</p>
            <p className="text-xs text-gray-400">⚪ Normal</p>
          </div>
          <div className="bg-blue-600/20 backdrop-blur-sm rounded-xl p-4 border border-blue-500/30 text-center">
            <p className="text-2xl font-bold">{stats.Rare}</p>
            <p className="text-xs text-gray-400">🔵 Rare</p>
          </div>
          <div className="bg-purple-600/20 backdrop-blur-sm rounded-xl p-4 border border-purple-500/30 text-center">
            <p className="text-2xl font-bold">{stats.Epic}</p>
            <p className="text-xs text-gray-400">🟣 Epic</p>
          </div>
          <div className="bg-yellow-600/20 backdrop-blur-sm rounded-xl p-4 border border-yellow-500/30 text-center">
            <p className="text-2xl font-bold">{stats.Legendary}</p>
            <p className="text-xs text-gray-400">🟡 Legendary</p>
          </div>
          <div className="bg-pink-600/20 backdrop-blur-sm rounded-xl p-4 border border-pink-500/30 text-center">
            <p className="text-2xl font-bold">{stats.Mythic}</p>
            <p className="text-xs text-gray-400">🔴 Mythic</p>
          </div>
        </motion.div>

        <motion.div
          className="flex flex-wrap gap-2 mb-6 justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {(['all', 'Normal', 'Rare', 'Epic', 'Legendary', 'Mythic'] as FilterType[]).map(
            (type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filter === type
                    ? 'bg-white text-gray-900'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {type === 'all' ? '전체' : type}
              </button>
            )
          )}
        </motion.div>

        {filteredHistory.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredHistory.map((item, index) => (
              <LibraryCard key={item.id} result={item} index={index} />
            ))}
          </div>
        ) : (
          <motion.div
            className="text-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-6xl mb-4">📭</p>
            <p className="text-gray-400">
              {filter === 'all'
                ? '아직 뽑은 문서가 없습니다'
                : `${filter} 등급 문서가 없습니다`}
            </p>
          </motion.div>
        )}
      </div>
    </main>
  );
}