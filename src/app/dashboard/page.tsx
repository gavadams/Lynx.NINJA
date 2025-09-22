"use client"

import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Link as LinkIcon, BarChart3, Eye, ExternalLink, Edit, Trash2, GripVertical, Mail, ArrowRight, Clock, Calendar, AlertCircle, Crown } from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"
import LinkModal from "@/components/link-modal"
import { useInvitations } from "@/hooks/useInvitations"
import { useFeatureFlag } from "@/lib/feature-flags"
import { getLinkScheduleStatus, getLinkDisplayStatus, formatScheduleDate } from "@/lib/link-scheduling"

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

  useEffect(() => {
    fetchData()
  }, [])

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

  const handleDeleteLink = async (linkId: string) => {
    if (!confirm('Are you sure you want to delete this link?')) {
      return
    }

    try {
      const response = await fetch(`/api/links/${linkId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setLinks(prev => prev.filter(link => link.id !== linkId))
      } else {
        const error = await response.json()
        console.error('Error deleting link:', error)
        alert('Failed to delete link. Please try again.')
      }
    } catch (error) {
      console.error('Error deleting link:', error)
      alert('Failed to delete link. Please try again.')
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
          <div className="space-y-3 sm:space-y-4">
            {links.map((link) => (
              <Card key={link.id} className="card-ninja hover:glow-ninja transition-all duration-300">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-move flex-shrink-0 mt-1" />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-heading font-medium text-card-foreground truncate">{link.title}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{link.url}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge variant={
                            getLinkDisplayStatus(link) === 'Active' ? "default" : 
                            getLinkDisplayStatus(link) === 'Scheduled' ? "secondary" :
                            getLinkDisplayStatus(link) === 'Expired' ? "destructive" : "secondary"
                          } className="text-xs">
                            {getLinkDisplayStatus(link)}
                          </Badge>
                          {analyticsEnabled && (
                            <span className="text-xs sm:text-sm text-muted-foreground">
                              {link.clicks || 0} clicks
                            </span>
                          )}
                          {link.password && (
                            <Badge variant="outline" className="text-xs">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Protected
                            </Badge>
                          )}
                        </div>
                        
                        {/* Scheduling Information */}
                        {(link.scheduledAt || link.expiresAt) && (
                          <div className="mt-2 space-y-1">
                            {link.scheduledAt && (
                              <div className="flex items-center space-x-1 text-xs text-gray-500">
                                <Calendar className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">
                                  {getLinkScheduleStatus(link).isScheduled ? 'Goes live' : 'Went live'} {formatScheduleDate(link.scheduledAt)}
                                </span>
                              </div>
                            )}
                            {link.expiresAt && (
                              <div className="flex items-center space-x-1 text-xs text-gray-500">
                                <Clock className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">
                                  {getLinkScheduleStatus(link).isExpired ? 'Expired' : 'Expires'} {formatScheduleDate(link.expiresAt)}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-end sm:justify-start space-x-1 sm:space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(link.url, '_blank')}
                        className="btn-ninja-outline p-2"
                        title="Open link"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setEditingLink(link)}
                        className="btn-ninja-outline p-2"
                        title="Edit link"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-destructive hover:text-destructive-foreground hover:bg-destructive p-2"
                        onClick={() => handleDeleteLink(link.id)}
                        title="Delete link"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
