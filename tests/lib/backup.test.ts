import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db } from '@/lib/db'
import { buildBackup, parseBackup, importBackup } from '@/lib/backup'
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
    expect(result).not.toBeNull()
    expect(result).toMatchObject({ version: 1, novel: { id: 'x' } })
    expect(Array.isArray(result?.chapters)).toBe(true)
  })
})

describe('importBackup', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  it('imports novel with new ID and applies title/color overrides', async () => {
    const original = await createNovel({ title: 'Original', genre: 'Fantasy' })
    const backup = await buildBackup(original.id)

    const importedId = await importBackup(backup, { title: 'Importada', color: '#ff0000' })

    expect(importedId).not.toBe(original.id)
    const imported = await db.novels.get(importedId)
    expect(imported?.title).toBe('Importada')
    expect(imported?.color).toBe('#ff0000')
  })

  it('rewrites chapter and scene foreign keys so they point to new IDs', async () => {
    const novel = await createNovel({ title: 'T', genre: 'F' })
    const chapter = await createChapter({ novelId: novel.id, title: 'Ch' })
    await createScene({ novelId: novel.id, chapterId: chapter.id, title: 'Sc' })
    const backup = await buildBackup(novel.id)

    const newNovelId = await importBackup(backup, { title: 'T2', color: '#000' })

    const importedChapters = await db.chapters.where('novelId').equals(newNovelId).toArray()
    expect(importedChapters).toHaveLength(1)

    const importedScenes = await db.scenes.where('novelId').equals(newNovelId).toArray()
    expect(importedScenes).toHaveLength(1)

    // chapterId del scene importado apunta al nuevo capítulo, no al original
    expect(importedScenes[0].chapterId).toBe(importedChapters[0].id)
    expect(importedScenes[0].chapterId).not.toBe(chapter.id)
  })

  it('does not modify the original novel', async () => {
    const original = await createNovel({ title: 'Original', genre: 'Fantasy' })
    const backup = await buildBackup(original.id)

    await importBackup(backup, { title: 'Copia', color: '#aaa' })

    const stillThere = await db.novels.get(original.id)
    expect(stillThere?.title).toBe('Original')
  })
})
