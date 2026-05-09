import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db } from '@/lib/db'
import { buildBackup, parseBackup } from '@/lib/backup'
import { createNovel } from '@/lib/hooks/use-novels'
import { createChapter } from '@/lib/hooks/use-chapters'
import { createScene } from '@/lib/hooks/use-scenes'

describe('buildBackup', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  it('builds a NovelrBackup with version 1 and all arrays', async () => {
    const novel = await createNovel({ title: 'Test', genre: 'Fiction' })
    const chapter = await createChapter({ novelId: novel.id, title: 'Ch1' })
    await createScene({ novelId: novel.id, chapterId: chapter.id, title: 'Sc1' })

    const backup = await buildBackup(novel.id)

    expect(backup.version).toBe(1)
    expect(backup.novel.id).toBe(novel.id)
    expect(backup.chapters).toHaveLength(1)
    expect(backup.scenes).toHaveLength(1)
    expect(backup.characters).toHaveLength(0)
    expect(typeof backup.exportedAt).toBe('string')
  })

  it('throws if novel does not exist', async () => {
    await expect(buildBackup('does-not-exist')).rejects.toThrow()
  })
})

describe('parseBackup', () => {
  it('returns null for invalid JSON', () => {
    expect(parseBackup('not-json')).toBeNull()
  })

  it('returns null if version is not 1', () => {
    const raw = { version: 2, novel: {}, chapters: [], scenes: [] }
    expect(parseBackup(JSON.stringify(raw))).toBeNull()
  })

  it('returns null if required fields are missing', () => {
    expect(parseBackup(JSON.stringify({ version: 1 }))).toBeNull()
  })

  it('returns parsed backup for valid JSON', () => {
    const raw = {
      version: 1, exportedAt: '2026-05-09',
      novel: { id: 'x' }, chapters: [], scenes: [],
      characters: [], notes: [], writingSessions: [],
    }
    const result = parseBackup(JSON.stringify(raw))
    expect(result).toMatchObject({ version: 1, novel: { id: 'x' } })
  })
})
