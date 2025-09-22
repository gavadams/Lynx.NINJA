import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import TwitterProvider from "next-auth/providers/twitter"
import InstagramProvider from "next-auth/providers/instagram"
import CredentialsProvider from "next-auth/providers/credentials"
import { getBaseUrl } from "./url"

export const authOptions: NextAuthOptions = {
  providers: [
    // Email/Password credentials provider
    CredentialsProvider({
      name: "Email/Password",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "your@email.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Verify credentials directly against database
          const { createServerClient } = await import('@supabase/ssr')
          const { cookies } = await import('next/headers')
          const bcrypt = await import('bcryptjs')

          const cookieStore = await cookies()
          const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
              cookies: {
                get(name: string) {
                  return cookieStore.get(name)?.value
                },
              },
            }
          )

          // Find user by email
          const { data: user, error } = await supabase
            .from('User')
            .select('id, email, displayName, profileImage, password')
            .eq('email', credentials.email)
            .single()

          if (error || !user) {
            return null
          }

          // Check if user has a password (some users might be OAuth only)
          if (!user.password) {
            return null
          }

          // Verify password
          const isValidPassword = await bcrypt.default.compare(credentials.password, user.password)
          if (!isValidPassword) {
            return null
          }

          // Return user data (without password)
          return {
            id: user.id,
            email: user.email,
            name: user.displayName,
            image: user.profileImage
          }
        } catch (error) {
          console.error("Auth verification error:", error)
        }

        return null
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "dummy",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "dummy",
    }),
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID || "dummy",
      clientSecret: process.env.TWITTER_CLIENT_SECRET || "dummy",
    }),
    InstagramProvider({
      clientId: process.env.INSTAGRAM_CLIENT_ID || "dummy",
      clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || "dummy",
    }),
  ],
  callbacks: {
    session: async ({ session, token }) => {
      if (session?.user && token?.sub) {
        // token.sub contains the user ID, not email
        // We need to get the email from the user object or token
        session.user.id = token.sub
        if (token.email) {
          session.user.email = token.email
        }
      }
      return session
    },
    jwt: async ({ user, token }) => {
      if (user) {
        token.uid = user.id
        token.email = user.email
      }
      return token
    },
    signIn: async ({ user, account, profile }) => {
      // Auto-create user profile in database
      if (user?.id && user?.email) {
        try {
                 const response = await fetch(`${getBaseUrl()}/api/user/profile`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
            }),
          })
          
          if (!response.ok) {
            console.log('User profile creation failed, but continuing with sign in')
          }
        } catch (error) {
          console.log('Error creating user profile:', error)
        }
      }
      return true
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  debug: process.env.NODE_ENV === "development",
}
