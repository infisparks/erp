"use client"

import React, { useState, useEffect, Suspense, useMemo } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase/client'
import { SupabaseClient } from '@supabase/supabase-js'

// --- ShadCN UI Components ---
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { Separator } from '@/components/ui/separator'


// --- Icons ---
import {
  Loader2,
  Save,
  X,
  AlertTriangle,
  ArrowLeft,
  UserRound,
  ChevronsUpDown,
  Check,
  History,
  ChevronDown,
  Printer,
} from "lucide-react"
import { Header } from '@radix-ui/react-accordion'

// --- Type Definitions ---
// --- UPDATED: Base student details ---
interface StudentBaseDetails {
  id: string;
  fullname: string | null;
  roll_number: string | null;
  photo_path: string | null;
}

// --- UPDATED: Details for a specific academic year ---
interface StudentAcademicYearDetails {
  student_academic_year_id: string; // id from student_academic_years
  course_name: string;
  academic_year_name: string;
  academic_year: string; // The session string, e.g. "2024 - 2025"
  net_payable_fee: number;
  total_fee: number;
  scholarship_amount: number;
  is_registered: boolean;
  total_tuition_paid: number; // --- ADDED: Pre-calculated sum
}

interface Payment {
  id: string;
  amount: number;
  fees_type: string | null;
  payment_method: string | null;
  created_at: string;
}

interface FormOption { name: string; }

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

const FeeSummaryRow: React.FC<{ label: string; value: number | null | undefined; colorClass?: string; isTotal?: boolean; isSubtle?: boolean }> = ({ label, value, colorClass = "text-foreground", isTotal = false, isSubtle = false }) => (
  <div className={`flex justify-between items-center ${isTotal ? "py-2 border-t mt-2" : "py-1"}`}>
    <span className={`text-sm ${isTotal ? "font-bold" : isSubtle ? "text-muted-foreground pl-4" : "text-muted-foreground"}`}>
      {label}
    </span>
    <span className={`font-bold ${isTotal ? "text-lg" : "text-base"} ${colorClass}`}>
      {(value || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 })}
    </span>
  </div>
)

const PaymentHistoryList: React.FC<{ payments: Payment[] }> = ({ payments }) => {
  if (payments.length === 0) {
    return <p className="text-sm text-center text-muted-foreground py-4">No payments in this category.</p>
  }
  
  return (
    <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
      {payments.map(payment => (
        <div key={payment.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
          <div className="flex-grow">
            <p className="font-medium">{payment.payment_method}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(payment.created_at).toLocaleString('en-IN', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
            <span className="text-base font-bold text-primary">
              {payment.amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 })}
            </span>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/student/fees/receipt?id=${payment.id}`} target="_blank">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Link>
          </Button>
        </div>
      ))}
    </div>
  )
}


function AddPaymentPage() {
  const supabase = getSupabaseClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const studentId = searchParams.get('student_id')

  // --- State ---
  const [student, setStudent] = useState<StudentBaseDetails | null>(null);
  const [allAcademicYears, setAllAcademicYears] = useState<StudentAcademicYearDetails[]>([]);
  const [selectedYearData, setSelectedYearData] = useState<StudentAcademicYearDetails | null>(null);
  
  const [tuitionPaid, setTuitionPaid] = useState(0);
  const [scholarshipPaid, setScholarshipPaid] = useState(0);
  const [otherFeesPaid, setOtherFeesPaid] = useState(0);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);

  const [loading, setLoading] = useState(true) // For initial student/year load
  const [loadingPayments, setLoadingPayments] = useState(false); // For payment history
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // --- Form config state ---
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [paymentTypes, setPaymentTypes] = useState<FormOption[]>([])
  const [feesTypes, setFeesTypes] = useState<FormOption[]>([])
  const [bankNames, setBankNames] = useState<FormOption[]>([])

  const [newPaymentData, setNewPaymentData] = useState({
    amount: '',
    payment_method: '',
    fees_type: '',
    bank_name: '',
    cheque_number: '',
    transaction_id: '',
    trust_name: '',
    trust_id: '',
    notes: '',
  })

  // --- Data Fetching (UPDATED) ---
  useEffect(() => {
    if (!studentId) {
      setError("Student ID not provided.")
      setLoading(false)
      setLoadingConfig(false)
      return
    }

    const fetchStudentAndConfigs = async () => {
      setLoading(true)
      setLoadingConfig(true)
      setError(null)
      
      try {
        const [
          studentResult,
          academicYearsResult,
          allPaymentsResult, // --- NEW: Fetch all payments upfront
          paymentTypesResult,
          feesTypesResult,
          bankNamesResult
        ] = await Promise.all([
          // 1. Fetch base student details
          supabase
            .from("students")
            .select("id, fullname, photo_path, roll_number")
            .eq('id', studentId)
            .single(),
          
          // 2. Fetch all academic years for this student
          supabase
            .from("student_academic_years")
            .select(`
              id,
              student_id,
              academic_year_session,
              academic_year_name, 
              total_fee,
              scholarship_amount,
              net_payable_fee,
              is_registered, 
              course:courses ( name )
            `)
            .eq('student_id', studentId)
            .order("academic_year_session", { ascending: false }),

          // 3. --- NEW: Fetch all "Tuition Fee" payments for this student
          supabase
            .from("student_payments")
            .select("amount, academic_year")
            .eq("student_id", studentId)
            .eq("fees_type", "Tuition Fee"),

          // 4. Fetch Form Configs
          supabase.from("form_config").select("data_jsonb").eq("data_name", "payment_types").single(),
          supabase.from("form_config").select("data_jsonb").eq("data_name", "fees_types").single(),
          supabase.from("form_config").select("data_jsonb").eq("data_name", "bank_names").single()
        ]);

        // --- 1. Process Student Details ---
        if (studentResult.error) throw new Error(`Student Fetch Error: ${studentResult.error.message}`);
        if (studentResult.data) {
          setStudent(studentResult.data as StudentBaseDetails);
        } else {
          throw new Error("Student not found.")
        }

        // --- 2. --- NEW: Process Payments into a lookup map ---
        if (allPaymentsResult.error) throw new Error(`Payments Fetch Error: ${allPaymentsResult.error.message}`);
        const tuitionPaidPerYear: { [key: string]: number } = {};
        if (allPaymentsResult.data) {
          for (const payment of allPaymentsResult.data) {
            if (payment.academic_year) {
              const currentPaid = tuitionPaidPerYear[payment.academic_year] || 0;
              tuitionPaidPerYear[payment.academic_year] = currentPaid + payment.amount;
            }
          }
        }
        
        // --- 3. Process Academic Years (UPDATED) ---
        if (academicYearsResult.error) throw new Error(`Academic Years Fetch Error: ${academicYearsResult.error.message}`);
        if (academicYearsResult.data) {
          const yearDetails: StudentAcademicYearDetails[] = academicYearsResult.data.map((ay: any) => ({
            student_academic_year_id: ay.id,
            course_name: ay.course?.name || 'N/A',
            academic_year_name: ay.academic_year_name,
            academic_year: ay.academic_year_session,
            net_payable_fee: ay.net_payable_fee || 0,
            total_fee: ay.total_fee || 0,
            scholarship_amount: ay.scholarship_amount || 0,
            is_registered: ay.is_registered || false,
            // --- NEW: Add the pre-calculated sum ---
            total_tuition_paid: tuitionPaidPerYear[ay.academic_year_session] || 0,
          }));
          setAllAcademicYears(yearDetails);
        }

        // --- 4. Process Form Configs ---
        if (paymentTypesResult.data) setPaymentTypes(paymentTypesResult.data.data_jsonb as FormOption[])
        if (feesTypesResult.data) setFeesTypes(feesTypesResult.data.data_jsonb as FormOption[])
        if (bankNamesResult.data) setBankNames(bankNamesResult.data.data_jsonb as FormOption[])

      } catch (err: any) {
        console.error("Error fetching data:", err)
        setError(err.message || "Failed to load page data.")
      } finally {
        setLoading(false)
        setLoadingConfig(false)
      }
    }
    
    fetchStudentAndConfigs()
  }, [studentId, supabase])
  
  // --- This function is now for the DETAILED history list and summary card ---
  const fetchPaymentHistory = async (yearSession: string) => {
    if (!studentId) return;

    setLoadingPayments(true);
    setPaymentHistory([]);
    setTuitionPaid(0);
    setScholarshipPaid(0);
    setOtherFeesPaid(0);

    try {
      const { data: paymentResult, error: paymentError } = await supabase
        .from("student_payments")
        .select("id, amount, fees_type, payment_method, created_at")
        .eq("student_id", studentId)
        .eq("academic_year", yearSession);

      if (paymentError) throw new Error(`Payment Fetch Error: ${paymentError.message}`);
        
      const allPayments = (paymentResult as Payment[]) || [];
      
      setPaymentHistory(
        allPayments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      );

      if (allPayments.length > 0) {
          let tuitionSum = 0;
          let scholarshipSum = 0;
          let otherFeesSum = 0;
          
          for (const p of allPayments) {
            if (p.fees_type === 'Tuition Fee') {
              tuitionSum += p.amount;
            } else if (p.fees_type === 'Scholarship') {
              scholarshipSum += p.amount;
            } else {
              otherFeesSum += p.amount;
            }
          }
          
          setTuitionPaid(tuitionSum);
          setScholarshipPaid(scholarshipSum);
          setOtherFeesPaid(otherFeesSum);
      }
    } catch (err: any) {
      console.error("Error fetching payment history:", err);
      setError(err.message || "Failed to load payment history.");
    } finally {
      setLoadingPayments(false);
    }
  }

  // --- Handler for year selection ---
  const handleYearSelect = (selectedYearId: string) => {
    const yearData = allAcademicYears.find(y => y.student_academic_year_id === selectedYearId);
    if (yearData) {
      setSelectedYearData(yearData);
      fetchPaymentHistory(yearData.academic_year); // Fetch detailed history for this year
    } else {
      setSelectedYearData(null);
      setPaymentHistory([]);
    }
  }

  // --- Form Handlers ---
  const handlePaymentFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewPaymentData(prev => ({ ...prev, [name]: value }));
  }

  const handleSelectChange = (name: string, value: string) => {
    setNewPaymentData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'payment_method') {
      if (value !== 'Cheque') {
        setNewPaymentData(prev => ({ ...prev, bank_name: '', cheque_number: '' }));
      }
      if (value !== 'Razorpay' && value !== 'Online (UPI)' && value !== 'Bank Transfer (NEFT/RTGS)') {
        setNewPaymentData(prev => ({ ...prev, transaction_id: '' }));
      }
      if (value !== 'Trust') {
        setNewPaymentData(prev => ({ ...prev, trust_name: '', trust_id: '' }));
      }
    }
  }
  
  const handleBankSelectChange = (value: string | null) => {
     setNewPaymentData(prev => ({ ...prev, bank_name: value || '' }));
  }

  // --- Payment Submit Handler ---
  const handleAddPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!student || !selectedYearData) {
      setError("No student or academic year selected.")
      return
    }
    
    const amount = parseFloat(newPaymentData.amount)
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid, positive amount.")
      return
    }
    
    if (!newPaymentData.payment_method || !newPaymentData.fees_type) {
      setError("Please select a payment method and fees type.")
      return
    }

    setIsSubmitting(true)
    setError(null)
    
    try {
      const { data: newPayment, error: insertError } = await supabase
        .from("student_payments")
        .insert({
          student_id: student.id,
          academic_year: selectedYearData.academic_year,
          student_academic_year_id: selectedYearData.student_academic_year_id,
          amount: amount,
          payment_method: newPaymentData.payment_method,
          fees_type: newPaymentData.fees_type,
          bank_name: newPaymentData.bank_name || null,
          cheque_number: newPaymentData.cheque_number || null,
          transaction_id: newPaymentData.transaction_id || null,
          trust_name: newPaymentData.trust_name || null,
          trust_id: newPaymentData.trust_id || null,
          notes: newPaymentData.notes || null,
        })
        .select('id')
        .single();
        
      if (insertError) throw insertError
      
      if (newPayment && newPayment.id) {
        router.push(`/student/fees/receipt?id=${newPayment.id}`);
      } else {
        router.push('/student/fees');
      }
      
    } catch (err: any) {
      console.error("Error adding payment:", err)
      setError(err.message || "Failed to add payment.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- Avatar URL ---
  const avatarUrl = useMemo(() => {
    if (student?.photo_path) {
      return supabase.storage.from('student_documents').getPublicUrl(student.photo_path).data.publicUrl
    }
    return null
  }, [student, supabase])

  // --- Memoized options for selects ---
  const paymentTypeOptions = useMemo(() => paymentTypes.map(p => ({ label: p.name, value: p.name })), [paymentTypes])
  const feesTypeOptions = useMemo(() => feesTypes.map(f => ({ label: f.name, value: f.name })), [feesTypes])
  const bankNameOptions = useMemo(() => bankNames.map(b => ({ label: b.name, value: b.name })), [bankNames])
  
  // --- Options for year dropdown (NOW USES PRE-CALCULATED DATA) ---
  const academicYearOptions = useMemo(() => 
    allAcademicYears
      .filter(ay => ay.is_registered === true)
      .map(ay => {
        
        // --- THIS IS THE FIX ---
        // Calculate remaining due from the pre-fetched data
        const remainingDueForYear = ay.net_payable_fee - ay.total_tuition_paid;
        
        const dueAmount = (remainingDueForYear).toLocaleString('en-IN', { 
          style: 'currency', 
          currency: 'INR', 
          minimumFractionDigits: 0 
        });
        
        const labelText = remainingDueForYear > 0 ? "Remaining Due" : remainingDueForYear < 0 ? "Paid Extra" : "Cleared";
        // --- END OF FIX ---

        return {
          label: `${ay.academic_year_name} (${ay.academic_year}) - ${ay.course_name} (${labelText}: ${dueAmount})`,
          value: ay.student_academic_year_id
        };
      }), 
  [allAcademicYears]) // <-- Dependency is now just allAcademicYears

  // --- Memoized Calculations for the SUMMARY CARD (uses state) ---
  const remainingDue = useMemo(() => {
      const totalNetPayable = selectedYearData?.net_payable_fee || 0;
      return totalNetPayable - tuitionPaid;
  }, [selectedYearData, tuitionPaid])
  
  const remainingScholarship = useMemo(() => {
      const totalAllocated = selectedYearData?.scholarship_amount || 0;
      return totalAllocated - scholarshipPaid;
  }, [selectedYearData, scholarshipPaid])
  
  // --- Memoized value for button disabled state ---
  const isFormInvalid = useMemo(() => {
    const amount = parseFloat(newPaymentData.amount)
    return isSubmitting || !newPaymentData.fees_type || !newPaymentData.payment_method || isNaN(amount) || amount <= 0
  }, [isSubmitting, newPaymentData.fees_type, newPaymentData.payment_method, newPaymentData.amount])


  // --- Render Logic ---
  const renderContent = () => {
    if (loading || loadingConfig) {
      return (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )
    }
    
    if (error && !student) { 
      return (
         <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error || "Could not load student details."}</AlertDescription>
          </Alert>
      )
    }
    
    return (
      <>
        <CardContent className="pt-6 space-y-6">
          {/* --- Student Info Header --- */}
          {student && (
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <Avatar className="h-16 w-16 rounded-lg">
                <AvatarImage 
                  src={avatarUrl || undefined} 
                  alt={student.fullname || "Student Photo"} 
                  className="rounded-lg object-cover"
                />
                <AvatarFallback className="rounded-lg bg-background">
                  <UserRound className="h-8 w-8 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xl font-semibold">{student.fullname}</p>
                <p className="text-sm text-muted-foreground">
                  Roll No: {student.roll_number}
                </p>
              </div>
            </div>
          )}
          
          {/* --- Config Error --- */}
          {error && !loading && (
             <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
          )}

          {/* --- Year Selector --- */}
          {!loading && academicYearOptions.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="academicYearSelect" className="text-lg font-semibold">Select Academic Year to Manage</Label>
              <Select onValueChange={handleYearSelect} value={selectedYearData?.student_academic_year_id}>
                <SelectTrigger id="academicYearSelect">
                  <SelectValue placeholder="Select a year..." />
                </SelectTrigger>
                <SelectContent>
                  {academicYearOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* --- No Registered Years Alert --- */}
          {!loading && academicYearOptions.length === 0 && student && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>No Registered Years</AlertTitle>
              <AlertDescription>
                This student has no academic years marked as 'registered'. Please register the student for an academic year to add payments.
              </AlertDescription>
            </Alert>
          )}


          {/* --- Conditional Content: Show only after year is selected --- */}
          {loadingPayments && (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}

          {!loadingPayments && selectedYearData && (
            <>
              {/* Payment History Tabs (Collapsible) */}
              <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                <div className="p-4 border bg-background rounded-lg space-y-2">
                  <CollapsibleTrigger asChild>
                    <button className="flex justify-between items-center w-full">
                      <h4 className="text-lg font-semibold flex items-center">
                        <History className="h-5 w-5 mr-2" />
                        Payment History
                      </h4>
                      <ChevronDown className={`h-5 w-5 transition-transform ${isHistoryOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <Tabs defaultValue="all" className="w-full mt-4">
                      <div className="w-full overflow-x-auto pb-1">
                        <TabsList className="w-min">
                          <TabsTrigger value="all">All</TabsTrigger>
                          {feesTypeOptions.map(option => (
                            <TabsTrigger key={option.value} value={option.value}>
                              {option.label}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                      </div>

                      <TabsContent value="all" className="mt-2">
                        <PaymentHistoryList payments={paymentHistory} />
                      </TabsContent>
                      
                      {feesTypeOptions.map(option => (
                        <TabsContent key={option.value} value={option.value} className="mt-2">
                          <PaymentHistoryList 
                            payments={paymentHistory.filter(p => p.fees_type === option.value)} 
                          />
                        </TabsContent>
                      ))}
                    </Tabs>
                  </CollapsibleContent>
                </div>
              </Collapsible>

              {/* Financial Summary (This uses the 'tuitionPaid' state) */}
              <div className="p-4 border bg-background rounded-lg space-y-1">
                <h4 className="text-lg font-semibold mb-2">Financial Summary for {selectedYearData.academic_year}</h4>
                <FeeSummaryRow 
                    label="Total Course Fee" 
                    value={selectedYearData.total_fee}
                />
                <Separator className="my-2" />
                <FeeSummaryRow 
                    label="Total Scholarship" 
                    value={selectedYearData.scholarship_amount}
                    colorClass="text-orange-600"
                />
                <FeeSummaryRow 
                    label="Scholarship Used" 
                    value={scholarshipPaid}
                    colorClass="text-orange-600"
                    isSubtle={true}
                />
                <FeeSummaryRow 
                    label="Scholarship Remaining" 
                    value={remainingScholarship}
                    colorClass="text-orange-600"
                    isSubtle={true}
                />
                <Separator className="my-2" />
                <FeeSummaryRow 
                    label="Net Payable (Tuition)" 
                    value={selectedYearData.net_payable_fee}
                    colorClass="text-primary"
                    isTotal={true}
                />
                <FeeSummaryRow 
                    label="Total Paid (Tuition Fee)" 
                    value={tuitionPaid}
                    colorClass="text-green-600"
                />
                
                {/* --- This uses the 'remainingDue' memo, which is correct --- */}
                <FeeSummaryRow 
                    label={remainingDue > 0 ? "Remaining Due (Tuition)" : remainingDue < 0 ? "Paid Extra (Tuition)" : "Tuition Cleared"}
                    value={remainingDue}
                    colorClass={remainingDue > 0 ? "text-destructive" : "text-green-600"}
                    isTotal={true}
                />

                <Separator className="my-2" />
                <FeeSummaryRow 
                    label="Paid (Other Fees)" 
                    value={otherFeesPaid}
                    colorClass="text-blue-600"
                />
              </div>
            
              {/* Form Fields */}
              <form onSubmit={handleAddPaymentSubmit} className="space-y-4 pt-6 border-t">
                <h4 className="text-lg font-semibold">Add New Payment</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="font-medium">Amount*</Label>
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      placeholder="0.00"
                      value={newPaymentData.amount}
                      onChange={handlePaymentFormChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium">Fees Type*</Label>
                    <Select
                      value={newPaymentData.fees_type}
                      onValueChange={(val) => handleSelectChange('fees_type', val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select fees type" />
                      </SelectTrigger>
                      <SelectContent>
                        {feesTypeOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-medium">Payment Method*</Label>
                  <Select
                    value={newPaymentData.payment_method}
                    onValueChange={(val) => handleSelectChange('payment_method', val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentTypeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Conditional Fields */}
                {newPaymentData.payment_method === 'Cheque' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border bg-muted rounded-lg">
                    <div className="space-y-2">
                      <Label className="font-medium">Bank Name*</Label>
                      <SearchableSelect
                        options={bankNameOptions}
                        value={newPaymentData.bank_name}
                        onChange={handleBankSelectChange}
                        placeholder="Search bank..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cheque_number" className="font-medium">Cheque Number</Label>
                      <Input
                        id="cheque_number"
                        name="cheque_number"
                        placeholder="e.g. 123456"
                        value={newPaymentData.cheque_number}
                        onChange={handlePaymentFormChange}
                      />
                    </div>
                  </div>
                )}
                
                {(newPaymentData.payment_method === 'Razorpay' ||
                  newPaymentData.payment_method === 'Online (UPI)' ||
                  newPaymentData.payment_method === 'Bank Transfer (NEFT/RTGS)') && (
                  <div className="p-4 border bg-muted rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="transaction_id" className="font-medium">Transaction ID</Label>
                      <Input
                        id="transaction_id"
                        name="transaction_id"
                        placeholder="Enter transaction/payment ID"
                        value={newPaymentData.transaction_id}
                        onChange={handlePaymentFormChange}
                      />
                    </div>
                  </div>
                )}

                {newPaymentData.payment_method === 'Trust' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border bg-muted rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="trust_name" className="font-medium">Trust Name (Optional)</Label>
                      <Input
                        id="trust_name"
                        name="trust_name"
                        placeholder="Enter trust name"
                        value={newPaymentData.trust_name}
                        onChange={handlePaymentFormChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trust_id" className="font-medium">Trust ID (Optional)</Label>
                      <Input
                        id="trust_id"
                        name="trust_id"
                        placeholder="Enter trust ID"
                        value={newPaymentData.trust_id}
                        onChange={handlePaymentFormChange}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes" className="font-medium">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Add any additional notes for this payment..."
                    value={newPaymentData.notes}
                    onChange={handlePaymentFormChange}
                  />
                </div>
                
                {/* Error message for submission */}
                {error && !isSubmitting && (
                  <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Payment Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Form Actions */}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" asChild>
                    <Link href="/student/fees">
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Link>
                  </Button>
                  <Button type="submit" disabled={isFormInvalid}>
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Payment
                  </Button>
                </div>
              </form>
            </>
          )}
        </CardContent>
      </>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Button variant="outline" size="icon" asChild>
                <Link href="/student/fees">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <CardTitle className="text-2xl">Add New Payment</CardTitle>
            </div>
            <CardDescription>
              Select a student's academic year to add a payment record.
            </CardDescription>
          </CardHeader>
          {renderContent()}
        </Card>
      </div>
    </div>
  )
}

// Wrap the component in Suspense to safely use useSearchParams
export default function AddPaymentPageWrapper() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>}>
      <AddPaymentPage />
    </Suspense>
  )
}