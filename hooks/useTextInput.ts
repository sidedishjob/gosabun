/**
 * テキスト A/B の入力状態と操作（入れ替え・クリア）を管理するフック。
 * Undo スタックと統合し、操作前の状態を自動保存する。
 */

"use client"

import { useState, useCallback } from "react"
import { useUndoStack, type UndoState } from "@/hooks/useUndoStack"
import { SAMPLE_A, SAMPLE_B } from "@/lib/sample-data"
import type { DiffResult, WordMode, IgnoreOptions } from "@/lib/types"

/**
 * Undo 復元時に差分結果も巻き戻すために保持するスナップショット。
 * 各操作ハンドラが呼び出し側から受け取り、Undo スタックに一緒に積む。
 */
interface DiffSnapshot {
  result: DiffResult | null
  resultVersion: number
  lastComparedOptions: { wordMode: WordMode; ignoreOptions: IgnoreOptions } | null
}

export function useTextInput() {
  const [textA, setTextA] = useState(SAMPLE_A)
  const [textB, setTextB] = useState(SAMPLE_B)
  const undoStack = useUndoStack()

  const handleSwap = useCallback(
    (snapshot: DiffSnapshot) => {
      undoStack.push({ textA, textB, ...snapshot })
      setTextA(textB)
      setTextB(textA)
    },
    [textA, textB, undoStack]
  )

  const handleClearA = useCallback(
    (snapshot: DiffSnapshot) => {
      undoStack.push({ textA, textB, ...snapshot })
      setTextA("")
    },
    [textA, textB, undoStack]
  )

  const handleClearB = useCallback(
    (snapshot: DiffSnapshot) => {
      undoStack.push({ textA, textB, ...snapshot })
      setTextB("")
    },
    [textA, textB, undoStack]
  )

  const handleClearAll = useCallback(
    (snapshot: DiffSnapshot) => {
      undoStack.push({ textA, textB, ...snapshot })
      setTextA("")
      setTextB("")
    },
    [textA, textB, undoStack]
  )

  const restoreFromUndo = useCallback((): UndoState | null => {
    const state = undoStack.pop()
    if (!state) return null
    setTextA(state.textA)
    setTextB(state.textB)
    return state
  }, [undoStack])

  return {
    textA,
    textB,
    setTextA,
    setTextB,
    undoStack,
    handleSwap,
    handleClearA,
    handleClearB,
    handleClearAll,
    restoreFromUndo,
  }
}
