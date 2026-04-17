"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { getUserType } from "@/lib/erp-logic"
import { 
  Loader2, LayoutGrid, Users, BookOpen, GraduationCap, 
  IndianRupee, Bell, Settings, LogOut, ChevronRight, 
  ChevronLeft, Search, ClipboardList, Menu, X, Shield
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { 
    label: "Core", 
    items: [
      { icon: LayoutGrid, label: "Dashboard", href: "/management/admin/dashboard" },
      { icon: Users, label: "Students", href: "/management/students" },
    ]
  },
  { 
    label: "Academics", 
    items: [
      { icon: BookOpen, label: "Courses", href: "/management/courses" },
      { icon: GraduationCap, label: "Scholarship", href: "/management/scholarship" },
      { icon: ClipboardList, label: "Attendance", href: "/management/attandance" },
    ]
  },
  { 
    label: "Finance", 
    items: [
      { icon: IndianRupee, label: "Fees Setup", href: "/management/fees" },
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
         "fixed lg:relative inset-y-0 left-0 z-50 flex flex-col bg-[#0F1923] transition-all duration-300 ease-in-out",
         isCollapsed ? "w-[72px]" : "w-64",
         mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        
        {/* Brand */}
        <div className={cn("flex items-center border-b border-white/5 h-16 px-4 flex-shrink-0", isCollapsed ? "justify-center" : "gap-3")}>
          <div className="h-9 w-9 min-w-[36px] bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/30">
            <span className="text-white font-black text-sm">E</span>
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden animate-in fade-in slide-in-from-left-2 duration-200">
              <p className="text-white font-bold text-sm leading-none">ERP Portal</p>
              <p className="text-white/30 text-[9px] uppercase tracking-widest mt-0.5">Management Suite</p>
            </div>
          )}
          {!isCollapsed && (
            <button onClick={() => setMobileOpen(false)} className="ml-auto lg:hidden text-white/30 hover:text-white">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Collapse Toggle (desktop) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-20 h-6 w-6 bg-[#0F1923] border border-white/10 rounded-full items-center justify-center text-white/40 hover:text-emerald-400 transition-colors z-50"
        >
          {isCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-hide space-y-6">
          {NAV_ITEMS.map((group) => (
            <div key={group.label}>
              {!isCollapsed && (
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/20 px-3 mb-2">{group.label}</p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + "/")
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "group flex items-center h-10 rounded-xl transition-all duration-200",
                        isCollapsed ? "justify-center px-0" : "gap-3 px-3",
                        active
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "text-white/40 hover:text-white/80 hover:bg-white/5"
                      )}
                    >
                      <item.icon size={16} className={cn("flex-shrink-0 transition-colors", active ? "text-emerald-400" : "text-white/30 group-hover:text-white/70")} />
                      {!isCollapsed && (
                        <span className={cn("text-[13px] font-semibold truncate", active && "font-bold")}>{item.label}</span>
                      )}
                      {!isCollapsed && active && (
                        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Card */}
        <div className="p-3 border-t border-white/5 flex-shrink-0">
          <div className={cn("flex items-center rounded-xl p-2.5 bg-white/5", isCollapsed ? "justify-center" : "gap-3")}>
            <div className="h-8 w-8 min-w-[32px] rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-xs shadow-sm">
              {mgmtUser?.fullname?.charAt(0) || "A"}
            </div>
            {!isCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-white/80 truncate leading-none">{mgmtUser?.fullname || "Admin"}</p>
                  <p className="text-[9px] text-white/30 uppercase tracking-widest mt-0.5">Staff</p>
                </div>
                <button onClick={handleLogout} className="h-7 w-7 flex items-center justify-center text-white/20 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-all">
                  <LogOut size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main Area ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 z-20 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden h-9 w-9 flex items-center justify-center text-slate-500 hover:bg-slate-50 rounded-lg">
              <Menu size={20} />
            </button>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Management Portal</p>
              <h1 className="text-sm font-bold text-slate-800 capitalize">{currentPageLabel}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="h-9 px-3 sm:px-4 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg flex items-center gap-2 text-xs font-semibold transition-all border border-slate-100 hover:border-slate-200">
              <Search size={14} /> <span className="hidden sm:inline">Search</span>
            </button>
            <button className="h-9 w-9 bg-white border border-slate-100 text-slate-400 hover:text-slate-600 rounded-lg flex items-center justify-center transition-all">
              <Bell size={16} />
            </button>
            <div className="flex items-center gap-2 h-9 px-2 sm:px-3 bg-emerald-50 text-emerald-700 text-[10px] sm:text-xs font-bold rounded-lg border border-emerald-100 italic">
              <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="hidden xs:inline">Live</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
