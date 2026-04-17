"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { 
  getStudentProfile, 
  getStudentEnrollmentProgress,
  getAdmissionMetadata,
  calculateStudentFees
} from "@/lib/erp-logic"
import { 
  Loader2, CheckCircle2, Lock, Calendar, BookOpen, 
  ArrowRight, ShieldCheck, CreditCard, ChevronRight,
  Info, AlertTriangle, ArrowLeft, RefreshCw, Trophy,
  FileText, Clock, GraduationCap, ArrowUpRight, Check,
  Zap, Trash2
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

/* --- Types --- */
type Semester = {
  id: string;
  name: string;
  subjects: any[];
  academic_year_id: string;
}

type AcademicYear = {
  id: string;
  name: string;
  sequence: number;
  semesters: Semester[];
}

type Enrollment = {
  id: string;
  semester_id: string;
  promotion_status: 'Eligible' | 'Drop' | 'Hold';
  status: 'active' | 'completed';
  is_verifiedby_admin: boolean;
  is_verifiedby_accountant: boolean;
  is_verifiedby_examcell: boolean;
  net_payable_fee: number;
  created_at: string;
}

/* --- Main Component --- */
export default function RegistrationPage() {
  const router = useRouter()
  const supabase = getSupabaseClient()
  
  const [isLoading, setIsLoading] = useState(true)
  const [student, setStudent] = useState<any>(null)
  const [courseData, setCourseData] = useState<{ years: AcademicYear[], enrollments: Enrollment[] } | null>(null)
  const [metadata, setMetadata] = useState<any>(null)

  // Registration Dialog State
  const [selectedSem, setSelectedSem] = useState<Semester | null>(null)
  const [regStep, setRegStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Registration Payload State
  const [scholarshipId, setScholarshipId] = useState("")
  const [feeCalc, setFeeCalc] = useState<any>(null)
  const [paymentPlan, setPaymentPlan] = useState<"One Time" | "Installments">("One Time")
  const [installmentLetter, setInstallmentLetter] = useState("")
  const [installmentDates, setInstallmentDates] = useState<string[]>([""])

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    setIsLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push("/student/login"); return }

      const sData = await getStudentProfile(supabase, session.user.id)
      setStudent(sData)

      if (sData) {
        const [progress, meta] = await Promise.all([
          getStudentEnrollmentProgress(supabase, sData.id),
          getAdmissionMetadata(supabase)
        ])
        setCourseData(progress)
        setMetadata(meta)
      }
    } catch (err) {
      console.error("Init Error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Live fee calculation
  useEffect(() => {
    if (selectedSem && student) {
      const fetchFees = async () => {
        const res = await calculateStudentFees(supabase, {
          courseId: student.course_id,
          academicYearId: student.admission_year_id || selectedSem.academic_year_id, // Use admission batch ID if available
          scholarshipCategoryId: scholarshipId || undefined
        })
        setFeeCalc(res)
      }
      fetchFees()
    }
  }, [scholarshipId, selectedSem, student, supabase])

  const handleEnroll = async () => {
    if (!selectedSem || !student) return
    setIsSubmitting(true)
    try {
      const payload = {
        student_id: student.id,
        semester_id: selectedSem.id,
        total_fee: feeCalc?.totalFee,
        scholarship_amount: feeCalc?.scholarshipAmt,
        net_payable_fee: feeCalc?.netPayable,
        status: 'active',
        promotion_status: 'Eligible',
        registration_data: {
          payment_plan: paymentPlan,
          installment_letter: installmentLetter,
          installment_dates: installmentDates.filter(d => d),
          enrolled_at: new Date().toISOString()
        }
      }

      // 1. Insert search enrollment record
      const { error: enrollError } = await supabase.from('student_semesters').insert(payload)
      if (enrollError) throw enrollError

      // 2. Update Student's Current Semester ID
      const { error: studentUpdateError } = await supabase
        .from('students')
        .update({ current_sem_id: selectedSem.id })
        .eq('id', student.id)
      
      if (studentUpdateError) throw studentUpdateError

      setSelectedSem(null)
      init()
    } catch (err: any) {
      alert("Registration failed: " + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <div className="h-10 w-10 border-4 border-slate-200 border-t-[#1A3A6B] rounded-full animate-spin mb-4" />
        <p className="text-[#1A3A6B] font-black text-[9px] uppercase tracking-[.3em]">Synching Academic Records</p>
      </div>
    )
  }

  const isProfileVerified = student?.is_verifiedby_admin && student?.is_verifiedby_accountant && student?.is_verifiedby_examcell

  return (
    <div className="min-h-screen bg-[#F5F8FA] pb-24">
      
      {/* ── Banner: High-Density & Professional ──────────────── */}
      <div className="bg-[#1A3A6B] text-white pt-8 pb-10 px-6 lg:px-12 relative overflow-hidden shadow-lg shadow-blue-900/10">
         <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16" />
         <div className="max-w-4xl mx-auto relative z-10 flex items-center justify-between gap-4">
            <div>
               <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase text-white">Semester Enrollment</h1>
               <div className="flex flex-wrap items-center gap-2 mt-2">
                  <TinyBadge label={student?.courses?.name} icon={GraduationCap} />
                  <TinyBadge label={`Batch ${student?.admission_year}`} icon={Calendar} />
               </div>
            </div>
            <button onClick={init} className="self-start md:self-center h-10 w-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all border border-white/10 text-white">
               <RefreshCw size={14} className={cn(isLoading && "animate-spin")} />
            </button>
         </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-4 relative z-20">
        
        {/* Verification Status - Clean Inline Alert */}
        {!isProfileVerified && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-orange-100 mb-6 flex items-start gap-4">
             <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                <AlertTriangle className="text-orange-500" size={20} />
             </div>
             <div className="flex-1">
                <p className="text-[#1A3A6B] font-black text-[10px] uppercase tracking-widest mb-1">Locked Access</p>
                <p className="text-gray-400 text-[10px] font-medium italic">Departmental approval required for registration.</p>
                <div className="flex gap-2 mt-3">
                   <MiniIndicator label="Admin" active={student?.is_verifiedby_admin} />
                   <MiniIndicator label="Account" active={student?.is_verifiedby_accountant} />
                   <MiniIndicator label="Exam" active={student?.is_verifiedby_examcell} />
                </div>
             </div>
          </div>
        )}

        {/* Global Progression Timeline */}
        {isProfileVerified && courseData && (
          <div className="space-y-8">
             {courseData.years.map((year, yIdx) => (
                <div key={year.id}>
                   <div className="flex items-center gap-3 mb-4 opacity-50">
                      <p className="text-[9px] font-black text-[#1A3A6B] uppercase tracking-[0.2em]">{year.name}</p>
                      <div className="h-px bg-[#1A3A6B] flex-1" />
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {year.semesters.map((sem, sIdx) => {
                         const enrollment = courseData.enrollments.find(e => e.semester_id === sem.id)
                         const isEnrolled = !!enrollment
                         
                         // Enrollment Eligibility Constraint
                         let isLocked = false
                         if (sIdx > 0) {
                            const prev = year.semesters[sIdx-1]
                            const prevE = courseData.enrollments.find(e => e.semester_id === prev.id)
                            isLocked = !prevE || prevE.promotion_status !== 'Eligible' || !prevE.is_verifiedby_examcell
                         } else if (yIdx > 0) {
                            const prevYear = courseData.years[yIdx-1]
                            const lastSemPrev = prevYear.semesters[prevYear.semesters.length-1]
                            const prevE = courseData.enrollments.find(e => e.semester_id === lastSemPrev.id)
                            isLocked = !prevE || prevE.promotion_status !== 'Eligible' || !prevE.is_verifiedby_examcell
                         }

                         return (
                           <CompactEnrollmentCard 
                              key={sem.id} 
                              sem={sem} 
                              enrollment={enrollment} 
                              isLocked={isLocked && !isEnrolled}
                              onSelect={() => {
                                 if (!isEnrolled && !isLocked) {
                                    setSelectedSem(sem)
                                    setRegStep(0)
                                 }
                              }}
                           />
                         )
                      })}
                   </div>
                </div>
             ))}

             {courseData.years.length === 0 && (
                <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-gray-100 shadow-inner">
                   <p className="text-gray-400 font-medium text-sm italic">Academic structure not initialized for this course.</p>
                </div>
             )}
          </div>
        )}
      </div>

      {/* ── Desktop/Mobile Floating Enrollment Sheet ─────────── */}
      {selectedSem && (
        <div className="fixed inset-0 z-[100] bg-[#1A3A6B]/20 backdrop-blur-md flex items-end md:items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="w-full max-w-lg bg-white rounded-t-[32px] md:rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-10 duration-500">
              
              <div className="bg-[#1A3A6B] p-6 text-white flex items-center justify-between">
                 <div>
                    <h3 className="text-lg font-black tracking-tight text-white">{selectedSem.name} Enrollment</h3>
                    <div className="flex items-center gap-2 mt-1">
                       <Zap size={10} className="text-[#B8860B]" />
                       <p className="text-white/60 text-[8px] font-black uppercase tracking-widest leading-none">Digital Registration Phase</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedSem(null)} className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center border border-white/10 text-white">
                    <ArrowLeft size={16}/>
                 </button>
              </div>

              {/* Steps (Tiny Icons) */}
              <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-center gap-10">
                 <IconStep icon={BookOpen} active={regStep === 0} done={regStep > 0} />
                 <IconStep icon={CreditCard} active={regStep === 1} done={regStep > 1} />
                 <IconStep icon={Clock} active={regStep === 2} done={regStep > 2} />
              </div>

              <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                 {regStep === 0 && (
                   <div className="animate-in fade-in slide-in-from-right-4">
                      <p className="text-[#1A3A6B] font-black text-[9px] uppercase tracking-widest mb-4">Curriculum Mapping</p>
                      <div className="space-y-2">
                        {selectedSem.subjects.map((sub: any) => (
                          <div key={sub.id} className="flex items-center gap-3 p-2.5 bg-slate-50/50 rounded-xl border border-slate-100">
                             <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-300 shadow-sm"><FileText size={14}/></div>
                             <div className="flex-1 min-w-0">
                                <p className="text-[#1A3A6B] font-bold text-[10px] truncate">{sub.name}</p>
                                <p className="text-gray-400 text-[8px] font-bold uppercase tracking-widest mt-0.5">{sub.subject_code} · {sub.type}</p>
                             </div>
                          </div>
                        ))}
                      </div>
                   </div>
                 )}

                 {regStep === 1 && (
                   <div className="animate-in fade-in slide-in-from-right-4">
                      <p className="text-[#1A3A6B] font-black text-[9px] uppercase tracking-widest mb-4">Financial Support</p>
                      <div className="space-y-6">
                         <select 
                            value={scholarshipId}
                            onChange={(e) => setScholarshipId(e.target.value)}
                            className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[10px] font-bold text-[#1A3A6B] outline-none"
                         >
                            <option value="">No Scholarship Strategy</option>
                            {metadata?.scholarshipCategories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                         </select>
                         <div className="bg-[#1A3A6B] rounded-2xl p-6 text-white overflow-hidden relative shadow-xl shadow-blue-900/10">
                            <div className="absolute bottom-0 right-0 h-24 w-24 bg-white/5 rounded-full blur-xl -mb-10 -mr-10" />
                            <p className="text-white/40 text-[8px] font-black uppercase tracking-[.2em] mb-2">Total Net Amount</p>
                            <h4 className="text-3xl font-black italic text-white">₹{feeCalc?.netPayable?.toLocaleString()}</h4>
                            <div className="mt-4 flex justify-between text-[9px] font-bold text-white/50 border-t border-white/10 pt-4">
                               <span className="text-white/60">TOTAL FEES: ₹{feeCalc?.totalFee?.toLocaleString()}</span>
                               <span className="text-green-400">SCHOLARSHIP DISCOUNT: ₹{feeCalc?.scholarshipAmt?.toLocaleString()}</span>
                            </div>
                         </div>
                      </div>
                   </div>
                 )}

                 {regStep === 2 && (
                   <div className="animate-in fade-in slide-in-from-right-4">
                      <p className="text-[#1A3A6B] font-black text-[9px] uppercase tracking-widest mb-4">Payment Schedule</p>
                      <div className="flex gap-2">
                         <TinyActionCard active={paymentPlan === "One Time"} onClick={() => setPaymentPlan("One Time")} label="Full Advance" icon={CheckCircle2} />
                         <TinyActionCard active={paymentPlan === "Installments"} onClick={() => setPaymentPlan("Installments")} label="Split Ledger" icon={Clock} />
                      </div>
                      {paymentPlan === "Installments" && (
                         <div className="mt-4 space-y-4 animate-in slide-in-from-top-2">
                            <div className="space-y-2">
                               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Proposed Payment Dates</p>
                               {installmentDates.map((date, idx) => (
                                  <div key={idx} className="flex gap-2">
                                     <input 
                                        type="date"
                                        value={date}
                                        onChange={(e) => {
                                           const newDates = [...installmentDates]
                                           newDates[idx] = e.target.value
                                           setInstallmentDates(newDates)
                                        }}
                                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold text-[#1A3A6B] outline-none"
                                     />
                                     {idx > 0 && (
                                        <button 
                                           onClick={() => setInstallmentDates(installmentDates.filter((_, i) => i !== idx))}
                                           className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center border border-red-100"
                                        >
                                           <Trash2 size={14} />
                                        </button>
                                     )}
                                  </div>
                               ))}
                               <button 
                                  onClick={() => setInstallmentDates([...installmentDates, ""])}
                                  className="w-full h-9 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-[8px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-100 transition-colors"
                               >
                                  + Add Installment Date
                               </button>
                            </div>

                            <textarea 
                               value={installmentLetter}
                               onChange={(e) => setInstallmentLetter(e.target.value)}
                               rows={3}
                               placeholder="Specify grounds for installment request..."
                               className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-[10px] font-medium text-[#1A3A6B] outline-none focus:ring-2 focus:ring-blue-500/10"
                            />
                         </div>
                      )}
                   </div>
                 )}
              </div>

              {/* Action */}
              <div className="p-6 bg-white border-t border-slate-50 flex gap-2">
                 {regStep > 0 && (
                    <button onClick={() => setRegStep(s => s - 1)} className="h-11 px-6 bg-slate-50 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400">Back</button>
                 )}
                 <button 
                    onClick={() => regStep < 2 ? setRegStep(s => s + 1) : handleEnroll()}
                    disabled={isSubmitting}
                    className="flex-1 h-11 bg-[#1A3A6B] hover:bg-[#2E75C7] rounded-xl text-white text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                 >
                    {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : regStep === 2 ? "Finalize Enrollment" : "Proceed"}
                    {!isSubmitting && <ChevronRight size={14}/>}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  )
}

/* --- Tiny UI Components --- */

function TinyBadge({ label, icon: Icon }: any) {
  return (
    <div className="px-2 py-1 bg-white/10 rounded-md border border-white/20 flex items-center gap-1.5 backdrop-blur-md">
      <Icon size={10} className="text-white" />
      <span className="text-[10px] font-bold tracking-tight text-white">{label}</span>
    </div>
  )
}

function MiniIndicator({ label, active }: { label: string, active: boolean }) {
  return (
    <div className={cn(
      "px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-wider border transition-all",
      active ? "bg-green-50 text-green-600 border-green-100" : "bg-gray-50 text-gray-300 border-gray-100"
    )}>
       {label}
    </div>
  )
}

function CompactEnrollmentCard({ sem, enrollment, isLocked, onSelect }: any) {
  const isEnrolled = !!enrollment
  
  return (
    <div 
      onClick={onSelect}
      className={cn(
        "group bg-white rounded-xl p-3 border transition-all duration-300 relative overflow-hidden",
        isLocked ? "opacity-40 grayscale pointer-events-none" : "hover:border-[#1A3A6B]/20 cursor-pointer hover:shadow-lg hover:shadow-blue-900/5 active:scale-98"
      )}
    >
       <div className="flex items-center justify-between mb-3">
          <div className={cn(
            "h-7 w-7 rounded-lg flex items-center justify-center transition-all",
            isLocked ? "bg-slate-100 text-slate-300" :
            isEnrolled ? "bg-green-50 text-green-500" : "bg-slate-50 text-[#1A3A6B]"
          )}>
             {isLocked ? <Lock size={12}/> : isEnrolled ? <CheckCircle2 size={12}/> : <BookOpen size={12}/>}
          </div>
          {isEnrolled && (
             <span className="text-[7px] font-black text-green-600 px-1.5 py-0.5 bg-green-50/50 rounded border border-green-100/30">ENROLLED</span>
          )}
       </div>
       <h4 className="text-[11px] font-black text-[#1A3A6B] uppercase tracking-tighter truncate">{sem.name}</h4>
       <p className="text-gray-400 text-[8px] font-bold uppercase mt-0.5">{sem.subjects.length} Units Curriculum</p>

       {isEnrolled && (
          <div className="mt-4 pt-2 border-t border-slate-50 flex gap-1.5">
             <Dot verified={enrollment.is_verifiedby_admin} />
             <Dot verified={enrollment.is_verifiedby_accountant} />
             <Dot verified={enrollment.is_verifiedby_examcell} />
          </div>
       )}

       {!isEnrolled && !isLocked && (
          <div className="mt-4 flex items-center gap-1 text-[#2E75C7] text-[8px] font-black uppercase tracking-widest">
             <span>Register</span>
             <ChevronRight size={10} className="group-hover:translate-x-0.5 transition-transform"/>
          </div>
       )}
    </div>
  )
}

function Dot({ verified }: { verified: boolean }) {
  return <div className={cn("h-1.5 w-1.5 rounded-full ring-2 ring-white", verified ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" : "bg-slate-200")}/>
}

function IconStep({ icon: Icon, active, done }: any) {
  return (
    <div className={cn(
      "h-7 w-7 rounded-lg flex items-center justify-center transition-all border",
      done ? "bg-green-500 text-white border-green-500" : 
      active ? "bg-[#1A3A6B] text-white border-[#1A3A6B] shadow-lg shadow-blue-900/20" : 
      "bg-white text-slate-400 border-slate-100 shadow-sm"
    )}>
       <Icon size={12} strokeWidth={3} />
    </div>
  )
}

function TinyActionCard({ active, onClick, label, icon: Icon }: any) {
  return (
    <div 
       onClick={onClick}
       className={cn(
         "flex-1 p-3 rounded-xl border-2 flex flex-col items-center gap-2 cursor-pointer transition-all active:scale-95",
         active ? "bg-[#1A3A6B] border-[#1A3A6B] text-white shadow-lg" : "bg-white border-slate-50 text-slate-300 hover:border-slate-100"
       )}
    >
       <Icon size={16} />
       <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
    </div>
  )
}
