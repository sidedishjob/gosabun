/**
 * テキスト A/B の入力状態と操作（入れ替え・クリア）を管理するフック。
 * Undo スタックと統合し、操作前の状態を自動保存する。
 */

"use client"

import { useState, useCallback } from "react"
import { useUndoStack, type UndoState } from "@/hooks/useUndoStack"
import type { DiffResult, WordMode, IgnoreOptions } from "@/lib/types"

/** 初期表示用サンプルテキスト A */
const SAMPLE_A = `探偵の田中は、深夜12時に依頼人から電話を受けた。
「ダイヤモンドが消えた」と声は震えていた。
現場はNewYorkの高級ホテル、MacDonald Suiteの305号室。
The suspect left no fingerprints at the scene.
部屋には不審な足跡と、半分飲まれたワインが残されていた。
金庫は無傷のまま、窓だけが開け放たれていた。
The quick brown fox jumps over the lazy dog.
田中は静かにメモを取りながら、容疑者を絞り込んでいった。
容疑者リスト: 3名
この行はオリジナルにのみ存在する。`

/** 初期表示用サンプルテキスト B */
const SAMPLE_B = `探偵の鈴木は、深夜12時に依頼人から電話を受けた。
「エメラルドが消えた」と声は震えていた。
現場はNewJerseyの高級ホテル、MacArthur Suiteの305号室。
The Suspect left no Fingerprints at the scene.
部屋には不審な足跡と、半分飲まれたワインが残されていた。
  金庫は無傷のまま、窓だけが開け放たれていた。
The quick brown cat jumps over the lazy　dog.
鈴木は静かにメモを取りながら、容疑者 を絞り込んでいった。

容疑者リスト： 5名
この行は改訂版にのみ存在する。`

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
