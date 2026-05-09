'use client'

import { useTheme } from 'next-themes'

const THEMES = [
  { value: 'dark',   label: '🌑 Estudio Nocturno', bg: '#0f0f13', accent: '#c9b99a' },
  { value: 'warm',   label: '📜 Papel y Tinta',     bg: '#faf6f0', accent: '#9b7e5a' },
  { value: 'modern', label: '⚡ Editorial Moderno',  bg: '#f8f9fc', accent: '#6366f1' },
]

export function ThemeSelector() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Tema</p>
      <div className="flex gap-3">
        {THEMES.map(t => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTheme(t.value)}
            className="flex-1 rounded-xl p-4 text-left transition-all"
            style={{
              background: t.bg,
              border: `2px solid ${theme === t.value ? t.accent : 'transparent'}`,
              outline: theme === t.value ? `2px solid ${t.accent}` : 'none',
              outlineOffset: '2px',
            }}
          >
            <div className="w-6 h-6 rounded-full mb-2" style={{ background: t.accent }} />
            <p className="text-xs font-semibold" style={{ color: t.accent }}>{t.label}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
