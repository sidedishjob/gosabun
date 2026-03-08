"use client"

import { CircleHelp, Sun, Moon } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import type { WordMode, Theme, DiffDisplayMode, IgnoreOptions, ColorMode } from "@/lib/types"

const WORD_MODE_HELP: Record<WordMode, string> = {
  compat: "小文字英単語を1トークンとして比較（difff互換）",
  extended: "大文字小文字区別なく英単語を1トークンとして比較",
  char: "1文字ずつ比較",
}

interface OptionsBarProps {
  wordMode: WordMode
  theme: Theme
  displayMode: DiffDisplayMode
  ignoreOptions: IgnoreOptions
  colorMode: ColorMode
  onWordModeChange: (mode: WordMode) => void
  onThemeChange: (theme: Theme) => void
  onDisplayModeChange: (mode: DiffDisplayMode) => void
  onIgnoreOptionsChange: (options: IgnoreOptions) => void
  onColorModeChange: (mode: ColorMode) => void
}

export function OptionsBar({
  wordMode,
  theme,
  displayMode,
  ignoreOptions,
  colorMode,
  onWordModeChange,
  onThemeChange,
  onDisplayModeChange,
  onIgnoreOptionsChange,
  onColorModeChange,
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
          {(["compat", "extended", "char"] as const).map((mode) => (
            <label key={mode} className="flex items-center gap-1.5 cursor-pointer">
              <RadioGroupItem value={mode} />
              {{ compat: "互換", extended: "拡張", char: "文字" }[mode]}
              <Tooltip>
                <TooltipTrigger asChild>
                  <CircleHelp className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="top">{WORD_MODE_HELP[mode]}</TooltipContent>
              </Tooltip>
            </label>
          ))}
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
      <button
        type="button"
        onClick={() => onColorModeChange(colorMode === "light" ? "dark" : "light")}
        className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-muted transition-colors cursor-pointer"
        aria-label={colorMode === "light" ? "ダークモードに切替" : "ライトモードに切替"}
      >
        {colorMode === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </button>
    </div>
  )
}
