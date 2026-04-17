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
} from "lucide-react"

// --- PrimeReact Components ---
import { Dropdown } from "primereact/dropdown"

// --- Type Definitions ---
interface StudentEnrollment {
  enrollment_id: number;
  student_id: number;
  academic_year_id: number;
  fullname: string | null
  email: string | null
  roll_number: string | null
  photo_path: string | null
  course_name: string
  academic_year_name: string
  academic_year_session: string
  is_registered: boolean
  sequence: number
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
const StudentAvatar: React.FC<{
  src: string | null
  alt: string | null
  supabase: SupabaseClient
  className?: string
}> = ({ src, alt, supabase, className = "h-10 w-10" }) => {
  const publicUrl = useMemo(() => {
    if (!src) return null
    return supabase.storage.from("student_documents").getPublicUrl(src).data
      .publicUrl
  }, [src, supabase])

  return (
    <Avatar className={`${className} rounded-md`}>
      <AvatarImage
        src={publicUrl || undefined}
        alt={alt || "Student Photo"}
        className="rounded-md object-cover"
      />
      <AvatarFallback className="rounded-md bg-muted">
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

export default function FeesManagementPage() {
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
      .sort((a, b) => a.sequence - b.sequence)
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
          .from("student_academic_years")
          .select(
            `
            id,
            academic_year_name,
            academic_year_session,
            is_registered,
            student:students (
              id,
              fullname,
              email,
              photo_path,
              roll_number
            ),
            course:courses ( name )
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
            const yearName = allAcademicYears.find(
              (ay) => ay.id === selectedAcademicYear,
            )?.name
            if (yearName) query = query.eq("academic_year_name", yearName)
          }
        }

        // --- Search Queries ---
        if (nameQuery) query = query.ilike("student.fullname", `%${nameQuery}%`)
        if (rollQuery) query = query.ilike("student.roll_number", `%${rollQuery}%`)

        const { data, error } = await query
        if (error) throw error

        if (data) {
          // 1. Flatten Data
          let flattenedData: StudentEnrollment[] = data
            .map((item: any) => {
              if (!item.student) return null
              
              const ayInfo = allAcademicYears.find(ay => ay.name === item.academic_year_name && (selectedCourse ? ay.course_id === selectedCourse : true));

              return {
                enrollment_id: item.id,
                student_id: item.student.id,
                academic_year_id: item.id,
                fullname: item.student.fullname,
                email: item.student.email,
                roll_number: item.student.roll_number,
                photo_path: item.student.photo_path,
                course_name: item.course?.name || "N/A",
                academic_year_name: item.academic_year_name || "N/A",
                academic_year_session: item.academic_year_session || "N/A",
                is_registered: item.is_registered ?? false,
                sequence: ayInfo?.sequence ?? 0
              }
            })
            .filter((s: StudentEnrollment): s is StudentEnrollment => s !== null)

          // 2. Filter for LATEST Year per Student
          const studentMap = new Map<number, StudentEnrollment>()
          flattenedData.forEach(enroll => {
            const existing = studentMap.get(enroll.student_id)
            if (!existing || enroll.sequence > existing.sequence) {
              studentMap.set(enroll.student_id, enroll)
            }
          })
          
          const finalData = Array.from(studentMap.values())
          setStudents(finalData)

          if (finalData.length === 0 && (shouldApplyFilters || nameQuery || rollQuery)) {
            setStatusMessage({
              type: "error",
              message: "No students found matching the selected filters.",
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
      "Academic Year"
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
        "student_fees_export_" +
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

        // --- Logic for registration pending ---
        const isRegistrationPending = student.is_registered === false

        return (
          <div className="flex items-center gap-3">
            <StudentAvatar
              src={student.photo_path}
              alt={student.fullname}
              supabase={supabase}
            />
            <div>
              <div className="font-medium">{student.fullname || "N/A"}</div>
              <div className="text-xs text-muted-foreground">
                {student.email}
              </div>

              {/* --- Conditional Badge --- */}
              {isRegistrationPending && (
                <Badge variant="destructive" className="mt-1 text-xs">
                  Registration Pending
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
          <div className="text-xs text-muted-foreground">
            {row.original.academic_year_session}
          </div>
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const student = row.original
        
        // --- ✅ NEW: Check for registration pending ---
        const isRegistrationPending = student.is_registered === false

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
                  {/* <Link
                    href={`/management/students/promotion?student_id=${student.student_id}`}
                    className="flex items-center"
                  >
                    <RotateCw className="mr-2 h-4 w-4" />
                    <span>Manage Promotion</span>
                  </Link> */}
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
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  // --- Table Instance ---
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

  // --- Main Page Render ---
  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div className="w-full sm:w-auto">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-800">
            Fees Management
          </h1>
          <p className="text-sm md:text-lg text-muted-foreground mt-1">
            Manage payments and view history.
          </p>
        </div>
      </div>

      {/* 2. Error/Status Messages */}
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
            <div className="flex flex-col gap-4 justify-between pt-2">
              {/* Search Inputs */}
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <div className="relative w-full">
                  <Label htmlFor="name-search" className="text-xs font-bold uppercase text-slate-400">Name</Label>
                  <Input
                    id="name-search"
                    type="search"
                    placeholder="Search name..."
                    className="w-full h-10"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                  />
                </div>
                <div className="relative w-full">
                  <Label htmlFor="roll-search" className="text-xs font-bold uppercase text-slate-400">Roll No.</Label>
                  <Input
                    id="roll-search"
                    type="search"
                    placeholder="Search roll..."
                    className="w-full h-10"
                    value={rollNumberSearch}
                    onChange={(e) => setRollNumberSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 justify-end w-full">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportToExcel}
                  disabled={loading || students.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white border-none flex-1 sm:flex-none"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFilterClear}
                  disabled={loading}
                  className="flex-1 sm:flex-none"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Clear
                </Button>
                <Button onClick={handleFilterSearch} size="sm" disabled={loading} className="flex-1 sm:flex-none">
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