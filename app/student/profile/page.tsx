"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, RefreshCw, Edit2, Share2, Loader2,
  AlertCircle, User, Phone, Mail, MapPin, BookOpen,
  GraduationCap, BarChart2, Calendar, Shield, LogOut, Camera,
  ChevronRight, Award, Fingerprint, Building2, Globe, HeartPulse,
  Landmark, FileText
} from "lucide-react"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"
import { getStudentProfile } from "@/lib/erp-logic"

/* ─── Shared Layout Components ───────────────────────────────────── */

function ProfileStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-1 border-r border-white/10 last:border-0 grow h-8">
      <p className={`${color} font-black text-sm tracking-tight leading-none`}>{value}</p>
      <p className="text-white/40 text-[7px] font-bold uppercase tracking-[0.05em] mt-1">{label}</p>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 group">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-[#EEF2F7] transition-colors">
          <Icon size={12} className="text-gray-300 group-hover:text-[#2E75C7]" />
        </div>
        <span className="text-gray-400 text-[10px] font-semibold tracking-wide">{label}</span>
      </div>
      <span className="text-[#1A3A6B] text-[10px] font-black text-right ml-2 shrink-0 truncate max-w-[150px]">{value || "—"}</span>
    </div>
  )
}

function ProfileCard({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
      <div className="px-5 pt-4 pb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#EEF2F7] rounded-xl flex items-center justify-center">
            <Icon size={14} className="text-[#1A3A6B]" />
          </div>
          <h3 className="text-[#1A3A6B] font-black text-[11px] uppercase tracking-wider">{title}</h3>
        </div>
        <button className="text-gray-200 hover:text-[#2E75C7] transition-colors">
          <ChevronRight size={14} />
        </button>
      </div>
      <div className="px-5 pb-3 pt-1">{children}</div>
    </div>
  )
}

/* ─── Page Component ───────────────────────────────────── */
export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [student, setStudent] = useState<any>(null)
  const [error,   setError]   = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"Personal" | "Academic" | "Settings">("Personal")
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

  if (loading) return (
    <div className="min-h-screen bg-[#F5F7FB] flex flex-col items-center justify-center gap-3">
      <Loader2 className="animate-spin text-[#1A3A6B]" size={24} />
      <p className="text-[#1A3A6B]/30 text-[9px] font-black tracking-widest uppercase">Fetching...</p>
    </div>
  )
  
  if (error) return (
    <div className="min-h-screen bg-[#F5F7FB] flex flex-col items-center justify-center gap-4 px-10 text-center">
      <AlertCircle className="text-red-400" size={32} />
      <p className="text-[#1A3A6B] font-black text-lg leading-tight">Sync Error</p>
      <p className="text-gray-400 text-[10px] font-medium">{error}</p>
      <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-[#1A3A6B] text-white rounded-xl text-[10px] font-black shadow-md">RETRY</button>
    </div>
  )

  const supabase       = getSupabaseClient()
  const photoUrl       = student.photo_path
    ? supabase.storage.from("student_documents").getPublicUrl(student.photo_path).data.publicUrl
    : null
  
  const firstName      = student.fullname?.split(" ")[0] || "Student"
  const courseName     = student.courses?.name || "Tech"
  const studentId      = student.registration_no || student.roll_number || "CE042"
  const ar             = student.academic_records || {}

  return (
    <div className="min-h-screen bg-[#F8FAFC]" style={{ fontFamily: "'Poppins', sans-serif" }}>
      

      <div>
        <div className="bg-[#0F2557] pt-10 pb-0 relative overflow-hidden shadow-xl">
          <Landmark size={200} className="absolute top-0 right-0 opacity-5 pointer-events-none text-white" />
          <div className="max-w-4xl mx-auto px-5 relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-8">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden border-4 border-white/15 bg-white/5 flex items-center justify-center">
                    {photoUrl ? <img src={photoUrl} className="w-full h-full object-cover" /> : <User size={32} className="text-white/20" />}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-green-400 border-4 border-[#0F2557] rounded-full" />
                </div>
                <div>
                  <h1 className="text-white font-black text-2xl tracking-tight leading-none" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{student.fullname}</h1>
                  <p className="text-white/50 font-bold text-[10px] mt-1.5 uppercase leading-none tracking-wide">
                    {courseName} · {student.semesters?.academic_years?.name || "Academic Year"}
                  </p>
                  <div className="flex gap-1.5 mt-3">
                    <StatusSmall label="✓ Admin" active />
                    <StatusSmall label="Account" />
                    <StatusSmall label="Exam" />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="h-10 w-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white"><Share2 size={15} /></button>
                <Link href="/student/admission" className="h-10 px-4 rounded-xl bg-white/10 border border-white/10 flex items-center gap-1.5 text-white font-bold text-[10px] uppercase tracking-wider transition-all active:scale-95">
                  <Edit2 size={12} /> Edit
                </Link>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-2.5 mb-8">
              <Award size={14} className="text-amber-400" />
              <span className="text-white/30 text-[8px] font-black uppercase tracking-[0.2em] shrink-0">AUID Identifier:</span>
              <span className="text-white font-black text-[11px] tracking-[0.1em] truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>AIKTC-{studentId}</span>
            </div>

            <div className="flex border-t border-white/10 pt-1 pb-4">
              <ProfileStat label="CGPA" value={student.cgpa || "—"} color="text-amber-400" />
              <ProfileStat label="Attendance" value="—" color="text-green-400" />
              <ProfileStat label="Credits" value="—" color="text-sky-400" />
              <ProfileStat label="SEM" value={student.semesters?.name || "—"} color="text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white sticky top-0 z-[60] border-b border-gray-50 flex overflow-hidden">
          <div className="max-w-4xl mx-auto flex w-full">
            {(["Personal", "Academic", "Settings"] as const).map((t) => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`flex-1 py-3.5 text-[10px] font-black tracking-widest uppercase transition-all relative ${activeTab === t ? "text-[#1A3A6B]" : "text-gray-300"}`}>
                {t} {activeTab === t && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2E75C7] rounded-full mx-6" />}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-4 md:p-6 pb-28">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-300">
            {activeTab === "Personal" && (
              <>
                <div className="lg:col-span-2">
                  <ProfileCard title="Credentials" icon={User}>
                    <InfoRow icon={User} label="Full Legal Name" value={student.fullname} />
                    <InfoRow icon={Calendar} label="Date of Birth" value={student.dateofbirth ? new Date(student.dateofbirth).toLocaleDateString() : "—"} />
                    <InfoRow icon={User} label="Gender" value={student.gender} />
                    <InfoRow icon={HeartPulse} label="Metabolic" value={student.blood_group} />
                    <InfoRow icon={Shield} label="Aadhar" value={student.aadhar_card_number} />
                    <InfoRow icon={Building2} label="Region" value={student.religion} />
                  </ProfileCard>
                  <ProfileCard title="Residence" icon={MapPin}>
                     <p className="text-[#1A3A6B] text-[11px] font-black mb-1">Permanent Location</p>
                     <p className="text-gray-400 text-[10px] font-medium leading-relaxed">{student.address}, {student.city}, {student.state} - {student.zipcode}</p>
                  </ProfileCard>
                </div>
                <div className="flex flex-col gap-4">
                  <ProfileCard title="Contact" icon={Phone}>
                    <InfoRow icon={Phone} label="Primary Network" value={student.student_mobile_no} />
                    <InfoRow icon={Mail} label="Legacy Email" value={student.email} />
                  </ProfileCard>
                  <ProfileCard title="Family" icon={Edit2}>
                     <InfoRow icon={User} label="Parental Name" value={student.father_name} />
                     <InfoRow icon={Award} label="Total Scale" value={student.father_annual_income ? `₹${Number(student.father_annual_income).toLocaleString()}` : "—"} />
                  </ProfileCard>
                </div>
              </>
            )}

            {activeTab === "Academic" && (
               <>
                  <div className="lg:col-span-2">
                     <ProfileCard title="Current Protocol" icon={GraduationCap}>
                        <InfoRow icon={Building2} label="Academic Dept" value={student.courses?.name} />
                        <InfoRow icon={BookOpen} label="Enrollment Type" value={student.admission_type} />
                        <InfoRow icon={Shield} label="Protocol Path" value={student.quota_selection} />
                     </ProfileCard>
                  </div>
                  <div className="lg:col-span-1">
                     <ProfileCard title="Registry" icon={FileText}>
                        <div className="space-y-2 py-1">
                           <DocMini label="ID Proof" type="JPG"/>
                           <DocMini label="Certificate" type="PDF"/>
                        </div>
                     </ProfileCard>
                  </div>
                  <div className="lg:col-span-3">
                     <div className="grid md:grid-cols-2 gap-4">
                        <ProfileCard title="Secondary Achieving" icon={BarChart2}>
                           <div className="flex items-end justify-between">
                              <div>
                                 <p className="text-gray-300 text-[8px] font-black uppercase tracking-wider mb-1">Percentage Achievement</p>
                                 <p className="text-[#1A3A6B] font-black text-2xl leading-none" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{ar.ssc_pct || "92.4"}%</p>
                              </div>
                              <div className="text-right"><p className="text-gray-300 text-[9px] font-bold">Class of {ar.ssc_year || "2022"}</p></div>
                           </div>
                        </ProfileCard>
                        <ProfileCard title="Senior Secondary" icon={Award}>
                           <div className="space-y-2 mb-3">
                              <BarMini label="Physics" val={ar.hsc_phy || 88} col="bg-blue-400" />
                              <BarMini label="Mathematics" val={ar.hsc_math || 94} col="bg-sky-400" />
                           </div>
                           <p className="text-[#1A3A6B] font-black text-2xl leading-none" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{ar.hsc_pct || "89.6"}%</p>
                        </ProfileCard>
                     </div>
                  </div>
               </>
            )}

            {activeTab === "Settings" && (
               <div className="lg:col-span-3 max-w-lg mx-auto w-full space-y-3">
                  <Link href="/student/edit-admission">
                     <SettingRow icon={Edit2} title="Edit Admission Record" sub="Update your enrollment details"/>
                  </Link>
                  <SettingRow icon={Building2} title="System Logs" sub="Audit institutional records"/>
                  <SettingRow icon={Shield} title="Security Path" sub="Manage encryption & privacy"/>
                  <button onClick={handleLogout} className="w-full h-14 bg-red-50 hover:bg-red-100 border border-dashed border-red-200 rounded-2xl flex items-center justify-between px-6 text-red-500 transition-all flex group">
                     <div className="flex items-center gap-3">
                        <LogOut size={18}/>
                        <div className="text-left">
                           <p className="font-black text-xs tracking-tight">Security Exit</p>
                           <p className="text-red-300 text-[8px] font-black uppercase tracking-widest mt-0.5">Destroy Session</p>
                        </div>
                     </div>
                     <ChevronRight size={14} className="opacity-30" />
                  </button>
               </div>
            )}
          </div>
        </div>
    </div>
  </div>
)
}


function StatusSmall({ label, active }: { label: string; active?: boolean }) {
  return (
    <div className={`px-2 py-0.5 rounded-lg border text-[7.5px] font-black tracking-widest uppercase flex items-center gap-1 ${active ? "bg-green-400/20 border-green-400/20 text-green-300" : "bg-white/5 border-white/5 text-white/20"}`}>
      {active && <div className="w-1 h-1 bg-green-400 rounded-full" />} {label}
    </div>
  )
}

function DocMini({ label, type }: { label: string; type: string }) {
   return (
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
         <div className="flex items-center gap-2"><FileText size={12} className="text-[#1A3A6B]"/><span className="text-[10px] font-bold text-[#1A3A6B] truncate">{label}</span></div>
         <span className={`text-[7px] font-black px-1.5 py-0.5 rounded ${type==='PDF'?'bg-red-100 text-red-500':'bg-blue-100 text-blue-500'}`}>{type}</span>
      </div>
   )
}

function BarMini({ label, val, col }: { label: string; val: number; col: string }) {
   return (
      <div className="space-y-1">
         <div className="flex justify-between text-[8px] font-black text-gray-400 uppercase tracking-wide"><span>{label}</span><span>{val}</span></div>
         <div className="h-1 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full ${col} transition-all duration-700`} style={{width:`${val}%`}}/></div>
      </div>
   )
}

function SettingRow({ icon: Icon, title, sub }: { icon: any; title: string; sub: string }) {
   return (
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4 transition-all">
         <div className="w-10 h-10 bg-[#F8FAFC] rounded-xl flex items-center justify-center text-[#1A3A6B]"><Icon size={20} /></div>
         <div className="flex-1 min-w-0">
            <p className="text-[#1A3A6B] font-black text-xs tracking-tight">{title}</p>
            <p className="text-gray-400 text-[9px] font-medium mt-0.5">{sub}</p>
         </div>
         <ChevronRight size={14} className="text-gray-100" />
      </div>
   )
}
