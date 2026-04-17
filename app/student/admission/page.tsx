"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import AdmissionForm from "@/components/admission-form"
import { Loader2 } from "lucide-react"

export default function StudentAdmissionPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = getSupabaseClient()

  useEffect(() => {
    const checkState = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/student/login")
        return
      }

      setUser(session.user)

      // Fetch student record to check verification status
      const { data: studentData } = await supabase
        .from("students")
        .select("is_verifiedby_admin")
        .eq("user_id", session.user.id)
        .maybeSingle()

      if (studentData?.is_verifiedby_admin) {
        router.push("/")
        return
      }

      setLoading(false)
    }

    checkState()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FB] flex flex-col items-center justify-center font-sans">
        <Loader2 className="h-10 w-10 animate-spin text-[#1A3A6B] mb-4" />
        <p className="text-[#1A3A6B] font-bold tracking-tight uppercase text-[10px] tracking-[0.2em]">Syncing Admission Services...</p>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-[#F5F7FB] font-sans">
        <AdmissionForm user={{ id: user.id, email: user.email }} />
    </div>
  )
}
