'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Shield,
  AlertTriangle,
  Eye,
  MoreHorizontal,
  Play,
  Pause,
  Trash2,
  UserX,
  Link as LinkIcon,
  Users,
  MousePointer,
  Crown,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface FlaggedLink {
  id: string
  title: string
  url: string
  isActive: boolean
  clickCount: number
  createdAt: string
  User: {
    id: string
    username: string
    displayName: string
    email: string
  }
}

interface FlaggedUser {
  id: string
  username: string
  displayName: string
  email: string
  bio?: string
  createdAt: string
  isPremium: boolean
}

interface HighClickLink {
  id: string
  title: string
  url: string
  clickCount: number
  createdAt: string
  User: {
    id: string
    username: string
    displayName: string
  }
}

interface ProlificUser {
  id: string
  username: string
  displayName: string
  email: string
  createdAt: string
  linkCount: number
}

interface ModerationData {
  flaggedLinks: FlaggedLink[]
  flaggedUsers: FlaggedUser[]
  highClickLinks: HighClickLink[]
  prolificUsers: ProlificUser[]
  stats: {
    totalLinks: number
    totalUsers: number
    activeLinks: number
    premiumUsers: number
    flaggedLinks: number
    flaggedUsers: number
  }
}

export default function ModerationPage() {
  const [data, setData] = useState<ModerationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    fetchModerationData()
  }, [])

  const fetchModerationData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/admin/moderation')
      const moderationData = await response.json()

      if (response.ok) {
        setData(moderationData)
      } else {
        setError(moderationData.error || 'Failed to fetch moderation data')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleModerationAction = async (action: string, resourceType: string, resourceId: string, reason?: string) => {
    setActionLoading(resourceId)
    try {
      const response = await fetch('/api/admin/moderation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          resourceType,
          resourceId,
          reason
        }),
      })

      if (response.ok) {
        // Refresh the data
        fetchModerationData()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to perform moderation action')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const getRiskLevel = (link: FlaggedLink | HighClickLink) => {
    if (link.clickCount > 10000) return 'high'
    if (link.clickCount > 1000) return 'medium'
    return 'low'
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 bg-background dark min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading moderation data...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-4 sm:p-6 bg-background dark min-h-screen">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground flex items-center">
            <Shield className="h-6 w-6 sm:h-8 sm:w-8 mr-3" />
            Content Moderation
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitor and moderate platform content
          </p>
        </div>
        <Card className="card-ninja hover:glow-ninja transition-all duration-300">
          <CardContent className="p-6 text-center">
            <p className="text-red-600">{error || 'Failed to load moderation data'}</p>
            <Button onClick={fetchModerationData} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 bg-background dark min-h-screen">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground flex items-center">
          <Shield className="h-6 w-6 sm:h-8 sm:w-8 mr-3" />
          Content Moderation
        </h1>
        <p className="text-muted-foreground mt-2">
          Monitor and moderate platform content
        </p>
      </div>

      <div className="flex items-center justify-end mb-6">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter content" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Content</SelectItem>
            <SelectItem value="links">Flagged Links</SelectItem>
            <SelectItem value="users">Flagged Users</SelectItem>
            <SelectItem value="high-click">High Click Links</SelectItem>
            <SelectItem value="prolific">Prolific Users</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Moderation Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="card-ninja hover:glow-ninja transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <LinkIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Links</p>
                <p className="text-2xl font-bold text-gray-900">{data.stats.totalLinks.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-ninja hover:glow-ninja transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{data.stats.totalUsers.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-ninja hover:glow-ninja transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Flagged Links</p>
                <p className="text-2xl font-bold text-gray-900">{data.stats.flaggedLinks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-ninja hover:glow-ninja transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Flagged Users</p>
                <p className="text-2xl font-bold text-gray-900">{data.stats.flaggedUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Flagged Links */}
      {(filterType === 'all' || filterType === 'links') && (
        <Card className="card-ninja hover:glow-ninja transition-all duration-300 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
              Flagged Links
            </CardTitle>
            <CardDescription>
              Links that may contain spam or inappropriate content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.flaggedLinks.map((link) => (
                <div key={link.id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {link.title}
                      </h4>
                      <Badge className={getRiskColor(getRiskLevel(link))}>
                        {getRiskLevel(link)} risk
                      </Badge>
                      {link.isActive ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate">{link.url}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>by @{link.User.username}</span>
                      <span>{link.clickCount.toLocaleString()} clicks</span>
                      <span>{formatDistanceToNow(new Date(link.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(link.url, '_blank')}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" disabled={actionLoading === link.id}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {link.isActive ? (
                          <DropdownMenuItem 
                            onClick={() => handleModerationAction('deactivate_link', 'link', link.id)}
                          >
                            <Pause className="h-4 w-4 mr-2" />
                            Deactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem 
                            onClick={() => handleModerationAction('activate_link', 'link', link.id)}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Activate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleModerationAction('delete_link', 'link', link.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
              {data.flaggedLinks.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No flagged links found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* High Click Links */}
      {(filterType === 'all' || filterType === 'high-click') && (
        <Card className="card-ninja hover:glow-ninja transition-all duration-300 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MousePointer className="h-5 w-5 mr-2 text-blue-600" />
              High Click Links
            </CardTitle>
            <CardDescription>
              Links with high click counts that may need review
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.highClickLinks.map((link) => (
                <div key={link.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {link.title}
                      </h4>
                      <Badge className={getRiskColor(getRiskLevel(link))}>
                        {getRiskLevel(link)} risk
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{link.url}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>by @{link.User.username}</span>
                      <span className="font-medium text-blue-600">{link.clickCount.toLocaleString()} clicks</span>
                      <span>{formatDistanceToNow(new Date(link.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(link.url, '_blank')}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Flagged Users */}
      {(filterType === 'all' || filterType === 'users') && (
        <Card className="card-ninja hover:glow-ninja transition-all duration-300 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2 text-purple-600" />
              Flagged Users
            </CardTitle>
            <CardDescription>
              Users with potentially problematic content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.flaggedUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="text-sm font-medium text-gray-900">
                        {user.displayName || 'No display name'}
                      </h4>
                      <span className="text-sm text-gray-500">@{user.username}</span>
                      {user.isPremium && (
                        <Badge variant="default" className="bg-yellow-100 text-yellow-800">
                          <Crown className="h-3 w-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                    </div>
                    {user.bio && (
                      <p className="text-sm text-gray-600 mb-2">{user.bio}</p>
                    )}
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>{user.email}</span>
                      <span>{formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" disabled={actionLoading === user.id}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleModerationAction('suspend_user', 'user', user.id, 'Policy violation')}
                        >
                          <UserX className="h-4 w-4 mr-2" />
                          Suspend User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
              {data.flaggedUsers.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No flagged users found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prolific Users */}
      {(filterType === 'all' || filterType === 'prolific') && (
        <Card className="card-ninja hover:glow-ninja transition-all duration-300 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-orange-600" />
              Prolific Users
            </CardTitle>
            <CardDescription>
              Users with many links (potential spam accounts)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.prolificUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="text-sm font-medium text-gray-900">
                        {user.displayName || 'No display name'}
                      </h4>
                      <span className="text-sm text-gray-500">@{user.username}</span>
                      <Badge variant="secondary">
                        {user.linkCount} links
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>{user.email}</span>
                      <span>{formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" disabled={actionLoading === user.id}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleModerationAction('suspend_user', 'user', user.id, 'Suspicious activity')}
                        >
                          <UserX className="h-4 w-4 mr-2" />
                          Suspend User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
              {data.prolificUsers.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No prolific users found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
