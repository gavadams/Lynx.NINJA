/**
 * Custom hook for auto-scroll functionality
 * Provides easy-to-use auto-scroll methods for React components
 */

import { useCallback } from 'react'
import { scrollToElement, scrollToEditField, scrollToFirstEditField, safeScrollToEditField } from '@/lib/auto-scroll'

export interface UseAutoScrollOptions {
  /** Default offset from top of viewport */
  offset?: number
  /** Default animation duration in ms */
  duration?: number
  /** Whether to scroll smoothly by default */
  smooth?: boolean
  /** Default delay before scrolling */
  delay?: number
}

export function useAutoScroll(options: UseAutoScrollOptions = {}) {
  const defaultOptions = {
    offset: 100,
    duration: 500,
    smooth: true,
    delay: 100,
    ...options
  }

  const scrollToField = useCallback((selector: string, fieldOptions?: UseAutoScrollOptions) => {
    return scrollToEditField(selector, { ...defaultOptions, ...fieldOptions })
  }, [defaultOptions])

  const scrollToFirstField = useCallback((containerSelector: string, fieldOptions?: UseAutoScrollOptions) => {
    return scrollToFirstEditField(containerSelector, { ...defaultOptions, ...fieldOptions })
  }, [defaultOptions])

  const scrollToElementById = useCallback((element: HTMLElement, fieldOptions?: UseAutoScrollOptions) => {
    return scrollToElement(element, { ...defaultOptions, ...fieldOptions })
  }, [defaultOptions])

  const safeScrollToField = useCallback((selector: string, fieldOptions?: UseAutoScrollOptions) => {
    return safeScrollToEditField(selector, { ...defaultOptions, ...fieldOptions })
  }, [defaultOptions])

  // Helper function for handling focus events
  const handleFieldFocus = useCallback((fieldId: string, fieldOptions?: UseAutoScrollOptions) => {
    const element = document.getElementById(fieldId)
    if (element) {
      scrollToElement(element, { ...defaultOptions, ...fieldOptions })
    }
  }, [defaultOptions])

  // Helper function for modal auto-scroll
  const scrollToModalField = useCallback((modalSelector: string, fieldOptions?: UseAutoScrollOptions) => {
    return scrollToFirstEditField(modalSelector, {
      ...defaultOptions,
      offset: 120, // Account for modal header
      delay: 200,
      ...fieldOptions
    })
  }, [defaultOptions])

  return {
    scrollToField,
    scrollToFirstField,
    scrollToElement: scrollToElementById,
    safeScrollToField,
    handleFieldFocus,
    scrollToModalField
  }
}
