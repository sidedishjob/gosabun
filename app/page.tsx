"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Moon, Sun } from "lucide-react"
import { InputPanel } from "@/components/InputPanel"
import { OptionsBar } from "@/components/OptionsBar"
import { DiffViewer } from "@/components/DiffViewer"
import { StatsRow } from "@/components/StatsRow"
import { computeDiff } from "@/lib/diff-engine"
import { useUndoStack } from "@/hooks/useUndoStack"
import { MAX_TEXT_LENGTH } from "@/lib/constants"
import type {
  WordMode,
  Theme,
  DiffDisplayMode,
  DiffResult,
  IgnoreOptions,
  ColorMode,
} from "@/lib/types"

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

export default function Home() {
  const [textA, setTextA] = useState(SAMPLE_A)
  const [textB, setTextB] = useState(SAMPLE_B)
  const [wordMode, setWordMode] = useState<WordMode>("word")
  const [theme, setTheme] = useState<Theme>("color1")
  const [displayMode, setDisplayMode] = useState<DiffDisplayMode>("all")
  const [ignoreOptions, setIgnoreOptions] = useState<IgnoreOptions>({
    ignoreTrimWhitespace: false,
  })
  const [colorMode, setColorMode] = useState<ColorMode>("light")
  const [result, setResult] = useState<DiffResult | null>(null)
  const [resultVersion, setResultVersion] = useState(0)
  const undoStack = useUndoStack()

  const handleColorModeChange = useCallback((mode: ColorMode) => {
    setColorMode(mode)
    document.documentElement.classList.toggle("dark", mode === "dark")
  }, [])

  const handleThemeChange = useCallback((t: Theme) => {
    setTheme(t)
    document.documentElement.setAttribute("data-theme", t)
  }, [])

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

  const handleUndo = useCallback(() => {
    const state = undoStack.pop()
    if (!state) return
    setTextA(state.textA)
    setTextB(state.textB)
    setResult(state.result)
    setResultVersion(state.resultVersion)
  }, [undoStack])

  const handleCompareRef = useRef(handleCompare)
  const handleUndoRef = useRef(handleUndo)
  useEffect(() => {
    handleCompareRef.current = handleCompare
    handleUndoRef.current = handleUndo
  })

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault()
        handleCompareRef.current()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        const tag = (e.target as HTMLElement)?.tagName
        if (tag === "TEXTAREA" || tag === "INPUT") return
        e.preventDefault()
        handleUndoRef.current()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  function handleSwap() {
    undoStack.push({ textA, textB, result, resultVersion })
    setTextA(textB)
    setTextB(textA)
  }

  function handleClearA() {
    undoStack.push({ textA, textB, result, resultVersion })
    setTextA("")
  }

  function handleClearB() {
    undoStack.push({ textA, textB, result, resultVersion })
    setTextB("")
  }

  function handleClear() {
    undoStack.push({ textA, textB, result, resultVersion })
    setTextA("")
    setTextB("")
    setResult(null)
  }

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-6xl px-4 py-4 md:py-6">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight">gosabun</h1>
            <p className="text-xs text-muted-foreground">テキスト差分比較</p>
          </div>
          <button
            type="button"
            onClick={() => handleColorModeChange(colorMode === "light" ? "dark" : "light")}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-muted transition-colors cursor-pointer"
            aria-label={colorMode === "light" ? "ダークモードに切替" : "ライトモードに切替"}
          >
            {colorMode === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
        </header>

        <div className="space-y-4">
          <InputPanel
            textA={textA}
            textB={textB}
            onChangeA={setTextA}
            onChangeB={setTextB}
            onClearA={handleClearA}
            onClearB={handleClearB}
            onSwap={handleSwap}
            onCompare={handleCompare}
            onClear={handleClear}
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
