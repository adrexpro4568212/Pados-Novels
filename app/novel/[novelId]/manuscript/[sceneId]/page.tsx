'use client'

import { useParams } from 'next/navigation'
import { useScene } from '@/lib/hooks/use-scenes'
import { useAppStore } from '@/lib/stores/app-store'
import { useEffect } from 'react'
import { SceneEditor } from '@/components/editor/scene-editor'

export default function ScenePage() {
  const params = useParams<{ novelId: string; sceneId: string }>()
  const scene = useScene(params.sceneId)
  const setActiveScene = useAppStore(s => s.setActiveScene)

  useEffect(() => {
    setActiveScene(params.sceneId)
    return () => setActiveScene(null)
  }, [params.sceneId, setActiveScene])

  if (!scene) {
    return <div className="p-8 text-sm" style={{ color: 'var(--text-muted)' }}>Cargando escena…</div>
  }

  return <SceneEditor scene={scene} />
}
