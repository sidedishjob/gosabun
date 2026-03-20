/**
 * テキストの文字数・空白数・改行数・語数を表示する統計行コンポーネント。
 */

"use client"

import type { DiffStats } from "@/lib/types"

interface StatsRowProps {
  label: string
  stats: DiffStats
}

export function StatsRow({ label, stats }: StatsRowProps) {
  // charWithSpace（改行除く全文字）- charCount（空白除く文字）= 空白数
  const spaceCount = stats.charWithSpace - stats.charCount
  // charWithNewline（全文字）- charWithSpace（改行除く）= 改行数
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
