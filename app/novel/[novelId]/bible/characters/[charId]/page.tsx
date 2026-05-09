'use client'
import { useParams } from 'next/navigation'
import { CharacterForm } from '@/components/characters/character-form'

export default function CharacterPage() {
  const { charId } = useParams<{ charId: string }>()
  return <CharacterForm charId={charId} />
}
