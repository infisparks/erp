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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

// --- Icons ---
import {
  Loader2,
  AlertTriangle,
  ArrowLeft,
  UserRound,
  Info, // For Inactive status
} from "lucide-react"

// --- Type Definitions ---
interface StudentFullDetails {
  id: number; // Students.id (BIGINT)
  fullname: string;
  father_name: string | null;
  mother_name: string | null;
  father_email: string | null;
  mother_email: string | null;
  correspondence_details: any; // JSONB
  permanent_details: any; // JSONB
  nationality: string | null;
  created_at: string; // Admission Date
  admission_type: string | null;
  admission_category: string | null; // Quota
  dateofbirth: string | null;
  gender: string | null;
  student_mobile_no: string | null;
  father_mobile_no: string | null;
  mother_mobile_no: string | null;
  email: string | null;
  photo_path: string | null;
  roll_number: string | null;
}

interface SemesterEnrollment {
  semester_id: string; // UUID from semesters table
  semester_name: string; // Name from semesters table
  roll_number: string; // From students table
  status: string;
}

interface AcademicYearFinancials {
  id: number; // student_academic_years.id (BIGINT)
  academic_year_name: string;
  academic_year_session: string;
  course_name: string; // from courses table via course_id
  total_fee: number; // Full fee
  scholarship_name: string | null; // Allocated scholarship name
  scholarship_amount: number; // Allocated scholarship
  net_payable_fee: number; // Total Fee - Scholarship
  status: string;
  is_registered: boolean; // ✅ NEW: Added this field
  semesters: SemesterEnrollment[];
  payments: Payment[]; // Payments linked to this academic year ID
  
  // Memoized fields
  totalPaid: number; // This will now be ONLY "Tuition Fee"
  remainingDue: number;
}

interface Payment {
  id: string;
  amount: number;
  fees_type: string | null;
  payment_method: string | null;
  created_at: string;
  receipt_no: number;
  student_academic_year_id: number; // Link back to the academic year
}

interface AddressDetails {
  address_line?: string;
  city?: string;
  pinCode?: string;
  post?: string;
  taluka?: string;
  district?: string;
  state?: string;
}

// -------------------------------------------------------------------
// 🚀 Reusable Helper Components (Denser) 🚀
// -------------------------------------------------------------------

/**
 * Formats a date string into "DD-MMM-YYYY"
 */
const formatDate = (dateString: string | null) => {
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
const InfoItem: React.FC<{ label: string; value: string | number | null | undefined, className?: string }> = ({ label, value, className = "" }) => (
  <div className="flex flex-col">
    <span className="block text-xs font-medium text-muted-foreground uppercase leading-tight">{label}</span>
    <span className={`text-sm font-semibold leading-tight break-words ${className}`}>
      {/* Ensure numbers are displayed as strings */}
      {value === null || value === undefined || value === "" ? "N/A" : (typeof value === 'number' ? value.toString() : value)}
    </span>
  </div>
)

/**
 * Parses and displays a JSON address string (Small)
 */
const AddressCard: React.FC<{ title: string; detailsJson: any }> = ({ title, detailsJson }) => {
  let details: AddressDetails = {};
  let data = detailsJson;

  // Attempt to parse if it's a string, otherwise assume it's already an object or null
  if (typeof detailsJson === 'string') {
    try {
      data = JSON.parse(detailsJson);
    } catch (e) {
      console.error("Failed to parse address JSON:", e);
      data = null;
    }
  }
  
  if (data && typeof data === 'object') {
    details = data;
  }

  const parts = [
    details.address_line,
    details.taluka,
    details.city,
    details.district,
    details.state,
    details.pinCode,
  ].filter(Boolean).join(', ');

  const fullAddress = parts.length > 0 ? parts : "N/A";

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
const FeeSummaryRow: React.FC<{ label: string | number; value: number; isBold?: boolean; colorClass?: string }> = ({ label, value, isBold = false, colorClass = "text-foreground" }) => (
  <div className="flex justify-between items-center py-0.5">
    <span className={`text-xs ${isBold ? "font-semibold" : "text-muted-foreground"}`}>
      {label}
    </span>
    <span className={`text-sm ${isBold ? "font-bold" : "font-medium"} ${colorClass}`}>
      {formatCurrency(value)}
    </span>
  </div>
)

/**
 * Renders the financial section for a single Academic Year.
 */
const AcademicYearFinancialCard: React.FC<{ year: AcademicYearFinancials; studentId: number }> = ({ year, studentId }) => {
  // --- UPDATED: Separate all three payment types ---
  const scholarshipPayments = year.payments.filter(p => p.fees_type === 'Scholarship');
  const tuitionFeePayments = year.payments.filter(p => p.fees_type === 'Tuition Fee');
  const otherFeePayments = year.payments.filter(p => p.fees_type !== 'Tuition Fee' && p.fees_type !== 'Scholarship');

  const scholarshipUsed = scholarshipPayments.reduce((sum, p) => sum + p.amount, 0);
  const tuitionPaid = tuitionFeePayments.reduce((sum, p) => sum + p.amount, 0);
  const otherFeesPaid = otherFeePayments.reduce((sum, p) => sum + p.amount, 0);
  // --- END OF UPDATE ---

  const remainingScholarship = year.scholarship_amount - scholarshipUsed;

  return (
    <AccordionItem value={year.id.toString()} className="border-t">
      <AccordionTrigger className="hover:no-underline px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-t-lg">
        <div className="grid grid-cols-4 w-full text-left font-bold text-sm">
          <span>{year.academic_year_name} ({year.academic_year_session})</span>
          <span className="text-center">{formatCurrency(year.net_payable_fee)}</span>
          <span className={`text-center ${year.remainingDue <= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(tuitionPaid)} {/* This now correctly shows only tuition paid */}
          </span>
          <span className={`text-right ${year.remainingDue <= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(year.remainingDue)}
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="p-4 border border-t-0 rounded-b-lg">
        
        {/* --- Conditional Warnings --- */}
        {year.status === 'Inactive' && (
          <Alert variant="default" className="mb-4 bg-gray-100 border-gray-300">
            <Info className="h-4 w-4" />
            <AlertTitle>Year Inactive / Completed</AlertTitle>
            <AlertDescription className="text-xs">
              This academic year is currently marked as <strong>Inactive</strong> (e.g., completed). 
              Financial amounts are shown for historical reference.
            </AlertDescription>
          </Alert>
        )}

        {year.status === 'Active' && !year.is_registered && (
           <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Registration Pending</AlertTitle>
            <AlertDescription className="text-xs">
              Registration for this academic year is <strong>pending</strong>. 
              Financials for this year are not yet included in the global summary.
              <Button variant="link" asChild className="p-0 h-auto ml-1 text-xs">
                <Link href={`/student/registration?student_id=${studentId}`}>
                  Complete Registration Now
                </Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Col 1: Summary */}
          <div className="space-y-2 col-span-1">
            <h4 className="font-bold text-sm border-b pb-1 text-primary">Year Summary</h4>
            <InfoItem label="Course" value={year.course_name} />
            <InfoItem label="Semesters" value={year.semesters.map(s => s.semester_name).join(', ')} />
            <FeeSummaryRow label="Total Course Fee" value={year.total_fee} />
            <FeeSummaryRow label={`Scholarship (${year.scholarship_name || 'N/A'})`} value={year.scholarship_amount} colorClass="text-orange-600" />
            <Separator className="my-1"/>
            <FeeSummaryRow label="Net Payable (Tuition)" value={year.net_payable_fee} isBold={true} colorClass="text-primary" />
            <FeeSummaryRow label="Paid (Tuition)" value={tuitionPaid} isBold={true} colorClass="text-green-600" />
            <FeeSummaryRow 
              label="Remaining Due (Tuition)" 
              value={year.remainingDue} 
              isBold={true} 
              colorClass={year.remainingDue > 0 ? "text-destructive" : "text-green-600"}
            />
            {/* --- NEWLY ADDED LINE --- */}
            <FeeSummaryRow label="Other Fees Paid" value={otherFeesPaid} colorClass="text-blue-600" />
            
            <Separator className="my-2"/>
            <h4 className="font-bold text-sm border-b pb-1 text-orange-600">Scholarship Ledger</h4>
            <FeeSummaryRow label="Allocated Scholarship" value={year.scholarship_amount} />
            <FeeSummaryRow label="Scholarship Used" value={scholarshipUsed} colorClass="text-green-600" />
            <FeeSummaryRow 
              label="Remaining Scholarship" 
              value={remainingScholarship} 
              isBold={true} 
              colorClass={remainingScholarship > 0 ? "text-orange-600" : "text-green-600"}
            />
          </div>

          {/* Col 2 & 3: Payment History */}
          <div className="col-span-3 space-y-2">
            <h4 className="font-bold text-sm border-b pb-1 text-primary">Payment History (Receipts)</h4>
            <div className="max-h-96 overflow-y-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px] text-xs py-2">Receipt No</TableHead>
                    <TableHead className="w-[150px] text-xs py-2">Date</TableHead>
                    <TableHead className="text-xs py-2">Fees Type / Method</TableHead>
                    <TableHead className="w-[120px] text-right text-xs py-2">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {year.payments.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="p-4 h-10 text-xs text-center">No payments recorded for this academic year.</TableCell></TableRow>
                  ) : (
                    year.payments.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="text-xs p-2 font-medium">{p.receipt_no}</TableCell>
                        <TableCell className="text-xs p-2">{formatDate(p.created_at)}</TableCell>
                        <TableCell className="text-xs p-2">
                          <div className="font-medium">{p.fees_type || 'General Fee'}</div>
                          <div className="text-muted-foreground">{p.payment_method}</div>
                        </TableCell>
                        <TableCell className="text-right text-xs p-2 font-bold">{formatCurrency(p.amount)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

        </div>
      </AccordionContent>
    </AccordionItem>
  )
}


// -------------------------------------------------------------------
// 🚀 Main Page Component 🚀
// -------------------------------------------------------------------

function StudentFeeDetailPage() {
  const supabase = getSupabaseClient()
  const searchParams = useSearchParams()
  const studentId = searchParams.get('student_id')

  // --- State ---
  const [student, setStudent] = useState<StudentFullDetails | null>(null)
  const [academicYears, setAcademicYears] = useState<AcademicYearFinancials[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // --- Data Fetching ---
  useEffect(() => {
    if (!studentId) {
      setError("Student ID not provided.")
      setLoading(false)
      return
    }

    const fetchAllData = async () => {
      setLoading(true)
      setError(null)
      
      const numericStudentId = parseInt(studentId, 10);
      if (isNaN(numericStudentId)) {
        setError("Invalid Student ID format. The ID must be a number.")
        setLoading(false);
        return;
      }

      try {
        // 1. Fetch Student Details
        const { data: studentData, error: studentError } = await supabase
          .from("students")
          .select(`
            id, fullname, father_name, mother_name, father_email, mother_email,
            correspondence_details, permanent_details, nationality, created_at, 
            admission_type, admission_category, dateofbirth, roll_number,
            gender, student_mobile_no, father_mobile_no, mother_mobile_no, email,
            photo_path
          `)
          .eq('id', numericStudentId) 
          .single();

        if (studentError) {
             // Check for the specific error where no rows are returned
            if (studentError.code === 'PGRST116') {
                 throw new Error(`Student Fetch Error: No student found with ID ${numericStudentId}.`);
            }
            throw new Error(`Student Fetch Error: ${studentError.message}`);
        }
        setStudent(studentData as StudentFullDetails);

        // 2. Fetch all Academic Year Enrollments for the student
        const { data: ayData, error: ayError } = await supabase
          .from("student_academic_years")
          .select(`
            id, academic_year_name, academic_year_session, total_fee, 
            scholarship_name, scholarship_amount, net_payable_fee, status,
            is_registered, 
            course:courses ( name ),
            semesters:student_semesters ( 
              status, 
              semester:semesters ( id, name )
            )
          `)
          .eq("student_id", numericStudentId)
          .order("academic_year_session", { ascending: true });

        if (ayError) throw new Error(`Academic Year Fetch Error: ${ayError.message}`);
        
        // 3. Fetch all Payments for the student
        const { data: paymentData, error: paymentError } = await supabase
          .from("student_payments")
          .select("id, amount, fees_type, payment_method, created_at, receipt_no, student_academic_year_id")
          .eq("student_id", numericStudentId);

        if (paymentError) throw new Error(`Payment Fetch Error: ${paymentError.message}`);
        const allPayments = paymentData as Payment[];
        
        // --- Process and Merge Data ---
        const processedYears: AcademicYearFinancials[] = (ayData as any[]).map(ay => {
          
          const semesters: SemesterEnrollment[] = ay.semesters.map((ss: any) => ({
            semester_id: ss.semester.id,
            semester_name: ss.semester.name,
            roll_number: studentData.roll_number || "N/A", 
            status: ss.status,
          }));

          const yearPayments = allPayments.filter(p => p.student_academic_year_id === ay.id);
          
          // --- THIS IS THE KEY FIX ---
          // Only count 'Tuition Fee' payments towards the 'totalPaid' and 'remainingDue'
          const tuitionPaid = yearPayments
            .filter(p => p.fees_type === 'Tuition Fee') // <-- UPDATED FILTER
            .reduce((sum, p) => sum + p.amount, 0);
          // --- END OF FIX ---

          const remainingDue = (ay.net_payable_fee || 0) - tuitionPaid;

          const year: AcademicYearFinancials = {
            id: ay.id,
            academic_year_name: ay.academic_year_name,
            academic_year_session: ay.academic_year_session,
            course_name: ay.course.name,
            total_fee: ay.total_fee || 0,
            scholarship_name: ay.scholarship_name,
            scholarship_amount: ay.scholarship_amount || 0,
            net_payable_fee: ay.net_payable_fee || 0,
            status: ay.status,
            is_registered: ay.is_registered ?? false, // Process the new field
            semesters,
            payments: yearPayments,
            totalPaid: tuitionPaid, // This value is now correct
            remainingDue: remainingDue, // This value is now correct
          };
          
          return year;
        });

        setAcademicYears(processedYears);

      } catch (err: any) {
        console.error("Error fetching data:", err)
        setError(err.message || "Failed to load page data.")
      } finally {
        setLoading(false)
      }
    }
    
    fetchAllData()
  }, [studentId, supabase])
  
  // --- Avatar URL ---
  const avatarUrl = useMemo(() => {
    if (student?.photo_path) {
      return supabase.storage.from('student_documents').getPublicUrl(student.photo_path).data.publicUrl
    }
    return null
  }, [student, supabase])

  // --- Total Summary Calculations ---
  // This will now work correctly because `year.totalPaid` is correctly calculated
  const globalSummary = useMemo(() => {
    // ✅ NEW: Filter only by years the student has actually registered for.
    const registeredYears = academicYears.filter(year => year.is_registered === true);
    
    const totalNetPayable = registeredYears.reduce((sum, year) => sum + year.net_payable_fee, 0);
    const totalPaid = registeredYears.reduce((sum, year) => sum + year.totalPaid, 0); // This is correct
    const totalRemaining = totalNetPayable - totalPaid; // This is correct
    
    return {
      totalNetPayable,
      totalPaid,
      totalRemaining,
      totalScholarship: registeredYears.reduce((sum, year) => sum + year.scholarship_amount, 0),
    };
  }, [academicYears]);


  // --- Render Logic ---
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2">Loading Student Details and Financial Ledger...</p>
        </div>
      )
    }
    
    if (error || !student) {
      return (
         <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error || "Could not load student details. Ensure student ID is correct."}</AlertDescription>
          </Alert>
      )
    }
    
    return (
      <CardContent className="pt-4 space-y-6">
        
        {/* --- 1. Student Info Header --- */}
        <div className="p-3 border bg-background rounded-lg shadow-sm">
          <h3 className="text-lg font-bold mb-3 border-b pb-1 text-primary">Student Information</h3>
          
          <div className="flex flex-col md:flex-row gap-4">
            {/* Photo */}
            <Avatar className="h-28 w-28 rounded-md shrink-0">
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
            <div className="flex-1 space-y-3">
              {/* Personal/Academic Details Grid (4 Columns) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2">
                
                {/* Col 1 */}
                <div className="space-y-2">
                  <InfoItem label="Full Name" value={student.fullname} />
                  <InfoItem label="GR No" value={student.id} />
                  <InfoItem label="Roll No" value={student.roll_number} />
                  <InfoItem label="Admission Date" value={formatDate(student.created_at)} />
                </div>
                
                {/* Col 2 */}
                <div className="space-y-2">
                  <InfoItem label="Gender" value={student.gender} />
                  <InfoItem label="DOB" value={formatDate(student.dateofbirth)} />
                  <InfoItem label="Nationality" value={student.nationality} />
                  <InfoItem label="Mobile" value={student.student_mobile_no} />
                </div>
                
                {/* Col 3 */}
                <div className="space-y-2">
                  <InfoItem label="Father's Name" value={student.father_name} />
                  <InfoItem label="Father's Mobile" value={student.father_mobile_no} />
                  <InfoItem label="Father's Email" value={student.father_email} />
                  <InfoItem label="Admission Type" value={student.admission_type} />
                </div>

                {/* Col 4 */}
                <div className="space-y-2">
                  <InfoItem label="Mother's Name" value={student.mother_name} />
                  <InfoItem label="Mother's Mobile" value={student.mother_mobile_no} />
                  <InfoItem label="Mother's Email" value={student.mother_email} />
                  <InfoItem label="Quota/Category" value={student.admission_category} />
                </div>
              </div>

              <Separator className="my-2" />

              {/* Address Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                <AddressCard title="Correspondence Address" detailsJson={student.correspondence_details} />
                <AddressCard title="Permanent Address" detailsJson={student.permanent_details} />
              </div>
            </div>
          </div>
        </div>
        
        {/* --- 2. Global Financial Summary --- */}
        <div className="p-3 border bg-background rounded-lg shadow-sm">
          <h3 className="text-lg font-bold mb-3 border-b pb-1 text-primary">Global Financial Summary (Tuition Only)</h3>
          {/* --- UPDATED DESCRIPTION --- */}
          <p className="text-xs text-muted-foreground -mt-2 mb-2">
            This summary only includes <strong>Registered</strong> academic years (past and present) and <strong>Tuition Fee</strong> payments.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-2 bg-muted rounded-md">
            <InfoItem 
              label="Total Net Payable" 
              value={formatCurrency(globalSummary.totalNetPayable)} 
            />
            <InfoItem 
              label="Total Paid (Tuition)" 
              value={formatCurrency(globalSummary.totalPaid)} 
            />
            <InfoItem 
              label="Total Scholarship" 
              value={formatCurrency(globalSummary.totalScholarship)} 
            />
            <InfoItem 
              label="Remaining Due (Tuition)" 
              value={formatCurrency(globalSummary.totalRemaining)} 
              className={`font-extrabold text-xl ${globalSummary.totalRemaining > 0 ? 'text-destructive' : 'text-green-600'}`}
            />
          </div>
        </div>


        {/* --- 3. Academic Year Financial Breakdown --- */}
        <div className="p-3 border bg-background rounded-lg shadow-sm">
          <h3 className="text-lg font-bold mb-3 border-b pb-1 text-primary">Academic Year Breakdown</h3>
          
          <div className="mb-2 grid grid-cols-4 w-full font-semibold text-sm text-muted-foreground border-b pb-1 px-4">
              <span>Academic Year / Course</span>
              <span className="text-center">Net Fee</span>
              <span className="text-center">Paid (Tuition)</span>
              <span className="text-right">Remaining</span>
          </div>
          
          {academicYears.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No academic year enrollment records found for this student.
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {academicYears.map((year) => (
                <AcademicYearFinancialCard 
                  key={year.id} 
                  year={year} 
                  studentId={student.id} // Pass studentId for the link
                />
              ))}
            </Accordion>
          )}

        </div>

      </CardContent>
    )
  }

  return (
    <div className="p-2 md:p-4">
      <div className="max-w-7xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Button variant="outline" size="icon" asChild>
                {/* Link back to the generic fees page/student list */}
                <Link href={`/student/fees`}> 
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <CardTitle className="text-xl">Student Financial Ledger</CardTitle>
            </div>
            {/* --- FIXED TYPO --- */}
            <CardDescription className="text-sm">
              Complete financial and personal overview for <strong>{student?.fullname || 'Loading...'}</strong> (GR No: {studentId}).
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
    // --- FIXED TYPO ---
    <Suspense fallback={<div className="flex justify-center items-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>}>
      <StudentFeeDetailPage />
    </Suspense>
  )
}