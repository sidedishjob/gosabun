/**
 * アプリケーション全体で使用する定数と UI 選択肢の定義。
 */

import type { WordMode, Theme, DiffDisplayMode } from "@/lib/types"

/** テキスト入力の上限文字数（パフォーマンス保護） */
export const MAX_TEXT_LENGTH = 200_000

/** Undo スタックの最大保持数 */
export const UNDO_MAX_DEPTH = 10

/** セグメントコントロールの選択肢型 */
export interface SegmentOption<T extends string> {
  value: T
  label: string
  tooltip?: string
}

/** トークン化モードの選択肢 */
export const WORD_MODE_OPTIONS: SegmentOption<WordMode>[] = [
  { value: "word", label: "単語" },
  { value: "char", label: "1文字" },
]

/** 配色テーマの選択肢 */
export const THEME_OPTIONS: SegmentOption<Theme>[] = [
  { value: "color1", label: "青" },
  { value: "color2", label: "緑" },
  { value: "mono", label: "モノ" },
]

/** 差分表示モードの選択肢 */
export const DIFF_DISPLAY_MODE_OPTIONS: SegmentOption<DiffDisplayMode>[] = [
  { value: "all", label: "全体" },
  { value: "diff-only", label: "差分のみ" },
]
