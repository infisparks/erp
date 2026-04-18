"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { getUserType } from "@/lib/erp-logic"
import { 
  Loader2, LayoutGrid, Users, BookOpen, GraduationCap, 
  IndianRupee, Bell, Settings, LogOut, ChevronRight, 
  ChevronLeft, Search, ClipboardList, Menu, X, Shield, XCircle,
  Receipt
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

const NAV_ITEMS = [
  { 
    label: "Core", 
    items: [
      { icon: LayoutGrid, label: "Dashboard", href: "/management/admin/dashboard" },
      { icon: Users, label: "Students", href: "/management/students" },
      { icon: Receipt, label: "Student Ledger", href: "/management/students/ledger" },
      { icon: XCircle, label: "Cancellations", href: "/management/students/cancellations" },
    ]
  },
  { 
    label: "Academics", 
    items: [
      { icon: BookOpen, label: "Courses", href: "/management/courses" },
      { icon: GraduationCap, label: "Scholarship", href: "/management/students/scholarships" },
      { icon: ClipboardList, label: "Attendance", href: "/management/attandance" },
    ]
  },
  { 
    label: "Finance", 
    items: [
      { icon: IndianRupee, label: "Fees Setup", href: "/management/fees" },
      { icon: Shield, label: "Trusts", href: "/management/trusts" },
    ]
  },
  { 
    label: "System", 
    items: [
      { icon: Settings, label: "Settings", href: "/management/settings" },
    ]
  },
]

export default function ManagementLayout({ children }: { children: React.ReactNode }) {
  const [isVerifying, setIsVerifying] = useState(true)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mgmtUser, setMgmtUser] = useState<any>(null)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = getSupabaseClient()

  useEffect(() => {
    async function checkMgmtAccess() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
         if (!pathname.includes("/auth/")) router.push("/portal/mgmt/auth/login")
         else setIsVerifying(false)
         return
      }
      const { type, isApproved, profile } = await getUserType(supabase, session.user.id)
      if (type !== 'management' || (!isApproved && !pathname.includes("/auth/"))) {
         await supabase.auth.signOut()
         router.push("/portal/mgmt/auth/login")
         return
      }
      setMgmtUser(profile)
      setIsVerifying(false)
    }
    checkMgmtAccess()
  }, [pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/portal/mgmt/auth/login")
  }

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg">
          <Shield size={20} className="text-white" />
        </div>
        <Loader2 className="animate-spin text-emerald-600" size={24} />
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Verifying Access</p>
      </div>
    )
  }

  if (pathname.includes("/auth/")) return <>{children}</>

  const currentPageLabel = NAV_ITEMS.flatMap(g => g.items).find(item => 
    pathname === item.href || pathname.startsWith(item.href + "/")
  )?.label || pathname.split('/').pop()?.replace(/-/g, ' ')

  return (
    <div className="flex min-h-screen bg-[#F5F6FA]">
      
      {/* ── Mobile Overlay ──────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className={cn(
         "fixed lg:relative inset-y-0 left-0 z-50 flex flex-col bg-[#09090b] transition-all duration-300 ease-in-out border-r border-white/5",
         isCollapsed ? "w-[78px]" : "w-[280px]",
         mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        
        {/* Brand */}
        <div className={cn("flex items-center h-20 px-6 flex-shrink-0", isCollapsed ? "justify-center" : "gap-3")}>
          <div className="h-10 w-10 min-w-[40px] bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 rotate-3 group-hover:rotate-0 transition-transform">
            <Shield className="text-white h-5 w-5" />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden animate-in fade-in slide-in-from-left-3 duration-300">
              <p className="text-white font-black text-lg tracking-tight leading-none">TRUST<span className="text-emerald-500">ERP</span></p>
              <p className="text-white/20 text-[9px] font-black uppercase tracking-[0.3em] mt-1">Institutional OS</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 scrollbar-hide space-y-8">
          {NAV_ITEMS.map((group) => (
            <div key={group.label} className="space-y-3">
              {!isCollapsed && (
                 <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/15 px-4 mb-2">{group.label}</p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = pathname === item.href || (
                    pathname.startsWith(item.href + "/") && 
                    !(item.href === "/management/students" && pathname.startsWith("/management/students/cancellations"))
                  )
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "group flex items-center h-12 rounded-2xl transition-all duration-200",
                        isCollapsed ? "justify-center px-0" : "gap-4 px-4",
                        active
                          ? "bg-white/10 text-white shadow-sm ring-1 ring-white/10"
                          : "text-white/40 hover:text-white/80 hover:bg-white/5"
                      )}
                    >
                      <item.icon size={18} className={cn("flex-shrink-0 transition-colors", active ? "text-emerald-400" : "text-white/20 group-hover:text-white/60")} />
                      {!isCollapsed && (
                        <span className={cn("text-sm font-semibold tracking-tight", active && "font-bold")}>{item.label}</span>
                      )}
                      {!isCollapsed && active && (
                        <div className="ml-auto h-5 w-1 bg-emerald-500 rounded-full" />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-white/5 flex-shrink-0">
          <div className={cn("flex items-center rounded-[24px] p-3 bg-white/5 border border-white/5", isCollapsed ? "justify-center" : "gap-3")}>
            <div className="h-10 w-10 min-w-[40px] rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-black text-sm shadow-xl shadow-emerald-900/40">
              {mgmtUser?.fullname?.charAt(0) || "A"}
            </div>
            {!isCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-white/90 truncate leading-none">{mgmtUser?.fullname || "Administrator"}</p>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-none text-[8px] font-black uppercase tracking-widest mt-1 px-1.5 h-4">System Master</Badge>
                </div>
                <button onClick={handleLogout} className="h-9 w-9 flex items-center justify-center text-white/20 hover:text-red-400 rounded-xl hover:bg-red-500/10 transition-all">
                  <LogOut size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main Area ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Modern Topbar */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 z-20 flex-shrink-0 sticky top-0">
          <div className="flex items-center gap-6">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden h-10 w-10 flex items-center justify-center text-slate-500 hover:bg-slate-50 rounded-xl border border-slate-200">
              <Menu size={20} />
            </button>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-0.5">
                 <span>Portal</span>
                 <ChevronRight size={10} />
                 <span className="text-emerald-600">Active Node</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight capitalize leading-none">{currentPageLabel}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden md:block group">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
               <input 
                  type="text" 
                  placeholder="Global Audit Search..." 
                  className="h-11 w-64 bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 text-xs font-bold text-slate-600 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/20 transition-all"
               />
               <div className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-black text-slate-300 shadow-sm">
                  CMD K
               </div>
            </div>
            
            <button className="h-11 w-11 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-300 rounded-2xl flex items-center justify-center transition-all group relative">
              <Bell size={18} />
              <div className="absolute top-3 right-3 h-2 w-2 bg-red-500 rounded-full border-2 border-white" />
            </button>

            <div className="h-11 px-4 bg-slate-900 text-white rounded-2xl flex items-center gap-3 border shadow-lg shadow-slate-200 transition-all hover:scale-105 active:scale-95 cursor-pointer">
               <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse shadow-glow shadow-emerald-500" />
               <span className="text-[10px] font-black uppercase tracking-[0.1em]">Verified Node</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#FAFAFA] p-8 lg:p-12">
          <div className="max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
