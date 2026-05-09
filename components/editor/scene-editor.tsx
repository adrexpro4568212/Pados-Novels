'use client'

import { useEffect, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import CharacterCount from '@tiptap/extension-character-count'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import { updateSceneContent, getScenesForNovel } from '@/lib/hooks/use-scenes'
import { recordWritingSession } from '@/lib/hooks/use-writing-sessions'
import { countWordsInTiptap } from '@/lib/utils'
import { useAppStore } from '@/lib/stores/app-store'
import type { Scene } from '@/lib/db.types'

interface SceneEditorProps {
  scene: Scene
}

export function SceneEditor({ scene }: SceneEditorProps) {
  const { isZenMode, setZenMode } = useAppStore()

  const editor = useEditor({
    extensions: [
      StarterKit,
      CharacterCount,
      Typography,
      Placeholder.configure({ placeholder: 'Empieza a escribir…' }),
    ],
    content: scene.content ? JSON.parse(scene.content) : '',
    editorProps: {
      attributes: {
        class: 'outline-none min-h-[60vh] leading-relaxed',
        style: 'color: var(--text-primary); font-family: var(--font-lora), Georgia, serif; font-size: 17px; line-height: 1.85;',
      },
    },
  })

  // Autosave with 1s debounce + record writing session
  const save = useCallback(
    (() => {
      let timer: ReturnType<typeof setTimeout>
      return (content: string) => {
        clearTimeout(timer)
        timer = setTimeout(async () => {
          await updateSceneContent(scene.id, content)
          const scenes = await getScenesForNovel(scene.novelId)
          const total = scenes.reduce(
            (sum, s) => sum + (s.id === scene.id ? countWordsInTiptap(content) : s.wordCount),
            0
          )
          await recordWritingSession(scene.novelId, total)
        }, 1000)
      }
    })(),
    [scene.id, scene.novelId]
  )

  useEffect(() => {
    if (!editor) return
    const handler = () => {
      const content = JSON.stringify(editor.getJSON())
      save(content)
    }
    editor.on('update', handler)
    return () => { editor.off('update', handler) }
  }, [editor, save])

  // Sync content when scene changes (user navigates to a different scene)
  useEffect(() => {
    if (!editor) return
    const incoming = scene.content ? JSON.parse(scene.content) : ''
    editor.commands.setContent(incoming, false)
  }, [scene.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ESC exits zen mode
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setZenMode(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setZenMode])

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      {!isZenMode && (
        <div
          className="flex items-center justify-between px-4 py-2 border-b shrink-0"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2">
            {[
              { cmd: () => editor?.chain().focus().toggleBold().run(), label: 'B', title: 'Negrita' },
              { cmd: () => editor?.chain().focus().toggleItalic().run(), label: 'I', title: 'Cursiva' },
            ].map(({ cmd, label, title }) => (
              <button
                key={label}
                onClick={cmd}
                title={title}
                className="w-7 h-7 rounded text-xs font-semibold"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {editor?.storage.characterCount?.words() ?? 0} palabras
            </span>
            <button
              onClick={() => setZenMode(true)}
              className="text-xs px-2 py-1 rounded"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
              title="Modo Zen (ESC para salir)"
            >
              ⊙ Zen
            </button>
          </div>
        </div>
      )}

      {/* Editor */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ padding: isZenMode ? '80px 20%' : '32px 48px' }}
      >
        {isZenMode && (
          <button
            onClick={() => setZenMode(false)}
            className="fixed top-4 right-4 text-xs px-2 py-1 rounded z-10"
            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
          >
            ESC — Salir del Zen
          </button>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
