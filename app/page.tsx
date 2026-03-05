"use client"

import { useState, useEffect } from "react"
import { InputPanel } from "@/components/InputPanel"
import { OptionsBar } from "@/components/OptionsBar"
import { DiffViewer } from "@/components/DiffViewer"
import { StatsRow } from "@/components/StatsRow"
import { computeDiff } from "@/lib/diff-engine"
import type { WordMode, Theme, DiffResult } from "@/lib/types"

export default function Home() {
  const [textA, setTextA] = useState("")
  const [textB, setTextB] = useState("")
  const [wordMode, setWordMode] = useState<WordMode>("compat")
  const [theme, setTheme] = useState<Theme>("color1")
  const [result, setResult] = useState<DiffResult | null>(null)

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
  }, [theme])

  function handleCompare() {
    const r = computeDiff(textA, textB, wordMode)
    setResult(r)
  }

  function handleSwap() {
    setTextA(textB)
    setTextB(textA)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        <h1 className="text-2xl font-bold">gosabun - テキスト差分比較</h1>

        <InputPanel
          textA={textA}
          textB={textB}
          onChangeA={setTextA}
          onChangeB={setTextB}
          onSwap={handleSwap}
          onCompare={handleCompare}
        />

        <OptionsBar
          wordMode={wordMode}
          theme={theme}
          onWordModeChange={setWordMode}
          onThemeChange={setTheme}
        />

        {result && (
          <>
            <DiffViewer result={result} />
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
