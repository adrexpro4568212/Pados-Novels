import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { newId, todayString } from '@/lib/utils'

export async function recordWritingSession(novelId: string, currentWordCount: number): Promise<void> {
  const today = todayString()
  const existing = await db.writing_sessions
    .where('novelId').equals(novelId)
    .filter(s => s.date === today)
    .first()

  if (existing) {
    await db.writing_sessions.update(existing.id, { wordCount: currentWordCount })
  } else {
    await db.writing_sessions.add({
      id: newId(),
      novelId,
      date: today,
      wordCount: currentWordCount,
    })
  }
}

export function useTodayWordCount(novelId: string): number {
  const result = useLiveQuery(
    async () => {
      const today = todayString()

      const allSessions = await db.writing_sessions
        .where('novelId').equals(novelId)
        .sortBy('date')

      const todaySession = allSessions.find(s => s.date === today)
      if (!todaySession) return 0

      // Most recent session from before today (handles gaps in writing days)
      const prevSession = [...allSessions].reverse().find(s => s.date < today)
      return Math.max(0, todaySession.wordCount - (prevSession?.wordCount ?? 0))
    },
    [novelId],
    0
  )
  return result ?? 0
}

export function useWritingSessions(novelId: string) {
  return useLiveQuery(
    () => db.writing_sessions.where('novelId').equals(novelId).sortBy('date'),
    [novelId],
    []
  )
}
