"use client"

import { useState, useCallback } from "react"
import { Copy, Check } from "lucide-react"
import type { DiffCellModel, DiffSegment, DiffToken } from "@/lib/types"

function replaceTrailingSpaces(tokens: DiffToken[]): DiffToken[] {
  const result = [...tokens]
  for (let i = result.length - 1; i >= 0; i--) {
    if (result[i].value === " ") {
      result[i] = { ...result[i], value: "\u00A0" }
    } else {
      break
    }
  }
  return result
}

function renderSegment(segment: DiffSegment, segIndex: number, isHighlightSide: boolean) {
  const isHighlight = isHighlightSide && (segment.type === "delete" || segment.type === "insert")
  const tokens = isHighlight ? replaceTrailingSpaces(segment.tokens) : segment.tokens
  const text = tokens.map((t) => t.value).join("")

  if (isHighlight) {
    return (
      <span key={segIndex} className="diff-highlight">
        {text}
      </span>
    )
  }
  return <span key={segIndex}>{text}</span>
}

function getCellText(cell: DiffCellModel): string {
  return cell.segments.flatMap((s) => s.tokens.map((t) => t.value)).join("")
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [text])

  if (!text) return null

  return (
    <button type="button" className="diff-copy-btn" onClick={handleCopy} aria-label="行をコピー">
      {copied ? (
        <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </button>
  )
}

function renderCell(cell: DiffCellModel, side: "a" | "b") {
  return cell.segments.map((seg, i) => {
    const shouldHighlight =
      (side === "a" && seg.type === "delete") || (side === "b" && seg.type === "insert")
    return renderSegment(seg, i, shouldHighlight)
  })
}

interface DiffRowProps {
  a: DiffCellModel
  b: DiffCellModel
  lineA?: number
  lineB?: number
  rowIndex: number
  changed?: boolean
  highlighted?: boolean
}

export function DiffRow({ a, b, lineA, lineB, rowIndex, changed, highlighted }: DiffRowProps) {
  const paddingA = lineA === undefined
  const paddingB = lineB === undefined

  return (
    <div
      className={`diff-row${highlighted ? " diff-row-highlighted" : ""}`}
      {...(changed ? { "data-diff-changed": rowIndex } : {})}
    >
      <div className={`diff-cell diff-cell-a${paddingA ? " diff-cell-empty" : ""}`}>
        <span className="diff-line-num">{lineA ?? ""}</span>
        <span className="diff-cell-content">{renderCell(a, "a")}</span>
        {!paddingA && <CopyButton text={getCellText(a)} />}
      </div>
      <div className={`diff-cell diff-cell-b${paddingB ? " diff-cell-empty" : ""}`}>
        <span className="diff-line-num">{lineB ?? ""}</span>
        <span className="diff-cell-content">{renderCell(b, "b")}</span>
        {!paddingB && <CopyButton text={getCellText(b)} />}
      </div>
    </div>
  )
}
