"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import AdmissionForm from "@/components/admission-form"
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function EditAdmissionPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = getSupabaseClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/student/login")
        return
      }
      setUser(session.user)
      setLoading(false)
    }
    checkUser()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FB] flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#2E75C7] mb-4" />
        <p className="text-[#1A3A6B] font-bold tracking-tight">Loading Portal...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F7FB]">
       {/* Header for the Edit Page */}
       <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-[60] lg:hidden">
          <Link href="/student/profile" className="flex items-center gap-2 text-[#1A3A6B]">
            <ArrowLeft size={18} />
            <span className="text-sm font-black uppercase tracking-wider">Back to Profile</span>
          </Link>
       </div>

       <div className="max-w-4xl mx-auto py-6">
          <div className="px-6 mb-8 hidden lg:block">
             <Link href="/student/profile" className="inline-flex items-center gap-2 text-gray-400 hover:text-[#1A3A6B] transition-colors group">
               <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em]">Profile Settings / Edit Admission</span>
             </Link>
          </div>

          <div className="mb-10 px-6">
             <h1 className="text-3xl font-black text-[#1A3A6B] tracking-tight uppercase mb-2">Review & Correct Records</h1>
             <p className="text-gray-400 text-sm font-medium">Verify your enrollment data. If something is locked and incorrect, use the "Inform Admin" option at the end.</p>
          </div>

          <AdmissionForm 
            user={{ id: user.id, email: user.email }} 
            onSuccess={() => {
              alert("Update request submitted! Our administration will review your changes shortly.")
            }}
          />
       </div>
    </div>
  )
}
