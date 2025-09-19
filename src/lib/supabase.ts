import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types (we'll define these based on your schema)
export interface Database {
  public: {
    Tables: {
      User: {
        Row: {
          id: string
          email: string
          username: string
          displayName: string | null
          profileImage: string | null
          isPremium: boolean
          customDomain: string | null
          theme: any
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          email: string
          username: string
          displayName?: string | null
          profileImage?: string | null
          isPremium?: boolean
          customDomain?: string | null
          theme?: any
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          displayName?: string | null
          profileImage?: string | null
          isPremium?: boolean
          customDomain?: string | null
          theme?: any
          createdAt?: string
          updatedAt?: string
        }
      }
      Link: {
        Row: {
          id: string
          title: string
          url: string
          isActive: boolean
          order: number
          scheduledAt: string | null
          expiresAt: string | null
          clicks: number
          userId: string
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          title: string
          url: string
          isActive?: boolean
          order: number
          scheduledAt?: string | null
          expiresAt?: string | null
          clicks?: number
          userId: string
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          title?: string
          url?: string
          isActive?: boolean
          order?: number
          scheduledAt?: string | null
          expiresAt?: string | null
          clicks?: number
          userId?: string
          createdAt?: string
          updatedAt?: string
        }
      }
      Analytics: {
        Row: {
          id: string
          linkId: string | null
          userId: string
          clickTime: string
          ipAddress: string | null
          userAgent: string | null
          referer: string | null
          country: string | null
          city: string | null
          device: string | null
          browser: string | null
        }
        Insert: {
          id?: string
          linkId?: string | null
          userId: string
          clickTime?: string
          ipAddress?: string | null
          userAgent?: string | null
          referer?: string | null
          country?: string | null
          city?: string | null
          device?: string | null
          browser?: string | null
        }
        Update: {
          id?: string
          linkId?: string | null
          userId?: string
          clickTime?: string
          ipAddress?: string | null
          userAgent?: string | null
          referer?: string | null
          country?: string | null
          city?: string | null
          device?: string | null
          browser?: string | null
        }
      }
    }
  }
}
