"use client"

import type { DiffResult } from "@/lib/types"
import { DiffRow } from "./DiffRow"

interface DiffViewerProps {
  result: DiffResult
}

export function DiffViewer({ result }: DiffViewerProps) {
  if (result.truncated) {
    return (
      <div className="rounded border border-destructive bg-destructive/10 p-4 text-destructive text-sm">
        テキストが200,000文字を超えているため、比較できません。
      </div>
    )
  }

  if (result.rows.length === 0) {
    return null
  }

  return (
    <div className="diff-viewer overflow-x-auto rounded border">
      {result.rows.map((row, i) => (
        <DiffRow key={i} a={row.a} b={row.b} rowIndex={i} />
      ))}
    </div>
  )
}
