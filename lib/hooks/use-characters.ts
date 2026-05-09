import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { newId } from '@/lib/utils'
import type { Character } from '@/lib/db.types'

export async function createCharacter(novelId: string): Promise<Character> {
  const character: Character = {
    id: newId(),
    novelId,
    name: 'Nuevo personaje',
    role: 'secondary',
    age: '',
    description: '',
    internalWound: '',
    falseBelief: '',
    secretDesire: '',
    notes: '',
    createdAt: Date.now(),
  }
  await db.characters.add(character)
  return character
}

export async function updateCharacter(id: string, data: Partial<Omit<Character, 'id' | 'novelId' | 'createdAt'>>): Promise<void> {
  await db.characters.update(id, data)
}

export async function deleteCharacter(id: string): Promise<void> {
  await db.characters.delete(id)
}

export function useCharacters(novelId: string) {
  return useLiveQuery(
    () => db.characters.where('novelId').equals(novelId).toArray(),
    [novelId],
    []
  )
}

export function useCharacter(id: string) {
  return useLiveQuery(() => db.characters.get(id), [id])
}
