'use client'

import { useAppStore } from '@/lib/stores/app-store'
import { useScene } from '@/lib/hooks/use-scenes'

export function Inspector() {
  const { activeSceneId, isInspectorOpen, toggleInspector } = useAppStore()
  const scene = useScene(activeSceneId ?? '')

  if (!isInspectorOpen) {
    return (
      <button
        onClick={toggleInspector}
        className="w-8 flex items-center justify-center border-l shrink-0"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
        title="Abrir inspector"
      >
        ‹
      </button>
    )
  }

  return (
    <div
      className="h-full flex flex-col overflow-hidden border-l shrink-0"
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', width: '220px' }}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
        <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Inspector</span>
        <button onClick={toggleInspector} className="text-xs" style={{ color: 'var(--text-muted)' }}>›</button>
      </div>

      {!scene ? (
        <p className="text-xs text-center mt-8" style={{ color: 'var(--text-muted)' }}>
          Selecciona una escena
        </p>
      ) : (
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Palabras</p>
            <p className="text-xl font-bold" style={{ color: 'var(--accent)' }}>
              {scene.wordCount.toLocaleString('es')}
            </p>
          </div>
          {scene.synopsis && (
            <div>
              <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Synopsis</p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{scene.synopsis}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
