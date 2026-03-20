/**
 * CSS クラス名のユーティリティ。
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/** 条件付きクラス結合（clsx）と Tailwind の重複解決（twMerge）を統合する */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
