export const siteConfig = {
  name: 'CaddieIQ',
  tagline: 'Build Better Models. Make Better Picks.',
  description:
    'CaddieIQ is the professional golf analytics and custom model building platform for serious handicappers and analysts.',
  url: 'https://caddieiq.app',
} as const

export type SiteConfig = typeof siteConfig
