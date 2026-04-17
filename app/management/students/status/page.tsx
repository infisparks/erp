"use client"

import React, { useState, useEffect, useMemo, useCallback, Suspense } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { SupabaseClient } from "@supabase/supabase-js"
import { useSearchParams, useRouter } from 'next/navigation'
import { format } from "date-fns"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// --- UI Components ---
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// --- Icons ---
import {
  Loader2,
  AlertTriangle,
  UserRound,
  ShieldCheck,
  Lock,
  Unlock,
  ArrowLeft,
  Calendar,
  History,
  GraduationCap,
  Edit3,
  Save,
  Building2,
  CreditCard,
  ClipboardList,
  MoreVertical,
  ChevronRight,
  Mail,
  Fingerprint,
  Download,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

// --- Types ---
interface StudentProfile {
  id: number
  fullname: string
  roll_number: string
  email: string
  photo_path: string | null
}

interface AcademicYearEnrollment {
  id: number
  academic_year_name: string
  academic_year_session: string
  is_locked: boolean
  is_verified_by_admin: boolean
  is_verified_by_account: boolean
  is_verified_by_examcell: boolean
  is_eligible_for_next_year: boolean
  course_name: string
  created_at: string
  total_fee: number
  scholarship_category_name: string | null
  scholarship_amount: number
  net_payable_fee: number
  payment_plan: string | null
  installment_dates: any[] | null
}

interface SemesterRegistration {
  id: number
  semester_name: string
  promotion_status: string
  status: string
  is_verifiedby_admin: boolean
  is_verifiedby_accountant: boolean
  is_verifiedby_examcell: boolean
  total_fee: number
  net_payable_fee: number
  created_at: string
}

const StudentAvatar: React.FC<{ src: string | null, alt: string | null, supabase: SupabaseClient, onUpdate?: () => void, className?: string }> = ({ src, alt, supabase, onUpdate, className = "h-24 w-24" }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  
  const { publicUrl } = useMemo(() => {
    if (!src) return { publicUrl: null }
    const cleanPath = src.replace(/^\/+/, '');
    const { data } = supabase.storage.from('student_documents').getPublicUrl(cleanPath);
    return { publicUrl: data.publicUrl }
  }, [src, supabase])

  return (
    <div className="relative group cursor-pointer" onClick={onUpdate}>
      <div className={cn(className, "rounded-2xl overflow-hidden border-4 border-white/10 shadow-2xl bg-slate-800 transition-all duration-300 group-hover:scale-105 group-hover:border-indigo-500/50")}>
        {publicUrl && !imgError ? (
          <img 
            src={publicUrl} 
            alt={alt || "Student"} 
            className={cn("h-full w-full object-cover transition-opacity duration-500", imgLoaded ? "opacity-100" : "opacity-0")}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-slate-800 text-slate-500">
            <UserRound className="h-1/2 w-1/2 opacity-20" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Edit3 className="text-white h-6 w-6" />
        </div>
      </div>
    </div>
  )
}

function StudentStatusHistoryContent() {
  const supabase = getSupabaseClient()
  const searchParams = useSearchParams()
  const router = useRouter()
  const studentId = searchParams?.get('student_id')

  const [student, setStudent] = useState<StudentProfile | null>(null)
  const [history, setHistory] = useState<AcademicYearEnrollment[]>([])
  const [semesters, setSemesters] = useState<SemesterRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const fetchData = useCallback(async () => {
    if (!studentId) return
    setLoading(true)
    try {
      const { data: sData, error: sErr } = await supabase.from("students").select("*").eq("id", studentId).single()
      if (sErr) throw sErr
      setStudent(sData)

      const { data: hData, error: hErr } = await supabase
        .from("student_academic_years")
        .select(`*, course:courses(name), scholarship_category:scholarship_categories(name)`)
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })

      const { data: semsData, error: semsErr } = await supabase
        .from("student_semesters")
        .select(`*, semesters(name)`)
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })

      if (hErr || semsErr) throw hErr || semsErr

      setHistory(hData.map((item: any) => ({
        ...item,
        course_name: item.course?.name || "N/A",
        scholarship_category_name: item.scholarship_category?.name || "None"
      })))

      setSemesters(semsData.map((s: any) => ({
        ...s,
        semester_name: s.semesters?.name || "Unknown"
      })))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [supabase, studentId])

  useEffect(() => { fetchData() }, [fetchData])

  const handleUpdateField = async (id: number, table: "student_academic_years" | "student_semesters", field: string, value: any) => {
    setUpdatingId(id)
    try {
      const { error } = await supabase.from(table).update({ [field]: value }).eq("id", id)
      if (error) throw error
      
      if (table === "student_academic_years") {
        setHistory(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item))
      } else {
        setSemesters(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item))
      }
      toast.success("Record updated successfully")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
            <div className="absolute inset-0 blur-xl bg-indigo-500/20 animate-pulse"></div>
        </div>
        <p className="mt-4 text-slate-500 font-medium animate-pulse">Synchronizing Academic Data...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Navigation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-xl shadow-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Student Governance</h1>
              <p className="text-sm text-slate-500">History and verification management portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-xl bg-white dark:bg-slate-900 shadow-sm border-slate-200 dark:border-slate-800 font-semibold gap-2">
               <Download className="h-4 w-4" /> Export Report
            </Button>
          </div>
        </div>

        {/* Profile Glass Card */}
        {student && (
          <div className="relative group overflow-hidden rounded-[2rem] bg-slate-900 p-8 shadow-2xl transition-all duration-500">
            <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 opacity-10">
                <GraduationCap className="h-64 w-64 text-indigo-400 rotate-12" />
            </div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(79,70,229,0.15),transparent)]"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <StudentAvatar 
                src={student.photo_path} 
                alt={student.fullname} 
                supabase={supabase}
              />
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                   <h2 className="text-3xl font-black text-white tracking-tight">{student.fullname}</h2>
                   <Badge className="w-fit mx-auto md:mx-0 bg-indigo-500/20 text-indigo-300 border-indigo-500/30 font-mono tracking-tighter">
                      {student.roll_number}
                   </Badge>
                </div>
                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                  <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                    <Mail className="h-4 w-4 text-indigo-400" /> {student.email}
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                    <Fingerprint className="h-4 w-4 text-emerald-400" /> ID: {student.id}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                 <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm text-center">
                    <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest mb-1">Records</p>
                    <p className="text-2xl font-black text-white">{history.length + semesters.length}</p>
                 </div>
                 <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm text-center">
                    <p className="text-[10px] uppercase font-bold text-emerald-400 tracking-widest mb-1">Active</p>
                    <p className="text-2xl font-black text-white">{history.filter(h => !h.is_locked).length}</p>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Records Section */}
        <div className="grid grid-cols-1 gap-8">
          <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 rounded-[1.5rem] overflow-hidden">
            <CardHeader className="border-b border-slate-50 dark:border-slate-800 px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <History className="h-5 w-5 text-indigo-600" /> Academic Timeline
                  </CardTitle>
                  <CardDescription>Comprehensive log of sessions and semester enrollments</CardDescription>
                </div>
                <div className="flex gap-2">
                   <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Verified</span>
                   </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                  <TableRow className="hover:bg-transparent border-b border-slate-100 dark:border-slate-800">
                    <TableHead className="px-8 font-bold text-slate-900 dark:text-slate-100 uppercase text-[10px] tracking-widest">Target Term</TableHead>
                    <TableHead className="font-bold text-slate-900 dark:text-slate-100 uppercase text-[10px] tracking-widest">Financial Summary</TableHead>
                    <TableHead className="font-bold text-slate-900 dark:text-slate-100 uppercase text-[10px] tracking-widest text-center">Verification Pipeline</TableHead>
                    <TableHead className="font-bold text-slate-900 dark:text-slate-100 uppercase text-[10px] tracking-widest text-center">Governance</TableHead>
                    <TableHead className="px-8 text-right font-bold text-slate-900 dark:text-slate-100 uppercase text-[10px] tracking-widest">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Academic Years */}
                  {history.map((item) => (
                    <TableRow key={item.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-all border-b border-slate-50 dark:border-slate-800">
                      <TableCell className="px-8 py-6">
                        <div className="flex flex-col">
                           <span className="font-bold text-slate-900 dark:text-slate-200 text-base">{item.academic_year_name}</span>
                           <span className="text-xs text-slate-400 font-mono mt-0.5">{item.academic_year_session} • {item.course_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">₹{item.net_payable_fee.toLocaleString()}</span>
                            <Badge variant="outline" className="text-[9px] h-4 py-0 font-bold bg-indigo-50 text-indigo-600 border-indigo-100">
                              {item.scholarship_category_name}
                            </Badge>
                          </div>
                          <span className="text-[10px] text-slate-400 italic">Plan: {item.payment_plan || 'One Time'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                         <div className="flex items-center justify-center gap-4">
                            <PipelineCheckbox 
                               label="ADM" 
                               checked={item.is_verified_by_admin} 
                               onToggle={(v) => handleUpdateField(item.id, "student_academic_years", "is_verified_by_admin", v)} 
                               disabled={updatingId === item.id}
                            />
                            <PipelineCheckbox 
                               label="ACC" 
                               checked={item.is_verified_by_account} 
                               onToggle={(v) => handleUpdateField(item.id, "student_academic_years", "is_verified_by_account", v)} 
                               disabled={updatingId === item.id}
                            />
                            <PipelineCheckbox 
                               label="EXM" 
                               checked={item.is_verified_by_examcell} 
                               onToggle={(v) => handleUpdateField(item.id, "student_academic_years", "is_verified_by_examcell", v)} 
                               disabled={updatingId === item.id}
                            />
                         </div>
                      </TableCell>
                      <TableCell>
                         <div className="flex items-center justify-center gap-6">
                            <div className="flex flex-col items-center gap-1">
                               <Switch 
                                 checked={item.is_eligible_for_next_year} 
                                 onCheckedChange={(v) => handleUpdateField(item.id, "student_academic_years", "is_eligible_for_next_year", v)}
                                 className="scale-75 data-[state=checked]:bg-emerald-500"
                               />
                               <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Eligible</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                               <Switch 
                                 checked={item.is_locked} 
                                 onCheckedChange={(v) => handleUpdateField(item.id, "student_academic_years", "is_locked", v)}
                                 className="scale-75 data-[state=checked]:bg-rose-500"
                               />
                               <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Locked</span>
                            </div>
                         </div>
                      </TableCell>
                      <TableCell className="px-8 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800">
                               <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl">
                            <DropdownMenuLabel>Year Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <EditYearDialog item={item} onUpdate={(d) => {
                               Object.entries(d).forEach(([k, v]) => handleUpdateField(item.id, "student_academic_years", k, v))
                            }} />
                            <DropdownMenuItem className="text-rose-500">
                                <Lock className="h-4 w-4 mr-2" /> Force Lock Record
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Semesters Section Divider */}
                  {semesters.length > 0 && (
                    <TableRow className="bg-slate-100/30 dark:bg-slate-800/30 border-none">
                      <TableCell colSpan={5} className="px-8 py-3">
                         <div className="flex items-center gap-2">
                            <div className="h-px flex-1 bg-slate-200 dark:border-slate-700"></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Direct Semester Entries</span>
                            <div className="h-px flex-1 bg-slate-200 dark:border-slate-700"></div>
                         </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Semesters */}
                  {semesters.map((s) => (
                    <TableRow key={s.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/30 border-b border-slate-50 dark:border-slate-800">
                      <TableCell className="px-8 py-4">
                        <div className="flex items-center gap-3">
                           <div className="h-8 w-1 bg-indigo-500 rounded-full opacity-40 group-hover:opacity-100 transition-opacity"></div>
                           <div className="flex flex-col">
                              <span className="font-bold text-slate-700 dark:text-slate-300">{s.semester_name}</span>
                              <Badge variant="secondary" className="w-fit text-[8px] h-3.5 px-1 bg-slate-100 text-slate-500 uppercase font-black">
                                 {s.status}
                              </Badge>
                           </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-bold text-emerald-600">₹{s.net_payable_fee.toLocaleString()}</span>
                      </TableCell>
                      <TableCell>
                         <div className="flex items-center justify-center gap-4">
                            <PipelineCheckbox label="ADM" checked={s.is_verifiedby_admin} onToggle={(v) => handleUpdateField(s.id, "student_semesters", "is_verifiedby_admin", v)} disabled={updatingId === s.id} />
                            <PipelineCheckbox label="ACC" checked={s.is_verifiedby_accountant} onToggle={(v) => handleUpdateField(s.id, "student_semesters", "is_verifiedby_accountant", v)} disabled={updatingId === s.id} />
                            <PipelineCheckbox label="EXM" checked={s.is_verifiedby_examcell} onToggle={(v) => handleUpdateField(s.id, "student_semesters", "is_verifiedby_examcell", v)} disabled={updatingId === s.id} />
                         </div>
                      </TableCell>
                      <TableCell className="text-center">
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                               <Button variant="outline" size="sm" className="h-7 text-[10px] font-black uppercase rounded-lg border-slate-200 shadow-sm">
                                  {s.promotion_status}
                               </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="rounded-xl">
                               {['Eligible', 'Hold', 'Drop'].map((status) => (
                                 <DropdownMenuItem key={status} onClick={() => handleUpdateField(s.id, "student_semesters", "promotion_status", status)}>
                                    {status === s.promotion_status && <CheckCircle2 className="h-3 w-3 mr-2 text-emerald-500" />}
                                    {status}
                                 </DropdownMenuItem>
                               ))}
                            </DropdownMenuContent>
                         </DropdownMenu>
                      </TableCell>
                      <TableCell className="px-8 text-right font-mono text-[10px] text-slate-400">
                        {format(new Date(s.created_at), 'dd/MM/yyyy')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <InfoCard 
             icon={<ShieldCheck className="text-emerald-500" />} 
             title="Eligibility Protocol" 
             description="Marking 'Eligible' enables self-service registration for upcoming sessions in the student portal." 
           />
           <InfoCard 
             icon={<Lock className="text-rose-500" />} 
             title="Lock Mechanism" 
             description="Locks prevent students from altering bio-data or registration details for that specific term." 
           />
           <InfoCard 
             icon={<Building2 className="text-indigo-500" />} 
             title="Triple-Check" 
             description="Final verification requires Admin, Account, and Exam Cell flags to be synchronized." 
           />
        </div>

      </div>
    </div>
  )
}

// --- Specialized UI Components ---

const PipelineCheckbox: React.FC<{ label: string, checked: boolean, onToggle: (val: boolean) => void, disabled: boolean }> = ({ label, checked, onToggle, disabled }) => (
  <div className="flex flex-col items-center gap-1.5 group/check">
    <div 
      className={cn(
        "h-9 w-9 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer",
        checked ? "bg-emerald-50 border-emerald-500 text-emerald-600 shadow-lg shadow-emerald-500/10" : "bg-white border-slate-200 text-slate-300",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={() => !disabled && onToggle(!checked)}
    >
      {checked ? <CheckCircle2 className="h-5 w-5 fill-emerald-500 text-white" /> : <div className="h-2 w-2 rounded-full bg-slate-200 group-hover/check:bg-slate-300 transition-colors" />}
    </div>
    <span className={cn("text-[9px] font-black tracking-widest", checked ? "text-emerald-600" : "text-slate-400")}>{label}</span>
  </div>
)

const InfoCard: React.FC<{ icon: React.ReactNode, title: string, description: string }> = ({ icon, title, description }) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-start gap-4">
    <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
      {icon}
    </div>
    <div>
      <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">{title}</h4>
      <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
    </div>
  </div>
)

const EditYearDialog: React.FC<{ 
  item: AcademicYearEnrollment, 
  onUpdate: (data: Partial<AcademicYearEnrollment>) => void 
}> = ({ item, onUpdate }) => {
  const [formData, setFormData] = useState({
    total_fee: item.total_fee,
    scholarship_amount: item.scholarship_amount,
    net_payable_fee: item.net_payable_fee,
    payment_plan: item.payment_plan || ""
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md">
            <Edit3 className="h-4 w-4 mr-2" /> Modify Financials
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-[1.5rem] overflow-hidden p-0 border-none shadow-2xl">
        <div className="bg-indigo-600 p-6 text-white">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-indigo-200" /> Financial Adjustment
          </DialogTitle>
          <DialogDescription className="text-indigo-100/70 mt-1">
            Updating record for {item.academic_year_name}
          </DialogDescription>
        </div>
        <div className="p-8 space-y-5 bg-white dark:bg-slate-900">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-400">Standard Base Fee</Label>
            <Input type="number" className="rounded-xl border-slate-200 focus:ring-indigo-500" value={formData.total_fee} onChange={(e) => setFormData({...formData, total_fee: Number(e.target.value)}) } />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-400">Scholarship Benefit</Label>
            <Input type="number" className="rounded-xl border-slate-200 focus:ring-indigo-500" value={formData.scholarship_amount} onChange={(e) => setFormData({...formData, scholarship_amount: Number(e.target.value)}) } />
          </div>
          <div className="space-y-2 p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900">
            <Label className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400">Net Payable Amount</Label>
            <Input type="number" className="bg-transparent border-none text-xl font-black text-indigo-700 dark:text-indigo-300 p-0 focus-visible:ring-0 h-auto" value={formData.net_payable_fee} onChange={(e) => setFormData({...formData, net_payable_fee: Number(e.target.value)}) } />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-400">Payment Structure</Label>
            <Input className="rounded-xl border-slate-200 focus:ring-indigo-500" value={formData.payment_plan} onChange={(e) => setFormData({...formData, payment_plan: e.target.value}) } placeholder="Full Payment / Installments" />
          </div>
        </div>
        <DialogFooter className="p-6 pt-0 bg-white dark:bg-slate-900">
          <Button onClick={() => onUpdate(formData)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-11 font-bold shadow-lg shadow-indigo-600/20">
             <Save className="h-4 w-4 mr-2" /> Commit Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function StudentStatusHistoryPage() {
    return (
        <Suspense fallback={
            <div className="h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        }>
            <StudentStatusHistoryContent />
        </Suspense>
    )
}