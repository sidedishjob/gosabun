"use client"

import { CircleHelp } from "lucide-react"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import type { WordMode, Theme, DiffDisplayMode, IgnoreOptions } from "@/lib/types"

const WORD_MODE_HELP: Record<WordMode, string> = {
  compat: "小文字英単語を1トークンとして比較（difff互換）",
  extended: "大文字小文字区別なく英単語を1トークンとして比較",
  char: "1文字ずつ比較",
}

interface SegmentOption<T extends string> {
  value: T
  label: string
  tooltip?: string
}

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
  const wordModeOptions: SegmentOption<WordMode>[] = [
    { value: "compat", label: "互換", tooltip: WORD_MODE_HELP.compat },
    { value: "extended", label: "拡張", tooltip: WORD_MODE_HELP.extended },
    { value: "char", label: "文字", tooltip: WORD_MODE_HELP.char },
  ]

  const themeOptions: SegmentOption<Theme>[] = [
    { value: "color1", label: "青" },
    { value: "color2", label: "緑" },
    { value: "mono", label: "モノ" },
  ]

  const displayOptions: SegmentOption<DiffDisplayMode>[] = [
    { value: "all", label: "全体" },
    { value: "diff-only", label: "差分のみ" },
  ]

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">比較</span>
        <SegmentedControl options={wordModeOptions} value={wordMode} onChange={onWordModeChange} />
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">配色</span>
        <SegmentedControl options={themeOptions} value={theme} onChange={onThemeChange} />
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">表示</span>
        <SegmentedControl
          options={displayOptions}
          value={displayMode}
          onChange={onDisplayModeChange}
        />
      </div>

      <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
        <input
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
