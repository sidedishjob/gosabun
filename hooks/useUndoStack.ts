"use client"

import { useState, useCallback } from "react"
import type { DiffResult } from "@/lib/types"

export interface UndoState {
  textA: string
  textB: string
  result: DiffResult | null
  resultVersion: number
}

const MAX_DEPTH = 10

export function useUndoStack() {
  const [stack, setStack] = useState<UndoState[]>([])

  const push = useCallback((state: UndoState) => {
    setStack((prev) => [...prev, state].slice(-MAX_DEPTH))
  }, [])

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
