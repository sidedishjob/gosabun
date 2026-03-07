"use client"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { WordMode, Theme, DiffDisplayMode, IgnoreOptions } from "@/lib/types"

interface OptionsBarProps {
  wordMode: WordMode
  theme: Theme
  displayMode: DiffDisplayMode
  ignoreOptions: IgnoreOptions
  onWordModeChange: (mode: WordMode) => void
  onThemeChange: (theme: Theme) => void
  onDisplayModeChange: (mode: DiffDisplayMode) => void
  onIgnoreOptionsChange: (options: IgnoreOptions) => void
}

export function OptionsBar({
  wordMode,
  theme,
  displayMode,
  ignoreOptions,
  onWordModeChange,
  onThemeChange,
  onDisplayModeChange,
  onIgnoreOptionsChange,
}: OptionsBarProps) {
  return (
    <div className="flex flex-wrap gap-6 items-center text-sm">
      <div className="flex items-center gap-3">
        <span className="font-medium">比較モード:</span>
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
          <label className="flex items-center gap-1.5 cursor-pointer">
            <RadioGroupItem value="char" />
            文字
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
      <div className="flex items-center gap-3">
        <span className="font-medium">表示:</span>
        <RadioGroup
          value={displayMode}
          onValueChange={(v) => onDisplayModeChange(v as DiffDisplayMode)}
          className="flex gap-3"
        >
          <label className="flex items-center gap-1.5 cursor-pointer">
            <RadioGroupItem value="all" />
            全体
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <RadioGroupItem value="diff-only" />
            差分のみ
          </label>
        </RadioGroup>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-medium">無視:</span>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={ignoreOptions.ignoreTrimWhitespace}
            onChange={(e) =>
              onIgnoreOptionsChange({
                ...ignoreOptions,
                ignoreTrimWhitespace: e.target.checked,
              })
            }
          />
          行頭・行末の空白
        </label>
      </div>
    </div>
  )
}
