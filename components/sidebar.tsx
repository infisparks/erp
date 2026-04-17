"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, CreditCard, QrCode, Calendar, UserCircle, LogOut, LayoutDashboard, Settings, Bell, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const navItems = [
  { icon: Home, label: "Home", href: "/student/dashboard" },
  { icon: CreditCard, label: "Fees", href: "/student/fees" },
  { icon: QrCode, label: "Digital ID", href: "/student/identity" },
  { icon: CheckCircle2, label: "Registration", href: "/student/registration" },
  { icon: Calendar, label: "Schedule", href: "/student/schedule" },
  { icon: UserCircle, label: "Profile", href: "/student/profile" },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await getSupabaseClient().auth.signOut()
    router.push("/student/login")
  }

  return (
    <aside className="hidden lg:flex w-72 flex-col bg-white border-r border-gray-100 flex-shrink-0 h-screen sticky top-0 overflow-y-auto">
      {/* Logo Section */}
      <div className="p-8">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 bg-gradient-to-br from-[#1A3A6B] to-[#2E75C7] rounded-xl flex items-center justify-center shadow-lg transform group-hover:rotate-6 transition-transform">
            <LayoutDashboard className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-[#1A3A6B] font-bold text-lg leading-none tracking-tight">AIKTC<span className="text-[#2E75C7]">.</span></h1>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mt-1">Student Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1.5 mt-2">
        <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Main Menu</p>
        {navItems.map(({ icon: Icon, label, href }) => {
          const isActive = pathname === href
          return (
            <Link 
              key={href} 
              href={href}
              className={cn(
                "flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all duration-300 group relative",
                isActive 
                  ? "bg-[#1A3A6B] text-white shadow-xl shadow-[#1A3A6B]/10" 
                  : "text-gray-500 hover:bg-[#F5F7FB] hover:text-[#1A3A6B]"
              )}
            >
              <Icon size={20} className={cn(
                "transition-transform group-hover:scale-110 duration-300",
                isActive ? "text-white" : "text-gray-400 group-hover:text-[#1A3A6B]"
              )} />
              <span className="text-sm font-semibold tracking-tight">{label}</span>
              
              {isActive && (
                <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white/40" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer / Profile Section */}
      <div className="p-4 mt-auto">
        <div className="bg-[#F5F7FB] rounded-2xl p-4 mb-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
              <UserCircle className="w-6 h-6 text-[#1A3A6B]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#1A3A6B] truncate">Student Dashboard</p>
              <p className="text-[10px] text-gray-400 font-medium truncate uppercase tracking-tighter">Academic Year 2024</p>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-500 text-xs font-bold hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all duration-200"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
        
        <p className="text-center text-[9px] text-gray-300 font-medium py-2 uppercase tracking-widest">
          Version 2.4.0 • ERP Systems
        </p>
      </div>
    </aside>
  )
}

export default Sidebar