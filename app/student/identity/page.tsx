"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { 
  Loader2, QrCode, ShieldCheck, Download, Share2, 
  MapPin, Phone, Mail, Calendar, School, User,
  CheckCircle2, BadgeCheck, Zap, Info, CreditCard
} from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { getStudentProfile } from "@/lib/erp-logic"
import { cn } from "@/lib/utils"

export default function IdentityPage() {
  const [loading, setLoading] = useState(true)
  const [student, setStudent] = useState<any>(null)
  const [qrLoaded, setQrLoaded] = useState(false)
  const router = useRouter()
  const supabase = getSupabaseClient()

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/student/login")
        return
      }
      const data = await getStudentProfile(supabase, session.user.id)
      setStudent(data)
      setLoading(false)
    }
    init()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FB] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-[#1A3A6B]" size={32} />
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Syncing Identity...</p>
      </div>
    )
  }

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`https://erp.aiktc.ac.in/verify/${student?.id}`)}`

  return (
    <div className="min-h-screen bg-[#F5F7FB] pb-24 lg:pb-12 animate-in fade-in duration-500" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* --- Simple Modern Header --- */}
      <div className="bg-white border-b border-gray-100 px-6 py-5 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#1A3A6B] rounded-lg flex items-center justify-center">
                 <School className="text-white" size={16} />
              </div>
              <h1 className="text-lg font-bold text-[#1A3A6B] tracking-tight">Identity</h1>
           </div>
           <button className="h-9 px-4 flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-500 text-[10px] font-bold uppercase tracking-wider hover:bg-slate-100 transition-all">
              <Share2 size={12} /> Share ID
           </button>
        </div>
      </div>

      <main className="max-w-md mx-auto px-6 py-8 space-y-8">
        
        {/* --- MODERN MINIMAL ID CARD --- */}
        <div className="relative">
           {/* Card Frame */}
           <div className="bg-white rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 relative group">
              
              {/* Institutional Header (Blue Bar) */}
              <div className="bg-[#1A3A6B] px-8 py-5 flex items-center justify-between">
                 <div className="space-y-0.5">
                    <h2 className="text-white font-bold text-xs tracking-[0.1em] uppercase">AIKTC Panvel</h2>
                    <p className="text-white/40 text-[7px] font-bold uppercase tracking-widest leading-none">School of Engineering</p>
                 </div>
                 <BadgeCheck className="text-white/20 h-5 w-5" />
              </div>

              {/* Card Body */}
              <div className="p-8 pb-10 flex flex-col items-center text-center">
                 {/* Photo */}
                 <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-slate-50 border-4 border-white shadow-xl flex items-center justify-center text-3xl font-bold text-[#1A3A6B] mb-6 relative">
                    {student?.fullname?.[0]?.toUpperCase() ?? "S"}
                    <div className="absolute -bottom-1 -right-1 bg-green-500 h-6 w-6 rounded-full border-4 border-white shadow-md flex items-center justify-center">
                       <ShieldCheck className="text-white" size={10} strokeWidth={3} />
                    </div>
                 </div>

                 {/* Information */}
                 <div className="space-y-1 mb-8">
                    <h3 className="text-[#1A3A6B] font-bold text-lg sm:text-xl tracking-tight uppercase">
                       {student?.fullname || "Student Name"}
                    </h3>
                    <p className="text-blue-600/60 text-[9px] font-bold uppercase tracking-[0.2em]">
                       {student?.courses?.name || "B.E. Computer Engineering"}
                    </p>
                 </div>

                 {/* Key Data Grid */}
                 <div className="grid grid-cols-2 gap-y-6 w-full pt-8 border-t border-slate-50">
                    <div className="text-left space-y-1">
                       <p className="text-slate-300 text-[8px] font-bold uppercase tracking-wider">AUID Number</p>
                       <p className="text-[#1A3A6B] font-bold text-xs tracking-widest">{student?.roll_number || student?.registration_no || "2024BE012"}</p>
                    </div>
                    <div className="text-right space-y-1">
                       <p className="text-slate-300 text-[8px] font-bold uppercase tracking-wider">Academic Batch</p>
                       <p className="text-[#1A3A6B] font-bold text-xs tracking-widest">{student?.admission_year || "2026"}</p>
                    </div>
                    <div className="text-left space-y-1">
                       <p className="text-slate-300 text-[8px] font-bold uppercase tracking-wider">Blood Group</p>
                       <p className="text-[#1A3A6B] font-bold text-xs tracking-widest">O+ POSITIVE</p>
                    </div>
                    <div className="text-right space-y-1">
                       <p className="text-slate-300 text-[8px] font-bold uppercase tracking-wider">Status</p>
                       <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-green-50 rounded-full border border-green-100 text-[8px] font-bold text-green-600 uppercase tracking-wider">
                          <CheckCircle2 size={8} /> Verified
                       </span>
                    </div>
                 </div>
              </div>

              {/* Bottom Decorative Strip */}
              <div className="h-1 w-full flex">
                 <div className="flex-1 bg-blue-600" />
                 <div className="flex-1 bg-amber-400" />
                 <div className="flex-1 bg-emerald-500" />
              </div>
           </div>
        </div>

        {/* --- QR AUDIT SECTION --- */}
        <div className="bg-white rounded-3xl border border-gray-100 p-8 flex flex-col items-center gap-6">
           <div className="w-full flex items-center justify-between mb-2">
              <h4 className="text-[#1A3A6B] font-bold text-[10px] uppercase tracking-widest">Security Audit</h4>
              <div className="h-6 w-6 bg-slate-50 rounded-lg flex items-center justify-center">
                 <QrCode size={12} className="text-slate-400" />
              </div>
           </div>

           <div className="p-4 bg-slate-50 rounded-2xl border border-gray-50 flex items-center justify-center">
              <img 
                 src={qrUrl} 
                 alt="Verification QR" 
                 onLoad={() => setQrLoaded(true)}
                 className={cn("w-28 h-28 mix-blend-multiply opacity-80", qrLoaded ? "opacity-80" : "opacity-0")}
              />
              {!qrLoaded && <Loader2 className="animate-spin text-slate-200" size={24} />}
           </div>

           <button 
             onClick={() => window.print()}
             className="w-full h-12 bg-[#1A3A6B] text-white rounded-xl shadow-lg shadow-blue-900/10 flex items-center justify-center gap-2 active:scale-[0.98] transition-all text-[10px] font-bold uppercase tracking-widest"
           >
              <Download size={14} /> Download PDF ID
           </button>

           <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-50 flex items-start gap-3">
              <Info size={14} className="text-blue-600 shrink-0 mt-0.5" />
              <p className="text-[9px] text-blue-800/60 font-medium leading-relaxed">
                 Institutional authorization required for physical card production. This digital version is valid for internal campus checkpoints only.
              </p>
           </div>
        </div>

        <div className="text-center pt-4">
           <p className="text-slate-300 text-[8px] font-bold uppercase tracking-widest">Institution Data Systems v2.4.0</p>
        </div>
      </main>
    </div>
  )
}
