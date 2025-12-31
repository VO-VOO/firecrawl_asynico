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
            <span className="text-4xl font-bold text-primary">{Math.round(progress)}%</span>
          )}
        </div>
      )}
    </div>
  )
}
