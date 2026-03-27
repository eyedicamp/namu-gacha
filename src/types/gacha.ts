export type GachaRarity = 'Normal' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';

export interface GachaResult {
  title: string;
  summary: string;
  url: string;
  rarity: GachaRarity;
  contentLength: number;
  linkCount: number;
}

export const RARITY_CONFIG: Record<GachaRarity, {
  label: string;
  emoji: string;
  color: string;        // Tailwind text color
  bgColor: string;      // Tailwind bg color
  borderColor: string;  // Tailwind border color
  glowColor: string;    // CSS glow color
}> = {
  Normal: {
    label: '⬜ Normal',
    emoji: '⬜',
    color: 'text-gray-400',
    bgColor: 'bg-gray-900',
    borderColor: 'border-gray-600',
    glowColor: '#9ca3af',
  },
  Rare: {
    label: '🟦 Rare',
    emoji: '🟦',
    color: 'text-blue-400',
    bgColor: 'bg-blue-950',
    borderColor: 'border-blue-500',
    glowColor: '#3b82f6',
  },
  Epic: {
    label: '🟪 Epic',
    emoji: '🟪',
    color: 'text-purple-400',
    bgColor: 'bg-purple-950',
    borderColor: 'border-purple-500',
    glowColor: '#a855f7',
  },
  Legendary: {
    label: '🟨 Legendary',
    emoji: '🟨',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-950',
    borderColor: 'border-yellow-500',
    glowColor: '#eab308',
  },
  Mythic: {
    label: '🟥 Mythic',
    emoji: '🟥',
    color: 'text-red-400',
    bgColor: 'bg-red-950',
    borderColor: 'border-red-500',
    glowColor: '#ef4444',
  },
};