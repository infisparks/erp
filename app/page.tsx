"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ShieldCheck, GraduationCap } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { getStudentProfile } from "@/lib/erp-logic"

/**
 * Universal Gatekeeper (Client-Side Validated)
 * 
 * Securely routes users based on their role and verification status.
 */
export default function Home() {
  const [status, setStatus] = useState("Initializing...")
  const router = useRouter()

  useEffect(() => {
    const checkUserAndRedirect = async () => {
      try {
        setStatus("Verifying authenticity...")
        const supabase = getSupabaseClient()
        
        // 1. Check Auth 
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.replace("/student/login")
          return
        }

        const user = session.user
        const role = user.user_metadata?.role

        // 2. Role-based routing
        if (role === 'admin') {
          setStatus("Granting Management Access...")
          router.replace("/management/dashboard")
          return
        }

        // 3. Student state routing
        setStatus("Checking profile status...")
        const student = await getStudentProfile(supabase, user.id)

        if (!student || !student.is_verifiedby_admin) {
          setStatus("Redirecting to Admission...")
          router.replace("/student/admission")
        } else {
          setStatus("Accessing Dashboard...")
          router.replace("/student/dashboard")
        }

      } catch (error: any) {
        console.error("Secure Routing Error:", error)
        setStatus("Session error. Re-authenticating...")
        setTimeout(() => router.replace("/student/login"), 1500)
      }
    }

    checkUserAndRedirect()
  }, [router])

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex flex-col items-center justify-center font-sans">
        <div className="relative flex flex-col items-center max-w-sm w-full px-8 text-center">
            <div className="w-20 h-20 bg-[#1A3A6B] rounded-2xl flex items-center justify-center shadow-xl mb-10">
                <GraduationCap className="text-white" size={40} />
            </div>

            <div className="flex flex-col items-center gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-[#2E75C7]" />
                    <h1 className="text-[#1A3A6B] text-xs font-black tracking-[0.2em] uppercase">{status}</h1>
                </div>
            </div>
            
            <div className="pt-8 border-t border-gray-200 w-full flex items-center justify-center gap-2">
                <ShieldCheck size={14} className="text-[#2E75C7]" />
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">
                    Secured ERP Handshake
                </p>
            </div>
        </div>
    </div>
  )
}
