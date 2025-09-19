'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Users, Mail, Clock, Check, X, AlertCircle } from 'lucide-react'

interface Invitation {
  id: string
  role: string
  status: string
  invitedAt: string
  Team: {
    id: string
    name: string
    description: string | null
  }
  User: {
    displayName: string | null
    email: string
  }
}

export default function TeamInvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchInvitations()
  }, [])

  const fetchInvitations = async () => {
    try {
      const response = await fetch('/api/teams/invitations')
      if (response.ok) {
        const data = await response.json()
        setInvitations(data.invitations)
      } else {
        setError('Failed to load invitations')
      }
    } catch (err) {
      setError('Failed to load invitations')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (invitationId: string) => {
    setProcessing(invitationId)
    setError(null)

    try {
      const response = await fetch(`/api/teams/invitations/${invitationId}/accept`, {
        method: 'POST'
      })

      if (response.ok) {
        setSuccess('Invitation accepted successfully!')
        fetchInvitations() // Refresh the list
        setTimeout(() => setSuccess(null), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to accept invitation')
      }
    } catch (err) {
      setError('Failed to accept invitation')
    } finally {
      setProcessing(null)
    }
  }

  const handleDecline = async (invitationId: string) => {
    setProcessing(invitationId)
    setError(null)

    try {
      const response = await fetch(`/api/teams/invitations/${invitationId}/decline`, {
        method: 'POST'
      })

      if (response.ok) {
        setSuccess('Invitation declined')
        fetchInvitations() // Refresh the list
        setTimeout(() => setSuccess(null), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to decline invitation')
      }
    } catch (err) {
      setError('Failed to decline invitation')
    } finally {
      setProcessing(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">Loading invitations...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Team Invitations</h1>
            <p className="text-muted-foreground">
              Manage your pending team invitations
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            {invitations.length} pending
          </Badge>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <Check className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {invitations.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No pending invitations</h3>
              <p className="text-muted-foreground">
                You don't have any pending team invitations at the moment.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <Card key={invitation.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        {invitation.Team.name}
                      </CardTitle>
                      <CardDescription>
                        {invitation.Team.description || 'No description provided'}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {invitation.role}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        Invited by {invitation.User.displayName || invitation.User.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDate(invitation.invitedAt)}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAccept(invitation.id)}
                        disabled={processing === invitation.id}
                        size="sm"
                      >
                        {processing === invitation.id ? (
                          'Processing...'
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Accept
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleDecline(invitation.id)}
                        disabled={processing === invitation.id}
                        size="sm"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Decline
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
