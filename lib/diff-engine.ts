import { diffArrays } from "diff"
import type {
  DiffToken,
  DiffChunk,
  DiffSegment,
  DiffCellModel,
  DiffRowModel,
  DiffStats,
  DiffResult,
  TokenType,
  WordMode,
} from "./types"

const MAX_CHARS = 200_000
const NEWLINE_MARKER = "<$>"

export function splitText(text: string, mode: WordMode): DiffToken[] {
  const normalized = text.replace(/\r\n?/g, "\n")
  const replaced = normalized.replaceAll("\n", NEWLINE_MARKER)

  if (mode === "char") {
    const tokens: DiffToken[] = []
    let remaining = replaced
    while (remaining.length > 0) {
      if (remaining.startsWith(NEWLINE_MARKER)) {
        tokens.push({ value: NEWLINE_MARKER, type: "newline" })
        remaining = remaining.slice(NEWLINE_MARKER.length)
      } else {
        tokens.push({ value: remaining[0], type: "char" })
        remaining = remaining.slice(1)
      }
    }
    return tokens
  }

  const wordPattern =
    mode === "compat" ? /^([a-z]+|<\$>|&#?\w+;|[\s\S])/ : /^([A-Za-z]+|<\$>|&#?\w+;|[\s\S])/

  const tokens: DiffToken[] = []
  let remaining = replaced

  while (remaining.length > 0) {
    const match = wordPattern.exec(remaining)
    if (!match) break
    const value = match[1]

    let type: TokenType
    if (value === NEWLINE_MARKER) {
      type = "newline"
    } else if (/^&#?\w+;$/.test(value)) {
      type = "entity"
    } else if (mode === "compat" ? /^[a-z]+$/.test(value) : /^[A-Za-z]+$/.test(value)) {
      type = "word"
    } else {
      type = "char"
    }

    tokens.push({ value, type })
    remaining = remaining.slice(value.length)
  }

  return tokens
}

export function countStats(text: string): DiffStats {
  const normalized = text.replace(/\r\n?/g, "\n")
  const charWithNewline = normalized.length
  const withoutNewlines = normalized.replaceAll("\n", "")
  const charWithSpace = withoutNewlines.length
  const charCount = withoutNewlines.replace(/\s/g, "").length
  const wordMatches = normalized.match(/\s*\S+/g)
  const wordCount = wordMatches ? wordMatches.length : 0

  return { charCount, charWithSpace, charWithNewline, wordCount }
}

function tokenToKey(token: DiffToken): string {
  return `${token.type}\u0000${token.value}`
}

function keyToToken(key: string): DiffToken {
  const idx = key.indexOf("\u0000")
  return {
    type: key.slice(0, idx) as TokenType,
    value: key.slice(idx + 1),
  }
}

function computeChunks(tokensA: DiffToken[], tokensB: DiffToken[]): DiffChunk[] {
  const keysA = tokensA.map(tokenToKey)
  const keysB = tokensB.map(tokenToKey)

  const changes = diffArrays(keysA, keysB)

  const rawChunks: DiffChunk[] = changes.map((change) => {
    const tokens = (change.value ?? []).map(keyToToken)
    if (change.removed) {
      return { type: "delete" as const, tokensA: tokens, tokensB: [] }
    }
    if (change.added) {
      return { type: "insert" as const, tokensA: [], tokensB: tokens }
    }
    return { type: "equal" as const, tokensA: tokens, tokensB: tokens }
  })

  // Merge consecutive delete+insert into replace
  const chunks: DiffChunk[] = []
  for (let i = 0; i < rawChunks.length; i++) {
    const current = rawChunks[i]
    if (
      current.type === "delete" &&
      i + 1 < rawChunks.length &&
      rawChunks[i + 1].type === "insert"
    ) {
      const next = rawChunks[i + 1]
      chunks.push({
        type: "replace",
        tokensA: current.tokensA,
        tokensB: next.tokensB,
      })
      i++ // skip next
    } else {
      chunks.push(current)
    }
  }

  return chunks
}

function isNewline(token: DiffToken): boolean {
  return token.type === "newline" && token.value === NEWLINE_MARKER
}

function splitByNewline(tokens: DiffToken[]): DiffToken[][] {
  const lines: DiffToken[][] = [[]]
  for (const token of tokens) {
    if (isNewline(token)) {
      lines.push([])
    } else {
      lines[lines.length - 1].push(token)
    }
  }
  return lines
}

function buildRows(chunks: DiffChunk[]): DiffRowModel[] {
  // Build rows by accumulating segments into current A/B cells
  // When we encounter a newline, we flush the current row and start a new one
  let currentA: DiffSegment[] = []
  let currentB: DiffSegment[] = []
  const rowsA: DiffCellModel[] = []
  const rowsB: DiffCellModel[] = []

  function flushBoth() {
    rowsA.push({ segments: currentA })
    rowsB.push({ segments: currentB })
    currentA = []
    currentB = []
  }

  for (const chunk of chunks) {
    switch (chunk.type) {
      case "equal": {
        const lines = splitByNewline(chunk.tokensA)
        for (let i = 0; i < lines.length; i++) {
          if (i > 0) flushBoth()
          if (lines[i].length > 0) {
            const seg: DiffSegment = { tokens: lines[i], type: "equal" }
            currentA.push(seg)
            currentB.push(seg)
          }
        }
        break
      }
      case "delete": {
        const lines = splitByNewline(chunk.tokensA)
        for (let i = 0; i < lines.length; i++) {
          if (i > 0) {
            rowsA.push({ segments: currentA })
            currentA = []
          }
          if (lines[i].length > 0) {
            currentA.push({ tokens: lines[i], type: "delete" })
          }
        }
        break
      }
      case "insert": {
        const lines = splitByNewline(chunk.tokensB)
        for (let i = 0; i < lines.length; i++) {
          if (i > 0) {
            rowsB.push({ segments: currentB })
            currentB = []
          }
          if (lines[i].length > 0) {
            currentB.push({ tokens: lines[i], type: "insert" })
          }
        }
        break
      }
      case "replace": {
        const linesA = splitByNewline(chunk.tokensA)
        const linesB = splitByNewline(chunk.tokensB)
        for (let i = 0; i < linesA.length; i++) {
          if (i > 0) {
            rowsA.push({ segments: currentA })
            currentA = []
          }
          if (linesA[i].length > 0) {
            currentA.push({ tokens: linesA[i], type: "delete" })
          }
        }
        for (let i = 0; i < linesB.length; i++) {
          if (i > 0) {
            rowsB.push({ segments: currentB })
            currentB = []
          }
          if (linesB[i].length > 0) {
            currentB.push({ tokens: linesB[i], type: "insert" })
          }
        }
        break
      }
    }
  }

  // Flush remaining
  rowsA.push({ segments: currentA })
  rowsB.push({ segments: currentB })

  // Pad to equal length
  const maxLen = Math.max(rowsA.length, rowsB.length)
  while (rowsA.length < maxLen) rowsA.push({ segments: [] })
  while (rowsB.length < maxLen) rowsB.push({ segments: [] })

  return rowsA.map((a, i) => ({ a, b: rowsB[i] }))
}

export function computeDiff(textA: string, textB: string, mode: WordMode): DiffResult {
  const statsA = countStats(textA)
  const statsB = countStats(textB)

  if (textA.length > MAX_CHARS || textB.length > MAX_CHARS) {
    return { rows: [], statsA, statsB, truncated: true }
  }

  const tokensA = splitText(textA, mode)
  const tokensB = splitText(textB, mode)
  const chunks = computeChunks(tokensA, tokensB)
  const rows = buildRows(chunks)

  return { rows, statsA, statsB, truncated: false }
}
