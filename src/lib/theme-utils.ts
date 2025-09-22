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
  }
]

export function getThemeClasses(themeValue: string): string {
  const theme = themes.find(t => t.value === themeValue)
  const result = theme ? theme.preview : themes[0].preview // fallback to default
  console.log(`getThemeClasses(${themeValue}):`, result)
  return result
}

export function getTheme(themeValue: string): Theme {
  const theme = themes.find(t => t.value === themeValue)
  return theme || themes[0] // fallback to default
}
