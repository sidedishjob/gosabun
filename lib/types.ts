export type TokenType = "word" | "newline" | "entity" | "char"

export interface DiffToken {
  value: string
  type: TokenType
}

export type ChunkType = "equal" | "insert" | "delete" | "replace"

export interface DiffChunk {
  type: ChunkType
  tokensA: DiffToken[]
  tokensB: DiffToken[]
}

export interface DiffSegment {
  tokens: DiffToken[]
  type: Exclude<ChunkType, "replace">
}

export interface DiffCellModel {
  segments: DiffSegment[]
}

export interface DiffRowModel {
  a: DiffCellModel
  b: DiffCellModel
}

export interface DiffStats {
  charCount: number
  charWithSpace: number
  charWithNewline: number
  wordCount: number
}

export interface DiffResult {
  rows: DiffRowModel[]
  statsA: DiffStats
  statsB: DiffStats
  truncated: boolean
}

export type WordMode = "compat" | "extended" | "char"

export type Theme = "color1" | "color2" | "mono"
