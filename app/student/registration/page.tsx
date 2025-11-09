"use client"

import React, { useState, useEffect, Suspense } from "react"
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
import { Loader2, AlertTriangle, CheckSquare, User, Book, GraduationCap, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"

// --- Type Definitions ---
interface Student {
  id: number
  fullname: string | null
  roll_number: string | null
}

interface ActiveEnrollment {
  student_academic_year_id: number
  course_name: string
  academic_year_name: string
  semester_name: string
  semester_id: string
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

  useEffect(() => {
    if (!student_id) {
      setError("No student ID provided.")
      setLoading(false)
      return
    }

    async function fetchRegistrationData() {
      try {
        setLoading(true)
        setError(null)

        // 1. Get the student
        const { data: studentData, error: studentError } = await supabase
          .from("students")
          .select("id, fullname, roll_number")
          .eq("id", student_id)
          .single()

        if (studentError) throw new Error(`Student not found: ${studentError.message}`)
        
        // 2. Get the student's ACTIVE academic year
        const { data: activeYearData, error: activeYearError } = await supabase
          .from("student_academic_years")
          .select("id, course_id, academic_year_name, courses(name)")
          .eq("student_id", student_id)
          .eq("status", "Active")
          .eq("is_registered", false) // Only fetch if not already registered
          .single()

        if (activeYearError) throw new Error(`Active academic year not found for this student. ${activeYearError.message}`)
        if (!activeYearData) throw new Error("No active, unregistered academic year found.")

        const studentAcademicYearId = activeYearData.id
        
        // 3. Get the student's ACTIVE semester
        const { data: activeSemesterData, error: activeSemesterError } = await supabase
          .from("student_semesters")
          .select("semester_id, semesters(name)")
          .eq("student_academic_year_id", studentAcademicYearId)
          .eq("status", "active")
          .single()

        if (activeSemesterError) throw new Error(`Active semester not found. ${activeSemesterError.message}`)
        
        const semesterId = activeSemesterData.semester_id
        
        // 4. Get all subjects for that semester
        const { data: subjectsData, error: subjectsError } = await supabase
          .from("subjects")
          .select("id, name, subject_code, type, is_optional")
          .eq("semester_id", semesterId)
          .order("name", { ascending: true })

        if (subjectsError) throw new Error(`Could not fetch subjects. ${subjectsError.message}`)

        // 5. Set all data
        setData({
          student: studentData,
          enrollment: {
            student_academic_year_id: studentAcademicYearId,
            course_name: (activeYearData.courses as { name: string })?.name || "N/A",
            academic_year_name: activeYearData.academic_year_name,
            semester_name: (activeSemesterData.semesters as { name: string })?.name || "N/A",
            semester_id: semesterId,
          },
          subjects: subjectsData || [],
          studentAcademicYearId: studentAcademicYearId
        })
        
        // 6. Pre-select all non-optional subjects
        const compulsorySubjects = (subjectsData || [])
          .filter((s: { is_optional: any }) => !s.is_optional)
          .map((s: { id: any }) => s.id)
        setSelectedSubjects(compulsorySubjects)

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
      checked ? [...prev, subjectId] : prev.filter(id => id !== subjectId)
    )
  }
  
  const handleSubmitRegistration = async () => {
    if (!data?.studentAcademicYearId || !data.enrollment) {
        setError("Missing critical data. Cannot submit.")
        return
    }
    
    if (selectedSubjects.length === 0) {
        setError("You must select at least one subject.")
        return
    }

    setSubmitting(true)
    setError(null)
    
    // Find the full subject objects for saving
    const selectedSubjectDetails = data.subjects.filter(s => selectedSubjects.includes(s.id))
    
    const registrationPayload = {
        registered_at: new Date().toISOString(),
        semester_id: data.enrollment.semester_id,
        semester_name: data.enrollment.semester_name,
        selected_subjects: selectedSubjectDetails
    }
    
    try {
        const { error: updateError } = await supabase
            .from("student_academic_years")
            .update({
                is_registered: true,
                registration_data: registrationPayload // Save the JSONB data
            })
            .eq("id", data.studentAcademicYearId) // Update the specific academic year record
            
        if (updateError) throw updateError
        
        // Success
        alert("Registration Successful!") // Simple feedback
        router.push("/student/fees") // Redirect back to the fees list
        
    } catch (err: any) {
        console.error("Error submitting registration:", err)
        setError(`Failed to submit registration: ${err.message}`)
    } finally {
        setSubmitting(false)
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
            Confirm your subjects for the upcoming semester to complete your registration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Student Details */}
          <Card className="bg-muted/50">
            <CardHeader>
                <CardTitle className="text-xl">Student Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-primary" />
                <div>
                  <Label className="text-xs text-muted-foreground">Student Name</Label>
                  <p className="font-semibold">{data.student.fullname}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-primary" />
                <div>
                  <Label className="text-xs text-muted-foreground">Roll Number</Label>
                  <p className="font-semibold">{data.student.roll_number || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <GraduationCap className="h-5 w-5 text-primary" />
                <div>
                  <Label className="text-xs text-muted-foreground">Course</Label>
                  <p className="font-semibold">{data.enrollment.course_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <Label className="text-xs text-muted-foreground">Academic Year</Label>
                  <p className="font-semibold">{data.enrollment.academic_year_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Book className="h-5 w-5 text-primary" />
                <div>
                  <Label className="text-xs text-muted-foreground">Registering for Semester</Label>
                  <p className="font-semibold">{data.enrollment.semester_name}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Subject Selection */}
          <div>
            <Label className="text-lg font-semibold">Select Subjects</Label>
            <p className="text-sm text-muted-foreground mb-4">
                Compulsory subjects are pre-selected. Please select your optional subjects.
            </p>
            <div className="space-y-4 rounded-md border p-4">
              {data.subjects.length === 0 ? (
                <p className="text-center text-muted-foreground">No subjects found for this semester.</p>
              ) : (
                data.subjects.map((subject) => (
                  <div key={subject.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={subject.id}
                      checked={selectedSubjects.includes(subject.id)}
                      onCheckedChange={(checked) => handleSubjectToggle(subject.id, !!checked)}
                      disabled={!subject.is_optional}
                    />
                    <Label
                      htmlFor={subject.id}
                      className="font-medium flex-1 cursor-pointer"
                    >
                      {subject.name}
                      <span className="text-xs text-muted-foreground ml-2">({subject.subject_code || "N/A"})</span>
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
            <Button variant="outline" onClick={() => router.back()} disabled={submitting}>
                Cancel
            </Button>
            <Button onClick={handleSubmitRegistration} disabled={submitting || loading || selectedSubjects.length === 0}>
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
// This ensures the page can use `useSearchParams`
export default function StudentRegistrationPageWrapper() {
  return (
    <Suspense fallback={
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    }>
      <StudentRegistrationPage />
    </Suspense>
  )
}