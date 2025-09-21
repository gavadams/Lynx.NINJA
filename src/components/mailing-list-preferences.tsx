'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Mail, CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface MailingListSubscription {
  mailingListId: string
  mailingListName: string
  isSubscribed: boolean
  subscribedAt: string
  unsubscribeToken: string
}

interface MailingListPreferencesProps {
  className?: string
}

export function MailingListPreferences({ className }: MailingListPreferencesProps) {
  const [subscriptions, setSubscriptions] = useState<MailingListSubscription[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const fetchSubscriptions = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/mailing-list/subscriptions')
      const data = await response.json()

      if (response.ok) {
        setSubscriptions(data.subscriptions || [])
      } else {
        setError(data.error || 'Failed to fetch subscriptions')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const toggleSubscription = async (mailingListId: string, isSubscribed: boolean) => {
    try {
      setSaving(mailingListId)
      setError(null)
      setSuccess(null)

      const response = await fetch('/api/mailing-list/subscriptions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mailingListId,
          isSubscribed: !isSubscribed
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSubscriptions(prev => 
          prev.map(sub => 
            sub.mailingListId === mailingListId 
              ? { ...sub, isSubscribed: !isSubscribed }
              : sub
          )
        )
        setSuccess(`Successfully ${!isSubscribed ? 'subscribed to' : 'unsubscribed from'} the mailing list`)
      } else {
        setError(data.error || 'Failed to update subscription')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Loading mailing preferences...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Mail className="h-5 w-5 mr-2" />
          Mailing List Preferences
        </CardTitle>
        <CardDescription>
          Manage your email subscription preferences. You can unsubscribe from any mailing list at any time.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        {subscriptions.length === 0 ? (
          <div className="text-center py-8">
            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No mailing list subscriptions found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {subscriptions.map((subscription) => (
              <div
                key={subscription.mailingListId}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-medium text-gray-900">
                      {subscription.mailingListName}
                    </h3>
                    {subscription.isSubscribed ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Subscribed
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <XCircle className="h-3 w-3 mr-1" />
                        Unsubscribed
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {subscription.isSubscribed 
                      ? `Subscribed on ${new Date(subscription.subscribedAt).toLocaleDateString()}`
                      : 'Not subscribed'
                    }
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={subscription.isSubscribed}
                    onCheckedChange={() => toggleSubscription(
                      subscription.mailingListId, 
                      subscription.isSubscribed
                    )}
                    disabled={saving === subscription.mailingListId}
                  />
                  {saving === subscription.mailingListId && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">About Mailing Lists</h4>
          <p className="text-sm text-blue-800">
            We automatically subscribe new users to our newsletter to keep you informed about platform updates, 
            new features, and helpful tips. You can unsubscribe from any mailing list at any time using the 
            controls above or by clicking the unsubscribe link in any email we send.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
