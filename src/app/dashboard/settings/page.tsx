"use client"

import { useState, useEffect } from "react"

// Extend Window interface for auto-save timeout
declare global {
  interface Window {
    autoSaveTimeout?: NodeJS.Timeout
  }
}
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Save, Loader2, User, Link as LinkIcon } from "lucide-react"
import PremiumFeatures from "@/components/premium-features"
import { DomainManagement } from "@/components/domain-management"
import { EmailCaptureManagement } from "@/components/email-capture-management"
import { MailingListPreferences } from "@/components/mailing-list-preferences"
import { SocialMediaManagement } from "@/components/social-media-management"
import { useFeatureFlag } from "@/lib/feature-flags"
import { getUserProfileUrl } from "@/lib/config"

interface UserProfile {
  id: string
  username: string
  displayName: string
  profileImage?: string
  theme: string
  bio?: string
  isPremium: boolean
  emailCaptureId?: string
  emailCapture?: {
    id: string
    title: string
    description?: string
    buttonText: string
    placeholder: string
    successMessage: string
    isActive: boolean
  }
}


export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<Partial<UserProfile>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [upgrading, setUpgrading] = useState(false)
  const [emailCaptures, setEmailCaptures] = useState<any[]>([])
  const [autoSaving, setAutoSaving] = useState(false)
  
  // Feature flags
  const customDomainsEnabled = useFeatureFlag('customDomains')
  const emailCaptureEnabled = useFeatureFlag('emailCapture')
  const themesEnabled = useFeatureFlag('themes')
  

  useEffect(() => {
    fetchProfile()
    fetchEmailCaptures()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/user/profile')
      
      if (response.ok) {
        const profileData = await response.json()
        setProfile(profileData)
        setFormData(profileData)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEmailCaptures = async () => {
    try {
      const response = await fetch('/api/email-captures')
      if (response.ok) {
        const data = await response.json()
        setEmailCaptures(data.captures || [])
      }
    } catch (error) {
      console.error('Error fetching email captures:', error)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!profile) return

    setSaving(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const updatedProfile = await response.json()
        setProfile(updatedProfile)
        setFormData(updatedProfile)
        alert('Profile updated successfully!')
      } else {
        const error = await response.json()
        setErrors({ general: error.error || 'Failed to update profile' })
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setErrors({ general: 'Failed to update profile' })
    } finally {
      setSaving(false)
    }
  }

  // Auto-save function with debouncing
  const autoSave = async (updates: Partial<UserProfile>, delay: number = 2000) => {
    // Clear existing timeout
    if (window.autoSaveTimeout) {
      clearTimeout(window.autoSaveTimeout)
    }

    // Set new timeout
    window.autoSaveTimeout = setTimeout(async () => {
      setAutoSaving(true)
      try {
        const response = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        })

        if (response.ok) {
          const updatedProfile = await response.json()
          setProfile(updatedProfile)
          console.log('Auto-saved profile changes')
        } else {
          console.error('Failed to auto-save profile')
        }
      } catch (error) {
        console.error('Error auto-saving profile:', error)
      } finally {
        setAutoSaving(false)
      }
    }, delay)
  }

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    const updates = { [field]: value }
    setFormData(prev => ({ ...prev, ...updates }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }

    // Auto-save the change
    autoSave(updates)
  }


  const handleUpgrade = async () => {
    setUpgrading(true)
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
      })

      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url
      } else {
        const error = await response.json()
        setErrors({ general: error.error || 'Failed to start upgrade process' })
      }
    } catch (error) {
      console.error('Error upgrading:', error)
      setErrors({ general: 'Failed to start upgrade process' })
    } finally {
      setUpgrading(false)
    }
  }

  const handleManageBilling = async () => {
    setUpgrading(true)
    try {
      const response = await fetch('/api/stripe/create-portal', {
        method: 'POST',
      })

      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url
      } else {
        const error = await response.json()
        setErrors({ general: error.error || 'Failed to open billing portal' })
      }
    } catch (error) {
      console.error('Error opening billing portal:', error)
      setErrors({ general: 'Failed to open billing portal' })
    } finally {
      setUpgrading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">Failed to load profile settings.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Manage your profile and customize your link page
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Update your personal information and profile details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.profileImage} alt={profile.displayName} />
                <AvatarFallback className="text-2xl">
                  {profile.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm text-gray-500">Profile Picture</p>
                <p className="text-xs text-gray-400">
                  Update your profile picture through your OAuth provider
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={formData.displayName || ''}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  placeholder="Your display name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username || ''}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder="your-username"
                />
                <p className="text-xs text-gray-500">
                  Your public profile will be available at: {getUserProfileUrl(formData.username || 'username')}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio || ''}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell people about yourself..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>


        {/* Public Profile Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <LinkIcon className="h-5 w-5 mr-2" />
              Public Profile Preview
            </CardTitle>
            <CardDescription>
              This is how your profile will appear to visitors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="rounded-lg p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-4"></div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {formData.displayName || 'Your Name'}
                  </h3>
                  <p className="text-gray-600 mb-2">@{formData.username || 'username'}</p>
                  {formData.bio && (
                    <p className="text-sm text-gray-700 mb-4">{formData.bio}</p>
                  )}
                  <div className="text-xs text-gray-500">
                    {getUserProfileUrl(formData.username || 'username')}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Custom Domains */}
        {customDomainsEnabled && (
          <DomainManagement isPremium={profile.isPremium} />
        )}

        {/* Email Capture Forms */}
        {emailCaptureEnabled && (
          <EmailCaptureManagement 
            isPremium={profile.isPremium} 
            selectedEmailCaptureId={formData.emailCaptureId}
            onEmailCaptureSelect={(captureId) => handleInputChange('emailCaptureId', captureId)}
            emailCaptures={emailCaptures}
          />
        )}

        {/* Mailing List Preferences */}
        <MailingListPreferences />

        {/* Social Media Links */}
        <SocialMediaManagement />

        {/* Premium Features */}
        <Card>
          <CardHeader>
            <CardTitle>Premium Features</CardTitle>
            <CardDescription>
              Unlock advanced features with our premium plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PremiumFeatures
              isPremium={profile.isPremium}
              onUpgrade={handleUpgrade}
              onManageBilling={handleManageBilling}
            />
          </CardContent>
        </Card>

        {/* Error Display */}
        {errors.general && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-sm text-red-600">{errors.general}</p>
            </CardContent>
          </Card>
        )}

        {/* Save Button and Auto-save Status */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {autoSaving ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Auto-saving...
              </div>
            ) : (
              <div className="flex items-center">
                <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                All changes saved
              </div>
            )}
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
            </Button>
        </div>
      </form>
    </div>
  )
}