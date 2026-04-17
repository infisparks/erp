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

  /* --- Helper function to convert number to words (Indian Rupee format) --- */
  const toWords = (num: number): string => {
    const a = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
    ];
    const b = [
      '', '', 'Twenty', 'Thirty', 'Forty', 'Fivey', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
    ];

    const inWords = (n: number): string => {
      let str = '';
      if (n === 0) return '';
      if (n < 20) {
        str = a[n];
      } else {
        const digit = n % 10; 
        const tens = Math.floor(n / 10);
        str = b[tens] + (digit ? ' ' + a[digit] : '');
      }
      return str;
    };

    const numStr = num.toFixed(2);
    const [rupees, paise] = numStr.split('.').map(Number);

    let rupeesWords = '';
    if (rupees === 0) {
      rupeesWords = 'Zero';
    } else {
      const crores = Math.floor(rupees / 10000000);
      const lakhs = Math.floor((rupees % 10000000) / 100000);
      const thousands = Math.floor((rupees % 100000) / 1000);
      const hundreds = Math.floor((rupees % 1000) / 1000);
      const rest = rupees % 100;

      if (crores) rupeesWords += inWords(crores) + ' Crore ';
      if (lakhs) rupeesWords += inWords(lakhs) + ' Lakh ';
      if (thousands) rupeesWords += inWords(thousands) + ' Thousand ';
      if (hundreds) rupeesWords += inWords(hundreds) + ' Hundred ';
      if (rest) rupeesWords += inWords(rest);
    }

    return rupeesWords.trim() + ' Rupees Only';
  };

  if (receipt) return (
    <div className="min-h-screen bg-[#F8FAFC]" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <div className="max-w-2xl mx-auto min-h-screen flex flex-col pb-10">
        <div className="bg-white/90 backdrop-blur-md sticky top-0 z-50 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <button onClick={() => setReceipt(null)} className="w-8 h-8 rounded-xl border border-gray-100 flex items-center justify-center hover:bg-slate-50 transition-colors"><ArrowLeft size={16} /></button>
          <div className="flex flex-col items-center">
             <h1 className="text-[#1A3A6B] font-bold text-sm tracking-tight leading-none">Fee Receipt</h1>
             <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">#{receipt.receipt_no}</p>
          </div>
          <button onClick={() => window.print()} className="w-8 h-8 rounded-xl border border-indigo-100 bg-indigo-50 flex items-center justify-center text-indigo-600"><Download size={15} /></button>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {/* Institutional Branding */}
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-3xl -mr-16 -mt-16" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-indigo-900/20">
                 <Landmark className="text-white" size={24} />
              </div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-1">ANJUMAN-I-ISLAM'S</h1>
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest leading-loose">AIKTC School of Engineering</h2>
              <p className="text-[10px] text-slate-400 font-medium max-w-[200px] mt-2">Plot No. 2&3, Sec-16, New Panvel, Khandagaon, New</p>
            </div>
          </div>

          {/* Student Info Grid */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
             <div className="p-6 bg-slate-50/50 flex items-center justify-between">
                <div>
                   <p className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-1">Receipt Details</p>
                   <p className="text-xs font-bold text-slate-400">{new Date(receipt.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>
                <div className="text-right">
                   <p className="text-xs font-black text-slate-800 uppercase tracking-tighter">Verified Official</p>
                </div>
             </div>

             <div className="p-6 space-y-4">
                <DottedRow label="Full Name" value={student.fullname} />
                <DottedRow label="Academic ID" value={student.roll_number || student.registration_no || "N/A"} />
                <DottedRow label="Course / Branch" value={student.courses?.name || "N/A"} />
                <DottedRow label="Academic term" value={academicYears.find(y => y.id === receipt.student_academic_year_id)?.academic_year_name || "N/A"} />
                <DottedRow label="Payment Mode" value={receipt.payment_method || "Digital Transfer"} />
             </div>

             <div className="p-6 space-y-6">
                <div className="space-y-2">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Description</p>
                   <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-700">{receipt.fees_type}</span>
                      <span className="text-lg font-black text-slate-800">₹{Number(receipt.amount).toLocaleString('en-IN')}</span>
                   </div>
                </div>

                <div className="p-5 bg-indigo-600 rounded-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
                   <div className="relative z-10">
                      <p className="text-indigo-100/50 text-[10px] font-bold uppercase tracking-[0.2em] mb-3">Amount In Words</p>
                      <p className="text-white text-xs font-bold leading-relaxed">{toWords(Number(receipt.amount))}</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-8 pt-4 border-t border-slate-100">
                   <div>
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Verified Signature</p>
                      <div className="h-10 w-32 border-b border-slate-200 mt-4" />
                   </div>
                   <div className="text-right flex flex-col items-end">
                      <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-1">
                         <ShieldCheck className="text-emerald-500" size={24} />
                      </div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">E-Receipt ID: {receipt.id.slice(0, 8)}</p>
                   </div>
                </div>
             </div>
          </div>

          <div className="flex gap-4">
            <button className="flex-1 h-12 rounded-2xl bg-white border border-slate-200 text-slate-500 font-bold text-xs hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
               <Share2 size={14} /> Share
            </button>
            <button onClick={() => window.print()} className="flex-1 h-12 rounded-2xl bg-[#0F2557] text-white font-bold text-xs shadow-xl shadow-blue-900/20 hover:bg-[#1E4FA0] transition-all flex items-center justify-center gap-2">
               <Download size={14} /> Download PDF
            </button>
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
