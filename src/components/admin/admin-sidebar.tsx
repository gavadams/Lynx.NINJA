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
  Send
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
  { name: "Settings", href: "/admin/settings", icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900">
      <div className="flex h-16 shrink-0 items-center px-6">
        <h1 className="text-xl font-bold text-white">Admin Panel</h1>
      </div>
      <nav className="flex flex-1 flex-col px-3 py-4">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => {
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
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  )
}
