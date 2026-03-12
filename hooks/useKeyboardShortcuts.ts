"use client"

import { useRef, useEffect } from "react"

interface KeyboardShortcutHandlers {
  onCompare: () => void
  onUndo: () => void
}

export function useKeyboardShortcuts({ onCompare, onUndo }: KeyboardShortcutHandlers) {
  const compareRef = useRef(onCompare)
  const undoRef = useRef(onUndo)

  useEffect(() => {
    compareRef.current = onCompare
    undoRef.current = onUndo
  })

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault()
        compareRef.current()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        const tag = (e.target as HTMLElement)?.tagName
        if (tag === "TEXTAREA" || tag === "INPUT") return
        e.preventDefault()
        undoRef.current()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])
}
