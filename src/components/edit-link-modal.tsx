"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { X, Save, Calendar, Clock, AlertCircle, Crown } from "lucide-react"
import { useAutoScroll } from "@/hooks/useAutoScroll"

interface Link {
  id: string
  title: string
  url: string
  isActive: boolean
  order: number
  clicks: number
  createdAt: string
  scheduledAt?: string | null
  expiresAt?: string | null
  password?: string | null
}

interface EditLinkModalProps {
  isOpen: boolean
  onClose: () => void
  link: Link | null
  onSave: (linkId: string, updates: { 
    title: string; 
    url: string; 
    isActive: boolean;
    scheduledAt?: string | null;
    expiresAt?: string | null;
    password?: string | null;
  }) => Promise<void>
  isPremium?: boolean
}

export function EditLinkModal({ isOpen, onClose, link, onSave, isPremium = false }: EditLinkModalProps) {
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [scheduledAt, setScheduledAt] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [password, setPassword] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const { scrollToModalField } = useAutoScroll()

  useEffect(() => {
    if (link) {
      setTitle(link.title)
      setUrl(link.url)
      setIsActive(link.isActive)
      setScheduledAt(link.scheduledAt || null)
      setExpiresAt(link.expiresAt || null)
      setPassword(link.password || null)
      setError("")
    }
  }, [link])

  // Auto-scroll to first edit field when modal opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure modal is fully rendered
      setTimeout(() => {
        scrollToModalField('.edit-link-modal').catch(error => {
          console.warn('Auto-scroll to edit field failed:', error)
        })
      }, 100)
    }
  }, [isOpen, scrollToModalField])

  const handleSave = async () => {
    if (!link) return
    
    if (!title.trim() || !url.trim()) {
      setError("Title and URL are required")
      return
    }

    // Basic URL validation
    try {
      new URL(url)
    } catch {
      setError("Please enter a valid URL (including http:// or https://)")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      await onSave(link.id, { 
        title: title.trim(), 
        url: url.trim(), 
        isActive,
        scheduledAt,
        expiresAt,
        password
      })
      onClose()
    } catch (error) {
      console.error('Error saving link:', error)
      setError('Failed to save link. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || !link) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 edit-link-modal">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Edit Link</CardTitle>
              <CardDescription>
                Update your link details
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter link title"
            />
          </div>
          
          <div>
            <Label htmlFor="edit-url">URL</Label>
            <Input
              id="edit-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="edit-active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="edit-active" className="text-sm">
              Link is active (visible on your profile)
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
                    <Label htmlFor="edit-scheduledAt" className="text-sm flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Schedule to go live</span>
                    </Label>
                    <Input
                      id="edit-scheduledAt"
                      type="datetime-local"
                      value={scheduledAt ? new Date(scheduledAt).toISOString().slice(0, 16) : ''}
                      onChange={(e) => setScheduledAt(e.target.value ? new Date(e.target.value).toISOString() : null)}
                      className="text-sm"
                    />
                    <p className="text-xs text-gray-500">
                      Leave empty to make link live immediately
                    </p>
                  </div>

                  {/* Link Expiration */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-expiresAt" className="text-sm flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>Expires at</span>
                    </Label>
                    <Input
                      id="edit-expiresAt"
                      type="datetime-local"
                      value={expiresAt ? new Date(expiresAt).toISOString().slice(0, 16) : ''}
                      onChange={(e) => setExpiresAt(e.target.value ? new Date(e.target.value).toISOString() : null)}
                      className="text-sm"
                    />
                    <p className="text-xs text-gray-500">
                      Leave empty for no expiration
                    </p>
                  </div>

                  {/* Password Protection */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-password" className="text-sm flex items-center space-x-1">
                      <AlertCircle className="h-4 w-4" />
                      <span>Password protection</span>
                    </Label>
                    <Input
                      id="edit-password"
                      type="password"
                      value={password || ''}
                      onChange={(e) => setPassword(e.target.value || null)}
                      placeholder="Enter password to protect this link"
                      className="text-sm"
                    />
                    <p className="text-xs text-gray-500">
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
          
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
          
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
            <Button 
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
