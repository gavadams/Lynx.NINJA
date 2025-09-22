// Theme utility functions for applying user themes

export interface Theme {
  value: string
  label: string
  description: string
  preview: string
  colors: string[]
}

export const themes: Theme[] = [
  { 
    value: 'default', 
    label: 'Default', 
    description: 'Clean and professional blue gradient',
    preview: 'bg-gradient-to-br from-blue-50 to-indigo-100',
    colors: ['#eff6ff', '#dbeafe', '#3b82f6', '#1e40af']
  },
  { 
    value: 'dark', 
    label: 'Dark', 
    description: 'Sleek dark theme with modern appeal',
    preview: 'bg-gradient-to-br from-gray-900 to-gray-800',
    colors: ['#111827', '#1f2937', '#6b7280', '#ffffff']
  },
  { 
    value: 'purple', 
    label: 'Purple', 
    description: 'Vibrant purple and pink gradient',
    preview: 'bg-gradient-to-br from-purple-50 to-pink-100',
    colors: ['#faf5ff', '#f3e8ff', '#8b5cf6', '#7c3aed']
  },
  { 
    value: 'green', 
    label: 'Green', 
    description: 'Fresh green and emerald tones',
    preview: 'bg-gradient-to-br from-green-50 to-emerald-100',
    colors: ['#f0fdf4', '#dcfce7', '#22c55e', '#16a34a']
  },
  { 
    value: 'orange', 
    label: 'Orange', 
    description: 'Warm orange and red gradient',
    preview: 'bg-gradient-to-br from-orange-50 to-red-100',
    colors: ['#fff7ed', '#fed7aa', '#f97316', '#ea580c']
  },
  { 
    value: 'ocean', 
    label: 'Ocean', 
    description: 'Deep blue ocean-inspired theme',
    preview: 'bg-gradient-to-br from-cyan-50 to-blue-200',
    colors: ['#ecfeff', '#cffafe', '#06b6d4', '#0891b2']
  },
  { 
    value: 'sunset', 
    label: 'Sunset', 
    description: 'Beautiful sunset colors',
    preview: 'bg-gradient-to-br from-yellow-50 to-orange-200',
    colors: ['#fefce8', '#fef3c7', '#eab308', '#ca8a04']
  },
  { 
    value: 'forest', 
    label: 'Forest', 
    description: 'Natural forest green theme',
    preview: 'bg-gradient-to-br from-green-100 to-green-300',
    colors: ['#f0fdf4', '#bbf7d0', '#16a34a', '#15803d']
  },
  { 
    value: 'neon', 
    label: 'Neon', 
    description: 'Electric neon cyberpunk vibes',
    preview: 'bg-gradient-to-br from-black to-purple-900',
    colors: ['#000000', '#1a0b2e', '#ff00ff', '#00ffff']
  },
  { 
    value: 'retro', 
    label: 'Retro', 
    description: 'Vintage 80s synthwave aesthetic',
    preview: 'bg-gradient-to-br from-purple-900 to-pink-500',
    colors: ['#1a0b2e', '#16213e', '#ff6b6b', '#4ecdc4']
  },
  { 
    value: 'minimal', 
    label: 'Minimal', 
    description: 'Clean white with subtle gray accents',
    preview: 'bg-gradient-to-br from-white to-gray-50',
    colors: ['#ffffff', '#f9fafb', '#374151', '#111827']
  },
  { 
    value: 'royal', 
    label: 'Royal', 
    description: 'Luxurious gold and deep purple',
    preview: 'bg-gradient-to-br from-yellow-100 to-purple-200',
    colors: ['#fef3c7', '#fde68a', '#d97706', '#7c3aed']
  },
  { 
    value: 'cherry', 
    label: 'Cherry', 
    description: 'Sweet cherry blossom theme',
    preview: 'bg-gradient-to-br from-pink-50 to-rose-100',
    colors: ['#fdf2f8', '#fce7f3', '#ec4899', '#be185d']
  },
  { 
    value: 'lavender', 
    label: 'Lavender', 
    description: 'Soft lavender and sage green',
    preview: 'bg-gradient-to-br from-purple-50 to-green-50',
    colors: ['#faf5ff', '#f3e8ff', '#a855f7', '#10b981']
  },
  { 
    value: 'coral', 
    label: 'Coral', 
    description: 'Warm coral and peach tones',
    preview: 'bg-gradient-to-br from-orange-100 to-pink-100',
    colors: ['#fed7aa', '#fdba74', '#f97316', '#ec4899']
  },
  { 
    value: 'midnight', 
    label: 'Midnight', 
    description: 'Deep midnight blue with silver',
    preview: 'bg-gradient-to-br from-slate-900 to-blue-900',
    colors: ['#0f172a', '#1e293b', '#3b82f6', '#e2e8f0']
  },
  { 
    value: 'aurora', 
    label: 'Aurora', 
    description: 'Northern lights inspired',
    preview: 'bg-gradient-to-br from-green-900 to-blue-900',
    colors: ['#064e3b', '#065f46', '#10b981', '#06b6d4']
  },
  { 
    value: 'rose', 
    label: 'Rose', 
    description: 'Elegant rose gold theme',
    preview: 'bg-gradient-to-br from-rose-50 to-amber-50',
    colors: ['#fff1f2', '#fecaca', '#f43f5e', '#f59e0b']
  },
  { 
    value: 'mint', 
    label: 'Mint', 
    description: 'Fresh mint and teal',
    preview: 'bg-gradient-to-br from-teal-50 to-cyan-100',
    colors: ['#f0fdfa', '#ccfbf1', '#14b8a6', '#0891b2']
  },
  { 
    value: 'cosmic', 
    label: 'Cosmic', 
    description: 'Deep space cosmic theme',
    preview: 'bg-gradient-to-br from-indigo-900 to-purple-900',
    colors: ['#312e81', '#4c1d95', '#8b5cf6', '#a855f7']
  },
  { 
    value: 'fire', 
    label: 'Fire', 
    description: 'Burning fire and ember',
    preview: 'bg-gradient-to-br from-red-500 to-orange-600',
    colors: ['#fef2f2', '#fecaca', '#dc2626', '#ea580c']
  },
  { 
    value: 'ice', 
    label: 'Ice', 
    description: 'Cool ice and frost',
    preview: 'bg-gradient-to-br from-blue-100 to-cyan-100',
    colors: ['#eff6ff', '#dbeafe', '#0ea5e9', '#0891b2']
  },
  { 
    value: 'earth', 
    label: 'Earth', 
    description: 'Natural earth tones',
    preview: 'bg-gradient-to-br from-amber-100 to-orange-100',
    colors: ['#fffbeb', '#fed7aa', '#d97706', '#b45309']
  },
  { 
    value: 'galaxy', 
    label: 'Galaxy', 
    description: 'Mystical galaxy theme',
    preview: 'bg-gradient-to-br from-purple-800 to-pink-600',
    colors: ['#581c87', '#7c3aed', '#ec4899', '#f59e0b']
  },
  { 
    value: 'tropical', 
    label: 'Tropical', 
    description: 'Vibrant tropical paradise',
    preview: 'bg-gradient-to-br from-green-400 to-blue-500',
    colors: ['#dcfce7', '#bbf7d0', '#22c55e', '#3b82f6']
  },
  { 
    value: 'vintage', 
    label: 'Vintage', 
    description: 'Classic vintage sepia tones',
    preview: 'bg-gradient-to-br from-amber-50 to-yellow-100',
    colors: ['#fffbeb', '#fef3c7', '#d97706', '#92400e']
  },
  { 
    value: 'cyber', 
    label: 'Cyber', 
    description: 'Futuristic cyber theme',
    preview: 'bg-gradient-to-br from-gray-800 to-blue-600',
    colors: ['#1f2937', '#374151', '#3b82f6', '#06b6d4']
  },
  { 
    value: 'pastel', 
    label: 'Pastel', 
    description: 'Soft pastel rainbow',
    preview: 'bg-gradient-to-br from-pink-100 to-purple-100',
    colors: ['#fdf2f8', '#f3e8ff', '#ec4899', '#8b5cf6']
  },
  { 
    value: 'monochrome', 
    label: 'Monochrome', 
    description: 'Elegant black and white',
    preview: 'bg-gradient-to-br from-gray-100 to-gray-200',
    colors: ['#f9fafb', '#e5e7eb', '#374151', '#000000']
  }
]

export function getThemeClasses(themeValue: string, customThemes: CustomTheme[] = []): string {
  // First check custom themes
  const customTheme = customThemes.find(t => t.value === themeValue)
  if (customTheme) {
    // For custom themes, return the base gradient class
    // The actual colors will be applied via inline styles
    const result = `bg-gradient-to-br`
    console.log(`getThemeClasses(${themeValue}): custom theme`, result)
    return result
  }
  
  // Then check preset themes
  const theme = themes.find(t => t.value === themeValue)
  const result = theme ? theme.preview : themes[0].preview // fallback to default
  console.log(`getThemeClasses(${themeValue}):`, result)
  return result
}

// Helper function to get custom theme styles
export function getCustomThemeStyles(themeValue: string, customThemes: CustomTheme[] = []): React.CSSProperties | null {
  const customTheme = customThemes.find(t => t.value === themeValue)
  if (customTheme) {
    return {
      background: `linear-gradient(to bottom right, ${customTheme.colors[0]}, ${customTheme.colors[1]})`
    }
  }
  return null
}

export function getTheme(themeValue: string, customThemes: CustomTheme[] = []): Theme | CustomTheme {
  // First check custom themes
  const customTheme = customThemes.find(t => t.value === themeValue)
  if (customTheme) {
    return customTheme
  }
  
  // Then check preset themes
  const theme = themes.find(t => t.value === themeValue)
  return theme || themes[0] // fallback to default
}

// Custom theme creation
export interface CustomTheme {
  value: string
  label: string
  description: string
  preview: string
  colors: string[]
  isCustom: boolean
}

export function createCustomTheme(
  label: string,
  description: string,
  primaryColor: string,
  secondaryColor: string,
  accentColor: string,
  textColor: string
): CustomTheme {
  // Generate a unique value for custom themes
  const value = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  // For custom themes, we'll use inline styles instead of Tailwind classes
  // since Tailwind doesn't generate dynamic classes
  const preview = `bg-gradient-to-br`
  
  return {
    value,
    label,
    description,
    preview,
    colors: [primaryColor, secondaryColor, accentColor, textColor],
    isCustom: true
  }
}

// Theme categories for better organization
export const themeCategories = {
  classic: ['default', 'dark', 'minimal', 'monochrome'],
  vibrant: ['purple', 'green', 'orange', 'ocean', 'sunset', 'tropical'],
  nature: ['forest', 'aurora', 'earth', 'mint', 'lavender'],
  modern: ['neon', 'retro', 'cyber', 'cosmic', 'galaxy'],
  elegant: ['royal', 'cherry', 'rose', 'vintage', 'pastel'],
  bold: ['fire', 'ice', 'midnight', 'coral']
}

export function getThemesByCategory(category: keyof typeof themeCategories): Theme[] {
  return themes.filter(theme => themeCategories[category].includes(theme.value))
}

export function getAllThemeCategories(): (keyof typeof themeCategories)[] {
  return Object.keys(themeCategories) as (keyof typeof themeCategories)[]
}

// Custom theme persistence (now using database)
export async function saveCustomThemes(customThemes: CustomTheme[]): Promise<void> {
  // This function is now handled by the API endpoints
  console.log('Custom themes should be saved via API:', customThemes)
}

export async function loadCustomThemes(): Promise<{ themes: CustomTheme[], usage: { current: number, limit: number, remaining: number } }> {
  if (typeof window === 'undefined') return { themes: [], usage: { current: 0, limit: 10, remaining: 10 } }
  
  try {
    const response = await fetch('/api/user/custom-themes')
    if (response.ok) {
      const data = await response.json()
      console.log('Custom themes loaded from database:', data)
      
      // Convert database format to CustomTheme format
      const customThemes: CustomTheme[] = data.themes.map((dbTheme: any) => ({
        value: `custom-${dbTheme.id}`,
        label: dbTheme.name,
        description: dbTheme.description || '',
        preview: 'bg-gradient-to-br',
        colors: [
          dbTheme.primaryColor,
          dbTheme.secondaryColor,
          dbTheme.accentColor,
          dbTheme.textColor
        ],
        isCustom: true
      }))
      
      return {
        themes: customThemes,
        usage: data.usage
      }
    }
  } catch (error) {
    console.error('Error loading custom themes:', error)
  }
  
  return { themes: [], usage: { current: 0, limit: 10, remaining: 10 } }
}

// Load custom theme for public profile
export async function loadCustomThemeForUser(username: string): Promise<CustomTheme | null> {
  try {
    const response = await fetch(`/api/profile/custom-theme?username=${username}`)
    if (response.ok) {
      const customTheme = await response.json()
      console.log('Custom theme loaded for user:', username, customTheme)
      return customTheme
    }
  } catch (error) {
    console.error('Error loading custom theme for user:', error)
  }
  
  return null
}
