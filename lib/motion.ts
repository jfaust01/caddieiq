/**
 * Centralized framer-motion presets for CaddieIQ.
 * Import these instead of writing inline animation objects.
 *
 * Usage:
 *   import { fadeIn, slideUp } from '@/lib/motion'
 *   <motion.div {...fadeIn} />
 *   <motion.div {...slideUp({ delay: 0.1 })} />
 */

import type { MotionProps, Variants } from 'framer-motion'

// ─── Easing presets ───────────────────────────────────────────────────────────
export const ease = {
  spring:   [0.34, 1.56, 0.64, 1]    as [number, number, number, number],
  smooth:   [0.4,  0,    0.2,  1]    as [number, number, number, number],
  snappy:   [0.2,  0,    0,    1]    as [number, number, number, number],
  outExpo:  [0.16, 1,    0.3,  1]    as [number, number, number, number],
} as const

// ─── Duration presets (seconds) ───────────────────────────────────────────────
export const duration = {
  instant: 0.08,
  fast:    0.14,
  normal:  0.20,
  slow:    0.30,
  slower:  0.40,
  page:    0.25,
} as const

// ─── Simple animations (spread onto motion elements) ─────────────────────────
export const fadeIn: MotionProps = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit:    { opacity: 0 },
  transition: { duration: duration.normal, ease: ease.smooth },
}

export const fadeOut: MotionProps = {
  initial: { opacity: 1 },
  animate: { opacity: 0 },
  transition: { duration: duration.fast, ease: ease.smooth },
}

// ─── Factory animations (accept options) ─────────────────────────────────────
export function slideUp(opts?: { delay?: number; distance?: number }): MotionProps {
  const d = opts?.distance ?? 8
  const delay = opts?.delay ?? 0
  return {
    initial: { opacity: 0, y: d },
    animate: { opacity: 1, y: 0 },
    exit:    { opacity: 0, y: d / 2 },
    transition: { duration: duration.normal, ease: ease.outExpo, delay },
  }
}

export function slideDown(opts?: { delay?: number; distance?: number }): MotionProps {
  const d = opts?.distance ?? 8
  const delay = opts?.delay ?? 0
  return {
    initial: { opacity: 0, y: -d },
    animate: { opacity: 1, y: 0 },
    exit:    { opacity: 0, y: -d / 2 },
    transition: { duration: duration.normal, ease: ease.outExpo, delay },
  }
}

export function slideRight(opts?: { delay?: number; distance?: number }): MotionProps {
  const d = opts?.distance ?? 16
  const delay = opts?.delay ?? 0
  return {
    initial: { opacity: 0, x: -d },
    animate: { opacity: 1, x: 0 },
    exit:    { opacity: 0, x: -d / 2 },
    transition: { duration: duration.normal, ease: ease.outExpo, delay },
  }
}

export function scaleIn(opts?: { delay?: number }): MotionProps {
  return {
    initial: { opacity: 0, scale: 0.94 },
    animate: { opacity: 1, scale: 1 },
    exit:    { opacity: 0, scale: 0.96 },
    transition: { duration: duration.normal, ease: ease.spring, delay: opts?.delay ?? 0 },
  }
}

export function pageTransition(): MotionProps {
  return {
    initial: { opacity: 0, y: 6, scale: 0.995 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit:    { opacity: 0, y: -4, scale: 0.998 },
    transition: { duration: duration.page, ease: ease.outExpo },
  }
}

// ─── Stagger container variants ───────────────────────────────────────────────
export function staggerContainer(opts?: { stagger?: number; delay?: number }): Variants {
  return {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: opts?.stagger ?? 0.06,
        delayChildren:   opts?.delay   ?? 0,
      },
    },
  }
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  show:   {
    opacity: 1,
    y: 0,
    transition: { duration: duration.normal, ease: ease.outExpo },
  },
}

// ─── Overlay / Drawer / Modal ─────────────────────────────────────────────────
export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: duration.normal, ease: ease.smooth } },
  exit:   { opacity: 0, transition: { duration: duration.fast,   ease: ease.smooth } },
}

export const drawerVariants: Variants = {
  hidden: { x: '-100%', opacity: 0 },
  show:   { x: 0, opacity: 1, transition: { duration: duration.slow, ease: ease.outExpo } },
  exit:   { x: '-100%', opacity: 0, transition: { duration: duration.normal, ease: ease.snappy } },
}

export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  show:   { opacity: 1, scale: 1, y: 0, transition: { duration: duration.normal, ease: ease.spring } },
  exit:   { opacity: 0, scale: 0.97, y: 4, transition: { duration: duration.fast, ease: ease.smooth } },
}

export const dropdownVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: -4 },
  show:   { opacity: 1, scale: 1, y: 0, transition: { duration: duration.fast, ease: ease.spring } },
  exit:   { opacity: 0, scale: 0.97, y: -2, transition: { duration: duration.instant, ease: ease.smooth } },
}

export const sidebarVariants: Variants = {
  hidden: { x: -8, opacity: 0 },
  show:   { x: 0, opacity: 1, transition: { duration: duration.normal, ease: ease.outExpo } },
}

// ─── Hover / Press helpers (for whileHover / whileTap) ───────────────────────
export const hoverScale = { scale: 1.02, transition: { duration: duration.fast, ease: ease.smooth } }
export const pressScale  = { scale: 0.97, transition: { duration: duration.instant, ease: ease.smooth } }
export const hoverLift   = { y: -1, transition: { duration: duration.fast, ease: ease.smooth } }
