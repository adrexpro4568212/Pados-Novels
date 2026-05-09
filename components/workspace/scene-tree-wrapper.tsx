'use client'

import { useParams } from 'next/navigation'
import { SceneTree } from './scene-tree'

export function SceneTreeWrapper() {
  const params = useParams<{ novelId: string }>()
  if (!params.novelId) return null
  return <SceneTree novelId={params.novelId} />
}
