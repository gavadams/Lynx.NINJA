"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Calendar, 
  Clock, 
  Search, 
  RefreshCw, 
  AlertCircle, 
  Crown,
  ExternalLink,
  User
} from "lucide-react"
import { formatScheduleDate, getLinkScheduleStatus, getLinkDisplayStatus } from "@/lib/link-scheduling"

interface ScheduledLink {
  id: string
  title: string
  url: string
  isActive: boolean
  scheduledAt: string | null
  expiresAt: string | null
  password: string | null
  createdAt: string
  user: {
    id: string
    username: string
    displayName: string
  }
}

export default function ScheduledLinksPage() {
  const [links, setLinks] = useState<ScheduledLink[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<"all" | "scheduled" | "expired" | "active">("all")

  const fetchScheduledLinks = async () => {
    try {
      setLoading(true)
      console.log('Fetching scheduled links from API...')
      const response = await fetch('/api/admin/scheduled-links')
      console.log('API response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('API response data:', { 
          hasLinks: !!data.links, 
          linksCount: data.links?.length || 0, 
          sampleLinks: data.links?.slice(0, 2) 
        })
        setLinks(data.links || [])
      } else {
        const errorText = await response.text()
        console.error('Failed to fetch scheduled links:', response.status, errorText)
      }
    } catch (error) {
      console.error('Error fetching scheduled links:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchScheduledLinks()
  }, [])

  const filteredLinks = links.filter(link => {
    const matchesSearch = 
      link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.user.displayName.toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchesSearch) return false

    switch (filter) {
      case 'scheduled':
        return getLinkScheduleStatus(link).isScheduled
      case 'expired':
        return getLinkScheduleStatus(link).isExpired
      case 'active':
        return getLinkScheduleStatus(link).isActive
      default:
        return true
    }
  })

  const stats = {
    total: links.length,
    scheduled: links.filter(link => getLinkScheduleStatus(link).isScheduled).length,
    expired: links.filter(link => getLinkScheduleStatus(link).isExpired).length,
    active: links.filter(link => getLinkScheduleStatus(link).isActive).length,
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 bg-background dark min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading scheduled links...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 bg-background dark min-h-screen">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground flex items-center">
          <Clock className="h-6 w-6 sm:h-8 sm:w-8 mr-3" />
          Scheduled Links
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage scheduled and expired links across all users
        </p>
      </div>

      <div className="flex items-center justify-end mb-6">
        <Button onClick={fetchScheduledLinks} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="card-ninja hover:glow-ninja transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Links</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-ninja hover:glow-ninja transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Scheduled</p>
                <p className="text-2xl font-bold">{stats.scheduled}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-ninja hover:glow-ninja transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Expired</p>
                <p className="text-2xl font-bold">{stats.expired}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-ninja hover:glow-ninja transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Crown className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="card-ninja hover:glow-ninja transition-all duration-300 mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by title, username, or display name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                onClick={() => setFilter("all")}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={filter === "scheduled" ? "default" : "outline"}
                onClick={() => setFilter("scheduled")}
                size="sm"
              >
                Scheduled
              </Button>
              <Button
                variant={filter === "expired" ? "default" : "outline"}
                onClick={() => setFilter("expired")}
                size="sm"
              >
                Expired
              </Button>
              <Button
                variant={filter === "active" ? "default" : "outline"}
                onClick={() => setFilter("active")}
                size="sm"
              >
                Active
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Links List */}
      <div className="space-y-6">
        {filteredLinks.length === 0 ? (
          <Card className="card-ninja hover:glow-ninja transition-all duration-300">
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No scheduled links found</h3>
              <p className="text-gray-500">
                {searchTerm ? "Try adjusting your search terms" : "No links with scheduling found"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredLinks.map((link) => {
            const status = getLinkScheduleStatus(link)
            const displayStatus = getLinkDisplayStatus(link)

            return (
              <Card key={link.id} className="card-ninja hover:glow-ninja transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{link.title}</h3>
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
                      
                      <p className="text-sm text-gray-600 mb-2">{link.url}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{link.user.displayName} (@{link.user.username})</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>Created {new Date(link.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Scheduling Details */}
                      {(link.scheduledAt || link.expiresAt) && (
                        <div className="mt-3 space-y-1">
                          {link.scheduledAt && (
                            <div className="flex items-center space-x-1 text-sm text-gray-600">
                              <Clock className="h-4 w-4" />
                              <span>
                                {status.isScheduled ? 'Scheduled for' : 'Went live on'} {formatScheduleDate(link.scheduledAt)}
                              </span>
                            </div>
                          )}
                          {link.expiresAt && (
                            <div className="flex items-center space-x-1 text-sm text-gray-600">
                              <AlertCircle className="h-4 w-4" />
                              <span>
                                {status.isExpired ? 'Expired on' : 'Expires on'} {formatScheduleDate(link.expiresAt)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(link.url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
