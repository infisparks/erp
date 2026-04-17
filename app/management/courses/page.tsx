"use client"

import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { 
  Plus, Trash2, BookOpen, GraduationCap, 
  Search, Loader2, ArrowRight, X, ShieldAlert,
  ChevronRight, Layers, Calendar, Book, 
  MoreVertical, Pencil, Settings, CheckCircle2,
  Lock, Eye, EyeOff, FlaskConical, Circle,
  ChevronDown
} from "lucide-react"
import { cn } from "@/lib/utils"

// --- Type Definitions ---
interface Stream { id: string; name: string }
interface Course { id: string; name: string; stream_id: string }
interface AcademicYear { id: string; name: string; course_id: string; sequence: number }
interface Semester { id: string; name: string; academic_year_id: string; serial_id: number }
interface Subject { 
  id: string; 
  name: string; 
  subject_code?: string; 
  type: string; 
  semester_id: string;
  is_optional?: boolean;
}

export default function CoursesPage() {
  const supabase = getSupabaseClient()

  // --- Data State ---
  const [streams, setStreams] = useState<Stream[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])

  // --- UI Control State ---
  const [selectedStream, setSelectedStream] = useState<string | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<string | null>(null)
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null)

  // --- Loading State ---
  const [loading, setLoading] = useState({
    streams: true,
    courses: false,
    years: false,
    semesters: false,
    subjects: false
  })

  // --- Form State ---
  const [modal, setModal] = useState<{ 
    isOpen: boolean; 
    type: string; 
    mode: "create" | "edit"; 
    parentId?: string | null;
    editingId?: string | null;
  }>({
    isOpen: false,
    type: "",
    mode: "create",
  })

  const [formData, setFormData] = useState({ 
    name: "", 
    code: "", 
    sequence: 0, 
    type: "Theory",
    is_optional: false 
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  // --- Initial Data: Streams ---
  useEffect(() => {
    async function loadStreams() {
      const { data } = await supabase.from("streams").select("*").order("name")
      setStreams(data || [])
      setLoading(p => ({ ...p, streams: false }))
    }
    loadStreams()
  }, [])

  // --- Chain: Stream -> Courses ---
  useEffect(() => {
    if (!selectedStream) { setCourses([]); return }
    async function loadCourses() {
      setLoading(p => ({ ...p, courses: true }))
      const { data } = await supabase.from("courses").select("*").eq("stream_id", selectedStream).order("name")
      setCourses(data || [])
      setLoading(p => ({ ...p, courses: false }))
      setSelectedCourse(null)
    }
    loadCourses()
  }, [selectedStream])

  // --- Chain: Course -> Years ---
  useEffect(() => {
    if (!selectedCourse) { setAcademicYears([]); return }
    async function loadYears() {
      setLoading(p => ({ ...p, years: true }))
      const { data } = await supabase.from("academic_years").select("*").eq("course_id", selectedCourse).order("sequence")
      setAcademicYears(data || [])
      setLoading(p => ({ ...p, years: false }))
      setSelectedYear(null)
    }
    loadYears()
  }, [selectedCourse])

  // --- Chain: Year -> Semesters ---
  useEffect(() => {
    if (!selectedYear) { setSemesters([]); return }
    async function loadSemesters() {
      setLoading(p => ({ ...p, semesters: true }))
      const { data } = await supabase.from("semesters").select("*").eq("academic_year_id", selectedYear).order("serial_id")
      setSemesters(data || [])
      setLoading(p => ({ ...p, semesters: false }))
      setSelectedSemester(null)
    }
    loadSemesters()
  }, [selectedYear])

  // --- Chain: Semester -> Subjects ---
  useEffect(() => {
    if (!selectedSemester) { setSubjects([]); return }
    async function loadSubjects() {
      setLoading(p => ({ ...p, subjects: true }))
      const { data } = await supabase.from("subjects").select("*").eq("semester_id", selectedSemester).order("name")
      setSubjects(data || [])
      setLoading(p => ({ ...p, subjects: false }))
    }
    loadSubjects()
  }, [selectedSemester])

  // --- CRUD Handlers ---
  const handleSave = async () => {
    setIsSubmitting(true)
    const { type, mode, parentId, editingId } = modal
    
    let table = ""
    let payload: any = { name: formData.name }

    switch(type) {
      case "stream": table = "streams"; break
      case "course": table = "courses"; payload.stream_id = parentId; break
      case "year": table = "academic_years"; payload.course_id = parentId; payload.sequence = formData.sequence; break
      case "semester": table = "semesters"; payload.academic_year_id = parentId; payload.serial_id = formData.sequence; break
      case "subject": 
        table = "subjects"; 
        payload.semester_id = parentId; 
        payload.subject_code = formData.code;
        payload.type = formData.type.toLowerCase();
        payload.is_optional = formData.is_optional;
        break
    }

    try {
      if (mode === "create") {
         const { error } = await supabase.from(table).insert([payload])
         if (error) throw error
      } else {
         const { error } = await supabase.from(table).update(payload).eq("id", editingId)
         if (error) throw error
      }

      // Refresh Data
      if (type === "stream") { const { data } = await supabase.from("streams").select("*").order("name"); setStreams(data || []) }
      else if (type === "course") { const { data } = await supabase.from("courses").select("*").eq("stream_id", selectedStream).order("name"); setCourses(data || []) }
      else if (type === "year") { const { data } = await supabase.from("academic_years").select("*").eq("course_id", selectedCourse).order("sequence"); setAcademicYears(data || []) }
      else if (type === "semester") { const { data } = await supabase.from("semesters").select("*").eq("academic_year_id", selectedYear).order("serial_id"); setSemesters(data || []) }
      else if (type === "subject") { const { data } = await supabase.from("subjects").select("*").eq("semester_id", selectedSemester).order("name"); setSubjects(data || []) }

      setModal({ ...modal, isOpen: false })
      setFormData({ name: "", code: "", sequence: 0, type: "Theory", is_optional: false })
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (table: string, id: string, type: string) => {
    if (!confirm("Permanently remove this academic record?")) return
    const { error } = await supabase.from(table).delete().eq("id", id)
    if (error) { alert(error.message); return }

    if (type === "stream") { setStreams(streams.filter(s => s.id !== id)); if (selectedStream === id) setSelectedStream(null) }
    else if (type === "course") { setCourses(courses.filter(c => c.id !== id)); if (selectedCourse === id) setSelectedCourse(null) }
    else if (type === "year") { setAcademicYears(academicYears.filter(y => y.id !== id)); if (selectedYear === id) setSelectedYear(null) }
    else if (type === "semester") { setSemesters(semesters.filter(sem => sem.id !== id)); if (selectedSemester === id) setSelectedSemester(null) }
    else if (type === "subject") { setSubjects(subjects.filter(sub => sub.id !== id)) }
  }

  const openEdit = (type: string, item: any) => {
     setModal({ isOpen: true, type, mode: "edit", editingId: item.id })
     setFormData({ 
       name: item.name, 
       code: item.subject_code || "", 
       sequence: item.sequence || item.serial_id || 0,
       type: item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : "Theory",
       is_optional: item.is_optional || false
     })
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      
      <div className="px-2">
         <h1 className="text-2xl font-bold text-[#111] tracking-tight">Academics Management</h1>
         <p className="text-slate-500 font-medium text-[13px] mt-0.5">Manage streams, courses, years, semesters, and subjects.</p>
      </div>

      {/* ── Hierarchy Blueprint ────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
         
         <BlueprintColumn title="Streams" onAdd={() => setModal({ isOpen: true, type: "stream", mode: "create" })}>
            {streams.map(s => (
               <BlueprintButton 
                  key={s.id} 
                  label={s.name} 
                  icon={GraduationCap} 
                  active={selectedStream === s.id} 
                  onClick={() => setSelectedStream(s.id)} 
                  onEdit={() => openEdit("stream", s)}
                  onDelete={() => handleDelete("streams", s.id, "stream")}
               />
            ))}
            {loading.streams && <LoaderPulse />}
         </BlueprintColumn>

         <BlueprintColumn title="Courses" disabled={!selectedStream} onAdd={() => setModal({ isOpen: true, type: "course", mode: "create", parentId: selectedStream })}>
            {courses.map(c => (
               <BlueprintButton 
                  key={c.id} 
                  label={c.name} 
                  icon={Book} 
                  active={selectedCourse === c.id} 
                  onClick={() => setSelectedCourse(c.id)} 
                  onEdit={() => openEdit("course", c)}
                  onDelete={() => handleDelete("courses", c.id, "course")}
               />
            ))}
            {loading.courses && <LoaderPulse />}
         </BlueprintColumn>

         <BlueprintColumn title="Years" disabled={!selectedCourse} onAdd={() => setModal({ isOpen: true, type: "year", mode: "create", parentId: selectedCourse })}>
            {academicYears.map(y => (
               <BlueprintButton 
                  key={y.id} 
                  label={y.name} 
                  icon={Calendar} 
                  active={selectedYear === y.id} 
                  onClick={() => setSelectedYear(y.id)} 
                  onEdit={() => openEdit("year", y)}
                  onDelete={() => handleDelete("academic_years", y.id, "year")}
               />
            ))}
            {loading.years && <LoaderPulse />}
         </BlueprintColumn>

         <BlueprintColumn title="Semesters" disabled={!selectedYear} onAdd={() => setModal({ isOpen: true, type: "semester", mode: "create", parentId: selectedYear })}>
            {semesters.map(sem => (
               <BlueprintButton 
                  key={sem.id} 
                  label={sem.name} 
                  icon={Layers} 
                  active={selectedSemester === sem.id} 
                  onClick={() => setSelectedSemester(sem.id)} 
                  onEdit={() => openEdit("semester", sem)}
                  onDelete={() => handleDelete("semesters", sem.id, "semester")}
               />
            ))}
            {loading.semesters && <LoaderPulse />}
         </BlueprintColumn>

      </div>

      {/* ── Subject Registry Table ─────────────────────── */}
      <div className="bg-white border border-[#111] rounded-2xl overflow-hidden shadow-sm">
         <div className="px-8 py-5 flex items-center justify-between border-b border-slate-100">
            <h2 className="text-lg font-bold text-[#111]">
               Subjects for: <span className="text-blue-600 ml-1">{selectedSemester ? semesters.find(s => s.id === selectedSemester)?.name : "..."}</span>
            </h2>
            <button 
               onClick={() => setModal({ isOpen: true, type: "subject", mode: "create", parentId: selectedSemester })}
               disabled={!selectedSemester}
               className="h-9 px-5 bg-slate-400 text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50"
            >
               <Plus size={16} /> Add Subject
            </button>
         </div>

         <div className="p-8">
            {!selectedSemester ? (
               <div className="h-20 flex items-center justify-center opacity-40">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Select a stream, course, year, and semester to see subjects.</p>
               </div>
            ) : subjects.length === 0 ? (
               <div className="h-20 flex items-center justify-center">
                  <p className="text-sm font-medium text-slate-300">Curriculum is currently empty.</p>
               </div>
            ) : (
               <div className="space-y-2">
                  {subjects.map(sub => (
                     <div key={sub.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl group hover:border-[#111] transition-all">
                        <div className="flex items-center gap-4">
                           <div className="h-10 w-10 bg-slate-50 text-slate-300 rounded-lg flex items-center justify-center">
                              {sub.type === 'practical' ? <FlaskConical size={18} /> : <BookOpen size={18} />}
                           </div>
                           <div className="space-y-0.5">
                              <h4 className="text-[13px] font-bold text-[#111]">{sub.name}</h4>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{sub.subject_code || "AC-01"}</p>
                           </div>
                        </div>

                        <div className="flex items-center gap-6">
                           <div className="px-4 py-1 border border-slate-200 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                              {sub.type}
                           </div>
                           <div className="flex items-center gap-2">
                              <button onClick={() => openEdit("subject", sub)} className="h-8 w-8 text-slate-300 hover:text-blue-600 transition-colors"><Pencil size={15} /></button>
                              <button onClick={() => handleDelete("subjects", sub.id, "subject")} className="h-8 w-8 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            )}
         </div>
      </div>

      {/* ── Custom Edit/Create Modal (Clean Industrial) ── */}
      {modal.isOpen && (
         <div className="fixed inset-0 bg-[#000]/20 backdrop-blur-[2px] z-[100] flex items-center justify-center p-6 transition-all duration-300">
            <div className="bg-white w-full max-w-md rounded-lg shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
               
               {/* Modal Header */}
               <div className="px-8 py-6 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-[#111]">{modal.mode === 'edit' ? 'Edit' : 'Add'} {modal.type.charAt(0).toUpperCase() + modal.type.slice(1)}</h3>
                  <button onClick={() => setModal({ ...modal, isOpen: false })} className="text-slate-300 hover:text-[#111] transition-colors"><X size={20} /></button>
               </div>

               <div className="px-8 py-2 pb-10 space-y-8">
                  
                  {/* Subject Inputs */}
                  <div className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-[12px] font-bold text-slate-600">Subject Name*</label>
                        <input 
                           className="w-full h-11 bg-slate-50/50 border border-slate-100 rounded-lg px-4 text-sm font-medium text-[#111] focus:bg-white focus:border-blue-600 outline-none transition-all" 
                           value={formData.name} 
                           onChange={e => setFormData({ ...formData, name: e.target.value })} 
                           placeholder="Enter name"
                           autoFocus
                        />
                     </div>

                     {modal.type === 'subject' && (
                        <>
                           <div className="space-y-2">
                              <label className="text-[12px] font-bold text-slate-600">Subject Code (Optional)</label>
                              <input 
                                 className="w-full h-11 bg-slate-50/50 border border-slate-100 rounded-lg px-4 text-sm font-medium text-[#111] focus:bg-white focus:border-blue-600 outline-none transition-all" 
                                 value={formData.code} 
                                 onChange={e => setFormData({ ...formData, code: e.target.value })} 
                                 placeholder="e.g. PH1"
                              />
                           </div>

                           <div className="space-y-2 relative">
                              <label className="text-[12px] font-bold text-slate-600">Subject Type*</label>
                              <div className="relative">
                                 <select 
                                    className="w-full h-11 bg-white border border-[#111] rounded-lg px-4 text-sm font-medium text-[#111] outline-none appearance-none cursor-pointer" 
                                    value={formData.type} 
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                 >
                                    <option value="Theory">Theory</option>
                                    <option value="Practical">Practical</option>
                                 </select>
                                 <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                              </div>
                           </div>

                           {/* Toggle Switch */}
                           <div className="flex items-center gap-4 pt-2">
                              <label className="relative inline-flex items-center cursor-pointer">
                                 <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={formData.is_optional}
                                    onChange={e => setFormData({ ...formData, is_optional: e.target.checked })}
                                 />
                                 <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                 <span className="ml-3 text-[13px] font-medium text-[#111]">Is this an optional subject?</span>
                              </label>
                           </div>
                        </>
                     )}

                     {(modal.type === 'year' || modal.type === 'semester') && (
                        <div className="space-y-2">
                           <label className="text-[12px] font-bold text-slate-600">Sequence Order</label>
                           <input 
                              type="number" 
                              className="w-full h-11 bg-slate-50/50 border border-slate-100 rounded-lg px-4 text-sm font-medium text-[#111] focus:bg-white focus:border-blue-600 outline-none transition-all" 
                              value={formData.sequence} 
                              onChange={e => setFormData({ ...formData, sequence: parseInt(e.target.value) })} 
                           />
                        </div>
                     )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-6 pt-4 border-t border-slate-50 mt-4">
                     <button onClick={() => setModal({ ...modal, isOpen: false })} className="text-[13px] font-bold text-slate-500 hover:text-[#111] transition-colors">Cancel</button>
                     <button 
                        onClick={handleSave} 
                        disabled={isSubmitting || !formData.name} 
                        className="h-10 px-8 bg-[#111] text-white rounded-lg text-sm font-bold shadow-lg active:scale-95 disabled:opacity-50 transition-all"
                     >
                        {isSubmitting ? "Saving..." : "Save"}
                     </button>
                  </div>
               </div>
            </div>
         </div>
      )}

    </div>
  )
}

// --- Simplified Industry Fragments ---

function BlueprintColumn({ title, children, onAdd, disabled = false }: any) {
  return (
    <div className={cn(
       "bg-white border border-[#111] rounded-2xl p-5 flex flex-col gap-5 transition-opacity",
       disabled && "opacity-30 pointer-events-none"
    )}>
       <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#111]">{title}</h3>
          <button onClick={onAdd} className="h-7 w-12 bg-[#111] text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-blue-600 transition-all">
             <Plus size={14} /> Add
          </button>
       </div>
       <div className="flex-1 flex flex-col gap-2 min-h-[380px] overflow-y-auto pr-1">
          {children}
       </div>
    </div>
  )
}

function BlueprintButton({ label, icon: Icon, active, onClick, onEdit, onDelete }: any) {
  return (
    <div 
      className={cn(
         "group flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer",
         active 
            ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/10" 
            : "bg-white border-slate-200 text-[#111] hover:border-[#111]"
      )}
      onClick={onClick}
    >
       <div className="flex items-center gap-3">
          <Icon size={14} className={cn("transition-colors", active ? "text-white" : "text-slate-400")} />
          <span className="text-[12px] font-bold leading-none truncate max-w-[150px]">
            {label}
          </span>
       </div>
       
       <div className={cn("flex items-center gap-1", active ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className={cn("h-6 w-6 rounded flex items-center justify-center transition-all", active ? "hover:bg-white/20" : "text-slate-300 hover:text-blue-600")}><Pencil size={12} /></button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className={cn("h-6 w-6 rounded flex items-center justify-center transition-all", active ? "hover:bg-white/20" : "text-slate-300 hover:text-red-500")}><Trash2 size={12} /></button>
          <ChevronRight size={14} className={cn("transition-transform ml-1", active ? "rotate-0 text-white" : "text-slate-300 group-hover:translate-x-1")} />
       </div>
    </div>
  )
}

function LoaderPulse() {
   return <div className="animate-pulse flex flex-col gap-2">{[1,2,3].map(i => <div key={i} className="h-12 w-full bg-slate-50 border border-slate-100 rounded-lg" />)}</div>
}
