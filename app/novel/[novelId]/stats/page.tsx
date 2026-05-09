'use client'

import { useParams } from 'next/navigation'
import { useNovelWordCount } from '@/lib/hooks/use-scenes'
import { useNovel } from '@/lib/hooks/use-novels'
import { useWritingSessions, useTodayWordCount } from '@/lib/hooks/use-writing-sessions'

export default function StatsPage() {
  const { novelId } = useParams<{ novelId: string }>()
  const novel = useNovel(novelId)
  const totalWords = useNovelWordCount(novelId)
  const todayWords = useTodayWordCount(novelId)
  const sessions = useWritingSessions(novelId) ?? []
  const progress = novel?.targetWordCount ? Math.min((totalWords / novel.targetWordCount) * 100, 100) : 0

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Estadísticas</h2>

      <div className="grid grid-cols-2 gap-3 mb-8">
        {[
          { label: 'Palabras totales', value: totalWords.toLocaleString('es') },
          { label: 'Escritas hoy',     value: todayWords.toLocaleString('es') },
          { label: 'Meta',             value: (novel?.targetWordCount ?? 0).toLocaleString('es') },
          { label: 'Progreso',         value: `${progress.toFixed(1)}%` },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl p-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
          <span>Progreso hacia la meta</span>
          <span>{progress.toFixed(1)}%</span>
        </div>
        <div className="rounded-full h-2" style={{ background: 'var(--bg-tertiary)' }}>
          <div
            className="h-2 rounded-full transition-all"
            style={{ width: `${progress}%`, background: 'var(--accent)' }}
          />
        </div>
      </div>

      {/* Session history */}
      {sessions.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Historial de sesiones</p>
          <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
            {[...sessions].reverse().map(s => (
              <div key={s.id} className="flex justify-between text-xs px-3 py-2 rounded"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                <span>{s.date}</span>
                <span>{s.wordCount.toLocaleString('es')} palabras</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
