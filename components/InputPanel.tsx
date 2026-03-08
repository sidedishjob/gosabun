"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { ArrowLeftRight, X } from "lucide-react"
import { MAX_TEXT_LENGTH } from "@/lib/constants"

interface InputPanelProps {
  textA: string
  textB: string
  onChangeA: (value: string) => void
  onChangeB: (value: string) => void
  onClearA: () => void
  onClearB: () => void
  onSwap: () => void
  onCompare: () => void
  onClear: () => void
}

export function InputPanel({
  textA,
  textB,
  onChangeA,
  onChangeB,
  onClearA,
  onClearB,
  onSwap,
  onCompare,
  onClear,
}: InputPanelProps) {
  const overLimitA = textA.length > MAX_TEXT_LENGTH
  const overLimitB = textB.length > MAX_TEXT_LENGTH
  const canCompare = textA.length > 0 && textB.length > 0 && !overLimitA && !overLimitB

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-2 items-start">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">テキスト A</label>
            {textA.length > 0 && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={onClearA}
                className="relative before:absolute before:-inset-2 before:content-['']"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          <Textarea
            value={textA}
            onChange={(e) => onChangeA(e.target.value)}
            placeholder="比較するテキストを入力..."
            className="field-sizing-fixed! h-48 md:h-72 resize-none overflow-y-auto font-mono text-sm"
          />
          {overLimitA && (
            <p className="text-xs text-destructive">
              {textA.length.toLocaleString()}文字: 200,000文字を超えています
            </p>
          )}
        </div>

        <div className="flex justify-center items-center md:pt-6">
          <Button variant="ghost" size="icon-sm" onClick={onSwap} className="text-muted-foreground">
            <ArrowLeftRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">テキスト B</label>
            {textB.length > 0 && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={onClearB}
                className="relative before:absolute before:-inset-2 before:content-['']"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          <Textarea
            value={textB}
            onChange={(e) => onChangeB(e.target.value)}
            placeholder="比較するテキストを入力..."
            className="field-sizing-fixed! h-48 md:h-72 resize-none overflow-y-auto font-mono text-sm"
          />
          {overLimitB && (
            <p className="text-xs text-destructive">
              {textB.length.toLocaleString()}文字: 200,000文字を超えています
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={onCompare} disabled={!canCompare} className="px-8">
              比較する
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <kbd className="font-mono text-[10px]">⌘+Enter</kbd>
          </TooltipContent>
        </Tooltip>
        <Button
          variant="ghost"
          onClick={onClear}
          disabled={textA.length === 0 && textB.length === 0}
          className="text-muted-foreground"
        >
          クリア
        </Button>
      </div>
    </div>
  )
}
