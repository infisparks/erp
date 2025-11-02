"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Menu, X, Home, LogOut, BookOpen, Users, FileText, BarChart3 } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"

interface SidebarProps {
  user?: any
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
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const navItems = [
    { icon: Home, label: "Dashboard", href: "/dashboard", show: true },
    { icon: FileText, label: "Admissions", href: "/admission", show: true },
    { icon: BookOpen, label: "Courses", href: "/academics", show: true },
    { icon: Users, label: "Teachers", href: "/teachers", show: true },
    { icon: Users, label: "Teachers List", href: "/teachers/list", show: true },
    { icon: Users, label: "Teachers Payment", href: "/teachers/payment", show: true },
    { icon: BarChart3, label: "Students List", href: "/student", show: true },
    { icon: BarChart3, label: "Cources Fees", href: "/fees", show: true },
    { icon: BarChart3, label: "Student Attendance", href: "/attandance", show: true },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white hover:shadow-lg transition-all"
        aria-label="Toggle sidebar"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar Background Overlay (Mobile) */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsOpen(false)} />}

      {/* Sidebar Container */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-blue-950 via-blue-900 to-blue-950 text-white transition-all duration-300 z-40 shadow-2xl flex flex-col
          ${isOpen ? "w-64" : "w-20"}
          md:w-64 overflow-hidden`}
      >
        {/* Logo Section */}
        <div className={`p-6 border-b border-blue-700/50 transition-all duration-300 ${!isOpen ? "px-4" : ""}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center font-bold text-sm shadow-lg">
              ERP
            </div>
            {isOpen && (
              <div>
                <h1 className="text-lg font-bold text-white">EduSoft</h1>
                <p className="text-xs text-blue-300">College Management</p>
              </div>
            )}
          </div>
        </div>

        {/* User Info Section */}
        {isOpen && user && (
          <div className="px-6 py-4 border-b border-blue-700/50 bg-blue-800/30">
            <p className="text-xs text-blue-300 uppercase tracking-wider">Logged in as</p>
            <p className="text-sm font-semibold text-white truncate mt-1">{user.email}</p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems
            .filter((item) => item.show)
            .map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    active
                      ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-l-2 border-cyan-400 text-cyan-100"
                      : "hover:bg-blue-700/50 text-blue-200 hover:text-white"
                  } group`}
                  title={!isOpen ? item.label : ""}
                >
                  <item.icon
                    size={20}
                    className={`flex-shrink-0 transition-colors ${
                      active ? "text-cyan-400" : "text-blue-300 group-hover:text-cyan-400"
                    }`}
                  />
                  {isOpen && <span className="text-sm font-medium">{item.label}</span>}
                </Link>
              )
            })}
        </nav>

        {/* Logout Button */}
        <div className={`p-4 border-t border-blue-700/50 bg-blue-800/20 ${!isOpen ? "flex justify-center" : ""}`}>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-red-600/20 to-red-600/10 hover:from-red-600/30 hover:to-red-600/20 text-red-300 hover:text-red-200 transition-all w-full ${
              !isOpen ? "justify-center px-0" : ""
            } disabled:opacity-50 group`}
            title={!isOpen ? "Logout" : ""}
          >
            <LogOut size={20} className="flex-shrink-0" />
            {isOpen && <span className="text-sm font-medium">{isLoggingOut ? "Logging out..." : "Logout"}</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
