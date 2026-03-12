"use client"

import { useState, useCallback } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InputPanel } from "@/components/InputPanel"
import { OptionsBar } from "@/components/OptionsBar"
import { DiffViewer } from "@/components/DiffViewer"
import { StatsRow } from "@/components/StatsRow"
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

  const { result, setResult, resultVersion, setResultVersion, handleCompare } = useDiffCompare(
    textA,
    textB,
    wordMode,
    ignoreOptions
  )

  const diffSnapshot = { result, resultVersion }

  const handleUndo = useCallback(() => {
    const state = restoreFromUndo()
    if (!state) return
    setResult(state.result)
    setResultVersion(state.resultVersion)
  }, [restoreFromUndo, setResult, setResultVersion])

  useKeyboardShortcuts({
    onCompare: handleCompare,
    onUndo: handleUndo,
  })

  const handleColorModeChange = useCallback((mode: ColorMode) => {
    setColorMode(mode)
    document.documentElement.classList.toggle("dark", mode === "dark")
  }, [])

  const handleThemeChange = useCallback((t: Theme) => {
    setTheme(t)
    document.documentElement.setAttribute("data-theme", t)
  }, [])

  return (
    <div>
      <div className="mx-auto max-w-6xl px-4 py-4 md:py-6">
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
            onCompare={handleCompare}
            onClear={() => {
              handleClearAll(diffSnapshot)
              setResult(null)
            }}
          />

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

          {result && (
            <>
              <DiffViewer key={resultVersion} result={result} displayMode={displayMode} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <StatsRow label="テキスト A" stats={result.statsA} />
                <StatsRow label="テキスト B" stats={result.statsB} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
