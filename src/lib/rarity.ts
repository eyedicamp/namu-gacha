import { GachaRarity } from '@/types/gacha';

/**
 * 나무마크 원문 기준 등급 판정
 *
 * 점수 = contentLength + (linkCount * 80)
 *
 *   Mythic     : score >= 60000  (진짜 대형 문서만)
 *   Legendary  : score >= 25000
 *   Epic       : score >= 10000
 *   Rare       : score >= 3000
 *   Normal     : 나머지
 */
export function determineRarity(contentLength: number, linkCount: number): GachaRarity {
  const score = contentLength + linkCount * 80;

  if (score >= 60000) return 'Mythic';
  if (score >= 25000) return 'Legendary';
  if (score >= 10000) return 'Epic';
  if (score >= 3000)  return 'Rare';
  return 'Normal';

}