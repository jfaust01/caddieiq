import React from 'react'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export interface PageHeaderProps {
  title: string
  description?: string
  backHref?: string
  actions?: React.ReactNode
  breadcrumbs?: Array<{ label: string; href: string }>
  icon?: React.ReactNode
}

export function PageHeader({
  title,
  description,
  backHref,
  actions,
  breadcrumbs,
  icon,
}: PageHeaderProps) {
  return (
    <div className="space-y-4 border-b border-border/50 pb-6">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={crumb.href}>
              {i > 0 && <span>/</span>}
              <Link
                href={crumb.href}
                className="hover:text-foreground transition-colors"
              >
                {crumb.label}
              </Link>
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Back button and title */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {backHref && (
            <Link
              href={backHref}
              className="mt-1 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
          )}
          
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {icon && <div className="flex-shrink-0 mt-1">{icon}</div>}
            <div className="min-w-0">
              <h1 className="text-3xl font-bold tracking-tight text-balance">
                {title}
              </h1>
              {description && (
                <p className="text-muted-foreground mt-2 text-balance">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>
    </div>
  )
}
