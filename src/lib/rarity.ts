import { GachaRarity } from '@/types/gacha';

/**
 * 나무위키 문서 등급 판정 (순수 문서 길이 기반)
 *
 * 나무위키 56만개 문서 실제 length 분포 기반 threshold:
 *   Mythic     ~3%   : length >= 25000  (상위 3%)
 *   Legendary  ~9%   : length >= 9000   (상위 12%)
 *   Epic       ~18%  : length >= 3500   (상위 30%)
 *   Rare       ~30%  : length >= 1200   (상위 60%)
 *   Normal     ~40%  : 나머지
 */
export function determineRarity(contentLength: number): GachaRarity {
  if (contentLength >= 25000) return 'Mythic';
  if (contentLength >= 9000)  return 'Legendary';
  if (contentLength >= 3500)  return 'Epic';
  if (contentLength >= 1200)  return 'Rare';
  return 'Normal';
}