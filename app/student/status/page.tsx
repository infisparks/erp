"use client"

import React, { useState, useEffect, useMemo, useCallback, Suspense } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { SupabaseClient } from "@supabase/supabase-js"
import { useSearchParams, useRouter } from 'next/navigation'
import { format } from "date-fns"

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
} from "lucide-react"

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
  course_name: string
  created_at: string
}

// --- Avatar Component ---
const StudentAvatar: React.FC<{ src: string | null, alt: string | null, supabase: SupabaseClient, className?: string }> = ({ src, alt, supabase, className = "h-20 w-20" }) => {
  const publicUrl = useMemo(() => {
    if (!src) return null
    return supabase.storage.from('student_documents').getPublicUrl(src).data.publicUrl
  }, [src, supabase])

  return (
    <Avatar className={`${className} border-2 border-white shadow-lg rounded-xl`}>
      <AvatarImage 
        src={publicUrl || undefined} 
        alt={alt || "Student Photo"} 
        className="rounded-xl object-cover"
      />
      <AvatarFallback className="rounded-xl bg-slate-100 text-slate-400">
        <UserRound className="h-10 w-10" />
      </AvatarFallback>
    </Avatar>
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
          created_at,
          course:courses ( name )
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
        course_name: item.course?.name || "N/A",
        created_at: item.created_at
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

  const toggleStatus = async (enrollmentId: number, field: 'is_locked' | 'is_verified_by_admin', currentValue: boolean) => {
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
            <Card className="border-none shadow-2xl bg-gradient-to-br from-blue-700 to-indigo-800 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <GraduationCap className="h-40 w-40" />
              </div>
              <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8 relative z-10">
                <StudentAvatar src={student.photo_path} alt={student.fullname} supabase={supabase} />
                <div className="flex-1 text-center md:text-left space-y-2">
                  <h2 className="text-3xl font-bold">{student.fullname}</h2>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 text-blue-100">
                    <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                      <History className="h-4 w-4" />
                      <span className="text-sm font-medium">Roll: {student.roll_number}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                      <UserRound className="h-4 w-4" />
                      <span className="text-sm font-medium">{student.email}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center min-w-[150px]">
                  <span className="block text-xs uppercase tracking-widest text-blue-200 font-bold mb-1">Total Enrollments</span>
                  <span className="text-4xl font-black">{history.length}</span>
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
                    <TableHead className="w-[180px]">Academic Year</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead className="text-center">Admin Verified</TableHead>
                    <TableHead className="text-center">Lock Status</TableHead>
                    <TableHead className="text-right">Enrolled Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.length > 0 ? (
                    history.map((item) => (
                      <TableRow key={item.id} className="group hover:bg-slate-50 transition-colors">
                        <TableCell className="font-bold text-slate-700 dark:text-slate-300">
                          <div className="flex flex-col">
                             <span>{item.academic_year_name}</span>
                             <span className="text-[10px] text-slate-400 font-mono tracking-tight">{item.academic_year_session}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600 font-medium text-sm">{item.course_name}</TableCell>
                        
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1.5">
                             <Switch 
                               checked={item.is_verified_by_admin}
                               onCheckedChange={() => toggleStatus(item.id, 'is_verified_by_admin', item.is_verified_by_admin)}
                               disabled={updatingId === item.id}
                             />
                             <div className="flex items-center gap-1">
                                {item.is_verified_by_admin ? (
                                  <Badge className="bg-emerald-500 hover:bg-emerald-600 border-none shadow-sm h-5 text-[9px] uppercase tracking-wider">
                                    <ShieldCheck className="h-3 w-3 mr-1" /> Verified
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="opacity-60 h-5 text-[9px] uppercase tracking-wider italic">
                                    <ShieldAlert className="h-3 w-3 mr-1" /> Pending
                                  </Badge>
                                )}
                             </div>
                          </div>
                        </TableCell>

                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1.5">
                             <Switch 
                               checked={item.is_locked}
                               onCheckedChange={() => toggleStatus(item.id, 'is_locked', item.is_locked)}
                               disabled={updatingId === item.id}
                               className="data-[state=checked]:bg-red-500"
                             />
                             <div className="flex items-center gap-1">
                                {item.is_locked ? (
                                  <Badge variant="destructive" className="h-5 text-[9px] uppercase tracking-wider shadow-sm">
                                    <Lock className="h-2.5 w-2.5 mr-1" /> Locked
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50/50 h-5 text-[9px] uppercase tracking-wider">
                                    <Unlock className="h-2.5 w-2.5 mr-1" /> Editable
                                  </Badge>
                                )}
                             </div>
                          </div>
                        </TableCell>

                        <TableCell className="text-slate-400 text-[10px] text-right font-mono">
                          {format(new Date(item.created_at), 'dd MMM yyyy')}
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
            <Alert className="bg-blue-50 border-blue-100 flex gap-4 items-start py-6">
               <ShieldCheck className="h-6 w-6 text-blue-600 mt-0.5" />
               <div>
                  <AlertTitle className="text-blue-800 font-bold text-lg">Verification Logic</AlertTitle>
                  <AlertDescription className="text-blue-600 text-sm leading-relaxed">
                    Confirming admission for this year makes the enrollment official. Only the highest verified year will be displayed in the primary student directory.
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

export default function StudentStatusHistoryPage() {
    return (
        <Suspense fallback={<StudentDetailLoading />}>
            <StudentStatusHistoryContent />
        </Suspense>
    )
}