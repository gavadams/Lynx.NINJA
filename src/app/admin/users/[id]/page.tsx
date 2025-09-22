'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  Edit,
  Trash2,
  Mail,
  Calendar,
  Activity,
  Link as LinkIcon,
  MousePointer,
  Crown,
  User,
  Globe,
  RefreshCw
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface User {
  id: string
  email: string
  username: string
  displayName: string
  profileImage?: string
  bio?: string
  theme: string
  isPremium: boolean
  createdAt: string
  updatedAt: string
  stats: {
    linksCount: number
    totalClicks: number
    recentClicks: number
  }
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchUser()
    }
  }, [params.id])

  const fetchUser = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/users/${params.id}`)
      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
      } else {
        setError(data.error || 'Failed to fetch user')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!user) return

    if (!confirm(`Are you sure you want to delete user "${user.email}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.push('/admin/users')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to delete user')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 bg-background dark min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading user details...</p>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="p-4 sm:p-6 bg-background dark min-h-screen">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground flex items-center">
                <User className="h-6 w-6 sm:h-8 sm:w-8 mr-3" />
                User Details
              </h1>
              <p className="text-muted-foreground mt-2">
                View and manage user account information
              </p>
            </div>
          </div>
        </div>
        <Card className="card-ninja hover:glow-ninja transition-all duration-300">
          <CardContent className="p-6 text-center">
            <p className="text-red-600">{error || 'User not found'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 bg-background dark min-h-screen">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground flex items-center">
              <User className="h-6 w-6 sm:h-8 sm:w-8 mr-3" />
              User Details
            </h1>
            <p className="text-muted-foreground mt-2">
              View and manage user account information
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href={`/admin/users/${user.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit User
            </Link>
          </Button>
          <Button variant="destructive" onClick={handleDeleteUser}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete User
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Profile */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="card-ninja hover:glow-ninja transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                  {user.profileImage ? (
                    <img 
                      src={user.profileImage} 
                      alt={user.displayName}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-medium text-gray-600">
                      {user.displayName?.charAt(0) || user.email.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {user.displayName || 'No display name'}
                  </h3>
                  <p className="text-gray-600">@{user.username}</p>
                  {user.isPremium && (
                    <Badge variant="default" className="bg-yellow-100 text-yellow-800 mt-1">
                      <Crown className="h-3 w-3 mr-1" />
                      Premium User
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <div className="flex items-center mt-1">
                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">{user.email}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Username</label>
                  <div className="flex items-center mt-1">
                    <User className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">@{user.username}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Theme</label>
                  <div className="flex items-center mt-1">
                    <Globe className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-900 capitalize">{user.theme}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Account Status</label>
                  <div className="mt-1">
                    <Badge variant="default">Active</Badge>
                  </div>
                </div>
              </div>

              {user.bio && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Bio</label>
                  <p className="text-gray-900 mt-1">{user.bio}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Stats */}
          <Card className="card-ninja hover:glow-ninja transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Activity Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <LinkIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{user.stats.linksCount}</div>
                  <div className="text-sm text-gray-500">Total Links</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <MousePointer className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{user.stats.totalClicks}</div>
                  <div className="text-sm text-gray-500">Total Clicks</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Activity className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{user.stats.recentClicks}</div>
                  <div className="text-sm text-gray-500">Recent Clicks (7d)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Information */}
          <Card className="card-ninja hover:glow-ninja transition-all duration-300">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Member Since</label>
                <div className="flex items-center mt-1">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-900">
                    {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Last Updated</label>
                <div className="flex items-center mt-1">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-900">
                    {formatDistanceToNow(new Date(user.updatedAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Last Login</label>
                <div className="flex items-center mt-1">
                  <Activity className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-900">
                    Active
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="card-ninja hover:glow-ninja transition-all duration-300">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full">
                <Link href={`/admin/users/${user.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit User
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href={`/${user.username}`} target="_blank">
                  <Globe className="h-4 w-4 mr-2" />
                  View Public Profile
                </Link>
              </Button>
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={handleDeleteUser}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete User
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
