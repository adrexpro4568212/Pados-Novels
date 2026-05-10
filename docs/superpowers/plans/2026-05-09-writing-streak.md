# Racha de Escritura — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mostrar una racha de días consecutivos de escritura por novela, con mínimo configurable por novela, en la barra de tabs del workspace y en la página de Stats.

**Architecture:** `computeStreak()` es una función pura que calcula la racha desde las sesiones existentes sin tocar Dexie. El hook `useStreak(novelId)` la combina con el mínimo guardado en `novel.streakMinWords`. No se requiere migración de schema — `streakMinWords` es un campo opcional añadido al tipo `Novel`.

**Tech Stack:** Next.js 15 App Router, TypeScript, Dexie.js (sin migración), Vitest para tests de la función pura.

---

## File Map

```
lib/
  hooks/
    use-streak.ts                    ← CREAR: computeStreak() + useStreak()
  db.types.ts                        ← MODIFICAR: añadir streakMinWords?: number a Novel

tests/
  lib/
    use-streak.test.ts               ← CREAR: tests unitarios de computeStreak

components/
  workspace/
    workspace-tabs.tsx               ← MODIFICAR: badge 🔥 N días

app/
  novel/[novelId]/
    stats/page.tsx                   ← MODIFICAR: tarjeta racha + 🔥 en historial + config input
```

---

## Task 1: computeStreak + useStreak + tests

**Files:**
- Modify: `lib/db.types.ts`
- Create: `lib/hooks/use-streak.ts`
- Create: `tests/lib/use-streak.test.ts`

- [ ] **Step 1: Añadir `streakMinWords` al tipo `Novel` en `lib/db.types.ts`**

Leer el archivo. Añadir el campo opcional al final de la interfaz `Novel` (antes del `}`):

```typescript
export interface Novel {
  id: string
  title: string
  synopsis: string
  genre: string
  color: string
  targetWordCount: number
  createdAt: number
  updatedAt: number
  streakMinWords?: number   // mínimo de palabras/día para racha. Default: 50
}
```

- [ ] **Step 2: Escribir los tests de `computeStreak` (tests fallarán — el módulo no existe aún)**

Crear `tests/lib/use-streak.test.ts`:

```typescript
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
    // 05-07 qualifies but 05-07→05-08→05-09 has a missing 05-07 in the walk
    const sessions = [
      sess('2026-05-06', 60),    // qualifies (delta 60)
      // 05-07 missing → not in qualifying set
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
```

- [ ] **Step 3: Verificar que los tests FALLAN**

```bash
cd "C:\Users\USER\OneDrive\Escritorio\Nueva carpeta"
npm run test:run -- tests/lib/use-streak.test.ts
```

Esperado: error `Cannot find module '@/lib/hooks/use-streak'`

- [ ] **Step 4: Crear `lib/hooks/use-streak.ts`**

```typescript
import { useMemo } from 'react'
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
  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date))

  // Build set of dates where that day's delta meets the minimum
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
  return useMemo(() => computeStreak(sessions, minWords), [sessions, minWords])
}
```

- [ ] **Step 5: Verificar que los 7 tests PASAN**

```bash
npm run test:run -- tests/lib/use-streak.test.ts
```

Esperado: 7 tests PASS

- [ ] **Step 6: Verificar suite completa**

```bash
npm run test:run
```

Esperado: todos los tests existentes siguen PASS (total ≥ 32)

- [ ] **Step 7: Commit**

```bash
git add lib/db.types.ts lib/hooks/use-streak.ts tests/lib/use-streak.test.ts
git commit -m "feat: computeStreak pure function + useStreak hook"
```

---

## Task 2: Badge 🔥 en WorkspaceTabs

**Files:**
- Modify: `components/workspace/workspace-tabs.tsx`

No hay tests automatizados para este componente de UI.

- [ ] **Step 1: Leer el archivo actual**

Leer `components/workspace/workspace-tabs.tsx` para confirmar la estructura antes de reemplazar.

- [ ] **Step 2: Reemplazar el archivo completo**

```typescript
'use client'

import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { useNovel } from '@/lib/hooks/use-novels'
import { buildBackup, downloadBackup } from '@/lib/backup'
import { useStreak } from '@/lib/hooks/use-streak'

const TABS = [
  { label: 'Manuscrito', segment: 'manuscript' },
  { label: 'Biblia',     segment: 'bible' },
  { label: 'Tablero',    segment: 'board' },
  { label: 'Stats',      segment: 'stats' },
]

export function WorkspaceTabs() {
  const params = useParams<{ novelId: string }>()
  const pathname = usePathname()
  const novel = useNovel(params.novelId)
  const streak = useStreak(params.novelId)

  async function handleExport() {
    try {
      const backup = await buildBackup(params.novelId)
      downloadBackup(backup)
    } catch {
      alert('Error al exportar la novela. Intenta de nuevo.')
    }
  }

  return (
    <div
      className="flex items-center gap-0 px-4 border-b shrink-0"
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', height: '44px' }}
    >
      <Link href="/" className="mr-6 text-sm font-bold shrink-0" style={{ color: 'var(--accent)' }}>
        ✦
      </Link>
      <span className="text-sm font-semibold mr-6 truncate max-w-[180px]" style={{ color: 'var(--text-primary)' }}>
        {novel?.title ?? '...'}
      </span>

      {TABS.map(({ label, segment }) => {
        const href = `/novel/${params.novelId}/${segment}`
        const active = pathname.startsWith(href)
        return (
          <Link
            key={segment}
            href={href}
            className="px-4 h-full flex items-center text-sm border-b-2 transition-colors"
            style={{
              borderColor: active ? 'var(--accent)' : 'transparent',
              color: active ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
          >
            {label}
          </Link>
        )
      })}

      <div className="ml-auto flex items-center gap-2">
        {/* Streak badge */}
        <div
          className="flex items-center gap-1 rounded px-2 py-1 text-xs"
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border)',
            color: streak > 0 ? 'var(--accent)' : 'var(--text-muted)',
            opacity: streak > 0 ? 1 : 0.4,
          }}
        >
          <span>🔥</span>
          <span>{streak} días</span>
        </div>

        <button
          type="button"
          onClick={handleExport}
          title="Exportar backup de esta novela"
          className="text-xs px-3 py-1 rounded"
          style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
        >
          ⬇ Exportar
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verificar suite completa**

```bash
npm run test:run
```

Esperado: todos los tests PASS

- [ ] **Step 4: Commit**

```bash
git add components/workspace/workspace-tabs.tsx
git commit -m "feat: streak badge in workspace tab bar"
```

---

## Task 3: Página de Stats — tarjeta racha + historial + config

**Files:**
- Modify: `app/novel/[novelId]/stats/page.tsx`

- [ ] **Step 1: Leer el archivo actual**

Leer `app/novel/[novelId]/stats/page.tsx` para confirmar la estructura antes de reemplazar.

- [ ] **Step 2: Reemplazar el archivo completo**

```typescript
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

  // Local string state for the input so the user can type freely
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
      setInputMin(String(minWords)) // reset to last valid value
    }
  }

  // Sessions with per-day delta for history display
  // Sessions are cumulative — delta = words written that specific session day
  const sessionsWithDelta = useMemo(() => {
    const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date))
    return sorted
      .map((s, i) => ({
        ...s,
        delta: i === 0 ? s.wordCount : s.wordCount - sorted[i - 1].wordCount,
      }))
      .reverse() // most recent first for display
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

      {/* Streak config */}
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
```

- [ ] **Step 3: Verificar suite completa**

```bash
npm run test:run
```

Esperado: todos los tests PASS

- [ ] **Step 4: Commit**

```bash
git add app/novel/[novelId]/stats/page.tsx
git commit -m "feat: streak card, history flame markers, and per-novel min config in stats"
```

---

## Resumen de tareas

| Task | Entregable |
|------|-----------|
| 1 | `computeStreak()` pura + `useStreak()` + 7 tests |
| 2 | Badge 🔥 en workspace tabs |
| 3 | Tarjeta racha en stats + 🔥 en historial + input config |
