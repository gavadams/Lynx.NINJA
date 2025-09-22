"use client"

import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { User, LogOut, Menu } from "lucide-react"

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { data: session } = useSession()

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={onMenuClick}
              className="lg:hidden mr-3 p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="text-lg lg:text-xl font-semibold text-gray-900 truncate">
              <span className="hidden sm:inline">Welcome back, </span>{session?.user?.name || "User"}
            </h2>
          </div>
          
          <div className="flex items-center space-x-2 lg:space-x-4">
            <div className="hidden sm:flex items-center space-x-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-foreground truncate max-w-32 lg:max-w-none">{session?.user?.email}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut()}
              className="flex items-center space-x-1 lg:space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
