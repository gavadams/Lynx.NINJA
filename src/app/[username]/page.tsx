"use client"

import { useState, useEffect, use } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ExternalLink, Copy, Check, Clock, Lock, Flag } from "lucide-react"
import PasswordProtection from "@/components/password-protection"
import { EmailCaptureForm } from "@/components/email-capture-form"
import { DynamicLogo } from "@/components/dynamic-logo"
import { ReportModal } from "@/components/report-modal"
import { getSiteConfig } from "@/lib/config"
import { getThemeClasses, loadCustomThemes, getCustomThemeStyles } from "@/lib/theme-utils"
import Link from "next/link"

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
  const [reportModal, setReportModal] = useState<{ type: 'user' | 'link'; userId?: string; linkId?: string; userName?: string; linkTitle?: string } | null>(null)
  const [customThemeStyles, setCustomThemeStyles] = useState<React.CSSProperties | null>(null)
  const { siteName } = getSiteConfig()

  useEffect(() => {
    fetchProfileData()
  }, [resolvedParams.username])

  // Load custom theme when profile data changes
  useEffect(() => {
    const loadCustomTheme = async () => {
      if (profileData?.user?.theme && profileData.user.theme.startsWith('custom-')) {
        try {
          const response = await fetch(`/api/profile/custom-theme?username=${profileData.user.username}`)
          if (response.ok) {
            const customTheme = await response.json()
            if (customTheme) {
              setCustomThemeStyles({
                background: `linear-gradient(to bottom right, ${customTheme.primaryColor}, ${customTheme.secondaryColor})`
              })
            }
          }
        } catch (error) {
          console.error('Error loading custom theme:', error)
        }
      } else {
        setCustomThemeStyles(null)
      }
    }
    
    loadCustomTheme()
  }, [profileData?.user?.theme, profileData?.user?.username])

  const fetchProfileData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/profile?username=${resolvedParams.username}`)
      
      if (response.ok) {
        const data = await response.json()
        setProfileData(data)
        
        // Track profile view
        try {
          console.log('🔍 Tracking profile view for:', resolvedParams.username)
          const trackingResponse = await fetch(`/api/profile-view/${resolvedParams.username}`, {
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
              device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
              browser: getBrowserName(navigator.userAgent)
            }),
          })
          console.log('📊 Profile view tracking response:', trackingResponse.status)
          if (trackingResponse.ok) {
            console.log('✅ Profile view tracked successfully')
          } else {
            const errorText = await trackingResponse.text()
            console.error('❌ Profile view tracking failed:', errorText)
          }
        } catch (trackingError) {
          console.error('Failed to track profile view:', trackingError)
          // Don't fail the page load if tracking fails
        }
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

  const getBrowserName = (userAgent: string) => {
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    return 'Unknown'
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

      // Format URL to ensure it has proper protocol
      let formattedUrl = url.trim()
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = 'https://' + formattedUrl
      }

      // Open the link
      window.open(formattedUrl, '_blank')
    } catch (err) {
      console.error('Failed to track click:', err)
      // Still open the link even if tracking fails
      let formattedUrl = url.trim()
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = 'https://' + formattedUrl
      }
      window.open(formattedUrl, '_blank')
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
            <h1 className="text-2xl font-bold text-blue-600 mb-4">Profile Not Found</h1>
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
  
  // Get the user's theme classes
  const themeClasses = getThemeClasses(user.theme || 'default')
  
  console.log('Public profile theme debug:', {
    userTheme: user.theme,
    themeClasses: themeClasses,
    user: user.username,
    customThemeStyles: customThemeStyles
  })

  return (
    <div 
      className={`min-h-screen ${themeClasses}`}
      style={customThemeStyles || {}}
    >
      <div className="container mx-auto px-4 py-8 max-w-md">
        {/* Site Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-block">
            <DynamicLogo
              pageType="publicProfile"
              className="h-12 w-auto mx-auto opacity-80 hover:opacity-100 transition-opacity"
            />
          </Link>
        </div>
        
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-8 text-center">
            <Avatar className="w-24 h-24 mx-auto mb-4">
              <AvatarImage src={user.profileImage} alt={user.displayName} />
              <AvatarFallback className="text-2xl">
                {user.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <h1 className="text-2xl font-bold text-blue-600 mb-2 prevent-overflow">
              {user.displayName}
            </h1>
            
            <p className="text-gray-600 mb-4 prevent-overflow">@{user.username}</p>
            
            {user.bio && (
              <p className="text-gray-700 mb-4 text-wrap-balance">{user.bio}</p>
            )}

            <div className="flex items-center justify-center mb-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={copyProfileUrl}
                className="mr-2"
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
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setReportModal({ 
                  type: 'user', 
                  userId: user.id, 
                  userName: user.username 
                })}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2"
                title="Report this profile"
              >
                <Flag className="h-4 w-4" />
              </Button>
            </div>

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

                  // Format URL to ensure it has proper protocol
                  const formatUrl = (url: string) => {
                    const trimmedUrl = url.trim()
                    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
                      return 'https://' + trimmedUrl
                    }
                    return trimmedUrl
                  }

                  return (
                    <a
                      key={socialLink.id}
                      href={formatUrl(socialLink.url)}
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
                  className={`group transition-shadow ${
                    isClickable ? 'hover:shadow-lg cursor-pointer' : 'cursor-not-allowed opacity-60'
                  }`}
                  onClick={() => isClickable && handleLinkClick(link)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-semibold text-blue-600 prevent-overflow">
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
                        {!isPasswordProtected && !isScheduled && !isExpired && (
                        <p className="text-sm text-gray-500 url-break">
                          {link.url}
                        </p>
                        )}
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
                      <div className="flex items-center space-x-2">
                        {isClickable && <ExternalLink className="h-5 w-5 text-gray-400" />}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setReportModal({ 
                              type: 'link', 
                              linkId: link.id, 
                              linkTitle: link.title 
                            })
                          }}
                          className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Report this link"
                        >
                          <Flag className="h-3 w-3" />
                        </Button>
                      </div>
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
            onPasswordVerified={async () => {
              const link = profileData?.links.find(l => l.id === passwordModal.linkId)
              if (link) {
                await openLink(link.id, link.url)
              }
              setPasswordModal(null)
            }}
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
                 <p>
                   Powered by{' '}
                   <Link 
                     href="/" 
                     className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                   >
                     {process.env.NEXT_PUBLIC_SITE_NAME || 'Lynx.NINJA'}
                   </Link>
                 </p>
               </div>

               {/* Report Modal */}
               {reportModal && (
                 <ReportModal
                   isOpen={!!reportModal}
                   onClose={() => setReportModal(null)}
                   reportType={reportModal.type}
                   reportedUserId={reportModal.userId}
                   reportedLinkId={reportModal.linkId}
                   reportedUserName={reportModal.userName}
                   reportedLinkTitle={reportModal.linkTitle}
                 />
               )}
      </div>
    </div>
  )
}
