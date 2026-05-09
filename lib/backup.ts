import { db } from '@/lib/db'
import { todayString, newId } from '@/lib/utils'
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

export async function importBackup(
  backup: NovelrBackup,
  overrides: { title: string; color: string }
): Promise<string> {
  const novelId = newId()

  const chapMap: Record<string, string> = {}
  const sceneMap: Record<string, string> = {}
  const charMap: Record<string, string> = {}
  const noteMap: Record<string, string> = {}
  const sessMap: Record<string, string> = {}

  backup.chapters.forEach(c => { chapMap[c.id] = newId() })
  backup.scenes.forEach(s => { sceneMap[s.id] = newId() })
  backup.characters.forEach(c => { charMap[c.id] = newId() })
  backup.notes.forEach(n => { noteMap[n.id] = newId() })
  backup.writingSessions.forEach(s => { sessMap[s.id] = newId() })

  const now = Date.now()

  await db.transaction('rw', [
    db.novels, db.chapters, db.scenes,
    db.characters, db.notes, db.writing_sessions,
  ], async () => {
    await db.novels.add({
      ...backup.novel,
      id: novelId,
      title: overrides.title,
      color: overrides.color,
      createdAt: now,
      updatedAt: now,
    })
    await db.chapters.bulkAdd(backup.chapters.map(c => ({
      ...c,
      id: chapMap[c.id],
      novelId,
    })))
    await db.scenes.bulkAdd(backup.scenes.map(s => ({
      ...s,
      id: sceneMap[s.id],
      novelId,
      chapterId: chapMap[s.chapterId],
    })))
    await db.characters.bulkAdd(backup.characters.map(c => ({
      ...c,
      id: charMap[c.id],
      novelId,
    })))
    await db.notes.bulkAdd(backup.notes.map(n => ({
      ...n,
      id: noteMap[n.id],
      novelId,
    })))
    await db.writing_sessions.bulkAdd(backup.writingSessions.map(s => ({
      ...s,
      id: sessMap[s.id],
      novelId,
    })))
  })

  return novelId
}
