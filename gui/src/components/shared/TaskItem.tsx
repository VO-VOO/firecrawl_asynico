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
    dot: 'bg-white/40',
    bar: 'bg-white/20',
  },
  running: {
    dot: 'bg-violet-400 animate-pulse shadow-[0_0_6px_rgba(139,92,246,0.8)]',
    bar: 'bg-gradient-to-r from-violet-500 to-violet-400',
  },
  success: {
    dot: 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]',
    bar: 'bg-gradient-to-r from-green-500 to-green-400',
  },
  failed: {
    dot: 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.6)]',
    bar: 'bg-gradient-to-r from-red-500 to-red-400',
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
        'bg-[rgba(15,10,25,0.5)] rounded-xl p-3',
        'border border-white/[0.06]',
        'flex flex-col gap-2 cursor-pointer',
        className
      )}
      onClick={onClick}
      whileHover={{
        scale: 1.02,
        borderColor: 'rgba(139, 92, 246, 0.4)',
        boxShadow: '0 4px 20px rgba(139, 92, 246, 0.1), 0 0 30px rgba(139, 92, 246, 0.08)',
      }}
      transition={{ duration: 0.2 }}
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
