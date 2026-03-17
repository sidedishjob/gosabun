"use client"

import { useState, useCallback, useRef } from "react"
import { computeDiff } from "@/lib/diff-engine"
import { MAX_TEXT_LENGTH } from "@/lib/constants"
import type { WordMode, IgnoreOptions, DiffResult } from "@/lib/types"

export function useDiffCompare(
  textA: string,
  textB: string,
  wordMode: WordMode,
  ignoreOptions: IgnoreOptions
) {
  const [result, setResult] = useState<DiffResult | null>(null)
  const [resultVersion, setResultVersion] = useState(0)
  const [isComparing, setIsComparing] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const canCompare =
    textA.length > 0 &&
    textB.length > 0 &&
    textA.length <= MAX_TEXT_LENGTH &&
    textB.length <= MAX_TEXT_LENGTH

  const handleCompare = useCallback(() => {
    if (!canCompare) return
    if (timerRef.current) clearTimeout(timerRef.current)

    setIsComparing(true)
    // ブラウザに描画を譲ってからスピナーを表示し、その後に同期実行
    timerRef.current = setTimeout(() => {
      const r = computeDiff(textA, textB, wordMode, ignoreOptions)
      setResult(r)
      setResultVersion((v) => v + 1)
      setIsComparing(false)
      timerRef.current = null
    }, 0)
  }, [textA, textB, wordMode, ignoreOptions, canCompare])

  return {
    result,
    setResult,
    resultVersion,
    setResultVersion,
    isComparing,
    canCompare,
    handleCompare,
  }
}
