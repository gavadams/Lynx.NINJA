'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Server,
  Clock,
  Users,
  Link as LinkIcon,
  MousePointer,
  Bug
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface MonitoringData {
  health: {
    score: number
    status: 'healthy' | 'warning' | 'critical'
    database: {
      connected: boolean
      responseTime: number
      error?: string
    }
  }
  metrics: {
    recent: {
      users: number
      links: number
      clicks: number
      errors: number
    }
    uptime: {
      percentage: number
      lastDowntime: string | null
    }
  }
  logs: {
    system: Array<{
      id: string
      timestamp: string
      logLevel: string
      message: string
      actionName?: string
    }>
    errors: Array<{
      id: string
      timestamp: string
      logLevel: string
      message: string
      actionName?: string
    }>
  }
  performance: {
    averageResponseTime: number
    dataPoints: any[]
  }
  configuration: {
    featureFlags: Array<{
      id: string
      name: string
      isEnabled: boolean
      description?: string
    }>
    systemSettings: Array<{
      id: string
      name: string
      value: string
      description?: string
    }>
  }
}

export default function MonitoringPage() {
  const [data, setData] = useState<MonitoringData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  useEffect(() => {
    fetchMonitoringData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchMonitoringData()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const fetchMonitoringData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/admin/monitoring')
      const monitoringData = await response.json()

      if (response.ok) {
        setData(monitoringData)
        setLastRefresh(new Date())
      } else {
        setError(monitoringData.error || 'Failed to fetch monitoring data')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'critical':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Activity className="h-5 w-5 text-gray-600" />
    }
  }

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'warn':
        return 'bg-yellow-100 text-yellow-800'
      case 'info':
        return 'bg-blue-100 text-blue-800'
      case 'debug':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading && !data) {
    return (
      <div className="p-4 sm:p-6 bg-background dark min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading system monitoring...</p>
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="p-4 sm:p-6 bg-background dark min-h-screen">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground flex items-center">
            <Activity className="h-6 w-6 sm:h-8 sm:w-8 mr-3" />
            System Monitoring
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitor system health and performance
          </p>
        </div>
        <Card className="card-ninja hover:glow-ninja transition-all duration-300">
          <CardContent className="p-6 text-center">
            <p className="text-red-600">{error}</p>
            <Button onClick={fetchMonitoringData} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="p-4 sm:p-6 bg-background dark min-h-screen">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground flex items-center">
          <Activity className="h-6 w-6 sm:h-8 sm:w-8 mr-3" />
          System Monitoring
        </h1>
        <p className="text-muted-foreground mt-2">
          Monitor system health and performance
        </p>
      </div>

      <div className="flex items-center justify-end mb-6">
        <div className="flex items-center space-x-4">
          <p className="text-sm text-gray-500">
            Last updated: {formatDistanceToNow(lastRefresh, { addSuffix: true })}
          </p>
          <Button onClick={fetchMonitoringData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="card-ninja hover:glow-ninja transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">System Health</p>
                <p className="text-2xl font-bold text-gray-900">{data.health.score}%</p>
              </div>
              {getHealthStatusIcon(data.health.status)}
            </div>
            <Badge className={`mt-2 ${getHealthStatusColor(data.health.status)}`}>
              {data.health.status.toUpperCase()}
            </Badge>
          </CardContent>
        </Card>

        <Card className="card-ninja hover:glow-ninja transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Database</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.health.database.connected ? 'Connected' : 'Disconnected'}
                </p>
              </div>
              {data.health.database.connected ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Response time: {data.health.database.responseTime}ms
            </p>
          </CardContent>
        </Card>

        <Card className="card-ninja hover:glow-ninja transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Uptime</p>
                <p className="text-2xl font-bold text-gray-900">{data.metrics.uptime.percentage}%</p>
              </div>
              <Server className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card className="card-ninja hover:glow-ninja transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Avg Response</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.performance.averageResponseTime.toFixed(0)}ms
                </p>
              </div>
              <Clock className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Last 24 hours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="card-ninja hover:glow-ninja transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">New Users</p>
                <p className="text-2xl font-bold text-gray-900">{data.metrics.recent.users}</p>
                <p className="text-xs text-gray-500">Last hour</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-ninja hover:glow-ninja transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center">
              <LinkIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">New Links</p>
                <p className="text-2xl font-bold text-gray-900">{data.metrics.recent.links}</p>
                <p className="text-xs text-gray-500">Last hour</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-ninja hover:glow-ninja transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center">
              <MousePointer className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Clicks</p>
                <p className="text-2xl font-bold text-gray-900">{data.metrics.recent.clicks}</p>
                <p className="text-xs text-gray-500">Last hour</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-ninja hover:glow-ninja transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Bug className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Errors</p>
                <p className="text-2xl font-bold text-gray-900">{data.metrics.recent.errors}</p>
                <p className="text-xs text-gray-500">Last hour</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Recent System Logs */}
        <Card className="card-ninja hover:glow-ninja transition-all duration-300">
          <CardHeader>
            <CardTitle>Recent System Logs</CardTitle>
            <CardDescription>
              Latest system events and activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data.logs.system.slice(0, 10).map((log) => (
                <div key={log.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Badge className={getLogLevelColor(log.logLevel)}>
                    {log.logLevel}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 text-wrap-balance">{log.message}</p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Error Logs */}
        <Card className="card-ninja hover:glow-ninja transition-all duration-300">
          <CardHeader>
            <CardTitle>Recent Errors</CardTitle>
            <CardDescription>
              Latest error logs and issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data.logs.errors.length > 0 ? (
                data.logs.errors.slice(0, 10).map((log) => (
                  <div key={log.id} className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                    <Badge className="bg-red-100 text-red-800">
                      {log.logLevel}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 text-wrap-balance">{log.message}</p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No recent errors</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Flags Status */}
      <Card className="card-ninja hover:glow-ninja transition-all duration-300">
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
          <CardDescription>
            Current status of platform features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.configuration.featureFlags.map((flag) => (
              <div key={flag.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{flag.name}</p>
                  {flag.description && (
                    <p className="text-xs text-gray-500">{flag.description}</p>
                  )}
                </div>
                <Badge variant={flag.isEnabled ? "default" : "secondary"}>
                  {flag.isEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
