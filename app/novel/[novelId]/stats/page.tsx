'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useNovelWordCount } from '@/lib/hooks/use-scenes'
import { useNovel, updateNovel } from '@/lib/hooks/use-novels'
import { useWritingSessions, useTodayWordCount } from '@/lib/hooks/use-writing-sessions'
import { computeStreak } from '@/lib/hooks/use-streak'

export default function StatsPage() {
  const { novelId } = useParams<{ novelId: string }>()
  const novel = useNovel(novelId)
  const totalWords = useNovelWordCount(novelId)
  const todayWords = useTodayWordCount(novelId)
  const sessions = useWritingSessions(novelId) ?? []
  const progress = novel?.targetWordCount
    ? Math.min((totalWords / novel.targetWordCount) * 100, 100)
    : 0

  const minWords = novel?.streakMinWords ?? 50
  const streak = useMemo(() => computeStreak(sessions, minWords), [sessions, minWords])

  // Local string state so the user can type freely without invalid intermediate values saving
  const [inputMin, setInputMin] = useState(String(minWords))
  useEffect(() => { setInputMin(String(minWords)) }, [minWords])

  function handleMinChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputMin(e.target.value)
    const v = parseInt(e.target.value, 10)
    if (!isNaN(v) && v >= 1 && v <= 10000) {
      updateNovel(novelId, { streakMinWords: v })
    }
  }

  function handleMinBlur() {
    const v = parseInt(inputMin, 10)
    if (isNaN(v) || v < 1 || v > 10000) {
      setInputMin(String(minWords)) // reset to last valid value on blur
    }
  }

  // Sessions with per-day delta for history display (most recent first)
  // wordCount is cumulative — delta = words written in that specific session
  const sessionsWithDelta = useMemo(() => {
    const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date))
    return sorted
      .map((s, i) => ({
        ...s,
        delta: i === 0 ? s.wordCount : s.wordCount - sorted[i - 1].wordCount,
      }))
      .reverse()
  }, [sessions])

  const metrics = [
    { label: 'Palabras totales', value: totalWords.toLocaleString('es'), accent: false },
    { label: 'Escritas hoy',     value: todayWords.toLocaleString('es'), accent: false },
    { label: 'Días de racha',    value: `🔥 ${streak}`,                 accent: streak > 0 },
    { label: 'Progreso',         value: `${progress.toFixed(1)}%`,       accent: false },
  ]

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
        Estadísticas
      </h2>

      {/* Metrics grid — 2 cols on mobile, 4 on sm+ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {metrics.map(({ label, value, accent }) => (
          <div
            key={label}
            className="rounded-xl p-4"
            style={{
              background: 'var(--bg-secondary)',
              border: `1px solid ${accent ? 'var(--accent)' : 'var(--border)'}`,
            }}
          >
            <p
              className="text-xs uppercase tracking-widest mb-1"
              style={{ color: accent ? 'var(--accent)' : 'var(--text-muted)' }}
            >
              {label}
            </p>
            <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
          <span>Progreso hacia la meta ({(novel?.targetWordCount ?? 0).toLocaleString('es')} palabras)</span>
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
      {sessionsWithDelta.length > 0 && (
        <div className="mb-6">
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
            Historial de sesiones
          </p>
          <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
            {sessionsWithDelta.map(s => (
              <div
                key={s.id}
                className="flex justify-between text-xs px-3 py-2 rounded"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
              >
                <span>{s.date}</span>
                <span>
                  {s.delta.toLocaleString('es')} palabras
                  {s.delta >= minWords ? ' 🔥' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Streak minimum config */}
      <div
        className="flex items-center gap-2 text-xs"
        style={{ color: 'var(--text-muted)' }}
      >
        <label htmlFor="streak-min">Mínimo diario para racha:</label>
        <input
          id="streak-min"
          type="number"
          min={1}
          max={10000}
          value={inputMin}
          onChange={handleMinChange}
          onBlur={handleMinBlur}
          className="w-20 rounded px-2 py-1 text-center"
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          }}
        />
        <span>palabras</span>
      </div>
    </div>
  )
}
