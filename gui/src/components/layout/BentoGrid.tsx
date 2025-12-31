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
