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
        'border-r border-white/5',
        'bg-[#1E1E1E]/80 backdrop-blur-xl',
        'relative z-10',
        className
      )}
    >
      {/* Drag Region - macOS traffic lights area */}
      <div className="h-8 drag-region" />

      {/* Logo */}
      <div className="h-12 flex items-center px-4 drag-region">
        <div className="text-xl font-bold tracking-tight flex items-center gap-2">
          <span className="text-accent text-2xl">*</span>
          Firecrawl
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-6 space-y-1 no-drag">
        {navItems.map((item) => {
          const isActive = activeItem === item.key

          return (
            <button
              key={item.key}
              onClick={() => onNavigate?.(item.key)}
              className={cn(
                'w-full flex items-center px-3 py-2',
                'text-sm font-medium rounded-md',
                'transition-colors relative',
                isActive
                  ? 'text-white bg-white/5'
                  : 'text-secondary hover:bg-white/5 hover:text-white'
              )}
            >
              {isActive && (
                <GlowDot className="absolute left-1" />
              )}
              <span className={cn(isActive ? 'ml-3' : 'ml-0')}>
                {item.label}
              </span>
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
            <span className="text-xs text-accent">U</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">用户</div>
            <div className="text-xs text-secondary">专业版</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
