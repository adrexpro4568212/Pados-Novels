'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { parseBackup, importBackup, type NovelrBackup } from '@/lib/backup'
import { NOVEL_COLORS } from '@/lib/hooks/use-novels'

interface ImportNovelModalProps {
  open: boolean
  onClose: () => void
}

export function ImportNovelModal({ open, onClose }: ImportNovelModalProps) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [backup, setBackup] = useState<NovelrBackup | null>(null)
  const [title, setTitle] = useState('')
  const [color, setColor] = useState(NOVEL_COLORS[0])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleClose() {
    setBackup(null)
    setTitle('')
    setColor(NOVEL_COLORS[0])
    setError('')
    if (fileRef.current) fileRef.current.value = ''
    onClose()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const parsed = parseBackup(ev.target?.result as string)
      if (!parsed) {
        setError('Archivo no válido o versión incompatible')
        setBackup(null)
      } else {
        setError('')
        setBackup(parsed)
        setTitle(parsed.novel.title)
      }
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    if (!backup || !title.trim()) return
    setLoading(true)
    try {
      const novelId = await importBackup(backup, { title: title.trim(), color })
      handleClose()
      router.push(`/novel/${novelId}/manuscript`)
    } catch {
      setError('Error al importar. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const totalWords = backup?.scenes.reduce((sum, s) => sum + (s.wordCount ?? 0), 0) ?? 0

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose() }}>
      <DialogContent style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--text-primary)' }}>Importar novela</DialogTitle>
        </DialogHeader>

        <input
          ref={fileRef}
          type="file"
          accept=".json,.novelr.json"
          className="hidden"
          onChange={handleFileChange}
        />

        {!backup ? (
          <div className="flex flex-col gap-4 mt-2">
            <Button
              type="button"
              onClick={() => fileRef.current?.click()}
              style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
            >
              Seleccionar archivo .novelr.json
            </Button>
            {error && <p className="text-xs" style={{ color: '#e55' }}>{error}</p>}
          </div>
        ) : (
          <div className="flex flex-col gap-4 mt-2">
            {/* Stats del archivo */}
            <div
              className="rounded-lg p-3 grid grid-cols-2 gap-2"
              style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}
            >
              {[
                { label: 'Capítulos',  value: backup.chapters.length },
                { label: 'Escenas',    value: backup.scenes.length },
                { label: 'Personajes', value: backup.characters.length },
                { label: 'Palabras',   value: totalWords.toLocaleString('es') },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <p className="text-lg font-bold" style={{ color: 'var(--accent)' }}>{value}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
                </div>
              ))}
              <p
                className="col-span-2 text-xs text-center pt-2 border-t"
                style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}
              >
                Exportado el {backup.exportedAt}
              </p>
            </div>

            {/* Título editable */}
            <div>
              <label
                htmlFor="import-title"
                className="text-xs uppercase tracking-widest block mb-1.5"
                style={{ color: 'var(--text-muted)' }}
              >
                Título
              </label>
              <Input
                id="import-title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
            </div>

            {/* Color de portada */}
            <div>
              <label
                className="text-xs uppercase tracking-widest block mb-2"
                style={{ color: 'var(--text-muted)' }}
              >
                Color de portada
              </label>
              <div className="flex gap-2 flex-wrap">
                {NOVEL_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    aria-label={`Color ${c}`}
                    aria-pressed={color === c}
                    className="w-8 h-8 rounded-full transition-all"
                    style={{
                      background: c,
                      border: color === c ? '2px solid var(--text-primary)' : '2px solid transparent',
                      outline: color === c ? '2px solid var(--accent)' : 'none',
                      outlineOffset: '2px',
                    }}
                  />
                ))}
              </div>
            </div>

            {error && <p className="text-xs" style={{ color: '#e55' }}>{error}</p>}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleImport}
                disabled={!title.trim() || loading}
                className="flex-1"
                style={{ background: 'var(--accent)', color: 'var(--bg-primary)' }}
              >
                {loading ? 'Importando…' : '✦ Importar novela'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
