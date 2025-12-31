import { Card } from '../shared/Card'
import { cn } from '../../utils/cn'

export interface StatsCardProps {
  success: number
  failed: number
  onSuccessClick?: () => void
  onFailedClick?: () => void
  className?: string
}

export function StatsCard({
  success,
  failed,
  onSuccessClick,
  onFailedClick,
  className,
}: StatsCardProps) {
  return (
    <Card
      span={8}
      className={cn('min-h-[280px] flex items-center justify-around relative', className)}
    >
      <h3 className="absolute top-6 left-6 text-secondary text-sm font-medium">
        统计
      </h3>

      {/* Success */}
      <button
        onClick={onSuccessClick}
        className={cn(
          'text-center p-6 rounded-xl transition-all border border-transparent',
          onSuccessClick && 'hover:bg-violet-500/10 hover:border-violet-500/30 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] cursor-pointer'
        )}
      >
        <div className="text-lg text-secondary mb-2">成功</div>
        <div className="text-5xl font-bold text-primary">
          {success.toLocaleString()}
          <span className="text-green-500 text-lg ml-1">+</span>
        </div>
        <div className="text-xs text-secondary uppercase tracking-wider mt-2">
          已完成
        </div>
      </button>

      {/* Divider */}
      <div className="w-px h-24 bg-white/10" />

      {/* Failed */}
      <button
        onClick={onFailedClick}
        className={cn(
          'text-center p-6 rounded-xl transition-all border border-transparent',
          onFailedClick && 'hover:bg-violet-500/10 hover:border-violet-500/30 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] cursor-pointer'
        )}
      >
        <div className="text-lg text-secondary mb-2">失败</div>
        <div className="text-5xl font-bold text-error">
          {failed.toLocaleString()}
          <span className="text-error text-lg ml-1">-</span>
        </div>
        <div className="text-xs text-secondary uppercase tracking-wider mt-2">
          错误
        </div>
      </button>
    </Card>
  )
}
