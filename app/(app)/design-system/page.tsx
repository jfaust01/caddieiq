'use client'

import * as React from 'react'
import {
  AlertCircleIcon,
  BarChart3Icon,
  CheckCircle2Icon,
  CheckIcon,
  ChevronRightIcon,
  ClockIcon,
  CloudIcon,
  DownloadIcon,
  ExternalLinkIcon,
  FileTextIcon,
  FlagIcon,
  GlobeIcon,
  InfoIcon,
  LayersIcon,
  PaletteIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  SendIcon,
  SettingsIcon,
  ShieldCheckIcon,
  SlidersIcon,
  SparklesIcon,
  StarIcon,
  TargetIcon,
  TrendingUpIcon,
  UserIcon,
  XIcon,
  ZapIcon,
} from 'lucide-react'

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Toggle } from '@/components/ui/toggle'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { StatCard } from '@/components/cards/stat-card'
import { FeatureCard } from '@/components/cards/feature-card'
import { ChartCard, ChartEmpty, ChartError, ChartLegend, ChartLoading } from '@/components/charts/chart-card'
import { EmptyState } from '@/components/ui/empty-state'
import { DSSection, DSSubsection, DSPreview, DSGrid, ColorSwatch, TokenRow } from '@/features/design-system/ds-section'
import { DSNav, sections } from '@/features/design-system/ds-nav'

/* ─── Hook: active section on scroll ────────────────────────────────────────── */

function useActiveSection() {
  const [active, setActive] = React.useState(sections[0].id)
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id)
          }
        }
      },
      { rootMargin: '-20% 0px -75% 0px' },
    )
    for (const { id } of sections) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [])
  return active
}

/* ─── Page ───────────────────────────────────────────────────────────────────── */

export default function DesignSystemPage() {
  const activeId = useActiveSection()

  return (
    <TooltipProvider>
      <div className="flex flex-1 overflow-hidden">
        {/* Left nav */}
        <aside className="hidden w-52 shrink-0 border-r border-border lg:flex flex-col sticky top-0 h-screen overflow-y-auto">
          <div className="p-3 pt-6">
            <p className="text-h4 text-foreground mb-0.5">Design System</p>
            <p className="text-caption text-muted-foreground mb-4">CaddieIQ Foundation</p>
            <Separator className="mb-4" />
            <DSNav activeId={activeId} />
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-10 flex flex-col gap-10">

            {/* Hero */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <PaletteIcon className="size-5 text-primary" />
                <span className="text-label text-muted-foreground uppercase tracking-widest">CaddieIQ</span>
              </div>
              <h1 className="text-display text-foreground text-balance">Design System</h1>
              <p className="text-body text-muted-foreground max-w-xl text-pretty">
                The canonical reference for all visual language, patterns, and components used across the CaddieIQ application.
              </p>
            </div>

            {/* ── Colors ──────────────────────────────────────────────────── */}
            <DSSection
              id="colors"
              title="Colors"
              description="All colors are defined as CSS custom properties and consumed via Tailwind semantic tokens."
            >
              <DSSubsection title="Brand">
                <DSGrid cols={4}>
                  <ColorSwatch name="Primary"    variable="--primary"    foreground="--primary-foreground" />
                  <ColorSwatch name="Secondary"  variable="--secondary"  foreground="--secondary-foreground" />
                  <ColorSwatch name="Accent"     variable="--accent"     foreground="--accent-foreground" />
                  <ColorSwatch name="Muted"      variable="--muted"      foreground="--muted-foreground" />
                </DSGrid>
              </DSSubsection>
              <DSSubsection title="Semantic">
                <DSGrid cols={4}>
                  <ColorSwatch name="Background" variable="--background" />
                  <ColorSwatch name="Card"       variable="--card" />
                  <ColorSwatch name="Border"     variable="--border" />
                  <ColorSwatch name="Input"      variable="--input" />
                </DSGrid>
              </DSSubsection>
              <DSSubsection title="State">
                <DSGrid cols={4}>
                  <ColorSwatch name="Success"    variable="--success" />
                  <ColorSwatch name="Warning"    variable="--warning" />
                  <ColorSwatch name="Info"       variable="--info" />
                  <ColorSwatch name="Destructive" variable="--destructive" />
                </DSGrid>
              </DSSubsection>
              <DSSubsection title="Chart palette">
                <DSGrid cols={5}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <ColorSwatch key={n} name={`Chart ${n}`} variable={`--chart-${n}`} />
                  ))}
                </DSGrid>
              </DSSubsection>
            </DSSection>

            {/* ── Typography ──────────────────────────────────────────────── */}
            <DSSection
              id="typography"
              title="Typography"
              description="Font scale uses Inter for UI and Geist Mono for code. All sizes are rem-based."
            >
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-1.5">
                  <p className="text-label text-muted-foreground uppercase tracking-widest text-[10px]">Display</p>
                  <p className="text-display">The quick fox</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="text-label text-muted-foreground uppercase tracking-widest text-[10px]">Heading 1</p>
                  <p className="text-h1">The quick fox</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="text-label text-muted-foreground uppercase tracking-widest text-[10px]">Heading 2</p>
                  <p className="text-h2">The quick fox</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="text-label text-muted-foreground uppercase tracking-widest text-[10px]">Heading 3</p>
                  <p className="text-h3">The quick fox</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="text-label text-muted-foreground uppercase tracking-widest text-[10px]">Heading 4</p>
                  <p className="text-h4">The quick fox</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="text-label text-muted-foreground uppercase tracking-widest text-[10px]">Body</p>
                  <p className="text-body max-w-lg text-pretty">The quick brown fox jumps over the lazy dog. This is a sample body text paragraph that demonstrates the readable line-height and comfortable measure for long-form content.</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="text-label text-muted-foreground uppercase tracking-widest text-[10px]">Small / Label</p>
                  <p className="text-small text-muted-foreground">The quick brown fox — supporting text, labels, meta</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="text-label text-muted-foreground uppercase tracking-widest text-[10px]">Caption</p>
                  <p className="text-caption text-muted-foreground">Caption / auxiliary text for timestamps, counts, hints</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="text-label text-muted-foreground uppercase tracking-widest text-[10px]">Code</p>
                  <p className="font-mono text-sm bg-muted rounded-md px-2.5 py-1.5 inline-block">{'const caddie = new CaddieIQ()'}</p>
                </div>
              </div>
            </DSSection>

            {/* ── Spacing ─────────────────────────────────────────────────── */}
            <DSSection
              id="spacing"
              title="Spacing"
              description="Built on a 4px base grid. Use Tailwind spacing utilities directly."
            >
              <div className="flex flex-col gap-0">
                {[
                  ['1', '4px'],
                  ['2', '8px'],
                  ['3', '12px'],
                  ['4', '16px'],
                  ['5', '20px'],
                  ['6', '24px'],
                  ['8', '32px'],
                  ['10', '40px'],
                  ['12', '48px'],
                  ['16', '64px'],
                ].map(([scale, px]) => (
                  <div key={scale} className="flex items-center gap-4 py-2 border-b border-border/50">
                    <span className="w-8 text-small font-mono text-muted-foreground">{scale}</span>
                    <div
                      className="h-4 rounded-sm bg-primary/30 shrink-0"
                      style={{ width: px }}
                    />
                    <span className="text-small text-muted-foreground">{px}</span>
                  </div>
                ))}
              </div>
            </DSSection>

            {/* ── Shadows ─────────────────────────────────────────────────── */}
            <DSSection
              id="shadows"
              title="Shadows"
              description="Shadow tokens defined in globals.css. Applied via CSS variables."
            >
              <DSGrid cols={3}>
                {[
                  { name: 'Shadow XS',    variable: '--shadow-xs' },
                  { name: 'Shadow SM',    variable: '--shadow-sm' },
                  { name: 'Shadow MD',    variable: '--shadow-md' },
                  { name: 'Shadow LG',    variable: '--shadow-lg' },
                  { name: 'Shadow XL',    variable: '--shadow-xl' },
                  { name: 'Shadow Hover', variable: '--shadow-hover' },
                ].map(({ name, variable }) => (
                  <div
                    key={variable}
                    className="flex flex-col gap-2.5"
                  >
                    <div
                      className="h-20 rounded-xl bg-card border border-border flex items-center justify-center"
                      style={{ boxShadow: `var(${variable})` }}
                    >
                      <span className="text-caption text-muted-foreground font-mono">{variable}</span>
                    </div>
                    <span className="text-small font-medium">{name}</span>
                  </div>
                ))}
              </DSGrid>
            </DSSection>

            {/* ── Animations ──────────────────────────────────────────────── */}
            <DSSection
              id="animations"
              title="Animations"
              description="Keyframe animations registered in globals.css, consumable as Tailwind animate-* utilities."
            >
              <DSGrid cols={2}>
                {[
                  { name: 'animate-fade-in',       label: 'Fade In' },
                  { name: 'animate-fade-in-up',    label: 'Fade In Up' },
                  { name: 'animate-slide-in-left', label: 'Slide In Left' },
                  { name: 'animate-slide-in-right','label': 'Slide In Right' },
                  { name: 'animate-scale-in',      label: 'Scale In' },
                  { name: 'animate-spin-slow',     label: 'Spin Slow' },
                  { name: 'animate-pulse-subtle',  label: 'Pulse Subtle' },
                  { name: 'animate-shimmer',       label: 'Shimmer' },
                ].map(({ name, label }) => (
                  <div key={name} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card group">
                    <div
                      className={`size-8 rounded-lg bg-primary/20 flex items-center justify-center group-hover:${name}`}
                    >
                      <SparklesIcon className="size-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-small font-medium">{label}</p>
                      <p className="text-caption text-muted-foreground font-mono">{name}</p>
                    </div>
                  </div>
                ))}
              </DSGrid>
            </DSSection>

            {/* ── Icons ───────────────────────────────────────────────────── */}
            <DSSection
              id="icons"
              title="Icons"
              description="Lucide React icon library. Use consistent sizes: size-4 (16), size-5 (20), size-6 (24)."
            >
              <DSSubsection title="Size scale">
                <DSPreview>
                  {[
                    { cls: 'size-3', label: '12px' },
                    { cls: 'size-4', label: '16px' },
                    { cls: 'size-5', label: '20px' },
                    { cls: 'size-6', label: '24px' },
                    { cls: 'size-8', label: '32px' },
                  ].map(({ cls, label }) => (
                    <div key={cls} className="flex flex-col items-center gap-1.5">
                      <StarIcon className={cls} />
                      <span className="text-caption text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </DSPreview>
              </DSSubsection>
              <DSSubsection title="Sample set">
                <DSPreview>
                  {[
                    BarChart3Icon, SettingsIcon, UserIcon, SearchIcon, PlusIcon,
                    CheckIcon, XIcon, DownloadIcon, ExternalLinkIcon, RefreshCwIcon,
                    CloudIcon, GlobeIcon, ShieldCheckIcon, ZapIcon, TargetIcon,
                    LayersIcon, FlagIcon, TrendingUpIcon, FileTextIcon, SlidersIcon,
                  ].map((Icon, i) => (
                    <span key={i} className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-default">
                      <Icon className="size-4" />
                    </span>
                  ))}
                </DSPreview>
              </DSSubsection>
            </DSSection>

            {/* ── Buttons ─────────────────────────────────────────────────── */}
            <DSSection
              id="buttons"
              title="Buttons"
              description="Four variants × three sizes. Use the icon data-attributes for proper spacing."
            >
              <DSSubsection title="Variants">
                <DSPreview>
                  <Button variant="default">Default</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="link">Link</Button>
                </DSPreview>
              </DSSubsection>
              <DSSubsection title="Sizes">
                <DSPreview>
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                  <Button size="icon"><SettingsIcon /></Button>
                </DSPreview>
              </DSSubsection>
              <DSSubsection title="With icons">
                <DSPreview>
                  <Button><PlusIcon data-icon="inline-start" /> New round</Button>
                  <Button variant="outline"><DownloadIcon data-icon="inline-start" /> Export</Button>
                  <Button variant="secondary">Send report<SendIcon data-icon="inline-end" /></Button>
                  <Button variant="ghost" disabled>Disabled</Button>
                </DSPreview>
              </DSSubsection>
            </DSSection>

            {/* ── Forms ───────────────────────────────────────────────────── */}
            <DSSection
              id="forms"
              title="Form Elements"
              description="All form controls use a consistent 36px height, rounded-md border, and ring-focus pattern."
            >
              <DSGrid cols={2}>
                <DSSubsection title="Input">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="ds-input">Label</Label>
                      <Input id="ds-input" placeholder="Placeholder text" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="ds-input-disabled">Disabled</Label>
                      <Input id="ds-input-disabled" placeholder="Disabled" disabled />
                    </div>
                  </div>
                </DSSubsection>
                <DSSubsection title="Textarea">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="ds-textarea">Notes</Label>
                    <Textarea id="ds-textarea" placeholder="Enter your notes…" rows={3} />
                  </div>
                </DSSubsection>
                <DSSubsection title="Select">
                  <div className="flex flex-col gap-1.5">
                    <Label>Course</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pebble">Pebble Beach</SelectItem>
                        <SelectItem value="augusta">Augusta National</SelectItem>
                        <SelectItem value="st-andrews">St Andrews</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </DSSubsection>
                <DSSubsection title="Controls">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox id="ds-check" defaultChecked />
                      <Label htmlFor="ds-check">Track handicap</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch id="ds-switch" defaultChecked />
                      <Label htmlFor="ds-switch">GPS mode</Label>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Difficulty</Label>
                      <Slider defaultValue={[60]} max={100} step={1} />
                    </div>
                  </div>
                </DSSubsection>
              </DSGrid>
              <DSSubsection title="Toggle">
                <DSPreview>
                  <Toggle defaultPressed aria-label="Bold">
                    <FlagIcon className="size-4" />
                  </Toggle>
                  <Toggle variant="outline" aria-label="Italic">
                    <StarIcon className="size-4" />
                  </Toggle>
                  <Toggle size="sm" aria-label="Small">
                    <ZapIcon className="size-4" />
                  </Toggle>
                </DSPreview>
              </DSSubsection>
              <DSSubsection title="Tooltip">
                <DSPreview>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon"><InfoIcon className="size-4" /></Button>
                    </TooltipTrigger>
                    <TooltipContent>This is a tooltip</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost">Hover me</Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Keyboard shortcut: ⌘K</TooltipContent>
                  </Tooltip>
                </DSPreview>
              </DSSubsection>
            </DSSection>

            {/* ── Cards ───────────────────────────────────────────────────── */}
            <DSSection
              id="cards"
              title="Cards"
              description="Card variants: default, outlined, interactive. StatCard and FeatureCard are composed on top."
            >
              <DSSubsection title="Base card variants">
                <DSGrid cols={3}>
                  <Card variant="default">
                    <CardHeader>
                      <CardTitle className="text-sm">Default</CardTitle>
                      <CardDescription>Subtle shadow, no border ring.</CardDescription>
                    </CardHeader>
                    <CardContent><p className="text-small text-muted-foreground">Card content area</p></CardContent>
                  </Card>
                  <Card variant="outlined">
                    <CardHeader>
                      <CardTitle className="text-sm">Outlined</CardTitle>
                      <CardDescription>Solid border, no shadow.</CardDescription>
                    </CardHeader>
                    <CardContent><p className="text-small text-muted-foreground">Card content area</p></CardContent>
                  </Card>
                  <Card variant="interactive">
                    <CardHeader>
                      <CardTitle className="text-sm">Interactive</CardTitle>
                      <CardDescription>Hover lift + shadow effect.</CardDescription>
                    </CardHeader>
                    <CardContent><p className="text-small text-muted-foreground">Card content area</p></CardContent>
                  </Card>
                </DSGrid>
              </DSSubsection>
              <DSSubsection title="Stat cards">
                <DSGrid cols={3}>
                  <StatCard
                    id="s1" label="Total Rounds" value="142"
                    delta="+12" trend="up" icon={FlagIcon}
                    hint="vs. last 90 days"
                  />
                  <StatCard
                    id="s2" label="Avg Score" value="+3.4"
                    delta="-0.8" trend="down" icon={TargetIcon}
                    hint="vs. last 90 days"
                  />
                  <StatCard
                    id="s3" label="Handicap Index" value="7.2"
                    delta="0.0" trend="neutral" icon={TrendingUpIcon}
                    hint="No change this month"
                  />
                </DSGrid>
              </DSSubsection>
              <DSSubsection title="Feature cards">
                <DSGrid cols={3}>
                  <FeatureCard title="Round Tracker" description="Log every round and track your progress over time with detailed stats." icon={FlagIcon} href="#" />
                  <FeatureCard title="Course Library" description="Browse 40,000+ courses with hole-by-hole data and layout maps." icon={GlobeIcon} badge={<Badge variant="success" size="sm">New</Badge>} />
                  <FeatureCard title="AI Caddie" description="Get club recommendations and strategy tips powered by AI." icon={SparklesIcon} href="#" />
                </DSGrid>
              </DSSubsection>
            </DSSection>

            {/* ── Badges ──────────────────────────────────────────────────── */}
            <DSSection
              id="badges"
              title="Badges"
              description="Small status indicators. Use semantic variants to convey meaning."
            >
              <DSSubsection title="Variants × sizes">
                <DSPreview>
                  <Badge variant="default">Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="info">Info</Badge>
                </DSPreview>
                <DSPreview className="mt-3" label="Small">
                  <Badge variant="default" size="sm">Default</Badge>
                  <Badge variant="success" size="sm">Success</Badge>
                  <Badge variant="warning" size="sm">Warning</Badge>
                  <Badge variant="info" size="sm">Info</Badge>
                  <Badge variant="destructive" size="sm">Destructive</Badge>
                </DSPreview>
              </DSSubsection>
              <DSSubsection title="With icons">
                <DSPreview>
                  <Badge variant="success"><CheckCircle2Icon className="size-3" />Active</Badge>
                  <Badge variant="warning"><ClockIcon className="size-3" />Pending</Badge>
                  <Badge variant="destructive"><AlertCircleIcon className="size-3" />Error</Badge>
                  <Badge variant="info"><InfoIcon className="size-3" />Info</Badge>
                </DSPreview>
              </DSSubsection>
            </DSSection>

            {/* ── Alerts ──────────────────────────────────────────────────── */}
            <DSSection
              id="alerts"
              title="Alerts"
              description="In-page feedback banners. Use sparingly — prefer Toasts for transient messages."
            >
              <div className="flex flex-col gap-3">
                <Alert variant="default">
                  <InfoIcon />
                  <AlertTitle>Information</AlertTitle>
                  <AlertDescription>Your handicap index will be updated after your next 3 rounds.</AlertDescription>
                </Alert>
                <Alert variant="success">
                  <CheckCircle2Icon />
                  <AlertTitle>Round submitted</AlertTitle>
                  <AlertDescription>Your round of 72 has been recorded and your handicap updated.</AlertDescription>
                </Alert>
                <Alert variant="warning">
                  <AlertCircleIcon />
                  <AlertTitle>Incomplete scorecard</AlertTitle>
                  <AlertDescription>You have 4 holes with missing scores. Complete them to submit.</AlertDescription>
                </Alert>
                <Alert variant="destructive">
                  <AlertCircleIcon />
                  <AlertTitle>Sync failed</AlertTitle>
                  <AlertDescription>We couldn&apos;t connect to the GPS service. Check your connection and retry.</AlertDescription>
                </Alert>
              </div>
            </DSSection>

            {/* ── Tables ──────────────────────────────────────────────────── */}
            <DSSection
              id="tables"
              title="Tables"
              description="Use Tabs to show the table component patterns with realistic golf data."
            >
              <Card variant="outlined">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left py-3 px-4 text-small font-medium text-muted-foreground">Date</th>
                        <th className="text-left py-3 px-4 text-small font-medium text-muted-foreground">Course</th>
                        <th className="text-right py-3 px-4 text-small font-medium text-muted-foreground">Score</th>
                        <th className="text-right py-3 px-4 text-small font-medium text-muted-foreground">Differential</th>
                        <th className="py-3 px-4 text-small font-medium text-muted-foreground text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { date: 'Jul 12', course: 'Pebble Beach', score: 74, diff: '+2.4', status: 'success' },
                        { date: 'Jul 8',  course: 'Torrey Pines',  score: 78, diff: '+6.1', status: 'warning' },
                        { date: 'Jul 4',  course: 'Augusta Natl',  score: 71, diff: '-0.6', status: 'success' },
                        { date: 'Jun 29', course: 'St Andrews',    score: 82, diff: '+9.2', status: 'destructive' },
                        { date: 'Jun 24', course: 'Shinnecock',    score: 75, diff: '+3.1', status: 'success' },
                      ].map((row, i) => (
                        <tr key={i} className="border-b border-border/50 hover:bg-muted/40 transition-colors">
                          <td className="py-3 px-4 text-muted-foreground">{row.date}</td>
                          <td className="py-3 px-4 font-medium">{row.course}</td>
                          <td className="py-3 px-4 text-right tabular-nums">{row.score}</td>
                          <td className="py-3 px-4 text-right tabular-nums font-mono text-sm">{row.diff}</td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant={row.status as 'success' | 'warning' | 'destructive'} size="sm">
                              {row.status === 'success' ? 'Posted' : row.status === 'warning' ? 'Pending' : 'Rejected'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </DSSection>

            {/* ── Loading ─────────────────────────────────────────────────── */}
            <DSSection
              id="loading"
              title="Loading States"
              description="Skeleton components plus spinner and progress indicators."
            >
              <DSSubsection title="Skeletons">
                <DSPreview>
                  <div className="flex flex-col gap-3 w-full">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-10 rounded-full" />
                      <div className="flex flex-col gap-2 flex-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </div>
                </DSPreview>
              </DSSubsection>
              <DSSubsection title="Chart skeleton">
                <ChartCard title="Loading chart">
                  <ChartLoading height={180} />
                </ChartCard>
              </DSSubsection>
            </DSSection>

            {/* ── Empty States ────────────────────────────────────────────── */}
            <DSSection
              id="empty-states"
              title="Empty States"
              description="Use EmptyState for zero-data views. Always provide a primary action."
            >
              <DSGrid cols={2}>
                <EmptyState
                  icon={FlagIcon}
                  title="No rounds yet"
                  description="Track your first round to start building your handicap history."
                  action={<Button size="sm"><PlusIcon data-icon="inline-start" />Add round</Button>}
                />
                <EmptyState
                  icon={SearchIcon}
                  title="No results found"
                  description="Try adjusting your filters or searching with different keywords."
                  action={<Button variant="outline" size="sm">Clear filters</Button>}
                />
              </DSGrid>
            </DSSection>

            {/* ── Charts ──────────────────────────────────────────────────── */}
            <DSSection
              id="charts"
              title="Charts"
              description="ChartCard wraps the EChart component with consistent heading, toolbar, and legend slots."
            >
              <Tabs defaultValue="empty">
                <TabsList>
                  <TabsTrigger value="empty">Empty</TabsTrigger>
                  <TabsTrigger value="loading">Loading</TabsTrigger>
                  <TabsTrigger value="error">Error</TabsTrigger>
                  <TabsTrigger value="legend">Legend</TabsTrigger>
                </TabsList>
                <TabsContent value="empty" className="mt-4">
                  <ChartCard title="Score over time" description="Last 20 rounds">
                    <ChartEmpty height={200} />
                  </ChartCard>
                </TabsContent>
                <TabsContent value="loading" className="mt-4">
                  <ChartCard title="Score over time" description="Last 20 rounds">
                    <ChartLoading height={200} />
                  </ChartCard>
                </TabsContent>
                <TabsContent value="error" className="mt-4">
                  <ChartCard title="Score over time" description="Last 20 rounds">
                    <ChartError height={200} onRetry={() => {}} />
                  </ChartCard>
                </TabsContent>
                <TabsContent value="legend" className="mt-4">
                  <ChartCard
                    title="Score over time"
                    description="Last 20 rounds"
                    legend={
                      <ChartLegend
                        items={[
                          { label: 'Gross score',  color: 'var(--chart-1)' },
                          { label: 'Net score',    color: 'var(--chart-2)' },
                          { label: 'Course rating',color: 'var(--chart-3)' },
                        ]}
                      />
                    }
                  >
                    <div className="h-[200px] flex items-center justify-center rounded-lg bg-muted/40 border border-dashed border-border">
                      <span className="text-small text-muted-foreground">Chart renders here</span>
                    </div>
                  </ChartCard>
                </TabsContent>
              </Tabs>
            </DSSection>

            {/* Footer spacer */}
            <div className="h-16" />
          </div>
        </main>
      </div>
    </TooltipProvider>
  )
}
