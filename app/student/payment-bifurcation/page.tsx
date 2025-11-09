"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
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
import { DateRange } from "react-day-picker"
import { addDays, format, startOfMonth } from "date-fns"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

// --- ShadCN UI Components ---
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

// --- Icons ---
import {
  Search,
  AlertTriangle,
  Loader2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  FileSpreadsheet, // For Excel
  Printer, // For PDF
  Calendar as CalendarIcon,
  DollarSign, // For Page Icon
} from "lucide-react"

// --- Type Definitions ---
interface FormOption {
  name: string
}

interface PaymentRecord {
  id: string
  created_at: string
  amount: number
  payment_method: string
  fees_type: string | null
  receipt_no: number
  transaction_id: string | null
  notes: string | null
  student_name: string | null
  student_roll_number: string | null
}

// -------------------------------------------------------------------
// 🚀 Reusable Helper Components 🚀
// -------------------------------------------------------------------

// Helper: Format Currency
const formatCurrency = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined) return "N/A"
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount)
}

// -------------------------------------------------------------------
// 💰 Main Payment Bifurcation Page Component 💰
// -------------------------------------------------------------------

export default function PaymentBifurcationPage() {
  const [supabase] = useState(() => getSupabaseClient())

  // --- Page State ---
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [totalAmount, setTotalAmount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  // --- Table State ---
  const [sorting, setSorting] = useState<SortingState>([
    { id: "created_at", desc: true },
  ])
  const [globalFilter, setGlobalFilter] = useState("")

  // --- Filter States ---
  const [paymentMethods, setPaymentMethods] = useState<FormOption[]>([])
  const [loadingFilters, setLoadingFilters] = useState(true)
  
  // Default to "This Month"
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  })
  const [selectedMethod, setSelectedMethod] = useState<string>("all")

  // --- Data Fetching (Payment Methods) ---
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      setLoadingFilters(true)
      try {
        const { data, error } = await supabase
          .from("form_config")
          .select("data_jsonb")
          .eq("data_name", "payment_types")
          .single()

        if (error) throw error
        if (data) {
          setPaymentMethods(data.data_jsonb as FormOption[])
        }
      } catch (err: any) {
        console.error("Error fetching payment methods:", err)
        setError("Failed to load filter options.")
      } finally {
        setLoadingFilters(false)
      }
    }
    fetchPaymentMethods()
  }, [supabase])

  // --- Data Fetching (Payments) ---
  const fetchPayments = useCallback(async () => {
    if (!date?.from) {
      toast.error("Please select a start date.")
      return
    }

    setLoading(true)
    setStatusMessage(null)
    setError(null)
    setPayments([])
    setTotalAmount(0)

    try {
      let query = supabase
        .from("student_payments")
        .select(
          `
          id,
          created_at,
          amount,
          payment_method,
          fees_type,
          receipt_no,
          transaction_id,
          notes,
          student:students (
            fullname,
            roll_number
          )
        `,
        )
        .order("created_at", { ascending: false })

      // --- Filter Logic ---
      
      // 1. Date Filter (Mandatory)
      query = query.gte("created_at", date.from.toISOString())
      if (date.to) {
        // addDays to include the full end day
        query = query.lte("created_at", addDays(date.to, 1).toISOString())
      }

      // 2. Payment Method Filter
      if (selectedMethod && selectedMethod !== "all") {
        query = query.eq("payment_method", selectedMethod)
      }

      // Execute Query
      const { data, error } = await query
      if (error) throw error

      if (data) {
        const flattenedData: PaymentRecord[] = data
          .map((item: any) => ({
            id: item.id,
            created_at: item.created_at,
            amount: item.amount,
            payment_method: item.payment_method,
            fees_type: item.fees_type,
            receipt_no: item.receipt_no,
            transaction_id: item.transaction_id,
            notes: item.notes,
            student_name: item.student?.fullname || "N/A",
            student_roll_number: item.student?.roll_number || "N/A",
          }))

        const total = flattenedData.reduce((acc, p) => acc + p.amount, 0)
        
        setPayments(flattenedData)
        setTotalAmount(total)

        if (flattenedData.length === 0) {
          setStatusMessage({
            type: "error",
            message: "No payments found matching the selected filters.",
          })
        }
      }
    } catch (err: any) {
      console.error("Error fetching payments:", err)
      setError(
        err.message || "An unknown error occurred while fetching payments.",
      )
    } finally {
      setLoading(false)
    }
  }, [supabase, date, selectedMethod])

  // --- Initial data load ---
  useEffect(() => {
    if (!loadingFilters) {
      // Load initial list for "This Month" and "All Methods"
      fetchPayments()
    }
  }, [fetchPayments, loadingFilters])


  // --- Filter Handlers ---
  const handleFilterClear = () => {
    setDate({ from: startOfMonth(new Date()), to: new Date() })
    setSelectedMethod("all")
    setGlobalFilter("")
    fetchPayments()
  }

  // --- EXPORT HANDLERS ---
  const handleExportToCSV = ()=> {
    if (payments.length === 0) {
      toast.error("No data to export.")
      return
    }
    
    const headers = [
      "Date",
      "Receipt No",
      "Student Name",
      "Roll Number",
      "Payment Method",
      "Fees Type",
      "Transaction ID",
      "Amount",
      "Notes",
    ]
    const csvContent = [
      headers.join(","),
      ...payments.map((p) =>
        [
          `"${format(new Date(p.created_at), "dd-MM-yyyy HH:mm")}"`,
          p.receipt_no,
          `"${p.student_name}"`,
          p.student_roll_number,
          p.payment_method,
          p.fees_type,
          p.transaction_id || "",
          p.amount,
          `"${p.notes || ""}"`,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `payment_report_${new Date().toISOString().slice(0, 10)}.csv`,
    )
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`Successfully exported ${payments.length} records to CSV.`)
  }

  const handleExportToPDF = ()=> {
     if (payments.length === 0) {
      toast.error("No data to export.")
      return
    }

    const doc = new jsPDF()
    const tableHead = [
      "Date",
      "Receipt",
      "Student",
      "Method",
      "Fees Type",
      "Amount",
    ]
    const tableBody = payments.map((p) => [
      format(new Date(p.created_at), "dd-MM-yy HH:mm"),
      p.receipt_no,
      p.student_name,
      p.payment_method,
      p.fees_type,
      formatCurrency(p.amount),
    ])

    doc.text("Payment Bifurcation Report", 14, 15)
    doc.setFontSize(10)
    doc.text(`Date Range: ${date?.from ? format(date.from, "dd-MM-yy") : 'N/A'} to ${date?.to ? format(date.to, "dd-MM-yy") : 'N/A'}`, 14, 20)
    doc.text(`Payment Method: ${selectedMethod === "all" ? "All Methods" : selectedMethod}`, 14, 25)
    doc.text(`Total Amount: ${formatCurrency(totalAmount)}`, 14, 30)
    
    autoTable(doc, {
      startY: 35,
      head: [tableHead],
      body: tableBody,
      theme: "striped",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }, // Blue theme
    })

    doc.save(
      `payment_report_${new Date().toISOString().slice(0, 10)}.pdf`,
    )
    toast.success(`Successfully exported ${payments.length} records to PDF.`)
  }


  // --- Table Columns Definition ---
  const columns: ColumnDef<PaymentRecord>[] = [
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
          {format(new Date(row.original.created_at), "dd-MM-yyyy HH:mm")}
        </div>
      ),
    },
    {
      accessorKey: "student_name",
      header: "Student",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.student_name}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.student_roll_number}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "receipt_no",
      header: "Receipt No.",
    },
    {
      accessorKey: "payment_method",
      header: "Method",
    },
    {
      accessorKey: "fees_type",
      header: "Fees Type",
    },
    {
      accessorKey: "transaction_id",
      header: "Transaction ID / Notes",
      cell: ({ row }) => (
        <div className="text-xs max-w-[200px] truncate">
          <p className="font-medium">{row.original.transaction_id || "N/A"}</p>
          <p className="text-muted-foreground truncate">{row.original.notes}</p>
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: () => <div className="text-right">Amount</div>,
      cell: ({ row }) => (
        <div className="text-right font-bold text-base">
          {formatCurrency(row.original.amount)}
        </div>
      ),
    },
  ]

  // --- Table Instance ---
  const table = useReactTable({
    data: payments,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    state: {
      sorting,
      globalFilter,
    },
  })

  // --- Main Page Render ---
  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <DollarSign className="h-8 w-8" />
            Payment Bifurcation
          </h1>
          <p className="text-lg text-muted-foreground">
            Filter payments by date and method to verify transactions.
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

      {/* 3. Filter Card */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Payment Report Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {/* Payment Method Filter */}
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select
                value={selectedMethod}
                onValueChange={setSelectedMethod}
                disabled={loadingFilters}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a method..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  {paymentMethods.map(method => (
                    <SelectItem key={method.name} value={method.name}>
                      {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row gap-2 justify-end pt-2">
            <Button
              variant="outline"
              onClick={handleExportToCSV}
              disabled={loading || payments.length === 0}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={handleExportToPDF}
              disabled={loading || payments.length === 0}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Printer className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button
              variant="outline"
              onClick={handleFilterClear}
              disabled={loading}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Clear
            </Button>
            <Button onClick={fetchPayments} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Run Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 4. Results Card */}
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col md:flex-row justify-between md:items-center">
          <div>
            <CardTitle>Filtered Payment Results</CardTitle>
            <CardDescription>
              {loading ? "Loading results..." : `Found ${table.getCoreRowModel().rows.length} matching payments.`}
            </CardDescription>
          </div>
          {/* Total Amount Summary */}
          <div className="p-4 bg-muted rounded-lg text-center md:text-right">
              <Label className="text-sm font-medium text-muted-foreground">
                Total Amount
              </Label>
              <p className="text-3xl font-bold text-primary">
                {formatCurrency(totalAmount)}
              </p>
            </div>
        </CardHeader>
        <CardContent>
          {/* Global Search for Table */}
           <div className="flex items-center py-4">
              <Input
                placeholder="Search in results (name, roll no, notes...)"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="max-w-sm"
              />
            </div>
          
          {/* Table */}
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
                        : "No payments found. Please adjust your filters and click 'Run Report'."}
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