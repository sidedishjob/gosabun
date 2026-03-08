"use client"

import { useState, useMemo, useCallback, useRef } from "react"
import type { DiffResult, DiffRowModel, DiffDisplayMode } from "@/lib/types"
import { DiffRow } from "./DiffRow"

function hasChange(row: DiffRowModel): boolean {
  return (
    row.a.segments.some((s) => s.type === "delete" || s.type === "insert") ||
    row.b.segments.some((s) => s.type === "delete" || s.type === "insert")
  )
}

interface DiffViewerProps {
  result: DiffResult
  displayMode: DiffDisplayMode
}

export function DiffViewer({ result, displayMode }: DiffViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [currentChangeIdx, setCurrentChangeIdx] = useState(-1)

  const displayRows = useMemo(
    () =>
      displayMode === "diff-only"
        ? result.rows
            .map((row, i) => ({ row, originalIndex: i }))
            .filter(({ row }) => hasChange(row))
        : result.rows.map((row, i) => ({ row, originalIndex: i })),
    [result.rows, displayMode]
  )

  const changeIndices = useMemo(
    () =>
      displayRows.reduce<number[]>((acc, { row }, i) => (hasChange(row) ? [...acc, i] : acc), []),
    [displayRows]
  )

  const scrollToRow = useCallback(
    (changeIdx: number) => {
      if (!containerRef.current || changeIdx < 0 || changeIdx >= changeIndices.length) return
      const displayIdx = changeIndices[changeIdx]
      const rows = containerRef.current.querySelectorAll<HTMLElement>("[data-diff-changed]")
      const target = Array.from(rows).find(
        (el) => el.dataset.diffChanged === String(displayRows[displayIdx].originalIndex)
      )
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" })
        setCurrentChangeIdx(changeIdx)
      }
    },
    [changeIndices, displayRows]
  )

  const handlePrev = useCallback(() => {
    if (changeIndices.length === 0) return
    const next = currentChangeIdx <= 0 ? changeIndices.length - 1 : currentChangeIdx - 1
    scrollToRow(next)
  }, [changeIndices.length, currentChangeIdx, scrollToRow])

  const handleNext = useCallback(() => {
    if (changeIndices.length === 0) return
    const next = currentChangeIdx >= changeIndices.length - 1 ? 0 : currentChangeIdx + 1
    scrollToRow(next)
  }, [changeIndices.length, currentChangeIdx, scrollToRow])

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

  if (changeIndices.length === 0) {
    return (
      <div className="rounded border p-8 text-center text-sm text-muted-foreground">
        差分はありません
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {changeIndices.length > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">
            変更箇所: {currentChangeIdx >= 0 ? currentChangeIdx + 1 : "-"} / {changeIndices.length}
          </span>
          <button
            type="button"
            onClick={handlePrev}
            className="inline-flex items-center justify-center rounded border px-2 py-0.5 hover:bg-muted transition-colors"
            aria-label="前の変更箇所"
          >
            ▲
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center justify-center rounded border px-2 py-0.5 hover:bg-muted transition-colors"
            aria-label="次の変更箇所"
          >
            ▼
          </button>
        </div>
      )}
      <div ref={containerRef} className="diff-viewer overflow-x-auto rounded border">
        {displayRows.map(({ row, originalIndex }, i) => (
          <DiffRow
            key={originalIndex}
            a={row.a}
            b={row.b}
            lineA={row.lineA}
            lineB={row.lineB}
            rowIndex={originalIndex}
            changed={changeIndices.includes(i)}
            highlighted={currentChangeIdx >= 0 && changeIndices[currentChangeIdx] === i}
          />
        ))}
      </div>
    </div>
  )
}
