// e.g., app/dashboard/fees/student/page.tsx
"use client"

import React, { useState, useEffect, useMemo } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"

// --- UI Components ---
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

// --- Icons ---
import {
  ChevronRight,
  Loader2,
  AlertTriangle,
  Save,
  Search,
  User,
  DollarSign,
  Receipt,
  CheckCircle,
  Plus,
} from "lucide-react"

// --- PrimeReact Components ---
import { InputNumber, InputNumberValueChangeEvent } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';

// --- PrimeReact CSS ---
import "primereact/resources/themes/saga-blue/theme.css"
import "primereact/resources/primereact.min.css"
import "primeicons/primeicons.css"

// --- Type Definitions ---

interface Stream { id: string; name: string; }
interface Course { id: string; name: string; stream_id: string; }
interface Semester { id: string; name: string; course_id: string; }

// Type for the student list
interface Student {
  id: string;
  fullname: string | null;
  "rollNumber": string;
  admission_fees: number;
  courses: {
    name: string;
  } | null;
}

// Type for a single payment record
interface Payment {
  id: string;
  created_at: string;
  amount: number;
  payment_method: string;
  notes: string | null;
}

// Type for the "Add Payment" form
interface NewPaymentForm {
  amount: number | null;
  payment_method: string | null;
  notes: string;
}

const paymentMethodOptions = [
  { label: 'Online (UPI/Netbanking)', value: 'Online' },
  { label: 'Cash', value: 'Cash' },
  { label: 'Cheque', value: 'Cheque' },
  { label: 'Demand Draft (DD)', value: 'DD' },
];

/**
 * Main Student Fee Management Page
 */
export default function StudentFeePage() {
  // --- Data State ---
  const [allStreams, setAllStreams] = useState<Stream[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [allSemesters, setAllSemesters] = useState<Semester[]>([]);
  const [students, setStudents] = useState<Student[]>([])
  const [studentSearch, setStudentSearch] = useState("");
  
  // --- Filter Selection State ---
  const [selectedStream, setSelectedStream] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);

  // --- Selection & Edit State ---
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [studentPayments, setStudentPayments] = useState<Payment[]>([])
  
  // --- New Payment Form State ---
  const [newPayment, setNewPayment] = useState<NewPaymentForm>({
    amount: null,
    payment_method: null,
    notes: ""
  });

  // --- Loading & Error State ---
  const [loading, setLoading] = useState({
    config: false,
    students: false,
    payments: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = getSupabaseClient()

  // --- Data Fetching: Academic Config ---
  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(prev => ({ ...prev, config: true }));
      try {
        const [streamsRes, coursesRes, semestersRes] = await Promise.all([
          supabase.from("streams").select("id, name").order("name"),
          supabase.from("courses").select("id, name, stream_id").order("name"),
          supabase.from("semesters").select("id, name, course_id").order("name"),
        ]);

        if (streamsRes.data) setAllStreams(streamsRes.data);
        if (coursesRes.data) setAllCourses(coursesRes.data);
        if (semestersRes.data) setAllSemesters(semestersRes.data);

        if (streamsRes.error) throw streamsRes.error;
        if (coursesRes.error) throw coursesRes.error;
        if (semestersRes.error) throw semestersRes.error;

      } catch (err: any) {
        setError(err.message || "Failed to load academic data.");
      }
      setLoading(prev => ({ ...prev, config: false }));
    };
    fetchConfig();
  }, [supabase]);

  // --- Data Fetching: Students (based on filters) ---
  useEffect(() => {
    const fetchStudents = async () => {
      // Only fetch if all filters are selected
      if (!selectedCourse || !selectedSemester) {
        setStudents([]);
        return;
      }
      
      setLoading(prev => ({...prev, students: true}));
      setSelectedStudent(null); // Clear student selection
      
      try {
        const { data, error } = await supabase
          .from("students")
          .select(`
            id, fullname, "rollNumber", admission_fees,
            courses ( name )
          `)
          .eq("course_id", selectedCourse)
          .eq("semester_id", selectedSemester) // <-- Filter by semester
          .order("fullname");
          
        if (error) throw error;
        setStudents(data as Student[] || []);
      } catch (err: any) {
        setError(err.message || "Failed to fetch students.");
      }
      setLoading(prev => ({...prev, students: false}));
    };
    
    fetchStudents();
  }, [selectedCourse, selectedSemester, supabase]); // Re-run when filters change

  // --- Data Fetching: Payments (when a student is selected) ---
  const fetchPayments = async (studentId: string) => {
    setLoading(prev => ({...prev, payments: true}))
    try {
      const { data, error } = await supabase
        .from("student_payments")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
      
      if (error) throw error
      setStudentPayments(data || [])
      
    } catch (err: any) {
      setError(err.message || "Failed to fetch payment history.")
    }
    setLoading(prev => ({...prev, payments: false}))
  }

  useEffect(() => {
    if (selectedStudent) {
      fetchPayments(selectedStudent.id)
    } else {
      setStudentPayments([])
    }
    setError(null)
    setSuccess(null)
  }, [selectedStudent]);

  // --- Form Handlers ---
  const handlePaymentFormChange = (
    name: keyof NewPaymentForm, 
    value: string | number | null | undefined
  ) => {
    setSuccess(null)
    if (name === 'amount') {
      setNewPayment(prev => ({ ...prev, [name]: (value as number | null) ?? null }))
    } else if (name === 'payment_method') {
      setNewPayment(prev => ({ ...prev, [name]: (value as string | null) ?? null }))
    } else {
      setNewPayment(prev => ({ ...prev, [name]: (value as string) || "" }))
    }
  }

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !newPayment.amount || !newPayment.payment_method) {
      setError("Please enter an amount and select a payment method.");
      return;
    }
    
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)
    
    try {
      const { error } = await supabase
        .from("student_payments")
        .insert({
          student_id: selectedStudent.id,
          amount: newPayment.amount,
          payment_method: newPayment.payment_method,
          notes: newPayment.notes || null
        });

      if (error) throw error

      // Success
      setSuccess(`Payment of ₹${newPayment.amount} recorded successfully!`);
      setNewPayment({ amount: null, payment_method: null, notes: "" });
      await fetchPayments(selectedStudent.id);
      
    } catch (err: any) {
      console.error("Save error:", err)
      setError(err.message || "Failed to save payment.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- Derived Data for Filters ---
  const courseOptions = useMemo(() => {
    return allCourses.filter(c => c.stream_id === selectedStream);
  }, [allCourses, selectedStream]);

  const semesterOptions = useMemo(() => {
    return allSemesters.filter(s => s.course_id === selectedCourse);
  }, [allSemesters, selectedCourse]);

  // --- Derived Calculations ---
  const feeSummary = useMemo(() => {
    const totalFee = selectedStudent?.admission_fees || 0;
    const totalPaid = studentPayments.reduce((acc, payment) => acc + payment.amount, 0);
    const balanceDue = totalFee - totalPaid;
    const percentage = totalFee > 0 ? (totalPaid / totalFee) * 100 : 0;
    
    return { totalFee, totalPaid, balanceDue, percentage };
  }, [selectedStudent, studentPayments]);

  const filteredStudents = students.filter(student =>
    student.fullname?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    student["rollNumber"]?.toLowerCase().includes(studentSearch.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* 1. Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Student Fee Management
          </h1>
          <p className="text-lg text-gray-600">
            Track payments and manage student balances.
          </p>
        </div>
      </div>

      {/* 2. Main Content Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* --- Column 1: Student List --- */}
        <Card className="lg:col-span-1 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Select Student</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading.config ? (
              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            ) : (
              <>
                {/* --- Stream Dropdown --- */}
                <div className="space-y-1">
                  <Label>1. Select Stream</Label>
                  <Dropdown
                    value={selectedStream}
                    options={allStreams}
                    onChange={(e) => {
                      setSelectedStream(e.value);
                      setSelectedCourse(null);
                      setSelectedSemester(null);
                    }}
                    optionLabel="name"
                    optionValue="id"
                    placeholder="Select Stream"
                    className="w-full"
                    filter
                  />
                </div>
                
                {/* --- Course Dropdown --- */}
                <div className="space-y-1">
                  <Label>2. Select Course</Label>
                  <Dropdown
                    value={selectedCourse}
                    options={courseOptions}
                    onChange={(e) => {
                      setSelectedCourse(e.value);
                      setSelectedSemester(null);
                    }}
                    optionLabel="name"
                    optionValue="id"
                    placeholder="Select Course"
                    className="w-full"
                    filter
                    disabled={!selectedStream}
                  />
                </div>
                
                {/* --- Semester Dropdown --- */}
                <div className="space-y-1">
                  <Label>3. Select Semester</Label>
                  <Dropdown
                    value={selectedSemester}
                    options={semesterOptions}
                    onChange={(e) => setSelectedSemester(e.value)}
                    optionLabel="name"
                    optionValue="id"
                    placeholder="Select Semester"
                    className="w-full"
                    filter
                    disabled={!selectedCourse}
                  />
                </div>
              </>
            )}

            {/* --- Student List (conditionally rendered) --- */}
            {selectedSemester && (
              <div className="pt-4 border-t">
                {loading.students ? (
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                ) : (
                  <>
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search by name or roll number..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map(student => (
                          <ListItem
                            key={student.id}
                            name={student.fullname || "No Name"}
                            subtext={`Roll: ${student["rollNumber"]}`}
                            isActive={selectedStudent?.id === student.id}
                            onClick={() => setSelectedStudent(student)}
                          />
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 text-center">No students found for this semester.</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* --- Column 2: Fee Dashboard --- */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedStudent ? (
            <Card className="shadow-lg h-full">
              <CardContent className="p-10 flex items-center justify-center">
                <p className="text-lg text-gray-500 text-center">
                  { !selectedSemester
                    ? "Please select a stream, course, and semester to load students."
                    : "Please select a student from the list to manage their fees."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* --- Summary Cards --- */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">
                    Fee Dashboard for {selectedStudent.fullname}
                  </CardTitle>
                  <CardDescription>
                    Course: {selectedStudent.courses?.name || "N/A"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <SummaryBox title="Total Fee" amount={feeSummary.totalFee} color="text-blue-600" />
                    <SummaryBox title="Total Paid" amount={feeSummary.totalPaid} color="text-green-600" />
                    <SummaryBox title="Balance Due" amount={feeSummary.balanceDue} color={feeSummary.balanceDue > 0 ? "text-red-600" : "text-green-600"} />
                  </div>
                  {/* --- Progress Bar --- */}
                  <div>
                    <div className="flex justify-between text-sm font-medium text-gray-600 mb-1">
                      <span>Paid</span>
                      <span>{feeSummary.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-green-600 h-2.5 rounded-full" 
                        style={{ width: `${feeSummary.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* --- Add Payment Form --- */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Receipt className="w-5 h-5" /> Add New Payment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddPayment} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="amount" className="font-semibold">Amount *</Label>
                        <InputNumber
                          id="amount"
                          value={newPayment.amount}
                          onValueChange={(e: InputNumberValueChangeEvent) => handlePaymentFormChange('amount', e.value)}
                          mode="decimal"
                          prefix="₹ "
                          placeholder="Enter amount"
                          className="p-inputtext-lg w-full"
                          inputClassName="w-full"
                          min={0}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="payment_method" className="font-semibold">Payment Method *</Label>
                        <Dropdown
                          id="payment_method"
                          value={newPayment.payment_method}
                          options={paymentMethodOptions}
                          onChange={(e) => handlePaymentFormChange('payment_method', e.value)}
                          placeholder="Select method"
                          className="w-full p-inputtext-lg"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="notes" className="font-semibold">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        value={newPayment.notes}
                        onChange={(e) => handlePaymentFormChange('notes', e.target.value)}
                        placeholder="e.g., Cheque no. 12345, or transaction ID"
                      />
                    </div>
                    {success && <p className="text-sm text-green-600">{success}</p>}
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <Button type="submit" disabled={isSubmitting || !newPayment.amount || !newPayment.payment_method}>
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                      Add Payment
                    </Button>
                  </form>
                </CardContent>
              </Card>
              
              {/* --- Payment History --- */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Payment History</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading.payments ? (
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  ) : studentPayments.length === 0 ? (
                    <p className="text-sm text-gray-500">No payments recorded for this student.</p>
                  ) : (
                    <div className="overflow-x-auto max-h-64">
                      <table className="w-full text-sm">
                        <thead className="text-left text-gray-600 bg-gray-50">
                          <tr>
                            <th className="p-2">Date</th>
                            <th className="p-2">Amount</th>
                            <th className="p-2">Method</th>
                            <th className="p-2">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentPayments.map(payment => (
                            <tr key={payment.id} className="border-b">
                              <td className="p-2 whitespace-nowrap">{new Date(payment.created_at).toLocaleDateString()}</td>
                              <td className="p-2 font-medium">₹{payment.amount.toLocaleString('en-IN')}</td>
                              <td className="p-2"><Badge variant="secondary">{payment.payment_method}</Badge></td>
                              <td className="p-2">{payment.notes}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// --- Helper Components ---

/**
 * A consistent list item for selection
 */
const ListItem: React.FC<{
  name: string;
  subtext: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ name, subtext, isActive, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full p-3 text-left rounded-md border transition-all flex justify-between items-center
      ${isActive
        ? "bg-blue-600 text-white shadow-md border-blue-700"
        : "bg-white hover:bg-gray-50 border-gray-200"
      }`}
  >
    <div>
      <div className="flex items-center gap-3">
        <User className={`h-4 w-4 ${isActive ? 'text-white' : 'text-blue-600'}`} />
        <span className="font-medium text-sm">{name}</span>
      </div>
      <span className={`text-xs ml-7 ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>{subtext}</span>
    </div>
    <ChevronRight className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
  </button>
)

/**
 * Helper for the top summary boxes
 */
const SummaryBox: React.FC<{ title: string; amount: number; color: string }> = ({ title, amount, color }) => (
  <div className="p-4 bg-gray-50 rounded-lg border">
    <Label className="text-sm font-medium text-gray-600">{title}</Label>
    <p className={`text-3xl font-bold ${color}`}>
      {amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
    </p>
  </div>
);