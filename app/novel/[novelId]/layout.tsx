import { WorkspaceTabs } from '@/components/workspace/workspace-tabs'

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <WorkspaceTabs />
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  )
}
