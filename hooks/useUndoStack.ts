/**
 * 深さ制限付きの Undo スタック。
 * テキストと差分結果をセットで保持し、操作の巻き戻しを可能にする。
 */

"use client"

import { useState, useCallback } from "react"
import type { DiffResult, WordMode, IgnoreOptions } from "@/lib/types"
import { UNDO_MAX_DEPTH } from "@/lib/constants"

/** Undo 1 回分の状態。テキスト・差分結果・比較時オプションを保持する */
export interface UndoState {
  textA: string
  textB: string
  result: DiffResult | null
  resultVersion: number
  lastComparedOptions: { wordMode: WordMode; ignoreOptions: IgnoreOptions } | null
}

export function useUndoStack() {
  const [stack, setStack] = useState<UndoState[]>([])

  const push = useCallback((state: UndoState) => {
    setStack((prev) => [...prev, state].slice(-UNDO_MAX_DEPTH))
  }, [])

  // updater 関数内で最新のスタックにアクセスしつつ、
  // popped を外側に返すために変数キャプチャを利用している
  const pop = useCallback((): UndoState | null => {
    let popped: UndoState | null = null
    setStack((prev) => {
      if (prev.length === 0) return prev
      popped = prev[prev.length - 1]
      return prev.slice(0, -1)
    })
    return popped
  }, [])

  return { push, pop, canUndo: stack.length > 0 }
}
