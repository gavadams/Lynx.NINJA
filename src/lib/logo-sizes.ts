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

// Get logo size settings from database or return defaults
export async function getLogoSizeSettings(): Promise<LogoSizeSettings> {
  try {
    const response = await fetch('/api/settings/logo-sizes')
    if (response.ok) {
      const settings = await response.json()
      console.log('Logo size settings loaded from database:', settings)
      return settings
    }
  } catch (error) {
    console.error('Error loading logo size settings from database:', error)
  }
  return defaultLogoSizeSettings
}

// Save logo size settings to localStorage
export function saveLogoSizeSettings(settings: LogoSizeSettings): void {
  if (typeof window === 'undefined') {
    console.log('Window not available, skipping localStorage save')
    return
  }
  
  try {
    console.log('Saving logo size settings to localStorage:', settings)
    localStorage.setItem('logoSizeSettings', JSON.stringify(settings))
    console.log('Successfully saved logo size settings')
  } catch (error) {
    console.error('Error saving logo size settings:', error)
  }
}

// Get logo size for a specific page type
export async function getLogoSize(pageType: keyof LogoSizeSettings): Promise<number> {
  const settings = await getLogoSizeSettings()
  const size = settings[pageType] || defaultLogoSizeSettings[pageType]
  console.log(`Getting logo size for ${pageType}:`, size)
  return size
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
