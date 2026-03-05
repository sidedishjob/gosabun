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
    <div className="rounded border p-3 text-sm font-mono bg-muted/50">
      <div className="font-bold mb-1">{label}</div>
      <div>文字数: {stats.charCount}</div>
      <div>
        空白数: {spaceCount}　空白込み文字数: {stats.charWithSpace}
      </div>
      <div>
        改行数: {newlineCount}　改行込み文字数: {stats.charWithNewline}
      </div>
      <div>単語数: {stats.wordCount}</div>
    </div>
  )
}
