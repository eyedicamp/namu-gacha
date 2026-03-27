// src/lib/namuwiki.ts
import { GachaResult } from '@/types/gacha';
import { determineRarity } from './rarity';

// ─────────────────────────────────────────────
// 메인 함수
// ─────────────────────────────────────────────
export async function fetchRandomDocument(): Promise<GachaResult> {
  const MAX_ATTEMPTS = 3;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      // 위키백과에서 랜덤 문서 1개의 제목 + 요약 + 본문 길이를 한번에 가져오기
      const result = await getRandomWikipediaArticle();
      if (result) return result;
    } catch {
      continue;
    }
  }

  throw new Error('문서를 가져오는 데 실패했습니다. 다시 시도해주세요.');
}

// ─────────────────────────────────────────────
// 위키백과 랜덤 문서 가져오기 (제목 + 요약 + 본문 길이 한번에)
// ─────────────────────────────────────────────
async function getRandomWikipediaArticle(): Promise<GachaResult | null> {
  // 1단계: 랜덤 제목 가져오기
  const randomUrl =
    `https://ko.wikipedia.org/w/api.php?` +
    new URLSearchParams({
      action: 'query',
      list: 'random',
      rnnamespace: '0',
      rnlimit: '1',
      format: 'json',
      origin: '*',
    });

  const randomRes = await fetch(randomUrl, {
    headers: { 'User-Agent': 'NamuGacha/1.0' },
    signal: AbortSignal.timeout(5000),
  });

  if (!randomRes.ok) return null;
  const randomData = await randomRes.json();
  const title: string = randomData.query.random[0].title;

  // 2단계: 해당 문서의 요약 + 본문 길이 가져오기
  const detailUrl =
    `https://ko.wikipedia.org/w/api.php?` +
    new URLSearchParams({
      action: 'query',
      titles: title,
      prop: 'extracts|revisions|links',
      exintro: 'true',           // 도입부만
      explaintext: 'true',       // 마크업 제거된 텍스트
      exsentences: '5',          // 최대 5문장
      rvprop: 'size',            // 문서 전체 크기
      pllimit: 'max',            // 링크 수
      format: 'json',
      origin: '*',
    });

  const detailRes = await fetch(detailUrl, {
    headers: { 'User-Agent': 'NamuGacha/1.0' },
    signal: AbortSignal.timeout(5000),
  });

  if (!detailRes.ok) return null;
  const detailData = await detailRes.json();

  const pages = detailData.query.pages;
  const pageId = Object.keys(pages)[0];
  const page = pages[pageId];

  // 문서가 없거나 요약이 너무 짧으면 스킵
  if (!page || pageId === '-1') return null;

  const extract: string = page.extract || '';
  if (extract.length < 20) return null;

  // 문서 크기 (바이트)
  const contentLength: number = page.revisions?.[0]?.size || extract.length * 5;

  // 링크 수
  const linkCount: number = page.links?.length || 0;

  const summary = trimSummary(extract);
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
// 요약 다듬기
// ─────────────────────────────────────────────
function trimSummary(text: string): string {
  if (!text || text.length < 5) {
    return '요약을 불러올 수 없습니다.';
  }

  // 위키백과 특유의 괄호 발음 표기 정리
  const cleaned = text
    .replace(/\s*$$[^)]*$$\s*/g, ' ')  // (영어: ...) 같은 괄호 제거
    .replace(/\s+/g, ' ')
    .trim();

  const sentences = cleaned
    .split(/(?<=[.다요함됨임음까!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);

  const meaningful = sentences.filter((s) => s.length >= 10);

  if (meaningful.length === 0) {
    return cleaned.length > 150 ? cleaned.slice(0, 150) + '...' : cleaned;
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