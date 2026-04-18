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
  DollarSign,
  Filter,
  FileSpreadsheet,
  ListTodo,
  Menu,
  Calculator,
  Receipt,
  History,
} from "lucide-react"

// --- PrimeReact Components ---
import { Dropdown } from "primereact/dropdown"

// --- Type Definitions ---
interface StudentLedger {
  student_id: number;
  fullname: string | null
  email: string | null
  roll_number: string | null
  photo_path: string | null
  course_name: string
  academic_year_name: string
  academic_year_session: string
  scholarship_name: string | null
  
  // Aggregated Fees
  total_fees_all_years: number
  paid_amount_all_years: number
  balance_amount: number
}

interface Stream { id: string; name: string }
interface Course { id: string; name: string; stream_id: string }
interface AcademicYear { id: string; name: string; course_id: string; sequence: number }

// -------------------------------------------------------------------
// 🚀 Reusable Helper Components 🚀
// -------------------------------------------------------------------

const sortByName = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name, undefined, { numeric: true })

const StudentAvatar: React.FC<{ src: string | null, alt: string | null, supabase: SupabaseClient, className?: string }> = ({ src, alt, supabase, className = "h-10 w-10" }) => {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  
  const publicUrl = useMemo(() => {
    if (!src) return null
    if (src.startsWith('http')) return src
    const cleanPath = src.replace(/^\/+/, '');
    const { data } = supabase.storage.from('student_documents').getPublicUrl(cleanPath);
    return data.publicUrl;
  }, [src, supabase])

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
// 📊 Student Fee Ledger Page Component 📊
// -------------------------------------------------------------------

export default function StudentLedgerPage() {
  const supabase = getSupabaseClient()

  const [students, setStudents] = useState<StudentLedger[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error", message: string } | null>(null)

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [sorting, setSorting] = useState<SortingState>([{ id: "fullname", desc: false }])

  const [studentSearch, setStudentSearch] = useState("")
  const [rollNumberSearch, setRollNumberSearch] = useState("")

  const [selectedStream, setSelectedStream] = useState<string | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string | null>(null)
  const [selectedScholarshipCategory, setSelectedScholarshipCategory] = useState<string | null>(null)

  const [allStreams, setAllStreams] = useState<Stream[]>([])
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [allAcademicYears, setAllAcademicYears] = useState<AcademicYear[]>([])
  const [allScholarshipCategories, setAllScholarshipCategories] = useState<any[]>([])
  const [loadingFilters, setLoadingFilters] = useState(true)

  const streamOptions = useMemo(() => allStreams.sort(sortByName), [allStreams])
  const courseOptions = useMemo(() => {
    if (!selectedStream) return []
    return allCourses.filter((c: Course) => c.stream_id === selectedStream).sort(sortByName)
  }, [allCourses, selectedStream])

  const academicYearOptions = useMemo(() => {
    if (!selectedCourse) return []
    return allAcademicYears.filter((ay: AcademicYear) => ay.course_id === selectedCourse).sort((a, b) => a.sequence - b.sequence)
  }, [allAcademicYears, selectedCourse])

  const fetchStudents = useCallback(
    async (nameQuery: string, rollQuery: string, shouldApplyFilters: boolean = true) => {
      setLoading(true)
      setStatusMessage(null)
      setError(null)

      try {
        const enrollJoin = selectedScholarshipCategory ? "student_academic_years!inner" : "student_academic_years"

        let query = supabase
          .from("students")
          .select(`
            id,
            fullname,
            email,
            photo_path,
            roll_number,
            scholarship_category:scholarship_categories!scholarship_category_id ( name ),
            course:courses ( id, name ),
            current_semester_details: semesters!current_sem_id ( id, name, academic_years ( id, name ) ),
            enrollments:${enrollJoin} (
              id,
              academic_year_name,
              academic_year_session,
              net_payable_fee,
              scholarship_name,
              scholarship_category_id
            ),
            all_enrollments:student_academic_years ( net_payable_fee ),
            all_payments:student_payments ( amount )
          `)

        if (shouldApplyFilters) {
          if (selectedStream && !selectedCourse) {
            const { data: courses } = await supabase.from("courses").select("id").eq("stream_id", selectedStream)
            const ids = courses?.map((c: any) => c.id) || []
            if (ids.length > 0) query = query.in("course_id", ids)
          }
          if (selectedCourse) query = query.eq("course_id", selectedCourse)
          if (selectedScholarshipCategory) query = query.eq("enrollments.scholarship_category_id", selectedScholarshipCategory)
          if (selectedAcademicYear) {
            const { data: sems } = await supabase.from("semesters").select("id").eq("academic_year_id", selectedAcademicYear)
            const semIds = sems?.map((s: any) => s.id) || []
            if (semIds.length > 0) query = query.in("current_sem_id", semIds)
          }
        }

        query = query.not('fullname', 'ilike', '%admin%').not('fullname', 'ilike', '%exam cell%').not('fullname', 'ilike', '%profile%')
        if (nameQuery) query = query.ilike("fullname", `%${nameQuery}%`)
        if (rollQuery) query = query.ilike("roll_number", `%${rollQuery}%`)

        const { data, error } = await query
        if (error) throw error

        if (data) {
          const flattenedData: StudentLedger[] = data.map((item: any) => {
            const latestEnroll = item.enrollments?.length > 0 ? item.enrollments[0] : null
            
            // Calculate Aggregates
            const totalFeesLimit = (item.all_enrollments || []).reduce((acc: number, curr: any) => acc + (Number(curr.net_payable_fee) || 0), 0)
            const totalPaid = (item.all_payments || []).reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0)

            return {
              student_id: item.id,
              fullname: item.fullname,
              email: item.email,
              roll_number: item.roll_number,
              photo_path: item.photo_path,
              course_name: item.course?.name || "N/A",
              academic_year_name: latestEnroll?.academic_year_name || item.current_semester_details?.academic_years?.name || "N/A",
              academic_year_session: latestEnroll?.academic_year_session || "N/A",
              scholarship_name: latestEnroll?.scholarship_name || item.scholarship_category?.name || "None",
              total_fees_all_years: totalFeesLimit,
              paid_amount_all_years: totalPaid,
              balance_amount: totalFeesLimit - totalPaid,
            }
          })
          setStudents(flattenedData)
          if (flattenedData.length === 0 && (shouldApplyFilters || nameQuery || rollQuery)) {
            setStatusMessage({ type: "error", message: "No students found matching the selected criteria." })
          }
        }
      } catch (err: any) {
        console.error("Error fetching ledger:", err)
        setError(err.message || "An error occurred.")
      } finally {
        setLoading(false)
      }
    },
    [supabase, selectedStream, selectedCourse, selectedAcademicYear, selectedScholarshipCategory, allAcademicYears]
  )

  useEffect(() => {
    const fetchConfig = async () => {
      setLoadingFilters(true)
      try {
        const [streams, courses, ay, sch] = await Promise.all([
          supabase.from("streams").select("*"),
          supabase.from("courses").select("*"),
          supabase.from("academic_years").select("id, name, course_id, sequence"),
          supabase.from("scholarship_categories").select("*")
        ])
        if (streams.data) setAllStreams(streams.data)
        if (courses.data) setAllCourses(courses.data)
        if (ay.data) setAllAcademicYears(ay.data as AcademicYear[])
        if (sch.data) setAllScholarshipCategories(sch.data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoadingFilters(false)
      }
    }
    fetchConfig()
  }, [supabase])

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

  useEffect(() => {
    if (!loadingFilters) fetchStudents("", "", false)
  }, [fetchStudents, loadingFilters])

  const handleFilterSearch = () => fetchStudents(studentSearch, rollNumberSearch, true)
  const handleFilterClear = () => {
    setSelectedStream(null); setSelectedCourse(null); setSelectedAcademicYear(null); setSelectedScholarshipCategory(null);
    setStudentSearch(""); setRollNumberSearch(""); setGlobalFilter("");
    fetchStudents("", "", false)
  }

  const columns: ColumnDef<StudentLedger>[] = [
    {
      accessorKey: "fullname",
      header: "Student",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <StudentAvatar src={row.original.photo_path} alt={row.original.fullname} supabase={supabase} />
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900">{row.original.fullname}</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-tight">{row.original.roll_number}</span>
          </div>
        </div>
      )
    },
    {
      accessorKey: "course_name",
      header: "Course & Year",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-[13px] font-medium text-slate-700">{row.original.course_name}</span>
          <span className="text-[11px] text-indigo-600 font-bold uppercase">{row.original.academic_year_name}</span>
        </div>
      )
    },
    {
      accessorKey: "scholarship_name",
      header: "Scholarship",
      cell: ({ row }) => (
        <Badge variant={row.original.scholarship_name === "None" ? "outline" : "secondary"} className="text-[10px] font-bold">
          {row.original.scholarship_name}
        </Badge>
      )
    },
    {
      accessorKey: "total_fees_all_years",
      header: () => <div className="text-right">Total Fees</div>,
      cell: ({ row }) => (
        <div className="text-right font-bold text-slate-900">
          ₹{row.original.total_fees_all_years.toLocaleString('en-IN')}
        </div>
      )
    },
    {
      accessorKey: "paid_amount_all_years",
      header: () => <div className="text-right">Total Paid</div>,
      cell: ({ row }) => (
        <div className="text-right font-bold text-green-600">
          ₹{row.original.paid_amount_all_years.toLocaleString('en-IN')}
        </div>
      )
    },
    {
      accessorKey: "balance_amount",
      header: () => <div className="text-right">Balance</div>,
      cell: ({ row }) => (
        <div className={`text-right font-black ${row.original.balance_amount > 0 ? "text-red-600" : "text-emerald-600"}`}>
          ₹{row.original.balance_amount.toLocaleString('en-IN')}
        </div>
      )
    },
    {
      id: "actions",
      header: "View",
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0 hover:bg-slate-100">
            <Link href={`/management/students/fees/detail?student_id=${row.original.student_id}`}>
              <History className="h-4 w-4 text-slate-600" />
            </Link>
          </Button>
        </div>
      )
    }
  ]

  const { totalFees, totalPaid, totalBalance } = useMemo(() => {
    return students.reduce((acc, curr) => {
      acc.totalFees += curr.total_fees_all_years
      acc.totalPaid += curr.paid_amount_all_years
      acc.totalBalance += curr.balance_amount
      return acc
    }, { totalFees: 0, totalPaid: 0, totalBalance: 0 })
  }, [students])

  const table = useReactTable({
    data: students,
    columns,
    state: { columnFilters, globalFilter, sorting },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto min-h-screen bg-[#F8FAFC]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
            <Calculator className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Financial Ledger</h1>
            <p className="text-[13px] text-slate-500 font-medium">Aggregate fees, payments, and balance tracking across all years</p>
          </div>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" className="h-10 border-slate-200 bg-white shadow-sm font-bold text-[13px]" onClick={handleFilterClear}>
                Clear All
            </Button>
            <Button className="h-10 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 font-bold px-6 text-[13px]" onClick={handleFilterSearch}>
                Apply Analysis
            </Button>
        </div>
      </div>

      {/* --- Aggregate Summary Cards --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-shadow">
          <CardContent className="p-0">
            <div className="flex items-center p-6 gap-5">
              <div className="p-4 bg-indigo-50 rounded-2xl group-hover:scale-110 transition-transform">
                <Receipt className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Portfolio Value</p>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">₹{totalFees.toLocaleString('en-IN')}</h3>
              </div>
            </div>
            <div className="h-1.5 w-full bg-slate-50">
              <div className="h-full bg-indigo-600" style={{ width: '100%' }} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-shadow">
          <CardContent className="p-0">
            <div className="flex items-center p-6 gap-5">
              <div className="p-4 bg-emerald-50 rounded-2xl group-hover:scale-110 transition-transform">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Total Collection</p>
                <h3 className="text-2xl font-black text-emerald-600 tracking-tight">₹{totalPaid.toLocaleString('en-IN')}</h3>
              </div>
            </div>
            <div className="h-1.5 w-full bg-slate-50">
              <div className="h-full bg-emerald-600" style={{ width: `${totalFees > 0 ? (totalPaid / totalFees) * 100 : 0}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-shadow">
          <CardContent className="p-0">
            <div className="flex items-center p-6 gap-5">
              <div className="p-4 bg-red-50 rounded-2xl group-hover:scale-110 transition-transform">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Outstanding Exposure</p>
                <h3 className="text-2xl font-black text-red-600 tracking-tight">₹{totalBalance.toLocaleString('en-IN')}</h3>
              </div>
            </div>
            <div className="h-1.5 w-full bg-slate-50">
              <div className="h-full bg-red-600" style={{ width: `${totalFees > 0 ? (totalBalance / totalFees) * 100 : 0}%` }} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm">
        <CardHeader className="py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Analysis Filters</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <DropdownSelect label="Stream" options={streamOptions} value={selectedStream} onChange={handleStreamChange} placeholder="All Streams" disabled={loadingFilters} />
            <DropdownSelect label="Course" options={courseOptions} value={selectedCourse} onChange={handleCourseChange} placeholder="All Courses" disabled={loadingFilters || !selectedStream} />
            <DropdownSelect label="Academic Year" options={academicYearOptions} value={selectedAcademicYear} onChange={(v) => setSelectedAcademicYear(v)} placeholder="All Years" disabled={loadingFilters || !selectedCourse} />
            <DropdownSelect label="Scholarship" options={allScholarshipCategories} value={selectedScholarshipCategory} onChange={(v) => setSelectedScholarshipCategory(v)} placeholder="All Categories" disabled={loadingFilters} />
            
            <div className="space-y-1">
              <Label className="font-semibold text-slate-700">Student Name</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} placeholder="Enter name..." className="pl-9 h-10 border-slate-200 rounded-lg" />
              </div>
            </div>
            
            <div className="space-y-1">
              <Label className="font-semibold text-slate-700">Roll Number</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input value={rollNumberSearch} onChange={(e) => setRollNumberSearch(e.target.value)} placeholder="Enter roll..." className="pl-9 h-10 border-slate-200 rounded-lg" />
              </div>
            </div>

            <div className="lg:col-span-2 flex items-end gap-3 h-[68px]">
              <Button 
                className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 font-bold" 
                onClick={handleFilterSearch}
              >
                <Search className="mr-2 h-4 w-4" />
                Run Search Analysis
              </Button>
              <Button 
                variant="outline" 
                className="h-10 border-slate-200" 
                onClick={handleFilterClear}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-900">
          <AlertTitle className="font-bold">System Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {statusMessage && (
        <Alert className={`border-slate-200 ${statusMessage.type === 'error' ? 'bg-orange-50 text-orange-900 border-orange-200' : 'bg-emerald-50 text-emerald-900 border-emerald-200'}`}>
          <AlertDescription className="font-medium">{statusMessage.message}</AlertDescription>
        </Alert>
      )}

      <GridTable 
        table={table} 
        loading={loading} 
        dataLength={students.length}
      />
    </div>
  )
}

function GridTable({ table, loading, dataLength }: any) {
    return (
        <Card className="border-slate-200 shadow-xl overflow-hidden bg-white">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        {table.getHeaderGroups().map((headerGroup: any) => (
                            <TableRow key={headerGroup.id} className="hover:bg-transparent border-slate-100">
                                {headerGroup.headers.map((header: any) => (
                                    <TableHead key={header.id} className="h-12 text-slate-500 font-bold uppercase text-[11px] tracking-wider px-6">
                                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-[400px] text-center">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                                        <p className="text-sm font-bold text-slate-400 animate-pulse">Calculating balances across academic history...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : dataLength === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-[400px] text-center">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <div className="p-4 bg-slate-50 rounded-full mb-2">
                                            <Receipt className="h-10 w-10 text-slate-300" />
                                        </div>
                                        <p className="text-lg font-black text-slate-400">No matching records found</p>
                                        <p className="text-sm text-slate-300 max-w-[300px] mx-auto">Try adjusting your financial filters or searching for a specific roll number</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            table.getRowModel().rows.map((row: any) => (
                                <TableRow key={row.id} className="group hover:bg-slate-50/50 transition-colors border-slate-50">
                                    {row.getVisibleCells().map((cell: any) => (
                                        <TableCell key={cell.id} className="px-6 py-4">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="py-4 px-6 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
                <div className="text-[12px] text-slate-500 font-medium">
                    Showing <span className="text-slate-900 font-bold">{table.getRowModel().rows.length}</span> of {dataLength} analysis results
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="h-8 border-slate-200 bg-white">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="h-8 border-slate-200 bg-white">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </Card>
    )
}
