"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"
import { SupabaseClient } from "@supabase/supabase-js"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  ColumnFiltersState,
  SortingState,
  getSortedRowModel,
} from "@tanstack/react-table"
import { format, parseISO } from "date-fns" // For date formatting

// --- ShadCN UI Components ---
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

// --- Icons ---
import {
  Search,
  AlertTriangle,
  UserRound,
  Loader2,
  XCircle,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  DollarSign, // For Fees
  Filter,
  RotateCw, // For Promotion
  CheckCircle, // For Status
  FileSpreadsheet, // NEW: For Excel Download
  ListTodo, // NEW: For Fees Detail
  ClipboardList, // NEW: For Edit/View Detail
  Menu, // General Action Icon
  CheckSquare, // ✅ NEW: For Registration
  Lock,
  Unlock,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react"

// --- PrimeReact Components ---
import { Dropdown } from "primereact/dropdown"

// --- Type Definitions ---
interface StudentEnrollment {
  enrollment_id: number; // student_academic_years.id
  student_id: number;    // students.id
  academic_year_id: number; // student_academic_years.id
  fullname: string | null
  email: string | null
  roll_number: string | null
  photo_path: string | null
  course_name: string
  academic_year_name: string
  academic_year_session: string
  is_registered: boolean
  is_verifiedby_admin: boolean // from students
  is_verifiedby_accountant: boolean // from students
  is_verifiedby_examcell: boolean // from students
  is_locked: boolean
  sequence: number // From academic_years
  semester_name: string
  active_semester_id: number | null
  is_admission_verified: boolean
  is_enrollment_verified: boolean
}

// For filters
interface Stream {
  id: string
  name: string
}
interface Course {
  id: string
  name: string
  stream_id: string
}
interface AcademicYear {
  id: string
  name: string
  course_id: string
  sequence: number
}

// -------------------------------------------------------------------
// 🚀 Reusable Helper Components 🚀
// -------------------------------------------------------------------

// --- Helper Functions ---
const sortByName = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name, undefined, { numeric: true })

// --- Avatar Component ---
const StudentAvatar: React.FC<{ src: string | null, alt: string | null, supabase: SupabaseClient, className?: string }> = ({ src, alt, supabase, className = "h-10 w-10" }) => {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  
  const isHeic = useMemo(() => {
    const s = src?.toLowerCase() || '';
    return s.endsWith('.heic') || s.endsWith('.heif');
  }, [src]);
  
  const publicUrl = useMemo(() => {
    if (!src) return null
    if (src.startsWith('http')) return src
    
    const cleanPath = src.replace(/^\/+/, '');
    
    if (isHeic) {
      // Specialized transformation for HEIC support in browsers
      return `https://jjldxdgbrkhtjjwpbezk.supabase.co/storage/v1/render/image/public/student_documents/${cleanPath}?width=200&height=200&format=webp&quality=80`
    }
    
    // Official public URL for standard formats
    const { data } = supabase.storage.from('student_documents').getPublicUrl(cleanPath);
    return data.publicUrl;
  }, [src, isHeic, supabase])

  return (
    <Avatar className={`${className} bg-slate-900 ring-1 ring-white/10`}>
      {publicUrl && !imgError && (
        <AvatarImage 
          src={publicUrl} 
          alt={alt || "Student Photo"} 
          className={`object-cover transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`} 
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
        />
      )}
      <AvatarFallback className="bg-muted">
        <UserRound className="h-5 w-5 text-muted-foreground" />
      </AvatarFallback>
    </Avatar>
  )
}

// --- Helper Dropdown Component (Using PrimeReact Dropdown for feature parity) ---
const DropdownSelect: React.FC<{
  label: string
  value: string | null
  onChange: (value: string | null) => void
  options: { id: string; name: string }[]
  placeholder: string
  disabled?: boolean
}> = ({ label, value, onChange, options, placeholder, disabled = false }) => (
  <div className="space-y-1">
    <Label className="font-semibold">{label}</Label>
    <Dropdown
      value={value}
      options={options.map((opt) => ({ label: opt.name, value: opt.id }))}
      onChange={(e) => onChange(e.value)}
      placeholder={placeholder}
      className="w-full"
      filter
      disabled={disabled}
    />
  </div>
)

// -------------------------------------------------------------------
// 💰 Main Fees Management Page Component 💰
// -------------------------------------------------------------------

export default function StudentManagementPage() {
  const supabase = getSupabaseClient()

  // --- Page State ---
  const [students, setStudents] = useState<StudentEnrollment[]>([])
  const [loading, setLoading] = useState(false) // Set to false initially, fetchStudents handles it
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  // --- Table State ---
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [sorting, setSorting] = useState<SortingState>([
    { id: "fullname", desc: false },
  ])

  // --- Search State ---
  const [studentSearch, setStudentSearch] = useState("")
  const [rollNumberSearch, setRollNumberSearch] = useState("")

  // --- Filter States ---
  const [selectedStream, setSelectedStream] = useState<string | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<
    string | null
  >(null)
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null)

  const [allStreams, setAllStreams] = useState<Stream[]>([])
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [allAcademicYears, setAllAcademicYears] = useState<AcademicYear[]>([])

  const [loadingFilters, setLoadingFilters] = useState(true)

  // --- Memoized Filter Options ---
  const streamOptions = useMemo(
    () => allStreams.sort(sortByName),
    [allStreams],
  )

  const courseOptions = useMemo(() => {
    if (!selectedStream) return []
    return allCourses
      .filter((c) => c.stream_id === selectedStream)
      .sort(sortByName)
  }, [allCourses, selectedStream])

  const academicYearOptions = useMemo(() => {
    if (!selectedCourse) return []
    return allAcademicYears
      .filter((ay) => ay.course_id === selectedCourse)
      .sort((a, b) => a.sequence - b.sequence) // Sort by sequence
  }, [allAcademicYears, selectedCourse])

  // --- Data Fetching (Students) ---
  const fetchStudents = useCallback(
    async (
      nameQuery: string,
      rollQuery: string,
      shouldApplyFilters: boolean = true,
    ) => {
      setLoading(true)
      setStatusMessage(null)
      setError(null)

      try {
        let query = supabase
          .from("students")
          .select(
            `
            id,
            fullname,
            email,
            photo_path,
            roll_number,
            is_locked,
            is_verifiedby_admin,
            is_verifiedby_accountant,
            is_verifiedby_examcell,
            discipline,
            admission_year,
            course:courses ( id, name ),
            current_semester_details:semesters!current_sem_id ( 
              id, 
              name, 
              academic_year:academic_years ( name ) 
            ),
            active_semesters:student_semesters (
              id,
              is_verifiedby_admin,
              is_verifiedby_accountant,
              is_verifiedby_examcell,
              status
            ),
            enrollments:student_academic_years (
              id,
              academic_year_name,
              academic_year_session,
              is_registered
            )
            `,
          )
          .order("created_at", { ascending: false })

        // --- Filter Logic ---
        if (shouldApplyFilters) {
          if (selectedStream && !selectedCourse) {
            const { data: courseIdsData } = await supabase
              .from("courses")
              .select("id")
              .eq("stream_id", selectedStream)
            const courseIds = courseIdsData?.map((c: { id: string }) => c.id) || []
            if (courseIds.length > 0) query = query.in("course_id", courseIds)
          }

          if (selectedCourse) {
            query = query.eq("course_id", selectedCourse)
          }

          if (selectedAcademicYear) {
             // If searching by specific year, we might need a more complex subquery or just filter flattened data
          }
        }

        // --- Search Queries ---
        if (nameQuery) query = query.ilike("student.fullname", `%${nameQuery}%`)
        if (rollQuery) query = query.ilike("student.roll_number", `%${rollQuery}%`)

        const { data, error } = await query
        if (error) throw error

        if (data) {
          // Flatten and extract latest enrollment info
          const flattenedData: StudentEnrollment[] = data.map((item: any) => {
            const latestEnroll = item.enrollments?.length > 0 ? item.enrollments[0] : null;
            
              const activeSem = item.active_semesters?.find((s: any) => s.status === 'active');
              
              const isAdmissionVerified = (item.is_verifiedby_admin && item.is_verifiedby_accountant && item.is_verifiedby_examcell);
              const isEnrollmentVerified = activeSem ? (activeSem.is_verifiedby_admin && activeSem.is_verifiedby_accountant && activeSem.is_verifiedby_examcell) : false;
            
            return {
              enrollment_id: latestEnroll?.id || 0,
              student_id: item.id,
              academic_year_id: latestEnroll?.id || 0,
              active_semester_id: activeSem?.id || null,
              fullname: item.fullname,
              email: item.email,
              roll_number: item.roll_number,
              photo_path: item.photo_path,
              course_name: item.course?.name || "N/A",
              academic_year_name: latestEnroll?.academic_year_name || item.current_semester_details?.academic_year?.name || "N/A",
              academic_year_session: latestEnroll?.academic_year_session || (item.admission_year || "N/A"),
              // Prioritize semester verification for the verification columns
              is_verifiedby_admin: (activeSem ? activeSem.is_verifiedby_admin : item.is_verifiedby_admin) ?? false,
              is_verifiedby_accountant: (activeSem ? activeSem.is_verifiedby_accountant : item.is_verifiedby_accountant) ?? false,
              is_verifiedby_examcell: (activeSem ? activeSem.is_verifiedby_examcell : item.is_verifiedby_examcell) ?? false,
              
              is_admission_verified: isAdmissionVerified,
              is_enrollment_verified: isEnrollmentVerified,
              is_registered: latestEnroll?.is_registered || !!activeSem,
              is_locked: item.is_locked ?? false,
              sequence: 0, 
              semester_name: item.current_semester_details?.name || "N/A"
            }
          })

          setStudents(flattenedData)

          if (flattenedData.length === 0 && (shouldApplyFilters || nameQuery || rollQuery)) {
            setStatusMessage({
              type: "error",
              message: "No students found matching the selected criteria.",
            })
          }
        }
      } catch (err: any) {
        console.error("Error fetching students:", err)
        setError(err.message || "An error occurred while fetching students.")
      } finally {
        setLoading(false)
      }
    },
    [
      supabase,
      selectedStream,
      selectedCourse,
      selectedAcademicYear,
      selectedSemester,
      allAcademicYears,
    ],
  )

  // --- Initial Config Fetch (Filters) ---
  useEffect(() => {
    const fetchAllConfig = async () => {
      setLoadingFilters(true)
      try {
        const [streamData, courseData, ayData] = await Promise.all([
          supabase.from("streams").select("*"),
          supabase.from("courses").select("*"),
          supabase.from("academic_years").select("id, name, course_id, sequence"),
        ])

        if (streamData.data) setAllStreams(streamData.data as Stream[])
        if (courseData.data) setAllCourses(courseData.data as Course[])
        if (ayData.data) setAllAcademicYears(ayData.data as AcademicYear[])

        const errors = [
          streamData.error,
          courseData.error,
          ayData.error,
        ].filter(Boolean)
        if (errors.length > 0) {
          throw new Error(errors.map((e) => (e as Error).message).join(", "))
        }
      } catch (error: any) {
        console.error("Error fetching filter config:", error)
        setError("Failed to load filter configuration options.")
      } finally {
        setLoadingFilters(false)
      }
    }
    fetchAllConfig()
  }, [supabase])

  // --- Initial data load ---
  useEffect(() => {
    if (!loadingFilters) {
      // Load initial list (no filters, no search)
      fetchStudents("", "", false)
    }
  }, [fetchStudents, loadingFilters])

  // --- Filter Handlers ---
  const handleStreamChange = (value: string | null) => {
    setSelectedStream(value)
    setSelectedCourse(null)
    setSelectedAcademicYear(null)
    setSelectedSemester(null)
  }

  const handleCourseChange = (value: string | null) => {
    setSelectedCourse(value)
    setSelectedAcademicYear(null)
    setSelectedSemester(null)
  }

  const handleAcademicYearChange = (value: string | null) => {
    setSelectedAcademicYear(value)
    setSelectedSemester(null)
  }

  const handleSemesterChange = (value: string | null) => {
    setSelectedSemester(value)
  }

  // --- Search and Action Handlers ---
  const handleFilterSearch = () => {
    // Triggers a refetch with current filters and search terms
    fetchStudents(studentSearch, rollNumberSearch, true)
  }

  const handleFilterClear = () => {
    setSelectedStream(null)
    setSelectedCourse(null)
    setSelectedAcademicYear(null)
    setStudentSearch("")
    setRollNumberSearch("")
    setGlobalFilter("")

    // Refetch the default list (no filters, no search)
    fetchStudents("", "", false)
  }

  // --- NEW: Excel Export Handler ---
  const handleExportToExcel = () => {
    if (students.length === 0) {
      setStatusMessage({
        type: "error",
        message:
          "No data to export. Please filter and search for students first.",
      })
      return
    }

    // In a real application, you would use a library like `xlsx` (SheetJS)
    // or call an API endpoint to generate a file server-side.
    console.log("Exporting current students to Excel:", students)

    // Placeholder logic for demonstration:
    const headers = [
      "Full Name",
      "Email",
      "Roll Number",
      "Course",
      "Academic Year",
      "Admin Verified",
      "Account Verified",
      "Exam Cell Verified",
    ]
    const csvContent = [
      headers.join(","),
      ...students.map((s) =>
        [
          `"${s.fullname}"`,
          s.email,
          s.roll_number,
          `"${s.course_name}"`,
          `"${s.academic_year_name} (${s.academic_year_session})"`,
          s.is_verifiedby_admin ? "YES" : "NO",
          s.is_verifiedby_accountant ? "YES" : "NO",
          s.is_verifiedby_examcell ? "YES" : "NO",
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute(
        "download",
        "student_management_export_" +
          new Date().toISOString().slice(0, 10) +
          ".csv",
      )
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setStatusMessage({
        type: "success",
        message: `Successfully exported ${students.length} records to CSV/Excel.`,
      })
    } else {
      setStatusMessage({
        type: "error",
        message:
          "Your browser does not support automatic downloads. Please copy the data manually.",
      })
    }
  }

  // --- NEW: Toggle Status Handler ---
  const toggleStatus = async (
    studentId: number,
    field: "is_verifiedby_admin" | "is_verifiedby_accountant" | "is_verifiedby_examcell" | "is_locked",
    currentValue: boolean,
    semesterId: number | null = null // New parameter
  ) => {
    try {
      setLoading(true)
      
      let updateError;

      if (semesterId && field !== "is_locked") {
        // Update the semester record if we have one
        const { error } = await supabase
          .from("student_semesters")
          .update({ [field]: !currentValue })
          .eq("id", semesterId)
        updateError = error;
      } else {
        // Fallback to student record
        const { error } = await supabase
          .from("students")
          .update({ [field]: !currentValue })
          .eq("id", studentId)
        updateError = error;
      }

      if (updateError) throw updateError

      // Optimistically update the UI
      setStudents((prev) =>
        prev.map((s) => {
          if (s.student_id === studentId) {
            return { ...s, [field]: !currentValue }
          }
          return s
        }),
      )

      setStatusMessage({
        type: "success",
        message: `Successfully ${!currentValue ? "enabled" : "disabled"} ${field.replace("is_", "").replace("_", " ")}.`,
      })
    } catch (err: any) {
      console.error("Error updating status:", err)
      setError(err.message || "Failed to update status")
    } finally {
      setLoading(false)
    }
  }

  // --- Table Columns Definition ---
  const columns: ColumnDef<StudentEnrollment>[] = [
    {
      accessorKey: "fullname",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Student
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const student = row.original

        return (
          <div className="flex items-center gap-3">
            <StudentAvatar
              src={student.photo_path}
              alt={student.fullname}
              supabase={supabase}
            />
            <div className="flex flex-col gap-1">
              <div className="font-medium">{student.fullname || "N/A"}</div>
              <div className="text-[10px] text-muted-foreground">
                {student.email}
              </div>

              {/* --- Conditional Badges --- */}
              {!student.is_admission_verified && (
                <Badge variant="destructive" className="h-[18px] text-[9px] uppercase font-black w-fit">
                  Admission Verification Pending
                </Badge>
              )}
              {!student.is_enrollment_verified && (
                <Badge variant="secondary" className="h-[18px] text-[9px] uppercase font-black bg-amber-500 hover:bg-amber-600 text-white border-none w-fit">
                  Enrollment Verification Pending
                </Badge>
              )}
              {student.is_admission_verified && student.is_enrollment_verified && (
                <Badge variant="default" className="h-[18px] text-[9px] uppercase font-black bg-green-600 hover:bg-green-700 w-fit">
                  Verification Complete
                </Badge>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "roll_number",
      header: "Roll Number",
    },
    {
      accessorKey: "academic_year_name",
      header: "Current Enrollment",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.course_name}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.academic_year_name}
          </div>
          <div className="text-xs font-semibold text-indigo-600">
            {row.original.semester_name}
          </div>
          <div className="text-xs text-muted-foreground">
            {row.original.academic_year_session}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "is_verifiedby_admin",
      header: "Admin",
      cell: ({ row }) => (
        <button
          onClick={() => toggleStatus(row.original.student_id, "is_verifiedby_admin", row.original.is_verifiedby_admin, row.original.active_semester_id)}
          disabled={loading}
          className="hover:scale-105 transition-transform"
        >
          <Badge
            variant={row.original.is_verifiedby_admin ? "default" : "destructive"}
            className="flex w-fit items-center gap-1 capitalize cursor-pointer"
          >
            {row.original.is_verifiedby_admin ? (
              <ShieldCheck className="h-3 w-3" />
            ) : (
              <ShieldAlert className="h-3 w-3" />
            )}
            {row.original.is_verifiedby_admin ? "Verified" : "Pending"}
          </Badge>
        </button>
      ),
    },
    {
      accessorKey: "is_verifiedby_accountant",
      header: "Account",
      cell: ({ row }) => (
        <button
          onClick={() => toggleStatus(row.original.student_id, "is_verifiedby_accountant", row.original.is_verifiedby_accountant, row.original.active_semester_id)}
          disabled={loading}
          className="hover:scale-105 transition-transform"
        >
          <Badge
            variant={row.original.is_verifiedby_accountant ? "secondary" : "destructive"}
            className="flex w-fit items-center gap-1 capitalize cursor-pointer"
          >
            {row.original.is_verifiedby_accountant ? (
              <DollarSign className="h-3 w-3" />
            ) : (
              <ShieldAlert className="h-3 w-3" />
            )}
            {row.original.is_verifiedby_accountant ? "Approved" : "Pending"}
          </Badge>
        </button>
      ),
    },
    {
      accessorKey: "is_verifiedby_examcell",
      header: "Exam Cell",
      cell: ({ row }) => (
        <button
          onClick={() => toggleStatus(row.original.student_id, "is_verifiedby_examcell", row.original.is_verifiedby_examcell, row.original.active_semester_id)}
          disabled={loading}
          className="hover:scale-105 transition-transform"
        >
          <Badge
            variant={row.original.is_verifiedby_examcell ? "secondary" : "destructive"}
            className="flex w-fit items-center gap-1 capitalize cursor-pointer"
          >
            {row.original.is_verifiedby_examcell ? (
              <CheckSquare className="h-3 w-3" />
            ) : (
              <ShieldAlert className="h-3 w-3" />
            )}
            {row.original.is_verifiedby_examcell ? "Verified" : "Pending"}
          </Badge>
        </button>
      ),
    },
    {
      accessorKey: "is_locked",
      header: "Profile",
      cell: ({ row }) => (
        <button
          onClick={() => toggleStatus(row.original.student_id, "is_locked", row.original.is_locked)}
          disabled={loading}
          className="hover:scale-105 transition-transform"
        >
          <Badge
            variant={row.original.is_locked ? "destructive" : "secondary"}
            className="flex w-fit items-center gap-1 capitalize cursor-pointer"
          >
            {row.original.is_locked ? (
              <Lock className="h-3 w-3" />
            ) : (
              <Unlock className="h-3 w-3" />
            )}
            {row.original.is_locked ? "Locked" : "Unlocked"}
          </Badge>
        </button>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const student = row.original
        
        // --- ✅ NEW: Check for registration pending ---
        const isRegistrationPending = !student.is_registered

        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <Menu className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                
                {/* --- ✅ NEW: Conditional Registration Button --- */}
                {isRegistrationPending && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link 
                        href={`/management/students/registration?student_id=${student.student_id}`} 
                        className="flex items-center text-red-600 hover:!text-red-700 font-medium"
                      >
                        <CheckSquare className="mr-2 h-4 w-4" />
                        <span>Complete Registration</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}

                {/* 1. Add / View Payments */}
                <DropdownMenuItem asChild>
                  <Link
                    href={`/management/students/fees/add?student_id=${student.student_id}`}
                    className="flex items-center"
                  >
                    <DollarSign className="mr-2 h-4 w-4" />
                    <span>Add / View Payments</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {/* 2. Fees Detail */}
                <DropdownMenuItem asChild>
                  <Link
                    href={`/management/students/fees/detail?student_id=${student.student_id}`}
                    className="flex items-center"
                  >
                    <ListTodo className="mr-2 h-4 w-4" />
                    <span>Fees Detail</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {/* 3. Promotion Management */}
                <DropdownMenuItem asChild>
                  <Link
                    href={`/management/students/promotion?student_id=${student.student_id}`}
                    className="flex items-center"
                  >
                    <RotateCw className="mr-2 h-4 w-4" />
                    <span>Manage Promotion</span>
                  </Link>
                </DropdownMenuItem>
                {/* 4. Status Management */}
                <DropdownMenuItem asChild>
                  <Link
                    href={`/management/students/status?student_id=${student.student_id}`}
                    className="flex items-center"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    <span>Manage Status</span>
                  </Link>
                </DropdownMenuItem>
                {/* 5. Edit/View Detail */}
                <DropdownMenuItem asChild>
                  <Link
                    href={`/management/students/form/detail?student_id=${student.student_id}&mode=view`}
                    className="flex items-center"
                  >
                    <ClipboardList className="mr-2 h-4 w-4" />
                    <span>Edit/View Detail</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* --- Admin Quick Verify --- */}
                <DropdownMenuItem
                  onClick={() => toggleStatus(student.student_id, "is_verifiedby_admin", student.is_verifiedby_admin)}
                  className="flex items-center cursor-pointer"
                >
                  {student.is_verifiedby_admin ? (
                    <>
                      <ShieldAlert className="mr-2 h-4 w-4" />
                      Unverify (Admin)
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Verify (Admin)
                    </>
                  )}
                </DropdownMenuItem>

                {/* --- Accountant Quick Verify --- */}
                <DropdownMenuItem
                  onClick={() => toggleStatus(student.student_id, "is_verifiedby_accountant", student.is_verifiedby_accountant)}
                  className="flex items-center cursor-pointer"
                >
                  {student.is_verifiedby_accountant ? (
                    <>
                      <ShieldAlert className="mr-2 h-4 w-4" />
                      Unverify (Accountant)
                    </>
                  ) : (
                    <>
                      <DollarSign className="mr-2 h-4 w-4" />
                      Verify (Accountant)
                    </>
                  )}
                </DropdownMenuItem>

                {/* --- Exam Cell Quick Verify --- */}
                <DropdownMenuItem
                  onClick={() => toggleStatus(student.student_id, "is_verifiedby_examcell", student.is_verifiedby_examcell)}
                  className="flex items-center cursor-pointer"
                >
                  {student.is_verifiedby_examcell ? (
                    <>
                      <ShieldAlert className="mr-2 h-4 w-4" />
                      Unverify (Exam Cell)
                    </>
                  ) : (
                    <>
                      <CheckSquare className="mr-2 h-4 w-4" />
                      Verify (Exam Cell)
                    </>
                  )}
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* --- Profile Lock Controls --- */}
                <DropdownMenuItem
                  onClick={() => toggleStatus(student.student_id, "is_locked", student.is_locked)}
                  className="flex items-center cursor-pointer"
                >
                  {student.is_locked ? (
                    <>
                      <Unlock className="mr-2 h-4 w-4 text-green-500" />
                      <span>Unlock Profile</span>
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4 text-rose-500" />
                      <span>Lock Profile</span>
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: students,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  })

  return (
    <div className="p-4 md:p-8 space-y-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
        <div>
          <CardTitle className="text-3xl font-bold tracking-tight">
            Student Management
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-1">
            Oversee academic progression, compliance, and verification across all cohorts.
          </CardDescription>
        </div>
        <div className="flex items-center gap-3"></div>
      </CardHeader>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Fetching Data</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {statusMessage && (
        <Alert
          variant={statusMessage.type === "error" ? "destructive" : "default"}
          className={`mb-4 ${
            statusMessage.type === "success"
              ? "bg-green-100 border-green-400 text-green-800"
              : ""
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {statusMessage.type === "error" ? "Error" : "Success!"}
          </AlertTitle>
          <AlertDescription>{statusMessage.message}</AlertDescription>
        </Alert>
      )}

      {/* 3. Data Table Card */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Find Student</CardTitle>
          {/* --- UPDATED: Filters + Search --- */}
          <div className="py-4 space-y-4">
            {/* Filter Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <DropdownSelect
                label="Filter by Stream"
                options={streamOptions}
                value={selectedStream}
                onChange={handleStreamChange}
                placeholder="All Streams..."
                disabled={loadingFilters}
              />
              <DropdownSelect
                label="Filter by Course"
                options={courseOptions}
                value={selectedCourse}
                onChange={handleCourseChange}
                placeholder="All Courses..."
                disabled={loadingFilters || !selectedStream}
              />
              <DropdownSelect
                label="Filter by Year"
                options={academicYearOptions}
                value={selectedAcademicYear}
                onChange={handleAcademicYearChange}
                placeholder="All Years..."
                disabled={loadingFilters || !selectedCourse}
              />
            </div>

            {/* Search Inputs and Action Buttons */}
            <div className="flex flex-col md:flex-row gap-3 justify-between pt-2 items-end">
              {/* Search Inputs */}
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto md:max-w-xl">
                <div className="relative w-full">
                  <Label htmlFor="name-search">Search by Name</Label>
                  <Input
                    id="name-search"
                    type="search"
                    placeholder="Search name..."
                    className="w-full"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                  />
                </div>
                <div className="relative w-full">
                  <Label htmlFor="roll-search">Search by Roll No.</Label>
                  <Input
                    id="roll-search"
                    type="search"
                    placeholder="Search roll number..."
                    className="w-full"
                    value={rollNumberSearch}
                    onChange={(e) => setRollNumberSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end w-full md:w-auto">
                {/* NEW: Export Button */}
                <Button
                  variant="outline"
                  onClick={handleExportToExcel}
                  disabled={loading || students.length === 0}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export to XL
                </Button>
                {/* Clear Button */}
                <Button
                  variant="outline"
                  onClick={handleFilterClear}
                  disabled={loading}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Clear
                </Button>
                {/* Search Button (Triggers fetch with all filters/search) */}
                <Button onClick={handleFilterSearch} disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  Search
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      {loading
                        ? "Loading..."
                        : "No students found. Please adjust your search or filters."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-end space-x-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}