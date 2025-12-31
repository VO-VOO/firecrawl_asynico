import { motion, type HTMLMotionProps } from 'framer-motion'
import { forwardRef, type ReactNode } from 'react'
import { cn } from '../../utils/cn'

export interface CardProps extends HTMLMotionProps<'div'> {
  children: ReactNode
  hoverGlow?: boolean
  span?: 1 | 2 | 3 | 4 | 6 | 8 | 12
}

const spanClasses: Record<number, string> = {
  1: 'col-span-1',
  2: 'col-span-2',
  3: 'col-span-3',
  4: 'col-span-4',
  6: 'col-span-6',
  8: 'col-span-8',
  12: 'col-span-12',
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, className, hoverGlow = true, span = 12, ...props }, ref) => {
    const baseClass = cn(
      'bg-surface rounded-3xl p-6 border border-white/5',
      spanClasses[span],
      className
    )

    if (!hoverGlow) {
      return (
        <div ref={ref} className={baseClass}>
          {children}
        </div>
      )
    }

    return (
      <motion.div
        ref={ref}
        className={cn(baseClass, 'relative group')}
        whileHover={{
          borderColor: 'rgba(176, 38, 255, 0.5)',
          boxShadow: '0 0 20px rgba(176, 38, 255, 0.15)',
        }}
        transition={{ duration: 0.3 }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

Card.displayName = 'Card'
