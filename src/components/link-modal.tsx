"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { X, ExternalLink, Save, Loader2, Calendar, Clock, AlertCircle, Crown } from "lucide-react"

interface Link {
  id?: string
  title: string
  url: string
  isActive: boolean
  clickCount?: number
  order?: number
  createdAt?: string
  scheduledAt?: string | null
  expiresAt?: string | null
  password?: string | null
}

interface LinkModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (link: Link) => void
  link?: Link | null
  loading?: boolean
  isPremium?: boolean
}

export default function LinkModal({ isOpen, onClose, onSave, link, loading = false, isPremium = false }: LinkModalProps) {
  const [formData, setFormData] = useState<Link>({
    title: link?.title || '',
    url: link?.url || '',
    isActive: link?.isActive ?? true,
    scheduledAt: link?.scheduledAt || null,
    expiresAt: link?.expiresAt || null,
    password: link?.password || null,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    if (link) {
      setFormData({
        title: link.title || '',
        url: link.url || '',
        isActive: link.isActive ?? true,
        scheduledAt: link.scheduledAt || null,
        expiresAt: link.expiresAt || null,
        password: link.password || null,
      })
      // For existing links, show advanced if they have advanced features
      setShowAdvanced(!!(link.scheduledAt || link.expiresAt || link.password))
    } else {
      setFormData({
        title: '',
        url: '',
        isActive: true,
        scheduledAt: null,
        expiresAt: null,
        password: null,
      })
      // For new links, show advanced options by default for premium users
      setShowAdvanced(isPremium)
    }
  }, [link, isOpen, isPremium])


  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (!formData.url.trim()) {
      newErrors.url = 'URL is required'
    } else {
      try {
        new URL(formData.url)
      } catch {
        newErrors.url = 'Please enter a valid URL'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Error saving link:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof Link, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto modal-content">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 sticky top-0 bg-background z-10">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg sm:text-xl">{link ? 'Edit Link' : 'Add New Link'}</CardTitle>
            <CardDescription className="text-sm">
              {link ? 'Update your link details' : 'Create a new link for your bio page'}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="flex-shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., My Portfolio"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL *</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => handleInputChange('url', e.target.value)}
                placeholder="https://example.com"
                className={errors.url ? 'border-red-500' : ''}
              />
              {errors.url && (
                <p className="text-sm text-red-500">{errors.url}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleInputChange('isActive', checked)}
              />
              <Label htmlFor="isActive" className="text-sm">
                Active (visible on your profile)
              </Label>
            </div>

            {/* Advanced Features (Premium) */}
            {isPremium && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Crown className="h-4 w-4 text-yellow-500" />
                    <Label className="text-sm font-medium">Advanced Features</Label>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    {showAdvanced ? 'Hide' : 'Show'} Advanced
                  </Button>
                </div>

                {showAdvanced && (
                  <div className="space-y-4">
                    {/* Link Scheduling */}
                    <div className="space-y-2">
                      <Label htmlFor="scheduledAt" className="text-sm flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Schedule to go live</span>
                      </Label>
                      <Input
                        id="scheduledAt"
                        type="datetime-local"
                        value={formData.scheduledAt ? new Date(formData.scheduledAt).toISOString().slice(0, 16) : ''}
                        onChange={(e) => handleInputChange('scheduledAt', e.target.value ? new Date(e.target.value).toISOString() : '')}
                        className="text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Leave empty to make link live immediately
                      </p>
                    </div>

                    {/* Link Expiration */}
                    <div className="space-y-2">
                      <Label htmlFor="expiresAt" className="text-sm flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>Expires at</span>
                      </Label>
                      <Input
                        id="expiresAt"
                        type="datetime-local"
                        value={formData.expiresAt ? new Date(formData.expiresAt).toISOString().slice(0, 16) : ''}
                        onChange={(e) => handleInputChange('expiresAt', e.target.value ? new Date(e.target.value).toISOString() : '')}
                        className="text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Leave empty for no expiration
                      </p>
                    </div>

                    {/* Password Protection */}
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm flex items-center space-x-1">
                        <AlertCircle className="h-4 w-4" />
                        <span>Password protection</span>
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password || ''}
                        onChange={(e) => handleInputChange('password', e.target.value || '')}
                        placeholder="Enter password to protect this link"
                        className="text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Visitors will need this password to access the link
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Premium Feature Notice */}
            {!isPremium && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Crown className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">Premium Features</span>
                </div>
                <p className="text-xs text-yellow-700 mt-1">
                  Link scheduling, expiration, and password protection are available with Premium.
                </p>
              </div>
            )}

            {formData.url && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                <div className="flex items-center space-x-2">
                  <Badge variant={formData.isActive ? "default" : "secondary"}>
                    {formData.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <span className="text-sm font-medium prevent-overflow">{formData.title}</span>
                  <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
                <p className="text-xs text-muted-foreground mt-1 url-break">{formData.url}</p>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || loading}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {link ? 'Update' : 'Create'} Link
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
