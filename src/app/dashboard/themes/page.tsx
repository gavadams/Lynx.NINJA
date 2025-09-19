"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Save, Loader2, Palette, Eye, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface UserProfile {
  id: string
  username: string
  displayName: string
  profileImage?: string
  theme: string
  bio?: string
  isPremium: boolean
}

const themes = [
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

export default function ThemesPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState('default')
  const [previewMode, setPreviewMode] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/user/profile')
      
      if (response.ok) {
        const profileData = await response.json()
        setProfile(profileData)
        setSelectedTheme(profileData.theme || 'default')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!profile) return

    setSaving(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...profile,
          theme: selectedTheme
        }),
      })

      if (response.ok) {
        const updatedProfile = await response.json()
        setProfile(updatedProfile)
        // Show success message or redirect
        router.push('/dashboard')
      } else {
        console.error('Failed to save theme')
      }
    } catch (error) {
      console.error('Error saving theme:', error)
    } finally {
      setSaving(false)
    }
  }

  const handlePreview = () => {
    setPreviewMode(!previewMode)
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h1>
          <Button onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Theme Customization</h1>
              <p className="text-gray-600 mt-2">
                Choose a theme that reflects your personal brand
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handlePreview}
                className="flex items-center"
              >
                <Eye className="h-4 w-4 mr-2" />
                {previewMode ? 'Exit Preview' : 'Preview'}
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || selectedTheme === profile.theme}
                className="flex items-center"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {saving ? 'Saving...' : 'Save Theme'}
              </Button>
            </div>
          </div>
        </div>

        {/* Theme Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {themes.map((theme) => (
            <Card
              key={theme.value}
              className={`cursor-pointer transition-all duration-200 ${
                selectedTheme === theme.value
                  ? 'ring-2 ring-blue-500 shadow-lg'
                  : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedTheme(theme.value)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{theme.label}</CardTitle>
                  {selectedTheme === theme.value && (
                    <Badge variant="default" className="text-xs">
                      Selected
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-sm">
                  {theme.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Theme Preview */}
                <div className={`h-24 rounded-lg ${theme.preview} mb-4 relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-white/20 backdrop-blur-sm"></div>
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="bg-white/90 rounded px-2 py-1 text-xs font-medium text-gray-800">
                      {profile.displayName}
                    </div>
                  </div>
                </div>

                {/* Color Palette */}
                <div className="flex space-x-1 mb-3">
                  {theme.colors.map((color, index) => (
                    <div
                      key={index}
                      className="w-6 h-6 rounded-full border border-gray-200"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>

                {/* Theme Info */}
                <div className="text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>Primary</span>
                    <span className="font-mono">{theme.colors[2]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Secondary</span>
                    <span className="font-mono">{theme.colors[3]}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Preview Section */}
        {previewMode && (
          <div className="mt-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="h-5 w-5 mr-2" />
                  Live Preview
                </CardTitle>
                <CardDescription>
                  See how your profile will look with the selected theme
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`min-h-96 rounded-lg ${themes.find(t => t.value === selectedTheme)?.preview} p-8`}>
                  <div className="max-w-md mx-auto text-center">
                    {/* Profile Image */}
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      {profile.profileImage ? (
                        <img
                          src={profile.profileImage}
                          alt={profile.displayName}
                          className="w-24 h-24 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-white">
                          {profile.displayName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Profile Info */}
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      {profile.displayName}
                    </h1>
                    <p className="text-gray-600 mb-4">
                      @{profile.username}
                    </p>
                    {profile.bio && (
                      <p className="text-gray-700 mb-6">
                        {profile.bio}
                      </p>
                    )}

                    {/* Sample Links */}
                    <div className="space-y-3">
                      <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 text-left">
                        <div className="font-medium text-gray-900">Sample Link 1</div>
                        <div className="text-sm text-gray-600">example.com</div>
                      </div>
                      <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 text-left">
                        <div className="font-medium text-gray-900">Sample Link 2</div>
                        <div className="text-sm text-gray-600">another-example.com</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tips */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="h-5 w-5 mr-2" />
                Theme Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Choose Wisely</h4>
                  <p className="text-gray-600">
                    Your theme should reflect your personal brand and be easy to read on all devices.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Preview First</h4>
                  <p className="text-gray-600">
                    Use the preview feature to see how your profile looks before saving changes.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Mobile Friendly</h4>
                  <p className="text-gray-600">
                    All themes are optimized for mobile devices and look great on any screen size.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Easy to Change</h4>
                  <p className="text-gray-600">
                    You can change your theme anytime from this page or the settings page.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
