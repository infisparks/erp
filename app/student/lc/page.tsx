"use client"

import React, { useState, useEffect, useMemo, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { SupabaseClient } from "@supabase/supabase-js"
import { format } from "date-fns" // For date formatting

// --- ShadCN UI Components ---
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// --- Icons ---
import { Loader2, AlertTriangle, ArrowLeft, UserRound, Printer, Link } from "lucide-react"

// --- Type Definitions ---
interface StudentDetails {
  id: number;
  fullname: string;
  mother_name: string | null;
  nationality: string | null;
  religion: string | null;
  caste: string | null;
  category_type: string | null;
  place_of_birth: string | null;
  dateofbirth: string | null;
  aadhar_card_number: string | null;
  created_at: string; // Admission Date
  domicile_of_maharashtra: string | null;
  photo_path: string | null;
}

interface LastEnrollment {
  academic_year_name: string;
  course_name: string;
}

// --- Helper Date Formatter ---
const formatDate = (dateString: string | null, formatStr: string = "dd-MM-yyyy") => {
  if (!dateString) return "N/A";
  try {
    return format(new Date(dateString), formatStr);
  } catch (e) {
    console.error("Invalid date:", dateString, e)
    return "Invalid Date";
  }
}

// -------------------------------------------------------------------
// 🚀 Main LC Page Component
// -------------------------------------------------------------------
function StudentLCPage() {
  const supabase = getSupabaseClient()
  const searchParams = useSearchParams()
  const router = useRouter()
  const studentId = searchParams.get('student_id')

  // --- State ---
  const [student, setStudent] = useState<StudentDetails | null>(null)
  const [lastYear, setLastYear] = useState<LastEnrollment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [today] = useState(new Date())

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
      const numericStudentId = parseInt(studentId, 10)
      if (isNaN(numericStudentId)) {
        setError("Invalid Student ID.")
        setLoading(false)
        return
      }

      try {
        // Fetch in parallel
        const [studentResult, lastYearResult] = await Promise.all([
          // 1. Fetch Student Details
          supabase
            .from("students")
            .select(`
              id, fullname, mother_name, nationality, religion, caste, category_type,
              place_of_birth, dateofbirth, aadhar_card_number, created_at,
              domicile_of_maharashtra, photo_path
            `)
            .eq('id', numericStudentId)
            .single(),
          
          // 2. Fetch Student's LAST Academic Year
          supabase
            .from("student_academic_years")
            .select(`
              academic_year_name,
              course:courses ( name )
            `)
            .eq('student_id', numericStudentId)
            .order('academic_year_session', { ascending: false })
            .limit(1)
            .single()
        ]);

        // Process Student Data
        if (studentResult.error) {
          if (studentResult.error.code === 'PGRST116') {
            throw new Error(`No student found with ID ${numericStudentId}.`)
          }
          throw new Error(`Student Error: ${studentResult.error.message}`)
        }
        setStudent(studentResult.data as StudentDetails)

        // Process Last Enrollment Data
        if (lastYearResult.error && lastYearResult.error.code !== 'PGRST116') {
           throw new Error(`Enrollment Error: ${lastYearResult.error.message}`)
        }
        if (lastYearResult.data) {
          setLastYear({
            academic_year_name: lastYearResult.data.academic_year_name,
            course_name: (lastYearResult.data.course as any).name || "N/A"
          })
        }

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

  const handlePrint = () => {
    window.print()
  }

  // --- Render Logic ---
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2">Loading Student Certificate...</p>
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

    // --- Data for LC ---
    const dataRows = [
      { label: "1. Name of the Student", value: student.fullname || "N/A" },
      { label: "2. Mother's Name", value: student.mother_name || "N/A" },
      { label: "3. Nationality", value: student.nationality || "N/A" },
      { label: "4. Religion", value: `${student.religion || "N/A"}`, sublabel: `Caste: ${student.caste || "N/A"}` },
      { label: "5. Category", value: student.category_type || "N/A" },
      { label: "6. Domicile of Maharashtra", value: student.domicile_of_maharashtra === "Y" ? "Yes" : "No" },
      { label: "7. Place of Birth", value: student.place_of_birth || "N/A" },
      { 
        label: "8. Date of Birth", 
        value: `${formatDate(student.dateofbirth, "do MMMM yyyy")}`,
        sublabel: `(In figures: ${formatDate(student.dateofbirth, "dd-MM-yyyy")})`
      },
      { label: "9. UID (Aadhar No.)", value: student.aadhar_card_number || "N/A" },
      { label: "10. Last Institute Attended", value: "This Institute" },
      { label: "11. Date of Admission", value: formatDate(student.created_at, "do MMMM yyyy") },
      { 
        label: "12. Course of Study", 
        value: lastYear?.course_name || "N/A",
        sublabel: `Class: ${lastYear?.academic_year_name || "N/A"}`
      },
      { label: "13. Progress", value: "Good" },
      { label: "14. Conduct", value: "Good" },
      { label: "15. Date of Leaving", value: formatDate(today.toISOString(), "do MMMM yyyy") },
      { label: "16. Reason for Leaving", value: "To Pursue Higher Studies" },
      { label: "17. Remarks", value: "N/A" },
    ];
    
    return (
      <div className="lc-paper relative bg-white text-black shadow-lg">
        {/* This is the background. It will only be visible if you place
          'letterhead.png' in your 'public/' folder.
          background-size: 100% 100% will STRETCH your A4 image to fit this A4 div.
        */}
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: "url('/letterhead.png')",
            zIndex: 0,
            opacity: 1.0, 
            backgroundSize: "100% 100%", // <-- THIS IS THE FIX
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        ></div>

        {/* Content container. 
          This DIV sits on top of the background.
          Adjust the PADDING here to fit your letterhead's header/footer.
        */}
        <div className="relative z-10 lc-paper-content font-serif">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold uppercase text-red-700 tracking-wider">
              Leaving Certificate
            </h1>
            <p className="text-sm">(As per Mumbai University Guidelines)</p>
          </div>

          {/* UID / GR No */}
          <div className="flex justify-between items-center mt-8 mb-4">
            <div className="text-left">
              <span className="font-semibold">G.R. No. (U.I.D.): </span>
              <span className="font-mono text-lg font-bold">{student.id}</span>
            </div>
            <Avatar className="h-24 w-24 rounded-md border-2 border-black">
              <AvatarImage 
                src={avatarUrl || undefined} 
                alt={student.fullname || "Student Photo"} 
                className="rounded-md object-cover"
              />
              <AvatarFallback className="rounded-md bg-muted">
                <UserRound className="h-12 w-12 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
          </div>

          <Separator className="my-4 bg-gray-400" />

          {/* Certificate Body */}
          <div className="space-y-3 text-lg leading-relaxed">
            <p className="indent-8">
              This is to certify that,{" "}
              <strong className="px-2 underline decoration-dotted">
                {student.fullname}
              </strong>
              (G.R. No: <strong>{student.id}</strong>)
              was a bonafide student of this institute, studying in the{" "}
              <strong className="px-2 underline decoration-dotted">
                {lastYear?.course_name}
              </strong>{" "}
              program.
            </p>
            <p>
              His/Her personal and academic details as per our records are as follows:
            </p>
          </div>

          {/* Data Table */}
          <div className="mt-6 space-y-3">
            {dataRows.map(row => (
              <div key={row.label} className="flex border-b border-gray-300 py-2">
                <div className="w-2/5 font-semibold text-gray-700">{row.label}</div>
                <div className="w-3/5 font-medium">
                  {row.value}
                  {row.sublabel && (
                    <span className="block text-sm text-gray-500">{row.sublabel}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer / Signatures */}
          <div className="mt-20 flex justify-between items-end text-sm">
            <div className="space-y-1">
              <p>Date: {formatDate(today.toISOString(), "dd/MM/yyyy")}</p>
              <p>Place: Mumbai</p>
            </div>
            <div className="text-center space-y-1">
              <div className="w-48 h-12"></div> {/* Placeholder for signature */}
              <p className="border-t border-gray-500 pt-1 font-semibold">
                Head Clerk
              </p>
            </div>
            <div className="text-center space-y-1">
              <div className="w-48 h-12"></div> {/* Placeholder for signature */}
              <p className="border-t border-gray-500 pt-1 font-semibold">
                Principal
              </p>
            </div>
          </div>

        </div>
      </div>
    )
  }

  return (
    <>
      {/* --- 
        This is the CSS for the page.
        I have updated .lc-paper and created .lc-paper-content
      --- */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&family=Roboto+Slab:wght@400;700&display=swap');
        
        .lc-paper {
          font-family: 'Merriweather', serif;
          width: 210mm;
          min-height: 297mm;
          margin: 2rem auto;
          box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
          border: 1px solid #ddd;
          background-color: #ffffff;
        }

        /* --- THIS IS THE NEW CONTENT CONTAINER --- */
        .lc-paper-content {
          /* !!! IMPORTANT: ADJUST THESE PADDING VALUES !!!
            Change '150px' to match your letterhead's header height.
            Change '100px' to match your letterhead's footer height.
            '75px' is a standard side margin.
          */
          padding-top: 150px; 
          padding-bottom: 100px;
          padding-left: 75px;
          padding-right: 75px;
        }
        /* ------------------------------------------- */

        .lc-paper .font-serif {
            font-family: 'Merriweather', serif;
        }
        
        .lc-paper .font-mono {
            font-family: 'Roboto Slab', monospace;
        }

        .print-hide {
          /* This class hides elements when printing */
        }

        @media print {
          /* Hide everything *except* the paper */
          body * {
            visibility: hidden;
            margin: 0;
            padding: 0;
          }
          .lc-paper, .lc-paper * {
            visibility: visible;
          }
          .lc-paper {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            border: none;
            box-shadow: none;
            /* Ensure background prints (browser setting dependent) */
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          /* Hide the print button itself */
          .print-hide {
            display: none !important;
          }
        }
      `}</style>
      
      {/* --- Main Page Layout --- */}
      <div className="p-2 md:p-4 bg-gray-100 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Controls Bar */}
          <div className="print-hide flex justify-between items-center mb-4">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/student/fees/detail?student_id=${studentId}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Student Details
              </Link>
            </Button>
            <Button size="lg" onClick={handlePrint}>
              <Printer className="h-5 w-5 mr-2" />
              Print Certificate
            </Button>
          </div>
          
          {/* Render the LC or loading/error states */}
          {renderContent()}
        </div>
      </div>
    </>
  )
}

// Wrap the component in Suspense to safely use useSearchParams
export default function StudentLCPageWrapper() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    }>
      <StudentLCPage />
    </Suspense>
  )
}