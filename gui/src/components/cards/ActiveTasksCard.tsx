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
  // 按状态排序：running > pending > failed > success
  const sortedTasks = [...tasks].sort((a, b) => {
    const statusOrder = { running: 0, pending: 1, failed: 2, success: 3 }
    return statusOrder[a.status] - statusOrder[b.status]
  })

  const displayTasks = sortedTasks.slice(0, maxDisplay)
  const hasMore = tasks.length > maxDisplay

  // 统计各状态数量
  const runningCount = tasks.filter(t => t.status === 'running').length
  const pendingCount = tasks.filter(t => t.status === 'pending').length
  const successCount = tasks.filter(t => t.status === 'success').length
  const failedCount = tasks.filter(t => t.status === 'failed').length

  return (
    <Card span={12} className={cn('min-h-[400px]', className)}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">任务列表</h3>
          <div className="flex items-center gap-3 text-xs">
            {runningCount > 0 && (
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse shadow-[0_0_6px_rgba(139,92,246,0.8)]" />
                运行中 {runningCount}
              </span>
            )}
            {pendingCount > 0 && (
              <span className="text-secondary">等待 {pendingCount}</span>
            )}
            {successCount > 0 && (
              <span className="text-green-500">成功 {successCount}</span>
            )}
            {failedCount > 0 && (
              <span className="text-error">失败 {failedCount}</span>
            )}
          </div>
        </div>
        <button
          onClick={onViewAll}
          className={cn(
            'text-xs text-secondary',
            'bg-white/5 px-3 py-1.5 rounded-full',
            'border border-transparent',
            'hover:bg-violet-500/20 hover:text-white hover:border-violet-500/30',
            'hover:shadow-[0_0_12px_rgba(139,92,246,0.2)]',
            'transition-all'
          )}
        >
          {hasMore ? `查看全部 (${tasks.length})` : '查看全部'}
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
            暂无任务
          </div>
        )}
      </div>
    </Card>
  )
}
