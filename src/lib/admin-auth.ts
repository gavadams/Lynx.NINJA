import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

export interface AdminUser {
  id: string
  email: string
  role: 'super_admin' | 'admin' | 'moderator'
  isActive: boolean
  lastLoginAt?: string
  createdAt: string
}

export async function createAdminClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}

export async function authenticateAdmin(email: string, password: string): Promise<{ success: boolean; admin?: AdminUser; error?: string }> {
  try {
    const supabase = await createAdminClient()

    // Get admin user
    const { data: admin, error } = await supabase
      .from('AdminUser')
      .select('*')
      .eq('email', email)
      .eq('isActive', true)
      .single()

    if (error || !admin) {
      console.log('Admin user not found:', error)
      return { success: false, error: 'Invalid credentials' }
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password)
    if (!isValidPassword) {
      console.log('Invalid password for admin:', email)
      return { success: false, error: 'Invalid credentials' }
    }

    // Update last login
    await supabase
      .from('AdminUser')
      .update({ lastLoginAt: new Date().toISOString() })
      .eq('id', admin.id)

    // Remove password from response
    const { password: _, ...adminWithoutPassword } = admin

    console.log('Admin authentication successful:', admin.email)
    return { 
      success: true, 
      admin: adminWithoutPassword
    }
  } catch (error) {
    console.error('Admin authentication error:', error)
    return { success: false, error: 'Authentication failed' }
  }
}

export async function verifyAdminSession(adminId: string): Promise<{ success: boolean; admin?: AdminUser; error?: string }> {
  try {
    console.log('🔍 Verifying admin session for ID:', adminId)
    
    const supabase = await createAdminClient()

    // Get admin user
    const { data: admin, error: adminError } = await supabase
      .from('AdminUser')
      .select('*')
      .eq('id', adminId)
      .eq('isActive', true)
      .single()

    if (adminError || !admin) {
      console.log('❌ Admin user not found or inactive:', adminError)
      return { success: false, error: 'Admin user not found' }
    }

    // Remove password from response
    const { password: _, ...adminWithoutPassword } = admin

    console.log('✅ Admin session verified:', admin.email)
    return { 
      success: true, 
      admin: adminWithoutPassword 
    }
  } catch (error) {
    console.error('Admin session verification error:', error)
    return { success: false, error: 'Session verification failed' }
  }
}

export async function logoutAdmin(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Admin logout successful')
    return { success: true }
  } catch (error) {
    console.error('Admin logout error:', error)
    return { success: false, error: 'Logout failed' }
  }
}
