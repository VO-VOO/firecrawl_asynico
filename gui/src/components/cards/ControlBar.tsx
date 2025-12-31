import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'

export interface ControlBarProps {
  isRunning: boolean
  isCompleted?: boolean
  onStart: () => void
  onStop: () => void
  onImportJson?: () => void
  importedFile?: {
    path: string
    articleCount: number
  } | null
  disabled?: boolean
  className?: string
}

export function ControlBar({
  isRunning,
  isCompleted = false,
  onStart,
  onStop,
  onImportJson,
  importedFile,
  disabled = false,
  className,
}: ControlBarProps) {
  // 提取文件名
  const fileName = importedFile?.path?.split('/').pop() || ''

  return (
    <div className={cn('flex items-center gap-4', className)}>
      {/* Import JSON Button */}
      {!isRunning && (
        <motion.button
          onClick={onImportJson}
          disabled={disabled}
          className={cn(
            'px-4 py-2.5 rounded-xl font-medium text-sm',
            'bg-white/[0.06] backdrop-blur-md',
            'text-white/70 border border-white/[0.08]',
            'hover:bg-white/[0.1] hover:text-white hover:border-white/[0.15]',
            'shadow-[0_2px_8px_rgba(0,0,0,0.2)]',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          whileHover={disabled ? {} : { scale: 1.02 }}
          whileTap={disabled ? {} : { scale: 0.98 }}
        >
          导入 JSON
        </motion.button>
      )}

      {/* Start/Stop Button */}
      {!isRunning ? (
        <motion.button
          onClick={onStart}
          disabled={disabled || !importedFile}
          className={cn(
            'px-6 py-2.5 rounded-xl font-medium text-sm',
            'bg-accent/90 backdrop-blur-md text-white',
            'border border-accent/50',
            'hover:bg-accent hover:border-accent/70',
            'shadow-[0_2px_12px_rgba(255,122,89,0.3)]',
            (disabled || !importedFile) && 'opacity-50 cursor-not-allowed'
          )}
          whileHover={disabled || !importedFile ? {} : { scale: 1.02 }}
          whileTap={disabled || !importedFile ? {} : { scale: 0.98 }}
        >
          开始爬取
        </motion.button>
      ) : (
        <motion.button
          onClick={onStop}
          disabled={disabled}
          className={cn(
            'px-6 py-2.5 rounded-xl font-medium text-sm',
            'bg-red-500/90 backdrop-blur-md text-white',
            'border border-red-500/50',
            'hover:bg-red-500 hover:border-red-500/70',
            'shadow-[0_2px_12px_rgba(239,68,68,0.3)]',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          whileHover={disabled ? {} : { scale: 1.02 }}
          whileTap={disabled ? {} : { scale: 0.98 }}
        >
          停止
        </motion.button>
      )}

      {/* Status Indicator */}
      {isRunning ? (
        <div className="flex items-center gap-2 text-sm text-secondary">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          运行中...
        </div>
      ) : isCompleted ? (
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-green-500">已完成</span>
        </div>
      ) : importedFile ? (
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-blue-400">{importedFile.articleCount} 个任务</span>
          <span className="text-secondary truncate max-w-48" title={importedFile.path}>
            ({fileName})
          </span>
        </div>
      ) : (
        <div className="text-sm text-secondary">
          请先导入 JSON 文件
        </div>
      )}
    </div>
  )
}
