import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'

export interface ControlBarProps {
  isRunning: boolean
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
            'px-4 py-2 rounded-full font-medium',
            'bg-white/5 text-secondary border border-white/10',
            'hover:bg-white/10 hover:text-white transition-colors',
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
            'px-6 py-2 rounded-full font-medium',
            'bg-accent text-white',
            'hover:bg-accent/80 transition-colors',
            (disabled || !importedFile) && 'opacity-50 cursor-not-allowed'
          )}
          whileHover={disabled || !importedFile ? {} : { scale: 1.05 }}
          whileTap={disabled || !importedFile ? {} : { scale: 0.95 }}
        >
          开始爬取
        </motion.button>
      ) : (
        <motion.button
          onClick={onStop}
          disabled={disabled}
          className={cn(
            'px-6 py-2 rounded-full font-medium',
            'bg-error text-white',
            'hover:bg-error/80 transition-colors',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          whileHover={disabled ? {} : { scale: 1.05 }}
          whileTap={disabled ? {} : { scale: 0.95 }}
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
      ) : importedFile ? (
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-green-500">{importedFile.articleCount} 个任务</span>
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
