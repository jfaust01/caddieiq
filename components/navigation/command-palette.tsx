'use client'

import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Kbd } from '@/components/shared/kbd'
import { primaryNavigation, secondaryNavigation } from '@/constants/navigation'

export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const go = useCallback(
    (href: string) => {
      setOpen(false)
      router.push(href)
    },
    [router],
  )

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-8 w-full max-w-64 items-center gap-2 rounded-lg border border-border bg-surface px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        aria-label="Open command palette"
      >
        <Search className="size-4 shrink-0" />
        <span className="flex-1 text-left">Search</span>
        <Kbd>⌘K</Kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {primaryNavigation.map((section) => (
              <CommandGroup key={section.title} heading={section.title}>
                {section.items.map((item) => (
                  <CommandItem
                    key={item.href}
                    value={item.title}
                    onSelect={() => go(item.href)}
                  >
                    <item.icon />
                    {item.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
            <CommandGroup heading="Workspace">
              {secondaryNavigation.map((item) => (
                <CommandItem
                  key={item.href}
                  value={item.title}
                  onSelect={() => go(item.href)}
                >
                  <item.icon />
                  {item.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
