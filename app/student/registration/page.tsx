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
  Zap, Trash2, ShieldAlert, X, Sparkles, IndianRupee,
  BadgeCheck, CircleDot, ChevronDown
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

/* --- Types --- */
type Semester = {
  id: string
  name: string
  subjects: any[]
  academic_year_id: string
}

type AcademicYear = {
  id: string
  name: string
  sequence: number
  semesters: Semester[]
}

type Enrollment = {
  id: string
  semester_id: string
  promotion_status: "Eligible" | "Drop" | "Hold"
  status: "active" | "completed"
  is_verifiedby_admin: boolean
  is_verifiedby_accountant: boolean
  is_verifiedby_examcell: boolean
  net_payable_fee: number
  created_at: string
}

/* ============================================================
   MAIN PAGE
   ============================================================ */
export default function RegistrationPage() {
  const router = useRouter()
  const supabase = getSupabaseClient()

  const [isLoading, setIsLoading] = useState(true)
  const [student, setStudent] = useState<any>(null)
  const [courseData, setCourseData] = useState<{ years: AcademicYear[]; enrollments: Enrollment[]; studentYears: any[] } | null>(null)
  const [metadata, setMetadata] = useState<any>(null)

  const [selectedSem, setSelectedSem] = useState<Semester | null>(null)
  const [selectedSemIdx, setSelectedSemIdx] = useState<number>(-1)
  const [editingYearId, setEditingYearId] = useState<string | null>(null)
  const [regStep, setRegStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [eligibilityStatus, setEligibilityStatus] = useState<"Eligible" | "Drop" | "Hold" | "New">("Eligible")

  const [scholarshipId, setScholarshipId] = useState("")
  const [session, setSession] = useState(`${new Date().getFullYear()}-${new Date().getFullYear() + 1}`)
  const [feeCalc, setFeeCalc] = useState<any>(null)
  const [paymentPlan, setPaymentPlan] = useState<"One Time" | "Installments">("One Time")
  const [installmentLetter, setInstallmentLetter] = useState("")
  const [installmentDates, setInstallmentDates] = useState<string[]>([""])
  const [isYearConfirmed, setIsYearConfirmed] = useState(false)

  useEffect(() => { init() }, [])

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
          getAdmissionMetadata(supabase),
        ])
        setCourseData(progress)
        setMetadata(meta)

        if (progress && progress.enrollments.length > 0) {
          const latest = [...progress.enrollments].sort((a, b) => b.id - a.id)[0]
          setEligibilityStatus(latest.promotion_status)
        } else {
          setEligibilityStatus("Eligible")
        }
      }
    } catch (err) {
      console.error("Init Error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const activeId = editingYearId || selectedSem?.academic_year_id
    if (activeId && courseData?.studentYears) {
      const yearMeta = metadata?.academicYears.find((y: any) => y.id === activeId)
      const existing = courseData.studentYears.find(sy => sy.academic_year_name === yearMeta?.name)
      if (existing) {
        setSession(existing.academic_year_session || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`)
        setScholarshipId(existing.scholarship_category_id || "")
        setPaymentPlan(existing.registration_data?.payment_plan || "One Time")
        setInstallmentLetter(existing.installment_letter || "")
        setInstallmentDates(existing.installment_dates || [""])
        // If we are explicitly editing via the header, we want isYearConfirmed to start as false
        if (editingYearId) setIsYearConfirmed(false)
        else setIsYearConfirmed(true)
      } else {
        setSession(`${new Date().getFullYear()}-${new Date().getFullYear() + 1}`)
        setScholarshipId("")
        setPaymentPlan("One Time")
        setInstallmentLetter("")
        setInstallmentDates([""])
        setIsYearConfirmed(false)
      }
    }
  }, [selectedSem, editingYearId, courseData?.studentYears, metadata?.academicYears])

  useEffect(() => {
    if (student) {
      const fetchFees = async () => {
        const targetYearId = student.admission_year_id
        if (!targetYearId) return
        const res = await calculateStudentFees(supabase, {
          courseId: student.course_id,
          academicYearId: targetYearId,
          scholarshipCategoryId: scholarshipId || undefined,
        })
        setFeeCalc(res)
      }
      fetchFees()
    }
  }, [scholarshipId, selectedSem, student, supabase, courseData])

  const handleYearConfirm = async () => {
    if (!student || !scholarshipId || (!selectedSem && !editingYearId)) return
    setIsSubmitting(true)
    try {
      const activeYearId = editingYearId || selectedSem?.academic_year_id
      const yearMeta = metadata?.academicYears.find((y: any) => y.id === activeYearId)
      const academicYearSession = session || yearMeta?.name || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`

      // Check for existing record to preserve ID for update/upsert
      const existing = courseData?.studentYears?.find(sy => sy.academic_year_name === yearMeta?.name)
      
      const payload: any = {
        student_id: student.id,
        course_id: student.course_id,
        academic_year_name: yearMeta?.name || "First Year",
        academic_year_session: academicYearSession,
        status: "Active",
        is_registered: true,
        total_fee: feeCalc?.totalFee || 0,
        scholarship_amount: feeCalc?.scholarshipAmt || 0,
        scholarship_category_id: scholarshipId || null,
        scholarship_amount_id: feeCalc?.scholarshipAmountId || null,
        scholarship_name: metadata?.scholarshipCategories.find((c: any) => c.id === scholarshipId)?.name || null,
        year_category_id: student.admission_year_id,
        net_payable_fee: feeCalc?.netPayable || 0,
        installment_dates: paymentPlan === "Installments" ? installmentDates.filter(d => d) : null,
        installment_letter: paymentPlan === "Installments" ? installmentLetter : null,
        registration_data: { payment_plan: paymentPlan },
      }

      if (existing) {
        if (existing.is_locked) {
          throw new Error("This year strategy is locked and cannot be edited.")
        }
        const { error: updateError } = await supabase
          .from("student_academic_years")
          .update(payload)
          .eq("id", existing.id)
        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from("student_academic_years")
          .insert(payload)
        if (insertError) throw insertError
      }

      setIsYearConfirmed(true)
      setEditingYearId(null) // Clear editing state after success
      toast.success("Academic year strategy finalized!")
      init()
    } catch (err: any) {
      toast.error("Year configuration failed: " + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEnroll = async () => {
    if (!selectedSem || !student) return
    setIsSubmitting(true)
    try {
      const yearMeta = metadata?.academicYears.find((y: any) => y.id === selectedSem.academic_year_id)
      const academicYearSession = yearMeta?.name || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
      let academicYearId: number | null = null

      const { data: existingYear } = await supabase
        .from("student_academic_years")
        .select("id")
        .eq("student_id", student.id)
        .eq("academic_year_name", yearMeta?.name)
        .maybeSingle()

      if (existingYear) {
        academicYearId = existingYear.id
      } else {
        const { data: newYear, error: yearError } = await supabase
          .from("student_academic_years")
          .insert({
            student_id: student.id,
            course_id: student.course_id,
            academic_year_name: yearMeta?.name,
            academic_year_session: session,
            status: "Active",
            total_fee: feeCalc?.totalFee || 0,
            scholarship_amount: feeCalc?.scholarshipAmt || 0,
            scholarship_category_id: scholarshipId || null,
            scholarship_amount_id: feeCalc?.scholarshipAmountId || null,
            year_category_id: student.admission_year_id,
            net_payable_fee: feeCalc?.netPayable || 0,
            payment_plan: paymentPlan,
          })
          .select("id")
          .single()

        if (yearError) throw yearError
        academicYearId = newYear.id
      }

      const isPaymentRequired = selectedSemIdx === 0
      const payload = {
        student_id: student.id,
        student_academic_year_id: academicYearId,
        semester_id: selectedSem.id,
        status: "active",
        promotion_status: "Pending",
        registration_data: {
          payment_plan: isPaymentRequired ? paymentPlan : "Annual (Paid)",
          installment_letter: isPaymentRequired ? installmentLetter : "",
          installment_dates: isPaymentRequired ? installmentDates.filter((d) => d) : [],
          enrolled_at: new Date().toISOString(),
        },
      }

      const { error: semesterInsertError } = await supabase.from("student_semesters").insert(payload)
      if (semesterInsertError) throw semesterInsertError

      // Update student's current semester link
      const { error: studentUpdateError } = await supabase
        .from("students")
        .update({ current_sem_id: selectedSem.id })
        .eq("id", student.id)
      
      if (studentUpdateError) throw studentUpdateError

      setSelectedSem(null)
      init()
      toast.success("Semester enrollment successful!")
    } catch (err: any) {
      toast.error("Registration failed: " + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  /* ---------- LOADING SCREEN ---------- */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F0F4FF] flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-[#0F2152] flex items-center justify-center shadow-xl shadow-blue-900/30">
            <GraduationCap size={24} className="text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#3B82F6] border-2 border-white flex items-center justify-center">
            <Loader2 size={10} className="text-white animate-spin" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-[#0F2152] font-semibold text-sm">Loading Portal</p>
          <p className="text-[#0F2152]/40 text-xs mt-0.5">Preparing your registration</p>
        </div>
      </div>
    )
  }

  const isProfileVerified =
    student?.is_verifiedby_admin &&
    student?.is_verifiedby_accountant &&
    student?.is_verifiedby_examcell

  const enrolledCount = courseData?.enrollments?.length ?? 0
  const totalSems = courseData?.years?.reduce((a, y) => a + y.semesters.length, 0) ?? 0

  return (
    <div className="min-h-screen bg-[#F0F4FF] font-sans">

      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm shadow-slate-200/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0F2152] to-[#1E4DB7] flex items-center justify-center shadow-md shadow-blue-900/20">
              <GraduationCap size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-[#0F2152] tracking-tight leading-none">Sem Registration</h1>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-none">{student?.courses?.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={cn(
              "hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
              eligibilityStatus === "Eligible"
                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                : eligibilityStatus === "Hold"
                  ? "bg-amber-50 text-amber-600 border-amber-200"
                  : "bg-rose-50 text-rose-600 border-rose-200"
            )}>
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                eligibilityStatus === "Eligible" ? "bg-emerald-500 animate-pulse" : eligibilityStatus === "Hold" ? "bg-amber-500" : "bg-rose-500"
              )} />
              {eligibilityStatus}
            </div>
            <button
              onClick={init}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-all active:scale-95"
            >
              <RefreshCw size={14} className={cn(isLoading && "animate-spin")} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ===== STUDENT INFO BANNER ===== */}
        <div className="bg-gradient-to-br from-[#0F2152] via-[#1E3A8A] to-[#1E4DB7] rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-white relative overflow-hidden shadow-xl shadow-blue-900/20">
          {/* decorative blobs */}
          <div className="absolute top-0 right-0 w-56 h-56 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-400/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-5">
            {/* avatar */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center text-2xl font-bold text-white shrink-0 shadow-inner">
              {student?.fullname?.[0]?.toUpperCase() ?? "S"}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-white/50 text-[10px] font-semibold uppercase tracking-widest mb-0.5">Registered Student</p>
              <h2 className="text-lg sm:text-xl font-bold text-white leading-tight truncate">{student?.fullname ?? "Student"}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <PillBadge icon={Calendar} label={`Batch ${student?.admission_year}`} />
                <PillBadge icon={BookOpen} label={`${enrolledCount}/${totalSems} Semesters`} />
                {student?.roll_number && <PillBadge icon={BadgeCheck} label={student.roll_number} />}
              </div>
            </div>

            {/* progress ring */}
            <div className="sm:flex hidden flex-col items-center gap-1">
              <ProgressRing value={enrolledCount} max={totalSems || 8} />
              <p className="text-white/40 text-[9px] font-semibold uppercase tracking-widest">Progress</p>
            </div>
          </div>
        </div>

        {/* ===== VERIFICATION GATE ===== */}
        {!isProfileVerified && (
          <div className="bg-white rounded-2xl border border-orange-100 p-5 flex items-start gap-4 shadow-sm shadow-orange-50">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
              <AlertTriangle size={18} className="text-orange-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 mb-0.5">Approval Pending</p>
              <p className="text-xs text-slate-400 mb-3">Departmental verification required before you can register for semesters.</p>
              <div className="flex flex-wrap gap-2">
                <VerifyChip label="Admin" done={student?.is_verifiedby_admin} />
                <VerifyChip label="Accounts" done={student?.is_verifiedby_accountant} />
                <VerifyChip label="Exam Cell" done={student?.is_verifiedby_examcell} />
              </div>
            </div>
          </div>
        )}

        {/* ===== ELIGIBILITY BLOCK ===== */}
        {isProfileVerified && eligibilityStatus !== "Eligible" && (
          <div className="bg-white rounded-2xl border border-rose-100 p-5 flex items-start gap-4 shadow-sm shadow-rose-50">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
              <ShieldAlert size={18} className="text-rose-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 mb-0.5">Enrollment Restricted</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your status is marked as{" "}
                <span className="font-bold text-rose-500">{eligibilityStatus}</span>.
                Contact the admin or exam cell to resolve this before registering.
              </p>
            </div>
          </div>
        )}

        {/* ===== SEMESTER GRID ===== */}
        {isProfileVerified && courseData && (
          <div className="space-y-6">
            {courseData.years.map((year, yIdx) => (
              <section key={year.id}>
                {/* Year heading */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-[#0F2152] flex items-center justify-center text-white text-[10px] font-black shadow-md shadow-blue-900/20">
                    {yIdx + 1}
                  </div>
                  <h3 className="text-xs font-bold text-[#0F2152] uppercase tracking-widest">{year.name}</h3>
                  
                  {/* Edit Option */}
                  {(() => {
                    const confirmedYear = courseData.studentYears?.find(sy => sy.academic_year_name === year.name)
                    if (confirmedYear && !confirmedYear.is_locked) {
                      return (
                        <button 
                          onClick={() => setEditingYearId(year.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-slate-200 text-[9px] font-bold text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all hover:shadow-sm"
                        >
                          <Zap size={10} className="text-amber-400" />
                          Update Scholarship & Fee Policy
                        </button>
                      )
                    }
                    if (confirmedYear?.is_locked) {
                      return (
                        <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                          <CheckCircle2 size={10} />
                          Locked
                        </div>
                      )
                    }
                    return null
                  })()}

                  <div className="h-px bg-gradient-to-r from-[#0F2152]/20 to-transparent flex-1" />
                </div>

                <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3">
                  {year.semesters.map((sem, sIdx) => {
                    const enrollment = courseData.enrollments.find((e) => e.semester_id === sem.id)
                    const isEnrolled = !!enrollment

                    let isLocked = false
                    if (sIdx > 0) {
                      const prev = year.semesters[sIdx - 1]
                      const prevE = courseData.enrollments.find((e) => e.semester_id === prev.id)
                      isLocked = !prevE || prevE.promotion_status !== "Eligible" || !prevE.is_verifiedby_examcell
                    } else if (yIdx > 0) {
                      const prevYear = courseData.years[yIdx - 1]
                      const lastSemPrev = prevYear.semesters[prevYear.semesters.length - 1]
                      const prevE = courseData.enrollments.find((e) => e.semester_id === lastSemPrev.id)
                      isLocked = !prevE || prevE.promotion_status !== "Eligible" || !prevE.is_verifiedby_examcell
                    }

                    return (
                      <SemCard
                        key={sem.id}
                        sem={sem}
                        enrollment={enrollment}
                        isLocked={isLocked && !isEnrolled}
                        eligibilityStatus={eligibilityStatus}
                        onSelect={() => {
                          if (!isEnrolled && !isLocked && eligibilityStatus === "Eligible") {
                            setSelectedSem(sem)
                            setSelectedSemIdx(sIdx)
                            setRegStep(0)
                          }
                        }}
                      />
                    )
                  })}
                </div>
              </section>
            ))}

            {courseData.years.length === 0 && (
              <div className="bg-white rounded-2xl border-2 border-dashed border-slate-100 p-16 text-center">
                <BookOpen size={32} className="mx-auto text-slate-200 mb-3" />
                <p className="text-slate-400 text-sm font-medium">Academic structure not initialized.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ================================================================
          YEAR strategy check logic
          ================================================================ */}
      {(() => {
        const activeId = editingYearId || selectedSem?.academic_year_id
        if (!activeId) return null
        const yearMeta = metadata?.academicYears.find((y: any) => y.id === activeId)
        const confirmedYear = courseData?.studentYears?.find(sy => sy.academic_year_name === yearMeta?.name)
        const isConfirmed = !!confirmedYear && confirmedYear.is_registered

        // If not confirmed OR (not locked and user wants to edit), show Year Modal
        // EXCEPT: if the student has ALREADY ENROLLED in the semester, we skip straight to Sem Modal
        const isEnrolledInThisSem = courseData?.enrollments?.some(e => e.semester_id === selectedSem?.id)

        if (!isEnrolledInThisSem && (!isConfirmed || (!confirmedYear.is_locked && !isYearConfirmed))) {
          return (
            <ModalOverlay onClose={() => { setSelectedSem(null); setEditingYearId(null); }} zIndex="z-[120]">
              <div className="w-full max-w-lg flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-gradient-to-br from-[#0F2152] to-[#1E4DB7] p-6 sm:p-8 text-white relative overflow-hidden rounded-t-2xl sm:rounded-t-3xl shrink-0">
                  <div className="absolute top-0 right-0 opacity-5"><Trophy size={140} /></div>
                  <button
                    onClick={() => { setSelectedSem(null); setEditingYearId(null); }}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all z-[130]"
                  >
                    <X size={14} />
                  </button>
                  <div className="flex items-center gap-2 mb-1 opacity-60">
                    <Sparkles size={12} />
                    <span className="text-[9px] font-black uppercase tracking-widest">{student?.courses?.name}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight mb-1 text-white">Year Strategy</h3>
                  <p className="text-white/50 text-xs font-medium">
                    Configure fees & scholarship for {yearMeta?.name}
                  </p>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto bg-white p-6 sm:p-8 space-y-6">
                  
                  {/* Subjects Preview */}
                  {selectedSem && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                      <p className="text-[10px] font-black text-[#0F2152] uppercase tracking-widest px-0.5">
                        Subjects for {selectedSem.name}
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {selectedSem.subjects.slice(0, 4).map((sub: any) => (
                          <div key={sub.id} className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
                             <div className="w-1 h-1 rounded-full bg-blue-400" />
                             <span className="truncate">{sub.name}</span>
                          </div>
                        ))}
                        {selectedSem.subjects.length > 4 && (
                          <p className="text-[9px] text-slate-400 font-bold pl-3 italic">
                            + {selectedSem.subjects.length - 4} more subjects
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Session Select */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#0F2152] uppercase tracking-widest px-0.5">
                      Academic Session
                    </label>
                    <div className="relative">
                      <select
                        value={session}
                        onChange={(e) => setSession(e.target.value)}
                        className="w-full h-12 sm:h-14 appearance-none bg-[#F5F8FF] border-2 border-slate-100 hover:border-blue-300 focus:border-blue-500 rounded-xl px-4 text-sm font-semibold text-[#0F2152] outline-none transition-all pr-10"
                      >
                        {(() => {
                          const currentYear = new Date().getFullYear();
                          const sessions = [];
                          for (let i = -2; i <= 3; i++) {
                            const year = currentYear + i;
                            sessions.push(`${year}-${year + 1}`);
                          }
                          return sessions.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ));
                        })()}
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Scholarship Select */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#0F2152] uppercase tracking-widest px-0.5">
                      Scholarship Category
                    </label>
                    <div className="relative">
                      <select
                        value={scholarshipId}
                        onChange={(e) => setScholarshipId(e.target.value)}
                        className="w-full h-12 sm:h-14 appearance-none bg-[#F5F8FF] border-2 border-slate-100 hover:border-blue-300 focus:border-blue-500 rounded-xl px-4 text-sm font-semibold text-[#0F2152] outline-none transition-all pr-10"
                      >
                        <option value="">Choose your category…</option>
                        {metadata?.scholarshipCategories.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Fee Breakdown */}
                  {scholarshipId && (
                    <div className="space-y-4 animate-in slide-in-from-top-3 duration-300">
                      <div className="grid grid-cols-3 gap-2">
                        <FeeBox label="College Fee" value={`₹${(feeCalc?.totalFee || 0).toLocaleString("en-IN")}`} />
                        <FeeBox label="Scholarship" value={`-₹${(feeCalc?.scholarshipAmt || 0).toLocaleString("en-IN")}`} green />
                        <FeeBox label="Net Payable" value={`₹${(feeCalc?.netPayable || 0).toLocaleString("en-IN")}`} highlight />
                      </div>

                      {/* Scholarship details */}
                      <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex gap-3">
                        <ShieldCheck size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-1">Benefit Applied</p>
                          <p className="text-xs text-emerald-700 leading-relaxed">
                            {metadata?.scholarshipCategories.find((c: any) => c.id === scholarshipId)?.description || "Standard scholarship benefit."}
                          </p>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2.5">
                        <Info size={13} className="text-slate-400 shrink-0" />
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                          Required docs:{" "}
                          <span className="text-[#0F2152]">
                            {metadata?.scholarshipCategories.find((c: any) => c.id === scholarshipId)?.documents_required || "None specified"}
                          </span>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Payment Strategy */}
                  <div className="space-y-4 pt-2">
                    <p className="text-[10px] font-black text-[#0F2152] uppercase tracking-widest px-0.5">Payment Plan</p>
                    <div className="grid grid-cols-2 gap-3">
                      <PayCard
                        active={paymentPlan === "One Time"}
                        onClick={() => setPaymentPlan("One Time")}
                        icon={IndianRupee}
                        label="Full Advance"
                        sub="Pay once upfront"
                      />
                      <PayCard
                        active={paymentPlan === "Installments"}
                        onClick={() => setPaymentPlan("Installments")}
                        icon={Clock}
                        label="Installments"
                        sub="Pay in parts"
                      />
                    </div>

                    {paymentPlan === "Installments" && (
                      <div className="space-y-4 animate-in slide-in-from-top-2 duration-300 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="space-y-2">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Proposed Dates</p>
                          {installmentDates.map((date, idx) => (
                            <div key={idx} className="flex gap-2">
                              <input
                                type="date"
                                value={date}
                                onChange={(e) => {
                                  const d = [...installmentDates]
                                  d[idx] = e.target.value
                                  setInstallmentDates(d)
                                }}
                                className="flex-1 h-11 bg-white border-2 border-slate-100 rounded-xl px-4 text-xs font-semibold text-[#0F2152] outline-none focus:border-blue-400 transition-colors"
                              />
                              {idx > 0 && (
                                <button
                                  onClick={() => setInstallmentDates(installmentDates.filter((_, i) => i !== idx))}
                                  className="w-11 h-11 bg-rose-50 text-rose-400 rounded-xl flex items-center justify-center border border-rose-100 hover:bg-rose-100 transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            onClick={() => setInstallmentDates([...installmentDates, ""])}
                            className="w-full h-10 bg-white border-2 border-dashed border-slate-200 rounded-xl text-[9px] font-bold text-slate-400 uppercase tracking-widest hover:bg-blue-50 hover:border-blue-200 hover:text-blue-400 transition-all"
                          >
                            + Add Installment Date
                          </button>
                        </div>
                        <textarea
                          value={installmentLetter}
                          onChange={(e) => setInstallmentLetter(e.target.value)}
                          rows={3}
                          placeholder="Grounds for installment request…"
                          className="w-full bg-white border-2 border-slate-100 rounded-xl p-4 text-xs font-medium text-[#0F2152] outline-none focus:border-blue-400 transition-colors resize-none placeholder:text-slate-300"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-white border-t border-slate-100 p-6 sm:p-8 flex gap-3 rounded-b-2xl sm:rounded-b-3xl shrink-0">
                  <button
                    onClick={() => { setSelectedSem(null); setEditingYearId(null); }}
                    className="flex-1 h-12 bg-slate-100 text-slate-500 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleYearConfirm}
                    disabled={!scholarshipId || isSubmitting}
                    className="flex-[2] h-12 bg-gradient-to-r from-[#0F2152] to-[#1E4DB7] text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-blue-900/20 hover:shadow-blue-900/30 hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : (
                      <>Save Strategy <ArrowRight size={14} /></>
                    )}
                  </button>
                </div>
              </div>
            </ModalOverlay>
          )
        }

        // If confirmed AND (locked OR user explicitly moved to sem step), show Sem Modal
        return (
          <ModalOverlay onClose={() => setSelectedSem(null)} zIndex="z-[100]">
            <div className="w-full max-w-lg flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="bg-gradient-to-br from-[#0F2152] to-[#1E4DB7] p-5 sm:p-6 text-white rounded-t-2xl sm:rounded-t-3xl shrink-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-white/50 text-[9px] font-black uppercase tracking-widest mb-1">
                      {selectedSem?.name}
                    </p>
                    <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">Enrollment Registry</h3>
                  </div>
                  <button
                    onClick={() => setSelectedSem(null)}
                    className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <div className="px-2 py-1 rounded bg-white/10 border border-white/20 text-[10px] font-bold">
                    Year: {confirmedYear?.academic_year_name}
                  </div>
                  {!confirmedYear?.is_locked && (
                    <button 
                      onClick={() => setIsYearConfirmed(false)}
                      className="text-[10px] font-bold text-blue-300 hover:text-white underline"
                    >
                      Edit Year Strategy
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto bg-white px-5 sm:px-6 py-5">
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
                    {/* Verification Status if enrolled */}
                    {isEnrolledInThisSem && selectedSem && courseData && (
                      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Clearance Status</p>
                          <Badge className="bg-emerald-500 text-white border-none text-[9px] font-bold">Verified Stage</Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                           <VerifyChip label="Admin" done={!!courseData?.enrollments.find(e => e.semester_id === selectedSem?.id)?.is_verifiedby_admin} />
                           <VerifyChip label="Accounts" done={!!courseData?.enrollments.find(e => e.semester_id === selectedSem?.id)?.is_verifiedby_accountant} />
                           <VerifyChip label="Exam Cell" done={!!courseData?.enrollments.find(e => e.semester_id === selectedSem?.id)?.is_verifiedby_examcell} />
                        </div>
                      </div>
                    )}

                    {selectedSem && (
                      <div className="space-y-3">
                        <p className="text-[10px] font-black text-[#0F2152] uppercase tracking-widest px-0.5">
                          Curriculum · {selectedSem?.subjects?.length || 0} Units
                        </p>
                        <div className="grid grid-cols-1 gap-2">
                          {selectedSem?.subjects?.map((sub: any) => (
                            <div key={sub.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-all group">
                              <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-blue-500 transition-colors shrink-0">
                                <FileText size={14} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-[#0F2152] truncate leading-tight">{sub.name}</p>
                                <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">
                                  {sub.subject_code} · {sub.type}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
              </div>

              {/* Footer actions */}
              <div className="bg-white border-t border-slate-100 p-5 sm:p-6 flex gap-3 rounded-b-2xl sm:rounded-b-3xl shrink-0">
                {selectedSem && courseData && courseData.enrollments.some(e => e.semester_id === selectedSem.id) ? (
                  <button
                    onClick={() => setSelectedSem(null)}
                    className="flex-1 h-12 bg-slate-100 text-[#0F2152] font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    Close Registry
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setSelectedSem(null)}
                      className="flex-1 h-12 bg-slate-100 text-slate-500 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleEnroll}
                      disabled={isSubmitting || eligibilityStatus !== "Eligible"}
                      className="flex-[2] h-12 bg-gradient-to-r from-[#0F2152] to-[#1E4DB7] text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-blue-900/20 hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : eligibilityStatus !== "Eligible" ? (
                        "Status Restricted"
                      ) : (
                        <>Finalize Enrollment <Check size={14} /></>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </ModalOverlay>
        )
      })()}

    </div>
  )
}

/* ============================================================
   SUB COMPONENTS
   ============================================================ */

/** Reusable modal backdrop + centering wrapper */
function ModalOverlay({ children, onClose, zIndex }: { children: React.ReactNode; onClose: () => void; zIndex: string }) {
  return (
    <div
      className={cn(
        "fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200",
        zIndex
      )}
      style={{ background: "rgba(15,33,82,0.4)", backdropFilter: "blur(12px)" }}
    >
      {/* Backdrop tap to close */}
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className="relative w-full sm:w-auto animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-300"
        style={{ maxWidth: "100vw" }}
      >
        {children}
      </div>
    </div>
  )
}

/** Semester enrollment card */
function SemCard({ sem, enrollment, isLocked, onSelect, eligibilityStatus }: any) {
  const isEnrolled = !!enrollment
  const isAvailable = !isEnrolled && !isLocked && eligibilityStatus === "Eligible"

  return (
    <div
      onClick={onSelect}
      className={cn(
        "group relative bg-white rounded-2xl border p-4 transition-all duration-200 overflow-hidden cursor-pointer active:scale-[0.98]",
        isLocked
          ? "opacity-40 grayscale cursor-not-allowed"
          : isEnrolled
            ? "border-emerald-100 shadow-sm"
            : isAvailable
              ? "border-slate-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-900/5 cursor-pointer active:scale-[0.98]"
              : "border-slate-100 opacity-60 cursor-not-allowed"
      )}
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-3">
        <div className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
          isLocked ? "bg-slate-100 text-slate-300" :
            isEnrolled ? "bg-emerald-50 text-emerald-500 shadow-sm" :
              "bg-[#EEF2FF] text-[#1E4DB7] group-hover:bg-[#1E4DB7] group-hover:text-white"
        )}>
          {isLocked ? <Lock size={14} /> : isEnrolled ? <CheckCircle2 size={14} /> : <BookOpen size={14} />}
        </div>

        {isEnrolled && (
          <span className="text-[8px] font-black text-emerald-600 px-2 py-1 bg-emerald-50 rounded-full border border-emerald-100 uppercase tracking-wider">
            Enrolled
          </span>
        )}
        {isLocked && (
          <span className="text-[8px] font-black text-slate-400 px-2 py-1 bg-slate-50 rounded-full border border-slate-100 uppercase tracking-wider">
            Locked
          </span>
        )}
      </div>

      {/* Title */}
      <p className="text-xs sm:text-sm font-bold text-[#0F2152] leading-tight mb-0.5 truncate">{sem.name}</p>
      <p className="text-[10px] text-slate-400 font-medium">{sem.subjects.length} Subjects</p>

      {/* Verification dots for enrolled */}
      {isEnrolled && (
        <div className="mt-3 pt-3 border-t border-slate-50 flex items-center gap-2">
          <VerifyDot done={enrollment.is_verifiedby_admin} label="Admin" />
          <VerifyDot done={enrollment.is_verifiedby_accountant} label="Accounts" />
          <VerifyDot done={enrollment.is_verifiedby_examcell} label="Exam" />
        </div>
      )}

      {/* CTA */}
      {isAvailable && (
        <div className="mt-3 flex items-center gap-1 text-[#1E4DB7] text-[9px] font-black uppercase tracking-widest group-hover:gap-1.5 transition-all">
          <span>Register Now</span>
          <ChevronRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
        </div>
      )}

      {/* Hover shine effect */}
      {isAvailable && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#1E4DB7]/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
      )}
    </div>
  )
}

function VerifyDot({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <div className={cn(
        "w-2 h-2 rounded-full transition-all",
        done ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" : "bg-slate-200"
      )} />
      <span className={cn("text-[8px] font-semibold uppercase tracking-wider", done ? "text-emerald-500" : "text-slate-300")}>
        {label}
      </span>
    </div>
  )
}

function VerifyChip({ label, done }: { label: string; done: boolean }) {
  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all",
      done
        ? "bg-emerald-50 text-emerald-600 border-emerald-200"
        : "bg-slate-50 text-slate-400 border-slate-100"
    )}>
      {done ? <Check size={10} /> : <Clock size={10} />}
      {label}
    </div>
  )
}

function PillBadge({ icon: Icon, label }: any) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full">
      <Icon size={10} className="text-white/70" />
      <span className="text-[10px] font-semibold text-white/90 leading-none">{label}</span>
    </div>
  )
}

function StepDot({ label, active, done }: { label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn(
        "w-5 h-5 rounded-full flex items-center justify-center transition-all text-[9px] font-black border",
        done ? "bg-emerald-400 border-emerald-400 text-white" :
          active ? "bg-white border-white text-[#0F2152]" :
            "bg-white/20 border-white/20 text-white/50"
      )}>
        {done ? <Check size={10} /> : null}
      </div>
      <span className={cn(
        "text-[9px] font-bold uppercase tracking-wider",
        active ? "text-white" : done ? "text-white/70" : "text-white/40"
      )}>
        {label}
      </span>
    </div>
  )
}

function FeeBox({ label, value, green, highlight }: any) {
  return (
    <div className={cn(
      "rounded-xl p-3 border flex flex-col items-center text-center gap-1",
      highlight ? "bg-gradient-to-br from-[#0F2152] to-[#1E4DB7] border-transparent text-white shadow-md" :
        "bg-[#F5F8FF] border-slate-100"
    )}>
      <p className={cn("text-[8px] font-black uppercase tracking-widest", highlight ? "text-white/40" : "text-slate-400")}>{label}</p>
      <p className={cn(
        "text-sm font-bold leading-tight",
        highlight ? "text-white" : green ? "text-emerald-500" : "text-[#0F2152]"
      )}>{value}</p>
    </div>
  )
}

function PayCard({ active, onClick, icon: Icon, label, sub }: any) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "p-4 rounded-xl border-2 flex flex-col items-center gap-2 cursor-pointer transition-all active:scale-[0.97] text-center",
        active
          ? "bg-gradient-to-br from-[#0F2152] to-[#1E4DB7] border-transparent text-white shadow-lg shadow-blue-900/20"
          : "bg-[#F5F8FF] border-slate-100 text-slate-400 hover:border-blue-200"
      )}
    >
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", active ? "bg-white/20" : "bg-white border border-slate-100")}>
        <Icon size={16} className={active ? "text-white" : "text-[#0F2152]"} />
      </div>
      <div>
        <p className={cn("text-xs font-bold", active ? "text-white" : "text-[#0F2152]")}>{label}</p>
        <p className={cn("text-[9px] font-medium mt-0.5", active ? "text-white/60" : "text-slate-400")}>{sub}</p>
      </div>
      {active && <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center"><Check size={9} className="text-[#0F2152]" /></div>}
    </div>
  )
}

/** Simple circular progress ring (SVG) */
function ProgressRing({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? value / max : 0
  const r = 20
  const circ = 2 * Math.PI * r
  const dash = pct * circ

  return (
    <svg width="56" height="56" viewBox="0 0 56 56">
      <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5" />
      <circle
        cx="28" cy="28" r={r}
        fill="none"
        stroke="rgba(255,255,255,0.8)"
        strokeWidth="5"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 28 28)"
        style={{ transition: "stroke-dasharray 0.5s ease" }}
      />
      <text x="28" y="33" textAnchor="middle" fontSize="11" fontWeight="800" fill="white">
        {value}/{max}
      </text>
    </svg>
  )
}