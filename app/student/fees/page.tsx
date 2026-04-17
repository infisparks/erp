"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, RefreshCw, CreditCard, Download, ChevronRight,
  Loader2, AlertCircle, CheckCircle2, Clock,
  GraduationCap, Receipt, Banknote, ShieldCheck,
  Zap, ArrowRight, Wallet, Landmark, FileText, Share2
} from "lucide-react"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"

/* ─── Static Constants ───────────────────────────────── */

function StatChip({ icon: Icon, label, value, color, bg }: { icon: any; label: string; value: string; color: string; bg: string }) {
  return (
    <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm flex flex-col gap-1.5 flex-1 max-w-[120px]">
      <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ backgroundColor: bg }}>
        <Icon size={13} style={{ color }} />
      </div>
      <div>
        <p className="text-[#1A3A6B] font-extrabold text-[12px] tracking-tight truncate">{value}</p>
        <p className="text-gray-400 text-[8px] font-medium tracking-wider uppercase">{label}</p>
      </div>
    </div>
  )
}

export default function FeesPage() {
  const [loading, setLoading]       = useState(true)
  const [student, setStudent]       = useState<any>(null)
  const [academicYears, setAcademicYears] = useState<any[]>([])
  const [payments, setPayments]     = useState<any[]>([])
  const [selectedYearIndex, setSelectedYearIndex] = useState(0)
  const [receipt, setReceipt]       = useState<any>(null)
  const [error, setError]           = useState<string | null>(null)
  const [isPaySheetOpen, setIsPaySheetOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    ;(async () => {
      try {
        const supabase = getSupabaseClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { router.push("/student/login"); return }

        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('*, courses(name), year_category(name)')
          .eq('user_id', session.user.id)
          .maybeSingle()

        if (studentError) throw studentError
        if (!studentData) { router.push("/student/admission"); return }
        setStudent(studentData)

        const { data: yearsData, error: yearsError } = await supabase
          .from('student_academic_years')
          .select('*, year_category(name), courses(name)')
          .eq('student_id', studentData.id)
          .order('created_at', { ascending: false })

        if (yearsError) throw yearsError
        setAcademicYears(yearsData || [])

        const { data: paymentsData, error: paymentsError } = await supabase
          .from('student_payments')
          .select('*')
          .eq('student_id', studentData.id)
          .order('created_at', { ascending: false })

        if (paymentsError) throw paymentsError
        setPayments(paymentsData || [])

      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [router])

  const activeYearData = useMemo(() => {
    if (!academicYears[selectedYearIndex]) return null
    const year = academicYears[selectedYearIndex]
    const yearPayments = payments.filter(p => p.student_academic_year_id === year.id)
    const totalPayable = Number(year.net_payable_fee || 0)
    const paid = yearPayments.reduce((s, p) => s + Number(p.amount || 0), 0)
    const balance = Math.max(0, totalPayable - paid)
    const progress = totalPayable > 0 ? (paid / totalPayable) * 100 : 0
    return { year, payments: yearPayments, totalPayable, paid, balance, progress: Math.min(100, Math.round(progress)) }
  }, [academicYears, payments, selectedYearIndex])

  if (loading) return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col items-center justify-center gap-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <Loader2 className="animate-spin text-[#1A3A6B]" size={24} />
      <p className="text-[#1A3A6B]/40 text-[10px] font-medium tracking-widest uppercase">Syncing...</p>
    </div>
  )

  if (error || academicYears.length === 0) return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col items-center justify-center gap-5 p-10 text-center" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <AlertCircle className="text-amber-500" size={32} />
      <h2 className="text-[#1A3A6B] font-bold text-lg leading-tight">{error ? "Sync Failed" : "No Fee Records"}</h2>
      <p className="text-gray-400 text-xs font-light max-w-xs">{error || "We couldn't find any financial records."}</p>
      <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-[#1A3A6B] text-white text-[11px] rounded-xl font-bold shadow-lg">Retry</button>
    </div>
  )

  const { totalPayable, paid, balance, progress, year, payments: yearPayments } = activeYearData!

  if (receipt) return (
    <div className="min-h-screen bg-[#F8FAFC]" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <div className="max-w-xl mx-auto min-h-screen flex flex-col">
        <div className="bg-white/90 backdrop-blur-md sticky top-0 z-50 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <button onClick={() => setReceipt(null)} className="w-8 h-8 rounded-xl border border-gray-100 flex items-center justify-center"><ArrowLeft size={16} /></button>
          <h1 className="text-[#1A3A6B] font-bold text-sm tracking-tight">Receipt</h1>
          <button className="w-8 h-8 rounded-xl border border-gray-100 flex items-center justify-center"><Download size={15} /></button>
        </div>
        <div className="p-4">
          <div className="bg-[#0F2557] rounded-2xl p-6 text-center mb-5 relative overflow-hidden shadow-lg">
            <Landmark size={120} className="absolute top-0 right-0 opacity-5 pointer-events-none" />
            <h2 className="text-white font-black text-xl tracking-tight uppercase">AIKTC</h2>
            <p className="text-white/60 text-[11px] font-medium mt-1">School of Engineering</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6 mb-5">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-gray-400 text-[9px] font-bold uppercase tracking-widest">No.</p>
                <p className="text-[#1A3A6B] font-black text-lg leading-none mt-1">#{receipt.receipt_no}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-[9px] font-bold uppercase tracking-widest">Date</p>
                <p className="text-[#1A3A6B] font-bold text-xs mt-1">{new Date(receipt.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="space-y-3 border-t border-dashed border-gray-100 pt-5 mb-6">
              <DottedRow label="Student" value={student.fullname} />
              <DottedRow label="AUID" value={studentId} />
              <DottedRow label="Type" value={receipt.fees_type} />
            </div>
            <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between border border-gray-100">
               <span className="text-[#1A3A6B] font-black text-sm">TOTAL PAID</span>
               <span className="text-[#1A3A6B] font-black text-xl tracking-tight">₹{Number(receipt.amount).toLocaleString()}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="flex-1 h-11 bg-white border border-[#1A3A6B] text-[#1A3A6B] rounded-xl text-xs font-bold">Share</button>
            <button className="flex-1 h-11 bg-[#1A3A6B] text-white rounded-xl text-xs font-bold shadow-md">Print PDF</button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F1F5F9]" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <div className="bg-[#0F2557] px-4 pt-10 pb-6 relative overflow-hidden">
        <Landmark size={120} className="absolute -top-10 -right-10 opacity-5 pointer-events-none text-white" />
        <div className="max-w-2xl mx-auto relative z-10 text-center md:text-left">
          <h1 className="text-white font-extrabold text-xl tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Fees & Payments</h1>
          <p className="text-white/40 text-[10px] font-medium uppercase tracking-[0.1em] mt-1 truncate">{student.fullname}</p>
          <div className="flex gap-2 mt-5 overflow-x-auto pb-1 no-scrollbar justify-center md:justify-start">
            {academicYears.map((y, idx) => (
              <button key={y.id} onClick={() => setSelectedYearIndex(idx)}
                className={`px-4 py-1.5 rounded-xl text-[10px] font-bold transition-all ${selectedYearIndex === idx ? "bg-white text-[#0F2557]" : "bg-white/5 text-white/30 border border-white/10"}`}>
                {y.academic_year_name || y.year_category?.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-3 pb-28">
        {/* TOTAL PAYABLE CARD — Compact version */}
        <div className="bg-gradient-to-br from-[#0F2557] to-[#1E4FA0] rounded-3xl p-6 mb-4 border border-white/5 shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white/40 text-[8px] font-black uppercase tracking-[0.2em]">Total Payable</p>
              <div className={`px-2.5 py-1 rounded-full border text-[8px] font-black tracking-widest uppercase ${balance <= 0 ? "bg-green-400/20 border-green-400/30 text-green-300" : "bg-amber-400/20 border-amber-400/30 text-amber-300"}`}>
                {balance <= 0 ? "Settled" : "Partial"}
              </div>
            </div>
            <div className="flex items-baseline gap-1 mb-6">
              <p className="text-white font-black text-3xl tracking-tighter" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>₹{totalPayable.toLocaleString("en-IN")}</p>
              <p className="text-white/30 text-sm font-bold">.00</p>
            </div>
            <div className="h-1 bg-white/10 rounded-full mb-6 overflow-hidden">
               <div className={`h-full rounded-full transition-all duration-1000 ${progress >= 100 ? "bg-green-400" : "bg-amber-400"}`} style={{ width: `${progress}%` }} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <FinanceInfo label="Paid" value={`₹${paid.toLocaleString()}`} color="text-green-300" />
              <FinanceInfo label="Balance" value={`₹${balance.toLocaleString()}`} color={balance > 0 ? "text-amber-300" : "text-white/30"} />
              <FinanceInfo label="Progress" value={`${progress}%`} color="text-white" />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mb-5">
          <StatChip icon={CreditCard} label="Installments" value={`${yearPayments.length} Paid`} color="#6366F1" bg="#EEF2FF" />
          <StatChip icon={Wallet}     label="Cleared"      value={`₹${paid.toLocaleString()}`} color="#059669" bg="#ECFDF5" />
          <StatChip icon={Clock}      label="Pending"      value={`₹${balance.toLocaleString()}`} color="#DC2626" bg="#FEF2F2" />
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-6">
          <h2 className="text-[#1A3A6B] font-bold text-[12px] mb-4">Fee Split</h2>
          <div className="space-y-3">
             <BreakdownRow label="Standard Course Fee" value={year.total_fee || totalPayable} color="#6366F1" />
             {year.scholarship_amount > 0 && <BreakdownRow label="Scholarship Waiver" value={-year.scholarship_amount} color="#059669" />}
             <div className="pt-3 border-t border-gray-50 flex justify-between items-center">
                <span className="text-[#1A3A6B] font-bold text-xs">Net Amount</span>
                <span className="text-[#1A3A6B] font-black text-sm">₹{totalPayable.toLocaleString()}</span>
             </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-[#1A3A6B] font-black text-xs tracking-tight uppercase">Recent Payments</h2>
          <span className="text-[9px] font-bold text-gray-300 tracking-wider">({yearPayments.length} ITEMS)</span>
        </div>

        <div className="space-y-2">
          {yearPayments.map((pay) => (
            <button key={pay.id} onClick={() => setReceipt(pay)}
              className="w-full bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3 hover:shadow-md transition-all active:scale-[0.99] text-left">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                <Receipt size={18} className="text-green-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#1A3A6B] font-extrabold text-[12px] truncate uppercase">{pay.fees_type}</p>
                <p className="text-gray-400 text-[9px] font-bold mt-0.5">{new Date(pay.created_at).toLocaleDateString()}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-green-600 font-extrabold text-[12px]">₹{Number(pay.amount).toLocaleString()}</p>
                <p className="text-gray-200 text-[8px] font-bold">#{pay.receipt_no}</p>
              </div>
              <ChevronRight size={14} className="text-gray-200" />
            </button>
          ))}
        </div>
      </div>

      {balance > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-xs px-6 z-40">
          <button onClick={() => setIsPaySheetOpen(true)} className="w-full h-12 bg-[#0F2557] text-white rounded-2xl shadow-xl flex items-center justify-center gap-2 text-xs font-black tracking-tight active:scale-95 transition-transform">
            Pay Balance: ₹{balance.toLocaleString()}
          </button>
        </div>
      )}

      {isPaySheetOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsPaySheetOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-t-[2rem] p-6 animate-in slide-in-from-bottom duration-300">
            <div className="w-10 h-1 bg-gray-100 rounded-full mx-auto mb-6" />
            <h3 className="text-[#1A3A6B] font-black text-lg text-center mb-8">Payment Methods</h3>
            <div className="space-y-2.5">
              <PayMethod title="Razorpay Instant" sub="UPI · Banking · Cards" onClick={() => setIsPaySheetOpen(false)} />
              <PayMethod title="Direct Debit" sub="Visa · Mastercard" onClick={() => setIsPaySheetOpen(false)} />
            </div>
            <div className="mt-8 text-center text-[9px] text-gray-300 font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 ">
              <ShieldCheck size={12} className="text-green-500" /> Safe & Secure Payment
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FinanceInfo({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <p className={`font-black text-[12px] tracking-tight ${color}`}>{value}</p>
      <p className="text-white/40 text-[8px] font-bold uppercase mt-0.5">{label}</p>
    </div>
  )
}

function DottedRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-gray-400 text-[11px] font-medium">{label}</span>
      <div className="flex-1 border-b border-dotted border-gray-100 mx-3" />
      <span className="text-[#1A3A6B] text-[11px] font-bold text-right truncate max-w-[140px]">{value}</span>
    </div>
  )
}

function BreakdownRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-gray-500 font-medium">{label}</span>
      <span className={`font-bold ${value < 0 ? "text-green-500" : "text-[#1A3A6B]"}`}>{value < 0 ? "-" : ""}₹{Math.abs(value).toLocaleString()}</span>
    </div>
  )
}

function PayMethod({ title, sub, onClick }: { title: string; sub: string; onClick: any }) {
  return (
    <button onClick={onClick} className="w-full p-4 bg-gray-50 rounded-2xl flex items-center justify-between border border-transparent active:border-[#1A3A6B] transition-all">
      <div className="text-left">
        <p className="text-[#1A3A6B] font-black text-xs">{title}</p>
        <p className="text-gray-400 text-[9px] font-medium mt-0.5">{sub}</p>
      </div>
      <ChevronRight size={14} className="text-gray-200" />
    </button>
  )
}
