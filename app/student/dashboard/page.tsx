"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Loader2, LogOut, CreditCard,
  CalendarCheck, AlertCircle, QrCode, CheckCircle2,
  Calendar, BookOpen,
  BarChart2, RefreshCw, User, FileText,
  ShieldCheck, ArrowUpRight, Megaphone, ShieldAlert,
  Coffee, Bell, School
} from "lucide-react"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"
import { getStudentProfile } from "@/lib/erp-logic"
import { cn } from "@/lib/utils"

/* ─── COLOR SYSTEM ─── */
const AppColors = {
  brandDeepBlue: "#1A3A6B",
  brandSkyBlue: "#2E75C7",
  brandGold: "#B8860B",
  brandCream: "#FBF5E6",
  brandForestGreen: "#2D6A3F",
  canvas: "#F7F4EF",
  textPrimary: "#1A2340",
}

/* ─── Static data ───────────────────────────────── */
const quickActions = [
  { Icon: User,         label: "Profile",    color: "#1A3A6B", bg: "#E8F0FB", href: "/student/edit-admission" },
  { Icon: FileText,     label: "Yearly Registration", color: "#1A3A6B", bg: "#E8F0FB", href: "/student/registration" },
  { Icon: CalendarCheck,label: "Attendance", color: "#B8860B", bg: "#FFF6E5", href: "/student/attendance" },
  { Icon: BookOpen,     label: "Library",    color: "#2D6A3F", bg: "#E7F4ED", href: "/student/library" },
  { Icon: CreditCard,   label: "Fees",       color: "#B53030", bg: "#FFECEC", href: "/student/fees" },
  { Icon: BarChart2,    label: "Results",    color: "#5B4FCC", bg: "#EEEBFF", href: "/student/results" },
  { Icon: Calendar,     label: "Schedule",   color: "#2E75C7", bg: "#E6F4FF", href: "/student/schedule" },
  { Icon: Coffee,       label: "Canteen",    color: "#A07800", bg: "#FFFBE6", href: "/student/canteen" },
  { Icon: Megaphone,    label: "More",       color: "#4B5563", bg: "#F3F4F6", href: "/student/registration" },
]

const announcements = [
  { emoji: "📋", color: "#B8860B", bg: "#FFF3E0", title: "Exam Registration", desc: "Sem IV registration open until Oct 19", urgent: true },
  { emoji: "🎓", color: "#1A3A6B", bg: "#E8F0FB", title: "Scholarship",    desc: "Apply before Oct 30 deadline",          urgent: false },
  { emoji: "🌿", color: "#2D6A3F", bg: "#E7F4ED", title: "Green Campus",   desc: "Tree plantation drive this Saturday.", urgent: false },
]

const campusFeed = [
  { emoji: "🏆", title: "Hackathon Victory",   desc: "AIKTC wins 1st at Zonal Hackathon.", time: "1h ago" },
  { emoji: "📡", title: "Smart Campus Wi-Fi",  desc: "High-speed nodes installed in Block A.", time: "3h ago" },
]

export default function StudentDashboard() {
  const [loading, setLoading]   = useState(true)
  const [student, setStudent]   = useState<any>(null)
  const [error,   setError]     = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    ;(async () => {
      try {
        const supabase = getSupabaseClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { router.push("/student/login"); return }
        const data = await getStudentProfile(supabase, session.user.id)
        if (!data)    { router.push("/student/admission"); return }
        setStudent(data)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [router])

  const handleLogout = async () => {
    await getSupabaseClient().auth.signOut()
    router.push("/student/login")
  }

  if (loading || (!student && !error)) return (
    <div className="min-h-screen bg-[#F7F4EF] flex flex-col items-center justify-center gap-6">
       <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-[#1A3A6B]/20" strokeWidth={1} />
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="h-2 w-2 bg-[#1A3A6B] rounded-full animate-pulse" />
          </div>
       </div>
       <p className="text-[10px] font-normal uppercase tracking-[0.3em] text-[#1A3A6B]/40 leading-none">AIKTC Digital Ledger Is Synchronizing</p>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-[#F7F4EF] flex flex-col items-center justify-center p-8 text-center gap-6">
      <AlertCircle className="w-16 h-16 text-rose-500/20" />
      <div>
         <p className="text-[#1A2340] font-normal uppercase tracking-tight text-xl leading-none italic">Transmission Failure</p>
         <p className="text-slate-400 text-xs font-normal uppercase tracking-widest mt-2 px-12 leading-relaxed">Remote institutional server state unreachable</p>
      </div>
      <button onClick={() => window.location.reload()} className="h-12 px-8 bg-[#1A3A6B] text-white text-[10px] font-normal uppercase tracking-widest rounded-2xl hover:bg-[#2E75C7] transition-all flex items-center gap-2 shadow-xl shadow-[#1A3A6B]/20">
        <RefreshCw size={13} /> Re-establish Link
      </button>
    </div>
  )

  const isAdmitted = student?.is_verifiedby_admin
  const isFullyVerified = student?.is_verifiedby_admin && student?.is_verifiedby_accountant && student?.is_verifiedby_examcell

  return (
    <div className="min-h-screen bg-[#F7F4EF] pb-24 lg:pb-12 animate-in fade-in duration-1000">
      
      {/* ───── Hero Header Section ───── */}
      <div className="relative h-[220px] w-full overflow-hidden">
        <img 
          src="/campus_hero.png" 
          alt="AIKTC Campus" 
          className="absolute inset-0 w-full h-[350px] object-cover"
        />
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, rgba(26, 58, 107, 0.72) 0%, rgba(0, 0, 0, 0.3) 35%, rgba(247, 244, 239, 0.2) 75%, rgba(247, 244, 239, 1) 100%)"
          }}
        />
        
        <div className="relative z-10 px-6 py-6 md:px-12 md:py-10 max-w-7xl mx-auto flex flex-row items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="space-y-0.5">
               <p className="text-white/60 font-normal uppercase text-[8px] tracking-[0.2em] leading-none mb-1">AIKTC Student Portal</p>
               <h2 className="text-2xl font-semibold text-white tracking-tighter leading-tight italic">
                  {student?.fullname || "Student Name"}
               </h2>
               <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 bg-[#4ADE80] rounded-full shadow-[0_0_8px_#4ADE80]" />
                  <p className="text-white/90 font-medium text-[10px] uppercase tracking-wider">{student?.courses?.name || "B.E. Engineering"}</p>
               </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <button className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white relative group shrink-0">
                <Bell size={18} />
                <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 bg-rose-500 rounded-full ring-2 ring-white/10" />
             </button>
             <button onClick={handleLogout} className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all shadow-sm shrink-0">
                <LogOut size={18} />
             </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 -mt-10 md:-mt-12 relative z-20 space-y-12">
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
            
            {/* ───── Left Column ───── */}
            <div className="lg:col-span-12 xl:col-span-4 space-y-10">
               
               {/* Digital Identity Pass - Compact Mode */}
               <div className="bg-gradient-to-br from-[#0F2352] to-[#1A3A6B] rounded-[32px] p-6 text-white relative overflow-hidden shadow-[0_20px_40px_-15px_rgba(26,58,107,0.4)] group">
                  <div className="absolute top-0 right-0 p-6 opacity-[0.04] group-hover:opacity-[0.08] group-hover:scale-110 transition-all duration-700">
                     <QrCode size={140} />
                  </div>
                  <div className="relative z-10 space-y-4">
                     <div className="flex justify-between items-center">
                        <p className="text-[9px] font-medium uppercase tracking-[0.4em] text-white/40 leading-none">Digital Student ID</p>
                        <div className="flex items-center gap-3">
                           <CheckCircle2 size={14} className={isAdmitted ? "text-[#4ADE80]" : "text-white/20"} />
                           <div className="h-8 w-8 bg-[#FBF5E6] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                              <QrCode size={16} className="text-[#0F2352]" />
                           </div>
                        </div>
                     </div>
                     <div>
                        <p className="text-xl font-semibold tracking-widest text-white leading-none">
                           {student?.registration_no || student?.roll_number || 'AIKTC-2026-ST001'}
                        </p>
                     </div>
                     <div className="flex gap-2">
                        <div className="px-2.5 py-1 bg-[#4ADE80]/10 border border-[#4ADE80]/20 rounded-lg flex items-center gap-2">
                           <div className="h-1.5 w-1.5 bg-[#4ADE80] rounded-full" />
                           <span className="text-[9px] font-medium text-[#4ADE80] uppercase tracking-wider">Active</span>
                        </div>
                        <div className="px-2.5 py-1 bg-[#60A5FA]/10 border border-[#60A5FA]/20 rounded-lg flex items-center gap-2">
                           <School size={10} className="text-[#60A5FA]" />
                           <span className="text-[9px] font-medium text-[#60A5FA] uppercase tracking-wider">
                              {student?.courses?.name?.split(' ')[0] || 'Engg'}
                           </span>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Verification Tracker Section */}
               <div className="bg-white rounded-[32px] border border-slate-100 p-6 space-y-6 shadow-sm">
                  <div className="flex items-center justify-between">
                     <h5 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#1A3A6B]">
                        Verification Progress
                     </h5>
                     <div className="flex items-center gap-2">
                        <div className="h-1 w-1 bg-[#4ADE80] rounded-full" />
                        <span className="text-[8px] font-medium text-slate-400 uppercase tracking-widest leading-none">Admin</span>
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 md:divide-x lg:divide-x-0 lg:divide-y divide-slate-100">
                     <div className="pb-6 md:pb-0 md:pr-6 lg:pb-6 lg:pr-0">
                        <VerificationItem 
                           icon={CreditCard} 
                           label="Accountant" 
                           status={student?.is_verifiedby_accountant ? "Approved" : "Pending"} 
                           isDone={student?.is_verifiedby_accountant} 
                        />
                     </div>
                     <div className="pt-6 md:pt-0 md:pl-6 lg:pt-6 lg:pl-0">
                        <VerificationItem 
                           icon={ShieldCheck} 
                           label="Exam Cell" 
                           status={student?.is_verifiedby_examcell ? "Approved" : "Pending"} 
                           isDone={student?.is_verifiedby_examcell} 
                        />
                     </div>
                  </div>

                  {!isFullyVerified && (
                     <div className="bg-[#1E293B] rounded-[24px] p-5 flex items-center gap-3">
                        <ShieldAlert size={18} className="text-amber-500 shrink-0" />
                        <p className="text-white text-[10px] font-medium leading-relaxed tracking-tight">
                           Portal access is restricted until complete administrative synchronization.
                        </p>
                     </div>
                  )}
               </div>
            </div>

            {/* ───── Right Column ───── */}
            <div className="lg:col-span-12 xl:col-span-8 space-y-12">
               
               {/* Academic Services Grid */}
               <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-[#1A2340] tracking-tight">Academic Services</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 md:gap-6">
                     {quickActions.map((action, i) => {
                        const isLocked = !isFullyVerified && action.label !== "Profile"
                        return (
                           <Link key={i} href={isLocked ? "#" : action.href} className="group">
                              <div className="flex flex-col items-center gap-3">
                                 <div 
                                    className="h-16 w-16 md:h-20 md:w-20 rounded-[24px] flex items-center justify-center transition-all duration-500 relative overflow-hidden shadow-sm hover:shadow-xl group-hover:-translate-y-1 border-2 border-white"
                                    style={{ backgroundColor: action.bg }}
                                 >
                                    <action.Icon size={action.label === "More" ? 22 : 28} style={{ color: action.color }} strokeWidth={1.5} />
                                    {isLocked && (
                                       <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md">
                                          <ShieldAlert size={10} className="text-amber-500" />
                                       </div>
                                    )}
                                 </div>
                                 <p className="text-[11px] font-medium uppercase text-[#1A2340] tracking-wider group-hover:text-[#2E75C7] transition-colors">{action.label}</p>
                              </div>
                           </Link>
                        )
                     })}
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                  <div className="md:col-span-7 space-y-6">
                     <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-[#1A2340] tracking-tight">Announcements</h3>
                        <span className="text-[11px] font-normal text-[#2E75C7] uppercase cursor-pointer hover:underline">See All</span>
                     </div>
                     <div className="space-y-4">
                        {announcements.map((ann, i) => (
                           <div key={i} className="flex gap-5 p-5 bg-white rounded-[24px] border border-slate-100 hover:border-slate-200 transition-all group cursor-pointer shadow-sm hover:shadow-md">
                              <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform" style={{ backgroundColor: ann.bg }}>
                                 {ann.emoji}
                              </div>
                              <div className="min-w-0">
                                 <p className="text-sm font-medium text-[#1A2340] leading-none mb-1.5">{ann.title}</p>
                                 <p className="text-[11px] text-slate-400 font-normal leading-relaxed">{ann.desc}</p>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="md:col-span-5 space-y-6">
                     <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-[#1A2340] tracking-tight">Campus Feed</h3>
                        <span className="text-[11px] font-normal text-[#2E75C7] uppercase cursor-pointer">More</span>
                     </div>
                     <div className="space-y-4">
                        {campusFeed.map((feed, i) => (
                           <div key={i} className="flex items-center gap-5 p-5 bg-white rounded-[24px] border border-slate-100 hover:border-slate-200 transition-all cursor-pointer shadow-sm group">
                              <div className="h-12 w-12 bg-[#F7F4EF] rounded-2xl flex items-center justify-center text-xl group-hover:rotate-12 transition-transform">
                                 {feed.emoji}
                              </div>
                              <div className="flex-1 min-w-0">
                                 <p className="text-sm font-medium text-[#1A2340] mb-0.5 truncate">{feed.title}</p>
                                 <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">{feed.time}</p>
                              </div>
                              <ArrowUpRight size={14} className="text-slate-200 group-hover:text-[#1A3A6B] transition-colors" />
                           </div>
                        ))}
                     </div>
                     <button className="w-full py-4 bg-white border-2 border-slate-50 rounded-2xl text-[10px] font-semibold uppercase tracking-[0.3em] text-[#1A3A6B] hover:border-[#1A3A6B] hover:bg-slate-50 transition-all">
                        Synchronize Relay
                     </button>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  )
}

function VerificationItem({ icon: Icon, label, status, isDone }: { icon: any, label: string, status: string, isDone: boolean }) {
  return (
    <div className="flex items-center justify-between group">
       <div className="flex items-center gap-3">
          <div className={cn(
             "h-9 w-9 rounded-xl flex items-center justify-center transition-colors shadow-sm",
             isDone ? "bg-[#4ADE80]/10 text-[#166534]" : "bg-[#F3F4F6] text-[#4B5563]"
          )}>
             <Icon size={isDone ? 16 : 14} strokeWidth={isDone ? 2.5 : 2} />
          </div>
          <div className="space-y-0.5">
             <p className="text-[8px] font-medium text-slate-400 uppercase tracking-widest leading-none">{label}</p>
             <p className={cn(
                "text-xs font-normal tracking-tight",
                isDone ? "text-[#166534]" : "text-[#1A2340]"
             )}>{status}</p>
          </div>
       </div>
       <CheckCircle2 
          size={14} 
          className={cn(
             "transition-colors",
             isDone ? "text-[#4ADE80]" : "text-slate-100 group-hover:text-slate-200"
          )} 
       />
    </div>
  )
}
