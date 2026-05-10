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
})
