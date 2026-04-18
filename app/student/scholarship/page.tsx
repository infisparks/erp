"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  GraduationCap, 
  ExternalLink, 
  Plus, 
  Trash2, 
  FileText, 
  Upload, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Loader2,
  ChevronRight,
  ShieldCheck,
  Info,
  ArrowLeft,
  Download,
  Edit2
} from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { getStudentProfile } from "@/lib/erp-logic"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function StudentScholarshipPage() {
  const [loading, setLoading] = useState(true)
  const [student, setStudent] = useState<any>(null)
  const [courseYears, setCourseYears] = useState<any[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [view, setView] = useState("new") // 'new' or 'history'
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Form State
  const [formData, setFormData] = useState({
    academic_year_id: "",
    academic_year_name: "",
    academic_year_session: "",
    year_level: 1,
    application_id: "",
    scholarship_category_id: ""
  })
  const [documents, setDocuments] = useState<any[]>([
    { name: "Scholarship Form (MahaDBT Scan)", file: null, required: true, existingPath: null }
  ])

  const router = useRouter()

  const fetchHistory = async (studentId: number) => {
    const supabase = getSupabaseClient()
    const { data } = await supabase
      .from('student_academic_years')
      .select('*')
      .eq('student_id', studentId)
      .not('scholarship_application_id', 'is', null)
      .order('created_at', { ascending: false })
    if (data) setApplications(data)
  }

  useEffect(() => {
    ;(async () => {
      try {
        const supabase = getSupabaseClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { router.push("/student/login"); return }
        const profile = await getStudentProfile(supabase, session.user.id)
        if (!profile) { router.push("/student/admission"); return }
        setStudent(profile)

        const { data: cYears } = await supabase
          .from('academic_years')
          .select('*')
          .eq('course_id', profile.course_id)
        if (cYears) setCourseYears(cYears)
        
        const { data: sCats } = await supabase.from('scholarship_categories').select('*')
        if (sCats) setCategories(sCats)
        
        const latestYear = profile.student_academic_years?.[0]
        if (latestYear && cYears) {
           setFormData(prev => ({ 
             ...prev, 
             academic_year_id: latestYear.id,
             academic_year_name: latestYear.academic_year_name,
             academic_year_session: latestYear.academic_year_session,
             year_level: latestYear.year_category?.name?.includes('1') ? 1 : 2,
             scholarship_category_id: latestYear.scholarship_category_id || ""
           }))
        }
        await fetchHistory(profile.id)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const handleEdit = (app: any) => {
    if (app.scholarship_status !== 'pending' && app.scholarship_status !== 'reverted') {
      alert("This application is already processed and locked.")
      return
    }
    setEditingId(app.id)
    setFormData({
      academic_year_id: app.id,
      academic_year_name: app.academic_year_name || "",
      academic_year_session: app.academic_year_session || "",
      year_level: app.year_level || 1,
      application_id: app.scholarship_application_id || "",
      scholarship_category_id: app.scholarship_category_id || ""
    })

    // Set existing documents
    const existingDocs = (app.scholarship_documents || []).map((d: any, idx: number) => ({
      name: d.name,
      file: null,
      required: d.name === "Scholarship Form (MahaDBT Scan)",
      existingPath: d.path,
      id: idx
    }))

    if (existingDocs.length === 0) {
       setDocuments([{ name: "Scholarship Form (MahaDBT Scan)", file: null, required: true, existingPath: null }])
    } else {
       setDocuments(existingDocs)
    }
    setView("new")
  }

  const addDocumentRow = () => {
    setDocuments([...documents, { name: "", file: null, required: false, existingPath: null }])
  }

  const removeDocumentRow = (index: number) => {
    if (documents[index].required) return
    setDocuments(documents.filter((_, i) => i !== index))
  }

  const handleFileChange = (index: number, file: File | null) => {
    const newDocs = [...documents]
    newDocs[index].file = file
    setDocuments(newDocs)
  }

  const handleNameChange = (index: number, name: string) => {
    const newDocs = [...documents]
    newDocs[index].name = name
    setDocuments(newDocs)
  }

  const handleSubmit = async () => {
    if (!formData.application_id) {
      alert("Please fill in Application ID")
      return
    }

    if (!editingId && !documents[0].file && !documents[0].existingPath) {
      alert("Scholarship Form is compulsory for new applications")
      return
    }

    const yearId = formData.academic_year_id;
    if (!yearId) {
      alert("Please select a valid academic year");
      return;
    }

    setSubmitting(true)
    const supabase = getSupabaseClient()

    try {
      let finalDocs = documents.map(d => ({
         name: d.name,
         path: d.existingPath // Keep existing path if not overwritten
      }))

      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i]
        if (!doc.file) continue
        
        const fileName = `${student.id}/scholarships/${yearId}/${Date.now()}_${doc.file.name}`
        const { error: uError } = await supabase.storage
          .from('student_documents')
          .upload(fileName, doc.file)
        
        if (uError) throw uError

        finalDocs[i].path = fileName
      }

      const { error: sError } = await supabase
        .from('student_academic_years')
        .update({
          scholarship_application_id: formData.application_id,
          scholarship_category_id: formData.scholarship_category_id || null,
          scholarship_status: 'pending',
          scholarship_documents: finalDocs
        })
        .eq('id', yearId)

      if (sError) throw sError

      await fetchHistory(student.id)
      setEditingId(null)
      setView("history")
      alert(editingId ? "Application updated!" : "Application submitted!")
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center font-poppins">
       <Loader2 className="h-10 w-10 animate-spin text-indigo-600 opacity-40" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F5F6F8] font-poppins pb-10 selection:bg-indigo-50">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        .font-poppins { font-family: 'Poppins', sans-serif !important; }
        .font-light { font-weight: 300 !important; }
        .font-normal { font-weight: 400 !important; }
        .font-medium { font-weight: 500 !important; }
        .font-semibold { font-weight: 600 !important; }
        .font-bold { font-weight: 700 !important; }
      `}</style>

      <header className="bg-white border-b border-slate-100 sticky top-0 z-50 backdrop-blur-md bg-white/80">
         <div className="max-w-7xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <button onClick={() => router.push('/student/dashboard')} className="h-9 w-9 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors bg-slate-50 rounded-lg">
                  <ArrowLeft size={18} />
               </button>
               <div>
                  <h1 className="text-lg md:text-xl font-light text-slate-900 tracking-tight leading-none">
                     <span className="font-medium text-indigo-600">Scholarship</span> Portal
                  </h1>
               </div>
            </div>
            <div className="h-9 w-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-100 shrink-0">
               <GraduationCap size={18} />
            </div>
         </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8">
         
         <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative group">
            <div className="p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
               <div className="space-y-1 text-center md:text-left">
                  <Badge className="bg-amber-50 text-amber-600 border-amber-100 text-[8px] font-semibold uppercase tracking-widest px-2 py-0">Official Link</Badge>
                  <h3 className="text-base font-medium text-slate-900">MahaDBT External Portal</h3>
                  <p className="text-[11px] text-slate-500 font-light">Ensure you have registered on MahaDBT website before submitting here.</p>
               </div>
               <Button asChild className="h-10 px-6 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium transition-all flex items-center gap-2 text-[12px]">
                  <Link href="https://mahadbt.maharashtra.gov.in/Login/Login" target="_blank">
                     Open Portal <ExternalLink size={14} />
                  </Link>
               </Button>
            </div>
         </div>

         <Tabs value={view} onValueChange={setView} className="space-y-6">
            <div className="flex justify-center md:justify-start">
               <TabsList className="bg-slate-200/50 p-1 rounded-xl h-12">
                  <TabsTrigger value="new" className="rounded-lg px-6 font-medium text-[11px] data-[state=active]:bg-white data-[state=active]:text-indigo-600 shadow-sm">
                     {editingId ? "Update Request" : "New Application"}
                  </TabsTrigger>
                  <TabsTrigger value="history" className="rounded-lg px-6 font-medium text-[11px] data-[state=active]:bg-white data-[state=active]:text-indigo-600 shadow-sm">Applications List</TabsTrigger>
               </TabsList>
            </div>

            <TabsContent value="new" className="animate-in fade-in zoom-in-95 duration-300 outline-none">
               <div className="bg-white rounded-3xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                  <div className="p-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between px-6 py-3">
                     <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <FileText size={14} className="text-indigo-500" /> Application Details
                     </span>
                     {editingId && (
                        <Badge className="bg-indigo-600 text-white border-none text-[8px] px-2 py-0.5">Editing Mode</Badge>
                     )}
                  </div>
                  
                  <div className="p-6 md:p-8 lg:p-10">
                     <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        {/* Left Column: Details */}
                        <div className="lg:col-span-7 space-y-10">
                           <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                 <Label className="text-[13px] font-semibold uppercase text-slate-500 tracking-wider">Target Academic Year*</Label>
                                 <span className="text-[11px] text-slate-400 font-medium italic">Select the year you are applying for</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                 {student?.student_academic_years?.map((say: any) => {
                                    const yLabel = `${say.academic_year_name} / ${say.academic_year_session}`
                                    const isActive = formData.academic_year_id === say.id
                                    const hasApplied = say.scholarship_application_id && (!editingId || editingId !== say.id)
                                    
                                    return (
                                       <button
                                          key={say.id}
                                          type="button"
                                          disabled={hasApplied}
                                          onClick={() => setFormData({ 
                                            ...formData, 
                                            academic_year_id: say.id,
                                            academic_year_name: say.academic_year_name,
                                            academic_year_session: say.academic_year_session,
                                            year_level: say.year_category?.name?.includes('1') ? 1 : 2,
                                            scholarship_category_id: say.scholarship_category_id || ""
                                          })}
                                          className={cn(
                                            "relative h-14 rounded-2xl border text-left px-5 transition-all duration-300 flex items-center justify-between overflow-hidden group",
                                            isActive
                                              ? "border-indigo-600 bg-indigo-50/50 ring-4 ring-indigo-500/5 shadow-md" 
                                              : (hasApplied ? "border-slate-50 bg-slate-50/20 opacity-60 grayscale cursor-not-allowed" : "border-slate-100 bg-slate-50/50 hover:border-slate-300 hover:bg-white")
                                          )}
                                       >
                                          <div className="flex flex-col">
                                             <span className={cn("text-[14px] transition-colors", isActive ? "text-indigo-700 font-semibold" : "text-slate-600 font-medium")}>{yLabel}</span>
                                             <span className="text-[11px] text-slate-400 font-light truncate">
                                                {hasApplied ? "Submission Record Exists" : `Reg ID: ${say.id}`}
                                             </span>
                                          </div>
                                          {isActive && (
                                             <div className="h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 scale-110">
                                                <CheckCircle2 size={12} strokeWidth={3} />
                                             </div>
                                          )}
                                          {hasApplied && <Clock size={14} className="text-slate-300" />}
                                       </button>
                                    )
                                 })}
                              </div>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-3xl bg-slate-50/40 border border-slate-100/60 shadow-inner">
                              <div className="space-y-2.5">
                                 <Label className="text-[13px] font-semibold text-slate-500 ml-1">Scholarship Category*</Label>
                                 <select 
                                    className="h-12 w-full rounded-xl border border-slate-200 bg-white text-[14px] font-medium px-4 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none appearance-none"
                                    value={formData.scholarship_category_id}
                                    onChange={(e) => setFormData({ ...formData, scholarship_category_id: e.target.value })}
                                 >
                                    <option value="">Select Category</option>
                                    {categories.map(cat => (
                                       <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                 </select>
                              </div>
                              <div className="space-y-2.5">
                                 <Label className="text-[13px] font-semibold text-slate-500 ml-1">Application ID (MahaDBT)*</Label>
                                 <Input 
                                    placeholder="Enter your ID" 
                                    className="h-12 rounded-xl border-slate-200 bg-white text-[14px] font-medium px-4 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                                    value={formData.application_id}
                                    onChange={(e) => setFormData({ ...formData, application_id: e.target.value })}
                                 />
                              </div>
                           </div>
                        </div>

                        {/* Right Column: Documents */}
                        <div className="lg:col-span-5 space-y-6">
                           <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                              <div className="space-y-0.5">
                                 <h4 className="text-[18px] font-bold uppercase tracking-[0.15em] text-slate-400">Supporting Evidence</h4>
                                 <p className="text-[11px] text-slate-500 font-light italic">Compulsory scans of MahaDBT application</p>
                              </div>
                              <Button 
                                 variant="outline" 
                                 size="sm"
                                 className="h-8 rounded-lg border-indigo-200 text-indigo-600 font-semibold text-[10px] uppercase tracking-wider bg-indigo-50/50 hover:bg-indigo-600 hover:text-white transition-all gap-1.5" 
                                 onClick={addDocumentRow}
                              >
                                 <Plus size={14} /> Add More
                              </Button>
                           </div>

                           <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                              {documents.map((doc, i) => (
                                 <div key={i} className="group relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                       {doc.required ? (
                                          <div className="flex items-center gap-2">
                                             <Badge className="bg-amber-100 text-amber-700 border-none text-[9px] font-bold p-0 px-2 h-5">Required</Badge>
                                             <span className="text-[12px] font-semibold text-slate-700">{doc.name}</span>
                                          </div>
                                       ) : (
                                          <Input 
                                             placeholder="Type document name..." 
                                             className="h-8 w-full border-transparent bg-slate-50 focus:bg-white text-[12px] font-medium px-2 rounded-lg"
                                             value={doc.name}
                                             onChange={(e) => handleNameChange(i, e.target.value)}
                                          />
                                       )}
                                       {!doc.required && (
                                          <button 
                                             type="button"
                                             className="h-6 w-6 rounded-md bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors flex items-center justify-center"
                                             onClick={() => removeDocumentRow(i)}
                                          >
                                             <Trash2 size={12} />
                                          </button>
                                       )}
                                    </div>
                                    
                                    <div className="relative group/upload">
                                       <input 
                                          type="file" 
                                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                          onChange={(e) => handleFileChange(i, e.target.files?.[0] || null)} 
                                       />
                                       <div className={cn(
                                          "h-12 border-2 border-dashed rounded-xl flex items-center justify-center px-4 gap-3 transition-all",
                                          doc.file 
                                            ? "border-emerald-200 bg-emerald-50/50 text-emerald-700" 
                                            : (doc.existingPath ? "border-indigo-200 bg-indigo-50/50 text-indigo-700" : "border-slate-200 bg-slate-50 text-slate-400 group-hover/upload:border-indigo-400 group-hover/upload:bg-indigo-50/30")
                                       )}>
                                          <Upload size={16} className={cn(doc.file ? "text-emerald-500" : "text-indigo-400")} />
                                          <span className="text-[11px] font-medium truncate max-w-[180px]">
                                             {doc.file ? doc.file.name : (doc.existingPath ? "Existing Document Attached" : "Click to select file")}
                                          </span>
                                       </div>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>
                     </div>

                     <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center gap-6">
                        <Button 
                           onClick={handleSubmit} 
                           disabled={submitting} 
                           className="h-14 w-full md:w-80 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] transition-all flex items-center justify-between px-8"
                        >
                           <div className="flex flex-col items-start text-left">
                              <span className="text-[14px] font-bold tracking-tight">
                                 {editingId ? "Update Application" : "Complete Submission"}
                              </span>
                              <span className="text-[10px] font-light opacity-80">Instant institutional audit</span>
                           </div>
                           {submitting ? <Loader2 className="animate-spin" size={20} /> : <ChevronRight size={20} />}
                        </Button>
                        
                        <div className="flex flex-col md:flex-row items-center gap-6 text-slate-400">
                           {editingId && (
                              <button 
                                 type="button" 
                                 onClick={() => { setEditingId(null); setView("history"); }} 
                                 className="text-[12px] font-medium hover:text-slate-600 flex items-center gap-1.5 px-4 py-2 bg-slate-100 rounded-xl transition-all"
                              >
                                 <XCircle size={14} /> Cancel Editing
                              </button>
                           )}
                           <p className="text-[11px] font-light flex items-center gap-2">
                              <Info size={14} className="text-indigo-400" /> All submissions are immutable once approved by management.
                           </p>
                        </div>
                     </div>
                  </div>
               </div>
            </TabsContent>

            <TabsContent value="history" className="animate-in fade-in slide-in-from-bottom-5 duration-300 outline-none">
               {applications.length === 0 ? (
                  <div className="py-32 flex flex-col items-center justify-center text-center space-y-4 bg-white rounded-3xl border border-slate-100 shadow-sm">
                     <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200">
                        <Clock size={32} strokeWidth={1} />
                     </div>
                     <div className="space-y-1">
                        <p className="text-slate-900 font-semibold text-sm">No applications yet</p>
                        <p className="text-slate-400 font-light text-[11px]">Your scholarship history will appear here once you submit.</p>
                     </div>
                     <Button variant="ghost" className="text-indigo-600 text-[11px] font-bold uppercase tracking-widest" onClick={() => setView("new")}>Apply Now</Button>
                  </div>
               ) : (
                  <div className="space-y-4">
                     {applications.map((app) => (
                        <div key={app.id} className="bg-white rounded-2xl border border-slate-200/60 p-5 md:p-6 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group relative overflow-hidden">
                           <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-100 group-hover:bg-indigo-500 transition-colors" />
                           
                           <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                              <div className="flex items-start gap-4 flex-1">
                                 <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner shrink-0 lg:rotate-3 group-hover:rotate-0 transition-transform">
                                    <GraduationCap size={22} />
                                 </div>
                                 <div className="space-y-1 min-w-0">
                                    <h5 className="text-[15px] font-bold text-slate-900 leading-tight truncate">
                                       {categories.find(c => c.id === app.scholarship_category_id)?.name || "Scholarship Application"}
                                    </h5>
                                    <div className="flex items-center gap-2 flex-wrap text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                                       <span>ID: <span className="text-indigo-500 font-bold">{app.scholarship_application_id}</span></span>
                                       <span className="text-slate-200">•</span>
                                       <span>Year: {app.academic_year_name}</span>
                                       <span className="text-slate-200">•</span>
                                       <span>Session: {app.academic_year_session}</span>
                                    </div>
                                 </div>
                              </div>

                              <div className="flex items-center gap-3 lg:gap-8 flex-wrap">
                                 <div className="flex flex-col items-end gap-1">
                                    <Badge className={cn(
                                       "text-[9px] font-bold uppercase px-3 py-1 rounded-lg border shadow-none",
                                       app.scholarship_status === 'approved' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                       app.scholarship_status === 'rejected' ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-amber-50 text-amber-600 border-amber-100"
                                    )}>
                                       {app.scholarship_status}
                                    </Badge>
                                    <span className="text-[9px] text-slate-300 font-medium">{new Date(app.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                 </div>

                                 <div className="flex items-center gap-2 border-l border-slate-100 pl-4 lg:pl-8">
                                    <div className="flex -space-x-1.5">
                                       {(app.scholarship_documents || []).map((doc: any, j: number) => (
                                          <Link 
                                             key={j} 
                                             href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/student_documents/${doc.path}`} 
                                             target="_blank"
                                             className="h-8 w-8 rounded-lg bg-slate-50 border border-white hover:bg-white hover:border-indigo-200 hover:text-indigo-600 transition-all flex items-center justify-center text-slate-400 shadow-sm"
                                             title={doc.name}
                                          >
                                             <Download size={14} />
                                          </Link>
                                       ))}
                                    </div>
                                    
                                    {(app.scholarship_status === 'pending' || app.scholarship_status === 'reverted') && (
                                       <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          onClick={() => handleEdit(app)} 
                                          className="h-8 w-8 rounded-lg bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                       >
                                          <Edit2 size={14} />
                                       </Button>
                                    )}
                                 </div>
                              </div>
                           </div>

                           {app.scholarship_admin_remarks && (
                              <div className="mt-4 pt-4 border-t border-slate-50 flex items-start gap-3">
                                 <div className="h-6 w-6 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                                    <Info size={12} />
                                 </div>
                                 <div className="space-y-0.5">
                                    <p className="text-[9px] text-rose-400 font-bold uppercase tracking-widest">Administrator Feedback</p>
                                    <p className="text-[12px] text-slate-600 font-light italic">"{app.scholarship_admin_remarks}"</p>
                                 </div>
                              </div>
                           )}
                        </div>
                     ))}
                  </div>
               )}
            </TabsContent>
         </Tabs>
      </div>
    </div>
  )
}
