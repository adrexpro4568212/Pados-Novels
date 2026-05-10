import { useNovel } from '@/lib/hooks/use-novels'
import { useWritingSessions } from '@/lib/hooks/use-writing-sessions'
import { todayString } from '@/lib/utils'
import type { WritingSession } from '@/lib/db.types'

function prevDay(date: string): string {
  const d = new Date(date + 'T12:00:00')
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

export function computeStreak(
  sessions: WritingSession[],
  minWords: number,
  today: string = todayString()
): number {
  // Aggregate by date: keep the highest cumulative wordCount per date.
  // (wordCount is cumulative — the latest value for a day is the largest.)
  const dateMap = new Map<string, number>()
  for (const s of sessions) {
    if ((dateMap.get(s.date) ?? -1) < s.wordCount) {
      dateMap.set(s.date, s.wordCount)
    }
  }
  const sorted = [...dateMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, wordCount]) => ({ date, wordCount }))

  // Build set of dates where that day's delta meets the minimum.
  // wordCount is cumulative — delta = current session minus previous session.
  const qualifying = new Set<string>()
  for (let i = 0; i < sorted.length; i++) {
    const prev = i > 0 ? sorted[i - 1].wordCount : 0
    const delta = sorted[i].wordCount - prev
    if (delta >= minWords) qualifying.add(sorted[i].date)
  }

  // Walk backwards from today.
  // If today doesn't qualify yet (user hasn't written enough today),
  // start from yesterday so the streak isn't broken prematurely.
  let cursor = qualifying.has(today) ? today : prevDay(today)
  let streak = 0

  while (qualifying.has(cursor)) {
    streak++
    cursor = prevDay(cursor)
  }

  return streak
}

export function useStreak(novelId: string): number {
  const sessions = useWritingSessions(novelId) ?? []
  const novel = useNovel(novelId)
  const minWords = novel?.streakMinWords ?? 50
  // computeStreak is a fast pure function — no memoization needed
  return computeStreak(sessions, minWords)
}
