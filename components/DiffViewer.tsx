/**
 * 差分結果をサイドバイサイドで表示するコンポーネント。
 * 変更箇所間の前後ナビゲーション（循環）と表示モード切り替えを提供する。
 */

"use client"

import { useState, useMemo, useCallback, useRef } from "react"
import { ChevronUp, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { DiffResult, DiffRowModel, DiffDisplayMode } from "@/lib/types"
import { DiffRow } from "./DiffRow"

/** 行に差分（delete / insert）が含まれるかを判定する */
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

  // displayMode に応じて全行 or 差分行のみにフィルタする。
  // originalIndex は DiffRow の key とスクロールターゲットに使用する。
  const displayRows = useMemo(
    () =>
      displayMode === "diff-only"
        ? result.rows
            .map((row, i) => ({ row, originalIndex: i }))
            .filter(({ row }) => hasChange(row))
        : result.rows.map((row, i) => ({ row, originalIndex: i })),
    [result.rows, displayMode]
  )

  // displayRows 内で変更がある行のインデックス一覧（ナビゲーション用）
  const changeIndices = useMemo(
    () =>
      displayRows.reduce<number[]>((acc, { row }, i) => (hasChange(row) ? [...acc, i] : acc), []),
    [displayRows]
  )

  /** 指定した変更箇所インデックスの行までスクロールする */
  const scrollToRow = useCallback(
    (changeIdx: number) => {
      if (!containerRef.current || changeIdx < 0 || changeIdx >= changeIndices.length) return
      const displayIdx = changeIndices[changeIdx]
      const target = containerRef.current.querySelector<HTMLElement>(
        `[data-diff-changed="${displayRows[displayIdx].originalIndex}"]`
      )
      if (target) {
        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        target.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "center",
        })
        setCurrentChangeIdx(changeIdx)
      }
    },
    [changeIndices, displayRows]
  )

  // 循環ナビゲーション: 先頭で「前へ」→ 末尾、末尾で「次へ」→ 先頭
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
      <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-destructive text-sm">
        テキストが200,000文字を超えているため、比較できません。
      </div>
    )
  }

  if (result.rows.length === 0) {
    return null
  }

  if (changeIndices.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
        差分はありません
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div
        className="sticky z-5 flex items-center gap-1.5 bg-background py-1 text-xs text-muted-foreground"
        style={{ top: "var(--sticky-bar-height, 2.5rem)" }}
      >
        <span className="tabular-nums" aria-live="polite" aria-atomic="true">
          {currentChangeIdx >= 0 ? currentChangeIdx + 1 : "-"} / {changeIndices.length} 件
        </span>
        <Button variant="outline" size="icon-xs" onClick={handlePrev} aria-label="前の変更箇所">
          <ChevronUp className="h-3.5 w-3.5" />
        </Button>
        <Button variant="outline" size="icon-xs" onClick={handleNext} aria-label="次の変更箇所">
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div ref={containerRef} className="diff-viewer overflow-x-auto rounded-md border">
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
