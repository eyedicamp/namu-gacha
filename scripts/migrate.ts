import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// 기존 코드 그대로...
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const DATASET = 'heegyu/namuwiki-extracted';
const CONFIG = 'default';
const SPLIT = 'train';
const TOTAL_ROWS = 565000;
const HF_BATCH_SIZE = 100;
const DB_INSERT_BATCH = 500;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─────────────────────────────────────────────
// 등급 판정 (rarity.ts와 동일 로직)
// ─────────────────────────────────────────────
function determineRarity(contentLength: number): string {
  if (contentLength >= 25000) return 'Mythic';
  if (contentLength >= 9000)  return 'Legendary';
  if (contentLength >= 3500)  return 'Epic';
  if (contentLength >= 1200)  return 'Rare';
  return 'Normal';
}

// ─────────────────────────────────────────────
// 요약 추출
// ─────────────────────────────────────────────
function extractSummary(text: string, title: string): string | null {
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

  if (meaningful.length === 0) return null;

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

// ─────────────────────────────────────────────
// HuggingFace에서 배치 가져오기
// ─────────────────────────────────────────────
async function fetchFromHF(offset: number, length: number) {
  const url =
    `https://datasets-server.huggingface.co/rows?` +
    new URLSearchParams({
      dataset: DATASET,
      config: CONFIG,
      split: SPLIT,
      offset: String(offset),
      length: String(length),
    });

  const res = await fetch(url, {
    headers: { 'User-Agent': 'NamuGacha-Migration/1.0' },
  });

  if (res.status === 429) {
    console.log('⏳ Rate limited, 30초 대기...');
    await new Promise((r) => setTimeout(r, 30000));
    return fetchFromHF(offset, length); // 재시도
  }

  if (!res.ok) {
    throw new Error(`HF API 실패: ${res.status}`);
  }

  return res.json();
}

// ─────────────────────────────────────────────
// DB에 배치 삽입
// ─────────────────────────────────────────────
async function insertBatch(rows: any[]) {
  const { error } = await supabase.from('documents').insert(rows);
  if (error) {
    console.error('DB 삽입 에러:', error);
    throw error;
  }
}

// ─────────────────────────────────────────────
// 메인 마이그레이션
// ─────────────────────────────────────────────
async function migrate() {
  console.log('🚀 마이그레이션 시작!');
  console.log(`총 ${TOTAL_ROWS}개 문서를 처리합니다.\n`);

  let totalProcessed = 0;
  let totalInserted = 0;
  let totalSkipped = 0;
  let insertBuffer: any[] = [];

  for (let offset = 0; offset < TOTAL_ROWS; offset += HF_BATCH_SIZE) {
    try {
      const data = await fetchFromHF(offset, HF_BATCH_SIZE);

      if (!data.rows || data.rows.length === 0) {
        console.log(`⚠️ offset ${offset}: 빈 응답, 스킵`);
        continue;
      }

      for (const item of data.rows) {
        const row = item.row;
        const title: string = row.title || '';
        const text: string = row.text || '';

        totalProcessed++;

        if (!title || text.length < 30) {
          totalSkipped++;
          continue;
        }

        const summary = extractSummary(text, title);
        if (!summary) {
          totalSkipped++;
          continue;
        }

        const contentLength = text.length;
        const rarity = determineRarity(contentLength);

        insertBuffer.push({
          title,
          summary,
          url: `https://namu.wiki/w/${encodeURIComponent(title)}`,
          content_length: contentLength,
          rarity,
        });

        // 버퍼가 차면 DB에 삽입
        if (insertBuffer.length >= DB_INSERT_BATCH) {
          await insertBatch(insertBuffer);
          totalInserted += insertBuffer.length;
          insertBuffer = [];
        }
      }

      // 진행 상황 출력
      const percent = ((offset / TOTAL_ROWS) * 100).toFixed(1);
      console.log(
        `📊 ${percent}% | offset: ${offset} | 처리: ${totalProcessed} | 삽입: ${totalInserted} | 스킵: ${totalSkipped}`
      );

      // Rate limit 방지: 요청 간 1초 대기
      await new Promise((r) => setTimeout(r, 1000));
    } catch (e) {
      console.error(`❌ offset ${offset} 에러:`, e);
      // 에러 나도 계속 진행
      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  // 남은 버퍼 삽입
  if (insertBuffer.length > 0) {
    await insertBatch(insertBuffer);
    totalInserted += insertBuffer.length;
  }

  console.log('\n✅ 마이그레이션 완료!');
  console.log(`총 처리: ${totalProcessed}`);
  console.log(`총 삽입: ${totalInserted}`);
  console.log(`총 스킵: ${totalSkipped}`);
}

migrate().catch(console.error);