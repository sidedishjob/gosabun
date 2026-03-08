"use client"

import type { DiffStats } from "@/lib/types"

interface StatsRowProps {
  label: string
  stats: DiffStats
}

export function StatsRow({ label, stats }: StatsRowProps) {
  const spaceCount = stats.charWithSpace - stats.charCount
  const newlineCount = stats.charWithNewline - stats.charWithSpace

  return (
    <div className="rounded-md border p-2.5 text-xs font-mono bg-muted/30">
      <span className="font-semibold">{label}</span>
      <span className="mx-2 text-muted-foreground/40">|</span>
      <span className="text-muted-foreground">
        {stats.charCount}字<span className="mx-1.5 text-muted-foreground/40">/</span>
        空白{spaceCount}
        <span className="mx-1.5 text-muted-foreground/40">/</span>
        改行{newlineCount}
        <span className="mx-1.5 text-muted-foreground/40">/</span>
        {stats.wordCount}語
      </span>
    </div>
  )
}
