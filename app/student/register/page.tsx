"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { AlertCircle, User, Mail, Lock, ChevronRight, GraduationCap } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"
import { getUserType } from "@/lib/erp-logic"

/**
 * High-Visibility Student Registration
 * 
 * DESIGN FIXES:
 * - Pure White/Blue palette for maximum legibility
 * - High-Contrast Slate text for all primary titles
 * - Fixed Input Group architecture (Flexbox) to prevent icon/text overlap
 */
export default function StudentRegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Proactive Session Redirection
  useEffect(() => {
    async function checkExistingSession() {
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { type, role, isApproved } = await getUserType(supabase, session.user.id)
        if (type === 'student') {
          router.push("/student/dashboard")
        } else if (type === 'management' && isApproved) {
          router.push(role === 'admin' ? "/management/admin/dashboard" : "/management/staff/dashboard")
        }
      }
    }
    checkExistingSession()
  }, [router])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Email Normalization
      let normalizedEmail = email.trim();
      if (!normalizedEmail.includes("@")) {
          normalizedEmail = `${normalizedEmail}@gmail.com`;
      }

      const supabase = getSupabaseClient()
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: fullName,
            role: "student",
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message || "Registration failed. Verify your details.")
        return
      }

      if (authData.user) {
         router.push("/student/admission")
      }
    } catch (err) {
      setError("System sync error. Please retry.")
      console.error("Registration error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white font-sans">
      
      {/* Structural Header Area */}
      <div className="w-full max-w-[440px] text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-6 shadow-xl shadow-blue-500/20">
          <GraduationCap className="w-9 h-9 text-white" />
        </div>
        {/* FIXED: High-Contrast text for visibility */}
        <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Create Profile</h1>
        <p className="text-blue-600 font-black text-[10px] uppercase tracking-[0.3em]">Initialise Academic Record</p>
      </div>

      <div className="w-full max-w-[440px]">
        {/* Professional Register Card */}
        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-slate-100 p-10 md:p-12">
          
          <form onSubmit={handleRegister} className="space-y-6">
            
            <div className="space-y-5">
              {/* Name Field */}
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Legal Full Name</label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-600 focus-within:bg-white transition-all">
                  <div className="pl-5 pr-3 text-blue-600 border-r border-slate-100 py-4">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter official name"
                    required
                    className="w-full px-4 py-4 bg-transparent text-slate-900 placeholder:text-slate-400 outline-none font-bold text-sm"
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Academic Email</label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-600 focus-within:bg-white transition-all">
                  <div className="pl-5 pr-3 text-blue-600 border-r border-slate-100 py-4">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email or username"
                    required
                    className="w-full px-4 py-4 bg-transparent text-slate-900 placeholder:text-slate-400 outline-none font-bold text-sm"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Access Protocol</label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-600 focus-within:bg-white transition-all">
                  <div className="pl-5 pr-3 text-blue-600 border-r border-slate-100 py-4">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    required
                    minLength={8}
                    className="w-full px-4 py-4 bg-transparent text-slate-900 placeholder:text-slate-400 outline-none font-bold text-sm"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-orange-50 border border-orange-100 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600 shrink-0" />
                <p className="text-xs text-orange-900 font-bold leading-tight">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 group mt-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="uppercase tracking-widest text-xs">Processing...</span>
                </>
              ) : (
                <>
                  <span className="uppercase tracking-[0.2em] text-xs">Create Account</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-10 pt-8 border-t border-slate-50 text-center">
             <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                Existing Prospect?{" "}
                <Link href="/student/login" className="text-blue-600 font-black hover:text-blue-800 transition-colors ml-1">
                  Initialise Login
                </Link>
             </p>
          </div>
        </div>
      </div>
    </div>
  )
}
