"use client"

import { useState, useCallback } from "react"
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

  const canCompare =
    textA.length > 0 &&
    textB.length > 0 &&
    textA.length <= MAX_TEXT_LENGTH &&
    textB.length <= MAX_TEXT_LENGTH

  const handleCompare = useCallback(() => {
    if (!canCompare) return
    const r = computeDiff(textA, textB, wordMode, ignoreOptions)
    setResult(r)
    setResultVersion((v) => v + 1)
  }, [textA, textB, wordMode, ignoreOptions, canCompare])

  return {
    result,
    setResult,
    resultVersion,
    setResultVersion,
    canCompare,
    handleCompare,
  }
}
