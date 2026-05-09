import { WorkspaceTabs } from '@/components/workspace/workspace-tabs'
import { SceneTreeWrapper } from '@/components/workspace/scene-tree-wrapper'
import { Inspector } from '@/components/workspace/inspector'

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <WorkspaceTabs />
      <div className="flex flex-1 overflow-hidden">
        <SceneTreeWrapper />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
        <Inspector />
      </div>
    </div>
  )
}
