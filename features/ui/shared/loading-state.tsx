import React from 'react'
import { Loader2 } from 'lucide-react'

export interface LoadingStateProps {
  message?: string
  variant?: 'page' | 'card' | 'inline'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingState({
  message = 'Loading...',
  variant = 'page',
  size = 'md',
  className = '',
}: LoadingStateProps) {
  const sizeClass = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  const containerClass = {
    page: 'flex flex-col items-center justify-center min-h-[50vh] gap-4',
    card: 'flex flex-col items-center justify-center p-8 gap-3',
    inline: 'flex items-center gap-2',
  }

  return (
    <div className={`${containerClass[variant]} ${className}`}>
      <Loader2 className={`${sizeClass[size]} animate-spin text-primary`} />
      {message && (
        <p
          className={`text-muted-foreground ${
            variant === 'inline' ? 'text-sm' : ''
          }`}
        >
          {message}
        </p>
      )}
    </div>
  )
}
