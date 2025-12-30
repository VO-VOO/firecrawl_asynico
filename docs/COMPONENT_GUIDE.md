# Firecrawl Scraper GUI - 组件开发指南

本文档提供可直接复制使用的组件实现代码，遵循设计规范中的视觉要求。

---

## 目录

1. [工具函数](#1-工具函数)
2. [基础组件](#2-基础组件)
3. [布局组件](#3-布局组件)
4. [业务组件](#4-业务组件)
5. [Hooks](#5-hooks)

---

## 1. 工具函数

### cn.ts - 类名合并

```typescript
// src/utils/cn.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## 2. 基础组件

### Card.tsx - 带光效的卡片

```tsx
// src/components/shared/Card.tsx
import { motion, type HTMLMotionProps } from 'framer-motion'
import { forwardRef, type ReactNode } from 'react'
import { cn } from '../../utils/cn'

export interface CardProps extends HTMLMotionProps<'div'> {
  children: ReactNode
  hoverGlow?: boolean
  span?: 1 | 2 | 3 | 4 | 6 | 8 | 12
}

const spanClasses: Record<number, string> = {
  1: 'col-span-1',
  2: 'col-span-2',
  3: 'col-span-3',
  4: 'col-span-4',
  6: 'col-span-6',
  8: 'col-span-8',
  12: 'col-span-12',
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, className, hoverGlow = true, span = 12, ...props }, ref) => {
    const baseClass = cn(
      'bg-surface rounded-3xl p-6 border border-white/5',
      spanClasses[span],
      className
    )

    if (!hoverGlow) {
      return (
        <div ref={ref} className={baseClass}>
          {children}
        </div>
      )
    }

    return (
      <motion.div
        ref={ref}
        className={cn(baseClass, 'relative group')}
        whileHover={{
          borderColor: 'rgba(176, 38, 255, 0.5)',
          boxShadow: '0 0 20px rgba(176, 38, 255, 0.15)',
        }}
        transition={{ duration: 0.3 }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

Card.displayName = 'Card'
```

### CircularProgress.tsx - 环形进度条

```tsx
// src/components/shared/CircularProgress.tsx
import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'

export interface CircularProgressProps {
  value: number
  size?: number
  strokeWidth?: number
  trackColor?: string
  fillColor?: string
  showLabel?: boolean
  label?: ReactNode
  className?: string
}

export function CircularProgress({
  value,
  size = 160,
  strokeWidth = 12,
  trackColor = '#333333',
  fillColor = '#FFFFFF',
  showLabel = true,
  label,
  className,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(100, Math.max(0, value))
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90">
        {/* 背景轨道 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* 进度填充 */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={fillColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </svg>

      {/* 中心内容 */}
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {label ?? (
            <>
              <span className="text-4xl font-bold text-primary">{Math.round(progress)}%</span>
            </>
          )}
        </div>
      )}
    </div>
  )
}
```

### TaskItem.tsx - 任务项

```tsx
// src/components/shared/TaskItem.tsx
import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'
import type { TaskStatus } from '../../types/scraper'

export interface TaskItemProps {
  id: string
  url: string
  title?: string
  progress: number
  status: TaskStatus
  className?: string
  onClick?: () => void
}

const statusConfig: Record<TaskStatus, { dot: string; bar: string }> = {
  pending: {
    dot: 'bg-secondary',
    bar: 'bg-white/30',
  },
  running: {
    dot: 'bg-accent animate-pulse',
    bar: 'bg-white',
  },
  success: {
    dot: 'bg-green-500',
    bar: 'bg-green-500',
  },
  failed: {
    dot: 'bg-error',
    bar: 'bg-error',
  },
}

export function TaskItem({
  url,
  title,
  progress,
  status,
  className,
  onClick,
}: TaskItemProps) {
  const config = statusConfig[status]

  // 从 URL 提取显示名称
  const displayName = title || url.replace(/^https?:\/\//, '').slice(0, 40)

  return (
    <motion.div
      className={cn(
        'bg-black/20 rounded-xl p-3 border border-white/5',
        'flex flex-col gap-2 cursor-pointer',
        'hover:border-white/10 transition-colors',
        className
      )}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.15 }}
    >
      <div className="flex justify-between items-center">
        <span className="text-xs text-secondary font-mono truncate flex-1 mr-2">
          {displayName}
        </span>
        <div className={cn('w-2 h-2 rounded-full flex-shrink-0', config.dot)} />
      </div>

      {/* 进度条 */}
      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', config.bar)}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </motion.div>
  )
}
```

### GlowDot.tsx - 发光指示点

```tsx
// src/components/shared/GlowDot.tsx
import { cn } from '../../utils/cn'

export interface GlowDotProps {
  active?: boolean
  className?: string
}

export function GlowDot({ active = true, className }: GlowDotProps) {
  if (!active) return null

  return (
    <div
      className={cn(
        'w-1 h-1 rounded-full bg-accent',
        'shadow-[0_0_8px_#B026FF]',
        className
      )}
    />
  )
}
```

---

## 3. 布局组件

### Sidebar.tsx - 侧边导航栏

```tsx
// src/components/layout/Sidebar.tsx
import { cn } from '../../utils/cn'
import { GlowDot } from '../shared/GlowDot'

export type NavItemKey = 'dashboard' | 'tasks' | 'crawler' | 'settings'

export interface SidebarProps {
  activeItem?: NavItemKey
  onNavigate?: (item: NavItemKey) => void
  className?: string
}

const navItems: Array<{ key: NavItemKey; label: string; icon: string }> = [
  { key: 'dashboard', label: 'Dashboard', icon: '##' },
  { key: 'tasks', label: 'Tasks', icon: '[]' },
  { key: 'crawler', label: 'Crawler', icon: 'Q' },
  { key: 'settings', label: 'Settings', icon: '@' },
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
        'bg-sidebar-glass/80 backdrop-blur-xl',
        'relative z-10',
        className
      )}
    >
      {/* Logo */}
      <div className="h-12 flex items-center px-4 mt-6">
        <div className="text-xl font-bold tracking-tight flex items-center gap-2">
          <span className="text-accent text-2xl">*</span>
          Firecrawl
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-6 space-y-1">
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
            <div className="text-sm font-medium truncate">User</div>
            <div className="text-xs text-secondary">Pro</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
```

### BentoGrid.tsx - Bento 网格布局

```tsx
// src/components/layout/BentoGrid.tsx
import { type ReactNode } from 'react'
import { cn } from '../../utils/cn'

export interface BentoGridProps {
  children: ReactNode
  className?: string
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-12 gap-6 max-w-7xl mx-auto',
        className
      )}
    >
      {children}
    </div>
  )
}
```

---

## 4. 业务组件

### ProgressCard.tsx - 总体进度卡片

```tsx
// src/components/cards/ProgressCard.tsx
import { Card } from '../shared/Card'
import { CircularProgress } from '../shared/CircularProgress'
import { cn } from '../../utils/cn'

export interface ProgressCardProps {
  percentage: number
  completed: number
  total: number
  className?: string
}

export function ProgressCard({
  percentage,
  completed,
  total,
  className,
}: ProgressCardProps) {
  return (
    <Card span={4} className={cn('min-h-[280px]', className)}>
      <h3 className="text-secondary text-sm font-medium mb-4">Total Progress</h3>

      <div className="flex items-center justify-center h-48">
        <CircularProgress
          value={percentage}
          size={180}
          strokeWidth={14}
          label={
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">
                {Math.round(percentage)}%
              </div>
              <div className="text-sm text-secondary mt-1">
                {completed.toLocaleString()} / {total.toLocaleString()}
              </div>
            </div>
          }
        />
      </div>
    </Card>
  )
}
```

### StatsCard.tsx - 统计卡片

```tsx
// src/components/cards/StatsCard.tsx
import { Card } from '../shared/Card'
import { cn } from '../../utils/cn'

export interface StatsCardProps {
  success: number
  failed: number
  className?: string
}

export function StatsCard({ success, failed, className }: StatsCardProps) {
  return (
    <Card
      span={8}
      className={cn('min-h-[280px] flex items-center justify-around', className)}
    >
      <h3 className="absolute top-6 left-6 text-secondary text-sm font-medium">
        Stats
      </h3>

      {/* Success */}
      <div className="text-center">
        <div className="text-lg text-secondary mb-2">Success</div>
        <div className="text-5xl font-bold text-primary">
          {success.toLocaleString()}
          <span className="text-green-500 text-lg ml-1">+</span>
        </div>
        <div className="text-xs text-secondary uppercase tracking-wider mt-2">
          Completed
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-24 bg-white/10" />

      {/* Failed */}
      <div className="text-center">
        <div className="text-lg text-secondary mb-2">Failed</div>
        <div className="text-5xl font-bold text-error">
          {failed.toLocaleString()}
          <span className="text-error text-lg ml-1">-</span>
        </div>
        <div className="text-xs text-secondary uppercase tracking-wider mt-2">
          Errors
        </div>
      </div>
    </Card>
  )
}
```

### ActiveTasksCard.tsx - 活跃任务卡片

```tsx
// src/components/cards/ActiveTasksCard.tsx
import { Card } from '../shared/Card'
import { TaskItem } from '../shared/TaskItem'
import { cn } from '../../utils/cn'
import type { TaskData } from '../../types/scraper'

export interface ActiveTasksCardProps {
  tasks: TaskData[]
  maxDisplay?: number
  onViewAll?: () => void
  className?: string
}

export function ActiveTasksCard({
  tasks,
  maxDisplay = 12,
  onViewAll,
  className,
}: ActiveTasksCardProps) {
  const displayTasks = tasks.slice(0, maxDisplay)

  return (
    <Card span={12} className={cn('min-h-[400px]', className)}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Active Tasks</h3>
        <button
          onClick={onViewAll}
          className={cn(
            'text-xs text-secondary',
            'bg-white/5 px-3 py-1 rounded-full',
            'hover:bg-accent hover:text-white',
            'transition-colors'
          )}
        >
          View All
        </button>
      </div>

      {/* Task Grid */}
      <div className="grid grid-cols-4 gap-4">
        {displayTasks.map((task) => (
          <TaskItem
            key={task.id}
            id={task.id}
            url={task.url}
            title={task.title}
            progress={task.progress}
            status={task.status}
          />
        ))}

        {/* Empty State */}
        {displayTasks.length === 0 && (
          <div className="col-span-4 flex items-center justify-center h-48 text-secondary">
            No active tasks
          </div>
        )}
      </div>
    </Card>
  )
}
```

### ControlBar.tsx - 控制栏 (启动/停止)

```tsx
// src/components/cards/ControlBar.tsx
import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'

export interface ControlBarProps {
  isRunning: boolean
  onStart: () => void
  onStop: () => void
  className?: string
}

export function ControlBar({
  isRunning,
  onStart,
  onStop,
  className,
}: ControlBarProps) {
  return (
    <div className={cn('flex items-center gap-4', className)}>
      {!isRunning ? (
        <motion.button
          onClick={onStart}
          className={cn(
            'px-6 py-2 rounded-full font-medium',
            'bg-accent text-white',
            'hover:bg-accent/80 transition-colors'
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Start Scraping
        </motion.button>
      ) : (
        <motion.button
          onClick={onStop}
          className={cn(
            'px-6 py-2 rounded-full font-medium',
            'bg-error text-white',
            'hover:bg-error/80 transition-colors'
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Stop
        </motion.button>
      )}

      {isRunning && (
        <div className="flex items-center gap-2 text-sm text-secondary">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          Running...
        </div>
      )}
    </div>
  )
}
```

---

## 5. Hooks

### useThrottle.ts - 节流 Hook

```typescript
// src/hooks/useThrottle.ts
import { useCallback, useRef } from 'react'

export function useThrottle<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const lastCall = useRef(0)
  const lastArgs = useRef<Parameters<T> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now()
      const timeSinceLastCall = now - lastCall.current

      if (timeSinceLastCall >= delay) {
        lastCall.current = now
        callback(...args)
      } else {
        // 保存最新参数，延迟执行
        lastArgs.current = args

        if (!timeoutRef.current) {
          timeoutRef.current = setTimeout(() => {
            if (lastArgs.current) {
              lastCall.current = Date.now()
              callback(...lastArgs.current)
              lastArgs.current = null
            }
            timeoutRef.current = null
          }, delay - timeSinceLastCall)
        }
      }
    }) as T,
    [callback, delay]
  )
}
```

### useScraperIPC.ts - IPC 通信 Hook

```typescript
// src/hooks/useScraperIPC.ts
import { useEffect, useCallback } from 'react'
import { useScraperStore } from '../stores/scraperStore'
import { useThrottle } from './useThrottle'

export function useScraperIPC() {
  const store = useScraperStore()

  // 节流更新
  const throttledUpdateProgress = useThrottle(
    store.updateProgress,
    100
  )

  const throttledUpdateTask = useThrottle(
    store.updateTask,
    50
  )

  // 订阅 IPC 事件
  useEffect(() => {
    if (!window.scraper) {
      console.warn('window.scraper is not available')
      return
    }

    const unsubProgress = window.scraper.onProgress((msg) => {
      throttledUpdateProgress(msg.data)
    })

    const unsubTask = window.scraper.onTaskUpdate((msg) => {
      throttledUpdateTask(msg.data)
    })

    const unsubComplete = window.scraper.onComplete((msg) => {
      store.setComplete(msg.data)
    })

    const unsubError = window.scraper.onError((error) => {
      store.setError(error.message)
    })

    return () => {
      unsubProgress()
      unsubTask()
      unsubComplete()
      unsubError()
    }
  }, [throttledUpdateProgress, throttledUpdateTask, store])

  // 启动爬虫
  const start = useCallback(async (config = {}) => {
    store.reset()
    store.setRunning(true)

    try {
      const result = await window.scraper.start(config)
      if (!result.success) {
        store.setRunning(false)
        store.setError(result.error || 'Failed to start')
      }
      return result
    } catch (e) {
      store.setRunning(false)
      store.setError(String(e))
      return { success: false, error: String(e) }
    }
  }, [store])

  // 停止爬虫
  const stop = useCallback(async () => {
    try {
      const result = await window.scraper.stop()
      if (result.success) {
        store.setRunning(false)
      }
      return result
    } catch (e) {
      return { success: false, error: String(e) }
    }
  }, [store])

  return { start, stop }
}
```

---

## 完整 App.tsx 示例

```tsx
// src/App.tsx
import { Sidebar } from './components/layout/Sidebar'
import { BentoGrid } from './components/layout/BentoGrid'
import { ProgressCard } from './components/cards/ProgressCard'
import { StatsCard } from './components/cards/StatsCard'
import { ActiveTasksCard } from './components/cards/ActiveTasksCard'
import { ControlBar } from './components/cards/ControlBar'
import { useScraperStore } from './stores/scraperStore'
import { useScraperIPC } from './hooks/useScraperIPC'

function App() {
  const { start, stop } = useScraperIPC()

  const isRunning = useScraperStore((s) => s.isRunning)
  const progress = useScraperStore((s) => s.progress)
  const activeTasks = useScraperStore((s) => s.activeTasks)

  return (
    <div className="flex h-screen w-full bg-background text-primary overflow-hidden">
      <Sidebar />

      <main className="flex-1 p-6 overflow-y-auto">
        {/* Control Bar */}
        <div className="mb-6">
          <ControlBar
            isRunning={isRunning}
            onStart={() => start()}
            onStop={() => stop()}
          />
        </div>

        {/* Bento Grid */}
        <BentoGrid>
          <ProgressCard
            percentage={progress?.percentage ?? 0}
            completed={progress?.completed ?? 0}
            total={progress?.total ?? 0}
          />

          <StatsCard
            success={progress?.success ?? 0}
            failed={progress?.failed ?? 0}
          />

          <ActiveTasksCard
            tasks={activeTasks}
            onViewAll={() => console.log('View all')}
          />
        </BentoGrid>
      </main>
    </div>
  )
}

export default App
```

---

## 组件索引导出

```typescript
// src/components/index.ts

// Shared
export { Card } from './shared/Card'
export { CircularProgress } from './shared/CircularProgress'
export { TaskItem } from './shared/TaskItem'
export { GlowDot } from './shared/GlowDot'

// Layout
export { Sidebar } from './layout/Sidebar'
export { BentoGrid } from './layout/BentoGrid'

// Cards
export { ProgressCard } from './cards/ProgressCard'
export { StatsCard } from './cards/StatsCard'
export { ActiveTasksCard } from './cards/ActiveTasksCard'
export { ControlBar } from './cards/ControlBar'
```
