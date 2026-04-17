"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { getUserType } from "@/lib/erp-logic"
import { Loader2, Mail, Lock, ArrowRight, ShieldAlert, LogIn, ChevronLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useEffect } from "react"

export default function MgmtLoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const supabase = getSupabaseClient()

  const [form, setForm] = useState({
    email: "",
    password: ""
  })

  // Proactive Session Redirection
  useEffect(() => {
    async function checkExistingSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { type, role, isApproved } = await getUserType(supabase, session.user.id)
        if (type === 'management' && isApproved) {
          router.push(role === 'admin' ? "/management/admin/dashboard" : "/management/staff/dashboard")
        } else if (type === 'student') {
          router.push("/student/dashboard")
        }
      }
    }
    checkExistingSession()
  }, [router, supabase])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password
      })

      if (authError) throw authError

      if (authData.user) {
        const { type, role, isApproved } = await getUserType(supabase, authData.user.id)

        if (type !== 'management') {
          await supabase.auth.signOut()
          throw new Error("ACCESS_DENIED: UNAUTHORIZED_ROLE_QUERY")
        }

        if (!isApproved) {
          await supabase.auth.signOut()
          throw new Error("STATUS_PENDING: WAIT_FOR_ADMIN_CLEARANCE")
        }

        router.push(role === 'admin' ? "/management/admin/dashboard" : "/management/staff/dashboard")
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6 relative flex-col">
      
      {/* Brand Header */}
      <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
         <Image 
            src="/banner.png" 
            alt="AIKTC Banner" 
            width={340} 
            height={90} 
            className="object-contain"
            priority
         />
      </div>

      <div className="max-w-[420px] w-full relative z-10">
         
         <div className="bg-white border border-slate-100 rounded-[32px] p-10 md:p-14 shadow-2xl shadow-blue-900/[0.03] space-y-12 animate-in zoom-in duration-500">
            
            <div className="text-center">
               <div className="h-16 w-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <Lock size={28} className="text-[#B8860B]" />
               </div>
               <h1 className="text-2xl font-bold text-[#3E4A5B] tracking-tight">Staff Module</h1>
               <p className="text-slate-400 text-[10px] font-bold mt-2 uppercase tracking-[0.3em] flex items-center justify-center gap-2">
                  <span className="h-[1px] w-4 bg-slate-200" />
                  Management Login
                  <span className="h-[1px] w-4 bg-slate-200" />
               </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 text-left">
               <BannerInput 
                  label="Institute ID" 
                  type="email" 
                  value={form.email}
                  onChange={(v: string) => setForm({...form, email: v})}
                  placeholder="name@aiktc.ac.in"
               />

               <BannerInput 
                  label="Password" 
                  type="password" 
                  value={form.password}
                  onChange={(v: string) => setForm({...form, password: v})}
                  placeholder="••••••••"
               />

               {error && (
                  <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl flex items-center gap-3 text-red-600 text-[10px] font-bold uppercase tracking-widest animate-in slide-in-from-top-1">
                     <ShieldAlert size={14} /> {error}
                  </div>
               )}

               <div className="pt-6">
                  <button 
                     disabled={loading}
                     className="w-full h-12 bg-[#3E4A5B] hover:bg-[#2F3E46] text-white rounded-xl font-bold tracking-wide text-sm transition-all flex items-center justify-center gap-2 active:scale-98 shadow-xl shadow-slate-900/10 disabled:opacity-50"
                  >
                     {loading ? <Loader2 className="animate-spin" size={18} /> : 
                      <>Sign In <ArrowRight size={18} /></>}
                  </button>
               </div>
            </form>

            <div className="flex flex-col gap-6 text-center border-t border-slate-50 pt-10">
               <p className="text-slate-400 text-[11px] font-medium tracking-wide">
                  Unauthorized Access? <Link href="/portal/mgmt/auth/register" className="text-[#B8860B] font-bold hover:underline">Request Token</Link>
               </p>
               <Link href="/student/login" className="text-slate-200 text-[9px] font-bold uppercase tracking-[0.2em] hover:text-[#3E4A5B] transition-colors mt-2">← Back to Student Hub</Link>
            </div>
         </div>

         <div className="mt-12 text-center text-slate-200 text-[9px] font-bold uppercase tracking-[0.4em]">
            AIKTC Institutional Resource Planning
         </div>
      </div>
    </div>
  )
}

function BannerInput({ label, type, value, onChange, placeholder }: any) {
  const [isFocused, setIsFocused] = useState(false)
  
  return (
    <div className="space-y-1.5 group text-left">
       <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-focus-within:text-[#3E4A5B] transition-colors pl-1 block text-left">{label}</label>
       <div className={cn(
          "relative h-11 transition-all duration-300 border flex items-center rounded-xl",
          isFocused ? "bg-white border-[#B8860B] shadow-md shadow-amber-500/[0.05]" : "bg-slate-50 border-slate-100 hover:border-slate-200"
       )}>
          <input 
             type={type} 
             value={value}
             onChange={(e) => onChange(e.target.value)}
             onFocus={() => setIsFocused(true)}
             onBlur={() => setIsFocused(false)}
             placeholder={placeholder}
             className="w-full h-full bg-transparent px-4 text-[13px] font-semibold text-[#3E4A5B] placeholder:text-slate-700 outline-none transition-all font-sans tracking-tight"
          />
       </div>
    </div>
  )
}
