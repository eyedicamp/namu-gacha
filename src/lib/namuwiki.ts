// src/lib/namuwiki.ts
import { GachaResult } from '@/types/gacha';
import { determineRarity } from './rarity';

// heegyu/namuwiki-extracted 데이터셋 정보
const DATASET = 'heegyu/namuwiki-extracted';
const CONFIG = 'default';
const SPLIT = 'train';
const TOTAL_ROWS = 565000; // 약 565k rows

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
  // 랜덤 offset 생성
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

  // rows 배열에서 첫 번째 row 가져오기
  if (!data.rows || data.rows.length === 0) return null;

  const row = data.rows[0].row;
  const title: string = row.title || '';
  const text: string = row.text || '';

  // 빈 문서 스킵
  if (!title || text.length < 30) return null;

  // 요약 추출
  const summary = extractSummary(text, title);
  if (summary === '요약을 불러올 수 없습니다.') return null;

  // 레어도 판정
  const contentLength = text.length;
  const linkCount = estimateLinkCount(text);
  const rarity = determineRarity(contentLength, linkCount);

  return {
    title,
    summary,
    url: `https://namu.wiki/w/${encodeURIComponent(title)}`,
    rarity,
    contentLength,
    linkCount,
  };
}

// ─────────────────────────────────────────────
// 링크 수 추정 (전처리된 텍스트에서)
// ─────────────────────────────────────────────
function estimateLinkCount(text: string): number {
  // namuwiki-extracted는 마크업이 제거되어 있으므로
  // 문서 길이 기반으로 추정
  // 평균적으로 나무위키 문서는 200자당 약 1개의 링크
  return Math.floor(text.length / 200);
}

// ─────────────────────────────────────────────
// 요약 추출 (전처리된 깨끗한 텍스트에서)
// ─────────────────────────────────────────────
function extractSummary(text: string, title: string): string {
  // namuwiki-extracted는 이미 마크업이 제거된 상태
  // 첫 부분에서 의미 있는 문장 추출

  const cleaned = text
    .replace(/\n{2,}/g, '\n')
    .replace(/^\s+/gm, '')
    .trim();

  // 줄 단위로 분리
  const lines = cleaned.split('\n').filter((line) => line.trim().length > 0);

  // 제목과 동일한 줄, 너무 짧은 줄 제거
  const meaningful = lines.filter((line) => {
    const trimmed = line.trim();
    if (trimmed.length < 15) return false;
    if (trimmed === title) return false;
    // 메타 정보 제거
    if (/^(분류|틀|파일|목차|각주|관련 문서)/.test(trimmed)) return false;
    if (/^\d+\.\s/.test(trimmed) && trimmed.length < 30) return false;
    return true;
  });

  if (meaningful.length === 0) {
    return '요약을 불러올 수 없습니다.';
  }

  // 첫 번째 의미 있는 줄에서 문장 추출
  let summary = meaningful[0];

  // 너무 짧으면 다음 줄도 합치기
  if (summary.length < 80 && meaningful.length > 1) {
    summary += ' ' + meaningful[1];
  }

  // 150자 제한
  if (summary.length > 150) {
    const cutPoint = summary.slice(0, 170).search(/[.다요함됨임음까!?]\s/);
    if (cutPoint > 50) {
      return summary.slice(0, cutPoint + 1);
    }
    return summary.slice(0, 150) + '...';
  }

  return summary;
}