'use client'

import { useState, useEffect } from 'react'

interface InvitationCount {
  count: number
  invitations: any[]
}

export function useInvitations() {
  const [invitationCount, setInvitationCount] = useState<InvitationCount>({ count: 0, invitations: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInvitations = async () => {
    try {
      const response = await fetch('/api/teams/invitations')
      if (response.ok) {
        const data = await response.json()
        setInvitationCount(data)
        setError(null)
      } else {
        setError('Failed to fetch invitations')
      }
    } catch (err) {
      setError('Failed to fetch invitations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvitations()
    
    // Refresh every 30 seconds to check for new invitations
    const interval = setInterval(fetchInvitations, 30000)
    
    return () => clearInterval(interval)
  }, [])

  return {
    invitationCount: invitationCount.count,
    invitations: invitationCount.invitations,
    loading,
    error,
    refetch: fetchInvitations
  }
}
