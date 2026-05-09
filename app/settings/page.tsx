'use client'

import { ThemeSelector } from '@/components/settings/theme-selector'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

export default function SettingsPage() {
  const [dailyGoal, setDailyGoal] = useState('500')
  const [defaultTarget, setDefaultTarget] = useState('80000')

  return (
    <main className="min-h-screen p-8 max-w-xl mx-auto" style={{ background: 'var(--bg-primary)' }}>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/" className="text-sm" style={{ color: 'var(--text-muted)' }}>← Inicio</Link>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Ajustes</h1>
      </div>

      <div className="flex flex-col gap-8">
        <ThemeSelector />

        <div className="flex flex-col gap-4">
          <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Metas de escritura</p>
          <div>
            <label className="text-xs block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Meta diaria de palabras
            </label>
            <Input
              type="number"
              value={dailyGoal}
              onChange={e => setDailyGoal(e.target.value)}
              style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label className="text-xs block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Meta por defecto de novela (palabras)
            </label>
            <Input
              type="number"
              value={defaultTarget}
              onChange={e => setDefaultTarget(e.target.value)}
              style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
