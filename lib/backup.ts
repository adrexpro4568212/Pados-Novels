import { db } from '@/lib/db'
import { todayString } from '@/lib/utils'
import type { Novel, Chapter, Scene, Character, Note, WritingSession } from '@/lib/db.types'

export interface NovelrBackup {
  version: 1
  exportedAt: string
  novel: Novel
  chapters: Chapter[]
  scenes: Scene[]
  characters: Character[]
  notes: Note[]
  writingSessions: WritingSession[]
}

export async function buildBackup(novelId: string): Promise<NovelrBackup> {
  const novel = await db.novels.get(novelId)
  if (!novel) throw new Error(`Novel ${novelId} not found`)

  const [chapters, scenes, characters, notes, writingSessions] = await Promise.all([
    db.chapters.where('novelId').equals(novelId).toArray(),
    db.scenes.where('novelId').equals(novelId).toArray(),
    db.characters.where('novelId').equals(novelId).toArray(),
    db.notes.where('novelId').equals(novelId).toArray(),
    db.writing_sessions.where('novelId').equals(novelId).toArray(),
  ])

  return {
    version: 1,
    exportedAt: todayString(),
    novel,
    chapters,
    scenes,
    characters,
    notes,
    writingSessions,
  }
}

function sanitizeFilename(title: string): string {
  const sanitized = title.replace(/[/\\:*?"<>|]/g, '').replace(/\s+/g, '-').replace(/^-+|-+$/g, '')
  return sanitized || 'backup'
}

export function downloadBackup(backup: NovelrBackup): void {
  const json = JSON.stringify(backup, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${sanitizeFilename(backup.novel.title)}.novelr.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function parseBackup(json: string): NovelrBackup | null {
  try {
    const data = JSON.parse(json)
    if (data.version !== 1) return null
    if (
      !data.novel ||
      !Array.isArray(data.chapters) ||
      !Array.isArray(data.scenes) ||
      !Array.isArray(data.characters) ||
      !Array.isArray(data.notes) ||
      !Array.isArray(data.writingSessions)
    ) return null
    return data as NovelrBackup
  } catch {
    return null
  }
}
