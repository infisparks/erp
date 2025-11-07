"use client"

import React, { useState, useEffect, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase/client'
import { SupabaseClient } from '@supabase/supabase-js'

// --- ShadCN UI Components ---
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// --- Icons ---
import {
  Loader2,
  AlertTriangle,
  ArrowLeft,
  UserRound,
} from "lucide-react"

// --- Type Definitions ---
interface StudentFullDetails {
  id: number; // GR No.
  fullname: string;
  father_name: string;
  mother_name: string;
  correspondence_details: string; // JSON string
  permanent_details: string; // JSON string
  nationality: string;
  created_at: string; // Admission Date
  admission_type: string;
  admission_category: string; // Quota
  dateofbirth: string;
  gender: string;
  student_mobile_no: string;
  father_mobile_no: string;
  mother_mobile_no: string;
  email: string;
  original_total_fee: number;
  original_admission_fee: number;
  original_scholarship_amount: number;
  photo_path: string | null;
}

interface EnrollmentDetails {
  roll_number: string;
  course_name: string;
  semester_name: string;
}

interface Payment {
  id: string;
  amount: number;
  fees_type: string | null;
  payment_method: string | null;
  created_at: string;
}

interface AddressDetails {
  address_line: string;
  city: string;
  pinCode: string;
  post: string;
  taluka: string;
  district: string;
  state: string;
}

// -------------------------------------------------------------------
// 🚀 Reusable Helper Components (Denser) 🚀
// -------------------------------------------------------------------

/**
 * Formats a date string into "DD-MMM-YYYY"
 */
const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Formats a number as INR currency
 */
const formatCurrency = (amount: number | null | undefined) => {
  return (amount || 0).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/**
 * Displays a single piece of information in the header (Small)
 */
const InfoItem: React.FC<{ label: string; value: string | null | undefined }> = ({ label, value }) => (
  <div>
    <span className="block text-xs font-medium text-muted-foreground uppercase leading-tight">{label}</span>
    <span className="text-sm font-semibold leading-tight">{value || "N/A"}</span>
  </div>
)

/**
 * Parses and displays a JSON address string (Small)
 */
const AddressCard: React.FC<{ title: string; detailsJson: string | null | undefined }> = ({ title, detailsJson }) => {
  let details: AddressDetails | null = null;
  if (detailsJson) {
    try {
      details = JSON.parse(detailsJson);
    } catch (e) {
      console.error("Failed to parse address JSON:", e);
    }
  }

  const fullAddress = details
    ? `${details.address_line}, ${details.taluka}, ${details.city}, ${details.district}, ${details.state} - ${details.pinCode}`
    : "N/A";

  return (
    <div className="md:col-span-2">
      <span className="block text-xs font-medium text-muted-foreground uppercase leading-tight">{title}</span>
      <span className="text-sm font-semibold leading-tight">{fullAddress}</span>
    </div>
  )
}

/**
 * Displays a summary row for the financial tables (Small)
 */
const FeeSummaryRow: React.FC<{ label: string; value: number; isBold?: boolean; colorClass?: string }> = ({ label, value, isBold = false, colorClass = "text-foreground" }) => (
  <div className="flex justify-between items-center py-0.5">
    <span className={`text-xs ${isBold ? "font-semibold" : "text-muted-foreground"}`}>
      {label}
    </span>
    <span className={`text-sm ${isBold ? "font-bold" : "font-medium"} ${colorClass}`}>
      {formatCurrency(value)}
    </span>
  </div>
)

// -------------------------------------------------------------------
// 🚀 Main Page Component 🚀
// -------------------------------------------------------------------

function StudentFeeDetailPage() {
  const supabase = getSupabaseClient()
  const searchParams = useSearchParams()
  const studentId = searchParams.get('student_id')
  const academicYear = searchParams.get('year')

  // --- State ---
  const [student, setStudent] = useState<StudentFullDetails | null>(null)
  const [enrollment, setEnrollment] = useState<EnrollmentDetails | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // --- Data Fetching ---
  useEffect(() => {
    if (!studentId || !academicYear) {
      setError("Student ID or Academic Year not provided.")
      setLoading(false)
      return
    }

    const fetchAllData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const [studentResult, enrollmentResult, paymentResult] = await Promise.all([
          // 1. Fetch Student Details
          supabase
            .from("students")
            .select(`
              id, fullname, father_name, mother_name, correspondence_details, permanent_details,
              nationality, created_at, admission_type, admission_category, dateofbirth,
              gender, student_mobile_no, father_mobile_no, mother_mobile_no, email,
              original_total_fee, original_admission_fee, original_scholarship_amount, photo_path
            `)
            .eq('id', studentId)
            .single(),
          
          // 2. Fetch Enrollment Details
          supabase
            .from("student_semesters")
            .select(`
              roll_number,
              course:courses ( name ),
              semester:semesters ( name )
            `)
            .eq("student_id", studentId)
            .eq("academic_year", academicYear)
            .single(),

          // 3. Fetch Payment History
          supabase
            .from("student_payments")
            .select("id, amount, fees_type, payment_method, created_at")
            .eq("student_id", studentId)
            .eq("academic_year", academicYear)
            .order("created_at", { ascending: true }) // Show oldest first
        ]);

        // --- Process Results ---
        if (studentResult.error) throw new Error(`Student Fetch Error: ${studentResult.error.message}`);
        setStudent(studentResult.data as StudentFullDetails);

        if (enrollmentResult.error) throw new Error(`Enrollment Fetch Error: ${enrollmentResult.error.message}`);
        const enrollmentData = enrollmentResult.data as any;
        setEnrollment({
          roll_number: enrollmentData.roll_number,
          course_name: enrollmentData.course.name,
          semester_name: enrollmentData.semester.name,
        });

        if (paymentResult.error) throw new Error(`Payment Fetch Error: ${paymentResult.error.message}`);
        setPayments(paymentResult.data as Payment[]);

      } catch (err: any) {
        console.error("Error fetching data:", err)
        setError(err.message || "Failed to load page data.")
      } finally {
        setLoading(false)
      }
    }
    
    fetchAllData()
  }, [studentId, academicYear, supabase])
  
  // --- Avatar URL ---
  const avatarUrl = useMemo(() => {
    if (student?.photo_path) {
      return supabase.storage.from('student_documents').getPublicUrl(student.photo_path).data.publicUrl
    }
    return null
  }, [student, supabase])

  // --- Memoized Calculations ---
  const { 
    tuitionPaid, 
    scholarshipPaid, 
    otherFeesPaid, 
    remainingDue, 
    remainingScholarship,
    otherFeePayments,
    receiptPayments
  } = useMemo(() => {
    let tuitionSum = 0;
    let scholarshipSum = 0;
    let otherFeesSum = 0;
    const otherPaymentsList: Payment[] = [];
    const receiptPaymentsList: Payment[] = [];
    
    for (const p of payments) {
      receiptPaymentsList.push(p); // All payments go into receipt list
      
      if (p.fees_type === 'Tuition Fee') {
        tuitionSum += p.amount;
      } else if (p.fees_type === 'Scholarship') {
        scholarshipSum += p.amount;
      } else {
        otherFeesSum += p.amount;
        otherPaymentsList.push(p); // Only non-tuition/scholarship go here
      }
    }
    
    const netPayable = student?.original_admission_fee || 0;
    const totalScholarship = student?.original_scholarship_amount || 0;

    return {
      tuitionPaid: tuitionSum,
      scholarshipPaid: scholarshipSum,
      otherFeesPaid: otherFeesSum,
      remainingDue: netPayable - tuitionSum,
      remainingScholarship: totalScholarship - scholarshipSum,
      otherFeePayments: otherPaymentsList,
      receiptPayments: receiptPaymentsList
    }
  }, [payments, student])


  // --- Render Logic ---
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="ml-2">Loading Student Details...</p>
        </div>
      )
    }
    
    if (error || !student || !enrollment) {
      return (
         <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error || "Could not load student details."}</AlertDescription>
          </Alert>
      )
    }
    
    return (
      <CardContent className="pt-4 space-y-4">
        
        {/* --- 1. Student Info Header (As per image layout) --- */}
        <div className="p-3 border bg-background rounded-lg">
          <h3 className="text-base font-bold mb-2 border-b pb-1">Student Information</h3>
          
          <div className="flex flex-col md:flex-row gap-4">
            {/* Photo */}
            <Avatar className="h-28 w-28 rounded-md">
              <AvatarImage 
                src={avatarUrl || undefined} 
                alt={student.fullname || "Student Photo"} 
                className="rounded-md object-cover"
              />
              <AvatarFallback className="rounded-md bg-muted">
                <UserRound className="h-12 w-12 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>

            {/* Details */}
            <div className="flex-1 space-y-2">
              {/* 4-Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4 gap-y-2">
                {/* Col 1 */}
                <div className="space-y-2">
                  <InfoItem label="Full Name" value={student.fullname} />
                  <InfoItem label="Father's Name" value={student.father_name} />
                  <InfoItem label="Mother's Name" value={student.mother_name} />
                </div>
                {/* Col 2 */}
                <div className="space-y-2">
                  <InfoItem label="GR No" value={student.id.toString()} />
                  <InfoItem label="Roll No" value={enrollment.roll_number} />
                  <InfoItem label="Course" value={enrollment.course_name} />
                  <InfoItem label="Semester" value={enrollment.semester_name} />
                </div>
                {/* Col 3 */}
                <div className="space-y-2">
                  <InfoItem label="Quota" value={student.admission_category} />
                  <InfoItem label="Admission Type" value={student.admission_type} />
                  <InfoItem label="Admission Date" value={formatDate(student.created_at)} />
                  <InfoItem label="Nationality" value={student.nationality} />
                </div>
                {/* Col 4 */}
                <div className="space-y-2">
                  <InfoItem label="Gender" value={student.gender} />
                  <InfoItem label="Date of Birth" value={formatDate(student.dateofbirth)} />
                  <InfoItem label="Mobile" value={student.student_mobile_no} />
                  <InfoItem label="Email ID" value={student.email} />
                </div>
              </div>

              <Separator className="my-2" />

              {/* Address Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                <AddressCard title="Present Address" detailsJson={student.correspondence_details} />
                <AddressCard title="Permanent Address" detailsJson={student.permanent_details} />
              </div>
            </div>
          </div>
        </div>

        {/* --- 2. Financial Details Grid (4 Columns) --- */}
        <div className="p-3 border bg-background rounded-lg">
          <h3 className="text-base font-bold mb-2 border-b pb-1">Financial Ledger for {academicYear}</h3>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

            {/* Col 1: Advance Ledger (Other Fees) */}
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-center border-b pb-1 mb-1">Advance Ledger</h4>
              <div className="text-xs text-center text-muted-foreground mb-1">(Other Fees Paid)</div>
              <Table>
                <TableBody>
                  {otherFeePayments.length === 0 ? (
                    <TableRow><TableCell className="p-2 h-10 text-xs text-center">No other fees paid.</TableCell></TableRow>
                  ) : (
                    otherFeePayments.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="p-2">
                          <div className="font-medium text-xs">{p.fees_type}</div>
                          <div className="text-xs text-muted-foreground">{formatDate(p.created_at)}</div>
                        </TableCell>
                        <TableCell className="p-2 text-right font-medium text-xs">{formatCurrency(p.amount)}</TableCell>
                      </TableRow>
                    ))
                  )}
                  <TableRow className="bg-muted">
                    <TableHead className="p-2 text-xs">Total Other Paid</TableHead>
                    <TableHead className="p-2 text-right text-xs">{formatCurrency(otherFeesPaid)}</TableHead>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Col 2: Total Fees */}
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-center border-b pb-1 mb-1">Total Fees</h4>
              <div className="text-xs text-center text-muted-foreground mb-1">(For {academicYear})</div>
              <div className="p-2 space-y-1 bg-muted rounded-md">
                <FeeSummaryRow label="Total Course Fee" value={student.original_total_fee} />
                <FeeSummaryRow label="Total Scholarship" value={student.original_scholarship_amount} colorClass="text-orange-600" />
                <Separator className="my-1"/>
                <FeeSummaryRow label="Net Payable Fee" value={student.original_admission_fee} isBold={true} colorClass="text-primary" />
              </div>
            </div>

            {/* Col 3: Fees Receipt Details */}
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-center border-b pb-1 mb-1">Fees Receipt Details</h4>
              <div className="text-xs text-center text-muted-foreground mb-1">(All Payments)</div>
              <div className="max-h-60 overflow-y-auto border rounded-md">
                <Table>
                  <TableBody>
                    {receiptPayments.length === 0 ? (
                      <TableRow><TableCell className="p-2 h-10 text-xs text-center">No payments found.</TableCell></TableRow>
                    ) : (
                      receiptPayments.map(p => (
                        <TableRow key={p.id}>
                          <TableCell className="p-2">
                            <div className="font-medium text-xs">{p.fees_type}</div>
                            <div className="text-xs text-muted-foreground">{formatDate(p.created_at)}</div>
                          </TableCell>
                          <TableCell className="p-2 text-right font-medium text-xs">{formatCurrency(p.amount)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Col 4: Student Receivable */}
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-center border-b pb-1 mb-1">Student Receivable</h4>
              <div className="text-xs text-center text-muted-foreground mb-1">(Summary)</div>
              <div className="p-2 space-y-1 bg-muted rounded-md">
                <FeeSummaryRow label="Net Payable (Tuition)" value={student.original_admission_fee} />
                <FeeSummaryRow label="Total Paid (Tuition)" value={tuitionPaid} colorClass="text-green-600" />
                <Separator className="my-1" />
                <FeeSummaryRow 
                  label="Remaining Due" 
                  value={remainingDue} 
                  isBold={true} 
                  colorClass={remainingDue > 0 ? "text-destructive" : "text-green-600"}
                />
              </div>
              <div className="p-2 space-y-1 bg-muted rounded-md mt-1">
                <FeeSummaryRow label="Allocated Scholarship" value={student.original_scholarship_amount} />
                <FeeSummaryRow label="Scholarship Used" value={scholarshipPaid} colorClass="text-green-600" />
                <Separator className="my-1" />
                <FeeSummaryRow 
                  label="Remaining Scholarship" 
                  value={remainingScholarship} 
                  isBold={true} 
                  colorClass={remainingScholarship > 0 ? "text-orange-600" : "text-green-600"}
                />
              </div>
            </div>

          </div>
        </div>

      </CardContent>
    )
  }

  return (
    <div className="p-2 md:p-4"> {/* REDUCED PADDING */}
      <div className="max-w-7xl mx-auto"> {/* Changed to max-w-7xl for wider view */}
        <Card className="shadow-lg">
          <CardHeader className="p-4"> {/* REDUCED PADDING */}
            <div className="flex items-center gap-2 mb-2">
              <Button variant="outline" size="icon" asChild>
                {/* Go back to the add payment page */}
                <Link href={`/student/fees/add?student_id=${studentId}&year=${academicYear}`}>
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <CardTitle className="text-xl">Student Payment Details</CardTitle>
            </div>
            <CardDescription className="text-sm">
              A complete financial and personal overview for this student for the academic year {academicYear}.
            </CardDescription>
          </CardHeader>
          {renderContent()}
        </Card>
      </div>
    </div>
  )
}

// Wrap the component in Suspense to safely use useSearchParams
export default function StudentFeeDetailPageWrapper() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>}>
      <StudentFeeDetailPage />
    </Suspense>
  )
}