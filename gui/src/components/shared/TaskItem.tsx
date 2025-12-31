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
