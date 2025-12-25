import { ReactNode } from 'react'
import clsx from 'clsx'

interface BadgeProps {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md'
  children: ReactNode
  className?: string
}

export default function Badge({
  variant = 'default',
  size = 'md',
  children,
  className,
}: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    primary: 'bg-primary-100 text-primary-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    error: 'bg-red-100 text-red-700',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  )
}

// Status badge for executions
interface StatusBadgeProps {
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig = {
    pending: { variant: 'default' as const, label: 'Pending' },
    running: { variant: 'primary' as const, label: 'Running' },
    completed: { variant: 'success' as const, label: 'Completed' },
    failed: { variant: 'error' as const, label: 'Failed' },
    cancelled: { variant: 'warning' as const, label: 'Cancelled' },
  }

  const config = statusConfig[status] || statusConfig.pending

  return <Badge variant={config.variant}>{config.label}</Badge>
}
