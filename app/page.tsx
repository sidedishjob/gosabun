"use client"

import { useState, useEffect, useCallback } from "react"
import { InputPanel } from "@/components/InputPanel"
import { OptionsBar } from "@/components/OptionsBar"
import { DiffViewer } from "@/components/DiffViewer"
import { StatsRow } from "@/components/StatsRow"
import { computeDiff } from "@/lib/diff-engine"
import type { WordMode, Theme, DiffDisplayMode, DiffResult, IgnoreOptions } from "@/lib/types"

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
  const [wordMode, setWordMode] = useState<WordMode>("compat")
  const [theme, setTheme] = useState<Theme>("color1")
  const [displayMode, setDisplayMode] = useState<DiffDisplayMode>("all")
  const [ignoreOptions, setIgnoreOptions] = useState<IgnoreOptions>({
    ignoreTrimWhitespace: false,
  })
  const [result, setResult] = useState<DiffResult | null>(null)

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
  }, [theme])

  const canCompare =
    textA.length > 0 && textB.length > 0 && textA.length <= 200_000 && textB.length <= 200_000

  const handleCompare = useCallback(() => {
    if (!canCompare) return
    const r = computeDiff(textA, textB, wordMode, ignoreOptions)
    setResult(r)
  }, [textA, textB, wordMode, ignoreOptions, canCompare])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault()
        handleCompare()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleCompare])

  function handleSwap() {
    setTextA(textB)
    setTextB(textA)
  }

  function handleClear() {
    setTextA("")
    setTextB("")
    setResult(null)
  }

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        <h1 className="text-2xl font-bold">gosabun - テキスト差分比較</h1>

        <InputPanel
          textA={textA}
          textB={textB}
          onChangeA={setTextA}
          onChangeB={setTextB}
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
          onThemeChange={setTheme}
          onDisplayModeChange={setDisplayMode}
          onIgnoreOptionsChange={setIgnoreOptions}
        />

        {result && (
          <>
            <DiffViewer result={result} displayMode={displayMode} />
            <div className="grid grid-cols-2 gap-4">
              <StatsRow label="テキスト A" stats={result.statsA} />
              <StatsRow label="テキスト B" stats={result.statsB} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
