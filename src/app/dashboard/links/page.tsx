"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

// Extend Window interface for auto-save timeouts
declare global {
  interface Window {
    [key: string]: NodeJS.Timeout | undefined
  }
}
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Edit, Trash2, Eye, EyeOff, QrCode, User, GripVertical } from "lucide-react"
import { QRCodeModal } from "@/components/qr-code-modal"
import { EditLinkModal } from "@/components/edit-link-modal"
import { ProfileQRModal } from "@/components/profile-qr-modal"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Link {
  id: string
  title: string
  url: string
  isActive: boolean
  order: number
  clicks: number
  createdAt: string
}

// Sortable Link Item Component
function SortableLinkItem({ 
  link, 
  onEdit, 
  onDelete, 
  onToggleActive, 
  onGenerateQR,
  onAutoSave
}: {
  link: Link
  onEdit: (linkId: string) => void
  onDelete: (linkId: string) => void
  onToggleActive: (linkId: string) => void
  onGenerateQR: (linkId: string, linkTitle: string) => void
  onAutoSave: (linkId: string, updates: Partial<Link>, delay?: number) => void
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingUrl, setIsEditingUrl] = useState(false)
  const [editTitle, setEditTitle] = useState(link.title)
  const [editUrl, setEditUrl] = useState(link.url)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleTitleSave = () => {
    if (editTitle !== link.title && editTitle.trim()) {
      onAutoSave(link.id, { title: editTitle.trim() })
    }
    setIsEditingTitle(false)
  }

  const handleUrlSave = () => {
    if (editUrl !== link.url && editUrl.trim()) {
      onAutoSave(link.id, { url: editUrl.trim() })
    }
    setIsEditingUrl(false)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave()
    } else if (e.key === 'Escape') {
      setEditTitle(link.title)
      setIsEditingTitle(false)
    }
  }

  const handleUrlKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUrlSave()
    } else if (e.key === 'Escape') {
      setEditUrl(link.url)
      setIsEditingUrl(false)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white shadow rounded-lg p-3 sm:p-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
          <div 
            className="flex-shrink-0 cursor-grab active:cursor-grabbing mt-1"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-shrink-0">
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gray-200 rounded flex items-center justify-center">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                {link.title.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            {isEditingTitle ? (
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyDown}
                className="text-sm font-medium h-8 text-base"
                autoFocus
              />
            ) : (
              <p 
                className="text-sm sm:text-base font-medium text-gray-900 prevent-overflow cursor-pointer hover:bg-gray-50 p-1 rounded truncate"
                onClick={() => setIsEditingTitle(true)}
                title="Click to edit title"
              >
                {link.title}
              </p>
            )}
            {isEditingUrl ? (
              <Input
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                onBlur={handleUrlSave}
                onKeyDown={handleUrlKeyDown}
                className="text-sm text-muted-foreground h-8 mt-1 text-base"
                autoFocus
              />
            ) : (
              <p 
                className="text-xs sm:text-sm text-muted-foreground url-break cursor-pointer hover:bg-muted p-1 rounded truncate"
                onClick={() => setIsEditingUrl(true)}
                title="Click to edit URL"
              >
                {link.url}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {link.clicks} clicks
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end sm:justify-start space-x-1 sm:space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleActive(link.id)}
            title={link.isActive ? "Hide link" : "Show link"}
            className="p-2"
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
            onClick={() => onGenerateQR(link.id, link.title)}
            title="Generate QR Code"
            className="p-2"
          >
            <QrCode className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(link.id)}
            title="Edit link"
            className="p-2"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(link.id)}
            title="Delete link"
            className="p-2"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function LinksPage() {
  const { data: session } = useSession()
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
  const [userProfile, setUserProfile] = useState<{ isPremium: boolean } | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    fetchLinks()
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const profile = await response.json()
        setUserProfile(profile)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

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

  // Auto-save function with debouncing
  const autoSave = async (linkId: string, updates: Partial<Link>, delay: number = 1000) => {
    // Clear existing timeout for this link
    const timeoutKey = `autoSave_${linkId}`
    if (window[timeoutKey]) {
      clearTimeout(window[timeoutKey])
    }

    // Set new timeout
    window[timeoutKey] = setTimeout(async () => {
      try {
        const response = await fetch(`/api/links/${linkId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updates),
        })

        if (response.ok) {
          console.log(`Auto-saved changes for link ${linkId}`)
        } else {
          console.error(`Failed to auto-save link ${linkId}`)
        }
      } catch (error) {
        console.error(`Error auto-saving link ${linkId}:`, error)
      }
    }, delay)
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

    // Update local state immediately for better UX
    setLinks(links.map(l => 
      l.id === linkId ? { ...l, isActive: !l.isActive } : l
    ))

    // Auto-save the change
    autoSave(linkId, { isActive: !link.isActive }, 500)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = links.findIndex(link => link.id === active.id)
      const newIndex = links.findIndex(link => link.id === over.id)

      const newLinks = arrayMove(links, oldIndex, newIndex)
      setLinks(newLinks)

      // Update the order in the database
      try {
        const response = await fetch('/api/links/reorder', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            linkIds: newLinks.map(link => link.id)
          }),
        })

        if (!response.ok) {
          console.error('Failed to reorder links')
          // Revert the local state if the API call failed
          setLinks(links)
        }
      } catch (error) {
        console.error('Error reordering links:', error)
        // Revert the local state if the API call failed
        setLinks(links)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 bg-background dark min-h-screen">
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
    <div className="p-4 sm:p-6 bg-background dark min-h-screen">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">Links</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            variant="outline" 
            onClick={() => setProfileQRModalOpen(true)}
            title="Generate QR code for your profile page"
            className="w-full sm:w-auto btn-ninja-outline"
          >
            <User className="h-4 w-4 mr-2" />
            Profile QR
          </Button>
          <Button onClick={() => setIsAdding(true)} className="w-full sm:w-auto btn-ninja glow-ninja">
            <Plus className="h-4 w-4 mr-2" />
            Add Link
          </Button>
        </div>
      </div>

      {/* Add Link Form */}
      {isAdding && (
        <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Link</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-sm font-medium">Title</Label>
              <Input
                id="title"
                type="text"
                value={newLink.title}
                onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                placeholder="Enter link title"
                className="text-base"
              />
            </div>
            <div>
              <Label htmlFor="url" className="text-sm font-medium">URL</Label>
              <Input
                id="url"
                type="url"
                value={newLink.url}
                onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                placeholder="https://example.com"
                className="text-base"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleAddLink} 
                disabled={!newLink.title || !newLink.url}
                className="w-full sm:w-auto"
              >
                Add Link
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsAdding(false)
                  setNewLink({ title: "", url: "" })
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {links.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-muted-foreground">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-foreground">No links</h3>
          <p className="mt-1 text-sm text-muted-foreground">
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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={links.map(link => link.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {links.map((link) => (
                <SortableLinkItem
                  key={link.id}
                  link={link}
                  onEdit={handleEditLink}
                  onDelete={handleDeleteLink}
                  onToggleActive={handleToggleActive}
                  onGenerateQR={handleGenerateQR}
                  onAutoSave={autoSave}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
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
        isPremium={userProfile?.isPremium || false}
      />

      {/* Profile QR Code Modal */}
      <ProfileQRModal
        isOpen={profileQRModalOpen}
        onClose={() => setProfileQRModalOpen(false)}
      />
    </div>
  )
}
