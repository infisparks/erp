"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { BottomNav } from "@/components/bottom-nav"
import { RightSidebar } from "@/components/right-sidebar"
import { getSupabaseClient } from "@/lib/supabase/client"
import { getUserType } from "@/lib/erp-logic"
import { Loader2 } from "lucide-react"

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isVerifying, setIsVerifying] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = getSupabaseClient()

  // Define which routes should show the navigation elements (Sidebar, BottomNav, etc.)
  const hideNavOnRoutes = ["/student/login", "/student/admission", "/student/edit-admission"]
  const showNav = !hideNavOnRoutes.includes(pathname)

  useEffect(() => {
    async function checkAccess() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        if (pathname !== "/student/login") {
          router.push("/student/login")
        }
        setIsVerifying(false)
        return
      }

      const { type, role, isApproved, studentVerification } = await getUserType(supabase, session.user.id)

      if (type === 'management') {
         if (!isApproved) {
            await supabase.auth.signOut()
            router.push("/portal/mgmt/auth/login")
         } else {
            router.push(role === 'admin' ? "/management/admin/dashboard" : "/management/staff/dashboard")
         }
         return
      }

      // Student Verification Logic
      if (type === 'student') {
        const isAdminVerified = studentVerification?.admin
        const isFullyVerified = studentVerification?.accountant && studentVerification?.examcell

        // 1. Admin Verification Pending -> Force Admission/Registration Form
        if (!isAdminVerified) {
          if (pathname !== "/student/admission" && pathname !== "/student/login") {
            router.push("/student/admission")
            return
          }
        } 
        
        // 2. Admin Verified but Accountant or Examcell Pending -> Force Dashboard Only
        else if (!isFullyVerified) {
          const allowedDashboardRoutes = ["/student/dashboard", "/student/admission"] // Admission handles its own redirect if verified
          if (!allowedDashboardRoutes.includes(pathname)) {
            router.push("/student/dashboard")
            return
          }
        }
      }

      setIsVerifying(false)
    }

    checkAccess()
  }, [pathname, router, supabase])

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-[#F5F7FB] flex flex-col items-center justify-center gap-4">
         <Loader2 className="animate-spin text-[#1A3A6B]" size={32} />
         <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Academic Identity</p>
      </div>
    )
  }

  // If showNav is true, we render the full ERP layout. 
  // If false (e.g. login page), we render children directly without sidebars/nav.
  if (!showNav) {
    return (
      <main className="min-h-screen bg-white">
        {children}
      </main>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#F5F7FB]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 pb-24 lg:pb-0">
          {children}
        </main>
        <BottomNav />
      </div>
      <RightSidebar />
    </div>
  )
}
