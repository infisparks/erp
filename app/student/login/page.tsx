"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { AlertCircle, Mail, Lock, ChevronRight, GraduationCap } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"
import { getUserType } from "@/lib/erp-logic"

/**
 * High-Visibility Student Login
 * 
 * DESIGN FIXES:
 * - Removed all background overlays causing visibility issues
 * - Switched to High-Contrast (Navy on White) for all typography
 * - Solid Blue branding for buttons and icons
 * - Fixed Flexbox input groups for precise alignment
 */
export default function StudentLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Email Normalization: Append @gmail.com if domain is missing
      let normalizedEmail = email.trim();
      if (!normalizedEmail.includes("@")) {
          normalizedEmail = `${normalizedEmail}@gmail.com`;
      }

      const supabase = getSupabaseClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      })

      if (signInError) {
        setError(signInError.message || "Login failed. Check your security key.")
        return
      }

      router.push("/")
    } catch (err) {
      setError("System sync error. Please retry.")
      console.error("Login error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white font-sans">
      
      {/* Branding Header Area */}
      <div className="w-full max-w-[420px] text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-6 shadow-xl shadow-blue-500/20">
          <GraduationCap className="w-9 h-9 text-white" />
        </div>
        {/* FIXED: Dense Slate/Navy text for maximum visibility on white background */}
        <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Student Portal</h1>
        <p className="text-blue-600 font-black text-[10px] uppercase tracking-[0.3em]">Institutional Access Gateway</p>
      </div>

      <div className="w-full max-w-[420px]">
        {/* Main Login Card */}
        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-slate-100 p-10">
          
          <form onSubmit={handleLogin} className="space-y-7">
            
            <div className="space-y-5">
              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Academic identity</label>
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

              {/* Password Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                   <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Secret Key</label>
                   <Link href="#" className="text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-widest">Forgot Pass?</Link>
                </div>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-600 focus-within:bg-white transition-all">
                  <div className="pl-5 pr-3 text-blue-600 border-r border-slate-100 py-4">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full px-4 py-4 bg-transparent text-slate-900 placeholder:text-slate-400 outline-none font-bold text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Error Feedback */}
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <p className="text-xs text-red-700 font-bold leading-tight">{error}</p>
              </div>
            )}

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 group"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="uppercase tracking-widest text-xs">Authenticating...</span>
                </>
              ) : (
                <>
                  <span className="uppercase tracking-[0.2em] text-xs">Initialise Access</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Social Links */}
          <div className="mt-10 pt-8 border-t border-slate-50 text-center">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                New User?{" "}
                <Link href="/student/register" className="text-blue-600 hover:text-blue-800 transition-colors ml-1">
                  Student Registration
                </Link>
              </p>
          </div>
        </div>

        {/* System ID */}
        <p className="text-center text-[10px] font-black text-slate-300 mt-12 uppercase tracking-[0.4em]">
           &copy; 2026 Academic Information Systems
        </p>
      </div>
    </div>
  )
}
