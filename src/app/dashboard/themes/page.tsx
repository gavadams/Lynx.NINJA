"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save, Loader2, Palette, Eye, ArrowLeft, Plus, Trash2, Settings, Edit2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { 
  themes, 
  themeCategories, 
  getThemesByCategory, 
  getAllThemeCategories,
  createCustomTheme,
  CustomTheme,
  saveCustomThemes,
  loadCustomThemes,
  getCustomThemeStyles
} from "@/lib/theme-utils"

interface UserProfile {
  id: string
  username: string
  displayName: string
  profileImage?: string
  theme: string
  bio?: string
  isPremium: boolean
}


export default function ThemesPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState('default')
  const [previewMode, setPreviewMode] = useState(false)
  const [activeCategory, setActiveCategory] = useState<keyof typeof themeCategories>('classic')
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>([])
  const [themeUsage, setThemeUsage] = useState<{ current: number, limit: number, remaining: number }>({ current: 0, limit: 10, remaining: 10 })
  const [showCustomCreator, setShowCustomCreator] = useState(false)
  const [editingTheme, setEditingTheme] = useState<CustomTheme | null>(null)
  const [customThemeForm, setCustomThemeForm] = useState({
    label: '',
    description: '',
    primaryColor: '#3b82f6',
    secondaryColor: '#1e40af',
    accentColor: '#60a5fa',
    textColor: '#1f2937'
  })

  useEffect(() => {
    fetchProfile()
    // Load custom themes from database
    loadCustomThemes().then((data) => {
      console.log('Loaded custom themes:', data)
      setCustomThemes(data.themes)
      setThemeUsage(data.usage)
    }).catch((error) => {
      console.error('Error loading custom themes:', error)
      setCustomThemes([])
      setThemeUsage({ current: 0, limit: 10, remaining: 10 })
    })
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
      console.log('Saving theme:', selectedTheme, 'for user:', profile.username)
      
      // If it's a custom theme, we need to activate it first
      if (selectedTheme.startsWith('custom-')) {
        const themeId = selectedTheme.replace('custom-', '')
        
        // Activate the custom theme
        const activateResponse = await fetch('/api/user/custom-themes', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: themeId,
            isActive: true
          })
        })

        if (!activateResponse.ok) {
          console.error('Failed to activate custom theme')
          return
        }
      }
      
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

      console.log('Theme save response status:', response.status)

      if (response.ok) {
        const updatedProfile = await response.json()
        console.log('Theme saved successfully:', updatedProfile)
        setProfile(updatedProfile)
        // Show success message or redirect
        router.push('/dashboard')
      } else {
        const errorData = await response.json()
        console.error('Failed to save theme:', errorData)
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

  const handleCreateCustomTheme = async () => {
    if (!customThemeForm.label.trim()) return
    
    // Check if user has reached the limit
    if (themeUsage.remaining <= 0) {
      alert(`You've reached your custom theme limit of ${themeUsage.limit}. Please delete an existing theme to create a new one.`)
      return
    }
    
    try {
      const response = await fetch('/api/user/custom-themes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: customThemeForm.label,
          description: customThemeForm.description,
          primaryColor: customThemeForm.primaryColor,
          secondaryColor: customThemeForm.secondaryColor,
          accentColor: customThemeForm.accentColor,
          textColor: customThemeForm.textColor
        })
      })

      if (response.ok) {
        const newCustomTheme = await response.json()
        // Convert database format to our CustomTheme format
        const customTheme: CustomTheme = {
          value: `custom-${newCustomTheme.id}`,
          label: newCustomTheme.name,
          description: newCustomTheme.description || '',
          preview: 'bg-gradient-to-br',
          colors: [
            newCustomTheme.primaryColor,
            newCustomTheme.secondaryColor,
            newCustomTheme.accentColor,
            newCustomTheme.textColor
          ],
          isCustom: true
        }
        
        const updatedCustomThemes = [...customThemes, customTheme]
        setCustomThemes(updatedCustomThemes)
        setThemeUsage(prev => ({
          current: prev.current + 1,
          limit: prev.limit,
          remaining: prev.remaining - 1
        }))
        setSelectedTheme(customTheme.value)
        setShowCustomCreator(false)
        setCustomThemeForm({
          label: '',
          description: '',
          primaryColor: '#3b82f6',
          secondaryColor: '#1e40af',
          accentColor: '#60a5fa',
          textColor: '#1f2937'
        })
      } else {
        const errorData = await response.json()
        console.error('Failed to create custom theme:', errorData)
        alert(errorData.error || 'Failed to create custom theme')
      }
    } catch (error) {
      console.error('Error creating custom theme:', error)
      alert('Network error. Please try again.')
    }
  }

  const handleDeleteCustomTheme = async (themeValue: string) => {
    try {
      // Extract the theme ID from the value (custom-{id})
      const themeId = themeValue.replace('custom-', '')
      
      const response = await fetch(`/api/user/custom-themes?id=${themeId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const updatedCustomThemes = customThemes.filter(theme => theme.value !== themeValue)
        setCustomThemes(updatedCustomThemes)
        setThemeUsage(prev => ({
          current: prev.current - 1,
          limit: prev.limit,
          remaining: prev.remaining + 1
        }))
        if (selectedTheme === themeValue) {
          setSelectedTheme('default')
        }
      } else {
        console.error('Failed to delete custom theme')
        alert('Failed to delete custom theme')
      }
    } catch (error) {
      console.error('Error deleting custom theme:', error)
      alert('Network error. Please try again.')
    }
  }

  const handleEditCustomTheme = (theme: CustomTheme) => {
    setEditingTheme(theme)
    setCustomThemeForm({
      label: theme.label,
      description: theme.description,
      primaryColor: theme.colors[0],
      secondaryColor: theme.colors[1],
      accentColor: theme.colors[2],
      textColor: theme.colors[3]
    })
    setShowCustomCreator(true)
  }

  const handleUpdateCustomTheme = async () => {
    if (!editingTheme || !customThemeForm.label.trim()) return
    
    try {
      const themeId = editingTheme.value.replace('custom-', '')
      
      const response = await fetch('/api/user/custom-themes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: themeId,
          name: customThemeForm.label,
          description: customThemeForm.description,
          primaryColor: customThemeForm.primaryColor,
          secondaryColor: customThemeForm.secondaryColor,
          accentColor: customThemeForm.accentColor,
          textColor: customThemeForm.textColor
        })
      })

      if (response.ok) {
        const updatedTheme = await response.json()
        // Convert database format to our CustomTheme format
        const customTheme: CustomTheme = {
          value: `custom-${updatedTheme.id}`,
          label: updatedTheme.name,
          description: updatedTheme.description || '',
          preview: 'bg-gradient-to-br',
          colors: [
            updatedTheme.primaryColor,
            updatedTheme.secondaryColor,
            updatedTheme.accentColor,
            updatedTheme.textColor
          ],
          isCustom: true
        }
        
        const updatedCustomThemes = customThemes.map(theme => 
          theme.value === editingTheme.value ? customTheme : theme
        )
        setCustomThemes(updatedCustomThemes)
        
        // If this was the selected theme, update the selection
        if (selectedTheme === editingTheme.value) {
          setSelectedTheme(customTheme.value)
        }
        
        setEditingTheme(null)
        setShowCustomCreator(false)
        setCustomThemeForm({
          label: '',
          description: '',
          primaryColor: '#3b82f6',
          secondaryColor: '#1e40af',
          accentColor: '#60a5fa',
          textColor: '#1f2937'
        })
      } else {
        console.error('Failed to update custom theme')
      }
    } catch (error) {
      console.error('Error updating custom theme:', error)
    }
  }

  const getAllThemes = () => {
    return [...themes, ...customThemes]
  }

  const getCurrentTheme = () => {
    return getAllThemes().find(theme => theme.value === selectedTheme) || themes[0]
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
    <div className="min-h-screen bg-background dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">Theme Customization</h1>
              <p className="text-muted-foreground mt-2">
                Choose from 30+ themes or create your own custom theme
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={handlePreview}
                className="flex items-center btn-ninja-outline w-full sm:w-auto"
              >
                <Eye className="h-4 w-4 mr-2" />
                {previewMode ? 'Exit Preview' : 'Preview'}
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || selectedTheme === profile.theme}
                className="flex items-center btn-ninja glow-ninja w-full sm:w-auto"
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

        {/* Theme Tabs */}
        <Tabs defaultValue="presets" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="presets">Preset Themes</TabsTrigger>
            <TabsTrigger value="custom">Custom Themes</TabsTrigger>
            <TabsTrigger value="creator">Theme Creator</TabsTrigger>
          </TabsList>

          {/* Preset Themes Tab */}
          <TabsContent value="presets" className="space-y-6">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {getAllThemeCategories().map((category) => (
                <Button
                  key={category}
                  variant={activeCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(category)}
                  className="capitalize"
                >
                  {category}
                </Button>
              ))}
        </div>

        {/* Theme Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {getThemesByCategory(activeCategory).map((theme) => (
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
          </TabsContent>

          {/* Custom Themes Tab */}
          <TabsContent value="custom" className="space-y-6">
            {/* Usage Indicator */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-blue-900">Custom Theme Usage</h3>
                    <p className="text-sm text-blue-700">
                      {themeUsage.current} of {themeUsage.limit} themes used
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-900">{themeUsage.remaining}</div>
                    <div className="text-sm text-blue-700">remaining</div>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(themeUsage.current / themeUsage.limit) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {customThemes.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Palette className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">No Custom Themes</h3>
                  <p className="text-gray-500 mb-4">Create your first custom theme using the Theme Creator tab.</p>
                  <Button onClick={() => setShowCustomCreator(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Custom Theme
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {customThemes.filter(theme => theme && theme.colors && Array.isArray(theme.colors)).map((theme) => (
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
                        <div className="flex items-center gap-2">
                          {selectedTheme === theme.value && (
                            <Badge variant="default" className="text-xs">
                              Selected
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditCustomTheme(theme)
                            }}
                            className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700"
                            title="Edit theme"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteCustomTheme(theme.value)
                            }}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            title="Delete theme"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <CardDescription className="text-sm">
                        {theme.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Theme Preview */}
                      <div 
                        className={`h-24 rounded-lg ${theme.preview} mb-4 relative overflow-hidden`}
                        style={theme.isCustom ? getCustomThemeStyles(theme.value, customThemes) || {} : {}}
                      >
                        <div className="absolute inset-0 bg-white/20 backdrop-blur-sm"></div>
                        <div className="absolute bottom-2 left-2 right-2">
                          <div className="bg-white/90 rounded px-2 py-1 text-xs font-medium text-gray-800">
                            {profile.displayName}
                          </div>
                        </div>
                      </div>

                      {/* Color Palette */}
                      <div className="flex space-x-1 mb-3">
                        {(theme.colors || []).map((color, index) => (
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
                          <span className="font-mono">{theme.colors?.[2] || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Secondary</span>
                          <span className="font-mono">{theme.colors?.[3] || 'N/A'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Theme Creator Tab */}
          <TabsContent value="creator" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  {editingTheme ? 'Edit Custom Theme' : 'Custom Theme Creator'}
                </CardTitle>
                <CardDescription>
                  {editingTheme ? 'Edit your custom theme colors and details' : 'Create your own unique theme with custom colors'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="themeLabel">Theme Name</Label>
                      <Input
                        id="themeLabel"
                        value={customThemeForm.label}
                        onChange={(e) => setCustomThemeForm(prev => ({ ...prev, label: e.target.value }))}
                        placeholder="My Custom Theme"
                      />
                    </div>
                    <div>
                      <Label htmlFor="themeDescription">Description</Label>
                      <Input
                        id="themeDescription"
                        value={customThemeForm.description}
                        onChange={(e) => setCustomThemeForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="A beautiful custom theme"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="primaryColor">Primary Color</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="primaryColor"
                          type="color"
                          value={customThemeForm.primaryColor}
                          onChange={(e) => setCustomThemeForm(prev => ({ ...prev, primaryColor: e.target.value }))}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={customThemeForm.primaryColor}
                          onChange={(e) => setCustomThemeForm(prev => ({ ...prev, primaryColor: e.target.value }))}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="secondaryColor">Secondary Color</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="secondaryColor"
                          type="color"
                          value={customThemeForm.secondaryColor}
                          onChange={(e) => setCustomThemeForm(prev => ({ ...prev, secondaryColor: e.target.value }))}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={customThemeForm.secondaryColor}
                          onChange={(e) => setCustomThemeForm(prev => ({ ...prev, secondaryColor: e.target.value }))}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="accentColor">Accent Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="accentColor"
                        type="color"
                        value={customThemeForm.accentColor}
                        onChange={(e) => setCustomThemeForm(prev => ({ ...prev, accentColor: e.target.value }))}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={customThemeForm.accentColor}
                        onChange={(e) => setCustomThemeForm(prev => ({ ...prev, accentColor: e.target.value }))}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="textColor">Text Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="textColor"
                        type="color"
                        value={customThemeForm.textColor}
                        onChange={(e) => setCustomThemeForm(prev => ({ ...prev, textColor: e.target.value }))}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={customThemeForm.textColor}
                        onChange={(e) => setCustomThemeForm(prev => ({ ...prev, textColor: e.target.value }))}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Live Preview */}
                <div>
                  <Label>Live Preview</Label>
                  <div 
                    className="h-32 rounded-lg mt-2 relative overflow-hidden"
                    style={{ 
                      background: `linear-gradient(to bottom right, ${customThemeForm.primaryColor}, ${customThemeForm.secondaryColor})`
                    }}
                  >
                    <div className="absolute inset-0 bg-white/20 backdrop-blur-sm"></div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="bg-white/90 rounded px-3 py-2 text-sm font-medium" style={{ color: customThemeForm.textColor }}>
                        {customThemeForm.label || 'My Custom Theme'}
                      </div>
                    </div>
                  </div>
                </div>

                        {!editingTheme && themeUsage.remaining <= 0 && (
                          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                            <p className="text-sm text-yellow-800">
                              <strong>Theme limit reached:</strong> You've used all {themeUsage.limit} of your custom themes. 
                              Delete an existing theme to create a new one.
                            </p>
                          </div>
                        )}

                        <div className="flex gap-3">
                          {editingTheme && (
                            <Button 
                              variant="outline"
                              onClick={() => {
                                setEditingTheme(null)
                                setShowCustomCreator(false)
                                setCustomThemeForm({
                                  label: '',
                                  description: '',
                                  primaryColor: '#3b82f6',
                                  secondaryColor: '#1e40af',
                                  accentColor: '#60a5fa',
                                  textColor: '#1f2937'
                                })
                              }}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                          )}
                  <Button 
                    onClick={editingTheme ? handleUpdateCustomTheme : handleCreateCustomTheme}
                    disabled={!customThemeForm.label.trim() || (!editingTheme && themeUsage.remaining <= 0)}
                    className={editingTheme ? "flex-1" : "w-full"}
                  >
                    {editingTheme ? (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Update Theme
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Custom Theme
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

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
                <div 
                  className={`min-h-96 rounded-lg ${getCurrentTheme().preview} p-8`}
                  style={getCurrentTheme().isCustom ? getCustomThemeStyles(selectedTheme, customThemes) || {} : {}}
                >
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
                Theme Customization Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">30+ Preset Themes</h4>
                  <p className="text-gray-600">
                    Choose from 6 categories: Classic, Vibrant, Nature, Modern, Elegant, and Bold themes.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Custom Theme Creator</h4>
                  <p className="text-gray-600">
                    Create unlimited custom themes with your own colors and branding.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Live Preview</h4>
                  <p className="text-gray-600">
                    See exactly how your profile will look before saving changes.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Color Harmony</h4>
                  <p className="text-gray-600">
                    Choose colors that work well together for better visual appeal.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Mobile Optimized</h4>
                  <p className="text-gray-600">
                    All themes look great on mobile devices and any screen size.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Easy Management</h4>
                  <p className="text-gray-600">
                    Save, delete, and switch between custom themes anytime.
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
