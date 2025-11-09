"use client"

import React, { useState, useEffect, Suspense, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { SupabaseClient } from "@supabase/supabase-js"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
// --- NEW IMPORTS ---
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Loader2,
  AlertTriangle,
  CheckSquare,
  User,
  Book,
  GraduationCap,
  Calendar,
  Wallet,
  Upload, // New Icon
  FileCheck, // New Icon
} from "lucide-react"
// ---------------------
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

// --- Type Definitions ---
interface Student {
  id: number
  fullname: string | null
  roll_number: string | null
}

interface ActiveEnrollment {
  student_academic_year_id: number
  course_id: string
  course_name: string
  academic_year_name: string
  semester_name: string
  semester_id: string
  total_fee: number | null
  scholarship_name: string | null
  scholarship_amount: number | null
  net_payable_fee: number | null
}

interface Subject {
  id: string
  name: string
  subject_code: string | null
  type: string
  is_optional: boolean
}

interface RegistrationData {
  student: Student | null
  enrollment: ActiveEnrollment | null
  subjects: Subject[]
  studentAcademicYearId: number | null
}

interface CategoryOption {
  name: string
  description: string | null
}

// ---------------------------------
// 🚀 Main Registration Component
// ---------------------------------
function StudentRegistrationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = getSupabaseClient()
  const student_id = searchParams.get("student_id")

  const [data, setData] = useState<RegistrationData | null>(null)
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // --- State for Scholarship Editing ---
  const [isEditingScholarship, setIsEditingScholarship] = useState(false)
  const [availableScholarships, setAvailableScholarships] = useState<
    CategoryOption[]
  >([])
  const [courseFeeMap, setCourseFeeMap] = useState<Map<string, number>>(
    new Map(),
  )
  const [selectedScholarshipName, setSelectedScholarshipName] = useState("")

  // --- NEW: State for Payment Plan ---
  const [paymentPlan, setPaymentPlan] = useState<"One Time" | "Installment">(
    "One Time",
  )
  const [undertakingFile, setUndertakingFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  // ------------------------------------

  // Helper to format currency
  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return "N/A"
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  // Calculate new fees dynamically
  const { newPayableAmount, newScholarshipAmount } = useMemo(() => {
    const total_fee = data?.enrollment?.total_fee || 0
    const payable = courseFeeMap.get(selectedScholarshipName) ?? total_fee
    const scholarship = total_fee - payable
    return { newPayableAmount: payable, newScholarshipAmount: scholarship }
  }, [selectedScholarshipName, courseFeeMap, data?.enrollment?.total_fee])

  // --- NEW: File change handler ---
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // You can add file type/size validation here if needed
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("File is too large. Max 5MB allowed.")
        return
      }
      setUndertakingFile(file)
    }
  }

  useEffect(() => {
    if (!student_id) {
      setError("No student ID provided.")
      setLoading(false)
      return
    }

    async function fetchRegistrationData() {
      // ... (existing data fetching code, no changes needed here)
      try {
        setLoading(true)
        setError(null)

        // 1. Get the student
        const { data: studentData, error: studentError } = await supabase
          .from("students")
          .select("id, fullname, roll_number")
          .eq("id", student_id)
          .single()

        if (studentError)
          throw new Error(`Student not found: ${studentError.message}`)

        // 2. Get the student's ACTIVE academic year (AND financial data)
        const { data: activeYearData, error: activeYearError } = await supabase
          .from("student_academic_years")
          .select(
            "id, course_id, academic_year_name, courses(name), total_fee, scholarship_name, scholarship_amount, net_payable_fee, payment_plan", // Added payment_plan
          )
          .eq("student_id", student_id)
          .eq("status", "Active")
          .eq("is_registered", false) 
          .single()

        if (activeYearError)
          throw new Error(
            `Active academic year not found for this student. ${activeYearError.message}`,
          )
        if (!activeYearData)
          throw new Error("No active, unregistered academic year found.")

        const studentAcademicYearId = activeYearData.id
        const courseId = activeYearData.course_id 

        // 3. Get the student's ACTIVE semester
        const { data: activeSemesterData, error: activeSemesterError } =
          await supabase
            .from("student_semesters")
            .select("semester_id, semesters(name)")
            .eq("student_academic_year_id", studentAcademicYearId)
            .eq("status", "active")
            .single()

        if (activeSemesterError)
          throw new Error(
            `Active semester not found. ${activeSemesterError.message}`,
          )

        const semesterId = activeSemesterData.semester_id

        // 4. Get all subjects for that semester
        const { data: subjectsData, error: subjectsError } = await supabase
          .from("subjects")
          .select("id, name, subject_code, type, is_optional")
          .eq("semester_id", semesterId)
          .order("name", { ascending: true })

        if (subjectsError)
          throw new Error(`Could not fetch subjects. ${subjectsError.message}`)

        // 5. Fetch scholarship categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("form_config")
          .select("data_jsonb")
          .eq("data_name", "fee_categories")
          .single()

        if (categoriesError)
          throw new Error(
            `Could not fetch scholarship categories. ${categoriesError.message}`,
          )
        const scholarshipOptions =
          (categoriesData.data_jsonb as CategoryOption[]) || []
        setAvailableScholarships(scholarshipOptions)

        // 6. Fetch fee structures
        const { data: feesData, error: feesError } = await supabase
          .from("course_fees")
          .select("category_name, amount")
          .eq("course_id", courseId) 

        if (feesError)
          throw new Error(`Could not fetch course fees. ${feesError.message}`)

        const feeMap = new Map<string, number>()
        if (feesData) {
          for (const fee of feesData) {
            feeMap.set(fee.category_name, fee.amount)
          }
        }
        setCourseFeeMap(feeMap)

        // 7. Set all data
        setData({
          student: studentData,
          enrollment: {
            student_academic_year_id: studentAcademicYearId,
            course_id: courseId,
            course_name:
              (activeYearData.courses as { name: string })?.name || "N/A",
            academic_year_name: activeYearData.academic_year_name,
            semester_name:
              (activeSemesterData.semesters as { name: string })?.name || "N/A",
            semester_id: semesterId,
            total_fee: activeYearData.total_fee,
            scholarship_name: activeYearData.scholarship_name,
            scholarship_amount: activeYearData.scholarship_amount,
            net_payable_fee: activeYearData.net_payable_fee,
          },
          subjects: subjectsData || [],
          studentAcademicYearId: studentAcademicYearId,
        })

        // 8. Pre-select subjects
        const compulsorySubjects = (subjectsData || []).filter(
          (s: { is_optional: any }) => !s.is_optional,
        )
        setSelectedSubjects(compulsorySubjects.map((s: { id: any }) => s.id))

        // 9. Set scholarship and payment plan
        setSelectedScholarshipName(activeYearData.scholarship_name || "")
        setPaymentPlan(activeYearData.payment_plan === "Installment" ? "Installment" : "One Time")

      } catch (err: any) {
        console.error("Error fetching registration data:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchRegistrationData()
  }, [student_id, supabase])

  const handleSubjectToggle = (subjectId: string, checked: boolean) => {
    setSelectedSubjects(prev =>
      checked ? [...prev, subjectId] : prev.filter(id => id !== subjectId),
    )
  }

  // --- NEW: Validation for submit button ---
  const isSubmitDisabled = useMemo(() => {
    if (submitting || loading || selectedSubjects.length === 0) return true
    // Disable if they chose installment but haven't selected a file
    if (paymentPlan === "Installment" && !undertakingFile) return true
    return false
  }, [submitting, loading, selectedSubjects, paymentPlan, undertakingFile])
  // -------------------------------------

  const handleSubmitRegistration = async () => {
    if (
      !data?.studentAcademicYearId ||
      !data.enrollment ||
      !data.student?.id
    ) {
      setError("Missing critical data. Cannot submit.")
      return
    }

    if (selectedSubjects.length === 0) {
      setError("You must select at least one subject.")
      return
    }

    // --- NEW: File Validation ---
    if (paymentPlan === "Installment" && !undertakingFile) {
      setError("Please upload the installment undertaking form to proceed.")
      return
    }
    // ----------------------------

    setSubmitting(true)
    setIsUploading(true)
    setError(null)

    let uploadedFilePath: string | null = null

    try {
      // --- NEW: File Upload Logic ---
      if (paymentPlan === "Installment" && undertakingFile) {
        const fileExt = undertakingFile.name.split(".").pop()
        const fileName = `undertaking_${data.student.id}_${Date.now()}.${fileExt}`
        const filePath = `student_undertakings/${data.student.id}/${fileName}`

        const { data: uploadData, error: uploadError } =
          await supabase.storage
            .from("student_documents") // Assuming this is your documents bucket
            .upload(filePath, undertakingFile)

        if (uploadError) {
          throw new Error(
            `Failed to upload undertaking form: ${uploadError.message}`,
          )
        }
        uploadedFilePath = uploadData.path
      }
      setIsUploading(false)
      // ----------------------------

      // Find the full subject objects for saving
      const selectedSubjectDetails = data.subjects.filter(s =>
        selectedSubjects.includes(s.id),
      )

      const registrationPayload = {
        registered_at: new Date().toISOString(),
        semester_id: data.enrollment.semester_id,
        semester_name: data.enrollment.semester_name,
        selected_subjects: selectedSubjectDetails,
      }

      // --- Create the final update payload ---
      const updatePayload: {
        is_registered: boolean
        registration_data: any
        scholarship_name?: string
        scholarship_amount?: number
        net_payable_fee?: number
        payment_plan: string // NEW
        installment_undertaking_path?: string | null // NEW
      } = {
        is_registered: true,
        registration_data: registrationPayload,
        payment_plan: paymentPlan,
        installment_undertaking_path: uploadedFilePath,
      }

      if (isEditingScholarship) {
        updatePayload.scholarship_name = selectedScholarshipName
        updatePayload.scholarship_amount = newScholarshipAmount
        updatePayload.net_payable_fee = newPayableAmount
      }
      // -------------------------------------------

      const { error: updateError } = await supabase
        .from("student_academic_years")
        .update(updatePayload)
        .eq("id", data.studentAcademicYearId)

      if (updateError) throw updateError

      alert("Registration Successful!")
      router.push("/student/fees") // or wherever you want to redirect
    } catch (err: any) {
      console.error("Error submitting registration:", err)
      setError(`Failed to submit registration: ${err.message}`)
    } finally {
      setSubmitting(false)
      setIsUploading(false)
    }
  }

  // --- Render States ---
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
            <Button variant="link" onClick={() => router.back()} className="p-1">
              Go Back
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!data || !data.student || !data.enrollment) {
    return (
      <div className="p-4 md:p-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Could not load student data.</AlertDescription>
        </Alert>
      </div>
    )
  }

  // --- Main Content Render ---
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">
            Student Registration
          </CardTitle>
          <CardDescription>
            Confirm your subjects for the upcoming semester to complete your
            registration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Student Details */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-xl">Student Details</CardTitle>
            </CardHeader>
            {/* ... (existing student details card content) ... */}
             <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-primary" />
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Student Name
                  </Label>
                  <p className="font-semibold">{data.student.fullname}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-primary" />
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Roll Number
                  </Label>
                  <p className="font-semibold">
                    {data.student.roll_number || "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <GraduationCap className="h-5 w-5 text-primary" />
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Course
                  </Label>
                  <p className="font-semibold">{data.enrollment.course_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Academic Year
                  </Label>
                  <p className="font-semibold">
                    {data.enrollment.academic_year_name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Book className="h-5 w-5 text-primary" />
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Registering for Semester
                  </Label>
                  <p className="font-semibold">
                    {data.enrollment.semester_name}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* --- UPDATED: Financial Details Section --- */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Financial Details</CardTitle>
              <CardDescription>
                Review and update financial information if necessary.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* --- Existing Fee Summary --- */}
              <div className="grid grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/30">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Total Course Fee
                  </Label>
                  <p className="font-bold text-lg text-primary">
                    {formatCurrency(data.enrollment.total_fee)}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Current Scholarship
                  </Label>
                  <p className="font-bold text-lg text-orange-600">
                    - {formatCurrency(data.enrollment.scholarship_amount)}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Net Payable Fee
                  </Label>
                  <p className="font-bold text-lg text-green-700">
                    {formatCurrency(data.enrollment.net_payable_fee)}
                  </p>
                </div>
              </div>

              {/* --- Existing Scholarship Editor --- */}
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="edit-scholarship"
                  checked={isEditingScholarship}
                  onCheckedChange={setIsEditingScholarship}
                />
                <Label htmlFor="edit-scholarship" className="font-semibold">
                  Update Scholarship Details
                </Label>
              </div>

              {isEditingScholarship && (
                <div className="p-4 border-l-4 border-primary bg-muted/50 rounded-r-lg space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="scholarship_name">
                        Scholarship Category
                      </Label>
                      <Select
                        value={selectedScholarshipName}
                        onValueChange={setSelectedScholarshipName}
                        disabled={
                          availableScholarships.length === 0 || loading
                        }
                      >
                        <SelectTrigger id="scholarship_name">
                          <SelectValue placeholder="Select a scholarship category" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableScholarships.map(cat => (
                            <SelectItem key={cat.name} value={cat.name}>
                              {cat.name}{" "}
                              {cat.description
                                ? `(${cat.description})`
                                : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="scholarship_amount">
                        Calculated Scholarship Amount (₹)
                      </Label>
                      <Input
                        id="scholarship_amount"
                        type="text"
                        value={formatCurrency(newScholarshipAmount)}
                        readOnly
                        className="font-bold text-orange-600 bg-white/50"
                      />
                    </div>
                  </div>
                  <Alert>
                    <Wallet className="h-4 w-4" />
                    <AlertTitle>Review New Calculation</AlertTitle>
                    <AlertDescription className="flex justify-between items-center">
                      <span>New Net Payable Fee:</span>
                      <span className="font-bold text-lg text-green-700">
                        {formatCurrency(newPayableAmount)}
                      </span>
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* --- NEW: Payment Plan Section --- */}
              <div className="space-y-4 pt-4 border-t">
                <Label className="text-base font-semibold">Payment Plan</Label>
                <RadioGroup
                  value={paymentPlan}
                  onValueChange={(value: "One Time" | "Installment") =>
                    setPaymentPlan(value)
                  }
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="One Time" id="r-one-time" />
                    <Label htmlFor="r-one-time">One Time Payment</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Installment" id="r-installment" />
                    <Label htmlFor="r-installment">Installment Plan</Label>
                  </div>
                </RadioGroup>

                {/* Conditional File Upload */}
                {paymentPlan === "Installment" && (
                  <div className="p-4 border-l-4 border-destructive bg-red-50/50 rounded-r-lg space-y-3">
                    <Label
                      htmlFor="undertaking-file"
                      className="font-semibold text-destructive-foreground"
                    >
                      Installment Undertaking Form*
                    </Label>
                    <p className="text-xs text-destructive-foreground/80">
                      Please upload the signed undertaking form (PDF, PNG, JPG). Max 5MB.
                    </p>
                    <Input
                      id="undertaking-file"
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="file:text-sm file:font-medium"
                    />
                    {isUploading && (
                      <div className="flex items-center text-sm text-primary">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </div>
                    )}
                    {undertakingFile && !isUploading && (
                       <div className="flex items-center text-sm text-green-700 font-medium">
                        <FileCheck className="h-4 w-4 mr-2" />
                        Selected: {undertakingFile.name}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* ------------------------------------- */}
            </CardContent>
          </Card>
          
          {/* Subject Selection */}
          <div>
            <Label className="text-lg font-semibold">Select Subjects</Label>
            <p className="text-sm text-muted-foreground mb-4">
              Compulsory subjects are pre-selected. Please select your optional
              subjects.
            </p>
            <div className="space-y-4 rounded-md border p-4">
              {data.subjects.length === 0 ? (
                <p className="text-center text-muted-foreground">
                  No subjects found for this semester.
                </p>
              ) : (
                data.subjects.map(subject => (
                  <div key={subject.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={subject.id}
                      checked={selectedSubjects.includes(subject.id)}
                      onCheckedChange={checked =>
                        handleSubjectToggle(subject.id, !!checked)
                      }
                      disabled={!subject.is_optional}
                    />
                    <Label
                      htmlFor={subject.id}
                      className="font-medium flex-1 cursor-pointer"
                    >
                      {subject.name}
                      <span className="text-xs text-muted-foreground ml-2">
                        ({subject.subject_code || "N/A"})
                      </span>
                    </Label>
                    <Badge variant={subject.is_optional ? "outline" : "default"}>
                      {subject.is_optional ? "Optional" : "Compulsory"}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmitRegistration}
            disabled={isSubmitDisabled} // <-- UPDATED
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckSquare className="h-4 w-4 mr-2" />
            )}
            Confirm Registration
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

// --- Suspense Wrapper ---
export default function StudentRegistrationPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      }
    >
      <StudentRegistrationPage />
    </Suspense>
  )
}