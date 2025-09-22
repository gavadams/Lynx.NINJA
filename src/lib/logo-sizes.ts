// Logo size management system

export interface LogoSizeSettings {
  landingPage: number
  dashboard: number
  authPages: number
  publicProfile: number
}

export const defaultLogoSizeSettings: LogoSizeSettings = {
  landingPage: 20,
  dashboard: 16,
  authPages: 20,
  publicProfile: 12
}

// Get logo size settings from localStorage or return defaults
export function getLogoSizeSettings(): LogoSizeSettings {
  if (typeof window === 'undefined') {
    return defaultLogoSizeSettings
  }
  
  try {
    const stored = localStorage.getItem('logoSizeSettings')
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Error loading logo size settings:', error)
  }
  
  return defaultLogoSizeSettings
}

// Save logo size settings to localStorage
export function saveLogoSizeSettings(settings: LogoSizeSettings): void {
  if (typeof window === 'undefined') {
    return
  }
  
  try {
    localStorage.setItem('logoSizeSettings', JSON.stringify(settings))
  } catch (error) {
    console.error('Error saving logo size settings:', error)
  }
}

// Get logo size for a specific page type
export function getLogoSize(pageType: keyof LogoSizeSettings): number {
  const settings = getLogoSizeSettings()
  return settings[pageType] || defaultLogoSizeSettings[pageType]
}

// Convert rem to pixels (approximate)
export function remToPixels(rem: number): number {
  return rem * 16 // Assuming 16px base font size
}

// Get logo dimensions based on size setting
export function getLogoDimensions(sizeInRem: number) {
  const heightInPixels = remToPixels(sizeInRem)
  const widthInPixels = heightInPixels * 3 // Assuming 3:1 aspect ratio for logo
  return {
    width: widthInPixels,
    height: heightInPixels,
    className: `h-${Math.round(sizeInRem * 4)} w-auto` // Convert to Tailwind classes
  }
}
