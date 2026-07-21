# ADR-014: Component Library with shadcn/ui

**Status:** Accepted  
**Date:** 2026-07-20  
**Deciders:** Design & Frontend Team  

---

## Context

CaddieIQ UI requires:
- Accessible components (forms, dialogs, tables, etc.)
- Consistent design system
- Easy customization
- Quick development

---

## Decision

**Use shadcn/ui for unstyled, customizable components.**

- Copy-paste component architecture
- Built on Radix UI (accessibility)
- Styled with Tailwind CSS
- Full source code ownership
- Easy to customize

---

## Components Structure
```
components/
  ui/                    # shadcn/ui base components
    button.tsx
    card.tsx
    dialog.tsx
    form.tsx
    input.tsx
    table.tsx
  
  domain/                # CaddieIQ domain components
    tournament/
      tournament-card.tsx
      tournament-form.tsx
    player/
      player-profile.tsx
    course/
      course-selector.tsx
```

---

## Examples

### Using shadcn/ui Components
```typescript
// components/domain/tournament/tournament-form.tsx
import { Button } from '@/components/ui/button'
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function CreateTournamentDialog({ isOpen, onClose }) {
  const form = useForm<TournamentInput>({
    resolver: zodResolver(tournamentSchema)
  })
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Tournament</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tournament Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Cadillac Championship" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <Button type="submit">Create</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
```

---

## Customization

### Copy to components/ui, then customize:
```typescript
// components/ui/button.tsx (customized)
import { Button as RadixButton } from '@radix-ui/react-button'
import { cva } from 'class-variance-authority'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-brand text-white hover:bg-brand-dark',
        secondary: 'bg-surface text-text hover:bg-gray-200',
        ghost: 'hover:bg-gray-100',
        outline: 'border border-gray-300 hover:bg-surface'
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3 text-xs',
        lg: 'h-11 px-8',
        icon: 'h-10 w-10'
      }
    }
  }
)

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants.variants.variant
  size?: keyof typeof buttonVariants.variants.size
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', size = 'default', ...props }, ref) => (
    <button
      ref={ref}
      className={buttonVariants({ variant, size })}
      {...props}
    />
  )
)
```

---

## Consequences

### ✓ Positive

- Accessible by default
- Full source code ownership
- Easy to customize
- Consistent design system
- Quick development

### ✗ Negative

- Copy-paste approach means updates require manual merging
- Responsibility to maintain components
- More code files than pre-built

---

## Related ADRs

- ADR-013: Tailwind CSS styling
- ADR-001: Feature-based architecture (domain components)

