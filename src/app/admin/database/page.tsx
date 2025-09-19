'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Database,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Trash2,
  Wrench,
  Download,
  Users,
  Link as LinkIcon,
  MousePointer,
  CreditCard,
  Users2,
  Globe,
  Mail
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface TableInfo {
  table: string
  rows: number
  size: string
}

interface DatabaseData {
  overview: {
    totalTables: number
    totalRows: number
    totalSize: string
    lastBackup: string
  }
  tables: TableInfo[]
  recentActivity: {
    users: Array<{
      id: string
      email: string
      username: string
      createdAt: string
    }>
    links: Array<{
      id: string
      title: string
      url: string
      createdAt: string
      User: {
        username: string
      }
    }>
  }
  issues: {
    orphanedLinks: Array<{
      id: string
      title: string
      url: string
      userId: string | null
    }>
    orphanedClicks: Array<{
      id: string
      linkId: string | null
      createdAt: string
    }>
    duplicateUsernames: Array<{
      username: string
      count: number
    }>
  }
}

export default function DatabasePage() {
  const [data, setData] = useState<DatabaseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchDatabaseData()
  }, [])

  const fetchDatabaseData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/admin/database')
      const databaseData = await response.json()

      if (response.ok) {
        setData(databaseData)
      } else {
        setError(databaseData.error || 'Failed to fetch database data')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDatabaseAction = async (action: string) => {
    setActionLoading(action)
    try {
      const response = await fetch('/api/admin/database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        const result = await response.json()
        alert(result.result.message)
        // Refresh the data
        fetchDatabaseData()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to perform database action')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const getTableIcon = (table: string) => {
    switch (table.toLowerCase()) {
      case 'user':
        return <Users className="h-4 w-4" />
      case 'link':
        return <LinkIcon className="h-4 w-4" />
      case 'click':
        return <MousePointer className="h-4 w-4" />
      case 'subscription':
        return <CreditCard className="h-4 w-4" />
      case 'team':
        return <Users2 className="h-4 w-4" />
      case 'customdomain':
        return <Globe className="h-4 w-4" />
      case 'emailcapture':
        return <Mail className="h-4 w-4" />
      default:
        return <Database className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading database information...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Database Management</h1>
          <p className="text-gray-600 mt-2">
            Monitor and maintain database health
          </p>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600">{error || 'Failed to load database data'}</p>
            <Button onClick={fetchDatabaseData} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Database Management</h1>
          <p className="text-gray-600 mt-2">
            Monitor and maintain database health
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={fetchDatabaseData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Database Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Database className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Tables</p>
                <p className="text-2xl font-bold text-gray-900">{data.overview.totalTables}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Rows</p>
                <p className="text-2xl font-bold text-gray-900">{data.overview.totalRows.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Download className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Database Size</p>
                <p className="text-2xl font-bold text-gray-900">{data.overview.totalSize}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Last Backup</p>
                <p className="text-sm font-bold text-gray-900">
                  {formatDistanceToNow(new Date(data.overview.lastBackup), { addSuffix: true })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Table Information */}
        <Card>
          <CardHeader>
            <CardTitle>Table Information</CardTitle>
            <CardDescription>
              Size and row count for each table
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.tables.map((table) => (
                <div key={table.table} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getTableIcon(table.table)}
                    <span className="text-sm font-medium text-gray-900">{table.table}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{table.rows.toLocaleString()} rows</p>
                    <p className="text-xs text-gray-500">{table.size}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Database Issues */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
              Database Issues
            </CardTitle>
            <CardDescription>
              Potential problems that need attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.issues.orphanedLinks.length > 0 && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-900">Orphaned Links</p>
                      <p className="text-xs text-red-700">{data.issues.orphanedLinks.length} links without users</p>
                    </div>
                    <Badge className="bg-red-100 text-red-800">
                      {data.issues.orphanedLinks.length}
                    </Badge>
                  </div>
                </div>
              )}

              {data.issues.orphanedClicks.length > 0 && (
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-900">Orphaned Clicks</p>
                      <p className="text-xs text-yellow-700">{data.issues.orphanedClicks.length} clicks without links</p>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      {data.issues.orphanedClicks.length}
                    </Badge>
                  </div>
                </div>
              )}

              {data.issues.duplicateUsernames.length > 0 && (
                <div className="p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-900">Duplicate Usernames</p>
                      <p className="text-xs text-orange-700">{data.issues.duplicateUsernames.length} duplicate usernames</p>
                    </div>
                    <Badge className="bg-orange-100 text-orange-800">
                      {data.issues.duplicateUsernames.length}
                    </Badge>
                  </div>
                </div>
              )}

              {data.issues.orphanedLinks.length === 0 && 
               data.issues.orphanedClicks.length === 0 && 
               data.issues.duplicateUsernames.length === 0 && (
                <div className="text-center py-4">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No database issues found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Database Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Database Actions</CardTitle>
          <CardDescription>
            Maintenance and optimization tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={() => handleDatabaseAction('cleanup_orphaned_records')}
              disabled={actionLoading === 'cleanup_orphaned_records'}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
            >
              <Trash2 className="h-6 w-6" />
              <span className="text-sm">Cleanup Orphaned Records</span>
              {actionLoading === 'cleanup_orphaned_records' && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
              )}
            </Button>

            <Button
              onClick={() => handleDatabaseAction('fix_duplicate_usernames')}
              disabled={actionLoading === 'fix_duplicate_usernames'}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
            >
              <Users className="h-6 w-6" />
              <span className="text-sm">Fix Duplicate Usernames</span>
              {actionLoading === 'fix_duplicate_usernames' && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
              )}
            </Button>

            <Button
              onClick={() => handleDatabaseAction('optimize_database')}
              disabled={actionLoading === 'optimize_database'}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
            >
              <Wrench className="h-6 w-6" />
              <span className="text-sm">Optimize Database</span>
              {actionLoading === 'optimize_database' && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
              )}
            </Button>

            <Button
              onClick={() => handleDatabaseAction('backup_database')}
              disabled={actionLoading === 'backup_database'}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
            >
              <Download className="h-6 w-6" />
              <span className="text-sm">Backup Database</span>
              {actionLoading === 'backup_database' && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
            <CardDescription>
              Latest user registrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentActivity.users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">@{user.username}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Links</CardTitle>
            <CardDescription>
              Latest link creations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentActivity.links.map((link) => (
                <div key={link.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{link.title}</p>
                    <p className="text-xs text-gray-500">by @{link.User.username}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(link.createdAt), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
