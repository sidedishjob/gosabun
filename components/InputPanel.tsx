"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeftRight, X } from "lucide-react"

const MAX_CHARS = 200_000

interface InputPanelProps {
  textA: string
  textB: string
  onChangeA: (value: string) => void
  onChangeB: (value: string) => void
  onSwap: () => void
  onCompare: () => void
  onClear: () => void
}

export function InputPanel({
  textA,
  textB,
  onChangeA,
  onChangeB,
  onSwap,
  onCompare,
  onClear,
}: InputPanelProps) {
  const overLimitA = textA.length > MAX_CHARS
  const overLimitB = textB.length > MAX_CHARS
  const canCompare = textA.length > 0 && textB.length > 0 && !overLimitA && !overLimitB

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-start">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">テキスト A</label>
            {textA.length > 0 && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onChangeA("")}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Textarea
            value={textA}
            onChange={(e) => onChangeA(e.target.value)}
            placeholder="比較するテキストを入力..."
            className="min-h-[200px] font-mono text-sm"
          />
          {overLimitA && (
            <p className="text-xs text-destructive">
              {textA.length.toLocaleString()}文字: 200,000文字を超えています
            </p>
          )}
        </div>

        <div className="flex items-center pt-7">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={onSwap}>
            <ArrowLeftRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">テキスト B</label>
            {textB.length > 0 && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onChangeB("")}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Textarea
            value={textB}
            onChange={(e) => onChangeB(e.target.value)}
            placeholder="比較するテキストを入力..."
            className="min-h-[200px] font-mono text-sm"
          />
          {overLimitB && (
            <p className="text-xs text-destructive">
              {textB.length.toLocaleString()}文字: 200,000文字を超えています
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-center gap-2">
        <Button onClick={onCompare} disabled={!canCompare} className="px-8">
          比較
        </Button>
        <Button
          variant="outline"
          onClick={onClear}
          disabled={textA.length === 0 && textB.length === 0}
          className="px-8"
        >
          クリア
        </Button>
      </div>
    </div>
  )
}
