"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { getUserType } from "@/lib/erp-logic"
import { Loader2, ShieldCheck, ArrowRight, ShieldAlert, User, Mail, Briefcase, Lock } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"

export default function MgmtRegisterPage() {
  const [loading, setLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const supabase = getSupabaseClient()

  const [form, setForm] = useState({
    fullname: "",
    email: "",
    password: "",
    department: ""
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { data: authUser, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { fullname: form.fullname, type: 'management' } }
      })

      if (authError) throw authError

      if (authUser.user) {
        const { error: dbError } = await supabase.from('management').insert({
          id: authUser.user.id,
          fullname: form.fullname,
          email: form.email,
          department: form.department,
          role: 'staff',
          is_approved: false
        })

        if (dbError) throw dbError
        setIsSuccess(true)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6 text-center">
         <div className="max-w-md w-full animate-in zoom-in duration-500">
            <div className="h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-100 shadow-sm">
               <ShieldCheck size={32} className="text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold text-[#3E4A5B] tracking-tight mb-2">Registration Submitted</h1>
            <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-xs mx-auto mb-10">
               Your staff credentials have been successfully queued for management approval.
            </p>
            <button 
               onClick={() => router.push("/portal/mgmt/auth/login")}
               className="w-full h-12 bg-[#3E4A5B] text-white rounded-xl font-bold tracking-tight hover:bg-[#2F3E46] transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10"
            >
               Return to Login <ArrowRight size={16} />
            </button>
         </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col md:flex-row font-poppins">
      
      {/* ── Visual Side ────────────────────────────────────── */}
      <div className="hidden md:flex md:w-[45%] bg-slate-50 p-16 lg:p-24 flex-col justify-between border-r border-slate-100 relative">
         <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_0%,#f1f5f9_0%,transparent_70%)] opacity-50" />
         
         <div className="relative z-10 space-y-12">
            <div className="w-[300px] relative h-[80px]">
               <Image 
                  src="/banner.png" 
                  alt="AIKTC Banner" 
                  fill 
                  className="object-contain object-left"
                  priority
               />
            </div>

            <div className="space-y-4">
               <div className="h-1.5 w-16 bg-[#B8860B] rounded-full" />
               <h2 className="text-4xl lg:text-5xl font-bold text-[#3E4A5B] leading-[1.1] tracking-tight">
                  Institutional <br/> Management <br/> 
                  <span className="text-slate-400 font-light underline decoration-[#B8860B]/30">Portal.</span>
               </h2>
               <p className="text-slate-500 font-medium text-sm max-w-xs leading-relaxed">
                  Unified Resource Planning gateway for academic and administrative oversight at AIKTC.
               </p>
            </div>
         </div>

         <div className="relative z-10 pt-10 border-t border-slate-200/60 flex items-center justify-between">
            <div>
               <p className="text-[#3E4A5B] font-bold text-[10px] uppercase tracking-[0.2em]">Management Layer</p>
               <p className="text-slate-400 text-[10px] font-medium mt-1">Secured by AIKTC Systems</p>
            </div>
            <div className="h-8 w-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-[#B8860B] font-black text-xs shadow-sm">M</div>
         </div>
      </div>

      {/* ── Form Side ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center px-6 md:px-12 lg:px-24 bg-white text-left">
         <div className="max-w-sm w-full mx-auto">
            
            <div className="mb-10 text-left">
               <h1 className="text-2xl font-bold text-[#3E4A5B] tracking-tight">Staff Registration</h1>
               <p className="text-slate-400 text-xs mt-2 font-medium">Create your administrative access account.</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
               <BannerInput 
                  label="Official Name" 
                  value={form.fullname} 
                  onChange={(v: string) => setForm({...form, fullname: v})} 
                  placeholder="e.g. Mudassir Sayyed"
               />
               <BannerInput 
                  label="Institute ID (Email)" 
                  type="email" 
                  value={form.email} 
                  onChange={(v: string) => setForm({...form, email: v})} 
                  placeholder="name@aiktc.ac.in"
               />
               <BannerInput 
                  label="Department" 
                  value={form.department} 
                  onChange={(v: string) => setForm({...form, department: v})} 
                  placeholder="Management & IT"
               />
               <BannerInput 
                  label="Security Key" 
                  type="password" 
                  value={form.password} 
                  onChange={(v: string) => setForm({...form, password: v})} 
                  placeholder="Enter security key"
               />

               {error && (
                  <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl flex items-center gap-3 text-red-600 text-[10px] font-bold uppercase tracking-widest animate-in slide-in-from-top-1">
                     <ShieldAlert size={14} /> {error}
                  </div>
               )}

               <div className="pt-6">
                 <button 
                    disabled={loading}
                    className="w-full h-12 bg-[#3E4A5B] hover:bg-[#2F3E46] text-white rounded-xl font-bold text-[13px] tracking-wide transition-all flex items-center justify-center gap-2 active:scale-98 shadow-xl shadow-slate-900/10 disabled:opacity-50"
                 >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : 
                     <>Initialize Credentials <ArrowRight size={16} /></>}
                 </button>
               </div>
            </form>

            <div className="mt-8 text-center border-t border-slate-50 pt-8">
               <p className="text-slate-400 text-[11px] font-medium tracking-wide">
                  Already authorized? <Link href="/portal/mgmt/auth/login" className="text-[#B8860B] font-bold hover:underline transition-all">Launch Module</Link>
               </p>
            </div>
         </div>
      </div>
    </div>
  )
}

function BannerInput({ label, type = "text", value, onChange, placeholder }: any) {
  const [isFocused, setIsFocused] = useState(false)
  
  return (
    <div className="space-y-1.5 group text-left">
       <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-focus-within:text-[#3E4A5B] transition-colors pl-1 text-left block">{label}</label>
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
             className="w-full h-full bg-transparent px-4 text-[13px] font-semibold text-[#3E4A5B] placeholder:text-slate-300 outline-none transition-all"
          />
       </div>
    </div>
  )
}
