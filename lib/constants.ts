import type { WordMode, Theme, DiffDisplayMode } from "@/lib/types"

export const MAX_TEXT_LENGTH = 200_000

export const UNDO_MAX_DEPTH = 10

export interface SegmentOption<T extends string> {
  value: T
  label: string
  tooltip?: string
}

export const WORD_MODE_OPTIONS: SegmentOption<WordMode>[] = [
  { value: "word", label: "単語" },
  { value: "char", label: "1文字" },
]

export const THEME_OPTIONS: SegmentOption<Theme>[] = [
  { value: "color1", label: "青" },
  { value: "color2", label: "緑" },
  { value: "mono", label: "モノ" },
]

export const DIFF_DISPLAY_MODE_OPTIONS: SegmentOption<DiffDisplayMode>[] = [
  { value: "all", label: "全体" },
  { value: "diff-only", label: "差分のみ" },
]
