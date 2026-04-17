"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { AlertCircle, LogIn, Mail, Lock, Stethoscope, ChevronRight, UserPlus, Loader2 } from "lucide-react"

export default function LoginForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const supabase = getSupabaseClient()

      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError
        router.push("/")
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name }
          }
        })
        if (signUpError) throw signUpError
        setError("Account created! Please check your email/login.")
        setIsLogin(true)
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.")
      console.error("Auth error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden font-inter"
      style={{ backgroundColor: "#F8FAFC" }}
    >
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] bg-[#2563EB]/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Subtle Grid */}
        <div className="absolute inset-0 opacity-[0.4]" style={{ backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      </div>

      <div className="relative w-full max-w-[440px] z-10">
        {/* Main Card */}
        <div
          className="bg-white/80 backdrop-blur-xl rounded-[32px] p-10 md:p-14 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-white"
        >
          {/* Header Section */}
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] flex items-center justify-center mb-6 shadow-2xl shadow-blue-200 rotate-3 hover:rotate-0 transition-transform duration-500">
              <Stethoscope size={36} className="text-white" strokeWidth={1.8} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-3">
              InfiPlus <span className="text-[#2563EB]">ERP</span>
            </h1>
            <p className="text-[15px] text-slate-500 font-medium max-w-[240px] mx-auto leading-relaxed">
              {isLogin ? "Sign in to access your administrative dashboard" : "Join the world's most advanced lab system"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
             {!isLogin && (
              <div className="space-y-2">
                <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Identity</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-all duration-300">
                    <UserPlus size={19} />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. John Doe"
                    required={!isLogin}
                    className="w-full h-14 pl-12 pr-4 bg-slate-50/50 border border-slate-200 rounded-2xl text-[15px] outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-8 focus:ring-blue-500/5 font-semibold text-slate-700 placeholder:text-slate-300"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest ml-1">Work Email</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-all duration-300">
                  <Mail size={19} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@institute.com"
                  required
                  className="w-full h-14 pl-12 pr-4 bg-slate-50/50 border border-slate-200 rounded-2xl text-[15px] outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-8 focus:ring-blue-500/5 font-semibold text-slate-700 placeholder:text-slate-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Security Pin</label>
                {isLogin && <button type="button" className="text-[12px] font-bold text-blue-600 hover:text-blue-700 transition-colors">Reset Password?</button>}
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-all duration-300">
                  <Lock size={19} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full h-14 pl-12 pr-4 bg-slate-50/50 border border-slate-200 rounded-2xl text-[15px] outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-8 focus:ring-blue-500/5 font-semibold text-slate-700 placeholder:text-slate-300"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-100/50 animate-in zoom-in-95 duration-300">
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                  <AlertCircle size={16} className="text-rose-600" />
                </div>
                <p className="text-[13px] text-rose-800 font-bold leading-tight">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="group w-full h-14 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-2xl font-black text-[16px] shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
            >
              {isLoading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <>
                  <span className="tracking-wide">{isLogin ? "PROCEED TO DASHBOARD" : "INITIALIZE ACCOUNT"}</span>
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Alternative Flow */}
          <div className="mt-10 pt-8 border-t border-slate-100 flex flex-col items-center gap-4">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-[14px] font-bold text-slate-400 hover:text-slate-900 transition-all flex items-center gap-2 group"
            >
              {isLogin ? "Need a new practitioner account?" : "Already have administrative access?"}
              <span className="text-blue-600 underline decoration-blue-200 underline-offset-4 group-hover:decoration-blue-600 transition-all">
                {isLogin ? "Create one here" : "Sign in instead"}
              </span>
            </button>
            
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mt-2">
              Protected by Enterprise Grade Security
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
