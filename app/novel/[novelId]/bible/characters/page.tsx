'use client'
import { useParams } from 'next/navigation'
import { CharacterList } from '@/components/characters/character-list'

export default function CharactersPage() {
  const { novelId } = useParams<{ novelId: string }>()
  return <CharacterList novelId={novelId} />
}
