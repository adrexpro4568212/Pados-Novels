'use client'

import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { useNovel } from '@/lib/hooks/use-novels'

const TABS = [
  { label: 'Manuscrito', segment: 'manuscript' },
  { label: 'Biblia',     segment: 'bible' },
  { label: 'Tablero',    segment: 'board' },
  { label: 'Stats',      segment: 'stats' },
]

export function WorkspaceTabs() {
  const params = useParams<{ novelId: string }>()
  const pathname = usePathname()
  const novel = useNovel(params.novelId)

  return (
    <div
      className="flex items-center gap-0 px-4 border-b shrink-0"
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', height: '44px' }}
    >
      <Link href="/" className="mr-6 text-sm font-bold shrink-0" style={{ color: 'var(--accent)' }}>
        ✦
      </Link>
      <span className="text-sm font-semibold mr-6 truncate max-w-[180px]" style={{ color: 'var(--text-primary)' }}>
        {novel?.title ?? '...'}
      </span>
      {TABS.map(({ label, segment }) => {
        const href = `/novel/${params.novelId}/${segment}`
        const active = pathname.startsWith(href)
        return (
          <Link
            key={segment}
            href={href}
            className="px-4 h-full flex items-center text-sm border-b-2 transition-colors"
            style={{
              borderColor: active ? 'var(--accent)' : 'transparent',
              color: active ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}
