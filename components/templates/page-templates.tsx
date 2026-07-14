import * as React from 'react'

import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

/* ─── Base page wrapper ──────────────────────────────────────────────────────── */

interface BasePageProps {
  children: React.ReactNode
  className?: string
}

export function BasePage({ children, className }: BasePageProps) {
  return (
    <main className={cn('flex flex-1 flex-col', className)}>
      {children}
    </main>
  )
}

/* ─── Dashboard page template ────────────────────────────────────────────────── */

interface DashboardPageProps {
  header: React.ReactNode
  stats?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function DashboardPage({ header, stats, children, className }: DashboardPageProps) {
  return (
    <BasePage className={cn('gap-0', className)}>
      <div className="px-6 pt-6 pb-4">{header}</div>
      {stats && (
        <>
          <div className="px-6 pb-4">{stats}</div>
          <Separator />
        </>
      )}
      <div className="flex flex-1 flex-col gap-4 p-6">{children}</div>
    </BasePage>
  )
}

/* ─── Listing page template ──────────────────────────────────────────────────── */

interface ListingPageProps {
  header: React.ReactNode
  toolbar?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function ListingPage({ header, toolbar, children, className }: ListingPageProps) {
  return (
    <BasePage className={cn('gap-0', className)}>
      <div className="px-6 pt-6 pb-4">{header}</div>
      {toolbar && (
        <>
          <Separator />
          <div className="px-6 py-3">{toolbar}</div>
        </>
      )}
      <Separator />
      <div className="flex flex-1 flex-col p-6">{children}</div>
    </BasePage>
  )
}

/* ─── Detail page template ───────────────────────────────────────────────────── */

interface DetailPageProps {
  header: React.ReactNode
  sidebar?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function DetailPage({ header, sidebar, children, className }: DetailPageProps) {
  return (
    <BasePage className={cn('gap-0', className)}>
      <div className="px-6 pt-6 pb-4">{header}</div>
      <Separator />
      <div className={cn('flex flex-1 gap-0', sidebar ? 'divide-x divide-border' : '')}>
        <div className="flex flex-1 flex-col gap-4 p-6">{children}</div>
        {sidebar && (
          <div className="w-72 shrink-0 flex flex-col gap-4 p-6">{sidebar}</div>
        )}
      </div>
    </BasePage>
  )
}

/* ─── Settings page template ─────────────────────────────────────────────────── */

interface SettingsPageProps {
  header: React.ReactNode
  nav: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function SettingsPage({ header, nav, children, className }: SettingsPageProps) {
  return (
    <BasePage className={cn('gap-0', className)}>
      <div className="px-6 pt-6 pb-4">{header}</div>
      <Separator />
      <div className="flex flex-1 gap-0 divide-x divide-border">
        <nav className="w-56 shrink-0 flex flex-col gap-0.5 p-3">
          {nav}
        </nav>
        <div className="flex flex-1 flex-col gap-6 p-6">{children}</div>
      </div>
    </BasePage>
  )
}

/* ─── Documentation page template ───────────────────────────────────────────── */

interface DocsPageProps {
  nav: React.ReactNode
  children: React.ReactNode
  toc?: React.ReactNode
  className?: string
}

export function DocsPage({ nav, children, toc, className }: DocsPageProps) {
  return (
    <BasePage className={cn('gap-0 lg:flex-row', className)}>
      {/* Left nav */}
      <aside className="w-56 shrink-0 border-r border-border hidden lg:flex flex-col">
        <div className="sticky top-0 flex flex-col gap-0.5 p-3 h-screen overflow-y-auto">
          {nav}
        </div>
      </aside>
      {/* Main content */}
      <div className="flex flex-1 min-w-0 gap-0 divide-x divide-border">
        <article className="flex-1 min-w-0 p-8 max-w-3xl">
          {children}
        </article>
        {/* Table of contents */}
        {toc && (
          <aside className="w-52 shrink-0 hidden xl:block">
            <div className="sticky top-0 p-4 h-screen overflow-y-auto">
              {toc}
            </div>
          </aside>
        )}
      </div>
    </BasePage>
  )
}
