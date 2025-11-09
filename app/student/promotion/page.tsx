"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { SupabaseClient } from "@supabase/supabase-js"
import { useSearchParams } from 'next/navigation' // Import for reading query params

// --- ShadCN UI Components ---
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// --- Icons ---
import {
  Loader2,
  AlertTriangle,
  Send,
  GitBranch,
  UserRound,
  History,
  ChevronsRight,
  GraduationCap,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react"

// --- PrimeReact Components ---
import { Dropdown } from 'primereact/dropdown';

// --- Type Definitions ---
interface Stream { id: string; name: string; }
interface Course { id: string; name: string; stream_id: string; }
interface AcademicYear { id: string; name: string; course_id: string; }
interface Semester { id: string; name: string; academic_year_id: string; }

// --- Detailed student type for modal ---
interface StudentDetails {
  id: string;
  fullname: string | null;
  photo_path: string | null;
  roll_number: string | null;
  academic_years: StudentAcademicYearWithSemesters[];
  active_enrollment: {
    student_id: string;
    course_id: string;
    student_academic_year_id: string;
    academic_year_name: string;
    semester_id: string;
    semester_name: string;
    roll_number: string;
  } | null;
}

// --- Nested types for modal ---
interface StudentAcademicYearWithSemesters extends Omit<StudentAcademicYear, 'students'> {
  courses: { name: string } | null;
  student_semesters: (StudentSemester & { semesters: { name: string } | null })[];
  total_fee: number | null;
  scholarship_name: string | null;
  scholarship_amount: number | null;
  net_payable_fee: number | null;
}
interface StudentAcademicYear { id: string; student_id: string; course_id: string; academic_year_name: string; academic_year_session: string; status: string; }
interface StudentSemester { id: string; student_id: string; semester_id: string; student_academic_year_id: string; status: string; promotion_status: string; }

interface PromotionTarget {
  targetSemesterId: string;
  targetSemesterName: string;
  targetAcademicYearId: string;
  targetAcademicYearName: string;
  isNewYear: boolean;
}

// --- Helper Functions ---
const yearSortValues: { [key: string]: number } = {
  "first year": 1,
  "second year": 2,
  "third year": 3,
  "fourth year": 4,
  "final year": 5,
};

const robustSortByName = (a: { name: string }, b: { name: string }) => {
  const aName = a.name.toLowerCase();
  const bName = b.name.toLowerCase();

  const aYearVal = yearSortValues[aName];
  const bYearVal = yearSortValues[bName];

  if (aYearVal && bYearVal) {
    return aYearVal - bYearVal;
  }

  return a.name.localeCompare(b.name, undefined, { numeric: true });
};

// --- Avatar Component ---
const StudentAvatar: React.FC<{ src: string | null, alt: string | null, supabase: SupabaseClient, className?: string }> = ({ src, alt, supabase, className = "h-10 w-10" }) => {
  const publicUrl = useMemo(() => {
    if (!src) return null;
    return supabase.storage.from('student_documents').getPublicUrl(src).data.publicUrl;
  }, [src, supabase]);

  return (
    <Avatar className={`${className} rounded-md`}>
      <AvatarImage 
        src={publicUrl || undefined} 
        alt={alt || "Student Photo"} 
        className="rounded-md object-cover"
      />
      <AvatarFallback className="rounded-md bg-muted">
        <UserRound className="h-5 w-5 text-muted-foreground" />
      </AvatarFallback>
    </Avatar>
  )
}

// --- Helper Dropdown Component ---
const DropdownSelect: React.FC<{
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  options: { id: string; name: string }[];
  placeholder: string;
  disabled?: boolean;
}> = ({ label, value, onChange, options, placeholder, disabled = false }) => (
  <div className="space-y-1">
    <Label className="font-semibold">{label}</Label>
    <Dropdown
      value={value}
      options={options}
      onChange={(e) => onChange(e.value)}
      optionLabel="name"
      optionValue="id"
      placeholder={placeholder}
      className="w-full"
      filter
      disabled={disabled}
    />
  </div>
);


// --- Main Student Promotion Page Component ---
export default function StudentPromotionPage() {
  const supabase = getSupabaseClient();
  const searchParams = useSearchParams();
  const studentId = searchParams.get('student_id');

  // --- Data State ---
  const [allStreams, setAllStreams] = useState<Stream[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [allAcademicYears, setAllAcademicYears] = useState<AcademicYear[]>([]);
  const [allSemesters, setAllSemesters] = useState<Semester[]>([]);

  // --- Student & Loading State ---
  const [initialLoading, setInitialLoading] = useState(true);
  const [configLoading, setConfigLoading] = useState(true);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState<StudentDetails | null>(null);

  // --- Promotion State ---
  const [promotionTarget, setPromotionTarget] = useState<PromotionTarget | null>(null);
  const [targetAcademicYearSession, setTargetAcademicYearSession] = useState("");
  const [isPromoting, setIsPromoting] = useState(false);

  // --- Branch Transfer State ---
  const [transferStreamId, setTransferStreamId] = useState<string | null>(null);
  const [transferCourseId, setTransferCourseId] = useState<string | null>(null);
  const [transferAcademicYearId, setTransferAcademicYearId] = useState<string | null>(null);
  const [transferSemesterId, setTransferSemesterId] = useState<string | null>(null);
  const [transferSession, setTransferSession] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  // --- Status State (for the page) ---
  const [pageStatusMessage, setPageStatusMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  // Reset transfer fields when course changes
  const handleTransferStreamChange = (value: string | null) => {
    setTransferStreamId(value);
    setTransferCourseId(null);
    setTransferAcademicYearId(null);
    setTransferSemesterId(null);
  };

  const handleTransferCourseChange = (value: string | null) => {
    setTransferCourseId(value);
    setTransferAcademicYearId(null);
    setTransferSemesterId(null);
  };

  const handleTransferAcademicYearChange = (value: string | null) => {
    setTransferAcademicYearId(value);
    setTransferSemesterId(null);
  };

  // --- Logic to find the next semester/year (for modal) ---
  const findPromotionTarget = useCallback((activeEnrollment: StudentDetails['active_enrollment']) => {
    if (!activeEnrollment) {
      setPromotionTarget(null);
      return;
    }

    const sourceSemester = allSemesters.find(s => s.id === activeEnrollment.semester_id);
    if (!sourceSemester) return;
    
    const sourceAcademicYear = allAcademicYears.find(ay => ay.id === sourceSemester.academic_year_id);
    if (!sourceAcademicYear) return;

    const semestersInSourceYear = allSemesters
      .filter(s => s.academic_year_id === sourceAcademicYear.id)
      .sort(robustSortByName);
    
    const currentSemIndex = semestersInSourceYear.findIndex(s => s.id === sourceSemester.id);

    // Intra-year promotion
    if (currentSemIndex < semestersInSourceYear.length - 1) {
      const targetSemester = semestersInSourceYear[currentSemIndex + 1];
      setPromotionTarget({
        targetSemesterId: targetSemester.id,
        targetSemesterName: targetSemester.name,
        targetAcademicYearId: sourceAcademicYear.id,
        targetAcademicYearName: sourceAcademicYear.name,
        isNewYear: false
      });
      return;
    }

    // Inter-year promotion
    const academicYearsInCourse = allAcademicYears
      .filter(ay => ay.course_id === activeEnrollment.course_id)
      .sort(robustSortByName);
      
    const currentYearIndex = academicYearsInCourse.findIndex(ay => ay.id === sourceAcademicYear.id);

    if (currentYearIndex < academicYearsInCourse.length - 1) {
      const targetAcademicYear = academicYearsInCourse[currentYearIndex + 1];
      
      const targetSemester = allSemesters
        .filter(s => s.academic_year_id === targetAcademicYear.id)
        .sort(robustSortByName)[0]; // First semester of the next year

      if (targetSemester) {
        setPromotionTarget({
          targetSemesterId: targetSemester.id,
          targetSemesterName: targetSemester.name,
          targetAcademicYearId: targetAcademicYear.id,
          targetAcademicYearName: targetAcademicYear.name,
          isNewYear: true
        });
        return;
      }
    }
    setPromotionTarget(null); // End of course
  }, [allAcademicYears, allSemesters]);


  // --- Fetch Student Details Function ---
  const fetchStudentDetails = useCallback(async (id: string) => {
    if (configLoading) return; // Wait for config data to load

    setInitialLoading(true);
    setPageStatusMessage(null);
    setSelectedStudentDetails(null);
    setPromotionTarget(null);

    try {
      // 1. Fetch Student's base data
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("id, fullname, photo_path, roll_number")
        .eq("id", id)
        .single();
        
      if (studentError) throw studentError;

      // 2. Fetch their *entire* academic history
      const { data: academicYearsData, error: yearsError } = await supabase
        .from("student_academic_years")
        .select(`
          *,
          courses ( name ),
          student_semesters (
            *,
            semesters ( name )
          )
        `)
        .eq("student_id", id)
        .order("academic_year_name", { ascending: true, nullsFirst: false });
        
      if (yearsError) throw yearsError;
      
      const academic_years = (academicYearsData as StudentAcademicYearWithSemesters[]).map(year => ({
        ...year,
        student_semesters: year.student_semesters.sort((a, b) => robustSortByName(a.semesters!, b.semesters!))
      })).sort((a, b) => robustSortByName(
        { name: a.academic_year_name }, 
        { name: b.academic_year_name }
      ));

      // 3. Find the *one* active enrollment
      let active_enrollment: StudentDetails['active_enrollment'] = null;
      for (const year of academic_years) {
        if (year.status === 'Active') {
          const activeSem = year.student_semesters.find(s => s.status === 'active');
          if (activeSem) {
            active_enrollment = {
              student_id: activeSem.student_id,
              course_id: year.course_id,
              student_academic_year_id: year.id,
              academic_year_name: year.academic_year_name,
              semester_id: activeSem.semester_id,
              semester_name: activeSem.semesters?.name || 'N/A',
              roll_number: studentData.roll_number || 'N/A',
            };
            break; // Found it
          }
        }
      }

      // 4. Set state and find promotion target
      const details: StudentDetails = { ...studentData, academic_years, active_enrollment };
      setSelectedStudentDetails(details);
      findPromotionTarget(active_enrollment);
      
    } catch (err: any) {
      console.error("Error fetching student details:", err);
      setPageStatusMessage({ type: 'error', message: `Failed to load student details: ${err.message}` });
    } finally {
      setInitialLoading(false);
    }
  }, [supabase, configLoading, findPromotionTarget]);


  // --- Initial Config Fetch (Streams, Courses, etc.) ---
  useEffect(() => {
    const fetchConfig = async () => {
      setConfigLoading(true);
      try {
        const [streamsRes, coursesRes, ayRes, semestersRes] = await Promise.all([
          supabase.from("streams").select("id, name").order("name"),
          supabase.from("courses").select("id, name, stream_id").order("name"),
          supabase.from("academic_years").select("id, name, course_id").order("name"),
          supabase.from("semesters").select("id, name, academic_year_id").order("name"),
        ]);
        
        if (streamsRes.data) setAllStreams(streamsRes.data);
        if (coursesRes.data) setAllCourses(coursesRes.data);
        if (ayRes.data) setAllAcademicYears(ayRes.data);
        if (semestersRes.data) setAllSemesters(semestersRes.data);

      } catch (err: any) {
        setPageStatusMessage({ type: 'error', message: `Config Error: ${err.message}` });
      } finally {
        setConfigLoading(false);
      }
    };
    fetchConfig();
  }, [supabase]);

  // --- Effect to fetch student details once config and studentId are ready ---
  useEffect(() => {
    if (studentId && !configLoading) {
      fetchStudentDetails(studentId);
    } else if (!studentId && !configLoading) {
      setInitialLoading(false);
      setPageStatusMessage({ type: 'error', message: 'No student ID provided in the URL query parameter.' });
    }
  }, [studentId, configLoading, fetchStudentDetails]);


  // --- Promotion Logic (UPDATED with Status Check) ---
  const handlePromotion = async () => {
    if (!promotionTarget || !selectedStudentDetails || !selectedStudentDetails.active_enrollment) {
      setPageStatusMessage({ type: 'error', message: 'No student or promotion target selected.' });
      return;
    }
    
    const { active_enrollment } = selectedStudentDetails;

    if (promotionTarget.isNewYear && !targetAcademicYearSession.trim()) {
      setPageStatusMessage({ type: 'error', message: 'Please enter a "Target Session" (e.g., 2025-2026) for the new academic year.' });
      return;
    }

    setIsPromoting(true); 
    setPageStatusMessage(null);

    try {
        // --- NEW VALIDATION STEP: Check Current Promotion Status ---
        const { data: currentSemData, error: statusError } = await supabase
            .from("student_semesters")
            .select("promotion_status")
            .eq('student_id', active_enrollment.student_id)
            .eq('semester_id', active_enrollment.semester_id)
            .eq('status', 'active')
            .single();

        if (statusError || !currentSemData) {
            throw new Error("Could not retrieve current semester status.");
        }
        
        // Block promotion if status is NOT 'Eligible'
        if (currentSemData.promotion_status !== 'Eligible') {
            setPageStatusMessage({ 
                type: 'error', 
                message: `Promotion blocked: Student's current status is "${currentSemData.promotion_status}". Only students with status 'Eligible' can be promoted.` 
            });
            setIsPromoting(false);
            return; // EXIT FUNCTION
        }
        // --- END NEW VALIDATION STEP ---


      // --- Case 1: INTRA-YEAR Promotion (e.g., Sem 1 -> Sem 2) ---
      if (!promotionTarget.isNewYear) {
        const newSemesterEnrollment = {
          student_id: active_enrollment.student_id,
          semester_id: promotionTarget.targetSemesterId,
          student_academic_year_id: active_enrollment.student_academic_year_id,
          status: 'active',
          promotion_status: 'Eligible'
        };

        const { error: insertError } = await supabase
          .from("student_semesters")
          .insert(newSemesterEnrollment);
        
        if (insertError) throw new Error(`Insert Error: ${insertError.message}`);
      }
      
      // --- Case 2: INTER-YEAR Promotion (e.g., Sem 2 -> Sem 3) ---
      if (promotionTarget.isNewYear) {
        
        const currentAcademicYear = selectedStudentDetails.academic_years.find(
          (year) => year.id === active_enrollment.student_academic_year_id
        );

        if (!currentAcademicYear) {
          throw new Error("Could not find current academic year details to carry over.");
        }
        
        const { data: feeData, error: feeError } = await supabase
          .from("course_fees")
          .select("category_name, amount")
          .eq("course_id", active_enrollment.course_id);
          
        if (feeError) throw new Error(`Fee Fetch Error: ${feeError.message}`);
        
        // Find the 'Open' category fee for the new course or default to current year's total fee
        const openFee = feeData?.find((f: { category_name: string, amount: number }) => f.category_name === 'Open')?.amount || currentAcademicYear.total_fee || 0;
        
        const newAcademicYearRecord = {
          student_id: active_enrollment.student_id,
          course_id: active_enrollment.course_id,
          academic_year_name: promotionTarget.targetAcademicYearName,
          academic_year_session: targetAcademicYearSession,
          status: 'Active',
          total_fee: openFee,
          scholarship_name: currentAcademicYear.scholarship_name,
          scholarship_amount: currentAcademicYear.scholarship_amount,
          net_payable_fee: (openFee) - (currentAcademicYear.scholarship_amount || 0),
        };
        
        const { data: createdYearData, error: yearInsertError } = await supabase
          .from("student_academic_years")
          .insert(newAcademicYearRecord)
          .select("id, student_id")
          .single();
          
        if (yearInsertError) throw new Error(`Year Insert Error: ${yearInsertError.message}`);

        const newSemesterEnrollment = {
            student_id: createdYearData.student_id,
            semester_id: promotionTarget.targetSemesterId,
            student_academic_year_id: createdYearData.id,
            status: 'active',
            promotion_status: 'Eligible' // New semester defaults to Eligible
        };

        const { error: insertError } = await supabase
          .from("student_semesters")
          .insert(newSemesterEnrollment);
          
        if (insertError) throw new Error(`Semester Insert Error: ${insertError.message}`);

        // Mark the old academic year as Inactive
        await supabase
          .from("student_academic_years")
          .update({ status: 'Inactive' })
          .eq('id', active_enrollment.student_academic_year_id);
      }

      // Deactivate old semester and set its final promotion status to 'Promoted'
      const { error: updateError } = await supabase
        .from("student_semesters")
        .update({ status: 'inactive', promotion_status: 'Promoted' })
        .eq('student_id', active_enrollment.student_id)
        .eq('semester_id', active_enrollment.semester_id);

      if (updateError) throw new Error(`Old Semester Update Error: ${updateError.message}`);

      setPageStatusMessage({ type: 'success', message: `Student promoted to ${promotionTarget.targetSemesterName} successfully!` });
      setTargetAcademicYearSession("");
      
      // Refresh the details in place
      fetchStudentDetails(active_enrollment.student_id); 

    } catch (err: any) {
      setPageStatusMessage({ type: 'error', message: `Promotion Failed: ${err.message}` });
    } finally {
      setIsPromoting(false);
    }
  };


  // --- Branch Transfer Logic ---
  const handleBranchTransfer = async () => {
    if (!selectedStudentDetails || !selectedStudentDetails.active_enrollment || !transferCourseId || !transferSemesterId) {
      setPageStatusMessage({ type: 'error', message: 'Please select a new course, year, semester, and session.' });
      return;
    }
    if (!transferSession.trim()) {
      setPageStatusMessage({ type: 'error', message: 'A Target Session (e.g., 2025-2026) is required.' });
      return;
    }

    const { active_enrollment } = selectedStudentDetails;
    
    if (transferCourseId === active_enrollment.course_id) {
       setPageStatusMessage({ type: 'error', message: 'Cannot transfer to the same course.' });
       return;
    }

    setIsTransferring(true);
    setPageStatusMessage(null);
    
    const newCourse = allCourses.find(c => c.id === transferCourseId)?.name || 'N/A';
    const newYear = allAcademicYears.find(ay => ay.id === transferAcademicYearId)?.name || 'N/A';
    const newSemester = allSemesters.find(s => s.id === transferSemesterId)?.name || 'N/A';
    
    try {
      const currentAcademicYear = selectedStudentDetails.academic_years.find(
        (year) => year.id === active_enrollment.student_academic_year_id
      );

      if (!currentAcademicYear) {
        throw new Error("Could not find current academic year details to carry over.");
      }
      
      const { data: feeData, error: feeError } = await supabase
        .from("course_fees")
        .select("category_name, amount")
        .eq("course_id", transferCourseId);
      if (feeError) throw new Error(`Fee Fetch Error: ${feeError.message}`);
      
      const openFee = feeData?.find((f: { category_name: string, amount: number }) => f.category_name === 'Open')?.amount || 0;

      const { data: newYearData, error: yearInsertError } = await supabase
        .from("student_academic_years")
        .insert({
          student_id: active_enrollment.student_id,
          course_id: transferCourseId,
          academic_year_name: newYear,
          academic_year_session: transferSession,
          status: 'Active',
          total_fee: openFee,
          scholarship_name: currentAcademicYear.scholarship_name,
          scholarship_amount: currentAcademicYear.scholarship_amount,
          net_payable_fee: (openFee) - (currentAcademicYear.scholarship_amount || 0),
        })
        .select('id')
        .single();
        
      if (yearInsertError) throw new Error(`New Year Insert Error: ${yearInsertError.message}`);

      const { error: insertError } = await supabase
        .from("student_semesters")
        .insert({
          student_id: active_enrollment.student_id,
          semester_id: transferSemesterId,
          student_academic_year_id: newYearData.id,
          status: 'active',
          promotion_status: 'Eligible'
        });

      if (insertError) throw new Error(`New Semester Insert Error: ${insertError.message}`);
      
      // Update old semester status
      const { error: updateSemError } = await supabase
        .from("student_semesters")
        .update({ status: 'transferred', promotion_status: 'Hold' })
        .eq('student_id', active_enrollment.student_id)
        .eq('semester_id', active_enrollment.semester_id);

      if (updateSemError) throw new Error(`Old Semester Update Error: ${updateSemError.message}`);
      
      // Update old academic year status
      const { error: updateYearError } = await supabase
        .from("student_academic_years")
        .update({ status: 'transferred' })
        .eq('id', active_enrollment.student_academic_year_id);
        
      if (updateYearError) throw new Error(`Old Year Update Error: ${updateYearError.message}`);

      setPageStatusMessage({ type: 'success', message: `Student transferred to ${newCourse} (${newSemester}) successfully!` });
      
      // Clear transfer fields
      setTransferStreamId(null);
      setTransferCourseId(null);
      setTransferAcademicYearId(null);
      setTransferSemesterId(null);
      setTransferSession("");
      
      // Refresh the details in place
      fetchStudentDetails(active_enrollment.student_id);

    } catch (err: any) {
      setPageStatusMessage({ type: 'error', message: `Transfer Failed: ${err.message}` });
    } finally {
      setIsTransferring(false);
    }
  };


  // --- Derived Filters for Transfer Dropdowns ---
  const transferCourseOptions = useMemo(() => 
    allCourses.filter(c => c.stream_id === transferStreamId).sort(robustSortByName), 
    [allCourses, transferStreamId]
  );
  const transferAcademicYearOptions = useMemo(() => 
    allAcademicYears.filter(ay => ay.course_id === transferCourseId).sort(robustSortByName), 
    [allAcademicYears, transferCourseId]
  );
  const transferSemesterOptions = useMemo(() => 
    allSemesters.filter(s => s.academic_year_id === transferAcademicYearId).sort(robustSortByName), 
    [allSemesters, transferAcademicYearId]
  );

  // --- DERIVED STATE FOR RENDER ONLY: Active Enrollment Status ---
  const activeEnrollmentStatus = selectedStudentDetails?.active_enrollment
    ? selectedStudentDetails.academic_years
        .find((y) => y.id === selectedStudentDetails.active_enrollment!.student_academic_year_id)
        ?.student_semesters.find(
          (s) => s.semester_id === selectedStudentDetails.active_enrollment!.semester_id && s.status === 'active'
        )?.promotion_status
    : null;
  // --- END DERIVED STATE ---


  // --- Render ---
  if (!studentId) {
    return (
      <div className="p-4 md:p-8 space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Missing Parameter</AlertTitle>
          <AlertDescription>
            The student ID is missing. Please navigate to this page using a URL like 
            <code className="bg-red-50 p-1 rounded ml-2">/student/promotion?student_id=XXX</code>.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <Card className="shadow-lg max-w-5xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-blue-700 flex items-center">
            <Send className="w-6 h-6 mr-3" />
            Manage Student Progression
          </CardTitle>
          <p className="text-lg text-muted-foreground">Student ID: <code className="bg-gray-100 p-1 rounded">{studentId}</code></p>
        </CardHeader>
        <CardContent>
          {(initialLoading || configLoading) && (
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="mt-4 text-gray-500">Loading student details and configuration...</p>
            </div>
          )}

          {pageStatusMessage && (
            <Alert variant={pageStatusMessage.type === 'error' ? 'destructive' : 'default'} className={`mb-4 ${pageStatusMessage.type === 'success' ? 'bg-green-100 border-green-400 text-green-800' : ''}`}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{pageStatusMessage.type === 'error' ? 'Operation Status' : 'Success!'}</AlertTitle>
              <AlertDescription>{pageStatusMessage.message}</AlertDescription>
            </Alert>
          )}

          {!initialLoading && selectedStudentDetails && (
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 border rounded-lg bg-gray-50">
                <StudentAvatar 
                  src={selectedStudentDetails.photo_path} 
                  alt={selectedStudentDetails.fullname} 
                  supabase={supabase} 
                  className="h-20 w-20" 
                />
                <div>
                  <h3 className="text-2xl font-bold">{selectedStudentDetails.fullname}</h3>
                  <p className="text-base text-muted-foreground">Roll No: 
                    <span className="font-semibold text-gray-700 ml-1">{selectedStudentDetails.roll_number || 'N/A'}</span>
                  </p>
                  <p className="text-base text-muted-foreground">Current Enrollment Status:</p>
                  <div className="mt-1">
                    {selectedStudentDetails.active_enrollment ? (
                      <>
                        <Badge variant="default" className="text-sm">
                          {selectedStudentDetails.active_enrollment.academic_year_name} - {selectedStudentDetails.active_enrollment.semester_name}
                        </Badge>
                        <Badge variant="secondary" className="ml-2 text-sm">Active</Badge>
                      </>
                    ) : (
                      <Badge variant="destructive">Inactive / Not Enrolled</Badge>
                    )}
                  </div>
                </div>
              </div>

              <Tabs defaultValue="promote">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="promote"><Send className="w-4 h-4 mr-2" />Promote Student</TabsTrigger>
                  <TabsTrigger value="transfer"><GitBranch className="w-4 h-4 mr-2" />Branch Transfer</TabsTrigger>
                  <TabsTrigger value="history"><History className="w-4 h-4 mr-2" />Academic History</TabsTrigger>
                </TabsList>
                
                {/* --- Tab 1: Promotion --- */}
                <TabsContent value="promote" className="mt-4 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Promote Student</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      
                      {!selectedStudentDetails.active_enrollment ? (
                          <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Cannot Promote</AlertTitle>
                            <AlertDescription>This student does not have an active enrollment and cannot be promoted.</AlertDescription>
                          </Alert>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center p-4 border rounded-lg">
                            <div className="text-center">
                              <Label>Current Enrollment</Label>
                              <p className="text-xl font-bold text-blue-700">{selectedStudentDetails.active_enrollment.academic_year_name}</p>
                              <p className="text-md text-muted-foreground">{selectedStudentDetails.active_enrollment.semester_name}</p>
                                
                                {/* --- ADDED: Display Current Promotion Status Badge --- */}
                                {activeEnrollmentStatus && (
                                    <Badge 
                                        variant={activeEnrollmentStatus === 'Eligible' ? 'default' : 'destructive'} 
                                        className="mt-2 text-sm capitalize"
                                    >
                                        <ShieldCheck className="h-4 w-4 mr-1" />
                                        Status: **{activeEnrollmentStatus}**
                                    </Badge>
                                )}
                                {/* --- END ADDITION --- */}

                            </div>
                            <ChevronsRight className="w-10 h-10 text-muted-foreground mx-auto hidden md:block" />
                            <div className="text-center">
                              <Label>Promotion Target</Label>
                              {promotionTarget ? (
                                <>
                                  <p className="text-xl font-bold text-green-600">{promotionTarget.targetAcademicYearName}</p>
                                  <p className="text-md text-muted-foreground">{promotionTarget.targetSemesterName}</p>
                                  {promotionTarget.isNewYear && <Badge variant="outline" className="mt-1 bg-yellow-100 text-yellow-800 border-yellow-500">New Academic Year</Badge>}
                                </>
                              ) : (
                                <p className="text-xl font-bold text-red-600">End of Course</p>
                              )}
                            </div>
                          </div>
                          
                          {promotionTarget?.isNewYear && (
                            <div className="space-y-1">
                              <Label htmlFor="target-year-session" className="font-semibold text-red-600">Target Session (for New Year)*</Label>
                              <Input 
                                id="target-year-session"
                                placeholder="E.g., 2025-2026" 
                                value={targetAcademicYearSession} 
                                onChange={(e) => setTargetAcademicYearSession(e.target.value)}
                                required
                              />
                              <p className="text-xs text-gray-500">Required. This is the session for the newly created academic year record.</p>
                            </div>
                          )}
                          
                          <Button 
                            onClick={handlePromotion} 
                            disabled={!promotionTarget || isPromoting || (promotionTarget?.isNewYear && !targetAcademicYearSession.trim())}
                          >
                            {isPromoting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                            Confirm Promotion to {promotionTarget?.targetSemesterName || '...'}
                          </Button>
                          
                          {/* Display status warning if not eligible, but only if promotionTarget exists */}
                          {promotionTarget && activeEnrollmentStatus !== "Eligible" && (
                              <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Promotion Blocked</AlertTitle>
                                <AlertDescription>
                                        The student's current promotion status is **'{activeEnrollmentStatus}'**. Only students with status 'Eligible' can be promoted.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* --- Tab 2: Transfer --- */}
                <TabsContent value="transfer" className="mt-4 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Transfer Student to New Branch</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      
                      {!selectedStudentDetails.active_enrollment ? (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>Cannot Transfer</AlertTitle>
                          <AlertDescription>This student does not have an active enrollment and cannot be transferred.</AlertDescription>
                        </Alert>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DropdownSelect label="1. New Stream" value={transferStreamId} onChange={handleTransferStreamChange} options={allStreams} placeholder="Select Stream" />
                            <DropdownSelect label="2. New Course" value={transferCourseId} onChange={handleTransferCourseChange} options={transferCourseOptions} placeholder="Select Course" disabled={!transferStreamId} />
                            <DropdownSelect label="3. Target Year" value={transferAcademicYearId} onChange={handleTransferAcademicYearChange} options={transferAcademicYearOptions} placeholder="Select Year" disabled={!transferCourseId} />
                            <DropdownSelect label="4. Target Semester" value={transferSemesterId} onChange={setTransferSemesterId} options={transferSemesterOptions} placeholder="Select Semester" disabled={!transferAcademicYearId} />
                          </div>
                          
                          <div className="space-y-1">
                            <Label htmlFor="transfer-session" className="font-semibold text-red-600">Target Session*</Label>
                            <Input 
                              id="transfer-session"
                              placeholder="E.g., 2025-2026" 
                              value={transferSession} 
                              onChange={(e) => setTransferSession(e.target.value)}
                              required
                            />
                            <p className="text-xs text-gray-500">Required. This is the session for the new academic year/enrollment.</p>
                          </div>
                          
                          <Button 
                            onClick={handleBranchTransfer} 
                            disabled={!transferSemesterId || !transferSession || isTransferring} 
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {isTransferring ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <GitBranch className="h-4 w-4 mr-2" />}
                            Confirm Branch Transfer
                          </Button>
                          <p className="text-sm text-gray-500 mt-2">
                            Transfer Note: This will create a **new active enrollment** in the selected course/semester and mark the student's old enrollment records as 'transferred' / 'inactive'.
                          </p>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* --- Tab 3: History --- */}
                <TabsContent value="history" className="mt-4 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Academic Progression</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedStudentDetails.academic_years.length === 0 && (
                        <p className="text-muted-foreground">No academic history found for this student.</p>
                      )}
                      {selectedStudentDetails.academic_years.map(year => (
                        <div key={year.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-center">
                            <h4 className="text-lg font-semibold flex items-center gap-2">
                              <GraduationCap className="w-5 h-5 text-blue-500" />
                              {year.academic_year_name} ({year.academic_year_session})
                            </h4>
                            <Badge variant={year.status === 'Active' ? 'default' : 'secondary'}>{year.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground font-medium">{year.courses?.name}</p>
                          <Separator className="my-2" />
                          <div className="space-y-2">
                            {year.student_semesters.map(sem => (
                              <div key={sem.id} className="flex justify-between items-center text-sm pl-4">
                                <span className="font-medium">{sem.semesters?.name}</span>
                                <Badge variant={sem.status === 'active' ? 'outline' : 'secondary'} className="capitalize">
                                  {sem.status === 'active' ? <ShieldCheck className="h-3 w-3 mr-1" /> : <ShieldAlert className="h-3 w-3 mr-1" />}
                                  {sem.status}
                                  {sem.status !== 'active' && ` (${sem.promotion_status})`}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

              </Tabs>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}