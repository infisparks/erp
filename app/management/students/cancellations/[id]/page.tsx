"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Download,
  User,
  CreditCard,
  BookOpen,
  ArrowLeft,
  ArrowRight,
  Loader2,
  ChevronRight,
  AlertCircle
} from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import Link from "next/link"

// --- UI Components ---
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function CancellationDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [request, setRequest] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)

  const [approvalData, setApprovalData] = useState({
    status: "",
    remarks: "",
    verifications: {
      fees_cleared: false,
      library_cleared: false,
      id_card_returned: false,
      original_docs_verified: false
    }
  })

  useEffect(() => {
    fetchDetail()
  }, [id])

  const fetchDetail = async () => {
    setLoading(true)
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('cancellation_requests')
      .select(`
        *,
        student:students (
          id,
          fullname,
          registration_no,
          photo_path,
          email
        )
      `)
      .eq('id', id)
      .single()

    if (data) {
      setRequest(data)
      setApprovalData(prev => ({
        ...prev,
        status: data.status || "pending",
        remarks: data.account_remarks || ""
      }))
    }
    setLoading(false)
  }

  const handleApproveReject = async () => {
    if (!request) return
    setSubmitting(true)
    const supabase = getSupabaseClient()
    
    const updatePayload: any = {
      status: approvalData.status,
      account_approval_status: approvalData.status,
      account_approval_date: new Date().toISOString(),
      account_remarks: approvalData.remarks
    }

    const { error } = await supabase
      .from('cancellation_requests')
      .update(updatePayload)
      .eq('id', id)

    if (!error) {
       // Also update the overall student status if needed in future
       router.push('/management/students/cancellations')
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F6F8] flex flex-col items-center justify-center font-poppins">
         <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4 opacity-50" />
         <p className="text-[12px] font-bold uppercase tracking-widest text-slate-400">Loading details...</p>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-[#F5F6F8] flex flex-col items-center justify-center font-poppins">
         <AlertCircle className="h-10 w-10 text-rose-500 mb-4" />
         <p className="text-xl font-bold text-slate-900">Request Record Not Found</p>
         <Button variant="outline" className="mt-4 rounded-xl px-8" onClick={() => router.push('/management/students/cancellations')}>
            Return to Ledger
         </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F6F8] font-poppins pb-32">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        .font-poppins { font-family: 'Poppins', sans-serif !important; }
      `}</style>

      {/* --- Breadcrumb --- */}
      <div className="max-w-6xl mx-auto p-10 pb-6 flex items-center justify-between">
         <button 
           onClick={() => router.back()}
           className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
         >
            <ArrowLeft size={16} />
            Back to Cancellation Ledger
         </button>
      </div>

      {/* --- Main Content --- */}
      <div className="max-w-6xl mx-auto px-10">
        
        {/* --- Header Card (Professional Design) --- */}
        <div className="bg-indigo-600 rounded-[32px] p-10 text-white relative overflow-hidden mb-10 shadow-xl shadow-indigo-100">
           <div className="relative z-10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                 <div className="flex items-center gap-8 text-center md:text-left">
                    <div className="h-24 w-24 bg-white/20 backdrop-blur-md rounded-[24px] flex items-center justify-center shrink-0 border border-white/30 shadow-2xl">
                       <img src={request.student.photo_path} alt="" className="h-full w-full object-cover rounded-[24px] opacity-40 mix-blend-overlay" />
                       <FileText size={40} className="absolute text-white" />
                    </div>
                    <div>
                       <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60 mb-1">Official Withdrawal Review</p>
                       <h1 className="text-4xl font-bold tracking-tight text-white mb-2">{request.student.fullname}</h1>
                       <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start">
                          <Badge className="bg-white/10 text-white border-white/20 px-3 py-1 rounded-lg">Batch: {request.cancel_year}</Badge>
                          <Badge className="bg-white/10 text-white border-white/20 px-3 py-1 rounded-lg">ID: {request.student.registration_no}</Badge>
                       </div>
                    </div>
                 </div>
                 <div className="bg-white/10 backdrop-blur-md rounded-[24px] p-6 border border-white/20 text-center min-w-[200px]">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2">Request Status</p>
                    <Badge className={cn(
                      "text-[12px] font-bold uppercase px-6 py-2 rounded-xl",
                      request.status === 'approved' ? "bg-emerald-500 text-white" : 
                      request.status === 'rejected' ? "bg-rose-500 text-white" : "bg-amber-500 text-white"
                    )}>
                       {request.status}
                    </Badge>
                 </div>
              </div>
           </div>
        </div>

        {/* --- Quick Links Bar --- */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12">
            <QuickActionLink 
               href={`/management/students/form/detail?student_id=${request.student.id}&mode=view`} 
               label="Registration Details" 
               icon={User} 
            />
            <QuickActionLink 
               href={`/management/students/fees/detail?student_id=${request.student.id}`} 
               label="Financial Audit" 
               icon={CreditCard} 
            />
            <QuickActionLink 
               href={`/management/students/status?student_id=${request.student.id}`} 
               label="Academic Records" 
               icon={BookOpen} 
            />
        </div>

        {/* --- Evaluation Section --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
           {/* Decision Terminal */}
           <div className="lg:col-span-7 space-y-10">
              <section className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                 <h3 className="text-[12px] font-bold text-[#111827] uppercase tracking-widest border-b border-slate-100 pb-5 mb-6">Verification Protocol</h3>
                 <div className="grid gap-4">
                    {Object.entries({
                      fees_cleared: "Dues & Fee Clearance Verified",
                      library_cleared: "Library Books & Assets Returned",
                      id_card_returned: "Internal ID Cards & Passes Recovered",
                      original_docs_verified: "Original Certificates & Docs Released"
                    }).map(([key, label]) => (
                      <div key={key} className="flex items-center gap-5 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-indigo-200 transition-all cursor-pointer group">
                         <Checkbox 
                           id={key} 
                           checked={(approvalData.verifications as any)[key]} 
                           onCheckedChange={(checked) => setApprovalData(prev => ({
                             ...prev,
                             verifications: { ...prev.verifications, [key]: checked }
                           }))}
                           className="h-6 w-6 rounded-lg"
                         />
                         <Label htmlFor={key} className="text-[14px] font-semibold text-slate-700 cursor-pointer flex-1 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{label}</Label>
                      </div>
                    ))}
                 </div>
              </section>

              <section className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                 <h3 className="text-[12px] font-bold text-[#111827] uppercase tracking-widest border-b border-slate-100 pb-5 mb-8">Process Decision</h3>
                 <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                       <ActionToggle 
                         type="approve" 
                         active={approvalData.status === 'approved'} 
                         onClick={() => setApprovalData({ ...approvalData, status: 'approved' })} 
                       />
                       <ActionToggle 
                         type="reject" 
                         active={approvalData.status === 'rejected'} 
                         onClick={() => setApprovalData({ ...approvalData, status: 'rejected' })} 
                       />
                    </div>
                    <div className="space-y-3">
                       <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Administrative Remarks</Label>
                       <Textarea 
                         placeholder="Enter closure notes or rejection justification..." 
                         className="rounded-2xl border-slate-200 bg-slate-50 focus:bg-white min-h-[150px] p-6 text-[14px] font-medium"
                         value={approvalData.remarks}
                         onChange={(e) => setApprovalData({ ...approvalData, remarks: e.target.value })}
                       />
                    </div>
                 </div>
              </section>
           </div>

           {/* Evidence & Justification */}
           <div className="lg:col-span-5 space-y-10">
              <section className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                 <h3 className="text-[12px] font-bold text-[#111827] uppercase tracking-widest border-b border-slate-100 pb-5 mb-6 flex items-center gap-2">
                    <AlertCircle size={16} className="text-amber-500" />
                    Student's Justification
                 </h3>
                 <div className="p-6 bg-slate-50 rounded-[24px] border border-slate-100 text-[13px] text-slate-600 leading-relaxed font-medium italic">
                    "{request.details || 'No additional remarks provided by the student.'}"
                 </div>
              </section>

              <section className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                 <h3 className="text-[12px] font-bold text-[#111827] uppercase tracking-widest border-b border-slate-100 pb-5 mb-6">Submitted Proofs</h3>
                 <div className="grid gap-4">
                    {request.documents?.map((doc: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-[20px] shadow-sm hover:shadow-md transition-all group border-l-4 border-l-indigo-600">
                         <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                               <Download size={20} />
                            </div>
                            <div className="flex flex-col">
                               <span className="text-[12px] font-bold text-[#111827] truncate max-w-[150px]">{doc.name}</span>
                               <span className="text-[10px] text-slate-400 font-bold uppercase">Click to download</span>
                            </div>
                         </div>
                         <Button variant="ghost" size="icon" asChild className="h-10 w-10 rounded-xl hover:bg-slate-50">
                            <Link href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/student_documents/${doc.path}`} target="_blank">
                               <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-600 transition-all font-bold" />
                            </Link>
                         </Button>
                      </div>
                    ))}
                 </div>
              </section>
           </div>
        </div>
      </div>

      {/* --- Action Bar --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-8 z-50 shadow-2xl">
         <div className="max-w-6xl mx-auto flex justify-end items-center gap-6">
            <div className="flex items-center gap-3 text-slate-400 mr-auto">
               <Clock size={20} />
               <span className="text-[11px] font-bold uppercase tracking-widest">Awaiting Verification Result</span>
            </div>
            <Button variant="ghost" onClick={() => router.back()} className="h-14 px-10 rounded-xl font-bold text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all">
               Close Page
            </Button>
            <Button 
              onClick={handleApproveReject}
              disabled={!approvalData.status || submitting}
              className="h-14 px-16 rounded-2xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all flex items-center gap-4 active:scale-95 disabled:grayscale"
            >
               {submitting ? <Loader2 className="animate-spin" size={18} /> : <span>Finalise Outcome <ArrowRight size={18} className="ml-2 inline" /></span>}
            </Button>
         </div>
      </div>
    </div>
  )
}

function QuickActionLink({ href, label, icon: Icon }: { href: string, label: string, icon: any }) {
  return (
    <Link 
      href={href} 
      target="_blank" 
      className="flex items-center gap-5 p-5 bg-white border border-slate-200 rounded-[28px] hover:border-indigo-300 hover:shadow-md transition-all group"
    >
       <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 transition-transform group-hover:scale-110">
          <Icon size={24} />
       </div>
       <div className="flex flex-col">
          <span className="text-[13px] font-bold text-slate-900 leading-none mb-1.5">{label}</span>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Open Portal</span>
       </div>
       <ChevronRight size={16} className="ml-auto text-slate-300 group-hover:text-indigo-600 transition-all" />
    </Link>
  )
}

function ActionToggle({ type, active, onClick }: { type: 'approve' | 'reject', active: boolean, onClick: () => void }) {
  const isApprove = type === 'approve'
  return (
    <button 
      onClick={onClick}
      className={cn(
        "h-20 rounded-[24px] border-2 flex items-center justify-center gap-5 transition-all",
        active 
          ? (isApprove ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "bg-rose-50 border-rose-500 text-rose-700")
          : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
      )}
    >
       {isApprove ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
       <span className="text-[14px] font-bold uppercase tracking-widest">
          {isApprove ? "Approve" : "Reject"}
       </span>
    </button>
  )
}
