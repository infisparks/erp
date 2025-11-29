"use client"

import { useState } from "react"
// MOCK: Replaced Next.js imports with mocks to fix compilation error in this environment
// import Link from "next/link"
// import { useRouter, usePathname } from "next/navigation"
import {
  Menu,
  X,
  Home,
  LogOut,
  BookOpen,
  Users,
  FileText,
  BarChart3,
  ChevronDown,
  GraduationCap,
  Briefcase,
  Wallet,
  CalendarCheck,
  TrendingUp,
  CheckSquare,
  LucideProps,
  // --- ICONS ADDED ---
  BookUser,
  Building,
  TrendingDown,
  History,
  // ------------------
} from "lucide-react"
import { ForwardRefExoticComponent, RefAttributes } from "react"
// Assuming getSupabaseClient is in this path, adjust if necessary
// import { getSupabaseClient } from "@/lib/supabase/client"

// --- MOCKS ---
// Mock Next.js Link component
const Link = (props: any) => {
  // Filter out props that are not valid for <a> tag if necessary, e.g., 'prefetch'
  const { href, children, ...rest } = props
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  )
}

// Mock Next.js navigation hooks
const useRouter = () => ({
  push: (path: string) => {
    console.log(`Mock router.push to: ${path}`)
    // In a real mock, you might want window.location.href = path
  },
})

const usePathname = () => {
  // Return a mock pathname. Adjust if a different default is needed.
  if (typeof window !== "undefined") {
    return window.location.pathname
  }
  return "/dashboard"
}
// --- END MOCKS ---

// Mock function for environments where the import isn't available
// In your actual app, you'd use the import above.
const getSupabaseClient = () => {
  return {
    auth: {
      signOut: () =>
        new Promise<void>(resolve => {
          console.log("Mock SignOut")
          setTimeout(resolve, 500)
        }),
    },
  }
}

interface SidebarProps {
  user?: any
}

// Define type for Lucide icons
type LucideIcon = ForwardRefExoticComponent<
  Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
>

// Type definitions for navigation items
type NavLinkItem = {
  type: "link"
  icon: LucideIcon
  label: string
  href: string
}

type NavSubItem = {
  icon: LucideIcon
  label: string
  href: string
}

type NavSectionItem = {
  type: "section"
  icon: LucideIcon
  title: string
  subItems: NavSubItem[]
}

type NavItem = NavLinkItem | NavSectionItem

// New component for individual navigation links
const NavLink = ({
  item,
  isOpen,
  isActive,
}: {
  item: { icon: LucideIcon; label: string; href: string } // Use NavSubItem or similar structure
  isOpen: boolean
  isActive: boolean
}) => (
  <Link
    href={item.href}
    className={`flex items-center gap-3 py-2.5 rounded-lg transition-all duration-200 group ${
      isOpen ? "px-4" : "px-3 justify-center"
    } ${
      isActive
        ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-100"
        : "hover:bg-blue-700/50 text-blue-200 hover:text-white"
    }`}
    title={!isOpen ? item.label : ""}
  >
    <item.icon
      size={isOpen ? 20 : 22}
      className={`flex-shrink-0 transition-colors ${
        isActive ? "text-cyan-400" : "text-blue-300 group-hover:text-cyan-400"
      }`}
    />
    {isOpen && <span className="text-sm font-medium">{item.label}</span>}
  </Link>
)

// New component for collapsible navigation sections
const NavSection = ({
  title,
  icon: Icon,
  isOpen,
  isActive,
  children,
}: {
  title: string
  icon: LucideIcon
  isOpen: boolean
  isActive: boolean
  children: React.ReactNode
}) => {
  const [isSectionOpen, setIsSectionOpen] = useState(isActive)

  return (
    <div>
      <button
        onClick={() => setIsSectionOpen(!isSectionOpen)}
        className={`flex items-center justify-between w-full py-2.5 rounded-lg transition-all duration-200 group ${
          isOpen ? "px-4" : "px-3 justify-center"
        } ${
          isActive
            ? "bg-blue-700/50 text-white"
            : "hover:bg-blue-700/50 text-blue-200 hover:text-white"
        }`}
        title={!isOpen ? title : ""}
      >
        <div className="flex items-center gap-3">
          <Icon
            size={isOpen ? 20 : 22}
            className={`flex-shrink-0 transition-colors ${
              isActive ? "text-cyan-400" : "text-blue-300 group-hover:text-cyan-400"
            }`}
          />
          {isOpen && <span className="text-sm font-medium">{title}</span>}
        </div>
        {isOpen && (
          <ChevronDown
            size={16}
            className={`transition-transform ${isSectionOpen ? "rotate-180" : ""}`}
          />
        )}
      </button>
      {isSectionOpen && isOpen && (
        <div className="pt-2 pl-6 pr-2 space-y-1">{children}</div>
      )}
    </div>
  )
}

export default function Sidebar({ user }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const supabase = getSupabaseClient()
      await supabase.auth.signOut()
      router.push("/") // Navigate to home/login page after logout
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  // Define navigation structure
  const navItems: NavItem[] = [
    {
      type: "link",
      icon: Home,
      label: "Dashboard",
      href: "/dashboard",
    },
    {
  type: "link",
  icon: Users,
  label: "Admin",
  href: "/admin",
},
  
    {
      type: "section",
      title: "Admission",
      icon: FileText,
      subItems: [{ icon: FileText, label: "Admissions", href: "/admission" }],
    },
    {
      type: "section",
      title: "Teachers",
      icon: Briefcase,
      subItems: [
        { icon: Users, label: "Teachers", href: "/teachers" },
        { icon: BarChart3, label: "Teachers List", href: "/teachers/list" },
        { icon: Wallet, label: "Teachers Payment", href: "/teachers/payment" },
      ],
    },
    {
      type: "section",
      title: "Student",
      icon: GraduationCap,
      subItems: [
        { icon: BarChart3, label: "Students List", href: "/student" },
        { icon: Wallet, label: "Students fees", href: "/student/fees" },
        { icon: Wallet, label: "payments", href: "/student/payment-bifurcation" },
        {
          icon: TrendingUp,
          label: "Pending Registration",
          href: "/student/registration-pending",
        },
      ],
    },
    // --- NEWLY ADDED TRUST MANAGEMENT SECTION ---
    {
      type: "section",
      title: "Trust Management",
      icon: BookUser, // Main icon for the section
      subItems: [
        {
          icon: History,
          label: "Trust Analytics",
          href: "/trust-management",
        },
        {
          icon: Building,
          label: "Manage Trusts",
          href: "/trust-management/manage",
        },
        {
          icon: TrendingUp,
          label: "Add Funds (Inflow)",
          href: "/trust-management/inflow",
        },
        {
          icon: TrendingDown,
          label: "Assign to Student",
          href: "/trust-management/outflow",
        },
      ],
    },
    // ---------------------------------------------
    {
      type: "link",
      icon: BookOpen,
      label: "Courses",
      href: "/academics",
    },
    {
      type: "link",
      icon: Wallet,
      label: "Cources Fees",
      href: "/fees",
    },
    {
      type: "link",
      icon: CalendarCheck,
      label: "Student Attendance",
      href: "/attandance",
    },
  ]

  const isActive = (href: string) => pathname === href
  const isSectionActive = (subItems: NavSubItem[]) =>
    subItems.some(item => isActive(item.href))

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-gradient-to-br from-blue-600 to-blue-7G00 text-white hover:shadow-lg transition-all"
        aria-label="Toggle sidebar"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar Background Overlay (Mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-blue-950 via-blue-900 to-blue-950 text-white transition-all duration-300 z-40 shadow-2xl flex flex-col
          ${isOpen ? "w-64" : "w-20"}
          md:w-64 overflow-hidden`}
      >
        {/* Logo Section */}
        <div
          className={`p-6 border-b border-blue-700/50 transition-all duration-300 ${
            !isOpen ? "px-4" : ""
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center font-bold text-sm shadow-lg flex-shrink-0">
              ERP
            </div>
            {isOpen && (
              <div className="overflow-hidden">
                <h1 className="text-lg font-bold text-white">InfiEdu</h1>
                <p className="text-xs text-blue-300">College Management</p>
              </div>
            )}
          </div>
        </div>

        {/* User Info Section */}
        {isOpen && user && (
          <div className="px-6 py-4 border-b border-blue-700/50 bg-blue-800/30">
            <p className="text-xs text-blue-300 uppercase tracking-wider">
              Logged in as
            </p>
            <p className="text-sm font-semibold text-white truncate mt-1">
              {user.email}
            </p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item, index) => {
            if (item.type === "link") {
              return (
                <NavLink
                  key={item.href || index}
                  item={item}
                  isOpen={isOpen}
                  isActive={isActive(item.href)}
                />
              )
            }
            if (item.type === "section") {
              const active = isSectionActive(item.subItems)
              return (
                <NavSection
                  key={item.title}
                  title={item.title}
                  icon={item.icon}
                  isOpen={isOpen}
                  isActive={active}
                >
                  {item.subItems.map(subItem => (
                    <NavLink
                      key={subItem.href}
                      item={subItem}
                      isOpen={isOpen}
                      isActive={isActive(subItem.href)}
                    />
                  ))}
                </NavSection>
              )
            }
            return null
          })}
        </nav>

        {/* Logout Button */}
        <div
          className={`p-4 border-t border-blue-700/50 bg-blue-800/20 ${
            !isOpen ? "flex justify-center" : ""
          }`}
        >
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-red-600/20 to-red-600/10 hover:from-red-600/30 hover:to-red-600/20 text-red-300 hover:text-red-200 transition-all w-full ${
              !isOpen ? "justify-center px-0" : ""
            } disabled:opacity-50 group`}
            title={!isOpen ? "Logout" : ""}
          >
            <LogOut size={20} className="flex-shrink-0" />
            {isOpen && (
              <span className="text-sm font-medium">
                {isLoggingOut ? "Logging out..." : "Logout"}
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  )
}