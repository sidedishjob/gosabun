"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

const SCROLL_THRESHOLD = 300

export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false)
  const visibleRef = useRef(false)

  useEffect(() => {
    const onScroll = () => {
      const shouldShow = window.scrollY > SCROLL_THRESHOLD
      if (shouldShow !== visibleRef.current) {
        visibleRef.current = shouldShow
        setVisible(shouldShow)
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const scrollToTop = () => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" })
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={`fixed bottom-4 right-4 z-20 shadow-md transition-all duration-200 ${
            visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
          }`}
          onClick={scrollToTop}
          aria-label="トップへ戻る"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left">トップへ戻る</TooltipContent>
    </Tooltip>
  )
}
