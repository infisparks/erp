"use client"

import React, { useState, useEffect, useMemo, useTransition } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { toast } from "sonner"

// --- NEW PRIME REACT IMPORT ---
import { Dropdown } from "primereact/dropdown"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Loader2,
  Save,
  UserRound,
  Check,
  ArrowRight,
  Search,
} from "lucide-react"

// --- Type Definitions ---
interface Trust {
  id: string
  name: string
  current_balance: number
}
interface StudentSearchResult {
  id: string
  fullname: string | null
  roll_number: string | null
}
interface StudentAcademicYear {
  id: string
  academic_year_name: string
  academic_year_session: string
  course_name: string
  fullLabel: string // <-- NEW: For searching and display
}
interface FormOption {
  name: string
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
// Page: Assign to Student (Outflow)
// ---------------------------------
export default function AssignToStudentPage() {
  const [supabase] = useState(() => getSupabaseClient())
  const [isPending, startTransition] = useTransition()

  // --- Form State ---
  const [trustId, setTrustId] = useState<string>("")
  const [student, setStudent] = useState<StudentSearchResult | null>(null)
  const [academicYearId, setAcademicYearId] = useState<string>("")
  const [amount, setAmount] = useState("")
  const [notes, setNotes] = useState("")
  const [feesType, setFeesType] = useState<string>("")

  // --- Data for Selects ---
  const [trusts, setTrusts] = useState<Trust[]>([])
  const [studentYears, setStudentYears] = useState<StudentAcademicYear[]>([])
  const [feesTypes, setFeesTypes] = useState<FormOption[]>([])

  // --- Loading States ---
  const [loadingInitial, setLoadingInitial] = useState(true) // For trusts & fees
  const [loadingYears, setLoadingYears] = useState(false)
  const [loadingSearch, setLoadingSearch] = useState(false)

  // --- Student Search State ---
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<StudentSearchResult[]>([])
  const [popoverOpen, setPopoverOpen] = useState(false)

  const selectedTrust = useMemo(
    () => trusts.find(t => t.id === trustId),
    [trusts, trustId],
  )

  // --- Fetch Initial Data (Trusts & Fees Types) ---
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoadingInitial(true)
      const [trustsResult, feesResult] = await Promise.all([
        supabase
          .from("trusts")
          .select("id, name, current_balance")
          .order("name", { ascending: true }),
        supabase
          .from("form_config")
          .select("data_jsonb")
          .eq("data_name", "fees_types")
          .single(),
      ])

      if (trustsResult.error) {
        toast.error("Failed to load trusts.", {
          description: trustsResult.error.message,
        })
      } else {
        setTrusts(trustsResult.data as Trust[])
      }

      if (feesResult.error) {
        toast.error("Failed to load fees types.", {
          description: feesResult.error.message,
        })
      } else if (feesResult.data) {
        setFeesTypes(feesResult.data.data_jsonb as FormOption[])
      }
      setLoadingInitial(false)
    }
    fetchInitialData()
  }, [supabase])

  // --- Student Search Effect ---
  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([])
      return
    }
    const fetchStudents = async () => {
      setLoadingSearch(true)
      const { data, error } = await supabase
        .from("students")
        .select("id, fullname, roll_number")
        .or(
          `fullname.ilike.%${searchQuery}%,roll_number.ilike.%${searchQuery}%`,
        )
        .limit(10)
      if (!error && data) {
        setSearchResults(data as StudentSearchResult[])
      }
      setLoadingSearch(false)
    }
    const debounce = setTimeout(() => {
      fetchStudents()
    }, 300)
    return () => clearTimeout(debounce)
  }, [searchQuery, supabase])

  // --- Fetch Student's Academic Years ---
  const fetchAcademicYears = async (studentId: string) => {
    setLoadingYears(true)
    setAcademicYearId("")
    setStudentYears([])

    const { data, error } = await supabase
      .from("student_academic_years")
      .select(
        `
        id, academic_year_name, academic_year_session,
        course:courses ( name )
      `,
      )
      .eq("student_id", studentId)
      .order("academic_year_session", { ascending: false })

    if (error) {
      toast.error("Failed to fetch student's academic years.", {
        description: error.message,
      })
      setLoadingYears(false)
      return
    }

    // --- UPDATED to create 'fullLabel' ---
    const years = data.map((y: any) => {
      const courseName = y.course?.name || "N/A"
      return {
        id: y.id,
        academic_year_name: y.academic_year_name,
        academic_year_session: y.academic_year_session,
        course_name: courseName,
        fullLabel: `${y.academic_year_name} (${courseName} - ${y.academic_year_session})`,
      }
    })
    // ------------------------------------

    setStudentYears(years)
    setLoadingYears(false)
    // Auto-select the first (most recent) year
    if (years.length > 0) {
      setAcademicYearId(years[0].id)
    }
  }

  // --- Student Select Handler ---
  const handleStudentSelect = (selected: StudentSearchResult) => {
    setStudent(selected)
    setPopoverOpen(false)
    setSearchQuery("")
    fetchAcademicYears(selected.id)
  }

  // --- Form Reset ---
  const resetForm = () => {
    setTrustId("")
    setStudent(null)
    setAcademicYearId("")
    setAmount("")
    setNotes("")
    setFeesType("")
    setStudentYears([])
    setSearchQuery("")
  }

  // --- Form Submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const numAmount = parseFloat(amount)

    if (
      !trustId ||
      !student ||
      !academicYearId ||
      !feesType ||
      !numAmount ||
      numAmount <= 0
    ) {
      toast.error("Please fill all required fields with valid data.")
      return
    }

    if (selectedTrust && numAmount > selectedTrust.current_balance) {
      toast.error("Assignment failed.", {
        description: `Amount exceeds trust's available balance of ${formatCurrency(
          selectedTrust.current_balance,
        )}.`,
      })
      return
    }

    const selectedYear = studentYears.find(y => y.id === academicYearId)
    if (!selectedYear) {
      toast.error("Invalid academic year selected.")
      return
    }

    startTransition(async () => {
      const { error } = await supabase.rpc(
        "assign_trust_fund_to_student",
        {
          p_trust_id: trustId,
          p_student_id: student.id,
          p_student_academic_year_id: academicYearId,
          p_amount: numAmount,
          p_notes: notes,
          p_academic_year_session: selectedYear.academic_year_session,
          p_trust_name: selectedTrust?.name || "Unknown Trust",
          p_fees_type: feesType,
        },
      )

      if (error) {
        toast.error("Failed to assign funds.", { description: error.message })
      } else {
        toast.success(
          `Successfully assigned ${formatCurrency(numAmount)} to ${
            student.fullname
          }.`,
        )
        resetForm()
        // Refresh trust list to show new balance
        const { data, error } = await supabase
          .from("trusts")
          .select("id, name, current_balance")
          .order("name", { ascending: true })
        if (!error) setTrusts(data as Trust[])
      }
    })
  }

  // --- THIS HANDLER IS NOW USED BY PRIMEREACT DROPDOWN ---
  const handleYearChange = (newYearId: string) => {
    setAcademicYearId(newYearId)
  }

  // --- NEW: Template for PrimeReact Dropdown ---
  const academicYearTemplate = (option: StudentAcademicYear | null) => {
    if (option) {
      return (
        <div className="text-sm">
          <p className="font-medium">{option.academic_year_name}</p>
          <p className="text-xs text-muted-foreground">
            {option.course_name} - {option.academic_year_session}
          </p>
        </div>
      )
    }
    return <span className="text-sm text-muted-foreground">Select year...</span>
  }

  // --- NEW: Template for the selected value in PrimeReact Dropdown ---
  const selectedYearTemplate = (option: StudentAcademicYear | null, props: any) => {
     if (option) {
      return (
        <div className="text-sm">
            {option.fullLabel}
        </div>
      )
    }
    
    return (
      <span className="text-sm text-muted-foreground">
        {props.placeholder}
      </span>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Assign Funds to Student (Outflow)</CardTitle>
        <CardDescription>
          Transfer funds from a trust to a student. This creates a
          <strong> student payment record</strong> and
          <strong> reduces the trust's balance</strong>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loadingInitial ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* --- Step 1: Select Trust --- */}
            <div className="space-y-2">
              <Label htmlFor="outflow-trust">1. Select Trust*</Label>
              <Select value={trustId} onValueChange={setTrustId}>
                <SelectTrigger id="outflow-trust">
                  <SelectValue placeholder="Select a trust..." />
                </SelectTrigger>
                <SelectContent>
                  {trusts.map(trust => (
                    <SelectItem key={trust.id} value={trust.id}>
                      {trust.name} (Balance:{" "}
                      {formatCurrency(trust.current_balance)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTrust &&
                amount &&
                parseFloat(amount) > selectedTrust.current_balance && (
                  <p className="text-xs text-destructive">
                    Warning: Amount exceeds available balance.
                  </p>
                )}
            </div>

            {/* --- Step 2: Select Student --- */}
            <div className="space-y-2">
              <Label>2. Select Student*</Label>
              {student ? (
                <div className="flex items-center justify-between p-2 border rounded-md bg-muted">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {student.fullname?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{student.fullname}</p>
                      <p className="text-xs text-muted-foreground">
                        Roll: {student.roll_number}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStudent(null)}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between font-normal"
                    >
                      Search by name or roll number...
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search name/roll..."
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                        disabled={loadingSearch}
                      />
                      <CommandEmpty>
                        {loadingSearch ? "Searching..." : "No student found."}
                      </CommandEmpty>
                      <CommandList>
                        {searchResults.map(s => (
                          <CommandItem
                            key={s.id}
                            value={`${s.fullname} ${s.roll_number}`}
                            onSelect={() => handleStudentSelect(s)}
                          >
                            <Check className="mr-2 h-4 w-4 opacity-0" />
                            {s.fullname} (Roll: {s.roll_number})
                          </CommandItem>
                        ))}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            </div>

            {/* --- Step 3: Select Academic Year (NOW PRIMEREACT) --- */}
            {student && (
              <div className="space-y-2">
                <Label htmlFor="outflow-year">3. Select Academic Year*</Label>
                {loadingYears ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading academic years...
                  </div>
                ) : (
                  <Dropdown
                    id="outflow-year"
                    value={academicYearId}
                    onChange={e => handleYearChange(e.value)}
                    options={studentYears}
                    optionValue="id" // The value to store in state
                    filter // Enable search
                    filterBy="fullLabel" // Search using our combined label
                    placeholder="Select student's academic year..."
                    disabled={studentYears.length === 0}
                    itemTemplate={academicYearTemplate} // How each item in the list looks
                    valueTemplate={selectedYearTemplate} // How the selected item looks
                    className="w-full [&_.p-dropdown-label]:px-3 [&_.p-dropdown-label]:py-2"
                    panelClassName="text-sm"
                  />
                )}
              </div>
            )}

            {/* --- Steps 4, 5, 6 --- */}
            {academicYearId && (
              <>
                {/* --- Step 4: Select Fees Type --- */}
                <div className="space-y-2">
                  <Label htmlFor="outflow-fees-type">4. Select Fees Type*</Label>
                  <Select
                    value={feesType}
                    onValueChange={setFeesType}
                    disabled={feesTypes.length === 0}
                  >
                    <SelectTrigger id="outflow-fees-type">
                      <SelectValue placeholder="Select a fees type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {feesTypes.length === 0 ? (
                        <div className="p-4 text-sm text-muted-foreground">
                          No fees types found in config.
                        </div>
                      ) : (
                        feesTypes.map(ft => (
                          <SelectItem key={ft.name} value={ft.name}>
                            {ft.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="outflow-amount">5. Amount to Assign*</Label>
                  <Input
                    id="outflow-amount"
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="outflow-notes">6. Notes (Optional)</Label>
                  <Textarea
                    id="outflow-notes"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="e.g., For Semester 3 fees"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    isPending ||
                    !trustId ||
                    !student ||
                    !academicYearId ||
                    !feesType ||
                    !amount
                  }
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4 mr-2" />
                  )}
                  Assign Funds to Student
                </Button>
              </>
            )}
          </form>
        )}
      </CardContent>
    </Card>
  )
}