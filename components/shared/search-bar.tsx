'use client'

import { Search } from 'lucide-react'
import { useState } from 'react'

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'

interface SearchBarProps {
  placeholder?: string
  defaultValue?: string
  onSearch?: (value: string) => void
  className?: string
}

export function SearchBar({
  placeholder = 'Search...',
  defaultValue = '',
  onSearch,
  className,
}: SearchBarProps) {
  const [value, setValue] = useState(defaultValue)

  return (
    <InputGroup className={className}>
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
      <InputGroupInput
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(event) => {
          const next = event.target.value
          setValue(next)
          onSearch?.(next)
        }}
      />
    </InputGroup>
  )
}
