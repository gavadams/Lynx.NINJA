"use client"

import { useState, useEffect, use } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ExternalLink, Copy, Check, Clock, Lock } from "lucide-react"
import PasswordProtection from "@/components/password-protection"
import { EmailCaptureForm } from "@/components/email-capture-form"

interface Link {
  id: string
  title: string
  url: string
  isActive: boolean
  clicks: number
  order: number
  scheduledAt?: string | null
  expiresAt?: string | null
  password?: string | null
}

interface UserProfile {
  id: string
  username: string
  displayName: string
  profileImage?: string
  theme: string
  bio?: string
  emailCaptureId?: string
  emailCapture?: {
    id: string
    title: string
    description?: string
    buttonText: string
    placeholder: string
    successMessage: string
    isActive: boolean
  }
}

interface SocialMediaLink {
  id: string
  platform: string
  url: string
  displayName?: string
  order: number
}

interface PublicProfileData {
  user: UserProfile
  links: Link[]
  socialMediaLinks: SocialMediaLink[]
}

export default function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const resolvedParams = use(params)
  const [profileData, setProfileData] = useState<PublicProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [passwordModal, setPasswordModal] = useState<{ linkId: string; linkTitle: string } | null>(null)

  useEffect(() => {
    fetchProfileData()
  }, [resolvedParams.username])

  const fetchProfileData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/profile?username=${resolvedParams.username}`)
      
      if (response.ok) {
        const data = await response.json()
        setProfileData(data)
      } else if (response.status === 404) {
        setError("User not found")
      } else {
        setError("Failed to load profile")
      }
    } catch (err) {
      setError("Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  const copyProfileUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy URL:', err)
    }
  }

  const handleLinkClick = async (link: Link) => {
    // Check if link is scheduled and not yet active
    if (link.scheduledAt && new Date(link.scheduledAt) > new Date()) {
      return // Link is not yet active
    }

    // Check if link has expired
    if (link.expiresAt && new Date(link.expiresAt) <= new Date()) {
      return // Link has expired
    }

    // Check if link is password protected
    if (link.password) {
      setPasswordModal({ linkId: link.id, linkTitle: link.title })
      return
    }

    // Proceed with normal link click
    await openLink(link.id, link.url)
  }

  const openLink = async (linkId: string, url: string) => {
    try {
      // Track the click
      await fetch(`/api/click/${linkId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ipAddress: '', // Will be filled by server
          userAgent: navigator.userAgent,
          referer: document.referrer,
          country: '',
          city: '',
          device: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop',
          browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Other'
        })
      })

      // Open the link
      window.open(url, '_blank')
    } catch (err) {
      console.error('Failed to track click:', err)
      // Still open the link even if tracking fails
      window.open(url, '_blank')
    }
  }

  const handlePasswordSubmit = async (password: string): Promise<boolean> => {
    if (!passwordModal) return false

    try {
      const response = await fetch(`/api/links/${passwordModal.linkId}/check-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password })
      })

      if (response.ok) {
        const link = profileData?.links.find(l => l.id === passwordModal.linkId)
        if (link) {
          await openLink(link.id, link.url)
          setPasswordModal(null)
          return true
        }
      }
      return false
    } catch (error) {
      console.error('Password check failed:', error)
      return false
    }
  }

  const isLinkScheduled = (link: Link) => {
    return link.scheduledAt && new Date(link.scheduledAt) > new Date()
  }

  const isLinkExpired = (link: Link) => {
    return link.expiresAt && new Date(link.expiresAt) <= new Date()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-48 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
        </div>
      </div>
    )
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h1>
            <p className="text-gray-600 mb-6">
              The user you&apos;re looking for doesn&apos;t exist or has made their profile private.
            </p>
            <Button onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { user, links, socialMediaLinks } = profileData
  const activeLinks = links.filter(link => link.isActive)
  

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-md">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-8 text-center">
            <Avatar className="w-24 h-24 mx-auto mb-4">
              <AvatarImage src={user.profileImage} alt={user.displayName} />
              <AvatarFallback className="text-2xl">
                {user.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2 prevent-overflow">
              {user.displayName}
            </h1>
            
            <p className="text-gray-600 mb-4 prevent-overflow">@{user.username}</p>
            
            {user.bio && (
              <p className="text-gray-700 mb-4 text-wrap-balance">{user.bio}</p>
            )}

            <Button 
              variant="outline" 
              size="sm" 
              onClick={copyProfileUrl}
              className="mb-4"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </>
              )}
            </Button>

            <div className="flex justify-center space-x-4 text-sm text-gray-500">
              <span>{activeLinks.length} links</span>
            </div>
          </CardContent>
        </Card>

        {/* Social Media Links */}
        {socialMediaLinks && socialMediaLinks.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-wrap justify-center gap-3">
                {socialMediaLinks.map((socialLink) => {
                  const getPlatformIcon = (platform: string) => {
                    const icons: Record<string, string> = {
                      twitter: '𝕏',
                      instagram: '📷',
                      linkedin: '💼',
                      youtube: '📺',
                      tiktok: '🎵',
                      facebook: '👥',
                      github: '💻',
                      website: '🌐',
                      discord: '💬',
                      twitch: '🎮',
                      spotify: '🎵',
                      snapchat: '👻',
                    }
                    return icons[platform] || '🔗'
                  }

                  const getPlatformColor = (platform: string) => {
                    const colors: Record<string, string> = {
                      twitter: 'bg-black hover:bg-gray-800',
                      instagram: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
                      linkedin: 'bg-blue-600 hover:bg-blue-700',
                      youtube: 'bg-red-600 hover:bg-red-700',
                      tiktok: 'bg-black hover:bg-gray-800',
                      facebook: 'bg-blue-500 hover:bg-blue-600',
                      github: 'bg-gray-800 hover:bg-gray-900',
                      website: 'bg-gray-600 hover:bg-gray-700',
                      discord: 'bg-indigo-600 hover:bg-indigo-700',
                      twitch: 'bg-purple-600 hover:bg-purple-700',
                      spotify: 'bg-green-500 hover:bg-green-600',
                      snapchat: 'bg-yellow-400 hover:bg-yellow-500',
                    }
                    return colors[platform] || 'bg-gray-500 hover:bg-gray-600'
                  }

                  return (
                    <a
                      key={socialLink.id}
                      href={socialLink.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-colors ${getPlatformColor(socialLink.platform)}`}
                      title={socialLink.displayName || socialLink.platform}
                    >
                      <span className="text-lg">{getPlatformIcon(socialLink.platform)}</span>
                    </a>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Links */}
        {activeLinks.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">No links available yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {activeLinks.map((link) => {
              const isScheduled = isLinkScheduled(link)
              const isExpired = isLinkExpired(link)
              const isPasswordProtected = !!link.password
              const isClickable = !isScheduled && !isExpired

              return (
                <Card 
                  key={link.id} 
                  className={`transition-shadow ${
                    isClickable ? 'hover:shadow-lg cursor-pointer' : 'cursor-not-allowed opacity-60'
                  }`}
                  onClick={() => isClickable && handleLinkClick(link)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900 prevent-overflow">
                            {link.title}
                          </h3>
                          {isPasswordProtected && (
                            <Lock className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                          )}
                          {isScheduled && (
                            <Clock className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          )}
                          {isExpired && (
                            <Clock className="h-4 w-4 text-red-600 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500 url-break">
                          {link.url}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          {isScheduled && (
                            <Badge variant="outline" className="text-xs text-blue-600">
                              Scheduled for {new Date(link.scheduledAt!).toLocaleDateString()}
                            </Badge>
                          )}
                          {isExpired && (
                            <Badge variant="outline" className="text-xs text-red-600">
                              Expired
                            </Badge>
                          )}
                          {isPasswordProtected && (
                            <Badge variant="outline" className="text-xs text-yellow-600">
                              Password Protected
                            </Badge>
                          )}
                        </div>
                      </div>
                      {isClickable && <ExternalLink className="h-5 w-5 text-gray-400" />}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Password Protection Modal */}
        {passwordModal && (
          <PasswordProtection
            linkId={passwordModal.linkId}
            linkTitle={passwordModal.linkTitle}
            onPasswordVerified={() => setPasswordModal(null)}
            onCancel={() => setPasswordModal(null)}
          />
        )}

               {/* Email Capture Form */}
               {user.emailCapture && user.emailCapture.isActive && (
                 <div className="mt-8">
                   <EmailCaptureForm
                     captureId={user.emailCapture.id}
                     title={user.emailCapture.title}
                     description={user.emailCapture.description}
                     buttonText={user.emailCapture.buttonText}
                     placeholder={user.emailCapture.placeholder}
                     successMessage={user.emailCapture.successMessage}
                   />
                 </div>
               )}

               {/* Footer */}
               <div className="text-center mt-8 text-sm text-gray-500">
                 <p>Powered by {process.env.NEXT_PUBLIC_SITE_NAME || 'Lynx.NINJA'}</p>
               </div>
      </div>
    </div>
  )
}
