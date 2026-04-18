"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  ChevronLeft, 
  Upload, 
  CheckCircle2, 
  Loader2,
  AlertCircle,
  FileText,
  Trash2,
  Info,
  Clock,
  Plus
} from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { getStudentProfile } from "@/lib/erp-logic"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

// --- UI Components ---
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"

export default function CancellationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [student, setStudent] = useState<any>(null)
  const [prevRequests, setPrevRequests] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    cancel_year: "",
    reason: "",
    other_reason: "",
    details: "",
  })

  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    fee_receipt: null,
    id_card: null,
    allotment_letter: null,
    application_letter: null,
  })

  useEffect(() => {
    ;(async () => {
      try {
        const supabase = getSupabaseClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { router.push("/student/login"); return }
        const data = await getStudentProfile(supabase, session.user.id)
        if (!data) { router.push("/student/dashboard"); return }
        setStudent(data)

        // Fetch Previous Requests
        const { data: history } = await supabase
          .from('cancellation_requests')
          .select('*')
          .eq('student_id', data.id)
          .order('created_at', { ascending: false })
        
        if (history) setPrevRequests(history)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [router])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    if (e.target.files && e.target.files[0]) {
      setFiles(prev => ({ ...prev, [key]: e.target.files![0] }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.cancel_year || !formData.reason) {
      setError("Please fill all required fields.")
      return
    }

    const missingDocs = Object.entries(files).filter(([_, f]) => !f)
    if (missingDocs.length > 0) {
      setError("Please upload all mandatory documents.")
      return
    }

    setError(null)
    setSubmitting(true)
    const supabase = getSupabaseClient()

    try {
      // 1. Upload Documents
      const uploadedDocs = []
      for (const [key, file] of Object.entries(files)) {
        if (file) {
          const fileName = `${student.id}/cancellation/${key}_${Date.now()}.${file.name.split('.').pop()}`
          const { data, error: uploadError } = await supabase.storage
            .from('student_documents')
            .upload(fileName, file)
          
          if (uploadError) throw uploadError
          uploadedDocs.push({ name: key.replace('_', ' ').toUpperCase().replace('LETTER', 'Letter').replace('RECEIPT', 'Receipt').replace('CARD', 'Card'), path: data.path })
        }
      }

      // 2. Insert Request
      const finalReason = formData.reason === "Other" ? `Other: ${formData.other_reason}` : formData.reason

      const { error: insertError } = await supabase
        .from('cancellation_requests')
        .insert({
          student_id: student.id,
          cancel_year: formData.cancel_year,
          reason: finalReason,
          details: formData.details,
          documents: uploadedDocs,
        })

      if (insertError) throw insertError
      setSuccess(true)
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Failed to submit request")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F6F8]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">Initialising Secure Protocol</p>
      </div>
    </div>
  )

  if (success) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F6F8] p-6 text-center">
      <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-6">
        <CheckCircle2 size={40} />
      </div>
      <h1 className="text-2xl font-bold text-[#111827]">Request Submitted</h1>
      <p className="text-[#6B7280] mt-2 max-w-sm">
        Your admission cancellation request has been successfully logged. 
        You can track the approval status on your dashboard.
      </p>
      <Button 
        onClick={() => router.push("/student/dashboard")} 
        className="mt-8 bg-indigo-600 hover:bg-indigo-700 text-white px-8 rounded-xl h-12"
      >
        Return to Dashboard
      </Button>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F5F6F8] pb-12">
      {/* --- Top Navigation --- */}
      <div className="max-w-4xl mx-auto px-6 py-6 flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()}
          className="rounded-xl bg-white border border-slate-200 shadow-sm hover:bg-slate-50"
        >
          <ChevronLeft size={20} className="text-slate-600" />
        </Button>
        <h1 className="text-2xl font-bold text-[#111827]">Admission Cancellation</h1>
      </div>

      <div className="max-w-4xl mx-auto px-6">
        {!showForm ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* --- Status Overview Card --- */}
            {prevRequests.length > 0 && (
              <div className="grid grid-cols-1 gap-4">
                {prevRequests.map((req) => (
                  <Card key={req.id} className="rounded-2xl border-slate-100 shadow-sm overflow-hidden bg-white">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0",
                            req.status === 'approved' ? "bg-emerald-50 text-emerald-600" : 
                            req.status === 'rejected' ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                          )}>
                             <Clock size={24} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                               <h3 className="font-bold text-[#111827]">Withdrawal Request</h3>
                               <Badge className={cn(
                                 "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border-none shadow-sm",
                                 req.status === 'approved' ? "bg-emerald-500 text-white" : 
                                 req.status === 'rejected' ? "bg-rose-500 text-white" : "bg-amber-500 text-white"
                               )}>
                                 {req.status}
                               </Badge>
                            </div>
                            <p className="text-xs text-slate-400 mt-1 uppercase tracking-tight font-medium">
                               Submitted on {new Date(req.created_at).toLocaleDateString()} • Year: {req.cancel_year}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 w-full md:w-auto mt-2 md:mt-0">
                          <div className="flex flex-col items-end gap-1 px-4 border-r border-slate-100">
                             <p className="text-[9px] font-bold uppercase text-slate-400 tracking-widest">Account</p>
                             <p className={cn("text-[10px] font-bold", req.account_approval_status === 'approved' ? "text-emerald-600" : "text-amber-600")}>{req.account_approval_status.toUpperCase()}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 px-4 border-r border-slate-100">
                             <p className="text-[9px] font-bold uppercase text-slate-400 tracking-widest">H.O.D.</p>
                             <p className={cn("text-[10px] font-bold", req.hod_approval_status === 'approved' ? "text-emerald-600" : "text-amber-600")}>{req.hod_approval_status.toUpperCase()}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 px-4">
                             <p className="text-[9px] font-bold uppercase text-slate-400 tracking-widest">Exam Cell</p>
                             <p className={cn("text-[10px] font-bold", req.exam_cell_approval_status === 'approved' ? "text-emerald-600" : "text-amber-600")}>{req.exam_cell_approval_status.toUpperCase()}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* --- Start New Request Card --- */}
            <Card className="rounded-[32px] border-dashed border-2 border-slate-200 bg-white/50 overflow-hidden hover:border-indigo-300 transition-all group cursor-pointer" onClick={() => setShowForm(true)}>
               <CardContent className="p-12 flex flex-col items-center text-center gap-6">
                  <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-xl shadow-indigo-100 group-hover:scale-110 transition-transform">
                     <Plus size={32} />
                  </div>
                  <div>
                     <h2 className="text-xl font-bold text-[#111827]">New Withdrawal Request</h2>
                     <p className="text-sm text-slate-500 mt-2 max-w-xs">Start a formal application for admission cancellation and document release.</p>
                  </div>
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 px-8 font-semibold shadow-lg shadow-indigo-200">
                     Begin Application
                  </Button>
               </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="rounded-[20px] border-[#E5E7EB] shadow-sm bg-white overflow-hidden animate-in fade-in zoom-in-95 duration-500">
            <CardContent className="p-0">
              {/* --- Form Header --- */}
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-[#111827]">Withdrawal Application</h2>
                  <p className="text-xs text-[#6B7280] mt-0.5">Fill out all details to start the cancellation process.</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="text-indigo-600 font-bold text-[10px] tracking-widest uppercase hover:bg-indigo-50">
                   View History
                </Button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="p-8 space-y-8">
                  
                  {/* ... rest of the form ... */}
                  {/* Copying the existing form sections here */}
                  <div className="space-y-4">
                    <h3 className="text-[13px] font-bold uppercase tracking-wider text-indigo-600/80">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <Label className="text-[13px] text-[#111827] font-medium">Full Name</Label>
                         <Input value={student?.fullname} disabled className="bg-slate-50 border-slate-100 text-[#6B7280] h-11 rounded-lg" />
                      </div>
                      <div className="space-y-2">
                         <Label className="text-[13px] text-[#111827] font-medium">Registration No</Label>
                         <Input value={student?.registration_no} disabled className="bg-slate-50 border-slate-100 text-[#6B7280] h-11 rounded-lg" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-[13px] font-bold uppercase tracking-wider text-indigo-600/80">Withdrawal Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[13px] text-[#111827] font-medium">Cancellation Year <span className="text-red-500">*</span></Label>
                        <Select value={formData.cancel_year} onValueChange={(v) => setFormData({ ...formData, cancel_year: v })}>
                          <SelectTrigger className="h-11 rounded-lg border-[#E5E7EB] bg-white focus:ring-indigo-500">
                            <SelectValue placeholder="Select Year" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FE">First Year (FE)</SelectItem>
                            <SelectItem value="SE">Second Year (SE)</SelectItem>
                            <SelectItem value="TE">Third Year (TE)</SelectItem>
                            <SelectItem value="BE">Final Year (BE)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[13px] text-[#111827] font-medium">Reason for Cancellation <span className="text-red-500">*</span></Label>
                        <Select value={formData.reason} onValueChange={(v) => setFormData({ ...formData, reason: v })}>
                          <SelectTrigger className="h-11 rounded-lg border-[#E5E7EB] bg-white focus:ring-indigo-500">
                            <SelectValue placeholder="Select Reason" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Personal Reasons">Personal Reasons</SelectItem>
                            <SelectItem value="Better Institute Allotment">Better Institute Allotment</SelectItem>
                            <SelectItem value="Financial Constraints">Financial Constraints</SelectItem>
                            <SelectItem value="Health Issues">Health Issues</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {formData.reason === "Other" && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                          <Label className="text-[13px] text-[#111827] font-medium">Please Specify Reason <span className="text-red-500">*</span></Label>
                          <Input 
                            placeholder="Enter your reason..." 
                            className="h-11 rounded-lg border-[#E5E7EB] bg-white focus:ring-indigo-500"
                            value={formData.other_reason}
                            onChange={(e) => setFormData({ ...formData, other_reason: e.target.value })}
                          />
                        </div>
                      )}

                      <div className="md:col-span-2 space-y-2">
                        <Label className="text-[13px] text-[#111827] font-medium">Additional Details</Label>
                        <Textarea 
                          placeholder="Provide any additional context for your request..." 
                          className="rounded-lg border-[#E5E7EB] bg-white min-h-[100px] focus:ring-indigo-500"
                          value={formData.details}
                          onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-[13px] font-bold uppercase tracking-wider text-indigo-600/80">Mandatory Documents</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <DocumentUploader 
                        label="Latest Fee Receipt" 
                        id="fee_receipt" 
                        file={files.fee_receipt} 
                        onChange={(e) => handleFileChange(e, "fee_receipt")} 
                      />
                      <DocumentUploader 
                        label="Student ID Card" 
                        id="id_card" 
                        file={files.id_card} 
                        onChange={(e) => handleFileChange(e, "id_card")} 
                      />
                      <DocumentUploader 
                        label="Allotment Letter" 
                        id="allotment_letter" 
                        file={files.allotment_letter} 
                        onChange={(e) => handleFileChange(e, "allotment_letter")} 
                      />
                      <DocumentUploader 
                        label="Self Application Letter" 
                        id="application_letter" 
                        file={files.application_letter} 
                        onChange={(e) => handleFileChange(e, "application_letter")} 
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-600 text-sm">
                      <AlertCircle size={18} />
                      {error}
                    </div>
                  )}
                </div>

                {/* --- Form Footer --- */}
                <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-[#6B7280]">
                    <Info size={16} />
                    <p className="text-[11px] font-medium">Fill all fields that have asterisk (*)</p>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      className="flex-1 md:flex-none h-12 px-8 rounded-xl bg-white border border-slate-200 text-[#111827] hover:bg-slate-50 transition-all font-medium"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={submitting}
                      className="flex-1 md:flex-none h-12 px-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 transition-all font-semibold"
                    >
                      {submitting ? <Loader2 className="animate-spin mr-2" size={18} /> : "Submit Request"}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function DocumentUploader({ label, id, file, onChange }: { label: string, id: string, file: File | null, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div className="group relative">
      <input type="file" id={id} className="hidden" accept="application/pdf,image/*" onChange={onChange} />
      <div 
        className={cn(
          "flex items-center gap-4 p-4 rounded-xl border-2 border-dashed transition-all h-20",
          file ? "border-emerald-200 bg-emerald-50/50" : "border-[#E5E7EB] bg-white group-hover:border-indigo-400 group-hover:bg-indigo-50/20"
        )}
      >
        <div className={cn(
          "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
          file ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors"
        )}>
          {file ? <CheckCircle2 size={18} /> : <Upload size={18} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn(
            "text-[13px] font-medium truncate",
            file ? "text-emerald-700" : "text-[#111827]"
          )}>
            {file ? file.name : label}
          </p>
          <p className="text-[10px] text-[#6B7280]">
            {file ? `${(file.size / 1024).toFixed(1)} KB` : "Click to upload (PDF/JPG)"}
          </p>
        </div>
        {!file && (
          <label htmlFor={id} className="absolute inset-0 cursor-pointer" />
        )}
        {file && (
          <label htmlFor={id} className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer ml-auto uppercase tracking-tighter">Change</label>
        )}
      </div>
    </div>
  )
}
