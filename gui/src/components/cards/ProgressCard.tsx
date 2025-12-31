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
      <h3 className="text-secondary text-sm font-medium mb-4">总体进度</h3>

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
