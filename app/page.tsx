"use client"

import { useState, useEffect } from "react"
import { InputPanel } from "@/components/InputPanel"
import { OptionsBar } from "@/components/OptionsBar"
import { DiffViewer } from "@/components/DiffViewer"
import { StatsRow } from "@/components/StatsRow"
import { computeDiff } from "@/lib/diff-engine"
import type { WordMode, Theme, DiffResult } from "@/lib/types"

const SAMPLE_A = `吾輩は猫である。名前はまだ無い。
どこで生れたかとんと見当がつかぬ。
何でも薄暗いじめじめした所でニャーニャー泣いていた事だけは記憶している。
This is a sample text for diff comparison.
The quick brown fox jumps over the lazy dog.
MacDonaldさんはNewYorkからの手紙を読んだ。
この行は削除されます。
数値: 12345`

const SAMPLE_B = `吾輩は犬である。名前はもうある。
どこで生まれたかとんと見当がつかぬ。
何でも薄暗いじめじめした所でワンワン泣いていた事だけは記憶している。
This is a Sample Text for diff Comparison.
The quick brown cat jumps over the lazy dog.
MacArthurさんはNewJerseyからの手紙を読んだ。
この行は追加されました。
数値: 12346`

export default function Home() {
  const [textA, setTextA] = useState(SAMPLE_A)
  const [textB, setTextB] = useState(SAMPLE_B)
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
