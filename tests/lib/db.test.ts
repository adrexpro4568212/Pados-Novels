import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db } from '@/lib/db'
import type { Novel } from '@/lib/db.types'

beforeEach(async () => {
  await db.novels.clear()
})

describe('db - novels table', () => {
  it('adds and retrieves a novel', async () => {
    const novel: Novel = {
      id: 'test-id-1',
      title: 'La Tormenta',
      synopsis: '',
      genre: 'Drama',
      color: '#8b7355',
      targetWordCount: 80000,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    await db.novels.add(novel)
    const result = await db.novels.get('test-id-1')
    expect(result?.title).toBe('La Tormenta')
  })

  it('queries novels ordered by updatedAt', async () => {
    await db.novels.bulkAdd([
      { id: 'a', title: 'A', synopsis: '', genre: '', color: '#000', targetWordCount: 0, createdAt: 1, updatedAt: 1 },
      { id: 'b', title: 'B', synopsis: '', genre: '', color: '#000', targetWordCount: 0, createdAt: 2, updatedAt: 2 },
    ])
    const results = await db.novels.orderBy('updatedAt').reverse().toArray()
    expect(results[0].id).toBe('b')
  })
})
