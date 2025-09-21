/**
 * Auto-scroll utility for bringing edit fields into view
 * Provides smooth scrolling to edit elements when they become active
 */

export interface ScrollToEditOptions {
  /** Offset from top of viewport (default: 100px) */
  offset?: number
  /** Animation duration in ms (default: 500ms) */
  duration?: number
  /** Whether to scroll smoothly (default: true) */
  smooth?: boolean
  /** Additional delay before scrolling (default: 100ms) */
  delay?: number
}

const DEFAULT_OPTIONS: Required<ScrollToEditOptions> = {
  offset: 100,
  duration: 500,
  smooth: true,
  delay: 100
}

/**
 * Scrolls to an element with smooth animation
 * @param element - The element to scroll to
 * @param options - Scroll configuration options
 */
export function scrollToElement(
  element: HTMLElement, 
  options: ScrollToEditOptions = {}
): void {
  const config = { ...DEFAULT_OPTIONS, ...options }
  
  // Calculate target position
  const elementRect = element.getBoundingClientRect()
  const currentScrollY = window.scrollY
  const targetScrollY = currentScrollY + elementRect.top - config.offset
  
  // Apply smooth scrolling
  if (config.smooth) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest'
    })
    
    // Adjust for offset after smooth scroll
    setTimeout(() => {
      window.scrollBy({
        top: -config.offset,
        behavior: 'smooth'
      })
    }, 50)
  } else {
    window.scrollTo(0, targetScrollY)
  }
}

/**
 * Scrolls to an element by selector
 * @param selector - CSS selector for the element
 * @param options - Scroll configuration options
 * @returns Promise that resolves when scroll is complete
 */
export function scrollToEditField(
  selector: string, 
  options: ScrollToEditOptions = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    const config = { ...DEFAULT_OPTIONS, ...options }
    
    setTimeout(() => {
      const element = document.querySelector(selector) as HTMLElement
      
      if (!element) {
        console.warn(`Auto-scroll: Element not found for selector "${selector}"`)
        reject(new Error(`Element not found: ${selector}`))
        return
      }
      
      try {
        scrollToElement(element, config)
        
        // Resolve after animation completes
        setTimeout(() => {
          resolve()
        }, config.duration)
      } catch (error) {
        reject(error)
      }
    }, config.delay)
  })
}

/**
 * Auto-scroll to the first visible input/textarea in a container
 * @param containerSelector - CSS selector for the container
 * @param options - Scroll configuration options
 */
export function scrollToFirstEditField(
  containerSelector: string,
  options: ScrollToEditOptions = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    const config = { ...DEFAULT_OPTIONS, ...options }
    
    setTimeout(() => {
      const container = document.querySelector(containerSelector) as HTMLElement
      
      if (!container) {
        console.warn(`Auto-scroll: Container not found for selector "${containerSelector}"`)
        reject(new Error(`Container not found: ${containerSelector}`))
        return
      }
      
      // Find the first visible input, textarea, or contenteditable element
      const editFields = container.querySelectorAll(
        'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"]'
      )
      
      for (const field of editFields) {
        const element = field as HTMLElement
        const rect = element.getBoundingClientRect()
        
        // Check if element is visible and not off-screen
        if (rect.width > 0 && rect.height > 0) {
          try {
            scrollToElement(element, config)
            
            // Focus the element after scrolling
            setTimeout(() => {
              element.focus()
            }, config.duration / 2)
            
            setTimeout(() => {
              resolve()
            }, config.duration)
            return
          } catch (error) {
            reject(error)
          }
        }
      }
      
      // If no edit fields found, scroll to container
      try {
        scrollToElement(container, config)
        setTimeout(() => {
          resolve()
        }, config.duration)
      } catch (error) {
        reject(error)
      }
    }, config.delay)
  })
}

/**
 * Hook for auto-scrolling to edit fields in React components
 * @param options - Default scroll options
 * @returns Object with scroll functions
 */
export function useAutoScroll(options: ScrollToEditOptions = {}) {
  const scrollToField = (selector: string, fieldOptions?: ScrollToEditOptions) => {
    return scrollToEditField(selector, { ...options, ...fieldOptions })
  }
  
  const scrollToFirstField = (containerSelector: string, fieldOptions?: ScrollToEditOptions) => {
    return scrollToFirstEditField(containerSelector, { ...options, ...fieldOptions })
  }
  
  const scrollToElement = (element: HTMLElement, fieldOptions?: ScrollToEditOptions) => {
    return scrollToElement(element, { ...options, ...fieldOptions })
  }
  
  return {
    scrollToField,
    scrollToFirstField,
    scrollToElement
  }
}

/**
 * Auto-scroll to edit field with error handling
 * @param selector - CSS selector for the element
 * @param options - Scroll configuration options
 */
export async function safeScrollToEditField(
  selector: string,
  options: ScrollToEditOptions = {}
): Promise<boolean> {
  try {
    await scrollToEditField(selector, options)
    return true
  } catch (error) {
    console.warn('Auto-scroll failed:', error)
    return false
  }
}
