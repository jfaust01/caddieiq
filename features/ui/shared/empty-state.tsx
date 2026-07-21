import React from 'react'

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  variant?: 'page' | 'card' | 'inline'
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = 'page',
  className = '',
}: EmptyStateProps) {
  const containerClass = {
    page: 'flex flex-col items-center justify-center min-h-[50vh] gap-4',
    card: 'flex flex-col items-center justify-center p-8 gap-3 text-center',
    inline: 'flex flex-col items-center justify-center gap-2 text-center',
  }

  return (
    <div className={`${containerClass[variant]} ${className}`}>
      {icon && (
        <div className="text-muted-foreground/50 text-4xl">{icon}</div>
      )}

      <div>
        <h3 className="font-semibold text-lg text-foreground">{title}</h3>
        {description && (
          <p className="text-muted-foreground text-sm mt-1">{description}</p>
        )}
      </div>

      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
