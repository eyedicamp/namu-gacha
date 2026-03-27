import { GachaResult } from '@/types/gacha';
import { determineRarity } from './rarity';

const DATASET = 'heegyu/namuwiki-extracted';
const CONFIG = 'default';
const SPLIT = 'train';
const TOTAL_ROWS = 565000;

// ─────────────────────────────────────────────
// 메인 함수
// ─────────────────────────────────────────────
export async function fetchRandomDocument(): Promise<GachaResult> {
  const MAX_ATTEMPTS = 5;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const result = await getRandomFromHuggingFace();
      if (result) return result;
    } catch (e) {
      console.error(`시도 ${attempt + 1} 실패:`, e);
      continue;
    }
  }

  throw new Error('문서를 가져오는 데 실패했습니다. 다시 시도해주세요.');
}

// ─────────────────────────────────────────────
// Hugging Face Dataset Viewer API로 랜덤 문서 가져오기
// ─────────────────────────────────────────────
async function getRandomFromHuggingFace(): Promise<GachaResult | null> {
  const randomOffset = Math.floor(Math.random() * TOTAL_ROWS);

  const url =
    `https://datasets-server.huggingface.co/rows?` +
    new URLSearchParams({
      dataset: DATASET,
      config: CONFIG,
      split: SPLIT,
      offset: String(randomOffset),
      length: '1',
    });

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'NamuGacha/1.0',
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    throw new Error(`HuggingFace API 실패: ${res.status}`);
  }

  const data = await res.json();

  if (!data.rows || data.rows.length === 0) return null;

  const row = data.rows[0].row;
  const title: string = row.title || '';
  const text: string = row.text || '';

  if (!title || text.length < 30) return null;

  const summary = extractSummary(text, title);
  if (summary === '요약을 불러올 수 없습니다.') return null;

  const contentLength = text.length;
  const rarity = determineRarity(contentLength);

  return {
    title,
    summary,
    url: `https://namu.wiki/w/${encodeURIComponent(title)}`,
    rarity,
    contentLength,
    // linkCount 제거됨
  };
}

// ─────────────────────────────────────────────
// estimateLinkCount 함수 완전 제거됨
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// 요약 추출 (전처리된 깨끗한 텍스트에서)
// ─────────────────────────────────────────────
function extractSummary(text: string, title: string): string {
  const cleaned = text
    .replace(/\n{2,}/g, '\n')
    .replace(/^\s+/gm, '')
    .trim();

  const lines = cleaned.split('\n').filter((line) => line.trim().length > 0);

  const meaningful = lines.filter((line) => {
    const trimmed = line.trim();
    if (trimmed.length < 15) return false;
    if (trimmed === title) return false;
    if (/^(분류|틀|파일|목차|각주|관련 문서)/.test(trimmed)) return false;
    if (/^\d+\.\s/.test(trimmed) && trimmed.length < 30) return false;
    return true;
  });

  if (meaningful.length === 0) {
    return '요약을 불러올 수 없습니다.';
  }

  let summary = meaningful[0];

  if (summary.length < 80 && meaningful.length > 1) {
    summary += ' ' + meaningful[1];
  }

  if (summary.length > 150) {
    const cutPoint = summary.slice(0, 170).search(/[.다요함됨임음까!?]\s/);
    if (cutPoint > 50) {
      return summary.slice(0, cutPoint + 1);
    }
    return summary.slice(0, 150) + '...';
  }

  return summary;
}