# analyze_distribution.py
# 사용법: pip install datasets && python analyze_distribution.py

from datasets import load_dataset
import json

print("📦 데이터셋 로딩 중... (처음엔 다운로드 때문에 좀 걸림)")
ds = load_dataset("heegyu/namuwiki-extracted", split="train")

print(f"✅ 총 문서 수: {len(ds):,}개\n")

# ─────────────────────────────────────────
# 1. text 길이 분포 분석
# ─────────────────────────────────────────
print("📊 text 길이 분석 중...")

lengths = []
link_estimates = []

for row in ds:
    text = row.get("text", "")
    length = len(text)
    lengths.append(length)
    # 현재 코드와 동일한 링크 추정 방식
    link_estimates.append(length // 200)

lengths.sort()
total = len(lengths)

print(f"\n{'='*60}")
print(f"📏 TEXT 길이 분포")
print(f"{'='*60}")
print(f"  총 문서 수:  {total:,}")
print(f"  최소:        {lengths[0]:,}자")
print(f"  최대:        {lengths[-1]:,}자")
print(f"  평균:        {sum(lengths)//total:,}자")
print(f"  중앙값:      {lengths[total//2]:,}자")

# 퍼센타일
percentiles = [10, 25, 50, 75, 80, 85, 90, 95, 97, 99, 99.5, 99.9]
print(f"\n  {'퍼센타일':<12} {'길이(자)':<12} {'링크추정':<10}")
print(f"  {'-'*34}")
for p in percentiles:
    idx = int(total * p / 100)
    if idx >= total:
        idx = total - 1
    l = lengths[idx]
    print(f"  {p:>6.1f}%ile    {l:>8,}자    ~{l//200}개")

# ─────────────────────────────────────────
# 2. 구간별 문서 수 분포
# ─────────────────────────────────────────
print(f"\n{'='*60}")
print(f"📊 길이 구간별 문서 수")
print(f"{'='*60}")

buckets = [
    (0, 100),
    (100, 500),
    (500, 1000),
    (1000, 3000),
    (3000, 5000),
    (5000, 10000),
    (10000, 20000),
    (20000, 50000),
    (50000, 100000),
    (100000, 500000),
    (500000, float('inf')),
]

for lo, hi in buckets:
    count = sum(1 for l in lengths if lo <= l < hi)
    pct = count / total * 100
    bar = "█" * int(pct)
    hi_str = f"{hi:,}" if hi != float('inf') else "∞"
    print(f"  {lo:>7,} ~ {hi_str:>8}자: {count:>7,}개 ({pct:5.1f}%) {bar}")

# ─────────────────────────────────────────
# 3. 현재 rarity 시스템으로 시뮬레이션
# ─────────────────────────────────────────
print(f"\n{'='*60}")
print(f"🎰 현재 RARITY 시스템 시뮬레이션")
print(f"{'='*60}")

# 현재 rarity.ts 로직 재현 (네 코드 기준)
def current_rarity(content_length, link_count):
    score = content_length * 0.3 + link_count * 50
    if score >= 15000:
        return "LEGENDARY"
    elif score >= 8000:
        return "EPIC"
    elif score >= 3000:
        return "RARE"
    elif score >= 1000:
        return "UNCOMMON"
    else:
        return "COMMON"

rarity_counts = {"COMMON": 0, "UNCOMMON": 0, "RARE": 0, "EPIC": 0, "LEGENDARY": 0}

for l in lengths:
    link_est = l // 200
    r = current_rarity(l, link_est)
    rarity_counts[r] += 1

print(f"\n  현재 기준 (score = length*0.3 + links*50):")
print(f"  {'등급':<12} {'문서 수':<10} {'비율':<8} {'바'}") 
print(f"  {'-'*50}")
for rarity in ["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY"]:
    count = rarity_counts[rarity]
    pct = count / total * 100
    bar = "█" * int(pct)
    print(f"  {rarity:<12} {count:>8,}개  {pct:5.1f}%  {bar}")

# ─────────────────────────────────────────
# 4. score 분포 상세
# ─────────────────────────────────────────
print(f"\n{'='*60}")
print(f"📈 SCORE 분포 (score = length*0.3 + links*50)")
print(f"{'='*60}")

scores = []
for l in lengths:
    link_est = l // 200
    s = l * 0.3 + link_est * 50
    scores.append(s)

scores.sort()

print(f"\n  {'퍼센타일':<12} {'score':<12}")
print(f"  {'-'*24}")
for p in percentiles:
    idx = int(total * p / 100)
    if idx >= total:
        idx = total - 1
    print(f"  {p:>6.1f}%ile    {scores[idx]:>10,.0f}")

# ─────────────────────────────────────────
# 5. JSON으로 결과 저장
# ─────────────────────────────────────────
result = {
    "total_docs": total,
    "length_percentiles": {},
    "score_percentiles": {},
    "current_rarity_distribution": {},
}

for p in percentiles:
    idx = min(int(total * p / 100), total - 1)
    result["length_percentiles"][str(p)] = lengths[idx]
    result["score_percentiles"][str(p)] = round(scores[idx], 1)

for r, c in rarity_counts.items():
    result["current_rarity_distribution"][r] = {
        "count": c,
        "percent": round(c / total * 100, 2)
    }

with open("distribution_result.json", "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print(f"\n✅ 결과가 distribution_result.json 에 저장됨!")
print(f"이 파일 내용을 나한테 보여줘!")