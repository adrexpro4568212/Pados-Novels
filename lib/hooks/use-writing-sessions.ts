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
      const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)

      const [todaySession, yesterdaySession] = await Promise.all([
        db.writing_sessions.where('novelId').equals(novelId).filter(s => s.date === today).first(),
        db.writing_sessions.where('novelId').equals(novelId).filter(s => s.date === yesterday).first(),
      ])

      if (!todaySession) return 0
      return todaySession.wordCount - (yesterdaySession?.wordCount ?? 0)
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
