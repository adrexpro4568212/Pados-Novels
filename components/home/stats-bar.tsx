'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { todayString } from '@/lib/utils'

export function StatsBar() {
  const novelCount = useLiveQuery(() => db.novels.count(), [], 0) ?? 0

  const totalWords = useLiveQuery(
    async () => {
      const scenes = await db.scenes.toArray()
      return scenes.reduce((sum, s) => sum + s.wordCount, 0)
    },
    [],
    0
  ) ?? 0

  const todayWords = useLiveQuery(
    async () => {
      const today = todayString()
      const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)
      const novels = await db.novels.toArray()
      let total = 0
      for (const novel of novels) {
        const [t, y] = await Promise.all([
          db.writing_sessions.where('novelId').equals(novel.id).filter(s => s.date === today).first(),
          db.writing_sessions.where('novelId').equals(novel.id).filter(s => s.date === yesterday).first(),
        ])
        if (t) total += Math.max(0, t.wordCount - (y?.wordCount ?? 0))
      }
      return total
    },
    [],
    0
  ) ?? 0

  return (
    <div className="flex gap-6 mb-8">
      {[
        { label: 'novelas', value: novelCount },
        { label: 'palabras totales', value: totalWords.toLocaleString('es') },
        { label: 'escritas hoy', value: todayWords.toLocaleString('es') },
      ].map(({ label, value }) => (
        <div key={label} className="rounded-lg px-5 py-3" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{value}</div>
          <div className="text-xs uppercase tracking-widest mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</div>
        </div>
      ))}
    </div>
  )
}
