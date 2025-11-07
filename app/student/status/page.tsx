"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { SupabaseClient } from "@supabase/supabase-js" // Imported SupabaseClient

// --- UI Components ---
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar" // Imported Avatar

// --- Icons ---
import {
  Loader2,
  AlertTriangle,
  Users,
  Search,
  CheckCheck,
  ClipboardEdit,
  UserRound, // Imported UserRound
} from "lucide-react"

// --- PrimeReact Components ---
import { Dropdown } from 'primereact/dropdown';

// --- Type Definitions ---
interface Stream { id: string; name: string; }
interface Course { id: string; name: string; stream_id: string; }
// --- NEW: Added AcademicYear and updated Semester ---
interface AcademicYear { id: string; name: string; course_id: string; }
interface Semester { id: string; name: string; academic_year_id: string; }

// --- UPDATED: Student interface ---
interface Student { 
    id: string; // This will be the student's ID
    fullname: string | null; 
    rollNumber: string;
    promotion_status: string;
    academicYearName: string; // --- NEW ---
    semesterName: string; // --- NEW ---
    photo_path: string | null; // --- NEW ---
}

// --- NEW: Type for Supabase query result ---
type StudentSemesterRow = {
  promotion_status: string; // --- FIXED: roll_number removed ---
  student_academic_years: {
    academic_year_name: string;
  } | null;
  students: {
    id: string;
    fullname: string | null;
    photo_path: string | null;
    roll_number: string; // --- FIXED: roll_number is in here ---
  } | null;
  semesters: {
    name: string;
  } | null;
};

// --- Helper Functions ---
const sortByName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, undefined, { numeric: true });

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

// --- UPDATED: Status options ---
const promotionStatusOptions = [
  { label: 'Set to: Eligible', value: 'Eligible' },
  { label: 'Set to: Hold (Not Promotable)', value: 'Hold' },
  { label: 'Set to: Promoted (Manual)', value: 'Promoted' },
  { label: 'Set to: Drop', value: 'Drop' },
  { label: 'Set to: Completed', value: 'Completed' },
  { label: 'Set to: Leave', value: 'Leave' },
];

// --- Main Status Management Page ---
export default function StudentStatusPage() {
  const supabase = getSupabaseClient();
  
  // --- Data State ---
  const [allStreams, setAllStreams] = useState<Stream[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [allAcademicYears, setAllAcademicYears] = useState<AcademicYear[]>([]); // --- NEW ---
  const [allSemesters, setAllSemesters] = useState<Semester[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  // --- Filter Selections ---
  const [selectedStream, setSelectedStream] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string | null>(null); // --- NEW ---
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
  
  // --- Student List & Action State ---
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [newStatus, setNewStatus] = useState<string | null>(null);

  // --- Loading & Error State ---
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // --- UPDATED: Derived Filters (4-level cascade) ---
  const courseOptions = useMemo(() => 
    allCourses.filter(c => c.stream_id === selectedStream).sort(sortByName), 
    [allCourses, selectedStream]
  );
  const academicYearOptions = useMemo(() => 
    allAcademicYears.filter(ay => ay.course_id === selectedCourse).sort(sortByName), 
    [allAcademicYears, selectedCourse]
  );
  const semesterOptions = useMemo(() => 
    allSemesters.filter(s => s.academic_year_id === selectedAcademicYear).sort(sortByName), 
    [allSemesters, selectedAcademicYear]
  );

  // --- Data Fetching: Students (UPDATED) ---
  const fetchStudents = useCallback(async () => {
    // We now only need selectedSemester, as it's unique
    if (!selectedSemester) {
      setStudents([]);
      return;
    }
    setLoading(true);
    setStatusMessage(null);
    try {
      // Query 'student_semesters' and join related tables
      // --- FIXED: Removed roll_number from here ---
      const { data, error } = await supabase
        .from("student_semesters")
        .select(`
          promotion_status,
          students (id, fullname, photo_path, roll_number), 
          student_academic_years ( academic_year_name ),
          semesters ( name )
        `)
        .eq("semester_id", selectedSemester)
        .order("students(fullname)");
      
      if (error) throw error;

      // Transform the nested data
      const formattedStudents = (data as StudentSemesterRow[])
        .map((item: StudentSemesterRow) => {
          // --- FIXED: Check for item.students.roll_number ---
          if (!item.students || !item.student_academic_years || !item.semesters) return null; 
          return {
            id: item.students.id,
            fullname: item.students.fullname,
            rollNumber: item.students.roll_number, // --- FIXED: Get from students ---
            promotion_status: item.promotion_status,
            academicYearName: item.student_academic_years.academic_year_name,
            semesterName: item.semesters.name,
            photo_path: item.students.photo_path,
          }
        })
        .filter((student: Student | null): student is Student => student !== null); 
      
      setStudents(formattedStudents || []);
      setSelectedStudentIds([]);
    } catch (err: any) {
      setStatusMessage({ type: 'error', message: `Student Load Error: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }, [selectedSemester, supabase]);
  

  // --- Initial Config & Student Fetch ---
  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      try {
        const [streamsRes, coursesRes, ayRes, semestersRes] = await Promise.all([
          supabase.from("streams").select("id, name").order("name"),
          supabase.from("courses").select("id, name, stream_id").order("name"),
          supabase.from("academic_years").select("id, name, course_id").order("name"), // --- NEW ---
          supabase.from("semesters").select("id, name, academic_year_id").order("name"), // --- UPDATED ---
        ]);
        
        if (streamsRes.data) setAllStreams(streamsRes.data);
        if (coursesRes.data) setAllCourses(coursesRes.data);
        if (ayRes.data) setAllAcademicYears(ayRes.data); // --- NEW ---
        if (semestersRes.data) setAllSemesters(semestersRes.data);
      } catch (err: any) {
        setStatusMessage({ type: 'error', message: `Config Error: ${err.message}` });
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [supabase]);

  // Re-fetch students when filters change
  useEffect(() => {
    if (selectedSemester) {
      fetchStudents();
    } else {
      setStudents([]);
    }
  }, [fetchStudents, selectedSemester]);


  // --- Bulk Status Update Logic (Unchanged, still correct) ---
  const handleBulkStatusUpdate = async () => {
    if (!newStatus) {
      setStatusMessage({ type: 'error', message: 'Please select a new status to apply.' });
      return;
    }
    if (selectedStudentIds.length === 0) {
      setStatusMessage({ type: 'error', message: 'Please select at least one student.' });
      return;
    }
    if (!selectedSemester) {
       setStatusMessage({ type: 'error', message: 'A semester must be selected.' });
       return;
    }

    setIsUpdating(true);
    setStatusMessage(null);

    try {
      const { error } = await supabase
        .from("student_semesters")
        .update({ promotion_status: newStatus })
        .in("student_id", selectedStudentIds)
        .eq("semester_id", selectedSemester);

      if (error) throw error;

      await fetchStudents();
      setStatusMessage({ type: 'success', message: `${selectedStudentIds.length} students updated to "${newStatus}" successfully!` });
      setNewStatus(null);
      setSelectedStudentIds([]);
      
    } catch (err: any) {
      setStatusMessage({ type: 'error', message: `Update Failed: ${err.message}` });
    } finally {
      setIsUpdating(false);
    }
  };


  // --- Student Selection Handlers ---
  const handleStudentToggle = (studentId: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };
  
  // Search Logic
  const filteredStudents = useMemo(() => {
    if (!students.length) return [];
    if (!studentSearch) return students;
    const query = studentSearch.toLowerCase();
    return students.filter(student => 
      student.fullname?.toLowerCase().includes(query) ||
      student.rollNumber?.toLowerCase().includes(query)
    );
  }, [students, studentSearch]);

  const handleSelectAll = () => {
    const filteredIds = filteredStudents.map(s => s.id);
    if (selectedStudentIds.length === filteredIds.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredIds);
    }
  };
  
  const allFilteredSelected = useMemo(() => {
    const filteredIds = filteredStudents.map(s => s.id);
    return filteredIds.length > 0 && 
           filteredIds.every(id => selectedStudentIds.includes(id));
  }, [filteredStudents, selectedStudentIds]);

  // --- Render ---
  return (
    <div className="p-4 md:p-8 space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-blue-700">Student Status Management</CardTitle>
          <CardDescription>Manually update the promotion status for one or more students.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && !students.length && <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />}

          {statusMessage && (
            <Alert variant={statusMessage.type === 'error' ? 'destructive' : 'default'} className={`mb-4 ${statusMessage.type === 'success' ? 'bg-green-100 border-green-400 text-green-800' : ''}`}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{statusMessage.type === 'error' ? 'Operation Failed' : 'Success!'}</AlertTitle>
              <AlertDescription>{statusMessage.message}</AlertDescription>
            </Alert>
          )}
          
          {/* --- UPDATED: 4-Level Filter --- */}
          <h3 className="text-xl font-semibold mb-4 border-b pb-2">Filter Students</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <DropdownSelect label="1. Stream" value={selectedStream} onChange={(id) => { setSelectedStream(id); setSelectedCourse(null); setSelectedAcademicYear(null); setSelectedSemester(null); }} options={allStreams} placeholder="Select Stream" />
            <DropdownSelect label="2. Course" value={selectedCourse} onChange={(id) => { setSelectedCourse(id); setSelectedAcademicYear(null); setSelectedSemester(null); }} options={courseOptions} placeholder="Select Course" disabled={!selectedStream} />
            <DropdownSelect label="3. Academic Year" value={selectedAcademicYear} onChange={(id) => { setSelectedAcademicYear(id); setSelectedSemester(null); }} options={academicYearOptions} placeholder="Select Year" disabled={!selectedCourse} />
            <DropdownSelect label="4. Semester" value={selectedSemester} onChange={setSelectedSemester} options={semesterOptions} placeholder="Select Semester" disabled={!selectedAcademicYear} />
          </div>

          {/* --- Student List --- */}
          {selectedSemester && (
            <div className="mt-8 border-t pt-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Student List ({students.length})
              </h3>
              
              <div className="flex flex-col md:flex-row gap-4 justify-between mb-4">
                <div className="relative flex-1 min-w-[300px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name or roll number..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button variant="outline" onClick={handleSelectAll}>
                  {allFilteredSelected ? 'Deselect All Filtered' : 'Select All Filtered'}
                </Button>
              </div>

              {/* --- UPDATED: Student Grid --- */}
              <div className="max-h-96 overflow-y-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Select</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Enrollment</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading && (
                      <tr>
                        <td colSpan={4} className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                        </td>
                      </tr>
                    )}
                    {!loading && filteredStudents.map((student) => (
                      <tr key={student.id} className={selectedStudentIds.includes(student.id) ? 'bg-blue-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(student.id)}
                            onChange={() => handleStudentToggle(student.id)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-3">
                            <StudentAvatar src={student.photo_path} alt={student.fullname} supabase={supabase} />
                            <div>
                              <div className="font-medium">{student.fullname}</div>
                              <div className="text-xs text-muted-foreground">Roll: {student.rollNumber}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                           <div>
                            <div className="font-medium">{student.academicYearName}</div>
                            <div className="text-xs text-muted-foreground">{student.semesterName}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={
                            student.promotion_status === 'Eligible' ? 'default' :
                            student.promotion_status === 'Promoted' ? 'outline' : 'secondary'
                          }>
                            {student.promotion_status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!loading && filteredStudents.length === 0 && <p className="text-center py-4 text-gray-500">No students found matching your filters/search.</p>}
            </div>
          )}
          
          {/* --- Action Panel --- */}
          {selectedStudentIds.length > 0 && (
            <div className="mt-8 border-t pt-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <ClipboardEdit className="w-5 h-5" />
                Update Status for {selectedStudentIds.length} Student(s)
              </h3>
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full md:w-auto">
                  <Label className="font-semibold">Set New Status</Label>
                  <Dropdown
                    value={newStatus}
                    options={promotionStatusOptions} // --- UPDATED ---
                    onChange={(e) => setNewStatus(e.value)}
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select new status..."
                    className="w-full" // --- FIXED: Removed problematic class ---
                  />
                </div>
                <Button 
                  onClick={handleBulkStatusUpdate} 
                  disabled={!newStatus || isUpdating} 
                  className="w-full md:w-auto"
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCheck className="h-4 w-4 mr-2" />}
                  Apply Status Update
                </Button>
              </div>
            </div>
          )}

        </CardContent>
      </Card>
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
      options={options.map(opt => ({ label: opt.name, value: opt.id }))}
      onChange={(e) => onChange(e.value)}
      optionLabel="name"
      optionValue="id"
      placeholder={placeholder}
      className="w-full" // --- FIXED: Removed problematic class ---
      filter
      disabled={disabled}
    />
  </div>
);