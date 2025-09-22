"use client"

import { signIn, getSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    
    try {
      const result = await signIn("credentials", { 
        email,
        password,
        callbackUrl: "/dashboard",
        redirect: false 
      })
      
      if (result?.ok) {
        router.push("/dashboard")
      } else {
        setError("Invalid credentials. Please check your email and password.")
      }
    } catch (error) {
      console.error("Sign in error:", error)
      setError("Sign in failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: string) => {
    setIsLoading(true)
    try {
      const result = await signIn(provider, { 
        callbackUrl: "/dashboard",
        redirect: false 
      })
      
      if (result?.ok) {
        router.push("/dashboard")
      } else if (result?.error) {
        console.error("Sign in error:", result.error)
        setError("OAuth sign in failed. Please check your OAuth configuration.")
      }
    } catch (error) {
      console.error("Sign in error:", error)
      setError("OAuth sign in failed. Please check your OAuth configuration.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Sign in to {process.env.NEXT_PUBLIC_SITE_NAME || 'Lynx.NINJA'}</CardTitle>
            <CardDescription className="text-center">
              Create your link-in-bio page in minutes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Sign In Form */}
            <form onSubmit={handleCredentialsSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>
              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* OAuth Buttons */}
            <div className="space-y-2">
              <Button
                onClick={() => handleOAuthSignIn("google")}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                Continue with Google
              </Button>
              
              <Button
                onClick={() => handleOAuthSignIn("twitter")}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                Continue with Twitter
              </Button>
              
              <Button
                onClick={() => handleOAuthSignIn("instagram")}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                Continue with Instagram
              </Button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don&apos;t have an account?{" "}
                <Link href="/auth/signup" className="text-blue-600 hover:text-blue-500">
                  Sign up
                </Link>
              </p>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}
