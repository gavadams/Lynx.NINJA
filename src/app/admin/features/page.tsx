'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { 
  Flag,
  RefreshCw,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { refreshFeatureFlags } from '@/lib/feature-flags'

interface FeatureFlag {
  id: string
  name: string
  isEnabled: boolean
  description?: string
  createdAt: string
  updatedAt: string
}

export default function FeaturesPage() {
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetchFeatureFlags()
  }, [])

  const fetchFeatureFlags = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/admin/features')
      const data = await response.json()

      if (response.ok) {
        setFeatureFlags(data.flags)
      } else {
        setError(data.error || 'Failed to fetch feature flags')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleFeature = async (name: string, isEnabled: boolean) => {
    setUpdating(name)
    try {
      const response = await fetch('/api/admin/features', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, isEnabled }),
      })

      if (response.ok) {
        // Update the local state
        setFeatureFlags(prev => 
          prev.map(flag => 
            flag.name === name ? { ...flag, isEnabled } : flag
          )
        )
        
        // Refresh feature flags globally
        refreshFeatureFlags()
        console.log('🔄 Feature flags refreshed globally')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update feature flag')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading feature flags...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Feature Flags</h1>
          <p className="text-gray-600 mt-2">
            Manage platform features
          </p>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600">{error}</p>
            <Button onClick={fetchFeatureFlags} className="mt-4">
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
          <h1 className="text-3xl font-bold text-gray-900">Feature Flags</h1>
          <p className="text-gray-600 mt-2">
            Enable or disable platform features
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={fetchFeatureFlags} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Feature Flags */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featureFlags.map((flag) => (
          <Card key={flag.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Flag className="h-5 w-5 mr-2" />
                  {flag.name}
                </CardTitle>
                <Badge variant={flag.isEnabled ? "default" : "secondary"}>
                  {flag.isEnabled ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Enabled
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      Disabled
                    </>
                  )}
                </Badge>
              </div>
              {flag.description && (
                <CardDescription>{flag.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <Switch
                  checked={flag.isEnabled}
                  onCheckedChange={(checked) => handleToggleFeature(flag.name, checked)}
                  disabled={updating === flag.name}
                />
              </div>
              {updating === flag.name && (
                <div className="mt-2 text-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mx-auto"></div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {featureFlags.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <Flag className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No feature flags found</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}