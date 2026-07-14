import { BookOpen, LifeBuoy, MessageCircle } from 'lucide-react'

import { FeatureCard } from '@/components/cards/feature-card'
import { PageHeader } from '@/components/shared/page-header'
import { PageShell } from '@/components/shared/page-shell'
import { SectionHeader } from '@/components/shared/section-header'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Card, CardContent } from '@/components/ui/card'

const supportResources = [
  {
    icon: BookOpen,
    title: 'Documentation',
    description: 'Read guides on building models, importing data, and reading projections.',
    href: '#',
  },
  {
    icon: MessageCircle,
    title: 'Community',
    description: 'Trade strategies and model ideas with other CaddieIQ analysts.',
    href: '#',
  },
  {
    icon: LifeBuoy,
    title: 'Contact support',
    description: 'Reach the team directly for account, billing, or technical help.',
    href: '#',
  },
]

const faqs = [
  {
    question: 'What powers the projections in CaddieIQ?',
    answer:
      'Projections combine your configured models with player, course, and tournament data. Once you connect a data source and deploy a model, rankings update automatically for active events.',
  },
  {
    question: 'Can I build more than one model?',
    answer:
      'Yes. You can design, tune, and deploy multiple models, then compare their output side by side from the Models workspace.',
  },
  {
    question: 'How do I import players and tournaments?',
    answer:
      'Use the import actions on the Players and Tournaments pages. Data connections are configured per workspace so your team shares a single source of truth.',
  },
  {
    question: 'Is my workspace data private to my team?',
    answer:
      'Every workspace is isolated. Members you invite can access shared models and data, while your account settings remain under your control.',
  },
]

export function HelpView() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Support"
        title="Help center"
        description="Find answers, learn the platform, and get in touch when you need a hand."
      />

      <section className="flex flex-col gap-4">
        <SectionHeader title="Resources" description="Everything you need to get the most out of CaddieIQ." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {supportResources.map((resource) => (
            <FeatureCard
              key={resource.title}
              icon={resource.icon}
              title={resource.title}
              description={resource.description}
              href={resource.href}
            />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeader
          title="Frequently asked questions"
          description="Quick answers to the most common questions."
        />
        <Card>
          <CardContent>
            <Accordion>
              {faqs.map((faq) => (
                <AccordionItem key={faq.question} value={faq.question}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </section>
    </PageShell>
  )
}
