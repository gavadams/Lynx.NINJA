'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminHeader } from '@/components/admin/admin-header'
import { Loader2 } from 'lucide-react'

interface AdminUser {
  id: string
  email: string
  role: string
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    // Skip auth check for login page
    if (pathname === '/admin/login') {
      setLoading(false)
      return
    }

    checkAdminAuth()
  }, [pathname])

  const checkAdminAuth = async () => {
    try {
      console.log('🔍 Checking admin authentication...')
      const response = await fetch('/api/admin/auth/me')
      const data = await response.json()
      console.log('🔍 Admin auth response:', { status: response.status, data })
      
      if (response.ok) {
        setAdmin(data.admin)
        setLoading(false)
      } else {
        console.log('❌ Admin authentication failed: Invalid or expired session')
        router.push('/admin/login')
      }
    } catch (error) {
      console.error('❌ Admin auth check error:', error)
      router.push('/admin/login')
    }
  }

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  // Don't show sidebar/header on login page
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
