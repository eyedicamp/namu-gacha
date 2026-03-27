import { GachaResult } from '@/types/gacha';
import { determineRarity } from './rarity';

const NAMU_RANDOM_URL = 'https://namu.wiki/random';
const NAMU_API_BASE = 'https://en.namu.wiki/api/doc';

interface NamuApiResponse {
  title: string;
  lastUpdated: string;
  content: string;
}

function escapeRegExp(str: string): string {
  let result = '';
  const specials = new Set([
    '.', '*', '+', '?', '^', '$', '{', '}',
    '(', ')', '|', '[', ']', '\\'
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

export async function fetchRandomDocument(): Promise<GachaResult> {
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  };

  // 1) 랜덤 → 제목 추출
  const randomRes = await fetch(NAMU_RANDOM_URL, {
    redirect: 'follow',
    headers,
  });

  if (!randomRes.ok) {
    throw new Error(`나무위키 랜덤 요청 실패: ${randomRes.status}`);
  }

  const finalUrl = randomRes.url;
  const titleMatch = finalUrl.match(/\/w\/(.+)/);
  const title = titleMatch
    ? decodeURIComponent(titleMatch[1]).replace(/_/g, ' ')
    : '알 수 없는 문서';

  // 2) API 시도
  let rawContent = '';
  let isFromApi = false;

  try {
    const apiUrl = `${NAMU_API_BASE}/${encodeURIComponent(title)}`;
    const apiRes = await fetch(apiUrl, { headers });

    if (apiRes.ok) {
      const contentType = apiRes.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const apiData: NamuApiResponse = await apiRes.json();
        if (apiData.content && !apiData.content.startsWith('<!')) {
          rawContent = apiData.content;
          isFromApi = true;
        }
      }
    }
  } catch {
    // API 실패 → fallback
  }

  // 3) Fallback: HTML에서 추출
  if (!isFromApi) {
    rawContent = await fallbackExtract(finalUrl, headers);
  }

  // 4) 분석
  const contentLength = rawContent.length;

  const linkMatches = rawContent.match(/$$$$/g);
  const linkCount = linkMatches ? linkMatches.length : 0;

  // 5) 요약 추출: API 원문에서 개요 우선 추출
  const summary = isFromApi
    ? extractApiSummary(rawContent, title)
    : extractHtmlSummary(rawContent, title);

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

/**
 * HTML fallback: 페이지에서 텍스트 추출
 */
async function fallbackExtract(
  url: string,
  headers: Record<string, string>
): Promise<string> {
  try {
    const res = await fetch(url, { redirect: 'follow', headers });
    const html = await res.text();

    const articleMatch = html.match(
      /<article[^>]*>([\s\S]*?)<\/article>/i
    );
    const bodyHtml = articleMatch ? articleMatch[1] : html;

    return bodyHtml
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim();
  } catch {
    return '';
  }
}

/**
 * ★ 핵심: API 원문(나무마크)에서 "개요" 섹션 우선 추출
 */
function extractApiSummary(raw: string, title: string): string {
  // 전략 1: "== 개요 ==" 섹션 추출
  const overviewMatch = raw.match(
    /==\s*개요\s*==\s*\n([\s\S]*?)(?=\n==\s*[^=]|$)/
  );

  if (overviewMatch) {
    const overviewText = stripNamuMarkup(overviewMatch[1]).trim();
    if (overviewText.length > 10) {
      return trimSummary(overviewText);
    }
  }

  // 전략 2: "== 소개 ==" 또는 "== 설명 ==" 섹션
  const altMatch = raw.match(
    /==\s*(소개|설명|정의|기본 정보)\s*==\s*\n([\s\S]*?)(?=\n==\s*[^=]|$)/
  );

  if (altMatch) {
    const altText = stripNamuMarkup(altMatch[2]).trim();
    if (altText.length > 10) {
      return trimSummary(altText);
    }
  }

  // 전략 3: 첫 번째 == 섹션 이전의 도입부 (개요 헤딩 없이 바로 시작하는 문서)
  const introMatch = raw.match(
    /^([\s\S]*?)(?=\n==\s*[^=])/
  );

  if (introMatch) {
    const introText = stripNamuMarkup(introMatch[1]).trim();
    // 분류, include, 틀 등을 제거한 후 의미 있는 텍스트가 있는지 확인
    const cleaned = removeMetaJunk(introText, title);
    if (cleaned.length > 15) {
      return trimSummary(cleaned);
    }
  }

  // 전략 4: 전체에서 첫 의미 있는 문장 추출 (최후의 수단)
  const fullText = stripNamuMarkup(raw);
  const cleaned = removeMetaJunk(fullText, title);
  return trimSummary(cleaned);
}

/**
 * HTML fallback에서 요약 추출
 */
function extractHtmlSummary(text: string, title: string): string {
  const cleaned = removeMetaJunk(text, title);
  return trimSummary(cleaned);
}

/**
 * 메타 쓰레기 제거 (분류, 네비게이션, 인포박스 등)
 */
function removeMetaJunk(text: string, title: string): string {
  const escapedTitle = escapeRegExp(title);

  return text
    // "제목 - 나무위키" 패턴
    .replace(new RegExp(escapedTitle + '\\s*-\\s*나무위키', 'g'), '')
    // 분류 태그
    .replace(/$$분류:[^$$]*$$/g, '')
    // 네비게이션 메타
    .replace(/최근\s*변경\s*최근\s*토론\s*특수\s*기능/g, '')
    .replace(/최근\s*수정\s*시각\s*:\s*[\d\-:\s]+/g, '')
    .replace(/\d+편집\s*토론\s*역사\s*분류/g, '')
    .replace(/편집\s*토론\s*역사\s*분류/g, '')
    .replace(/편집\s*요청[^.]*바랍니다\./g, '')
    .replace(/편집\s*요청\s*도움말/g, '')
    .replace(/편집\s*권한이\s*부족[^.]*\./g, '')
    .replace(/로그인된\s*사용자[^.]*\./g, '')
    .replace(/해당\s*문서의\s*ACL[^.]*\./g, '')
    // 토막글 안내
    .replace(/이\s*문서는\s*토막글\s*입니다[^.]*\./g, '')
    .replace(/토막글\s*규정\s*을\s*유의[^.]*\./g, '')
    // 접기/펼치기
    .replace(/$$\s*펼치기\s*·\s*접기\s*$$/g, '')
    .replace(/펼치기\s*·\s*접기/g, '')
    // 앞부분 제목 반복 제거
    .replace(new RegExp('^\\s*' + escapedTitle + '\\s*'), '')
    // 연속 공백
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 나무마크 문법 제거
 */
function stripNamuMarkup(raw: string): string {
  return raw
    // HTML 태그
    .replace(/<[^>]+>/g, '')
    // 주석
    .replace(/##.*$/gm, '')
    // include
    .replace(/$$include$$[^$$]*$$$$/gi, '')
    // 매크로들
    .replace(
      /$$(목차|tableofcontents|각주|footnote|br|clearfix|date|datetime|age|dday|ruby|youtube$$[^$$]*$$|파일:[^$$]*)$$/gi,
      ''
    )
    // 분류
    .replace(/$$분류:[^$$]*$$/g, '')
    // folding
    .replace(/\{\{\{#!folding\s*[^\n]*\n[\s\S]*?\}\}\}/g, '')
    // 문법 블록 {{{ }}}
    .replace(/\{\{\{[^}]*\}\}\}/g, '')
    // 링크 [[표시|텍스트]] → 텍스트
    .replace(/$$$$([^$$|]*)\|([^$$]*)$$$$/g, '$2')
    // 링크 [[텍스트]] → 텍스트
    .replace(/$$$$([^$$]*)$$$$/g, '$1')
    // 볼드
    .replace(/'''([^']*)'''/g, '$1')
    // 이탤릭
    .replace(/''([^']*)''/g, '$1')
    // 취소선
    .replace(/~~([^~]*)~~/g, '$1')
    // 밑줄
    .replace(/__([^_]*)__/g, '$1')
    // 헤딩 == 제목 ==
    .replace(/^={1,6}\s*(.+?)\s*={1,6}\s*$/gm, '$1')
    // 테이블
    .replace(/\|\|[^|]*\|\|/g, '')
    // 각주 내용
    .replace(/$$\*[^$$]*$$/g, '')
    // 여러 줄바꿈 정리
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/**
 * 요약을 150자 이내로 다듬기
 */
function trimSummary(text: string): string {
  if (!text || text.length < 5) {
    return '요약을 불러올 수 없습니다.';
  }

  // 문장 단위로 분리
  const sentences = text
    .split(/(?<=[.다요함됨임음까!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);

  // 의미 있는 문장만 필터
  const meaningful = sentences.filter((s) => {
    if (s.length < 10) return false;
    if (/^(최근|편집|토론|역사|분류|특수|로그인|해당|이\s*문서)/.test(s)) return false;
    return true;
  });

  if (meaningful.length === 0) {
    return '요약을 불러올 수 없습니다.';
  }

  let summary = meaningful[0];

  // 첫 문장이 짧으면 두 번째 문장 추가
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