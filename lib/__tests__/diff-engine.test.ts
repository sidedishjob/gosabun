import { describe, it, expect } from "vitest"
import { splitText, countStats, computeDiff } from "../diff-engine"

// ─── splitText ───────────────────────────────────────────────────────────────

describe("splitText", () => {
  describe("word mode", () => {
    it("splits lowercase words", () => {
      const tokens = splitText("hello world", "word")
      expect(tokens).toEqual([
        { value: "hello", type: "word" },
        { value: " ", type: "char" },
        { value: "world", type: "word" },
      ])
    })

    it("splits newlines as newline tokens", () => {
      const tokens = splitText("a\nb", "word")
      expect(tokens).toEqual([
        { value: "a", type: "word" },
        { value: "<$>", type: "newline" },
        { value: "b", type: "word" },
      ])
    })

    it("normalizes CRLF to newline marker", () => {
      const tokens = splitText("a\r\nb", "word")
      expect(tokens).toEqual([
        { value: "a", type: "word" },
        { value: "<$>", type: "newline" },
        { value: "b", type: "word" },
      ])
    })

    it("normalizes standalone CR to newline marker", () => {
      const tokens = splitText("a\rb", "word")
      expect(tokens).toEqual([
        { value: "a", type: "word" },
        { value: "<$>", type: "newline" },
        { value: "b", type: "word" },
      ])
    })

    it("treats uppercase letters as individual chars", () => {
      const tokens = splitText("AB", "word")
      expect(tokens).toEqual([
        { value: "A", type: "char" },
        { value: "B", type: "char" },
      ])
    })

    it("detects HTML entities", () => {
      const tokens = splitText("&amp;", "word")
      expect(tokens).toEqual([{ value: "&amp;", type: "entity" }])
    })

    it("detects numeric HTML entities", () => {
      const tokens = splitText("&#123;", "word")
      expect(tokens).toEqual([{ value: "&#123;", type: "entity" }])
    })

    it("returns empty array for empty string", () => {
      expect(splitText("", "word")).toEqual([])
    })
  })

  describe("char mode", () => {
    it("splits each character individually", () => {
      const tokens = splitText("ab", "char")
      expect(tokens).toEqual([
        { value: "a", type: "char" },
        { value: "b", type: "char" },
      ])
    })

    it("splits newlines as newline tokens", () => {
      const tokens = splitText("a\nb", "char")
      expect(tokens).toEqual([
        { value: "a", type: "char" },
        { value: "<$>", type: "newline" },
        { value: "b", type: "char" },
      ])
    })

    it("normalizes CRLF to single newline marker", () => {
      const tokens = splitText("a\r\nb", "char")
      expect(tokens).toEqual([
        { value: "a", type: "char" },
        { value: "<$>", type: "newline" },
        { value: "b", type: "char" },
      ])
    })

    it("returns empty array for empty string", () => {
      expect(splitText("", "char")).toEqual([])
    })

    it("treats spaces as char tokens", () => {
      const tokens = splitText(" ", "char")
      expect(tokens).toEqual([{ value: " ", type: "char" }])
    })
  })
})

// ─── countStats ──────────────────────────────────────────────────────────────

describe("countStats", () => {
  it("counts an empty string as all zeros", () => {
    expect(countStats("")).toEqual({
      charCount: 0,
      charWithSpace: 0,
      charWithNewline: 0,
      wordCount: 0,
    })
  })

  it("counts characters excluding spaces and newlines", () => {
    const stats = countStats("a b")
    expect(stats.charCount).toBe(2)
  })

  it("counts characters with spaces but without newlines", () => {
    const stats = countStats("a b\nc")
    expect(stats.charWithSpace).toBe(4) // "a b" + "c" = 4 chars (newlines removed)
  })

  it("counts total characters including newlines", () => {
    const stats = countStats("a b\nc")
    expect(stats.charWithNewline).toBe(5) // "a b\nc"
  })

  it("counts words correctly", () => {
    const stats = countStats("hello world foo")
    expect(stats.wordCount).toBe(3)
  })

  it("counts words across newlines", () => {
    const stats = countStats("hello\nworld")
    expect(stats.wordCount).toBe(2)
  })

  it("normalizes CRLF before counting", () => {
    const stats = countStats("a\r\nb")
    // After normalization: "a\nb" → length 3
    expect(stats.charWithNewline).toBe(3)
    expect(stats.charWithSpace).toBe(2)
  })

  it("handles whitespace-only text", () => {
    const stats = countStats("   ")
    expect(stats.charCount).toBe(0)
    expect(stats.charWithSpace).toBe(3)
    expect(stats.wordCount).toBe(0)
  })
})

// ─── computeDiff ─────────────────────────────────────────────────────────────

describe("computeDiff", () => {
  it("returns empty rows for two empty strings", () => {
    const result = computeDiff("", "", "word")
    expect(result.rows).toEqual([])
    expect(result.truncated).toBe(false)
    expect(result.statsA).toEqual({
      charCount: 0,
      charWithSpace: 0,
      charWithNewline: 0,
      wordCount: 0,
    })
    expect(result.statsB).toEqual({
      charCount: 0,
      charWithSpace: 0,
      charWithNewline: 0,
      wordCount: 0,
    })
  })

  it("returns no diff segments for identical text", () => {
    const result = computeDiff("hello world", "hello world", "word")
    expect(result.truncated).toBe(false)
    expect(result.rows.length).toBeGreaterThan(0)
    for (const row of result.rows) {
      for (const seg of row.a.segments) {
        expect(seg.type).toBe("equal")
      }
      for (const seg of row.b.segments) {
        expect(seg.type).toBe("equal")
      }
    }
  })

  describe("word mode diffs", () => {
    it("detects word insertion", () => {
      const result = computeDiff("hello", "hello world", "word")
      expect(result.truncated).toBe(false)
      const hasInsert = result.rows.some((r) => r.b.segments.some((s) => s.type === "insert"))
      expect(hasInsert).toBe(true)
    })

    it("detects word deletion", () => {
      const result = computeDiff("hello world", "hello", "word")
      const hasDelete = result.rows.some((r) => r.a.segments.some((s) => s.type === "delete"))
      expect(hasDelete).toBe(true)
    })

    it("detects word replacement", () => {
      const result = computeDiff("hello", "world", "word")
      const hasDelete = result.rows.some((r) => r.a.segments.some((s) => s.type === "delete"))
      const hasInsert = result.rows.some((r) => r.b.segments.some((s) => s.type === "insert"))
      expect(hasDelete).toBe(true)
      expect(hasInsert).toBe(true)
    })
  })

  describe("char mode diffs", () => {
    it("detects character-level insertion", () => {
      const result = computeDiff("ab", "abc", "char")
      expect(result.truncated).toBe(false)
      const hasInsert = result.rows.some((r) => r.b.segments.some((s) => s.type === "insert"))
      expect(hasInsert).toBe(true)
    })

    it("detects character-level deletion", () => {
      const result = computeDiff("abc", "ab", "char")
      const hasDelete = result.rows.some((r) => r.a.segments.some((s) => s.type === "delete"))
      expect(hasDelete).toBe(true)
    })
  })

  describe("newline diffs", () => {
    it("handles newline-only differences", () => {
      const result = computeDiff("a\nb", "a\n\nb", "word")
      expect(result.truncated).toBe(false)
      expect(result.rows.length).toBeGreaterThan(1)
    })

    it("assigns line numbers to rows with newlines", () => {
      const result = computeDiff("line1\nline2", "line1\nline2", "word")
      expect(result.rows.length).toBe(2)
      expect(result.rows[0].lineA).toBe(1)
      expect(result.rows[0].lineB).toBe(1)
      expect(result.rows[1].lineA).toBe(2)
      expect(result.rows[1].lineB).toBe(2)
    })
  })

  describe("truncated flag", () => {
    it("returns truncated: true when textA exceeds MAX_TEXT_LENGTH", () => {
      const longText = "a".repeat(200_001)
      const result = computeDiff(longText, "short", "word")
      expect(result.truncated).toBe(true)
      expect(result.rows).toEqual([])
      expect(result.statsA.charCount).toBe(200_001)
    })

    it("returns truncated: true when textB exceeds MAX_TEXT_LENGTH", () => {
      const longText = "a".repeat(200_001)
      const result = computeDiff("short", longText, "word")
      expect(result.truncated).toBe(true)
      expect(result.rows).toEqual([])
    })

    it("returns truncated: false at exactly MAX_TEXT_LENGTH", () => {
      const text = "a".repeat(200_000)
      const result = computeDiff(text, text, "char")
      expect(result.truncated).toBe(false)
    })
  })

  describe("ignoreTrimWhitespace", () => {
    it("neutralizes rows that differ only by leading/trailing whitespace", () => {
      const result = computeDiff("  hello  ", "hello", "word", {
        ignoreTrimWhitespace: true,
      })
      for (const row of result.rows) {
        for (const seg of row.a.segments) {
          expect(seg.type).toBe("equal")
        }
        for (const seg of row.b.segments) {
          expect(seg.type).toBe("equal")
        }
      }
    })

    it("preserves diffs when trimmed text differs", () => {
      const result = computeDiff("  hello  ", "  world  ", "word", {
        ignoreTrimWhitespace: true,
      })
      const hasDiff =
        result.rows.some((r) => r.a.segments.some((s) => s.type !== "equal")) ||
        result.rows.some((r) => r.b.segments.some((s) => s.type !== "equal"))
      expect(hasDiff).toBe(true)
    })

    it("does not neutralize when ignoreTrimWhitespace is false", () => {
      const result = computeDiff("  hello  ", "hello", "word", {
        ignoreTrimWhitespace: false,
      })
      const hasDiff =
        result.rows.some((r) => r.a.segments.some((s) => s.type !== "equal")) ||
        result.rows.some((r) => r.b.segments.some((s) => s.type !== "equal"))
      expect(hasDiff).toBe(true)
    })
  })
})
