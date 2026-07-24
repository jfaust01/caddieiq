import type { ReactNode } from "react"

import Image from "next/image"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { siteConfig } from "@/constants/site"

interface AuthCardProps {
  title: string
  description: string
  children: ReactNode
}

export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-surface px-4 py-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Image
            src="/caddieiq-logo.png"
            alt={`${siteConfig.name} logo`}
            width={64}
            height={64}
            priority
            className="size-16"
          />
          <div className="flex flex-col gap-0.5">
            <span className="text-lg font-semibold tracking-tight">
              {siteConfig.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {siteConfig.tagline}
            </span>
          </div>
        </div>

        <Card className="[--card-spacing:--spacing(6)]">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-balance">{title}</CardTitle>
            <CardDescription className="text-pretty">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </main>
  )
}
