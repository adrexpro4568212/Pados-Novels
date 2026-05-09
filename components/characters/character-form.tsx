'use client'

import { useState, useEffect } from 'react'
import { useCharacter, updateCharacter } from '@/lib/hooks/use-characters'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const ROLES = [
  { value: 'protagonist', label: 'Protagonista' },
  { value: 'secondary',   label: 'Secundario' },
  { value: 'antagonist',  label: 'Antagonista' },
  { value: 'other',       label: 'Otro' },
]

function Field({ label, value, onChange, multiline = false, hint }: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean; hint?: string
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>
        {label}
      </label>
      {hint && <p className="text-xs mb-1.5 italic" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
      {multiline ? (
        <Textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={3}
          style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />
      ) : (
        <Input
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />
      )}
    </div>
  )
}

export function CharacterForm({ charId }: { charId: string }) {
  const character = useCharacter(charId)
  const [form, setForm] = useState({
    name: '', role: 'secondary' as const, age: '', description: '',
    internalWound: '', falseBelief: '', secretDesire: '', notes: '',
  })

  useEffect(() => {
    if (character) setForm({
      name: character.name, role: character.role as typeof form.role,
      age: character.age, description: character.description,
      internalWound: character.internalWound, falseBelief: character.falseBelief,
      secretDesire: character.secretDesire, notes: character.notes,
    })
  }, [character?.id])

  function set(key: keyof typeof form) {
    return (v: string) => {
      setForm(f => ({ ...f, [key]: v }))
      updateCharacter(charId, { [key]: v })
    }
  }

  if (!character) return <div className="p-8 text-sm" style={{ color: 'var(--text-muted)' }}>Cargando…</div>

  return (
    <div className="p-6 max-w-2xl mx-auto flex flex-col gap-6">
      <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Ficha de personaje</h2>

      {/* Básicos */}
      <section>
        <h3 className="text-xs uppercase tracking-widest mb-3 font-semibold" style={{ color: 'var(--accent)' }}>Datos básicos</h3>
        <div className="flex flex-col gap-3">
          <Field label="Nombre" value={form.name} onChange={set('name')} />
          <div>
            <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Rol</label>
            <select
              value={form.role}
              onChange={e => set('role')(e.target.value)}
              className="w-full rounded-md px-3 py-2 text-sm"
              style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            >
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <Field label="Edad" value={form.age} onChange={set('age')} />
          <Field label="Descripción física" value={form.description} onChange={set('description')} multiline />
        </div>
      </section>

      {/* Psicología */}
      <section>
        <h3 className="text-xs uppercase tracking-widest mb-3 font-semibold" style={{ color: 'var(--accent)' }}>Psicología profunda</h3>
        <div className="flex flex-col gap-4">
          <Field
            label="Herida interna"
            hint="El trauma que dicta su comportamiento subconsciente."
            value={form.internalWound}
            onChange={set('internalWound')}
            multiline
          />
          <Field
            label="Creencia falsa"
            hint="La mentira que el personaje cree para sobrevivir."
            value={form.falseBelief}
            onChange={set('falseBelief')}
            multiline
          />
          <Field
            label="Deseo secreto"
            hint="La motivación que no admite ante nadie."
            value={form.secretDesire}
            onChange={set('secretDesire')}
            multiline
          />
        </div>
      </section>

      {/* Notas */}
      <section>
        <h3 className="text-xs uppercase tracking-widest mb-3 font-semibold" style={{ color: 'var(--accent)' }}>Notas libres</h3>
        <Textarea
          value={form.notes}
          onChange={e => set('notes')(e.target.value)}
          rows={5}
          placeholder="Notas, ideas, arcos…"
          style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />
      </section>
    </div>
  )
}
