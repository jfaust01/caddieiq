"use client"

import * as React from "react"
import {
  DatabaseIcon,
  SearchXIcon,
  HeartOffIcon,
  SlidersHorizontalIcon,
  BellOffIcon,
  InboxIcon,
  FolderOpenIcon,
  PlusIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty"

/* ─── Shared wrapper ─────────────────────────────────────────────────────────── */

interface EmptyStateBaseProps {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

function EmptyStateWrapper({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateBaseProps & { icon: React.ElementType }) {
  return (
    <Empty className={cn("border border-dashed border-border py-12", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  )
}

/* ─── Specific empty states ──────────────────────────────────────────────────── */

export function EmptyData(props: Omit<EmptyStateBaseProps, "title"> & { title?: string }) {
  return (
    <EmptyStateWrapper
      icon={DatabaseIcon}
      title={props.title ?? "No data yet"}
      description={props.description ?? "Data will appear here once it becomes available."}
      action={props.action}
      className={props.className}
    />
  )
}

export function EmptyResults(props: Omit<EmptyStateBaseProps, "title"> & { title?: string }) {
  return (
    <EmptyStateWrapper
      icon={SearchXIcon}
      title={props.title ?? "No results found"}
      description={props.description ?? "Try adjusting your search or filter criteria."}
      action={props.action}
      className={props.className}
    />
  )
}

export function EmptyFavorites(props: Omit<EmptyStateBaseProps, "title"> & { title?: string }) {
  return (
    <EmptyStateWrapper
      icon={HeartOffIcon}
      title={props.title ?? "No favorites yet"}
      description={props.description ?? "Items you mark as favorites will appear here."}
      action={props.action}
      className={props.className}
    />
  )
}

export function EmptyModels(props: Omit<EmptyStateBaseProps, "title"> & { title?: string }) {
  return (
    <EmptyStateWrapper
      icon={SlidersHorizontalIcon}
      title={props.title ?? "No models yet"}
      description={props.description ?? "Build your first model to start generating predictions."}
      action={
        props.action ?? (
          <Button size="sm">
            <PlusIcon data-icon="inline-start" />
            New model
          </Button>
        )
      }
      className={props.className}
    />
  )
}

export function EmptySearch(props: Omit<EmptyStateBaseProps, "title"> & { title?: string }) {
  return (
    <EmptyStateWrapper
      icon={SearchXIcon}
      title={props.title ?? "No matches"}
      description={props.description ?? "We couldn't find anything matching that query."}
      action={props.action}
      className={props.className}
    />
  )
}

export function EmptyNotifications(props: Omit<EmptyStateBaseProps, "title"> & { title?: string }) {
  return (
    <EmptyStateWrapper
      icon={BellOffIcon}
      title={props.title ?? "All caught up"}
      description={props.description ?? "You have no new notifications."}
      action={props.action}
      className={props.className}
    />
  )
}

export function EmptyInbox(props: Omit<EmptyStateBaseProps, "title"> & { title?: string }) {
  return (
    <EmptyStateWrapper
      icon={InboxIcon}
      title={props.title ?? "Inbox empty"}
      description={props.description ?? "Nothing here right now."}
      action={props.action}
      className={props.className}
    />
  )
}

export function EmptyFolder(props: Omit<EmptyStateBaseProps, "title"> & { title?: string }) {
  return (
    <EmptyStateWrapper
      icon={FolderOpenIcon}
      title={props.title ?? "This folder is empty"}
      description={props.description ?? "Add items to get started."}
      action={props.action}
      className={props.className}
    />
  )
}

/* ─── Generic configurable empty state ──────────────────────────────────────── */

export function EmptyState({
  icon = DatabaseIcon,
  ...props
}: EmptyStateBaseProps & { icon?: React.ElementType }) {
  return <EmptyStateWrapper icon={icon} {...props} />
}
