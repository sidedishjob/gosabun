/**
 * 実行プラットフォームの判定フック。
 * useSyncExternalStore で SSR / 初回ハイドレーションを false 固定にし、
 * ハイドレーション完了後にクライアントの navigator.platform を反映する。
 */

"use client"

import { useSyncExternalStore } from "react"

function subscribe(): () => void {
  return () => {}
}

function getIsMacSnapshot(): boolean {
  if (typeof navigator === "undefined") return false
  return /Mac/i.test(navigator.platform)
}

function getIsMacServerSnapshot(): boolean {
  return false
}

/** 実行環境が macOS かを返す。SSR & 初回レンダーでは false（Ctrl 表示）。 */
export function useIsMac(): boolean {
  return useSyncExternalStore(subscribe, getIsMacSnapshot, getIsMacServerSnapshot)
}

/** 修飾キーのラベル。macOS では "⌘"、それ以外では "Ctrl"。 */
export function useModKeyLabel(): "⌘" | "Ctrl" {
  return useIsMac() ? "⌘" : "Ctrl"
}
