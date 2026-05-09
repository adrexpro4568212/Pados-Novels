import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db } from '@/lib/db'
import { getNovels, createNovel, updateNovel, deleteNovel } from '@/lib/hooks/use-novels'

beforeEach(async () => {
  await db.novels.clear()
})

describe('createNovel', () => {
  it('creates a novel and returns it', async () => {
    const novel = await createNovel({ title: 'La Tormenta', genre: 'Drama' })
    expect(novel.title).toBe('La Tormenta')
    expect(novel.id).toBeTruthy()
    expect(novel.color).toBeTruthy()
  })
})

describe('getNovels', () => {
  it('returns all novels ordered by updatedAt desc', async () => {
    await createNovel({ title: 'A', genre: '' })
    await new Promise(r => setTimeout(r, 10))
    await createNovel({ title: 'B', genre: '' })
    const novels = await getNovels()
    expect(novels[0].title).toBe('B')
    expect(novels).toHaveLength(2)
  })
})

describe('updateNovel', () => {
  it('updates novel fields', async () => {
    const novel = await createNovel({ title: 'Old Title', genre: '' })
    await updateNovel(novel.id, { title: 'New Title' })
    const updated = await db.novels.get(novel.id)
    expect(updated?.title).toBe('New Title')
  })
})

describe('deleteNovel', () => {
  it('deletes the novel', async () => {
    const novel = await createNovel({ title: 'To Delete', genre: '' })
    await deleteNovel(novel.id)
    const result = await db.novels.get(novel.id)
    expect(result).toBeUndefined()
  })
})
