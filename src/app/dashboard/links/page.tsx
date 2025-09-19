"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Edit, Trash2, Eye, EyeOff, QrCode, User } from "lucide-react"
import { QRCodeModal } from "@/components/qr-code-modal"
import { EditLinkModal } from "@/components/edit-link-modal"
import { ProfileQRModal } from "@/components/profile-qr-modal"

interface Link {
  id: string
  title: string
  url: string
  isActive: boolean
  order: number
  clicks: number
  createdAt: string
}

export default function LinksPage() {
  const [links, setLinks] = useState<Link[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [newLink, setNewLink] = useState({ title: "", url: "" })
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [selectedLinkId, setSelectedLinkId] = useState<string>("")
  const [selectedLinkTitle, setSelectedLinkTitle] = useState<string>("")
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedLink, setSelectedLink] = useState<Link | null>(null)
  const [profileQRModalOpen, setProfileQRModalOpen] = useState(false)

  useEffect(() => {
    fetchLinks()
  }, [])

  const fetchLinks = async () => {
    try {
      const response = await fetch("/api/links")
      if (response.ok) {
        const data = await response.json()
        setLinks(data)
      }
    } catch (error) {
      console.error("Error fetching links:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddLink = async () => {
    if (!newLink.title || !newLink.url) return

    try {
      const response = await fetch("/api/links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newLink),
      })

      if (response.ok) {
        const link = await response.json()
        setLinks([...links, link])
        setNewLink({ title: "", url: "" })
        setIsAdding(false)
      }
    } catch (error) {
      console.error("Error adding link:", error)
    }
  }

  const handleEditLink = (linkId: string) => {
    const link = links.find(l => l.id === linkId)
    if (link) {
      setSelectedLink(link)
      setEditModalOpen(true)
    }
  }

  const handleSaveLink = async (linkId: string, updates: { title: string; url: string; isActive: boolean }) => {
    try {
      const response = await fetch(`/api/links/${linkId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        // Update the local state
        setLinks(links.map(link => 
          link.id === linkId 
            ? { ...link, ...updates }
            : link
        ))
      } else {
        throw new Error('Failed to update link')
      }
    } catch (error) {
      console.error("Error updating link:", error)
      throw error
    }
  }

  const handleGenerateQR = (linkId: string, linkTitle: string) => {
    setSelectedLinkId(linkId)
    setSelectedLinkTitle(linkTitle)
    setQrModalOpen(true)
  }

  const handleDeleteLink = async (linkId: string) => {
    if (!confirm("Are you sure you want to delete this link?")) return

    try {
      const response = await fetch(`/api/links/${linkId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setLinks(links.filter(link => link.id !== linkId))
      }
    } catch (error) {
      console.error("Error deleting link:", error)
    }
  }

  const handleToggleActive = async (linkId: string) => {
    const link = links.find(l => l.id === linkId)
    if (!link) return

    try {
      const response = await fetch(`/api/links/${linkId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !link.isActive }),
      })

      if (response.ok) {
        setLinks(links.map(l => 
          l.id === linkId ? { ...l, isActive: !l.isActive } : l
        ))
      }
    } catch (error) {
      console.error("Error toggling link:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Links</h1>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => setProfileQRModalOpen(true)}
            title="Generate QR code for your profile page"
          >
            <User className="h-4 w-4 mr-2" />
            Profile QR
          </Button>
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Link
          </Button>
        </div>
      </div>

      {/* Add Link Form */}
      {isAdding && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Link</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                type="text"
                value={newLink.title}
                onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                placeholder="Enter link title"
              />
            </div>
            <div>
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="url"
                value={newLink.url}
                onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div className="flex space-x-3">
              <Button onClick={handleAddLink} disabled={!newLink.title || !newLink.url}>
                Add Link
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsAdding(false)
                  setNewLink({ title: "", url: "" })
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {links.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No links</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new link.
          </p>
          <div className="mt-6">
            <Button onClick={() => setIsAdding(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Link
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {links.map((link) => (
            <div
              key={link.id}
              className="bg-white shadow rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {link.title.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 prevent-overflow">
                    {link.title}
                  </p>
                  <p className="text-sm text-gray-500 url-break">
                    {link.url}
                  </p>
                  <p className="text-xs text-gray-400">
                    {link.clicks} clicks
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleActive(link.id)}
                  title={link.isActive ? "Hide link" : "Show link"}
                >
                  {link.isActive ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleGenerateQR(link.id, link.title)}
                  title="Generate QR Code"
                >
                  <QrCode className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditLink(link.id)}
                  title="Edit link"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteLink(link.id)}
                  title="Delete link"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        linkId={selectedLinkId}
        linkTitle={selectedLinkTitle}
      />

      {/* Edit Link Modal */}
      <EditLinkModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        link={selectedLink}
        onSave={handleSaveLink}
      />

      {/* Profile QR Code Modal */}
      <ProfileQRModal
        isOpen={profileQRModalOpen}
        onClose={() => setProfileQRModalOpen(false)}
      />
    </div>
  )
}
