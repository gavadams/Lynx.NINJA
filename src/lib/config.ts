/**
 * Application configuration utilities
 * Centralizes all dynamic configuration values
 */

export const getSiteConfig = () => {
  return {
    siteName: process.env.NEXT_PUBLIC_SITE_NAME || 'Lynx.NINJA',
    siteDescription: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || 'Your Link in Bio Platform',
    mainDomain: process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'www.lynx.ninja',
    supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@lynx.ninja',
    fromEmail: process.env.RESEND_FROM_EMAIL || 'Lynx.NINJA <noreply@lynx.ninja>',
  }
}

export const getPublicUrl = (path: string = '') => {
  const config = getSiteConfig()
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${config.mainDomain}`
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
}

export const getUserProfileUrl = (username: string) => {
  const config = getSiteConfig()
  return `${config.mainDomain}/${username}`
}

export const getFullUserProfileUrl = (username: string) => {
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  const config = getSiteConfig()
  return `${protocol}://${config.mainDomain}/${username}`
}
