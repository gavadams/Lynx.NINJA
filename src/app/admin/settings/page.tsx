'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Settings, 
  Save, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Globe,
  Mail,
  Shield,
  Database
} from 'lucide-react'

interface SystemSettings {
  siteName: string
  siteDescription: string
  maxLinksPerUser: number
  maxLinksPerPremiumUser: number
  maxCustomThemesPerUser: number
  maintenanceMode: boolean
  registrationEnabled: boolean
  emailNotifications: boolean
  analyticsRetentionDays: number
  backupFrequency: string
  maxFileUploadSize: number
  logoSize: {
    landingPage: number
    dashboard: number
    authPages: number
    publicProfile: number
  }
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    siteName: 'Lynx.NINJA',
    siteDescription: 'Modern link-in-bio platform',
    maxLinksPerUser: 50,
    maxLinksPerPremiumUser: 500,
    maxCustomThemesPerUser: 10,
    maintenanceMode: false,
    registrationEnabled: true,
    emailNotifications: true,
    analyticsRetentionDays: 365,
    backupFrequency: 'daily',
    maxFileUploadSize: 10485760,
    logoSize: {
      landingPage: 20,
      dashboard: 16,
      authPages: 20,
      publicProfile: 12
    }
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      console.log('🔍 Fetching admin settings...')
      const response = await fetch('/api/admin/settings')
      console.log('🔍 Settings API response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('🔍 Settings API response data:', data)
        
        // Ensure all required properties exist with defaults
        const settingsData = {
          siteName: 'Lynx.NINJA',
          siteDescription: 'Modern link-in-bio platform',
          maxLinksPerUser: 50,
          maxLinksPerPremiumUser: 500,
          maxCustomThemesPerUser: 10,
          maintenanceMode: false,
          registrationEnabled: true,
          emailNotifications: true,
          analyticsRetentionDays: 365,
          backupFrequency: 'daily',
          maxFileUploadSize: 10485760,
          logoSize: {
            landingPage: 20,
            dashboard: 16,
            authPages: 20,
            publicProfile: 12
          },
          ...data.settings,
          logoSize: data.settings.logoSize || {
            landingPage: 20,
            dashboard: 16,
            authPages: 20,
            publicProfile: 12
          }
        }
        console.log('🔍 Final settings data:', settingsData)
        setSettings(settingsData)
      } else {
        const errorData = await response.json()
        console.error('❌ Settings API error:', errorData)
        setMessage({ type: 'error', text: errorData.error || 'Failed to load settings' })
      }
    } catch (error) {
      console.error('❌ Error fetching settings:', error)
      setMessage({ type: 'error', text: 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setMessage(null)
      
      console.log('Saving settings:', settings)
      
      // All settings including logoSize are now saved to database
      console.log('Sending all settings to API:', settings)
      
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      console.log('API response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('API response:', result)
        setMessage({ type: 'success', text: 'Settings saved successfully!' })
        
        // Dispatch event to notify logo components of changes
        if (typeof window !== 'undefined' && settings.logoSize) {
          console.log('Dispatching logoSizeChanged event...')
          window.dispatchEvent(new CustomEvent('logoSizeChanged', { 
            detail: { logoSize: settings.logoSize } 
          }))
          console.log('logoSizeChanged event dispatched')
        }
      } else {
        const error = await response.json()
        console.error('API error:', error)
        setMessage({ type: 'error', text: error.error || 'Failed to save settings' })
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage({ type: 'error', text: 'Network error' })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (key: keyof SystemSettings, value: string | boolean | number) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 bg-background dark min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 bg-background dark min-h-screen">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground flex items-center">
          <Settings className="h-6 w-6 sm:h-8 sm:w-8 mr-3" />
          System Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure global system settings and preferences
        </p>
      </div>

      {message && (
        <Alert className={`mb-6 ${message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card className="card-ninja hover:glow-ninja transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="h-5 w-5 mr-2" />
              General Settings
            </CardTitle>
            <CardDescription>
              Basic site configuration and branding
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                value={settings.siteName || ''}
                onChange={(e) => handleInputChange('siteName', e.target.value)}
                placeholder="Lynx.NINJA"
              />
            </div>
            
            <div>
              <Label htmlFor="siteDescription">Site Description</Label>
              <Input
                id="siteDescription"
                value={settings.siteDescription || ''}
                onChange={(e) => handleInputChange('siteDescription', e.target.value)}
                placeholder="Modern link-in-bio platform"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="registrationEnabled">Allow New Registrations</Label>
                <p className="text-sm text-gray-500">Allow new users to sign up</p>
              </div>
              <Switch
                id="registrationEnabled"
                checked={settings.registrationEnabled}
                onCheckedChange={(checked) => handleInputChange('registrationEnabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                <p className="text-sm text-gray-500">Put the site in maintenance mode</p>
              </div>
              <Switch
                id="maintenanceMode"
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => handleInputChange('maintenanceMode', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Logo Size Settings */}
        <Card className="card-ninja hover:glow-ninja transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="h-5 w-5 mr-2" />
              Logo Size Settings
            </CardTitle>
            <CardDescription>
              Adjust logo sizes across different pages
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="landingPageLogo">Landing Page Logo Size</Label>
              <Input
                id="landingPageLogo"
                type="number"
                min="1"
                max="32"
                value={settings.logoSize?.landingPage || 20}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  logoSize: { ...prev.logoSize, landingPage: parseInt(e.target.value) || 20 }
                }))}
                placeholder="20"
              />
              <p className="text-sm text-gray-500">Height in rem units (1-32)</p>
            </div>
            
            <div>
              <Label htmlFor="dashboardLogo">Dashboard Logo Size</Label>
              <Input
                id="dashboardLogo"
                type="number"
                min="1"
                max="32"
                value={settings.logoSize?.dashboard || 16}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  logoSize: { ...prev.logoSize, dashboard: parseInt(e.target.value) || 16 }
                }))}
                placeholder="16"
              />
              <p className="text-sm text-gray-500">Height in rem units (1-32)</p>
            </div>

            <div>
              <Label htmlFor="authPagesLogo">Auth Pages Logo Size</Label>
              <Input
                id="authPagesLogo"
                type="number"
                min="1"
                max="32"
                value={settings.logoSize?.authPages || 20}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  logoSize: { ...prev.logoSize, authPages: parseInt(e.target.value) || 20 }
                }))}
                placeholder="20"
              />
              <p className="text-sm text-gray-500">Height in rem units (1-32)</p>
            </div>

            <div>
              <Label htmlFor="publicProfileLogo">Public Profile Logo Size</Label>
              <Input
                id="publicProfileLogo"
                type="number"
                min="1"
                max="32"
                value={settings.logoSize?.publicProfile || 12}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  logoSize: { ...prev.logoSize, publicProfile: parseInt(e.target.value) || 12 }
                }))}
                placeholder="12"
              />
              <p className="text-sm text-gray-500">Height in rem units (1-32)</p>
            </div>
            
            <div className="pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  console.log('Testing logo size change...')
                  if (settings.logoSize) {
                    saveLogoSizeSettings(settings.logoSize)
                    console.log('Dispatching test logoSizeChanged event...')
                    window.dispatchEvent(new CustomEvent('logoSizeChanged', { 
                      detail: { logoSize: settings.logoSize } 
                    }))
                    console.log('Test logoSizeChanged event dispatched')
                    setMessage({ type: 'success', text: 'Logo sizes updated! Check other pages.' })
                  }
                }}
                className="w-full"
              >
                Logo Size Change
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security & Limits */}
        <Card className="card-ninja hover:glow-ninja transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Security & Limits
            </CardTitle>
            <CardDescription>
              Configure security settings and rate limits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="maxLinksPerUser">Max Links Per User</Label>
              <Input
                id="maxLinksPerUser"
                type="number"
                value={settings.maxLinksPerUser || 50}
                onChange={(e) => handleInputChange('maxLinksPerUser', parseInt(e.target.value) || 0)}
                placeholder="50"
              />
            </div>

            <div>
              <Label htmlFor="maxLinksPerPremiumUser">Max Links Per Premium User</Label>
              <Input
                id="maxLinksPerPremiumUser"
                type="number"
                value={settings.maxLinksPerPremiumUser || 500}
                onChange={(e) => handleInputChange('maxLinksPerPremiumUser', parseInt(e.target.value) || 0)}
                placeholder="500"
              />
            </div>

            <div>
              <Label htmlFor="maxCustomThemesPerUser">Max Custom Themes Per User</Label>
              <Input
                id="maxCustomThemesPerUser"
                type="number"
                min="1"
                max="50"
                value={settings.maxCustomThemesPerUser || 10}
                onChange={(e) => handleInputChange('maxCustomThemesPerUser', parseInt(e.target.value) || 10)}
                placeholder="10"
              />
              <p className="text-sm text-gray-500">Limit the number of custom themes each user can create</p>
            </div>

            <div>
              <Label htmlFor="analyticsRetentionDays">Analytics Retention (days)</Label>
              <Input
                id="analyticsRetentionDays"
                type="number"
                value={settings.analyticsRetentionDays || 365}
                onChange={(e) => handleInputChange('analyticsRetentionDays', parseInt(e.target.value) || 365)}
                placeholder="365"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="emailNotifications">Email Notifications</Label>
                <p className="text-sm text-gray-500">Enable email notifications</p>
              </div>
              <Switch
                id="emailNotifications"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => handleInputChange('emailNotifications', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Database Settings */}
        <Card className="card-ninja hover:glow-ninja transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2" />
              Database Settings
            </CardTitle>
            <CardDescription>
              Database maintenance and optimization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Database Status</Label>
                <p className="text-sm text-gray-500">Current database health</p>
              </div>
              <div className="flex items-center text-green-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                <span className="text-sm">Healthy</span>
              </div>
            </div>

            <div>
              <Label htmlFor="backupFrequency">Backup Frequency</Label>
              <Input
                id="backupFrequency"
                value={settings.backupFrequency || 'daily'}
                onChange={(e) => handleInputChange('backupFrequency', e.target.value)}
                placeholder="daily"
              />
            </div>

            <div>
              <Label htmlFor="maxFileUploadSize">Max File Upload Size (bytes)</Label>
              <Input
                id="maxFileUploadSize"
                type="number"
                value={settings.maxFileUploadSize || 10485760}
                onChange={(e) => handleInputChange('maxFileUploadSize', parseInt(e.target.value) || 0)}
                placeholder="10485760"
              />
            </div>

            <Button variant="outline" className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Optimize Database
            </Button>

            <Button variant="outline" className="w-full">
              <Database className="h-4 w-4 mr-2" />
              Backup Database
            </Button>
          </CardContent>
        </Card>

        {/* Email Settings */}
        <Card className="card-ninja hover:glow-ninja transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              Email Settings
            </CardTitle>
            <CardDescription>
              Email service configuration and testing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Service Status</Label>
                <p className="text-sm text-gray-500">Current email service health</p>
              </div>
              <div className="flex items-center text-green-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                <span className="text-sm">Connected</span>
              </div>
            </div>

            <Button variant="outline" className="w-full">
              <Mail className="h-4 w-4 mr-2" />
              Test Email Service
            </Button>

            <Button variant="outline" className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Email Queue
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="mt-8 flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="min-w-[120px]"
        >
          {saving ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
