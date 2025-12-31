import { cn } from '../../utils/cn'
import { GlowDot } from '../shared/GlowDot'

export type NavItemKey = 'dashboard' | 'tasks' | 'settings'

export interface SidebarProps {
  activeItem?: NavItemKey
  onNavigate?: (item: NavItemKey) => void
  className?: string
}

const navItems: Array<{ key: NavItemKey; label: string; icon: string }> = [
  { key: 'dashboard', label: '仪表盘', icon: '##' },
  { key: 'tasks', label: '任务列表', icon: '[]' },
  { key: 'settings', label: '设置', icon: '@' },
]

export function Sidebar({
  activeItem = 'dashboard',
  onNavigate,
  className,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        'w-64 flex-shrink-0 flex flex-col',
        'border-r border-white/[0.06]',
        'glass-sidebar',
        'relative z-10',
        className
      )}
    >
      {/* Drag Region - macOS traffic lights area */}
      <div className="h-8 drag-region" />

      {/* Logo */}
      <div className="h-14 flex items-center px-5 drag-region">
        <div className="text-xl font-semibold tracking-tight flex items-center gap-2">
          <span className="text-violet-400 text-2xl">*</span>
          <span className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            Firecrawl
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 no-drag">
        {navItems.map((item) => {
          const isActive = activeItem === item.key

          return (
            <button
              key={item.key}
              onClick={() => onNavigate?.(item.key)}
              className={cn(
                'w-full flex items-center px-3 py-2.5',
                'text-sm font-medium rounded-lg',
                'transition-all duration-200 relative',
                isActive
                  ? 'text-white bg-violet-500/20 border border-violet-500/30'
                  : 'text-white/60 hover:bg-white/[0.06] hover:text-white border border-transparent'
              )}
            >
              {isActive && (
                <GlowDot className="absolute left-1.5" color="violet" />
              )}
              <span className={cn(isActive ? 'ml-3' : 'ml-0')}>
                {item.label}
              </span>
            </button>
          )
        })}
      </nav>

    </aside>
  )
}
