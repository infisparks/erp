"use client"

import React, { useState, useEffect, useMemo } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { DateRange } from "react-day-picker"
import { addDays, format, startOfMonth } from "date-fns"

// --- ShadCN UI Components ---
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

// --- TanStack Table ---
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table"

// --- Icons ---
import {
  Loader2,
  AlertTriangle,
  ArrowRight,
  Calendar as CalendarIcon,
  ChevronLeft,
  ArrowUpDown,
} from "lucide-react"

// --- Type Definitions ---
interface Trust {
  id: string
  name: string
}
interface Course {
  id: string
  name: string
}
interface TrustTransaction {
  id: string
  created_at: string
  type: "inflow" | "outflow"
  amount: number
  notes: string | null
  trust: { id: string; name: string } | null
  student: { id: string; fullname: string; roll_number: string } | null
  course: { id: string; name: string } | null
  year: { id: string; academic_year_name: string } | null
}
interface CourseSummary {
  course_id: string
  course_name: string
  total_amount: number
}

// Helper: Format Currency
const formatCurrency = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined) return "N/A"
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount)
}

// ---------------------------------
// TAB 4: Trust Analytics
// ---------------------------------
export default function TrustAnalyticsPage() {
  const [supabase] = useState(() => getSupabaseClient())
  const [allTransactions, setAllTransactions] = useState<TrustTransaction[]>([])
  const [trusts, setTrusts] = useState<Trust[]>([])
  const [courses, setCourses] = useState<Course[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // --- View State ---
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)

  // --- Filter State ---
  const [globalFilter, setGlobalFilter] = useState("") // For main search
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  })

  // --- Data Fetching: Trusts and Courses (for filters) ---
  useEffect(() => {
    const fetchFiltersData = async () => {
      setIsLoading(true)
      try {
        const [trustsResult, coursesResult] = await Promise.all([
          supabase.from("trusts").select("id, name").order("name", { ascending: true }),
          supabase.from("courses").select("id, name").order("name", { ascending: true }),
        ])

        if (trustsResult.error)
          throw new Error(`Trusts Error: ${trustsResult.error.message}`)
        if (coursesResult.error)
          throw new Error(`Courses Error: ${coursesResult.error.message}`)

        setTrusts(trustsResult.data as Trust[])
        setCourses(coursesResult.data as Course[])
      } catch (err: any) {
        toast.error("Failed to load filter data.", { description: err.message })
        setError(err.message)
      }
    }
    fetchFiltersData()
  }, [supabase])

  // --- Data Fetching: Transactions ---
  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true)
      setError(null)
      setSelectedCourseId(null) // Reset drill-down on new fetch

      let query = supabase.from("trust_transactions").select(
        `
        id, created_at, type, amount, notes,
        trust:trusts ( id, name ),
        student:students ( id, fullname, roll_number ),
        course:courses ( id, name ),
        year:student_academic_years ( id, academic_year_name )
      `,
      )

      // Apply Date Filter
      if (date?.from) {
        query = query.gte("created_at", date.from.toISOString())
      }
      if (date?.to) {
        const toDate = addDays(date.to, 1)
        query = query.lte("created_at", toDate.toISOString())
      }

      const { data, error } = await query
        .order("created_at", { ascending: false })
        .limit(1000)

      if (error) {
        toast.error("Failed to fetch transactions.", {
          description: error.message,
        })
        setError(error.message)
      } else {
        const processedTransactions = data.map((tx: any) => ({
          ...tx,
          trust: tx.trust,
          student: tx.student,
          course: tx.course,
          year: tx.year,
        }))
        setAllTransactions(processedTransactions)
      }
      setIsLoading(false)
    }

    fetchTransactions()
  }, [supabase, date]) // Refetch when date changes

  // --- Data Aggregation for Summary ---
  const courseSummary = useMemo<CourseSummary[]>(() => {
    const summaryMap = new Map<string, CourseSummary>()
    const filteredTransactions = allTransactions.filter(tx => {
      for (const filter of columnFilters) {
        if (filter.id === "trust" && tx.trust?.id !== filter.value) return false
        if (filter.id === "course" && tx.course?.id !== filter.value) return false
        if (filter.id === "type" && tx.type !== filter.value) return false
      }
      return true
    })

    for (const tx of filteredTransactions) {
      if (tx.type === "outflow" && tx.course) {
        const existing = summaryMap.get(tx.course.id) || {
          course_id: tx.course.id,
          course_name: tx.course.name,
          total_amount: 0,
        }
        existing.total_amount += tx.amount
        summaryMap.set(tx.course.id, existing)
      }
    }
    return Array.from(summaryMap.values())
  }, [allTransactions, columnFilters])

  // --- Columns for Summary Table ---
  const summaryColumns = useMemo<ColumnDef<CourseSummary>[]>(
    () => [
      {
        accessorKey: "course_name",
        header: "Course",
      },
      {
        accessorKey: "total_amount",
        header: "Total Assigned (Outflow)",
        cell: ({ row }) => formatCurrency(row.original.total_amount),
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedCourseId(row.original.course_id)}
          >
            View Details <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ),
      },
    ],
    [],
  )

  // --- Columns for Detailed Transaction Table ---
  const transactionColumns = useMemo<ColumnDef<TrustTransaction>[]>(
    () => [
      {
        accessorKey: "created_at",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-xs">
            {new Date(row.original.created_at).toLocaleString("en-IN")}
          </div>
        ),
      },
      {
        accessorKey: "trust",
        header: "Trust",
        cell: ({ row }) => row.original.trust?.name || "N/A",
        filterFn: (row, id, value) => value.includes(row.original.trust?.id),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => (
          <span
            className={`font-medium ${
              row.original.type === "inflow"
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {row.original.type}
          </span>
        ),
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => (
          <span
            className={`font-bold ${
              row.original.type === "inflow"
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {row.original.type === "inflow" ? "+" : "-"}
            {formatCurrency(row.original.amount)}
          </span>
        ),
      },
      {
        accessorKey: "student",
        header: "Student",
        cell: ({ row }) => (
          <div>
            <p>{row.original.student?.fullname}</p>
            <p className="text-xs text-muted-foreground">
              {row.original.student?.roll_number}
            </p>
          </div>
        ),
        accessorFn: row =>
          `${row.student?.fullname} ${row.student?.roll_number}`,
      },
      {
        accessorKey: "course",
        header: "Course",
        cell: ({ row }) => row.original.course?.name || "N/A",
        filterFn: (row, id, value) => value.includes(row.original.course?.id),
      },
      {
        accessorKey: "notes",
        header: "Notes",
      },
    ],
    [],
  )

  // --- TanStack Table Hooks ---
  const summaryTable = useReactTable({
    data: courseSummary,
    columns: summaryColumns,
    getCoreRowModel: getCoreRowModel(),
  })

  const detailedTableData = useMemo(() => {
    if (!selectedCourseId) return allTransactions
    return allTransactions.filter(
      tx => tx.course?.id === selectedCourseId,
    )
  }, [allTransactions, selectedCourseId])

  const detailedTable = useReactTable({
    data: detailedTableData,
    columns: transactionColumns,
    state: {
      columnFilters,
      globalFilter,
    },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trust Analytics & History</CardTitle>
        <CardDescription>
          Filter transactions by date, trust, or course. View summaries
          and drill down into details.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* --- Filter Bar --- */}
        <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Date Range Picker */}
            <div className="space-y-2">
              <Label>Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "LLL dd, y")} -{" "}
                          {format(date.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(date.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Trust Filter */}
            <div className="space-y-2">
              <Label>Trust</Label>
              <Select
                value={
                  (detailedTable
                    .getColumn("trust")
                    ?.getFilterValue() as string) ?? "all"
                }
                onValueChange={value =>
                  detailedTable
                    .getColumn("trust")
                    ?.setFilterValue(value === "all" ? undefined : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Trusts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Trusts</SelectItem>
                  {trusts.map(trust => (
                    <SelectItem key={trust.id} value={trust.id}>
                      {trust.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Course Filter */}
            <div className="space-y-2">
              <Label>Course</Label>
              <Select
                value={
                  (detailedTable
                    .getColumn("course")
                    ?.getFilterValue() as string) ?? "all"
                }
                onValueChange={value =>
                  detailedTable
                    .getColumn("course")
                    ?.setFilterValue(value === "all" ? undefined : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={
                  (detailedTable
                    .getColumn("type")
                    ?.getFilterValue() as string) ?? "all"
                }
                onValueChange={value =>
                  detailedTable
                    .getColumn("type")
                    ?.setFilterValue(value === "all" ? undefined : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="inflow">Inflow</SelectItem>
                  <SelectItem value="outflow">Outflow</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* --- Loading / Error State --- */}
        {isLoading && (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}
        {error && !isLoading && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* --- Data Display --- */}
        {!isLoading && !error && (
          <div>
            {/* --- View 1: Summary (Default) --- */}
            {!selectedCourseId && (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    {summaryTable.getHeaderGroups().map(headerGroup => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                          <TableHead key={header.id}>
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {summaryTable.getRowModel().rows.length > 0 ? (
                      summaryTable.getRowModel().rows.map(row => (
                        <TableRow key={row.id}>
                          {row.getVisibleCells().map(cell => (
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
                          colSpan={summaryColumns.length}
                          className="h-24 text-center"
                        >
                          No outflow transactions found for these filters.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* --- View 2: Drill-Down Details --- */}
            {selectedCourseId && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedCourseId(null)}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back to Summary
                  </Button>
                  <div className="w-full max-w-sm">
                    <Input
                      placeholder="Search by student name or roll..."
                      value={globalFilter}
                      onChange={e => setGlobalFilter(e.target.value)}
                    />
                  </div>
                </div>

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      {detailedTable.getHeaderGroups().map(headerGroup => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map(header => (
                            <TableHead key={header.id}>
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {detailedTable.getRowModel().rows.length > 0 ? (
                        detailedTable.getRowModel().rows.map(row => (
                          <TableRow key={row.id}>
                            {row.getVisibleCells().map(cell => (
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
                            colSpan={transactionColumns.length}
                            className="h-24 text-center"
                          >
                            No transactions found.
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
                    onClick={() => detailedTable.previousPage()}
                    disabled={!detailedTable.getCanPreviousPage()}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => detailedTable.nextPage()}
                    disabled={!detailedTable.getCanNextPage()}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}