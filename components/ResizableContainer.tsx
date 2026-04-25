/**
 * コンテナ幅を右端のハンドルでドラッグ可能にするラッパー。
 * 下限は初期値（max-w-6xl = 1152px）、上限はビューポート幅に制限する。
 * md 未満ではハンドル非表示・初期幅で固定する。
 */

"use client"

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react"
import { GripVertical, Maximize2, Minimize2 } from "lucide-react"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const MIN_WIDTH_PX = 1152
const VIEWPORT_PADDING_PX = 32
const DESKTOP_MEDIA_QUERY = "(min-width: 768px)"

function subscribeDesktopMq(callback: () => void) {
  const mq = window.matchMedia(DESKTOP_MEDIA_QUERY)
  mq.addEventListener("change", callback)
  return () => mq.removeEventListener("change", callback)
}

function getDesktopMqSnapshot() {
  return window.matchMedia(DESKTOP_MEDIA_QUERY).matches
}

function getDesktopMqServerSnapshot() {
  return false
}

function subscribeViewportWidth(callback: () => void) {
  window.addEventListener("resize", callback)
  return () => window.removeEventListener("resize", callback)
}

function getViewportWidthSnapshot() {
  return window.innerWidth
}

function getViewportWidthServerSnapshot() {
  return 0
}

interface ResizableContainerProps {
  children: React.ReactNode
  className?: string
}

export function ResizableContainer({ children, className }: ResizableContainerProps) {
  const isDesktop = useSyncExternalStore(
    subscribeDesktopMq,
    getDesktopMqSnapshot,
    getDesktopMqServerSnapshot
  )
  const viewportWidth = useSyncExternalStore(
    subscribeViewportWidth,
    getViewportWidthSnapshot,
    getViewportWidthServerSnapshot
  )
  const [width, setWidth] = useState<number | null>(null)
  const draggingRef = useRef(false)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!draggingRef.current) return
    // コンテナは中央寄せのため、右端を dx 動かすと左端も同じだけ動く → 幅は 2 * dx 増える
    const next = startWidthRef.current + (e.clientX - startXRef.current) * 2
    const max = Math.max(MIN_WIDTH_PX, window.innerWidth - VIEWPORT_PADDING_PX)
    setWidth(Math.min(Math.max(next, MIN_WIDTH_PX), max))
  }, [])

  const stopDragging = useCallback(() => {
    if (!draggingRef.current) return
    draggingRef.current = false
    document.body.style.userSelect = ""
    document.body.style.cursor = ""
  }, [])

  useEffect(() => {
    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", stopDragging)
    window.addEventListener("pointercancel", stopDragging)
    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", stopDragging)
      window.removeEventListener("pointercancel", stopDragging)
      // ドラッグ中にアンマウントされた場合、body のインラインスタイルが残置されるのを防ぐ
      stopDragging()
    }
  }, [handlePointerMove, stopDragging])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!isDesktop) return
      e.preventDefault()
      draggingRef.current = true
      startXRef.current = e.clientX
      startWidthRef.current = width ?? MIN_WIDTH_PX
      document.body.style.userSelect = "none"
      document.body.style.cursor = "col-resize"
    },
    [isDesktop, width]
  )

  const isExpanded = width !== null && width > MIN_WIDTH_PX

  const toggleExpanded = useCallback(() => {
    if (isExpanded) {
      setWidth(null)
      return
    }
    const max = Math.max(MIN_WIDTH_PX, window.innerWidth - VIEWPORT_PADDING_PX)
    setWidth(max)
  }, [isExpanded])

  const style = isDesktop && width !== null ? { maxWidth: `${width}px` } : undefined

  // ハンドルはコンテナ右端（中央寄せ）に位置するよう、ビューポート右端からのオフセットを算出する
  const containerWidth = Math.min(viewportWidth, width ?? MIN_WIDTH_PX)
  const rightOffset = Math.max(0, (viewportWidth - containerWidth) / 2)
  const showHandle = isDesktop && viewportWidth > 0

  return (
    <>
      <div className={cn("relative mx-auto max-w-6xl px-4 py-4 md:py-6", className)} style={style}>
        {children}
      </div>
      {showHandle && (
        <div
          className="pointer-events-none fixed inset-y-0 z-10"
          style={{ right: `${rightOffset}px` }}
        >
          {/* 右端の常時可視な縦線 */}
          <div aria-hidden className="absolute inset-y-0 right-0 w-px bg-border" />
          {/* トグル + グリップ（縦中央に固定表示） */}
          <div className="absolute right-0 top-1/2 flex -translate-y-1/2 translate-x-1/2 flex-col items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={toggleExpanded}
                  aria-label={isExpanded ? "コンテナ幅を初期値に戻す" : "コンテナ幅を最大化"}
                  aria-pressed={isExpanded}
                  className="pointer-events-auto flex h-7 w-5 items-center justify-center rounded-full border bg-background shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {isExpanded ? (
                    <Minimize2 className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <Maximize2 className="h-3 w-3 text-muted-foreground" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="left">{isExpanded ? "最小化" : "最大化"}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  role="separator"
                  aria-orientation="vertical"
                  aria-label="コンテナ幅を変更"
                  onPointerDown={handlePointerDown}
                  className="pointer-events-auto flex h-12 w-5 cursor-col-resize touch-none items-center justify-center rounded-full border bg-background shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="left">ドラッグして幅を変更</TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}
    </>
  )
}
