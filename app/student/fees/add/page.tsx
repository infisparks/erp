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
  Printer, // --- NEW ---
} from "lucide-react"

// --- Type Definitions ---
interface StudentDetails {
  student_id: string;
  fullname: string | null;
  roll_number: string | null;
  photo_path: string | null;
  course_name: string;
  academic_year: string;
  original_admission_fee: number;
  original_total_fee: number;
  original_scholarship_amount: number;
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

// --- UPDATED: Payment History List with Print Button ---
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
  const academicYear = searchParams.get('year')

  // --- State ---
  const [student, setStudent] = useState<StudentDetails | null>(null)
  const [tuitionPaid, setTuitionPaid] = useState(0);
  const [scholarshipPaid, setScholarshipPaid] = useState(0);
  const [otherFeesPaid, setOtherFeesPaid] = useState(0);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // --- Form config state ---
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [paymentTypes, setPaymentTypes] = useState<FormOption[]>([])
  const [feesTypes, setFeesTypes] = useState<FormOption[]>([])
  const [bankNames, setBankNames] = useState<FormOption[]>([])

  // --- UPDATED: Added trust fields ---
  const [newPaymentData, setNewPaymentData] = useState({
    amount: '',
    payment_method: '',
    fees_type: '',
    bank_name: '',
    cheque_number: '',
    transaction_id: '',
    trust_name: '', // --- NEW ---
    trust_id: '',   // --- NEW ---
    notes: '',
  })

  // --- Data Fetching ---
  useEffect(() => {
    if (!studentId || !academicYear) {
      setError("Student ID or Academic Year not provided.")
      setLoading(false)
      setLoadingConfig(false)
      return
    }

    const fetchAllData = async () => {
      setLoading(true)
      setLoadingConfig(true)
      setError(null)
      
      try {
        const [
          studentResult,
          paymentResult,
          paymentTypesResult,
          feesTypesResult,
          bankNamesResult
        ] = await Promise.all([
          supabase
            .from("students")
            .select(
              `
              id,
              fullname,
              photo_path,
              original_admission_fee,
              original_total_fee,
              original_scholarship_amount,
              student_semesters (
                roll_number,
                course:courses ( name )
              )
              `
            )
            .eq('id', studentId)
            .eq('student_semesters.academic_year', academicYear)
            .limit(1, { foreignTable: 'student_semesters' })
            .single(),
          
          supabase
            .from("student_payments")
            .select("id, amount, fees_type, payment_method, created_at")
            .eq("student_id", studentId)
            .eq("academic_year", academicYear),

          // Fetch Form Configs
          supabase.from("form_config").select("data_jsonb").eq("data_name", "payment_types").single(),
          supabase.from("form_config").select("data_jsonb").eq("data_name", "fees_types").single(),
          supabase.from("form_config").select("data_jsonb").eq("data_name", "bank_names").single()
        ]);

        // --- 1. Process Student Details ---
        if (studentResult.error) throw new Error(`Student Fetch Error: ${studentResult.error.message}`);
        if (studentResult.data) {
          const data = studentResult.data as any;
          const enrollment = data.student_semesters[0];
          
          const details: StudentDetails = {
            student_id: data.id,
            fullname: data.fullname,
            photo_path: data.photo_path,
            original_admission_fee: data.original_admission_fee || 0,
            original_total_fee: data.original_total_fee || 0,
            original_scholarship_amount: data.original_scholarship_amount || 0,
            academic_year: academicYear,
            roll_number: enrollment?.roll_number || "N/A",
            course_name: enrollment?.course?.name || "N/A",
          }
          setStudent(details)
        } else {
          throw new Error("Student enrollment not found for this academic year.")
        }
        
        // --- 2. Process Payment History ---
        if (paymentResult.error) throw new Error(`Payment Fetch Error: ${paymentResult.error.message}`);
        
        const allPayments = (paymentResult.data as Payment[]) || [];
        
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

        // --- 3. Process Form Configs ---
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
    
    fetchAllData()
  }, [studentId, academicYear, supabase])
  
  // --- Form Handlers ---
  const handlePaymentFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewPaymentData(prev => ({ ...prev, [name]: value }));
  }

  const handleSelectChange = (name: string, value: string) => {
    setNewPaymentData(prev => ({ ...prev, [name]: value }));
    
    // Clear conditional fields if payment method changes
    if (name === 'payment_method') {
      if (value !== 'Cheque') {
        setNewPaymentData(prev => ({ ...prev, bank_name: '', cheque_number: '' }));
      }
      if (value !== 'Razorpay' && value !== 'Online (UPI)' && value !== 'Bank Transfer (NEFT/RTGS)') {
        setNewPaymentData(prev => ({ ...prev, transaction_id: '' }));
      }
      // --- NEW: Clear trust fields if not 'Trust' ---
      if (value !== 'Trust') {
        setNewPaymentData(prev => ({ ...prev, trust_name: '', trust_id: '' }));
      }
    }
  }
  
  const handleBankSelectChange = (value: string | null) => {
     setNewPaymentData(prev => ({ ...prev, bank_name: value || '' }));
  }

  const handleAddPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!student) {
      setError("No student selected.")
      return
    }
    
    const amount = parseFloat(newPaymentData.amount)
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid, positive amount.")
      return
    }
    
    // This check is now also enforced by the button's disabled state
    if (!newPaymentData.payment_method || !newPaymentData.fees_type) {
      setError("Please select a payment method and fees type.")
      return
    }

    setIsSubmitting(true)
    setError(null)
    
    try {
      // --- UPDATED: Insert and select the new ID, include trust fields ---
      const { data: newPayment, error: insertError } = await supabase
        .from("student_payments")
        .insert({
          student_id: student.student_id,
          academic_year: student.academic_year,
          amount: amount,
          payment_method: newPaymentData.payment_method,
          fees_type: newPaymentData.fees_type,
          bank_name: newPaymentData.bank_name || null,
          cheque_number: newPaymentData.cheque_number || null,
          transaction_id: newPaymentData.transaction_id || null,
          trust_name: newPaymentData.trust_name || null, // --- NEW ---
          trust_id: newPaymentData.trust_id || null,     // --- NEW ---
          notes: newPaymentData.notes || null,
        })
        .select('id') // Get the ID of the new row
        .single(); // We only inserted one
        
      if (insertError) throw insertError
      
      // --- UPDATED: Redirect to receipt page with full path ---
      if (newPayment && newPayment.id) {
        // Redirect to a receipt page with the new payment ID
        router.push(`/student/fees/receipt?id=${newPayment.id}`);
      } else {
        // Fallback: just go back to the fees list
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

  // --- Memoized Calculations ---
  const remainingDue = useMemo(() => {
      const totalNetPayable = student?.original_admission_fee || 0;
      return totalNetPayable - tuitionPaid;
  }, [student, tuitionPaid])
  
  const remainingScholarship = useMemo(() => {
      const totalAllocated = student?.original_scholarship_amount || 0;
      return totalAllocated - scholarshipPaid;
  }, [student, scholarshipPaid])
  
  // --- NEW: Memoized value for button disabled state ---
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
    
    if (error || !student) {
      return (
         <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error || "Could not load student details."}</AlertDescription>
          </Alert>
      )
    }
    
    return (
      <form onSubmit={handleAddPaymentSubmit}>
        <CardContent className="pt-6 space-y-6">
          {/* Student Info Header */}
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
                {student.course_name}
              </p>
              <p className="text-sm text-muted-foreground">
                Roll No: {student.roll_number} | Year: {student.academic_year}
              </p>
            </div>
          </div>

          {/* --- MOVED: Payment History Tabs (Collapsible) --- */}
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
                    <TabsList className="w-min"> {/* w-min ensures it fits content */}
                      <TabsTrigger value="all">All</TabsTrigger>
                      {feesTypeOptions.map(option => (
                        <TabsTrigger key={option.value} value={option.value}>
                          {option.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  {/* "All" Tab Content */}
                  <TabsContent value="all" className="mt-2">
                    <PaymentHistoryList payments={paymentHistory} />
                  </TabsContent>
                  
                  {/* Dynamic Tab Content */}
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

          {/* Financial Summary */}
          <div className="p-4 border bg-background rounded-lg space-y-1">
            <h4 className="text-lg font-semibold mb-2">Financial Summary for {student.academic_year}</h4>
             <FeeSummaryRow 
                label="Total Course Fee" 
                value={student.original_total_fee}
             />
             <Separator className="my-2" />
             <FeeSummaryRow 
                label="Total Scholarship" 
                value={student.original_scholarship_amount}
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
                value={student.original_admission_fee}
                colorClass="text-primary"
                isTotal={true}
             />
             <FeeSummaryRow 
                label="Total Paid (Tuition Fee)" 
                value={tuitionPaid}
                colorClass="text-green-600"
             />
             <FeeSummaryRow 
                label="Remaining Due (Tuition)" 
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
          <div className="space-y-4">
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

            {/* Cheque Fields */}
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
            
            {/* Razorpay/Online Fields */}
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

            {/* --- NEW: Trust Fields --- */}
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

            {/* Notes Field */}
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
          </div>
          
          {/* Error message for submission */}
          {error && (
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
            {/* --- UPDATED: Disabled state --- */}
            <Button type="submit" disabled={isFormInvalid}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Payment
            </Button>
          </div>
        </CardContent>
      </form>
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
              Add a new payment record for the selected student's academic year.
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