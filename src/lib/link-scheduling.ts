/**
 * Link scheduling utilities for handling scheduled and expired links
 */

export interface LinkScheduleStatus {
  isScheduled: boolean
  isExpired: boolean
  isActive: boolean
  scheduledAt?: string | null
  expiresAt?: string | null
}

/**
 * Check if a link should be active based on its scheduling
 */
export function getLinkScheduleStatus(link: {
  isActive: boolean
  scheduledAt?: string | null
  expiresAt?: string | null
}): LinkScheduleStatus {
  const now = new Date()
  
  // Check if link is scheduled for the future
  const isScheduled = link.scheduledAt ? new Date(link.scheduledAt) > now : false
  
  // Check if link has expired
  const isExpired = link.expiresAt ? new Date(link.expiresAt) <= now : false
  
  // Link is active if:
  // 1. It's marked as active in the database
  // 2. It's not scheduled for the future
  // 3. It's not expired
  const isActive = link.isActive && !isScheduled && !isExpired
  
  return {
    isScheduled,
    isExpired,
    isActive,
    scheduledAt: link.scheduledAt,
    expiresAt: link.expiresAt
  }
}

/**
 * Get the display status for a link based on scheduling
 */
export function getLinkDisplayStatus(link: {
  isActive: boolean
  scheduledAt?: string | null
  expiresAt?: string | null
}): string {
  const status = getLinkScheduleStatus(link)
  
  if (status.isScheduled) {
    return 'Scheduled'
  }
  
  if (status.isExpired) {
    return 'Expired'
  }
  
  return status.isActive ? 'Active' : 'Inactive'
}

/**
 * Get the time until a link goes live (if scheduled)
 */
export function getTimeUntilLive(scheduledAt: string): string {
  const now = new Date()
  const scheduled = new Date(scheduledAt)
  const diff = scheduled.getTime() - now.getTime()
  
  if (diff <= 0) return 'Live now'
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}

/**
 * Get the time until a link expires
 */
export function getTimeUntilExpiry(expiresAt: string): string {
  const now = new Date()
  const expiry = new Date(expiresAt)
  const diff = expiry.getTime() - now.getTime()
  
  if (diff <= 0) return 'Expired'
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}

/**
 * Format a date for display in the UI
 */
export function formatScheduleDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  })
}
