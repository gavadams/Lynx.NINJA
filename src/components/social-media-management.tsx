"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, ExternalLink, Save, X } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface SocialMediaLink {
  id: string
  platform: string
  url: string
  displayName?: string
  order: number
  isActive: boolean
}

const SOCIAL_MEDIA_PLATFORMS = [
  { value: 'twitter', label: 'Twitter/X', icon: '𝕏', color: 'bg-black' },
  { value: 'instagram', label: 'Instagram', icon: '📷', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  { value: 'linkedin', label: 'LinkedIn', icon: '💼', color: 'bg-blue-600' },
  { value: 'youtube', label: 'YouTube', icon: '📺', color: 'bg-red-600' },
  { value: 'tiktok', label: 'TikTok', icon: '🎵', color: 'bg-black' },
  { value: 'facebook', label: 'Facebook', icon: '👥', color: 'bg-blue-500' },
  { value: 'github', label: 'GitHub', icon: '💻', color: 'bg-gray-800' },
  { value: 'website', label: 'Website', icon: '🌐', color: 'bg-gray-600' },
  { value: 'discord', label: 'Discord', icon: '💬', color: 'bg-indigo-600' },
  { value: 'twitch', label: 'Twitch', icon: '🎮', color: 'bg-purple-600' },
  { value: 'spotify', label: 'Spotify', icon: '🎵', color: 'bg-green-500' },
  { value: 'snapchat', label: 'Snapchat', icon: '👻', color: 'bg-yellow-400' },
]

export function SocialMediaManagement() {
  const [socialMediaLinks, setSocialMediaLinks] = useState<SocialMediaLink[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLink, setEditingLink] = useState<SocialMediaLink | null>(null)
  const [formData, setFormData] = useState({
    platform: '',
    url: '',
    displayName: '',
    order: 0
  })

  useEffect(() => {
    fetchSocialMediaLinks()
  }, [])

  const fetchSocialMediaLinks = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/social-media')
      if (response.ok) {
        const data = await response.json()
        setSocialMediaLinks(data)
      }
    } catch (error) {
      console.error('Error fetching social media links:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const url = editingLink ? `/api/social-media/${editingLink.id}` : '/api/social-media'
      const method = editingLink ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchSocialMediaLinks()
        setIsDialogOpen(false)
        setEditingLink(null)
        setFormData({ platform: '', url: '', displayName: '', order: 0 })
      } else {
        const error = await response.json()
        alert(`Failed to save: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving social media link:', error)
      alert('Failed to save social media link')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (link: SocialMediaLink) => {
    setEditingLink(link)
    setFormData({
      platform: link.platform,
      url: link.url,
      displayName: link.displayName || '',
      order: link.order
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this social media link?')) {
      return
    }

    try {
      const response = await fetch(`/api/social-media/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchSocialMediaLinks()
      } else {
        alert('Failed to delete social media link')
      }
    } catch (error) {
      console.error('Error deleting social media link:', error)
      alert('Failed to delete social media link')
    }
  }

  const handleAddNew = () => {
    setEditingLink(null)
    setFormData({ platform: '', url: '', displayName: '', order: socialMediaLinks.length })
    setIsDialogOpen(true)
  }

  const getPlatformInfo = (platform: string) => {
    return SOCIAL_MEDIA_PLATFORMS.find(p => p.value === platform) || { value: platform, label: platform, icon: '🔗', color: 'bg-gray-500' }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Social Media Links</CardTitle>
          <CardDescription>Manage your social media links</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Social Media Links</CardTitle>
            <CardDescription>Add social media links to your profile</CardDescription>
          </div>
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add Link
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {socialMediaLinks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No social media links yet</p>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Link
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {socialMediaLinks.map((link) => {
              const platformInfo = getPlatformInfo(link.platform)
              return (
                <div key={link.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${platformInfo.color}`}>
                      <span className="text-lg">{platformInfo.icon}</span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{platformInfo.label}</h3>
                        {link.displayName && (
                          <Badge variant="outline" className="text-xs">
                            {link.displayName}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate max-w-xs">{link.url}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(link.url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(link)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(link.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLink ? 'Edit Social Media Link' : 'Add Social Media Link'}
            </DialogTitle>
            <DialogDescription>
              {editingLink ? 'Update your social media link details' : 'Add a new social media link to your profile'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="platform">Platform</Label>
              <Select value={formData.platform} onValueChange={(value) => setFormData({ ...formData, platform: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a platform" />
                </SelectTrigger>
                <SelectContent>
                  {SOCIAL_MEDIA_PLATFORMS.map((platform) => (
                    <SelectItem key={platform.value} value={platform.value}>
                      <div className="flex items-center space-x-2">
                        <span>{platform.icon}</span>
                        <span>{platform.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://..."
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="displayName">Display Name (Optional)</Label>
              <Input
                id="displayName"
                placeholder="Custom name for this link"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="order">Display Order</Label>
              <Input
                id="order"
                type="number"
                min="0"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.platform || !formData.url}>
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {editingLink ? 'Update' : 'Add'} Link
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
