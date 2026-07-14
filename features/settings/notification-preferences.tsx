'use client'

import { useState } from 'react'

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldTitle,
} from '@/components/ui/field'
import { Switch } from '@/components/ui/switch'

interface Preference {
  id: string
  title: string
  description: string
  defaultChecked: boolean
}

const PREFERENCES: Preference[] = [
  {
    id: 'model-runs',
    title: 'Model runs',
    description: 'Notify me when a model finishes running.',
    defaultChecked: true,
  },
  {
    id: 'event-updates',
    title: 'Event updates',
    description: 'Field changes and schedule updates for tracked tournaments.',
    defaultChecked: true,
  },
  {
    id: 'product',
    title: 'Product news',
    description: 'Occasional updates about new CaddieIQ features.',
    defaultChecked: false,
  },
]

export function NotificationPreferences() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(PREFERENCES.map((p) => [p.id, p.defaultChecked])),
  )

  return (
    <FieldGroup>
      {PREFERENCES.map((pref) => (
        <Field key={pref.id} orientation="horizontal">
          <FieldContent>
            <FieldTitle>{pref.title}</FieldTitle>
            <FieldDescription>{pref.description}</FieldDescription>
          </FieldContent>
          <Switch
            checked={prefs[pref.id]}
            aria-label={pref.title}
            onCheckedChange={(checked) =>
              setPrefs((prev) => ({ ...prev, [pref.id]: checked }))
            }
          />
        </Field>
      ))}
    </FieldGroup>
  )
}
