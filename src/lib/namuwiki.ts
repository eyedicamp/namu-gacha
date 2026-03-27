// src/lib/namuwiki.ts
import { GachaResult } from '@/types/gacha';
import { determineRarity } from './rarity';

// 나무위키 OpenSearch API (상대적으로 안정적)
const NAMU_SEARCH_API = 'https://namu.wiki/api/search';
const NAMU_RAW_API = 'https://namu.wiki/raw';

// 랜덤 키워드 풀 (다양한 주제에서 검색 시드로 사용)
const RANDOM_SEEDS = [
  '대한민국', '역사', '과학', '수학', '물리', '화학', '생물',
  '컴퓨터', '프로그래밍', '게임', '애니메이션', '만화', '영화',
  '음악', '드라마', '소설', '문학', '철학', '경제', '정치',
  '지리', '천문', '우주', '동물', '식물', '음식', '요리',
  '스포츠', '축구', '야구', '농구', '올림픽', '월드컵',
  '서울', '부산', '대구', '인천', '광주', '대전', '울산',
  '일본', '중국', '미국', '영국', '프랑스', '독일', '이탈리아',
  '러시아', '호주', '캐나다', '브라질', '인도', '멕시코',
  '삼국지', '조선', '고려', '백제', '신라', '고구려',
  '포켓몬', '마리오', '젤다', '파이널판타지', '리그오브레전드',
  '원피스', '나루토', '블리치', '진격의거인', '귀멸의칼날',
  '아이돌', '방탄소년단', '블랙핑크', '뉴진스',
  '인터넷', '유튜브', '트위치', '디스코드',
  '자동차', '비행기', '기차', '선박', '로켓',
  '태양계', '은하', '블랙홀', '별자리',
  '공룡', '포유류', '곤충', '어류', '조류',
  '피아노', '기타', '바이올린', '드럼',
  '커피', '라면', '치킨', '피자', '햄버거', '초콜릿',
  '서울대학교', '연세대학교', '고려대학교', 'KAIST',
  '넷플릭스', '디즈니', '마블', 'DC코믹스',
  '삼성', '현대', 'LG', 'SK', '카카오', '네이버',
  '위키', '나무위키', '백과사전',
  '수영', '달리기', '등산', '자전거', '스키',
  '강아지', '고양이', '토끼', '햄스터', '앵무새',
  '봄', '여름', '가을', '겨울', '태풍', '지진', '화산',
];

function getRandomSeeds(count: number): string[] {
  const shuffled = [...RANDOM_SEEDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
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
  const headers: Record<string, string> = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
  };

  // ── 전략 1: namu.wiki/random 시도 ──
  try {
    const title = await fetchRandomTitle(headers);
    if (title) {
      return await buildGachaResult(title, headers);
    }
  } catch {
    // 전략 2로 fallback
  }

  // ── 전략 2: 검색 API로 랜덤 문서 찾기 ──
  try {
    const title = await fetchRandomViaSearch(headers);
    if (title) {
      return await buildGachaResult(title, headers);
    }
  } catch {
    // 전략 3으로 fallback
  }

  // ── 전략 3: 시드 키워드에서 랜덤 선택 후 raw 페이지 시도 ──
  const seeds = getRandomSeeds(5);
  for (const seed of seeds) {
    try {
      return await buildGachaResult(seed, headers);
    } catch {
      continue;
    }
  }

  throw new Error('모든 방법으로 문서를 가져오는 데 실패했습니다.');
}

/**
 * 전략 1: /random 리다이렉트에서 제목 추출
 */
async function fetchRandomTitle(
  headers: Record<string, string>
): Promise<string | null> {
  const res = await fetch('https://namu.wiki/random', {
    redirect: 'follow',
    headers,
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) return null;

  const finalUrl = res.url;
  const titleMatch = finalUrl.match(/\/w\/(.+)/);
  if (!titleMatch) return null;

  return decodeURIComponent(titleMatch[1]).replace(/_/g, ' ');
}

/**
 * 전략 2: 검색 API로 랜덤 문서 찾기
 */
async function fetchRandomViaSearch(
  headers: Record<string, string>
): Promise<string | null> {
  const seed = getRandomSeeds(1)[0];

  // 나무위키 검색 페이지를 파싱
  const searchUrl = `https://namu.wiki/Search?q=${encodeURIComponent(seed)}&searchTarget=title`;
  const res = await fetch(searchUrl, {
    headers,
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) return null;

  const html = await res.text();

  // 검색 결과에서 문서 링크 추출
  const linkPattern = /href="\/w\/([^"]+)"/g;
  const titles: string[] = [];
  let match;

  while ((match = linkPattern.exec(html)) !== null) {
    try {
      const decoded = decodeURIComponent(match[1]).replace(/_/g, ' ');
      // 특수 페이지 제외
      if (
        !decoded.startsWith('분류:') &&
        !decoded.startsWith('틀:') &&
        !decoded.startsWith('나무위키:') &&
        !decoded.startsWith('파일:') &&
        !decoded.includes(':대문')
      ) {
        titles.push(decoded);
      }
    } catch {
      continue;
    }
  }

  if (titles.length === 0) return null;

  // 랜덤으로 하나 선택
  return titles[Math.floor(Math.random() * titles.length)];
}

/**
 * 문서 제목으로 GachaResult 생성
 */
async function buildGachaResult(
  title: string,
  headers: Record<string, string>
): Promise<GachaResult> {
  let rawContent = '';

  // raw 페이지에서 나무마크 원문 가져오기
  try {
    const rawUrl = `https://namu.wiki/raw/${encodeURIComponent(title)}`;
    const res = await fetch(rawUrl, {
      headers,
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const text = await res.text();

      // HTML이 아닌 실제 나무마크 텍스트인지 확인
      if (!text.startsWith('<!') && !text.startsWith('<html')) {
        rawContent = text;
      }
    }
  } catch {
    // raw 실패 시 빈 문자열
  }

  // raw도 실패하면 API 시도
  if (!rawContent) {
    try {
      const apiUrl = `https://en.namu.wiki/api/doc/${encodeURIComponent(title)}`;
      const apiRes = await fetch(apiUrl, {
        headers,
        signal: AbortSignal.timeout(5000),
      });

      if (apiRes.ok) {
        const contentType = apiRes.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const apiData = await apiRes.json();
          if (apiData.content && !apiData.content.startsWith('<!')) {
            rawContent = apiData.content;
          }
        }
      }
    } catch {
      // API도 실패
    }
  }

  // 콘텐츠가 전혀 없으면 에러
  if (!rawContent || rawContent.length < 10) {
    throw new Error(`문서 "${title}"의 내용을 가져올 수 없습니다.`);
  }

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

/**
 * 나무마크 원문에서 요약 추출
 */
function extractSummary(raw: string, title: string): string {
  // 전략 1: "== 개요 ==" 섹션
  const overviewMatch = raw.match(
    /==\s*개요\s*==\s*\n([\s\S]*?)(?=\n==\s*[^=]|$)/
  );
  if (overviewMatch) {
    const text = stripNamuMarkup(overviewMatch[1]).trim();
    if (text.length > 10) return trimSummary(text);
  }

  // 전략 2: "== 소개/설명/정의 ==" 섹션
  const altMatch = raw.match(
    /==\s*(소개|설명|정의|기본 정보)\s*==\s*\n([\s\S]*?)(?=\n==\s*[^=]|$)/
  );
  if (altMatch) {
    const text = stripNamuMarkup(altMatch[2]).trim();
    if (text.length > 10) return trimSummary(text);
  }

  // 전략 3: 첫 번째 섹션 이전 도입부
  const introMatch = raw.match(/^([\s\S]*?)(?=\n==\s*[^=])/);
  if (introMatch) {
    const text = stripNamuMarkup(introMatch[1]).trim();
    const cleaned = removeMetaJunk(text, title);
    if (cleaned.length > 15) return trimSummary(cleaned);
  }

  // 전략 4: 전체에서 추출
  const fullText = stripNamuMarkup(raw);
  const cleaned = removeMetaJunk(fullText, title);
  return trimSummary(cleaned);
}

/**
 * 나무마크 문법 제거
 */
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

/**
 * 메타 정보 제거
 */
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

/**
 * 요약을 150자 이내로 다듬기
 */
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
    if (/^(최근|편집|토론|역사|분류|특수|로그인|해당|이\s*문서)/.test(s)) return false;
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