import Link from 'next/link'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

interface Crumb {
  label: string
  href?: string
}

/**
 * Breadcrumb trail for admin pages. Always roots at Admin. Pass the current
 * page label (and optionally intermediate crumbs) from each page.
 */
export function AdminBreadcrumbs({ items = [] }: { items?: Crumb[] }) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href="/admin">Admin</Link>} />
        </BreadcrumbItem>
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <BreadcrumbItem key={`${item.label}-${index}`}>
              <BreadcrumbSeparator />
              {isLast || !item.href ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink render={<Link href={item.href}>{item.label}</Link>} />
              )}
            </BreadcrumbItem>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
