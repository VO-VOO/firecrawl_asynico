import { useState, useMemo } from 'react'
import { useScraperStore } from '../../stores/scraperStore'
import { cn } from '../../utils/cn'
import type { TaskData } from '../../types/scraper'

type FilterType = 'all' | 'success' | 'failed'

export interface TaskListPageProps {
  initialFilter?: FilterType
}

export function TaskListPage({ initialFilter = 'all' }: TaskListPageProps) {
  const allTasks = useScraperStore((s) => s.allTasks)
  const [filter, setFilter] = useState<FilterType>(initialFilter)

  // 根据筛选条件过滤任务
  const filteredTasks = useMemo(() => {
    if (filter === 'all') return allTasks
    return allTasks.filter((task) => task.status === filter)
  }, [allTasks, filter])

  // 统计数量
  const successCount = allTasks.filter((t) => t.status === 'success').length
  const failedCount = allTasks.filter((t) => t.status === 'failed').length

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">任务列表</h1>
        <div className="text-sm text-secondary">
          共 {allTasks.length} 个任务
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <FilterButton
          active={filter === 'all'}
          onClick={() => setFilter('all')}
        >
          全部 ({allTasks.length})
        </FilterButton>
        <FilterButton
          active={filter === 'success'}
          onClick={() => setFilter('success')}
          variant="success"
        >
          成功 ({successCount})
        </FilterButton>
        <FilterButton
          active={filter === 'failed'}
          onClick={() => setFilter('failed')}
          variant="error"
        >
          失败 ({failedCount})
        </FilterButton>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto">
        {filteredTasks.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-secondary">
            暂无任务
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Filter Button Component
function FilterButton({
  active,
  onClick,
  children,
  variant = 'default',
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  variant?: 'default' | 'success' | 'error'
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-4 py-2 rounded-lg text-sm font-medium transition-all border border-transparent',
        active
          ? variant === 'success'
            ? 'bg-green-500/20 text-green-500 border-green-500/30'
            : variant === 'error'
              ? 'bg-red-500/20 text-red-500 border-red-500/30'
              : 'bg-violet-500/20 text-violet-400 border-violet-500/30'
          : 'bg-white/5 text-secondary hover:bg-violet-500/10 hover:text-white hover:border-violet-500/20'
      )}
    >
      {children}
    </button>
  )
}

// Task Row Component
function TaskRow({ task }: { task: TaskData }) {
  const statusConfig = {
    success: { color: 'text-green-500', bg: 'bg-green-500', label: '成功' },
    failed: { color: 'text-red-500', bg: 'bg-red-500', label: '失败' },
    running: { color: 'text-violet-400', bg: 'bg-violet-400 shadow-[0_0_6px_rgba(139,92,246,0.8)]', label: '运行中' },
    pending: { color: 'text-secondary', bg: 'bg-white/40', label: '等待中' },
  }

  const config = statusConfig[task.status]

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 rounded-xl',
        'bg-[rgba(15,10,25,0.5)] border border-white/[0.06]',
        'hover:border-violet-500/30 hover:shadow-[0_0_15px_rgba(139,92,246,0.1)]',
        'transition-all'
      )}
    >
      {/* Status Indicator */}
      <div className={cn('w-2 h-2 rounded-full', config.bg)} />

      {/* Index */}
      <div className="w-12 text-sm text-secondary">#{task.index}</div>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{task.title || '无标题'}</div>
        <div className="text-xs text-secondary truncate">{task.url}</div>
      </div>

      {/* Status */}
      <div className={cn('text-sm', config.color)}>{config.label}</div>

      {/* Error (if failed) */}
      {task.status === 'failed' && task.error && (
        <div className="text-xs text-red-500 max-w-48 truncate" title={task.error}>
          {task.error}
        </div>
      )}
    </div>
  )
}
