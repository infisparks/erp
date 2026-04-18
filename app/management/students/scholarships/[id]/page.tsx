"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  GraduationCap, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ShieldCheck, 
  Download, 
  FileText,
  User,
  IndianRupee,
  Clock,
  ExternalLink,
  ClipboardList,
  AlertCircle,
  Edit,
  Save
} from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function ScholarshipDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [scholarship, setScholarship] = useState<any>(null)
  const [remarks, setRemarks] = useState("")
  const [processing, setProcessing] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ application_id: "", category_id: "" })

  const fetchScholarshipData = async () => {
    setLoading(true)
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('student_academic_years')
      .select(`
        *,
        students (
          *,
          courses (name),
          student_academic_years (*)
        )
      `)
      .eq('id', id)
      .single()

    if (data) {
      setScholarship(data)
      setRemarks(data.scholarship_admin_remarks || "")
      setEditForm({ 
        application_id: data.scholarship_application_id || "", 
        category_id: data.scholarship_category_id || "" 
      })
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchScholarshipData()
    ;(async () => {
       const supabase = getSupabaseClient()
       const { data } = await supabase.from('scholarship_categories').select('*')
       if (data) setCategories(data)
    })()
  }, [id])

  const handleUpdateStatus = async (status: 'approved' | 'rejected' | 'reverted' | 'pending') => {
    setProcessing(true)
    const supabase = getSupabaseClient()
    
    try {
      const { error } = await supabase
        .from('student_academic_years')
        .update({ 
           scholarship_status: status, 
           scholarship_admin_remarks: remarks 
        })
        .eq('id', id)
      
      if (error) throw error
      await fetchScholarshipData()
      if (status === 'reverted') alert("Application reverted to student for correction.")
    } catch (e: any) {
      alert(e.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleAdminUpdate = async () => {
    setProcessing(true)
    const supabase = getSupabaseClient()
    try {
      const { error } = await supabase
        .from('student_academic_years')
        .update({ 
           scholarship_application_id: editForm.application_id,
           scholarship_category_id: editForm.category_id || null
        })
        .eq('id', id)
      
      if (error) throw error
      await fetchScholarshipData()
      setIsEditing(false)
      alert("Application details updated successfully.")
    } catch (e: any) {
      alert(e.message)
    } finally {
      setProcessing(false)
    }
  }

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      <p className="text-[9px] font-medium uppercase tracking-widest text-slate-400">Loading Profile</p>
    </div>
  )

  if (!scholarship) return (
    <div className="py-20 text-center space-y-4">
       <AlertCircle className="h-10 w-10 text-slate-300 mx-auto" />
       <p className="text-slate-500 font-medium text-sm">Application profile unavailable.</p>
       <Button onClick={() => router.back()} variant="ghost">Return</Button>
    </div>
  )

  const student = scholarship.students
  const latestAcademic = student?.student_academic_years?.[0]

  return (
    <div className="space-y-6 font-poppins animate-in fade-in duration-500 pb-20">
       {/* Compact Breadcrumbs */}
       <div className="flex items-center justify-between pb-4 border-b border-slate-200/60">
          <div className="flex items-center gap-4">
             <button onClick={() => router.back()} className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-emerald-600 transition-all bg-white rounded-lg border border-slate-200">
                <ArrowLeft size={14} />
             </button>
             <div>
                <h2 className="text-sm font-semibold text-slate-900 leading-none flex items-center gap-2">
                   {categories.find(c => c.id === scholarship.scholarship_category_id)?.name || "Application"} Detail
                   <Badge className={cn(
                      "text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border shadow-none",
                      scholarship.scholarship_status === 'approved' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                      scholarship.scholarship_status === 'rejected' ? "bg-rose-50 text-rose-600 border-rose-100" : 
                      scholarship.scholarship_status === 'reverted' ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-slate-50 text-slate-600 border-slate-100"
                   )}>
                      {scholarship.scholarship_status}
                   </Badge>
                </h2>
                <p className="text-slate-400 text-[10px] font-medium mt-1">
                   ID: <span className="text-indigo-500 font-bold uppercase">{scholarship.scholarship_application_id}</span> • Sent: {new Date(scholarship.created_at).toLocaleDateString()}
                </p>
             </div>
          </div>
          <div className="flex items-center gap-2">
             <Button 
               variant="ghost" 
               onClick={() => setIsEditing(!isEditing)} 
               className={cn("h-9 px-4 rounded-xl font-medium text-[11px] uppercase tracking-wide gap-1.5 transition-all", isEditing ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-slate-50 text-slate-500 hover:bg-slate-100")}
             >
                <Edit size={14} /> {isEditing ? "Exit Edit" : "Admin Edit"}
             </Button>
             <Button asChild variant="outline" className="h-9 px-4 rounded-xl border-slate-200 text-slate-500 font-medium text-[11px] uppercase tracking-wide gap-1.5 hover:bg-slate-50">
                <Link href={`/management/students/status?student_id=${student.id}`}>
                   <ClipboardList size={14} /> Course Status
                </Link>
             </Button>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div className="lg:col-span-8 space-y-6">
             <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                   <div className="space-y-6">
                      <div className="space-y-1">
                         <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Scholarship Type</Label>
                         {isEditing ? (
                             <select 
                                className="h-10 w-full rounded-lg border-slate-200 bg-slate-50 text-[12px] font-medium px-3 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all"
                                value={editForm.category_id}
                                onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value })}
                             >
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                   <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                             </select>
                          ) : (
                             <p className="text-[14px] font-bold text-slate-900 leading-none">
                                {categories.find(c => c.id === scholarship.scholarship_category_id)?.name || "N/A"}
                             </p>
                          )}
                      </div>
                      <div className="space-y-2">
                         <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em]">Application ID</Label>
                         {isEditing ? (
                             <Input 
                                className="h-10 rounded-lg border-slate-200 bg-slate-50 text-[12px] font-medium px-3"
                                value={editForm.application_id}
                                onChange={(e: any) => setEditForm({ ...editForm, application_id: e.target.value })}
                             />
                          ) : (
                             <div className="p-3 bg-slate-900 rounded-xl">
                                <code className="text-emerald-400 font-bold text-xs">{scholarship.scholarship_application_id}</code>
                             </div>
                          )}
                      </div>
                   </div>

                   <div className="space-y-6">
                       <div className="space-y-2">
                          <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em]">Applied Academic Year</Label>
                          <div className="space-y-1">
                             <p className="text-[14px] font-semibold text-slate-900">{scholarship.academic_year_name || "N/A"}</p>
                             <p className="text-[11px] text-slate-500 font-medium">{student.fullname} • Session {scholarship.academic_year_session || "N/A"}</p>
                          </div>
                       </div>
                       <div className="flex gap-2">
                          <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold text-[8px] py-1 px-3 uppercase tracking-wider">Target Year</Badge>
                          <Badge className="bg-indigo-50/50 text-indigo-500 border-none font-bold text-[8px] py-1 px-3">{student.courses?.name}</Badge>
                       </div>
                   </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-slate-50">
                    <div className="flex items-center justify-between">
                       <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em]">Submitted Evidence</Label>
                       <span className="text-slate-300 text-[10px] font-medium">{scholarship.scholarship_documents?.length || 0} Files</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                       {(scholarship.scholarship_documents || []).map((doc: any, i: number) => (
                          <Link 
                             key={i} 
                             href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/student_documents/${doc.path}`}
                             target="_blank"
                             className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 transition-all group"
                          >
                             <div className="flex items-center gap-3">
                                <FileText size={14} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                                <span className="text-[11px] font-medium text-slate-600 truncate max-w-[120px]">{doc.name}</span>
                             </div>
                             <Download size={14} className="text-slate-300 group-hover:text-emerald-500" />
                          </Link>
                       ))}
                    </div>
                </div>
             </div>
          </div>

          <div className="lg:col-span-4">
             <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden sticky top-24">
                <div className="p-5 bg-slate-900">
                   <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-emerald-500 rounded-xl flex items-center justify-center rotate-3">
                         <ShieldCheck size={18} className="text-white" />
                      </div>
                      <p className="text-[12px] font-bold text-white tracking-wide">Audit Control</p>
                   </div>
                </div>

                <div className="p-5 space-y-6">
                   <div className="space-y-2">
                      <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em]">Admin Remarks</Label>
                      <Textarea 
                         placeholder="Verification feedback..."
                         className="min-h-[120px] rounded-xl border-slate-200 bg-slate-50/50 text-[12px] font-medium focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all p-3 outline-none"
                         value={remarks}
                         onChange={(e) => setRemarks(e.target.value)}
                      />
                   </div>

                   <div className="space-y-2">
                       {isEditing ? (
                          <Button 
                             className="h-11 w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 transition-all"
                             disabled={processing}
                             onClick={handleAdminUpdate}
                          >
                             {processing ? <Loader2 className="animate-spin" size={14} /> : <Save size={16} />}
                             Save Changes
                          </Button>
                       ) : (
                          <>
                             <Button 
                                className="h-11 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                disabled={processing}
                                onClick={() => handleUpdateStatus('approved')}
                             >
                                {processing ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={16} />}
                                Verify Request
                             </Button>
                             <div className="grid grid-cols-2 gap-2">
                                <Button 
                                   variant="ghost"
                                   className="h-11 w-full rounded-xl text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 font-bold text-[10px] uppercase tracking-wider transition-all"
                                   disabled={processing}
                                   onClick={() => handleUpdateStatus('rejected')}
                                >
                                   {processing ? <Loader2 className="animate-spin" size={14} /> : <XCircle size={16} />}
                                   Reject
                                </Button>
                                <Button 
                                   variant="ghost"
                                   className="h-11 w-full rounded-xl text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-100 font-bold text-[10px] uppercase tracking-wider transition-all"
                                   disabled={processing}
                                   onClick={() => handleUpdateStatus('reverted')}
                                >
                                   {processing ? <Loader2 className="animate-spin" size={14} /> : <Clock size={16} />}
                                   Revert
                                </Button>
                             </div>
                          </>
                       )}
                    </div>

                    <div className="p-3 bg-amber-50 rounded-xl flex items-start gap-3">
                       <ShieldCheck size={14} className="text-amber-500 mt-0.5" />
                       <p className="text-[10px] text-amber-700 font-medium leading-normal">Reverting an entry allows the student to edit their submission details and documents.</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
     </div>
  )
}
