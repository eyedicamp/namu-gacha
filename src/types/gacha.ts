export type GachaRarity = 'Normal' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';

export interface GachaResult {
  title: string;
  url: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';
  remaining?: number;
  resetTime?: string;
  pulledAt?: string; // 뽑은 시간
  id?: string; // 고유 ID
}

export interface GachaHistory {
  date: string;
  count: number;
  items: GachaResult[];
}

export const RARITY_CONFIG: Record<GachaRarity, {
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
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