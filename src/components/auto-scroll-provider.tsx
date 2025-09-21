"use client"

import { useEffect } from 'react'
import { useAutoScroll } from '@/hooks/useAutoScroll'

/**
 * Global auto-scroll provider that adds auto-scroll functionality
 * to all edit fields across the application
 */
export function AutoScrollProvider({ children }: { children: React.ReactNode }) {
  const { handleFieldFocus } = useAutoScroll()

  useEffect(() => {
    // Add global event listeners for auto-scroll functionality
    const handleGlobalFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement
      
      // Check if the focused element is an input, textarea, or contenteditable
      if (
        target &&
        (target.tagName === 'INPUT' || 
         target.tagName === 'TEXTAREA' || 
         target.contentEditable === 'true')
      ) {
        // Only auto-scroll if the element has an ID
        if (target.id) {
          handleFieldFocus(target.id)
        }
      }
    }

    // Add event listener for focus events
    document.addEventListener('focusin', handleGlobalFocus)

    // Cleanup
    return () => {
      document.removeEventListener('focusin', handleGlobalFocus)
    }
  }, [handleFieldFocus])

  return <>{children}</>
}

/**
 * Hook to enable auto-scroll for a specific element
 * @param elementId - The ID of the element to auto-scroll to
 * @param options - Auto-scroll options
 */
export function useElementAutoScroll(elementId: string, options?: { offset?: number; delay?: number }) {
  const { handleFieldFocus } = useAutoScroll()

  const scrollToElement = () => {
    handleFieldFocus(elementId, options)
  }

  return { scrollToElement }
}
