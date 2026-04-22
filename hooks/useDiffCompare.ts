/**
 * 差分比較の実行を管理するフック。
 * setTimeout(…, 0) で比較をメインスレッドの描画フレーム後に
 * 遅延実行し、スピナー表示中の UI ブロッキングを回避する。
 */

"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { computeDiff } from "@/lib/diff-engine"
import { MAX_TEXT_LENGTH } from "@/lib/constants"
import type { WordMode, IgnoreOptions, DiffResult } from "@/lib/types"

/**
 * テキスト差分比較の状態と実行ロジックを提供する。
 * @returns result / isComparing / lastComparedOptions など比較関連の状態一式
 */
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

  // 比較時のオプションを記録し、変更検知に使う
  const [lastComparedOptions, setLastComparedOptions] = useState<{
    wordMode: WordMode
    ignoreOptions: IgnoreOptions
  } | null>(null)

  const canCompare =
    textA.length > 0 &&
    textB.length > 0 &&
    textA.length <= MAX_TEXT_LENGTH &&
    textB.length <= MAX_TEXT_LENGTH

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const handleCompare = useCallback(() => {
    if (!canCompare) return
    if (timerRef.current) clearTimeout(timerRef.current)

    setLastComparedOptions({ wordMode, ignoreOptions })
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

  // オプション変更後、result が既にある場合のみデバウンス付きで自動再比較する
  useEffect(() => {
    if (!result || !lastComparedOptions) return
    const changed =
      lastComparedOptions.wordMode !== wordMode ||
      lastComparedOptions.ignoreOptions.ignoreTrimWhitespace !== ignoreOptions.ignoreTrimWhitespace
    if (!changed) return
    const debounceTimer = setTimeout(() => {
      handleCompare()
    }, 250)
    return () => clearTimeout(debounceTimer)
  }, [wordMode, ignoreOptions, result, lastComparedOptions, handleCompare])

  return {
    result,
    setResult,
    resultVersion,
    setResultVersion,
    isComparing,
    canCompare,
    handleCompare,
    lastComparedOptions,
    setLastComparedOptions,
  }
}
