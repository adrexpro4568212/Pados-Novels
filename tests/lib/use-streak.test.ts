import { describe, it, expect } from 'vitest'
import { computeStreak } from '@/lib/hooks/use-streak'
import type { WritingSession } from '@/lib/db.types'

function sess(date: string, wordCount: number): WritingSession {
  return { id: date, novelId: 'n1', date, wordCount }
}

const TODAY = '2026-05-09'

describe('computeStreak', () => {
  it('returns 0 with no sessions', () => {
    expect(computeStreak([], 50, TODAY)).toBe(0)
  })

  it('returns 1 when today has a qualifying delta', () => {
    expect(computeStreak([sess(TODAY, 100)], 50, TODAY)).toBe(1)
  })

  it('returns 1 when yesterday qualifies and today has no session yet', () => {
    expect(computeStreak([sess('2026-05-08', 100)], 50, TODAY)).toBe(1)
  })

  it('counts three consecutive qualifying days', () => {
    const sessions = [
      sess('2026-05-07', 60),
      sess('2026-05-08', 130),
      sess(TODAY, 200),
    ]
    expect(computeStreak(sessions, 50, TODAY)).toBe(3)
  })

  it('stops at a gap — counts only consecutive tail', () => {
    const sessions = [
      sess('2026-05-06', 60),    // qualifies (delta 60)
      // 2026-05-07 missing → gap
      sess('2026-05-08', 130),   // qualifies (delta 70)
      sess(TODAY, 200),           // qualifies (delta 70)
    ]
    expect(computeStreak(sessions, 50, TODAY)).toBe(2)
  })

  it('does not count a day where delta is below minWords', () => {
    const sessions = [
      sess('2026-05-08', 30),    // delta 30 < 50
      sess(TODAY, 100),           // delta 70 >= 50
    ]
    expect(computeStreak(sessions, 50, TODAY)).toBe(1)
  })

  it('counts a day where delta is exactly minWords (boundary)', () => {
    expect(computeStreak([sess(TODAY, 50)], 50, TODAY)).toBe(1)
  })

  it('preserves multi-day streak when today is below minWords', () => {
    // 5-day streak ending yesterday; today has a session but below threshold
    const sessions = [
      sess('2026-05-04', 60),   // delta 60 ✅
      sess('2026-05-05', 120),  // delta 60 ✅
      sess('2026-05-06', 180),  // delta 60 ✅
      sess('2026-05-07', 240),  // delta 60 ✅
      sess('2026-05-08', 300),  // delta 60 ✅ yesterday
      sess(TODAY, 320),          // delta 20 ❌ today, below 50 — should not break streak
    ]
    expect(computeStreak(sessions, 50, TODAY)).toBe(5)
  })

  it('handles unsorted input correctly', () => {
    // Same data as the three-consecutive test but provided in reverse order
    const sessions = [
      sess(TODAY, 200),
      sess('2026-05-08', 130),
      sess('2026-05-07', 60),
    ]
    expect(computeStreak(sessions, 50, TODAY)).toBe(3)
  })
})
