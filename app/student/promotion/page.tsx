"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { SupabaseClient } from "@supabase/supabase-js"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  ColumnFiltersState,
  SortingState,
  getSortedRowModel,
} from "@tanstack/react-table"

// --- ShadCN UI Components ---
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
  Send,
  GitBranch,
  Search,
  UserRound,
  GraduationCap,
  History,
  ChevronsRight,
  ShieldCheck,
  ShieldAlert,
  Users,
  XCircle,
  ArrowUpDown,
} from "lucide-react"

// --- PrimeReact Components ---
import { Dropdown } from 'primereact/dropdown';

// --- Type Definitions ---
interface Stream { id: string; name: string; }
interface Course { id: string; name: string; stream_id: string; }
interface AcademicYear { id: string; name: string; course_id: string; }
interface Semester { id: string; name: string; academic_year_id: string; }

// --- UPDATED: Student for main list (from fees page) ---
interface StudentList { 
    enrollment_id: string;      // student_semesters.id
    student_id: string;         // students.id
    academic_year_id: string; // student_academic_years.id
    fullname: string | null;
    email: string | null;
    roll_number: string | null;
    photo_path: string | null;
    course_name: string;
    academic_year_name: string;
    academic_year_session: string;
    semester_name: string;
    status: string;             // from student_semesters
    promotion_status: string;   // from student_semesters
}

// --- Detailed student type for modal ---
interface StudentDetails {
  id: string;
  fullname: string | null;
  photo_path: string | null;
  roll_number: string | null; // --- ADDED ---
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

// --- Main Promotion Page ---
export default function PromotionPage() {
  const supabase = getSupabaseClient();
  
  // --- Data State ---
  const [allStreams, setAllStreams] = useState<Stream[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [allAcademicYears, setAllAcademicYears] = useState<AcademicYear[]>([]);
  const [allSemesters, setAllSemesters] = useState<Semester[]>([]);
  
  // --- Main List State ---
  const [students, setStudents] = useState<StudentList[]>([]); // --- UPDATED ---
  const [studentSearch, setStudentSearch] = useState("");
  const [rollNumberSearch, setRollNumberSearch] = useState("");
  const [loading, setLoading] = useState(false); // Don't load by default
  const [loadingFilters, setLoadingFilters] = useState(true);

  // --- Modal State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
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

  // --- Status State ---
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [modalStatusMessage, setModalStatusMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- Filter States ---
  const [selectedStream, setSelectedStream] = useState<string | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string | null>(null); 
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null)

  // --- Table State ---
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [sorting, setSorting] = useState<SortingState>([
    { id: "fullname", desc: false },
  ])

  // --- Derived Filters for Search ---
  const streamOptions = useMemo(() => 
    allStreams.sort(robustSortByName), 
    [allStreams]
  );
  
  const courseOptions = useMemo(() => {
    if (!selectedStream) return []
    return allCourses
      .filter(c => c.stream_id === selectedStream)
      .sort(robustSortByName)
  }, [allCourses, selectedStream])

  const academicYearOptions = useMemo(() => {
    if (!selectedCourse) return [];
    return allAcademicYears
      .filter(ay => ay.course_id === selectedCourse)
      .sort(robustSortByName);
  }, [allAcademicYears, selectedCourse]);

  const semesterOptions = useMemo(() => {
    if (!selectedAcademicYear) return [];
    return allSemesters
      .filter(s => s.academic_year_id === selectedAcademicYear)
      .sort(robustSortByName);
  }, [allSemesters, selectedAcademicYear]);


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

  // --- Logic to find the next semester/year (for modal) ---
  const findPromotionTarget = (activeEnrollment: StudentDetails['active_enrollment']) => {
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

    const academicYearsInCourse = allAcademicYears
      .filter(ay => ay.course_id === activeEnrollment.course_id)
      .sort(robustSortByName);
      
    const currentYearIndex = academicYearsInCourse.findIndex(ay => ay.id === sourceAcademicYear.id);

    if (currentYearIndex < academicYearsInCourse.length - 1) {
      const targetAcademicYear = academicYearsInCourse[currentYearIndex + 1];
      
      const targetSemester = allSemesters
        .filter(s => s.academic_year_id === targetAcademicYear.id)
        .sort(robustSortByName)[0];

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
  };


  // --- Data Fetching: Main Student List ---
  const fetchStudents = useCallback(async (nameQuery: string, rollQuery: string) => {
    if (!nameQuery && !rollQuery && !selectedSemester && !selectedAcademicYear && !selectedCourse && !selectedStream) {
      setStatusMessage({ type: 'error', message: 'Please enter a search term or apply a filter to find students.' });
      setStudents([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setStatusMessage(null);
    setError(null);
    
    try {
      let query = supabase
        .from("student_semesters")
        .select(
          `
          id, 
          status,
          promotion_status,
          student_academic_year_id,
          student:students (
            id,
            fullname,
            email,
            photo_path,
            roll_number
          ),
          semester:semesters ( name ),
          academic_year:student_academic_years (
            id,
            academic_year_name,
            academic_year_session,
            course_id,
            course:courses ( 
              stream_id 
            )
          )
          `
        )
        .eq('status', 'active');

      // --- NEW Filter Logic ---
      
      if (selectedSemester) {
        query = query.eq("semester_id", selectedSemester);
      } 
      else if (selectedAcademicYear) {
        const yearName = allAcademicYears.find(ay => ay.id === selectedAcademicYear)?.name;
        if (yearName) {
            const { data: ayIds, error } = await supabase
              .from("student_academic_years")
              .select("id")
              .eq("academic_year_name", yearName)
              .eq("course_id", selectedCourse); // Needs course context
            if (error) throw error;
            
            const matchingIds = ayIds.map((ay: { id: string }) => ay.id);
            if (matchingIds.length === 0) {
              query = query.eq("student_academic_year_id", 0);
            } else {
              query = query.in("student_academic_year_id", matchingIds);
            }
        } else {
          query = query.eq("student_academic_year_id", 0);
        }
      }
      else if (selectedCourse) {
          query = query.eq('academic_year:student_academic_years.course_id', selectedCourse);
      }
      else if (selectedStream) {
          query = query.eq('academic_year:student_academic_years.course:courses.stream_id', selectedStream);
      }

      if (nameQuery) {
        query = query.ilike('student:students.fullname', `%${nameQuery}%`);
      }
      if (rollQuery) {
        query = query.ilike('student:students.roll_number', `%${rollQuery}%`);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      
      if (data) {
        const flattenedData: StudentList[] = data.map((item: any) => {
          if (!item.student || !item.academic_year || !item.semester) return null; 
          
          return {
            enrollment_id: item.id,
            student_id: item.student.id,
            academic_year_id: item.student_academic_year_id,
            fullname: item.student.fullname,
            email: item.student.email,
            roll_number: item.student.roll_number,
            photo_path: item.student.photo_path,
            course_name: item.academic_year?.course?.name || "N/A",
            academic_year_name: item.academic_year?.academic_year_name || "N/A",
            academic_year_session: item.academic_year?.academic_year_session || "N/A",
            semester_name: item.semester?.name || "N/A",
            status: item.status,
            promotion_status: item.promotion_status,
          }
        }).filter((s): s is StudentList => s !== null);

        setStudents(flattenedData);
        if (flattenedData.length === 0) {
          setStatusMessage({ type: 'error', message: 'No students found matching your criteria.' });
        }
      }
    } catch (err: any) {
      console.error("Error fetching students:", err)
      setStatusMessage({ type: 'error', message: `Student Load Error: ${err.message}` });
    } finally {
      setLoading(false)
    }
  }, [supabase, selectedStream, selectedCourse, selectedAcademicYear, selectedSemester, allAcademicYears]);
  
  // --- Initial Config Fetch (Streams, Courses, etc.) ---
  useEffect(() => {
    const fetchConfig = async () => {
      setLoadingFilters(true);
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
        setStatusMessage({ type: 'error', message: `Config Error: ${err.message}` });
      } finally {
        setLoadingFilters(false);
        setLoading(false);
      }
    };
    fetchConfig();
  }, [supabase]);


  // --- NEW: Button click handlers ---
  const handleSearchClick = () => {
    fetchStudents(studentSearch, rollNumberSearch);
  }

  const handleClearClick = () => {
    setStudentSearch("");
    setRollNumberSearch("");
    setSelectedStream(null);
    setSelectedCourse(null);
    setSelectedAcademicYear(null);
    setSelectedSemester(null);
    setStudents([]);
    setLoading(false);
    setStatusMessage(null);
  }

  // --- Filter Handlers ---
  const handleStreamChange = (value: string | null) => {
    setSelectedStream(value);
    setSelectedCourse(null);
    setSelectedAcademicYear(null);
    setSelectedSemester(null);
  };

  const handleCourseChange = (value: string | null) => {
    setSelectedCourse(value);
    setSelectedAcademicYear(null);
    setSelectedSemester(null);
  };

  const handleAcademicYearChange = (value: string | null) => {
    setSelectedAcademicYear(value);
    setSelectedSemester(null);
  };

  const handleSemesterChange = (value: string | null) => {
    setSelectedSemester(value);
  };


  // --- NEW: Open Modal and Fetch Details ---
  const openStudentModal = useCallback(async (studentId: string) => {
    setIsModalOpen(true);
    setModalLoading(true);
    setModalStatusMessage(null);
    setSelectedStudentDetails(null);
    setPromotionTarget(null);
    
    try {
      // 1. Fetch Student's base data
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("id, fullname, photo_path, roll_number")
        .eq("id", studentId)
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
        .eq("student_id", studentId)
        .order("academic_year_name", { ascending: true, nullsFirst: false });
        
      if (yearsError) throw yearsError;
      
      const academic_years = (academicYearsData as StudentAcademicYearWithSemesters[]).map(year => ({
        ...year,
        student_semesters: year.student_semesters.sort((a, b) => robustSortByName(a.semesters!, b.semesters!))
      })).sort((a, b) => robustSortByName(
        { name: a.academic_year_name }, 
        { name: b.academic_year_name }
      ));

      // 3. Find the *one* active enrollment to determine promotion target
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
      setSelectedStudentDetails({ ...studentData, academic_years, active_enrollment });
      findPromotionTarget(active_enrollment);
      
    } catch (err: any) {
      setModalStatusMessage({ type: 'error', message: `Failed to load student details: ${err.message}` });
    } finally {
      setModalLoading(false);
    }
  }, [supabase, allAcademicYears, allSemesters]);


  // --- Promotion Logic (for Modal) ---
  const handlePromotion = async () => {
    if (!promotionTarget || !selectedStudentDetails || !selectedStudentDetails.active_enrollment) {
      setModalStatusMessage({ type: 'error', message: 'No student or promotion target selected.' });
      return;
    }
    
    const { active_enrollment } = selectedStudentDetails;

    if (promotionTarget.isNewYear && !targetAcademicYearSession.trim()) {
      setModalStatusMessage({ type: 'error', message: 'Please enter a "Target Session" (e.g., 2025-2026) for the new academic year.' });
      return;
    }

    setIsPromoting(true); 
    setModalStatusMessage(null);

    try {
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
            promotion_status: 'Eligible'
        };

        const { error: insertError } = await supabase
          .from("student_semesters")
          .insert(newSemesterEnrollment);
          
        if (insertError) throw new Error(`Semester Insert Error: ${insertError.message}`);

        await supabase
          .from("student_academic_years")
          .update({ status: 'Inactive' })
          .eq('id', active_enrollment.student_academic_year_id);
      }

      const { error: updateError } = await supabase
        .from("student_semesters")
        .update({ status: 'inactive', promotion_status: 'Promoted' })
        .eq('student_id', active_enrollment.student_id)
        .eq('semester_id', active_enrollment.semester_id);

      if (updateError) throw new Error(`Old Semester Update Error: ${updateError.message}`);

      setModalStatusMessage({ type: 'success', message: `Student promoted to ${promotionTarget.targetSemesterName} successfully!` });
      setTargetAcademicYearSession("");
      
      await openStudentModal(active_enrollment.student_id);
      // Refresh the main list as well
      await fetchStudents(studentSearch, rollNumberSearch);

    } catch (err: any) {
      setModalStatusMessage({ type: 'error', message: `Promotion Failed: ${err.message}` });
    } finally {
      setIsPromoting(false);
    }
  };


  // --- Branch Transfer Logic (for Modal) ---
  const handleBranchTransfer = async () => {
    if (!selectedStudentDetails || !selectedStudentDetails.active_enrollment || !transferCourseId || !transferSemesterId) {
      setModalStatusMessage({ type: 'error', message: 'Please select a new course, year, semester, and session.' });
      return;
    }
    if (!transferSession.trim()) {
      setModalStatusMessage({ type: 'error', message: 'A Target Session (e.g., 2025-2026) is required.' });
      return;
    }

    const { active_enrollment } = selectedStudentDetails;
    
    if (transferCourseId === active_enrollment.course_id) {
       setModalStatusMessage({ type: 'error', message: 'Cannot transfer to the same course.' });
       return;
    }

    setIsTransferring(true);
    setModalStatusMessage(null);
    
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
      
      const { error: updateSemError } = await supabase
        .from("student_semesters")
        .update({ status: 'transferred', promotion_status: 'Hold' })
        .eq('student_id', active_enrollment.student_id)
        .eq('semester_id', active_enrollment.semester_id);

      if (updateSemError) throw new Error(`Old Semester Update Error: ${updateSemError.message}`);
      
      const { error: updateYearError } = await supabase
        .from("student_academic_years")
        .update({ status: 'transferred' })
        .eq('id', active_enrollment.student_academic_year_id);
        
      if (updateYearError) throw new Error(`Old Year Update Error: ${updateYearError.message}`);

      setModalStatusMessage({ type: 'success', message: `Student transferred to ${newCourse} (${newSemester}) successfully!` });
      
      setTransferStreamId(null);
      setTransferCourseId(null);
      setTransferAcademicYearId(null);
      setTransferSemesterId(null);
      setTransferSession("");
      
      await openStudentModal(active_enrollment.student_id);
      await fetchStudents(studentSearch, rollNumberSearch);

    } catch (err: any) {
      setModalStatusMessage({ type: 'error', message: `Transfer Failed: ${err.message}` });
    } finally {
      setIsTransferring(false);
    }
  };


  // --- Table Columns ---
  const columns: ColumnDef<StudentList>[] = [
    {
      accessorKey: "fullname",
      header: "Student",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <StudentAvatar src={row.original.photo_path} alt={row.original.fullname} supabase={supabase} />
          <div className="font-medium">{row.original.fullname}</div>
        </div>
      ),
    },
    {
      accessorKey: "roll_number",
      header: "Roll No.",
    },
    {
      accessorKey: "course_name",
      header: "Course",
    },
    {
      accessorKey: "academic_year_name",
      header: "Current Year",
      cell: ({ row }) => row.original.academic_year_name,
    },
    {
      accessorKey: "semester_name",
      header: "Current Semester",
      cell: ({ row }) => row.original.semester_name,
    },
    {
      accessorKey: "promotion_status",
      header: "Promotion Status",
      cell: ({ row }) => (
        <Badge variant={row.original.promotion_status === 'Eligible' ? 'default' : 'secondary'} className="capitalize">
          {row.original.promotion_status}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="text-right">
          <Button variant="outline" size="sm" onClick={() => openStudentModal(row.original.student_id)}>
            Manage
            <ChevronsRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      ),
    },
  ];

  // --- Table Instance ---
  const table = useReactTable({
    data: students,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  // --- Render ---
  return (
    <div className="p-4 md:p-8 space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-blue-700">Student Promotion & Transfer</CardTitle>
          <CardDescription>Search for a student or filter by enrollment to manage academic progression.</CardDescription>
        </CardHeader>
        <CardContent>
          {statusMessage && (
            <Alert variant={statusMessage.type === 'error' ? 'destructive' : 'default'} className={`mb-4 ${statusMessage.type === 'success' ? 'bg-green-100 border-green-400 text-green-800' : ''}`}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{statusMessage.type === 'error' ? 'Error' : 'Success!'}</AlertTitle>
              <AlertDescription>{statusMessage.message}</AlertDescription>
            </Alert>
          )}

          {/* --- UPDATED: Search and Filter Section --- */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <DropdownSelect
                label="Filter by Stream"
                options={streamOptions}
                value={selectedStream}
                onChange={(v) => { setSelectedStream(v); setSelectedCourse(null); setSelectedAcademicYear(null); setSelectedSemester(null); }}
                placeholder="All Streams..."
                disabled={loadingFilters}
              />
              <DropdownSelect
                label="Filter by Course"
                options={courseOptions}
                value={selectedCourse}
                onChange={(v) => { setSelectedCourse(v); setSelectedAcademicYear(null); setSelectedSemester(null); }}
                placeholder="All Courses..."
                disabled={loadingFilters || !selectedStream}
              />
              <DropdownSelect
                label="Filter by Year"
                options={academicYearOptions}
                value={selectedAcademicYear}
                onChange={(v) => { setSelectedAcademicYear(v); setSelectedSemester(null); }}
                placeholder="All Years..."
                disabled={loadingFilters || !selectedCourse}
              />
              <DropdownSelect
                label="Filter by Semester"
                options={semesterOptions}
                value={selectedSemester}
                onChange={setSelectedSemester}
                placeholder="All Semesters..."
                disabled={loadingFilters || !selectedAcademicYear}
              />
            </div>
            <div className="flex flex-col md:flex-row gap-4 justify-between pt-2">
              <div className="relative w-full md:max-w-xs">
                <Label htmlFor="name-search">Search by Name</Label>
                <Input
                  id="name-search"
                  placeholder="Search by student name..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                />
              </div>
              <div className="relative w-full md:max-w-xs">
                <Label htmlFor="roll-search">Search by Roll No.</Label>
                <Input
                  id="roll-search"
                  placeholder="Search by Roll No..."
                  value={rollNumberSearch}
                  onChange={(e) => setRollNumberSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-2 justify-end items-end">
                <Button variant="outline" onClick={handleClearClick} disabled={loading}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Clear
                </Button>
                <Button onClick={handleSearchClick} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                  Search
                </Button>
              </div>
            </div>
          </div>
          
          <div className="mt-6 border-t pt-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Student List
            </h3>
            <div className="max-h-96 overflow-y-auto border rounded-lg">
              <Table>
                <TableHeader className="bg-gray-50 sticky top-0 z-10">
                  {table.getHeaderGroups().map(headerGroup => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading && table.getRowModel().rows.length > 0 && (
                    table.getRowModel().rows.map(row => (
                      <TableRow key={row.original.student_id}> {/* --- UPDATED: Use student_id as key --- */}
                        {row.getVisibleCells().map(cell => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                  {!loading && table.getRowModel().rows.length === 0 && (
                     <TableRow>
                      <TableCell colSpan={columns.length} className="text-center py-8 text-gray-500">
                        No students found. Please use the filters or search to find a student.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* --- NEW: Student Details Modal --- */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader className="pr-6">
            {modalLoading && (
              <DialogTitle className="text-2xl font-bold">Loading Student Details...</DialogTitle>
            )}
            {selectedStudentDetails && (
              <div className="flex items-start gap-4">
                <StudentAvatar src={selectedStudentDetails.photo_path} alt={selectedStudentDetails.fullname} supabase={supabase} className="h-20 w-20" />
                <div>
                  <DialogTitle className="text-2xl font-bold">{selectedStudentDetails.fullname}</DialogTitle>
                  <DialogDescription className="text-base">
                    {selectedStudentDetails.active_enrollment ? (
                      <>
                        {selectedStudentDetails.active_enrollment.academic_year_name} - {selectedStudentDetails.active_enrollment.semester_name}
                        <Badge className="ml-2">Active</Badge>
                      </>
                    ) : (
                      <Badge variant="destructive">Inactive</Badge>
                    )}
                  </DialogDescription>
                </div>
              </div>
            )}
          </DialogHeader>

          {modalLoading && (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}

          {!modalLoading && selectedStudentDetails && (
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <Tabs defaultValue="history">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="history"><History className="w-4 h-4 mr-2" />Academic History</TabsTrigger>
                  <TabsTrigger value="promote"><Send className="w-4 h-4 mr-2" />Promote Student</TabsTrigger>
                  <TabsTrigger value="transfer"><GitBranch className="w-4 h-4 mr-2" />Branch Transfer</TabsTrigger>
                </TabsList>
                
                {/* --- Tab 1: History --- */}
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
                            <h4 className="text-lg font-semibold">{year.academic_year_name} ({year.academic_year_session})</h4>
                            <Badge variant={year.status === 'Active' ? 'default' : 'secondary'}>{year.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{year.courses?.name}</p>
                          <Separator className="my-2" />
                          <div className="space-y-2">
                            {year.student_semesters.map(sem => (
                              <div key={sem.id} className="flex justify-between items-center text-sm pl-4">
                                <span className="font-medium">{sem.semesters?.name}</span>
                                <Badge variant={sem.status === 'active' ? 'outline' : 'secondary'} className="capitalize">
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
                
                {/* --- Tab 2: Promotion --- */}
                <TabsContent value="promote" className="mt-4 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Promote Student</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {modalStatusMessage && (
                        <Alert variant={modalStatusMessage.type === 'error' ? 'destructive' : 'default'} className={`${modalStatusMessage.type === 'success' ? 'bg-green-100 border-green-400 text-green-800' : ''}`}>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>{modalStatusMessage.type === 'error' ? 'Operation Failed' : 'Success!'}</AlertTitle>
                          <AlertDescription>{modalStatusMessage.message}</AlertDescription>
                        </Alert>
                      )}

                      {!selectedStudentDetails.active_enrollment && (
                          <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>Cannot Promote</AlertTitle>
                          <AlertDescription>This student does not have an active enrollment and cannot be promoted.</AlertDescription>
                        </Alert>
                      )}
                      
                      {selectedStudentDetails.active_enrollment && (
                        <>
                          <div className="grid grid-cols-2 gap-4 items-center">
                            <div>
                              <Label>Current Enrollment</Label>
                              <p className="text-lg font-semibold">{selectedStudentDetails.active_enrollment.academic_year_name}</p>
                              <p className="text-sm text-muted-foreground">{selectedStudentDetails.active_enrollment.semester_name}</p>
                            </div>
                            <ChevronsRight className="w-8 h-8 text-muted-foreground mx-auto" />
                            <div>
                              <Label>Promotion Target</Label>
                              {promotionTarget ? (
                                <>
                                  <p className="text-lg font-semibold text-green-600">{promotionTarget.targetAcademicYearName}</p>
                                  <p className="text-sm text-muted-foreground">{promotionTarget.targetSemesterName}</p>
                                </>
                              ) : (
                                <p className="text-lg font-semibold text-red-600">End of Course</p>
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
                              <p className="text-xs text-gray-500">Required. This is the session for the new academic year.</p>
                            </div>
                          )}
                          
                          <Button onClick={handlePromotion} disabled={!promotionTarget || isPromoting}>
                            {isPromoting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                            Promote to {promotionTarget?.targetSemesterName || '...'}
                          </Button>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* --- Tab 3: Transfer --- */}
                <TabsContent value="transfer" className="mt-4 space-y-4">
                    <Card>
                    <CardHeader>
                      <CardTitle>Transfer Student to New Branch</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {modalStatusMessage && (
                        <Alert variant={modalStatusMessage.type === 'error' ? 'destructive' : 'default'} className={`${modalStatusMessage.type === 'success' ? 'bg-green-100 border-green-400 text-green-800' : ''}`}>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>{modalStatusMessage.type === 'error' ? 'Operation Failed' : 'Success!'}</AlertTitle>
                          <AlertDescription>{modalStatusMessage.message}</AlertDescription>
                        </Alert>
                      )}
                      
                      {!selectedStudentDetails.active_enrollment && (
                          <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>Cannot Transfer</AlertTitle>
                          <AlertDescription>This student does not have an active enrollment and cannot be transferred.</AlertDescription>
                        </Alert>
                      )}
                      
                      {selectedStudentDetails.active_enrollment && (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DropdownSelect label="1. New Stream" value={transferStreamId} onChange={(v) => { setTransferStreamId(v); setTransferCourseId(null); setTransferAcademicYearId(null); setTransferSemesterId(null); }} options={allStreams} placeholder="Select Stream" />
                            <DropdownSelect label="2. New Course" value={transferCourseId} onChange={(v) => { setTransferCourseId(v); setTransferAcademicYearId(null); setTransferSemesterId(null); }} options={transferCourseOptions} placeholder="Select Course" disabled={!transferStreamId} />
                            <DropdownSelect label="3. Target Year" value={transferAcademicYearId} onChange={(v) => { setTransferAcademicYearId(v); setTransferSemesterId(null); }} options={transferAcademicYearOptions} placeholder="Select Year" disabled={!transferCourseId} />
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
                          </div>
                          
                          <Button onClick={handleBranchTransfer} disabled={!transferSemesterId || !transferSession || isTransferring} className="bg-red-600 hover:bg-red-700">
                            {isTransferring ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <GitBranch className="h-4 w-4 mr-2" />}
                            Confirm Branch Transfer
                          </Button>
                          <p className="text-sm text-gray-500 mt-2">
                            Transfer Note: This will create a new academic year and semester record for the student in the new branch and deactivate their old records.
                          </p>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
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