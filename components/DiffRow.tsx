"use client"

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
  rowIndex: number
}

export function DiffRow({ a, b, rowIndex }: DiffRowProps) {
  return (
    <div className="diff-row">
      <div className="diff-cell diff-cell-a">
        <span className="diff-line-num">{rowIndex + 1}</span>
        <span className="diff-cell-content">{renderCell(a, "a")}</span>
      </div>
      <div className="diff-cell diff-cell-b">
        <span className="diff-line-num">{rowIndex + 1}</span>
        <span className="diff-cell-content">{renderCell(b, "b")}</span>
      </div>
    </div>
  )
}
