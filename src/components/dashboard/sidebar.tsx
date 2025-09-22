"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useInvitations } from "@/hooks/useInvitations"
import { useFeatureFlag } from "@/lib/feature-flags"
import { getSiteConfig } from "@/lib/config"
import { 
  LayoutDashboard, 
  Link as LinkIcon, 
  BarChart3, 
  Palette, 
  Settings,
  User,
  Users,
  Mail,
  X
} from "lucide-react"
import Image from "next/image"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Links", href: "/dashboard/links", icon: LinkIcon },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Teams", href: "/dashboard/teams", icon: Users },
  { name: "Themes", href: "/dashboard/themes", icon: Palette },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { invitationCount } = useInvitations()
  const teamsEnabled = useFeatureFlag('teams')
  const analyticsEnabled = useFeatureFlag('analytics')
  const themesEnabled = useFeatureFlag('themes')
  const { siteName } = getSiteConfig()

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "flex h-full w-64 flex-col bg-gray-900 transition-transform duration-300 ease-in-out",
        "lg:translate-x-0 lg:static lg:z-auto",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "fixed lg:relative z-50"
      )}>
        <div className="flex h-16 shrink-0 items-center justify-between px-6">
          <Image
            src="/logo.png"
            alt={siteName}
            width={150}
            height={48}
            className="h-12 w-auto brightness-0 invert"
          />
          <button
            onClick={onClose}
            className="lg:hidden text-white hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      <nav className="flex flex-1 flex-col px-3 py-4">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => {
                // Hide teams if feature is disabled
                if (item.name === "Teams" && !teamsEnabled) {
                  return null
                }
                
                // Hide analytics if feature is disabled
                if (item.name === "Analytics" && !analyticsEnabled) {
                  return null
                }
                
                // Hide themes if feature is disabled
                if (item.name === "Themes" && !themesEnabled) {
                  return null
                }
                
                const isActive = pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        isActive
                          ? "bg-gray-800 text-white"
                          : "text-gray-400 hover:text-white hover:bg-gray-800",
                        "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
                      )}
                    >
                      <item.icon
                        className="h-6 w-6 shrink-0"
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  </li>
                )
              })}
              
              {/* Invitations Link with Badge - Only show if teams are enabled */}
              {teamsEnabled && (
                <li>
                  <Link
                    href="/dashboard/teams/invitations"
                    className={cn(
                      pathname === "/dashboard/teams/invitations"
                        ? "bg-gray-800 text-white"
                        : "text-gray-400 hover:text-white hover:bg-gray-800",
                      "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
                    )}
                  >
                    <Mail className="h-6 w-6 shrink-0" aria-hidden="true" />
                    <span className="flex-1">Invitations</span>
                    {invitationCount > 0 && (
                      <span className="ml-auto inline-flex items-center rounded-full bg-red-500 px-2 py-1 text-xs font-medium text-white">
                        {invitationCount}
                      </span>
                    )}
                  </Link>
                </li>
              )}
            </ul>
          </li>
        </ul>
      </nav>
      </div>
    </>
  )
}
