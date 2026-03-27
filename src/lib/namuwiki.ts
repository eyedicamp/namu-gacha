// src/lib/namuwiki.ts
import { GachaResult } from '@/types/gacha';
import { determineRarity } from './rarity';

const NAMU_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
};

// ─────────────────────────────────────────────
// 메인 함수
// ─────────────────────────────────────────────
export async function fetchRandomDocument(): Promise<GachaResult> {
  const MAX_ROUNDS = 5;       // 최대 5라운드 시도
  const TITLES_PER_ROUND = 10; // 라운드당 10개 제목

  for (let round = 0; round < MAX_ROUNDS; round++) {
    // 매 라운드마다 위키백과에서 새로운 랜덤 제목 10개 가져오기
    let titles: string[];
    try {
      titles = await getRandomTitlesFromWikipedia(TITLES_PER_ROUND);
    } catch {
      continue; // 위키백과 API 실패 시 다음 라운드
    }

    // 각 제목으로 나무위키 시도
    for (const title of titles) {
      try {
        const result = await tryNamuWiki(title);
        if (result) return result; // 나무위키에 있으면 즉시 반환!
      } catch {
        continue;
      }
    }
    // 10개 전부 나무위키에 없으면 → 다음 라운드에서 새로운 10개 시도
  }

  // 5라운드 × 10개 = 50개 시도 후에도 실패 (거의 불가능)
  throw new Error('문서를 가져오는 데 실패했습니다. 다시 시도해주세요.');
}

// ─────────────────────────────────────────────
// 위키백과 랜덤 API로 진짜 랜덤 제목 획득
// ─────────────────────────────────────────────
async function getRandomTitlesFromWikipedia(count: number): Promise<string[]> {
  const url =
    `https://ko.wikipedia.org/w/api.php?` +
    new URLSearchParams({
      action: 'query',
      list: 'random',
      rnnamespace: '0',
      rnlimit: String(count),
      format: 'json',
      origin: '*',
    });

  const res = await fetch(url, {
    headers: { 'User-Agent': 'NamuGacha/1.0' },
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) throw new Error('위키백과 랜덤 API 실패');

  const data = await res.json();
  return data.query.random.map((item: { title: string }) => item.title);
}

// ─────────────────────────────────────────────
// 나무위키에서 문서 내용 가져오기
// ─────────────────────────────────────────────
async function tryNamuWiki(title: string): Promise<GachaResult | null> {
  let rawContent = '';

  // 방법 A: /raw/ 엔드포인트
  try {
    const rawUrl = `https://namu.wiki/raw/${encodeURIComponent(title)}`;
    const res = await fetch(rawUrl, {
      headers: NAMU_HEADERS,
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const text = await res.text();
      if (
        !text.startsWith('<!') &&
        !text.startsWith('<html') &&
        text.length > 10
      ) {
        rawContent = text;
      }
    }
  } catch {
    // 방법 B로
  }

  // 방법 B: en.namu.wiki API
  if (!rawContent) {
    try {
      const apiUrl = `https://en.namu.wiki/api/doc/${encodeURIComponent(title)}`;
      const res = await fetch(apiUrl, {
        headers: NAMU_HEADERS,
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (
            data.content &&
            !data.content.startsWith('<!') &&
            data.content.length > 10
          ) {
            rawContent = data.content;
          }
        }
      }
    } catch {
      // 실패
    }
  }

  // 나무위키에 문서가 없으면 null 반환 → 다음 제목 시도
  if (!rawContent) return null;

  const contentLength = rawContent.length;
  const linkMatches = rawContent.match(/$$$$/g);
  const linkCount = linkMatches ? linkMatches.length : 0;
  const summary = extractSummary(rawContent, title);
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
// 유틸리티 함수들
// ─────────────────────────────────────────────

function escapeRegExp(str: string): string {
  let result = '';
  const specials = new Set([
    '.', '*', '+', '?', '^', '$', '{', '}',
    '(', ')', '|', '[', ']', '\\',
  ]);
  for (const ch of str) {
    if (specials.has(ch)) {
      result += '\\' + ch;
    } else {
      result += ch;
    }
  }
  return result;
}

function extractSummary(raw: string, title: string): string {
  const overviewMatch = raw.match(
    /==\s*개요\s*==\s*\n([\s\S]*?)(?=\n==\s*[^=]|$)/
  );
  if (overviewMatch) {
    const text = stripNamuMarkup(overviewMatch[1]).trim();
    if (text.length > 10) return trimSummary(text);
  }

  const altMatch = raw.match(
    /==\s*(소개|설명|정의|기본 정보)\s*==\s*\n([\s\S]*?)(?=\n==\s*[^=]|$)/
  );
  if (altMatch) {
    const text = stripNamuMarkup(altMatch[2]).trim();
    if (text.length > 10) return trimSummary(text);
  }

  const introMatch = raw.match(/^([\s\S]*?)(?=\n==\s*[^=])/);
  if (introMatch) {
    const text = stripNamuMarkup(introMatch[1]).trim();
    const cleaned = removeMetaJunk(text, title);
    if (cleaned.length > 15) return trimSummary(cleaned);
  }

  const fullText = stripNamuMarkup(raw);
  const cleaned = removeMetaJunk(fullText, title);
  return trimSummary(cleaned);
}

function stripNamuMarkup(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, '')
    .replace(/##.*$/gm, '')
    .replace(/$$include$$[^$$]*$$$$/gi, '')
    .replace(
      /$$(목차|tableofcontents|각주|footnote|br|clearfix|date|datetime|age|dday|ruby|youtube$$[^$$]*$$|파일:[^$$]*)$$/gi,
      ''
    )
    .replace(/$$분류:[^$$]*$$/g, '')
    .replace(/\{\{\{#!folding\s*[^\n]*\n[\s\S]*?\}\}\}/g, '')
    .replace(/\{\{\{[^}]*\}\}\}/g, '')
    .replace(/$$$$([^$$|]*)\|([^$$]*)$$$$/g, '$2')
    .replace(/$$$$([^$$]*)$$$$/g, '$1')
    .replace(/'''([^']*)'''/g, '$1')
    .replace(/''([^']*)''/g, '$1')
    .replace(/~~([^~]*)~~/g, '$1')
    .replace(/__([^_]*)__/g, '$1')
    .replace(/^={1,6}\s*(.+?)\s*={1,6}\s*$/gm, '$1')
    .replace(/\|\|[^|]*\|\|/g, '')
    .replace(/$$\*[^$$]*$$/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function removeMetaJunk(text: string, title: string): string {
  const escapedTitle = escapeRegExp(title);
  return text
    .replace(new RegExp(escapedTitle + '\\s*-\\s*나무위키', 'g'), '')
    .replace(/$$분류:[^$$]*$$/g, '')
    .replace(/최근\s*변경\s*최근\s*토론\s*특수\s*기능/g, '')
    .replace(/최근\s*수정\s*시각\s*:\s*[\d\-:\s]+/g, '')
    .replace(/\d+편집\s*토론\s*역사\s*분류/g, '')
    .replace(/편집\s*토론\s*역사\s*분류/g, '')
    .replace(/편집\s*요청[^.]*바랍니다\./g, '')
    .replace(/편집\s*요청\s*도움말/g, '')
    .replace(/편집\s*권한이\s*부족[^.]*\./g, '')
    .replace(/로그인된\s*사용자[^.]*\./g, '')
    .replace(/해당\s*문서의\s*ACL[^.]*\./g, '')
    .replace(/이\s*문서는\s*토막글\s*입니다[^.]*\./g, '')
    .replace(/토막글\s*규정\s*을\s*유의[^.]*\./g, '')
    .replace(/$$\s*펼치기\s*·\s*접기\s*$$/g, '')
    .replace(/펼치기\s*·\s*접기/g, '')
    .replace(new RegExp('^\\s*' + escapedTitle + '\\s*'), '')
    .replace(/\s+/g, ' ')
    .trim();
}

function trimSummary(text: string): string {
  if (!text || text.length < 5) {
    return '요약을 불러올 수 없습니다.';
  }

  const sentences = text
    .split(/(?<=[.다요함됨임음까!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);

  const meaningful = sentences.filter((s) => {
    if (s.length < 10) return false;
    if (/^(최근|편집|토론|역사|분류|특수|로그인|해당|이\s*문서)/.test(s))
      return false;
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