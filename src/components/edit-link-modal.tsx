"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Save } from "lucide-react"

interface Link {
  id: string
  title: string
  url: string
  isActive: boolean
  order: number
  clicks: number
  createdAt: string
}

interface EditLinkModalProps {
  isOpen: boolean
  onClose: () => void
  link: Link | null
  onSave: (linkId: string, updates: { title: string; url: string; isActive: boolean }) => Promise<void>
}

export function EditLinkModal({ isOpen, onClose, link, onSave }: EditLinkModalProps) {
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (link) {
      setTitle(link.title)
      setUrl(link.url)
      setIsActive(link.isActive)
      setError("")
    }
  }, [link])

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
      await onSave(link.id, { title: title.trim(), url: url.trim(), isActive })
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
      <Card className="w-full max-w-md mx-4 modal-content">
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
            <input
              type="checkbox"
              id="edit-active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="edit-active" className="text-sm">
              Link is active (visible on your profile)
            </Label>
          </div>
          
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
