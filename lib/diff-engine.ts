import { diffArrays, diffLines } from "diff"
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

interface LogicalLine {
  text: string
  hasNewline: boolean
}

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

type LinePairType = "equal" | "delete" | "insert" | "replace"
interface LinePair {
  type: LinePairType
  linesA: LogicalLine[]
  linesB: LogicalLine[]
}

function computeLinePairs(textA: string, textB: string): LinePair[] {
  const normalizedA = textA.replace(/\r\n?/g, "\n")
  const normalizedB = textB.replace(/\r\n?/g, "\n")
  const changes = diffLines(normalizedA, normalizedB)

  // Merge consecutive removed+added into replace
  interface TaggedChange {
    type: "equal" | "delete" | "insert" | "replace"
    valueA: string
    valueB: string
  }
  const merged: TaggedChange[] = []
  for (let i = 0; i < changes.length; i++) {
    const c = changes[i]
    if (c.removed && i + 1 < changes.length && changes[i + 1].added) {
      const next = changes[i + 1]
      merged.push({ type: "replace", valueA: c.value, valueB: next.value })
      i++
    } else if (c.removed) {
      merged.push({ type: "delete", valueA: c.value, valueB: "" })
    } else if (c.added) {
      merged.push({ type: "insert", valueA: "", valueB: c.value })
    } else {
      merged.push({ type: "equal", valueA: c.value, valueB: c.value })
    }
  }

  // Split values into logical lines, preserving trailing-newline information
  function splitLines(value: string): LogicalLine[] {
    if (value === "") return []
    const parts = value.split("\n")
    const hasTrailingNewline = parts[parts.length - 1] === ""
    if (hasTrailingNewline) parts.pop()
    return parts.map((text, i) => ({
      text,
      hasNewline: i < parts.length - 1 || hasTrailingNewline,
    }))
  }

  return merged.map((m) => ({
    type: m.type,
    linesA: splitLines(m.valueA),
    linesB: splitLines(m.valueB),
  }))
}

function chunksToSegments(chunks: DiffChunk[]): {
  segmentsA: DiffSegment[]
  segmentsB: DiffSegment[]
} {
  const segmentsA: DiffSegment[] = []
  const segmentsB: DiffSegment[] = []

  for (const chunk of chunks) {
    switch (chunk.type) {
      case "equal":
        if (chunk.tokensA.length > 0) {
          const seg: DiffSegment = { tokens: chunk.tokensA, type: "equal" }
          segmentsA.push(seg)
          segmentsB.push(seg)
        }
        break
      case "delete":
        if (chunk.tokensA.length > 0) {
          segmentsA.push({ tokens: chunk.tokensA, type: "delete" })
        }
        break
      case "insert":
        if (chunk.tokensB.length > 0) {
          segmentsB.push({ tokens: chunk.tokensB, type: "insert" })
        }
        break
      case "replace":
        if (chunk.tokensA.length > 0) {
          segmentsA.push({ tokens: chunk.tokensA, type: "delete" })
        }
        if (chunk.tokensB.length > 0) {
          segmentsB.push({ tokens: chunk.tokensB, type: "insert" })
        }
        break
    }
  }

  return { segmentsA, segmentsB }
}

function newlineSegment(type: "delete" | "insert"): DiffSegment {
  return { tokens: [{ value: NEWLINE_MARKER, type: "newline" }], type }
}

function buildRowsFromPairs(pairs: LinePair[], mode: WordMode): DiffRowModel[] {
  const rows: DiffRowModel[] = []
  let lineA = 0
  let lineB = 0

  for (const pair of pairs) {
    switch (pair.type) {
      case "equal":
        for (const line of pair.linesA) {
          lineA++
          lineB++
          const tokens = splitText(line.text, mode)
          const seg: DiffSegment = { tokens, type: "equal" }
          rows.push({
            a: { segments: tokens.length > 0 ? [seg] : [] },
            b: { segments: tokens.length > 0 ? [seg] : [] },
            lineA,
            lineB,
          })
        }
        break
      case "delete":
        for (const line of pair.linesA) {
          lineA++
          const tokens = splitText(line.text, mode)
          rows.push({
            a: {
              segments:
                tokens.length > 0 ? [{ tokens, type: "delete" }] : [newlineSegment("delete")],
            },
            b: { segments: [] },
            lineA,
            lineB: undefined,
          })
        }
        break
      case "insert":
        for (const line of pair.linesB) {
          lineB++
          const tokens = splitText(line.text, mode)
          rows.push({
            a: { segments: [] },
            b: {
              segments:
                tokens.length > 0 ? [{ tokens, type: "insert" }] : [newlineSegment("insert")],
            },
            lineA: undefined,
            lineB,
          })
        }
        break
      case "replace": {
        const maxLen = Math.max(pair.linesA.length, pair.linesB.length)
        for (let i = 0; i < maxLen; i++) {
          const hasA = i < pair.linesA.length
          const hasB = i < pair.linesB.length
          if (hasA) lineA++
          if (hasB) lineB++

          if (hasA && hasB) {
            const lineObjA = pair.linesA[i]
            const lineObjB = pair.linesB[i]

            // EOF newline-only difference: text matches but trailing newline differs
            if (lineObjA.text === lineObjB.text && lineObjA.hasNewline !== lineObjB.hasNewline) {
              const tokens = splitText(lineObjA.text, mode)
              const equalSeg: DiffSegment = { tokens, type: "equal" }
              const segsA: DiffSegment[] = tokens.length > 0 ? [equalSeg] : []
              const segsB: DiffSegment[] = tokens.length > 0 ? [equalSeg] : []
              if (lineObjA.hasNewline) {
                segsA.push(newlineSegment("delete"))
              } else {
                segsB.push(newlineSegment("insert"))
              }
              rows.push({ a: { segments: segsA }, b: { segments: segsB }, lineA, lineB })
            } else {
              // Inline token diff for paired lines
              const tokA = splitText(lineObjA.text, mode)
              const tokB = splitText(lineObjB.text, mode)
              const chunks = computeChunks(tokA, tokB)
              const { segmentsA, segmentsB } = chunksToSegments(chunks)
              rows.push({
                a: { segments: segmentsA },
                b: { segments: segmentsB },
                lineA,
                lineB,
              })
            }
          } else if (hasA) {
            const tokens = splitText(pair.linesA[i].text, mode)
            rows.push({
              a: {
                segments:
                  tokens.length > 0 ? [{ tokens, type: "delete" }] : [newlineSegment("delete")],
              },
              b: { segments: [] },
              lineA,
              lineB: undefined,
            })
          } else {
            const tokens = splitText(pair.linesB[i].text, mode)
            rows.push({
              a: { segments: [] },
              b: {
                segments:
                  tokens.length > 0 ? [{ tokens, type: "insert" }] : [newlineSegment("insert")],
              },
              lineA: undefined,
              lineB,
            })
          }
        }
        break
      }
    }
  }

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

  const linePairs = computeLinePairs(textA, textB)
  let rows = buildRowsFromPairs(linePairs, mode)

  if (ignoreOptions) {
    rows = applyIgnoreOptions(rows, ignoreOptions)
  }

  return { rows, statsA, statsB, truncated: false }
}
