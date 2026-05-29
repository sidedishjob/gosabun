/**
 * gosabun のメインページ。
 * テキスト入力・比較オプション・差分表示・統計の全体を統合する。
 * 各機能はカスタムフック（useTextInput / useDiffCompare / useKeyboardShortcuts）に
 * 委譲し、このコンポーネントは状態のオーケストレーションとレイアウトを担う。
 */

"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InputPanel } from "@/components/InputPanel"
import { OptionsBar } from "@/components/OptionsBar"
import { DiffViewer } from "@/components/DiffViewer"
import { StatsRow } from "@/components/StatsRow"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { ScrollToTopButton } from "@/components/ScrollToTopButton"
import { ResizableContainer } from "@/components/ResizableContainer"
import { useTextInput } from "@/hooks/useTextInput"
import { useDiffCompare } from "@/hooks/useDiffCompare"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import type { WordMode, Theme, DiffDisplayMode, IgnoreOptions, ColorMode } from "@/lib/types"

export default function Home() {
  const {
    textA,
    textB,
    setTextA,
    setTextB,
    handleSwap,
    handleClearA,
    handleClearB,
    handleClearAll,
    restoreFromUndo,
  } = useTextInput()

  const [wordMode, setWordMode] = useState<WordMode>("word")
  const [theme, setTheme] = useState<Theme>("color1")
  const [displayMode, setDisplayMode] = useState<DiffDisplayMode>("all")
  const [ignoreOptions, setIgnoreOptions] = useState<IgnoreOptions>({
    ignoreTrimWhitespace: false,
  })
  const [colorMode, setColorMode] = useState<ColorMode>("light")

  const {
    result,
    setResult,
    resultVersion,
    setResultVersion,
    isComparing,
    handleCompare,
    lastComparedOptions,
    setLastComparedOptions,
  } = useDiffCompare(textA, textB, wordMode, ignoreOptions)

  // Undo 用に現在の差分状態をキャプチャする
  const diffSnapshot = { result, resultVersion, lastComparedOptions }

  /** Undo スタックからテキストと差分結果を復元する */
  const handleUndo = useCallback(() => {
    const state = restoreFromUndo()
    if (!state) return
    setResult(state.result)
    setResultVersion(state.resultVersion)
    setLastComparedOptions(state.lastComparedOptions)
  }, [restoreFromUndo, setResult, setResultVersion, setLastComparedOptions])

  const handleClear = () => {
    if (textA.length === 0 && textB.length === 0) return
    handleClearAll(diffSnapshot)
    setResult(null)
  }

  useKeyboardShortcuts({
    onCompare: handleCompare,
    onUndo: handleUndo,
    onClear: handleClear,
  })

  /** Tailwind CSS のダークモードクラスを document に切り替える */
  const handleColorModeChange = useCallback((mode: ColorMode) => {
    setColorMode(mode)
    document.documentElement.classList.toggle("dark", mode === "dark")
  }, [])

  /** data-theme 属性で差分ハイライトの配色を切り替える */
  const handleThemeChange = useCallback((t: Theme) => {
    setTheme(t)
    document.documentElement.setAttribute("data-theme", t)
  }, [])

  // OptionsBar ラッパーの高さを計測し CSS 変数に反映
  const optionsBarRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = optionsBarRef.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      document.documentElement.style.setProperty("--sticky-bar-height", `${el.offsetHeight}px`)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // 比較完了時、差分ナビゲーションバーが sticky 位置（OptionsBar 直下）に来るまで
  // ページをスクロールし、初回クリックからバーの位置が変わらないようにする。
  // Undo（resultVersion を過去値に戻す操作）では発火させない。
  const diffViewerRef = useRef<HTMLDivElement>(null)
  const prevResultVersionRef = useRef(resultVersion)
  useEffect(() => {
    const prev = prevResultVersionRef.current
    prevResultVersionRef.current = resultVersion
    if (resultVersion <= prev) return
    if (!result) return
    const el = diffViewerRef.current
    if (!el) return

    const stickyTopRaw = getComputedStyle(document.documentElement).getPropertyValue(
      "--sticky-bar-height"
    )
    const stickyTop = parseFloat(stickyTopRaw) || 40
    const targetY = el.getBoundingClientRect().top + window.scrollY - stickyTop
    if (window.scrollY >= targetY) return

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    window.scrollTo({ top: targetY, behavior: prefersReducedMotion ? "auto" : "smooth" })
  }, [resultVersion, result])

  return (
    <div>
      <ResizableContainer>
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight">gosabun</h1>
            <p className="text-xs text-muted-foreground">テキスト差分比較</p>
          </div>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => handleColorModeChange(colorMode === "light" ? "dark" : "light")}
            aria-label={colorMode === "light" ? "ダークモードに切替" : "ライトモードに切替"}
          >
            {colorMode === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
        </header>

        <div className="space-y-4">
          <InputPanel
            textA={textA}
            textB={textB}
            onChangeA={setTextA}
            onChangeB={setTextB}
            onClearA={() => handleClearA(diffSnapshot)}
            onClearB={() => handleClearB(diffSnapshot)}
            onSwap={() => handleSwap(diffSnapshot)}
            isComparing={isComparing}
            onCompare={handleCompare}
            onClear={handleClear}
          />

          <div
            ref={optionsBarRef}
            className="sticky top-0 z-10 flex flex-wrap items-center gap-x-4 gap-y-2 bg-background pt-2 pb-2"
          >
            <OptionsBar
              wordMode={wordMode}
              theme={theme}
              displayMode={displayMode}
              ignoreOptions={ignoreOptions}
              onWordModeChange={setWordMode}
              onThemeChange={handleThemeChange}
              onDisplayModeChange={setDisplayMode}
              onIgnoreOptionsChange={setIgnoreOptions}
            />
          </div>

          {result && (
            <ErrorBoundary>
              <div ref={diffViewerRef}>
                <DiffViewer key={resultVersion} result={result} displayMode={displayMode} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <StatsRow label="テキスト A" stats={result.statsA} />
                <StatsRow label="テキスト B" stats={result.statsB} />
              </div>
            </ErrorBoundary>
          )}
        </div>
      </ResizableContainer>

      <ScrollToTopButton />
    </div>
  )
}
