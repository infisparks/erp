"use client"

import React, { useState, useEffect, useMemo, useCallback, Suspense } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { SupabaseClient } from "@supabase/supabase-js"
import { useSearchParams, useRouter } from 'next/navigation'
import { format } from "date-fns"
import { toast } from "sonner"

// --- UI Components ---
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// --- Icons ---
import {
  Loader2,
  AlertTriangle,
  UserRound,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  ArrowLeft,
  Calendar,
  History,
  GraduationCap,
  Edit,
  Save,
  CheckCircle2,
  XCircle,
  Building2,
  CreditCard,
  ClipboardList,
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

// --- Avatar Component ---
const StudentAvatar: React.FC<{ src: string | null, alt: string | null, supabase: SupabaseClient, onUpdate?: () => void, className?: string }> = ({ src, alt, supabase, onUpdate, className = "h-20 w-20" }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  
  const isHeic = useMemo(() => {
    const s = src?.toLowerCase() || '';
    return s.endsWith('.heic') || s.endsWith('.heif');
  }, [src]);
  
  const { publicUrl, rawUrl } = useMemo(() => {
    if (!src) return { publicUrl: null, rawUrl: null }
    if (src.startsWith('http')) return { publicUrl: src, rawUrl: src }
    
    const cleanPath = src.replace(/^\/+/, '');
    
    // For standard images, we use getPublicUrl normally
    const { data: rData } = supabase.storage.from('student_documents').getPublicUrl(cleanPath);
    
    if (isHeic) {
      // For HEIC, we use the transformation URL specifically designed to output JPG/WebP
      // This is the universal format fix for candidates with high-efficiency uploads
      const transformUrl = `https://jjldxdgbrkhtjjwpbezk.supabase.co/storage/v1/render/image/public/student_documents/${cleanPath}?width=500&height=500&format=webp&quality=90`
      return { publicUrl: transformUrl, rawUrl: rData.publicUrl }
    }

    return { 
      publicUrl: rData.publicUrl, 
      rawUrl: rData.publicUrl 
    }
  }, [src, isHeic, supabase])

  return (
    <div className="relative group">
      <div className={`${className} bg-slate-900 rounded-3xl p-0.5 border-4 border-white/20 shadow-2xl overflow-hidden relative transition-all duration-500 ring-1 ring-white/10`}>
        {publicUrl && !imgError && (
          <img 
            src={publicUrl} 
            alt={alt || "Student Photo"} 
            className={`h-full w-full object-cover transition-all duration-700 ${imgLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
          />
        )}
        
        {(!imgLoaded || imgError) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-tr from-slate-900 to-blue-900 text-blue-200/40 px-4 text-center">
             <UserRound className={`h-12 w-12 mb-2 transition-all ${imgError ? 'text-rose-500/50 animate-pulse' : 'animate-pulse'}`} />
             <span className="text-[8px] font-black uppercase tracking-[0.2em]">
                {imgError ? 'Format Error' : (isHeic ? 'Optimizing' : 'Loading')}
             </span>
             {imgError && (
                <span className="text-[6px] mt-2 opacity-50 block leading-tight font-medium">Browser cannot render this format natively. Please Update Photo to JPG/PNG.</span>
             )}
          </div>
        )}
      </div>

      <div className="absolute -top-3 -right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 z-50">
        {onUpdate && (
          <Button 
            variant="secondary" 
            size="icon"
            className="h-8 w-8 rounded-xl bg-white text-slate-900 shadow-2xl hover:bg-slate-100 border-none group/btn"
            onClick={onUpdate}
            title="Upload New Photo"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
        {src && (
          <a 
            href={rawUrl || '#'}
            target="_blank" 
            rel="noreferrer"
            className="h-8 w-8 bg-blue-600 rounded-xl shadow-xl flex items-center justify-center hover:bg-blue-700 text-white"
            title="View Raw Storage File"
          >
             <History className="h-4 w-4" />
          </a>
        )}
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
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // --- State for Student Photo Update ---
  const [isUpdatingPhoto, setIsUpdatingPhoto] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handlePhotoUpdate = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !student) return

    try {
      setIsUpdatingPhoto(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `photo_${student.id}_${Date.now()}.${fileExt}`
      const filePath = `profile_photos/${fileName}`

      const { data, error } = await supabase.storage
        .from('student_documents')
        .upload(filePath, file)

      if (error) throw error

      // Update student record
      const { error: updateError } = await supabase
        .from('students')
        .update({ photo_path: filePath })
        .eq('id', student.id)

      if (updateError) throw updateError

      toast.success("Profile photo updated successfully! Refreshing...")
      setTimeout(() => window.location.reload(), 1500)
    } catch (err: any) {
      toast.error(`Update failed: ${err.message}`)
    } finally {
      setIsUpdatingPhoto(false)
    }
  }

  const fetchData = useCallback(async () => {
    if (!studentId) return
    setLoading(true)
    setError(null)
    try {
      // 1. Fetch Student Profile
      const { data: sData, error: sErr } = await supabase
        .from("students")
        .select("id, fullname, roll_number, email, photo_path")
        .eq("id", studentId)
        .single()
      
      if (sErr) throw sErr
      setStudent(sData)

      // 2. Fetch Academic Year History
      const { data: hData, error: hErr } = await supabase
        .from("student_academic_years")
        .select(`
          id,
          academic_year_name,
          academic_year_session,
          is_locked,
          is_verified_by_admin,
          is_verified_by_account,
          is_verified_by_examcell,
          is_eligible_for_next_year,
          created_at,
          total_fee,
          scholarship_amount,
          net_payable_fee,
          payment_plan,
          installment_dates,
          course:courses ( name ),
          scholarship_category:scholarship_categories ( name )
        `)
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })

      if (hErr) throw hErr

      const flattenedHistory = (hData as any[]).map(item => ({
        id: item.id,
        academic_year_name: item.academic_year_name,
        academic_year_session: item.academic_year_session,
        is_locked: item.is_locked,
        is_verified_by_admin: item.is_verified_by_admin,
        is_verified_by_account: item.is_verified_by_account,
        is_verified_by_examcell: item.is_verified_by_examcell,
        is_eligible_for_next_year: item.is_eligible_for_next_year,
        course_name: item.course?.name || "N/A",
        created_at: item.created_at,
        total_fee: item.total_fee || 0,
        scholarship_amount: item.scholarship_amount || 0,
        net_payable_fee: item.net_payable_fee || 0,
        scholarship_category_name: item.scholarship_category?.name || "None",
        payment_plan: item.payment_plan,
        installment_dates: item.installment_dates || []
      }))

      setHistory(flattenedHistory)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [supabase, studentId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const toggleStatus = async (enrollmentId: number, field: string, currentValue: boolean) => {
    setUpdatingId(enrollmentId)
    try {
      const { error } = await supabase
        .from("student_academic_years")
        .update({ [field]: !currentValue })
        .eq("id", enrollmentId)

      if (error) throw error

      setHistory(prev => prev.map(item => 
        item.id === enrollmentId ? { ...item, [field]: !currentValue } : item
      ))
    } catch (err: any) {
      setError(`Failed to update: ${err.message}`)
    } finally {
      setUpdatingId(null)
    }
  }

  const updateYearDetails = async (enrollmentId: number, data: Partial<AcademicYearEnrollment>) => {
    setUpdatingId(enrollmentId)
    try {
      const { error } = await supabase
        .from("student_academic_years")
        .update({
          total_fee: data.total_fee,
          scholarship_amount: data.scholarship_amount,
          net_payable_fee: data.net_payable_fee,
          payment_plan: data.payment_plan
        })
        .eq("id", enrollmentId)

      if (error) throw error

      setHistory(prev => prev.map(item => 
        item.id === enrollmentId ? { ...item, ...data } : item
      ))
    } catch (err: any) {
      setError(`Failed to update details: ${err.message}`)
    } finally {
      setUpdatingId(null)
    }
  }

  if (!studentId) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-slate-500 gap-4">
        <AlertTriangle className="h-12 w-12 text-amber-500" />
        <h2 className="text-xl font-bold">No Student ID Provided</h2>
        <Button onClick={() => router.back()} variant="outline">Go Back</Button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()}
          className="rounded-full hover:bg-white shadow-sm"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Academic Journey
          </h1>
          <p className="text-slate-500">Manage enrollment verification and data locking history</p>
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <p className="text-slate-500">Retrieving student records...</p>
        </div>
      ) : error ? (
        <Alert variant="destructive" className="shadow-lg border-red-200">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Data Fetch Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <>
          {/* --- Executive Profile Header --- */}
          {student && (
            <Card className="border-none shadow-2xl bg-gradient-to-br from-indigo-900 via-blue-900 to-indigo-900 text-white overflow-hidden relative min-h-[180px]">
              {/* Cinematic Background Decoration */}
              <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-10 -translate-y-10">
                <GraduationCap className="h-64 w-64 text-blue-400 rotate-12" />
              </div>
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
              
              <CardContent className="p-8 flex flex-col md:flex-row items-center gap-10 relative z-10 h-full">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/jpeg,image/png,image/jpg" 
                  onChange={handlePhotoUpdate}
                />
                <StudentAvatar 
                  src={student.photo_path} 
                  alt={student.fullname} 
                  supabase={supabase} 
                  className="h-32 w-32 md:h-36 md:w-36"
                  onUpdate={() => fileInputRef.current?.click()}
                />
                
                <div className="flex-1 text-center md:text-left space-y-4">
                  <div>
                     <h2 className="text-4xl font-black tracking-tight">{student.fullname}</h2>
                     <span className="text-blue-300 font-mono text-sm tracking-widest uppercase opacity-75">{student.roll_number}</span>
                  </div>
                  
                  <div className="flex flex-wrap justify-center md:justify-start gap-3">
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-xl backdrop-blur-md">
                      <UserRound className="h-4 w-4 text-blue-300" />
                      <span className="text-xs font-semibold tracking-tight">{student.email}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-xl backdrop-blur-md">
                      <History className="h-4 w-4 text-emerald-400" />
                      <span className="text-xs font-semibold tracking-tight">System ID: #{student.id}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 text-center min-w-[180px] shadow-sm transform hover:scale-105 transition-transform">
                  <span className="block text-[10px] uppercase tracking-[0.2em] text-blue-300 font-black mb-2 opacity-60">Academic Milestones</span>
                  <div className="flex items-baseline justify-center gap-1">
                     <span className="text-5xl font-black text-white">{history.length}</span>
                     <span className="text-xs uppercase text-blue-400 font-bold tracking-tighter italic">Stages</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* --- History Management Grid --- */}
          <Card className="border-none shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
            <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-800/50">
              <CardTitle className="text-xl flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <Calendar className="h-5 w-5 text-blue-600" />
                Enrollment History & Status
              </CardTitle>
              <CardDescription>Toggle verification and locking for each academic year record.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent text-xs uppercase tracking-tighter">
                    <TableHead className="w-[200px]">Academic Year</TableHead>
                    <TableHead>Course Details</TableHead>
                    <TableHead className="text-center">Verification Pipeline (Multi-Stage)</TableHead>
                    <TableHead className="text-center w-[120px]">Record Status</TableHead>
                    <TableHead className="text-right">History</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.length > 0 ? (
                    history.map((item) => (
                      <TableRow key={item.id} className="group hover:bg-slate-50 transition-colors">
                        <TableCell className="font-bold text-slate-700 dark:text-slate-300">
                          <div className="flex flex-col">
                             <div className="flex items-center gap-1.5">
                                <span>{item.academic_year_name}</span>
                                <EditYearDialog item={item} onUpdate={(data) => updateYearDetails(item.id, data)} />
                             </div>
                             <span className="text-[10px] text-slate-400 font-mono tracking-tight">{item.academic_year_session}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600 font-medium text-sm">
                           <div className="flex flex-col gap-1">
                              <span className="font-bold">{item.course_name}</span>
                              <div className="flex items-center gap-2">
                                 <Badge variant="outline" className="text-[9px] h-4 py-0 px-1.5 uppercase font-bold text-blue-500 border-blue-100 bg-blue-50">
                                    {item.scholarship_category_name || "Self-Financed"}
                                 </Badge>
                                 <span className="text-[10px] text-slate-400 font-semibold tracking-tight">Fee: ₹{item.net_payable_fee.toLocaleString()}</span>
                              </div>
                              <div className="mt-1.5 pt-1.5 border-t border-slate-50 flex flex-col gap-1">
                                 <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                    {item.payment_plan === 'Installment' ? (
                                      <Badge variant="secondary" className="bg-amber-50 text-amber-600 border-amber-100 flex items-center gap-1 text-[8px] h-4 py-0 font-black">
                                         <Calendar className="h-2 w-2" /> {item.payment_plan}
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-slate-400 border-slate-100 flex items-center gap-1 text-[8px] h-4 py-0 font-medium">
                                         <CreditCard className="h-2 w-2" /> {item.payment_plan || 'One Time'}
                                      </Badge>
                                    )}
                                 </div>
                                 {item.payment_plan === 'Installment' && item.installment_dates && item.installment_dates.length > 0 && (
                                   <div className="bg-slate-50/50 p-1.5 rounded-lg border border-slate-100/50 space-y-1 mt-0.5">
                                      {item.installment_dates.map((inst: any, idx: number) => (
                                         <div key={idx} className="flex justify-between items-center text-[9px] font-mono leading-none">
                                            <span className="text-slate-400 italic">#{idx+1} {inst.date ? inst.date : 'N/A'}</span>
                                            <span className="font-bold text-slate-600">₹{Number(inst.amount).toLocaleString()}</span>
                                         </div>
                                      ))}
                                   </div>
                                 )}
                              </div>
                           </div>
                        </TableCell>
                        
                        <TableCell>
                           <div className="grid grid-cols-3 gap-2 max-w-[300px] mx-auto">
                              <VerificationSwitch 
                                label="Admin" 
                                icon={<ShieldCheck className="h-3 w-3" />} 
                                checked={item.is_verified_by_admin} 
                                onToggle={() => toggleStatus(item.id, 'is_verified_by_admin', item.is_verified_by_admin)}
                                disabled={updatingId === item.id}
                              />
                              <VerificationSwitch 
                                label="Account" 
                                icon={<CreditCard className="h-3 w-3" />} 
                                checked={item.is_verified_by_account} 
                                onToggle={() => toggleStatus(item.id, 'is_verified_by_account', item.is_verified_by_account)}
                                disabled={updatingId === item.id}
                              />
                              <VerificationSwitch 
                                label="Exam" 
                                icon={<ClipboardList className="h-3 w-3" />} 
                                checked={item.is_verified_by_examcell} 
                                onToggle={() => toggleStatus(item.id, 'is_verified_by_examcell', item.is_verified_by_examcell)}
                                disabled={updatingId === item.id}
                              />
                           </div>
                        </TableCell>

                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-3">
                             {/* Eligibility Toggle */}
                             <div className="flex flex-col items-center gap-1">
                                <Switch 
                                  checked={item.is_eligible_for_next_year}
                                  onCheckedChange={() => toggleStatus(item.id, 'is_eligible_for_next_year', item.is_eligible_for_next_year)}
                                  disabled={updatingId === item.id}
                                  className="scale-75 data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-rose-600"
                                />
                                {item.is_eligible_for_next_year ? (
                                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 h-4 px-1 text-[7px] uppercase tracking-tighter font-black">
                                    Eligible
                                  </Badge>
                                ) : (
                                  <Badge className="bg-rose-50 text-rose-700 border-rose-100 h-4 px-1 text-[7px] uppercase tracking-tighter font-black">
                                    Blocked
                                  </Badge>
                                )}
                             </div>

                             {/* Lock Toggle */}
                             <div className="flex flex-col items-center gap-1">
                                <Switch 
                                  checked={item.is_locked}
                                  onCheckedChange={() => toggleStatus(item.id, 'is_locked', item.is_locked)}
                                  disabled={updatingId === item.id}
                                  className="scale-75 data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-slate-300"
                                />
                                {item.is_locked ? (
                                  <Badge className="bg-blue-50 text-blue-700 border-blue-100 h-4 px-1 text-[7px] uppercase font-black">
                                    <Lock className="h-2 w-2 mr-1" /> Locked
                                  </Badge>
                                ) : (
                                  <Badge className="bg-slate-50 text-slate-500 border-slate-100 h-4 px-1 text-[7px] uppercase font-black">
                                    <Unlock className="h-2 w-2 mr-1" /> Open
                                  </Badge>
                                )}
                             </div>
                          </div>
                        </TableCell>

                        <TableCell className="text-slate-400 text-[10px] text-right font-mono">
                          {format(new Date(item.created_at), 'dd MMM yy')}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-64 text-center">
                         <div className="flex flex-col items-center gap-2 text-slate-400">
                            <History className="h-10 w-10 opacity-20" />
                            <p>No enrollment history found for this student.</p>
                         </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* --- Admin Guidelines --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Alert className="bg-emerald-50 border-emerald-100 flex gap-4 items-start py-6">
               <ShieldCheck className="h-6 w-6 text-emerald-600 mt-0.5" />
               <div>
                  <AlertTitle className="text-emerald-800 font-bold text-lg">Next-Year Eligibility</AlertTitle>
                  <AlertDescription className="text-emerald-600 text-sm leading-relaxed">
                    Setting this to 'Eligible' (Green) allows the student to register themselves for the next academic year session.
                  </AlertDescription>
               </div>
            </Alert>
            <Alert className="bg-rose-50 border-rose-100 flex gap-4 items-start py-6">
               <Lock className="h-6 w-6 text-rose-600 mt-0.5" />
               <div>
                  <AlertTitle className="text-rose-800 font-bold text-lg">Data Integrity Lock</AlertTitle>
                  <AlertDescription className="text-rose-600 text-sm leading-relaxed">
                    Locking a year restricts the student from modifying their self-registration or profile data associated with that specific academic term.
                  </AlertDescription>
               </div>
            </Alert>
          </div>
        </>
      )}
    </div>
  )
}

const StudentDetailLoading = () => (
    <div className="p-8 flex items-center justify-center min-h-[500px] gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-lg font-medium text-slate-600 tracking-tight">Accessing Academic Archives...</p>
    </div>
)


// --- New Helper Components ---

const VerificationSwitch: React.FC<{ 
  label: string, 
  icon: React.ReactNode, 
  checked: boolean, 
  onToggle: () => void, 
  disabled: boolean 
}> = ({ label, icon, checked, onToggle, disabled }) => (
  <div className="flex flex-col items-center gap-1 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700 min-w-[70px]">
    <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
       {icon} {label}
    </span>
    <Switch 
      checked={checked} 
      onCheckedChange={onToggle}
      disabled={disabled}
      className="scale-75 data-[state=checked]:bg-emerald-500"
    />
    {checked ? (
      <span className="text-[8px] text-emerald-600 font-black uppercase">Ok</span>
    ) : (
      <span className="text-[8px] text-rose-400 font-black uppercase">Wait</span>
    )}
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

  const handleSave = () => {
    onUpdate(formData);
  };

  return (
    <Dialog shadow-2xl>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-4 w-4 rounded-full text-blue-500 hover:text-blue-700">
           <Edit className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white border-2 border-blue-100 shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-900">
            <ClipboardList className="h-5 w-5" />
            Edit Enrollment Details
          </DialogTitle>
          <DialogDescription>
            Update the financial and scholarship data for {item.academic_year_name}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-xs">Base Fee</Label>
            <Input 
              type="number"
              className="col-span-3 h-8 text-sm" 
              value={formData.total_fee} 
              onChange={(e) => setFormData({...formData, total_fee: Number(e.target.value)}) }
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-xs">Benefit Amt</Label>
            <Input 
              type="number"
              className="col-span-3 h-8 text-sm" 
              value={formData.scholarship_amount} 
              onChange={(e) => setFormData({...formData, scholarship_amount: Number(e.target.value)}) }
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-xs font-bold text-emerald-600">Payable</Label>
            <Input 
              type="number"
              className="col-span-3 h-8 text-sm font-bold" 
              value={formData.net_payable_fee} 
              onChange={(e) => setFormData({...formData, net_payable_fee: Number(e.target.value)}) }
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-xs">Plan</Label>
            <Input 
              className="col-span-3 h-8 text-sm" 
              value={formData.payment_plan} 
              onChange={(e) => setFormData({...formData, payment_plan: e.target.value}) }
              placeholder="Full, Installment..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 w-full rounded-xl">
             <Save className="h-4 w-4 mr-2" /> Update Record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function StudentStatusHistoryPage() {
    return (
        <Suspense fallback={<StudentDetailLoading />}>
            <StudentStatusHistoryContent />
        </Suspense>
    )
}