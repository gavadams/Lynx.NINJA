'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Settings,
  Flag,
  Database,
  Mail,
  Shield,
  Activity,
  CreditCard,
  Calendar,
  Send,
  FileText,
  X
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Scheduled Links", href: "/admin/scheduled-links", icon: Calendar },
  { name: "Feature Flags", href: "/admin/features", icon: Flag },
  { name: "System Monitoring", href: "/admin/monitoring", icon: Activity },
  { name: "Content Moderation", href: "/admin/moderation", icon: Shield },
  { name: "Billing", href: "/admin/billing", icon: CreditCard },
  { name: "Database", href: "/admin/database", icon: Database },
  { name: "Email Tools", href: "/admin/email", icon: Mail },
  { name: "Mailing Lists", href: "/admin/mailing-lists", icon: Send },
  { name: "Email Composer", href: "/admin/email-composer", icon: FileText },
  { name: "Settings", href: "/admin/settings", icon: Settings },
]

interface AdminSidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function AdminSidebar({ isOpen = true, onClose }: AdminSidebarProps) {
  const pathname = usePathname()

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
        {/* Fixed Header */}
        <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-gray-700">
          <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          <button
            onClick={onClose}
            className="lg:hidden text-white hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Scrollable Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul role="list" className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => onClose?.()}
                    className={cn(
                      isActive
                        ? "bg-gray-800 text-white"
                        : "text-gray-400 hover:text-white hover:bg-gray-800",
                      "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors"
                    )}
                  >
                    <item.icon
                      className="h-6 w-6 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="truncate">{item.name}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </>
  )
}
