import { diffArrays } from "diff"
import type {
  DiffToken,
  DiffChunk,
  DiffSegment,
  DiffRowModel,
  DiffStats,
  DiffResult,
  TokenType,
  WordMode,
  IgnoreOptions,
} from "./types"
import { MAX_TEXT_LENGTH } from "./constants"
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

  const wordPattern = /^([a-z]+|<\$>|&#?\w+;|[\s\S])/

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
    } else if (/^[a-z]+$/.test(value)) {
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
  if (idx === -1) {
    return { type: "char", value: key }
  }
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
  let currentA: DiffSegment[] = []
  let currentB: DiffSegment[] = []
  let lineA = 0
  let lineB = 0
  // Track which side "owns" the newline that triggers the next flush.
  // Set BEFORE flushRow() so the flushed row gets the correct line numbers.
  let newlineA = false
  let newlineB = false
  const rows: DiffRowModel[] = []

  function flushRow() {
    if (currentA.length === 0 && currentB.length === 0 && !newlineA && !newlineB) return
    const hasA = currentA.length > 0 || newlineA
    const hasB = currentB.length > 0 || newlineB
    if (hasA) lineA++
    if (hasB) lineB++
    rows.push({
      a: { segments: currentA },
      b: { segments: currentB },
      lineA: hasA ? lineA : undefined,
      lineB: hasB ? lineB : undefined,
    })
    currentA = []
    currentB = []
    newlineA = false
    newlineB = false
  }

  for (const chunk of chunks) {
    switch (chunk.type) {
      case "equal": {
        const lines = splitByNewline(chunk.tokensA)
        for (let i = 0; i < lines.length; i++) {
          if (i > 0) {
            newlineA = true
            newlineB = true
            flushRow()
          }
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
            newlineA = true
            flushRow()
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
            newlineB = true
            flushRow()
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
        const maxLines = Math.max(linesA.length, linesB.length)
        for (let i = 0; i < maxLines; i++) {
          if (i > 0) {
            if (i < linesA.length) newlineA = true
            if (i < linesB.length) newlineB = true
            flushRow()
          }
          if (i < linesA.length && linesA[i].length > 0) {
            currentA.push({ tokens: linesA[i], type: "delete" })
          }
          if (i < linesB.length && linesB[i].length > 0) {
            currentB.push({ tokens: linesB[i], type: "insert" })
          }
        }
        break
      }
    }
  }

  // Flush remaining
  flushRow()

  return rows
}

function segmentsToText(segments: DiffSegment[]): string {
  return segments
    .flatMap((s) => s.tokens)
    .map((t) => (t.value === NEWLINE_MARKER ? "\n" : t.value))
    .join("")
}

function neutralizeRow(row: DiffRowModel): DiffRowModel {
  return {
    ...row,
    a: {
      segments: row.a.segments.map((s) => ({ ...s, type: "equal" as const })),
    },
    b: {
      segments: row.b.segments.map((s) => ({ ...s, type: "equal" as const })),
    },
  }
}

function applyIgnoreOptions(rows: DiffRowModel[], options: IgnoreOptions): DiffRowModel[] {
  return rows.map((row) => {
    const hasDiff =
      row.a.segments.some((s) => s.type !== "equal") ||
      row.b.segments.some((s) => s.type !== "equal")
    if (!hasDiff) return row

    if (options.ignoreTrimWhitespace) {
      const textA = segmentsToText(row.a.segments).trim()
      const textB = segmentsToText(row.b.segments).trim()
      if (textA === textB) return neutralizeRow(row)
    }

    return row
  })
}

export function computeDiff(
  textA: string,
  textB: string,
  mode: WordMode,
  ignoreOptions?: IgnoreOptions
): DiffResult {
  const statsA = countStats(textA)
  const statsB = countStats(textB)

  if (textA.length > MAX_TEXT_LENGTH || textB.length > MAX_TEXT_LENGTH) {
    return { rows: [], statsA, statsB, truncated: true }
  }

  const tokensA = splitText(textA, mode)
  const tokensB = splitText(textB, mode)
  const chunks = computeChunks(tokensA, tokensB)
  let rows = buildRows(chunks)

  if (ignoreOptions) {
    rows = applyIgnoreOptions(rows, ignoreOptions)
  }

  return { rows, statsA, statsB, truncated: false }
}
