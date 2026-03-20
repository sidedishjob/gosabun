/**
 * テキスト差分比較で使用する型定義。
 * トークン・チャンク・セグメント・行モデルなど、差分パイプライン全体の
 * データ構造と UI オプションの型をまとめて定義する。
 */

/** トークンの種別（単語 / 改行 / HTML実体参照 / 1文字） */
export type TokenType = "word" | "newline" | "entity" | "char"

/** 差分比較の最小単位。1つの単語または1文字に対応する */
export interface DiffToken {
  value: string
  type: TokenType
}

/** チャンクの種別（一致 / 挿入 / 削除 / 置換） */
export type ChunkType = "equal" | "insert" | "delete" | "replace"

/** diff ライブラリの出力を表す変更の塊。左右のトークン列を保持する */
export interface DiffChunk {
  type: ChunkType
  tokensA: DiffToken[]
  tokensB: DiffToken[]
}

/**
 * 行内の同一種別トークンの連続区間。
 * replace は左右に分解されるため、ここでは除外される。
 */
export interface DiffSegment {
  tokens: DiffToken[]
  type: Exclude<ChunkType, "replace">
}

/** 左右どちらか片側のセル（セグメントの配列） */
export interface DiffCellModel {
  segments: DiffSegment[]
}

/** 左右 1 行分の差分データ。行番号は空行側では undefined になる */
export interface DiffRowModel {
  a: DiffCellModel
  b: DiffCellModel
  lineA?: number
  lineB?: number
}

/** テキストの文字数・空白数・改行数・語数の統計情報 */
export interface DiffStats {
  charCount: number
  charWithSpace: number
  charWithNewline: number
  wordCount: number
}

/** 比較結果全体。行モデル配列・両側の統計・切り捨てフラグを持つ */
export interface DiffResult {
  rows: DiffRowModel[]
  statsA: DiffStats
  statsB: DiffStats
  truncated: boolean
}

/** トークン化モード（単語単位 / 1文字単位） */
export type WordMode = "word" | "char"

/** 差分ハイライトの配色テーマ */
export type Theme = "color1" | "color2" | "mono"

/** ライト / ダークモード */
export type ColorMode = "light" | "dark"

/** 差分表示モード（全行 / 差分行のみ） */
export type DiffDisplayMode = "all" | "diff-only"

/** 差分比較時の無視オプション */
export interface IgnoreOptions {
  ignoreTrimWhitespace: boolean
}
