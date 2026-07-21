'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Fragment } from 'react'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { allNavItems } from '@/constants/navigation'
import { BreadcrumbContext } from '@/contexts/breadcrumb-context'
import { useContext } from 'react'

function titleCase(segment: string): string {
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Detects opaque record identifiers (e.g. cuids like `cmrlmaav400004zpah5278lhm`)
 * so they are never surfaced as breadcrumb labels.
 */
function isIdLikeSegment(segment: string): boolean {
  return /^c[a-z0-9]{16,}$/i.test(segment) || (segment.length >= 16 && /\d/.test(segment))
}

/** Singularizes a section slug for id fallbacks, e.g. "tournaments" → "Tournament". */
function singularLabel(segment: string): string {
  const singular = segment.endsWith('s') ? segment.slice(0, -1) : segment
  return titleCase(singular)
}

/**
 * Human label for a path segment. Known routes use their nav title; opaque ids
 * fall back to the singular of their parent section (so a detail page reads
 * "Tournament", never a raw id); everything else is title-cased.
 */
function labelForSegment(segment: string, parentSegment?: string): string {
  const match = allNavItems.find((item) => item.href === `/${segment}`)
  if (match) return match.title
  if (isIdLikeSegment(segment)) {
    return parentSegment ? singularLabel(parentSegment) : 'Details'
  }
  return titleCase(segment)
}

export function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbContext = useContext(BreadcrumbContext)

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          {segments.length === 0 ? (
            <BreadcrumbPage>Home</BreadcrumbPage>
          ) : (
            <BreadcrumbLink render={<Link href="/">Home</Link>} />
          )}
        </BreadcrumbItem>

        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join('/')}`
          const isLast = index === segments.length - 1
          // Use tournament name from context if this is a tournament detail page
          let label = labelForSegment(segment, segments[index - 1])
          if (isLast && segments[index - 1] === 'tournaments' && breadcrumbContext.tournamentName) {
            label = breadcrumbContext.tournamentName
          }
          return (
            <Fragment key={href}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link href={href}>{label}</Link>} />
                )}
              </BreadcrumbItem>
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
