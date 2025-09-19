'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Check, X, Users, Mail } from 'lucide-react'

interface Invitation {
  id: string
  teamName: string
  inviterName: string
  role: string
  status: string
}

export default function TeamInvitationPage() {
  const params = useParams()
  const router = useRouter()
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (params.invitationId) {
      fetchInvitation(params.invitationId as string)
    }
  }, [params.invitationId])

  const fetchInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/teams/invitations/${invitationId}`)
      if (response.ok) {
        const data = await response.json()
        setInvitation(data)
      } else {
        setError('Invitation not found or expired')
      }
    } catch (err) {
      setError('Failed to load invitation')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    if (!invitation) return

    setProcessing(true)
    setError(null)

    try {
      const response = await fetch(`/api/teams/invitations/${invitation.id}/accept`, {
        method: 'POST'
      })

      if (response.ok) {
        setSuccess('Invitation accepted successfully!')
        setTimeout(() => {
          router.push('/dashboard/teams')
        }, 2000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to accept invitation')
      }
    } catch (err) {
      setError('Failed to accept invitation')
    } finally {
      setProcessing(false)
    }
  }

  const handleDecline = async () => {
    if (!invitation) return

    setProcessing(true)
    setError(null)

    try {
      const response = await fetch(`/api/teams/invitations/${invitation.id}/decline`, {
        method: 'POST'
      })

      if (response.ok) {
        setSuccess('Invitation declined')
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to decline invitation')
      }
    } catch (err) {
      setError('Failed to decline invitation')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">Loading invitation...</div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error && !invitation) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="p-6">
              <Alert variant="destructive">
                <X className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!invitation) {
    return null
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>Team Invitation</CardTitle>
            <CardDescription>
              You've been invited to join a team
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <X className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <Check className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Team:</span>
                <span className="text-sm">{invitation.teamName}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Role:</span>
                <span className="text-sm capitalize">{invitation.role}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Invited by:</span>
                <span className="text-sm">{invitation.inviterName}</span>
              </div>
            </div>

            {invitation.status === 'pending' && (
              <div className="flex space-x-2">
                <Button 
                  onClick={handleAccept} 
                  disabled={processing}
                  className="flex-1"
                >
                  {processing ? 'Processing...' : 'Accept'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleDecline} 
                  disabled={processing}
                  className="flex-1"
                >
                  Decline
                </Button>
              </div>
            )}

            {invitation.status === 'accepted' && (
              <Alert>
                <Check className="h-4 w-4" />
                <AlertDescription>
                  You have already accepted this invitation.
                </AlertDescription>
              </Alert>
            )}

            {invitation.status === 'declined' && (
              <Alert variant="destructive">
                <X className="h-4 w-4" />
                <AlertDescription>
                  You have declined this invitation.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
