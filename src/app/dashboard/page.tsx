"use client"

import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Link as LinkIcon, BarChart3, Eye, EyeOff, ExternalLink, Edit, Trash2, GripVertical, Mail, ArrowRight, Clock, Calendar, AlertCircle, Crown } from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"
import LinkModal from "@/components/link-modal"
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
import { useInvitations } from "@/hooks/useInvitations"
import { useFeatureFlag } from "@/lib/feature-flags"
import { getLinkScheduleStatus, getLinkDisplayStatus, formatScheduleDate } from "@/lib/link-scheduling"

// Sortable Link Item Component for Dashboard
function SortableLinkItem({ 
  link, 
  onEdit, 
  onDelete, 
  onToggleActive 
}: {
  link: Link
  onEdit: (link: Link) => void
  onDelete: (linkId: string) => void
  onToggleActive: (linkId: string) => void
}) {
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

  const status = getLinkScheduleStatus(link)
  const displayStatus = getLinkDisplayStatus(link)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <div
          {...attributes}
          {...listeners}
          className="cursor-move p-1 hover:bg-gray-100 rounded"
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-medium text-gray-900 truncate">{link.title}</h3>
            <Badge variant={
              displayStatus === 'Active' ? "default" : 
              displayStatus === 'Scheduled' ? "secondary" :
              displayStatus === 'Expired' ? "destructive" : "secondary"
            }>
              {displayStatus}
            </Badge>
            {link.password && (
              <Badge variant="outline" className="text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                Protected
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500 truncate">{link.url}</p>
          <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
            <span>{link.clicks} clicks</span>
            {link.scheduledAt && (
              <span className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>
                  {status.isScheduled ? 'Scheduled for' : 'Went live on'} {formatScheduleDate(link.scheduledAt)}
                </span>
              </span>
            )}
            {link.expiresAt && (
              <span className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>
                  {status.isExpired ? 'Expired on' : 'Expires on'} {formatScheduleDate(link.expiresAt)}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-2 ml-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleActive(link.id)}
          className="text-gray-500 hover:text-gray-700"
        >
          {link.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(link)}
          className="text-gray-500 hover:text-gray-700"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(link.id)}
          className="text-gray-500 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

interface Link {
  id: string
  title: string
  url: string
  isActive: boolean
  clicks: number
  order: number
  createdAt: string
  scheduledAt?: string | null
  expiresAt?: string | null
  password?: string | null
}

interface UserProfile {
  id: string
  username: string
  displayName: string
  profileImage?: string
  theme: string
  bio?: string
  isPremium?: boolean
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [links, setLinks] = useState<Link[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddLink, setShowAddLink] = useState(false)
  const [editingLink, setEditingLink] = useState<Link | null>(null)
  const [analytics, setAnalytics] = useState<any>(null)
  const { invitationCount, invitations } = useInvitations()
  const teamsEnabled = useFeatureFlag('teams')
  const analyticsEnabled = useFeatureFlag('analytics')

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    fetchData()
  }, [])

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = links.findIndex((link) => link.id === active.id)
      const newIndex = links.findIndex((link) => link.id === over.id)

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
          // Revert the change if the API call failed
          setLinks(links)
        }
      } catch (error) {
        console.error('Error reordering links:', error)
        // Revert the change if there was an error
        setLinks(links)
      }
    }
  }

  const handleEditLink = (link: Link) => {
    setEditingLink(link)
    setShowAddLink(true)
  }

  const handleDeleteLink = async (linkId: string) => {
    if (confirm('Are you sure you want to delete this link?')) {
      try {
        const response = await fetch(`/api/links/${linkId}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          setLinks(links.filter(link => link.id !== linkId))
        } else {
          console.error('Failed to delete link')
        }
      } catch (error) {
        console.error('Error deleting link:', error)
      }
    }
  }

  const handleToggleActive = async (linkId: string) => {
    const link = links.find(l => l.id === linkId)
    if (!link) return

    try {
      const response = await fetch(`/api/links/${linkId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !link.isActive
        }),
      })

      if (response.ok) {
        setLinks(links.map(l => 
          l.id === linkId ? { ...l, isActive: !l.isActive } : l
        ))
      } else {
        console.error('Failed to toggle link status')
      }
    } catch (error) {
      console.error('Error toggling link status:', error)
    }
  }

         const fetchData = async () => {
           try {
             setLoading(true)
             
             // Fetch user profile
             const profileResponse = await fetch('/api/user/profile')
             if (profileResponse.ok) {
               const profileData = await profileResponse.json()
               setProfile(profileData)
             }

             // Fetch links
             const linksResponse = await fetch('/api/links')
             if (linksResponse.ok) {
               const linksData = await linksResponse.json()
               setLinks(linksData)
             }

             // Fetch analytics if enabled
             if (analyticsEnabled) {
               console.log('🔍 Fetching analytics data...')
               const analyticsResponse = await fetch('/api/analytics')
               console.log('📊 Analytics response status:', analyticsResponse.status)
               if (analyticsResponse.ok) {
                 const analyticsData = await analyticsResponse.json()
                 console.log('📈 Analytics data received:', analyticsData)
                 setAnalytics(analyticsData)
               } else {
                 const errorText = await analyticsResponse.text()
                 console.error('❌ Analytics fetch failed:', errorText)
               }
             } else {
               console.log('⚠️ Analytics feature is disabled')
             }
           } catch (error) {
             console.error('Error fetching data:', error)
           } finally {
             setLoading(false)
           }
         }

  const totalClicks = analytics?.totalClicks || links.reduce((sum, link) => sum + (link.clicks || 0), 0)
  const profileViews = analytics?.totalProfileViews || 0

  const handleSaveLink = async (linkData: Link) => {
    try {
      const url = linkData.id ? `/api/links/${linkData.id}` : '/api/links'
      const method = linkData.id ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(linkData),
      })

      if (response.ok) {
        const savedLink = await response.json()
        
        if (linkData.id) {
          // Update existing link
          setLinks(prev => prev.map(link => 
            link.id === linkData.id ? savedLink : link
          ))
        } else {
          // Add new link
          setLinks(prev => [...prev, savedLink])
        }
        
        setShowAddLink(false)
        setEditingLink(null)
      } else {
        const error = await response.json()
        console.error('Error saving link:', error)
        alert('Failed to save link. Please try again.')
      }
    } catch (error) {
      console.error('Error saving link:', error)
      alert('Failed to save link. Please try again.')
    }
  }


  const stats = [
    { name: "Total Links", value: links.length.toString(), icon: LinkIcon },
    ...(analyticsEnabled ? [{ name: "Total Clicks", value: totalClicks.toString(), icon: BarChart3 }] : []),
    ...(analyticsEnabled ? [{ name: "Profile Views", value: profileViews.toString(), icon: Eye }] : []),
  ]

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 bg-background dark min-h-screen">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Link with stealth and style
        </p>
      </div>

      {/* Invitation Notification Banner - Only show if teams are enabled */}
      {teamsEnabled && invitationCount > 0 && (
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <Mail className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <strong>You have {invitationCount} pending team invitation{invitationCount > 1 ? 's' : ''}!</strong>
                <p className="text-sm mt-1">
                  {invitations.length > 0 && invitations[0]?.Team?.name && (
                    <>Latest: {invitations[0].Team.name}</>
                  )}
                </p>
              </div>
              <Link href="/dashboard/teams/invitations">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  View Invitations
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-6 sm:mb-8">
        {stats.map((stat) => (
          <Card key={stat.name} className="card-ninja hover:glow-ninja transition-all duration-300">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div className="ml-3 sm:ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                      {stat.name}
                    </dt>
                    <dd className="text-base sm:text-lg font-heading font-bold text-card-foreground">
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Links Management */}
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h2 className="text-lg sm:text-xl font-heading font-semibold text-foreground">Your Links</h2>
          <Button onClick={() => setShowAddLink(true)} className="btn-ninja glow-ninja w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add New Link
          </Button>
        </div>

        {links.length === 0 ? (
          <Card className="card-ninja">
            <CardContent className="p-6 text-center">
              <LinkIcon className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-heading font-medium text-card-foreground mb-2">No links yet</h3>
              <p className="text-muted-foreground mb-4">
                Get started by adding your first link to your bio page.
              </p>
              <Button onClick={() => setShowAddLink(true)} className="btn-ninja glow-ninja">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Link
              </Button>
            </CardContent>
          </Card>
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
              <div className="space-y-3 sm:space-y-4">
                {links.map((link) => (
                  <SortableLinkItem
                    key={link.id}
                    link={link}
                    onEdit={handleEditLink}
                    onDelete={handleDeleteLink}
                    onToggleActive={handleToggleActive}
                  />
            ))}
          </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Link Modals */}
             <LinkModal
               isOpen={showAddLink}
               onClose={() => setShowAddLink(false)}
               onSave={handleSaveLink as any}
               isPremium={profile?.isPremium || false}
             />
             
             <LinkModal
               isOpen={!!editingLink}
               onClose={() => setEditingLink(null)}
               onSave={handleSaveLink as any}
               link={editingLink}
               isPremium={profile?.isPremium || false}
             />
    </div>
  )
}
