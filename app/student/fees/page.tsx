"use client"

import React, { useState, useEffect, useMemo } from "react"
import Link from "next/link" // Added for navigation
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

// --- Icons ---
import {
  Search,
  AlertTriangle,
  UserRound,
  Loader2,
  X,
  Filter,
  XCircle,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Check,
  ArrowUpDown,
  DollarSign, // New icon
  Receipt, // New icon
} from "lucide-react"

// --- Type Definitions ---

// For the main list (based on student_semesters)
interface StudentEnrollment {
  enrollment_id: string; // student_semesters.id
  student_id: string;    // students.id
  fullname: string | null;
  email: string | null;
  roll_number: string;
  status: string;
  photo_path: string | null;
  course_name: string;
  semester_name: string;
  course_id: string;
  semester_id: string;
  academic_year: string; // --- NEW: For yearly fee link ---
}

// For a payment record
interface Payment {
  id: string;
  created_at: string;
  amount: number;
  payment_method: string;
  fees_type: string | null;
  notes: string | null;
  bank_name: string | null;
  cheque_number: string | null;
  transaction_id: string | null;
}

// For filters
interface Stream { id: string; name: string; }
interface Course { id: string; name: string; stream_id: string; }
interface Semester { id: string; name: string; course_id: string; }

// For Combobox props
interface SearchableSelectProps {
  options: { label: string; value: string; }[];
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder: string;
  disabled?: boolean;
}

// -------------------------------------------------------------------
// 🚀 Reusable Helper Components 🚀
// -------------------------------------------------------------------

/**
 * Professional Searchable Select (Combobox)
 */
const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false)
  const selectedLabel = options.find((option) => option.value === value)?.label

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={disabled}
        >
          {value ? (
            <span className="truncate">{selectedLabel}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${
                      value === option.value ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

/**
 * Helper for Rounded Square Avatar
 */
const StudentAvatar: React.FC<{ src: string | null, alt: string | null }> = ({ src, alt }) => {
  return (
    <Avatar className="h-10 w-10 rounded-md">
      <AvatarImage 
        src={src || undefined} 
        alt={alt || "Student Photo"} 
        className="rounded-md object-cover"
      />
      <AvatarFallback className="rounded-md bg-muted">
        <UserRound className="h-5 w-5 text-muted-foreground" />
      </AvatarFallback>
    </Avatar>
  )
}

// -------------------------------------------------------------------
// 💰 Main Fees Management Page Component 💰
// -------------------------------------------------------------------

export default function FeesManagementPage() {
  const supabase = getSupabaseClient()

  // --- Page State ---
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // --- Table State ---
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [sorting, setSorting] = useState<SortingState>([
    { id: "fullname", desc: false },
  ])

  // --- Modal State ---
  const [isViewPaymentsModalOpen, setIsViewPaymentsModalOpen] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)
  
  // --- Data State ---
  const [selectedEnrollment, setSelectedEnrollment] = useState<StudentEnrollment | null>(null)
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([])
  
  // --- Filter States ---
  const [selectedStream, setSelectedStream] = useState<string | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null)

  const [allStreams, setAllStreams] = useState<Stream[]>([])
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [allSemesters, setAllSemesters] = useState<Semester[]>([])
  
  const [loadingFilters, setLoadingFilters] = useState(true)

  // --- Memoized Filter Options ---
  const streamOptions = useMemo(() => {
    return allStreams.map(s => ({ label: s.name, value: s.id }))
  }, [allStreams])

  const courseOptions = useMemo(() => {
    if (!selectedStream) return []
    return allCourses
      .filter(c => c.stream_id === selectedStream)
      .map(c => ({ label: c.name, value: c.id }))
  }, [allCourses, selectedStream])

  const semesterOptions = useMemo(() => {
    if (!selectedCourse) return []
    return allSemesters
      .filter(s => s.course_id === selectedCourse)
      .map(s => ({ label: s.name, value: s.id }))
  }, [allSemesters, selectedCourse])


  // --- Data Fetching (Enrollments) ---
  useEffect(() => {
    fetchEnrollments()
  }, []) // Empty dependency array means this runs once on mount
  
  // --- Data Fetching (Filters) ---
  useEffect(() => {
    const fetchAllConfig = async () => {
      setLoadingFilters(true)
      try {
        const [streamData, courseData, semesterData] = await Promise.all([
          supabase.from("streams").select("*"),
          supabase.from("courses").select("*"),
          supabase.from("semesters").select("*")
        ])

        if (streamData.data) setAllStreams(streamData.data as Stream[])
        if (courseData.data) setAllCourses(courseData.data as Course[])
        if (semesterData.data) setAllSemesters(semesterData.data as Semester[])

        const errors = [streamData.error, courseData.error, semesterData.error].filter(Boolean)
        if (errors.length > 0) {
          throw new Error(errors.map(e => e.message).join(", "))
        }

      } catch (error: any) {
        console.error("Error fetching filter config:", error)
        setError("Failed to load filter configuration options.")
      } finally {
        setLoadingFilters(false)
      }
    }
    fetchAllConfig()
  }, []) // Empty dependency array means this runs once on mount


  const fetchEnrollments = async () => {
    setLoading(true)
    setError(null)
    
    try {
      let query = supabase
        .from("student_semesters")
        .select(
          `
          id, 
          roll_number,
          status,
          student_id,
          course_id,
          semester_id,
          academic_year, 
          student:students (
            id,
            fullname,
            email,
            photo_path
          ),
          course:courses ( name ),
          semester:semesters ( name )
          `,
        )
        // --- NEW YEARLY LOGIC ---
        // Only fetch Sem 1, 3, 5, etc., to represent the entire year
        // This assumes semester names are like "Semester 1", "Semester 2"
        .filter("semester.name", "in", "('Semester 1', 'Semester 3', 'Semester 5', 'Semester 7')") 
        .order("created_at", { ascending: false })

      // Apply filters
      if (selectedSemester) {
        query = query.eq("semester_id", selectedSemester)
      } else if (selectedCourse) {
        query = query.eq("course_id", selectedCourse)
      } else if (selectedStream) {
        const courseIds = allCourses
          .filter(c => c.stream_id === selectedStream)
          .map(c => c.id)
        
        if (courseIds.length > 0) {
          query = query.in("course_id", courseIds)
        } else {
          query = query.eq("course_id", "00000000-0000-0000-0000-000000000000")
        }
      }

      const { data, error } = await query

      if (error) throw error
      
      if (data) {
        // Flatten the data for the table
        const flattenedData: StudentEnrollment[] = data.map((item: any) => ({
          enrollment_id: item.id,
          student_id: item.student.id,
          fullname: item.student.fullname,
          email: item.student.email,
          roll_number: item.roll_number,
          status: item.status,
          photo_path: item.student.photo_path,
          course_name: item.course?.name || "N/A",
          semester_name: item.semester?.name || "N/A",
          course_id: item.course_id,
          semester_id: item.semester_id,
          academic_year: item.academic_year, // Store the academic year
        }));
        setEnrollments(flattenedData)
      }
    } catch (err: any) {
      console.error("Error fetching enrollments:", err)
      setError(err.message || "An unknown error occurred while fetching enrollments.")
    } finally {
      setLoading(false)
    }
  }
  
  // --- Filter Handlers ---
  const handleStreamChange = (value: string | null) => {
    setSelectedStream(value)
    setSelectedCourse(null)
    setSelectedSemester(null)
  }

  const handleCourseChange = (value: string | null) => {
    setSelectedCourse(value)
    setSelectedSemester(null)
  }

  const handleSemesterChange = (value: string | null) => {
    setSelectedSemester(value)
  }

  const handleFilterSearch = () => {
    fetchEnrollments()
  }
  
  const handleFilterClear = () => {
    setSelectedStream(null)
    setSelectedCourse(null)
    setSelectedSemester(null)
    setGlobalFilter("")
    setEnrollments([])
    // Use a tiny timeout to ensure state updates before refetching
    setTimeout(() => {
      fetchEnrollments()
    }, 0)
  }

  // --- Modal Logic ---

  // --- View Payments Modal (UPDATED) ---
  const openViewPaymentsModal = async (enrollment: StudentEnrollment) => {
    setSelectedEnrollment(enrollment)
    setIsViewPaymentsModalOpen(true)
    setModalLoading(true)
    setModalError(null)
    setPaymentHistory([])

    try {
      // --- NEW YEARLY LOGIC ---
      // Fetch payments by student_id AND academic_year
      const { data, error } = await supabase
        .from("student_payments")
        .select("*") // Fetch all new columns
        .eq("student_id", enrollment.student_id)
        .eq("academic_year", enrollment.academic_year)
        .order("created_at", { ascending: false })
      
      if (error) throw error
      
      setPaymentHistory(data as Payment[])
      
    } catch (err: any) {
      console.error("Error fetching payment history:", err)
      setModalError(err.message || "Failed to load payment history.")
    } finally {
      setModalLoading(false)
    }
  }
  
  
  // --- Table Columns Definition ---
  const columns: ColumnDef<StudentEnrollment>[] = [
    {
      accessorKey: "photo_path",
      header: "Photo",
      cell: ({ row }) => {
        const enrollment = row.original
        let publicUrl = ""
        if (enrollment.photo_path) {
          publicUrl = supabase.storage.from('student_documents').getPublicUrl(enrollment.photo_path).data.publicUrl
        }
        return <StudentAvatar src={publicUrl} alt={enrollment.fullname} />
      },
    },
    {
      accessorKey: "fullname",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Full Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-medium">{row.getValue("fullname") || "N/A"}</div>,
    },
    {
      accessorKey: "roll_number",
      header: "Roll Number",
    },
    {
      accessorKey: "course_name",
      header: "Course",
      cell: ({ row }) => <div className="text-xs truncate">{row.getValue("course_name")}</div>,
    },
    {
      // --- UPDATED: This now represents the start of the year ---
      accessorKey: "semester_name",
      header: "Year (Starts With)",
      cell: ({ row }) => <div className="text-xs truncate">{row.getValue("semester_name")}</div>,
    },
    {
      accessorKey: "academic_year",
      header: "Academic Year",
      cell: ({ row }) => <Badge variant="outline">{row.original.academic_year}</Badge>,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const enrollment = row.original
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Fee Actions</DropdownMenuLabel>
                {/* --- MODIFIED: Pass student_id and academic_year --- */}
                <DropdownMenuItem asChild>
                  <Link href={`/student/fees/add?student_id=${enrollment.student_id}&year=${enrollment.academic_year}`}>
                    <DollarSign className="mr-2 h-4 w-4 text-green-500" />
                    Add Payment
                  </Link>
                </DropdownMenuItem>
                {/* --- END MODIFIED --- */}
                <DropdownMenuItem onClick={() => openViewPaymentsModal(enrollment)}>
                  <Receipt className="mr-2 h-4 w-4 text-blue-500" />
                  View Payments
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
    data: enrollments,
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
            Fees Management
          </h1>
          <p className="text-lg text-muted-foreground">
            Add and view payments for student enrollments by academic year.
          </p>
        </div>
      </div>

      {/* 2. Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Fetching Data</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 3. Data Table Card */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Manage Student Payments</CardTitle>
          {/* Filter Bar */}
          <div className="py-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <SearchableSelect
                options={streamOptions}
                value={selectedStream}
                onChange={handleStreamChange}
                placeholder="Filter by Stream..."
                disabled={loadingFilters}
              />
              <SearchableSelect
                options={courseOptions}
                value={selectedCourse}
                onChange={handleCourseChange}
                placeholder="Filter by Course..."
                disabled={loadingFilters || !selectedStream}
              />
              <SearchableSelect
                options={semesterOptions}
                value={selectedSemester}
                onChange={handleSemesterChange}
                placeholder="Filter by Starting Semester..."
                disabled={loadingFilters || !selectedCourse}
              />
            </div>
            <div className="flex flex-col md:flex-row gap-2 justify-between">
              {/* Global Search Input */}
              <div className="relative w-full md:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search name, email, roll..."
                  className="pl-9 w-full"
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={handleFilterClear} disabled={loading}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Clear
                </Button>
                <Button onClick={handleFilterSearch} disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Filter className="h-4 w-4 mr-2" />
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
                                header.getContext()
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
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      {loading ? "Loading enrollments..." : "No results found."}
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

      {/* 5. VIEW PAYMENTS MODAL */}
      <Dialog open={isViewPaymentsModalOpen} onOpenChange={setIsViewPaymentsModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Payment History</DialogTitle>
            {selectedEnrollment && (
              <DialogDescription>
                Showing payment history for <span className="font-medium text-primary">{selectedEnrollment.fullname}</span>
                <br/>
                (Academic Year: {selectedEnrollment.academic_year})
              </DialogDescription>
            )}
          </DialogHeader>
          
          <div className="py-4 max-h-[60vh] overflow-y-auto">
            {modalLoading && (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}
            {modalError && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{modalError}</AlertDescription>
              </Alert>
            )}
            
            {!modalLoading && paymentHistory.length === 0 && (
              <p className="text-center text-muted-foreground italic">No payment records found for this student and academic year.</p>
            )}
            
            {!modalLoading && paymentHistory.length > 0 && (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Fees Type</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentHistory.map(payment => (
                      <TableRow key={payment.id}>
                        <TableCell className="text-xs">
                          {format(parseISO(payment.created_at), "dd MMM yyyy, h:mm a")}
                        </TableCell>
                        <TableCell className="font-medium">
                          ₹{payment.amount.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{payment.fees_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{payment.payment_method}</Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {payment.payment_method === 'Cheque' && `Bank: ${payment.bank_name}, Chq: ${payment.cheque_number}`}
                          {payment.transaction_id && `ID: ${payment.transaction_id}`}
                          {!payment.bank_name && !payment.transaction_id && (payment.notes || "N/A")}
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* --- NEW: Total Row --- */}
                    <TableRow className="bg-muted hover:bg-muted">
                        <TableCell colSpan={1} className="font-medium text-right">TOTAL PAID</TableCell>
                        <TableCell colSpan={4} className="font-bold text-lg text-green-700">
                           ₹{paymentHistory.reduce((acc, p) => acc + p.amount, 0).toLocaleString('en-IN')}
                        </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}