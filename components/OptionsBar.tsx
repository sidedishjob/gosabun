/**
 * 比較オプション（単語/文字モード、配色、表示モード、空白無視）の切り替え UI。
 */

"use client"

import { CircleHelp } from "lucide-react"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import type { WordMode, Theme, DiffDisplayMode, IgnoreOptions } from "@/lib/types"
import {
  WORD_MODE_OPTIONS,
  THEME_OPTIONS,
  DIFF_DISPLAY_MODE_OPTIONS,
  type SegmentOption,
} from "@/lib/constants"

/**
 * 汎用セグメントコントロール。
 * ジェネリック型 T で任意の string リテラル型に対応する。
 */
function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="inline-flex rounded-md border bg-muted/60 p-0.5 dark:bg-muted/40">
      {options.map((opt) => {
        const isActive = value === opt.value
        const button = (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`inline-flex items-center gap-1 rounded-sm px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
              isActive
                ? "bg-background text-foreground shadow-sm dark:bg-accent dark:text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {opt.label}
            {opt.tooltip && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <CircleHelp className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="top">{opt.tooltip}</TooltipContent>
              </Tooltip>
            )}
          </button>
        )
        return button
      })}
    </div>
  )
}

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
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">比較</span>
        <SegmentedControl
          options={WORD_MODE_OPTIONS}
          value={wordMode}
          onChange={onWordModeChange}
        />
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">配色</span>
        <SegmentedControl options={THEME_OPTIONS} value={theme} onChange={onThemeChange} />
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">表示</span>
        <SegmentedControl
          options={DIFF_DISPLAY_MODE_OPTIONS}
          value={displayMode}
          onChange={onDisplayModeChange}
        />
      </div>

      <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
        <input
          id="ignore-trim-whitespace"
          type="checkbox"
          checked={ignoreOptions.ignoreTrimWhitespace}
          onChange={(e) =>
            onIgnoreOptionsChange({
              ...ignoreOptions,
              ignoreTrimWhitespace: e.target.checked,
            })
          }
          className="rounded"
        />
        <span className="text-muted-foreground">前後の空白を無視</span>
      </label>
    </div>
  )
}
