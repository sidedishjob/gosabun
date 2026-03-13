"use client"

import { useCallback, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { ArrowLeftRight, Upload, X } from "lucide-react"
import { MAX_TEXT_LENGTH } from "@/lib/constants"

const ACCEPTED_EXTENSIONS = [".txt", ".md", ".csv", ".json", ".xml", ".html"]
const ACCEPTED_MIME_TYPES = "text/plain,text/markdown,text/csv,application/json,text/xml,text/html"

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const hasValidExt = ACCEPTED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext))
    if (!hasValidExt) {
      reject(new Error(`非対応のファイル形式です: ${file.name}`))
      return
    }
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error("ファイルの読み込みに失敗しました"))
    reader.readAsText(file, "UTF-8")
  })
}

interface InputPanelProps {
  textA: string
  textB: string
  onChangeA: (value: string) => void
  onChangeB: (value: string) => void
  onClearA: () => void
  onClearB: () => void
  onSwap: () => void
  onCompare: () => void
  onClear: () => void
}

export function InputPanel({
  textA,
  textB,
  onChangeA,
  onChangeB,
  onClearA,
  onClearB,
  onSwap,
  onCompare,
  onClear,
}: InputPanelProps) {
  const overLimitA = textA.length > MAX_TEXT_LENGTH
  const overLimitB = textB.length > MAX_TEXT_LENGTH
  const canCompare = textA.length > 0 && textB.length > 0 && !overLimitA && !overLimitB

  const [dragOverA, setDragOverA] = useState(false)
  const [dragOverB, setDragOverB] = useState(false)
  const [fileErrorA, setFileErrorA] = useState<string | null>(null)
  const [fileErrorB, setFileErrorB] = useState<string | null>(null)
  const fileInputARef = useRef<HTMLInputElement>(null)
  const fileInputBRef = useRef<HTMLInputElement>(null)
  const dragCounterA = useRef(0)
  const dragCounterB = useRef(0)

  const handleFile = useCallback(
    async (file: File, onChange: (v: string) => void, setError: (e: string | null) => void) => {
      setError(null)
      try {
        const text = await readFileAsText(file)
        onChange(text)
      } catch (err) {
        setError(err instanceof Error ? err.message : "ファイルの読み込みに失敗しました")
      }
    },
    []
  )

  const handleDragEnterA = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounterA.current += 1
    setDragOverA(true)
  }, [])

  const handleDragEnterB = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounterB.current += 1
    setDragOverB(true)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleDragLeaveA = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounterA.current -= 1
    if (dragCounterA.current === 0) setDragOverA(false)
  }, [])

  const handleDragLeaveB = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounterB.current -= 1
    if (dragCounterB.current === 0) setDragOverB(false)
  }, [])

  const handleDropA = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      dragCounterA.current = 0
      setDragOverA(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file, onChangeA, setFileErrorA)
    },
    [handleFile, onChangeA]
  )

  const handleDropB = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      dragCounterB.current = 0
      setDragOverB(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file, onChangeB, setFileErrorB)
    },
    [handleFile, onChangeB]
  )

  const handleFileInputA = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file, onChangeA, setFileErrorA)
      e.target.value = ""
    },
    [handleFile, onChangeA]
  )

  const handleFileInputB = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file, onChangeB, setFileErrorB)
      e.target.value = ""
    },
    [handleFile, onChangeB]
  )

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-2 items-start">
        <div
          className={`space-y-1 rounded-md transition-colors ${dragOverA ? "ring-2 ring-primary ring-offset-2 bg-primary/5" : ""}`}
          onDragEnter={handleDragEnterA}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeaveA}
          onDrop={handleDropA}
        >
          <div className="flex items-center justify-between">
            <label htmlFor="text-a" className="text-xs font-medium text-muted-foreground">
              テキスト A
            </label>
            <div className="flex items-center gap-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => fileInputARef.current?.click()}
                    className="relative before:absolute before:-inset-2 before:content-['']"
                  >
                    <Upload className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">ファイルを選択</TooltipContent>
              </Tooltip>
              <input
                ref={fileInputARef}
                type="file"
                accept={ACCEPTED_MIME_TYPES}
                className="hidden"
                onChange={handleFileInputA}
              />
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={onClearA}
                className={`relative transition-none before:absolute before:-inset-2 before:content-[''] ${textA.length === 0 ? "invisible" : ""}`}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <Textarea
            id="text-a"
            value={textA}
            onChange={(e) => onChangeA(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Tab" && !e.shiftKey) {
                e.preventDefault()
                document.getElementById("text-b")?.focus()
              }
            }}
            placeholder="比較するテキストを入力 / ファイルをドロップ..."
            className="field-sizing-fixed h-48 md:h-72 resize-none overflow-y-auto font-mono text-sm"
          />
          {overLimitA && (
            <p className="text-xs text-destructive">
              {textA.length.toLocaleString()}文字: 200,000文字を超えています
            </p>
          )}
          {fileErrorA && <p className="text-xs text-destructive">{fileErrorA}</p>}
        </div>

        <div className="flex justify-center items-center md:pt-6">
          <Button variant="ghost" size="icon-sm" onClick={onSwap} className="text-muted-foreground">
            <ArrowLeftRight className="h-4 w-4" />
          </Button>
        </div>

        <div
          className={`space-y-1 rounded-md transition-colors ${dragOverB ? "ring-2 ring-primary ring-offset-2 bg-primary/5" : ""}`}
          onDragEnter={handleDragEnterB}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeaveB}
          onDrop={handleDropB}
        >
          <div className="flex items-center justify-between">
            <label htmlFor="text-b" className="text-xs font-medium text-muted-foreground">
              テキスト B
            </label>
            <div className="flex items-center gap-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => fileInputBRef.current?.click()}
                    className="relative before:absolute before:-inset-2 before:content-['']"
                  >
                    <Upload className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">ファイルを選択</TooltipContent>
              </Tooltip>
              <input
                ref={fileInputBRef}
                type="file"
                accept={ACCEPTED_MIME_TYPES}
                className="hidden"
                onChange={handleFileInputB}
              />
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={onClearB}
                className={`relative transition-none before:absolute before:-inset-2 before:content-[''] ${textB.length === 0 ? "invisible" : ""}`}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <Textarea
            id="text-b"
            value={textB}
            onChange={(e) => onChangeB(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Tab" && e.shiftKey) {
                e.preventDefault()
                document.getElementById("text-a")?.focus()
              }
            }}
            placeholder="比較するテキストを入力 / ファイルをドロップ..."
            className="field-sizing-fixed h-48 md:h-72 resize-none overflow-y-auto font-mono text-sm"
          />
          {overLimitB && (
            <p className="text-xs text-destructive">
              {textB.length.toLocaleString()}文字: 200,000文字を超えています
            </p>
          )}
          {fileErrorB && <p className="text-xs text-destructive">{fileErrorB}</p>}
        </div>
      </div>

      <div className="flex justify-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={onCompare} disabled={!canCompare} className="px-8">
              比較する
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <kbd className="font-mono text-[10px]">⌘+Enter</kbd>
          </TooltipContent>
        </Tooltip>
        <Button
          variant="ghost"
          onClick={onClear}
          disabled={textA.length === 0 && textB.length === 0}
          className="text-muted-foreground"
        >
          クリア
        </Button>
      </div>
    </div>
  )
}
