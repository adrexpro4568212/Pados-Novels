'use client'

import { useRouter } from 'next/navigation'
import { useCharacters, createCharacter, deleteCharacter } from '@/lib/hooks/use-characters'

const ROLE_LABELS: Record<string, string> = {
  protagonist: 'Protagonista',
  secondary: 'Secundario',
  antagonist: 'Antagonista',
  other: 'Otro',
}

export function CharacterList({ novelId }: { novelId: string }) {
  const router = useRouter()
  const characters = useCharacters(novelId) ?? []

  async function handleCreate() {
    const char = await createCharacter(novelId)
    router.push(`/novel/${novelId}/bible/characters/${char.id}`)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Personajes</h2>
        <button
          onClick={handleCreate}
          className="text-sm px-3 py-1.5 rounded-lg"
          style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
        >
          + Nuevo personaje
        </button>
      </div>

      {characters.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          No hay personajes. Crea el primero.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {characters.map(char => (
            <button
              key={char.id}
              type="button"
              className="rounded-xl p-4 text-left hover:opacity-80 transition-opacity group"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
              onClick={() => router.push(`/novel/${novelId}/bible/characters/${char.id}`)}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg mb-3"
                style={{ background: 'var(--bg-tertiary)' }}>
                <span aria-hidden="true">👤</span>
              </div>
              <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{char.name}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {ROLE_LABELS[char.role] ?? char.role}
              </p>
              <button
                type="button"
                aria-label="Eliminar personaje"
                className="text-xs mt-2 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                style={{ color: 'var(--text-muted)' }}
                onClick={async (e) => { e.stopPropagation(); if (confirm('¿Eliminar personaje?')) await deleteCharacter(char.id) }}
              >
                🗑️ Eliminar
              </button>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
