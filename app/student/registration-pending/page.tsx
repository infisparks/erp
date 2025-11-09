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
import { toast } from "sonner"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable" // <-- 1. THIS IS THE FIX (IMPORT)

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

// --- PrimeReact Components ---
import { Dropdown } from "primereact/dropdown"

// --- Icons ---
import {
  Search,
  AlertTriangle,
  UserRound,
  Loader2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  FileSpreadsheet, // For Excel
  Printer, // For PDF
  Menu,
  CheckSquare, // For Registration
} from "lucide-react"

// --- Type Definitions ---
interface PendingStudent {
  student_id: string
  academic_year_id: string 
  fullname: string | null
  email: string | null
  roll_number: string | null
  photo_path: string | null
  course_name: string
  academic_year_name: string
  academic_year_session: string
  status: string // 'Active'
  is_registered: boolean // false
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
}

// -------------------------------------------------------------------
// 🚀 Reusable Helper Components 🚀
// -------------------------------------------------------------------

const sortByName = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name, undefined, { numeric: true })

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
// ⌛ Main Registration Pending Page Component ⌛
// -------------------------------------------------------------------

export default function RegistrationPendingPage() {
  const supabase = getSupabaseClient()

  // --- Page State ---
  const [students, setStudents] = useState<PendingStudent[]>([])
  const [loading, setLoading] = useState(false)
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
      .sort(sortByName)
  }, [allAcademicYears, selectedCourse])

  // --- Data Fetching (Students) ---
  const fetchPendingStudents = useCallback(
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
            student_id,
            academic_year_name,
            academic_year_session,
            status,
            is_registered,
            student:students (
              id,
              fullname,
              email,
              photo_path,
              roll_number
            ),
            course:courses (
              id,
              name,
              stream_id
            )
          `,
          )
          .eq("is_registered", false) // CORE FILTER 1
          .eq("status", "Active")     // CORE FILTER 2

        // --- Filter Logic ---
        if (shouldApplyFilters) {
          if (selectedStream) {
            query = query.eq("course.stream_id", selectedStream)
          }
          if (selectedCourse) {
            query = query.eq("course_id", selectedCourse)
          }
          if (selectedAcademicYear) {
            const yearName = allAcademicYears.find(
              (ay) => ay.id === selectedAcademicYear,
            )?.name
            
            if (yearName) {
              query = query.eq("academic_year_name", yearName)
            } else if (selectedStream || selectedCourse) {
              query = query.eq("id", "0"); 
            }
          }
        } 

        // --- Add Search Queries ---
        if (nameQuery) {
          query = query.ilike("student.fullname", `%${nameQuery}%`)
        }
        if (rollQuery) {
          query = query.ilike("student.roll_number", `%${rollQuery}%`)
        }
        
        query = query.order("fullname", { referencedTable: "student", ascending: true })

        const { data, error } = await query
        if (error) throw error

        if (data) {
          const flattenedData: PendingStudent[] = data
            .map((item: any) => {
              if (!item.student || !item.course)
                return null 

              return {
                academic_year_id: item.id,
                student_id: item.student.id,
                fullname: item.student.fullname,
                email: item.student.email,
                roll_number: item.student.roll_number,
                photo_path: item.student.photo_path,
                course_name: item.course.name,
                academic_year_name: item.academic_year_name,
                academic_year_session: item.academic_year_session,
                status: item.status,
                is_registered: item.is_registered,
              }
            })
            .filter(
              (s: PendingStudent | null): s is PendingStudent => s !== null,
            )

          setStudents(flattenedData)

          if (flattenedData.length === 0) {
             setStatusMessage({
              type: "error",
              message: "No students found matching the selected criteria.",
            })
          }
        }
      } catch (err: any) {
        console.error("Error fetching pending students:", err)
        setError(
          err.message || "An unknown error occurred while fetching students.",
        )
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
          supabase.from("academic_years").select("id, name, course_id"),
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
      fetchPendingStudents("", "", false)
    }
  }, [fetchPendingStudents, loadingFilters])

  // --- Filter Handlers ---
  const handleStreamChange = (value: string | null) => {
    setSelectedStream(value)
    setSelectedCourse(null)
    setSelectedAcademicYear(null)
  }

  const handleCourseChange = (value: string | null) => {
    setSelectedCourse(value)
    setSelectedAcademicYear(null)
  }

  const handleAcademicYearChange = (value: string | null) => {
    setSelectedAcademicYear(value)
  }

  // --- Search and Action Handlers ---
  const handleFilterSearch = () => {
    fetchPendingStudents(studentSearch, rollNumberSearch, true)
  }

  const handleFilterClear = () => {
    setSelectedStream(null)
    setSelectedCourse(null)
    setSelectedAcademicYear(null)
    setStudentSearch("")
    setRollNumberSearch("")
    setGlobalFilter("")
    fetchPendingStudents("", "", false)
  }

  // --- EXPORT HANDLERS ---
  const handleExportToCSV = () => {
    if (students.length === 0) {
      toast.error("No data to export.")
      return
    }
    
    const headers = [
      "Full Name",
      "Email",
      "Roll Number",
      "Course",
      "Academic Year",
      "Session",
    ]
    const csvContent = [
      headers.join(","),
      ...students.map((s) =>
        [
          `"${s.fullname}"`,
          s.email,
          s.roll_number,
          `"${s.course_name}"`,
          `"${s.academic_year_name}"`,
          s.academic_year_session,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `pending_registrations_${new Date().toISOString().slice(0, 10)}.csv`,
    )
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`Successfully exported ${students.length} records to CSV.`)
  }

  const handleExportToPDF = () => {
     if (students.length === 0) {
      toast.error("No data to export.")
      return
    }

    const doc = new jsPDF()
    const tableHead = [
      "Full Name",
      "Roll Number",
      "Course",
      "Academic Year",
      "Session",
    ]
    const tableBody = students.map((s) => [
      s.fullname,
      s.roll_number,
      s.course_name,
      s.academic_year_name,
      s.academic_year_session,
    ])

    doc.text("Pending Student Registrations", 14, 15)
    
    // --- 2. THIS IS THE FIX (FUNCTION CALL) ---
    autoTable(doc, {
      startY: 20,
      head: [tableHead],
      body: tableBody,
      theme: "striped",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 160, 133] }, // Theme color
    })
    // ----------------------------------------

    doc.save(
      `pending_registrations_${new Date().toISOString().slice(0, 10)}.pdf`,
    )
    toast.success(`Successfully exported ${students.length} records to PDF.`)
  }

  // --- Table Columns Definition ---
  const columns: ColumnDef<PendingStudent>[] = [
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
            <div>
              <div className="font-medium">{student.fullname || "N/A"}</div>
              <div className="text-xs text-muted-foreground">
                {student.email}
              </div>
              <Badge variant="destructive" className="mt-1 text-xs">
                Registration Pending
              </Badge>
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
      accessorKey: "course_name",
      header: "Course",
    },
    {
      accessorKey: "academic_year_name",
      header: "Pending Year",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">
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

        return (
          <div className="text-right">
            <Button asChild size="sm">
              <Link
                href={`/student/registration?student_id=${student.student_id}`}
                className="flex items-center"
              >
                <CheckSquare className="mr-2 h-4 w-4" />
                <span>Complete Registration</span>
              </Link>
            </Button>
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
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Pending Registrations
          </h1>
          <p className="text-lg text-muted-foreground">
            View and manage students who have not completed their academic year
            registration.
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
            {statusMessage.type === "error" ? "No Results" : "Success!"}
          </AlertTitle>
          <AlertDescription>{statusMessage.message}</AlertDescription>
        </Alert>
      )}

      {/* 3. Data Table Card */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Find Pending Students</CardTitle>
          {/* --- Filters + Search --- */}
          <div className="py-4 space-y-4">
            {/* Filter Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
              <div className="flex gap-2 justify-end w-full md:w-auto flex-wrap">
                {/* Export Buttons */}
                <Button
                  variant="outline"
                  onClick={handleExportToCSV}
                  disabled={loading || students.length === 0}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExportToPDF}
                  disabled={loading || students.length === 0}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Export PDF
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
                {/* Search Button */}
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