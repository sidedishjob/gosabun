"use client"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { WordMode, Theme } from "@/lib/types"

interface OptionsBarProps {
  wordMode: WordMode
  theme: Theme
  onWordModeChange: (mode: WordMode) => void
  onThemeChange: (theme: Theme) => void
}

export function OptionsBar({ wordMode, theme, onWordModeChange, onThemeChange }: OptionsBarProps) {
  return (
    <div className="flex flex-wrap gap-6 items-center text-sm">
      <div className="flex items-center gap-3">
        <span className="font-medium">英単語モード:</span>
        <RadioGroup
          value={wordMode}
          onValueChange={(v) => onWordModeChange(v as WordMode)}
          className="flex gap-3"
        >
          <label className="flex items-center gap-1.5 cursor-pointer">
            <RadioGroupItem value="compat" />
            互換
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <RadioGroupItem value="extended" />
            拡張
          </label>
        </RadioGroup>
      </div>

      <div className="flex items-center gap-3">
        <span className="font-medium">テーマ:</span>
        <RadioGroup
          value={theme}
          onValueChange={(v) => onThemeChange(v as Theme)}
          className="flex gap-3"
        >
          <label className="flex items-center gap-1.5 cursor-pointer">
            <RadioGroupItem value="color1" />
            色1
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <RadioGroupItem value="color2" />
            色2
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <RadioGroupItem value="mono" />
            モノ
          </label>
        </RadioGroup>
      </div>
    </div>
  )
}
