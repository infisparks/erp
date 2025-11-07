"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"

// --- UI Components ---
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

// --- Icons ---
import {
  ChevronRight,
  Loader2,
  AlertTriangle,
  Send,
  ArrowRightCircle,
  Users,
  Briefcase,
  GitBranch,
  Search,
  ArrowLeftCircle,
} from "lucide-react"

// --- PrimeReact Components ---
import { Dropdown } from 'primereact/dropdown';

// --- Type Definitions ---
interface Stream { id: string; name: string; }
interface Course { id: string; name: string; stream_id: string; }
interface Semester { id: string; name: string; course_id: string; }

// --- UPDATED: Student interface for this page ---
interface Student { 
    id: string; // The student's main ID
    fullname: string | null; 
    rollNumber: string; // From student_semesters
    promotion_status: string; // From student_semesters
    branch_history: any[]; // From students table
}

// --- NEW: Type for Supabase query result ---
type StudentSemesterRow = {
  roll_number: string;
  promotion_status: string;
  students: {
    id: string;
    fullname: string | null;
    branch_history: any[];
  } | null; // The join might return null
};


// --- Helper Functions ---
const getSemNumber = (semName: string): number => {
    return parseInt(semName.match(/\d+/)?.[0] || '0');
};

const findSemesterId = (semesters: Semester[], courseId: string, semName: string): string | undefined => {
    return semesters.find(s => s.course_id === courseId && s.name === semName)?.id;
};

// --- Main Promotion Page ---
export default function PromotionPage() {
  const supabase = getSupabaseClient();
  
  // --- Data State ---
  const [allStreams, setAllStreams] = useState<Stream[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [allSemesters, setAllSemesters] = useState<Semester[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  // --- Filter Selections ---
  const [sourceStreamId, setSourceStreamId] = useState<string | null>(null);
  const [sourceCourseId, setSourceCourseId] = useState<string | null>(null);
  const [sourceSemesterId, setSourceSemesterId] = useState<string | null>(null);
  
  // --- Student List & Promotion State ---
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState("");

  // --- Branch Transfer State ---
  const [newCourseId, setNewCourseId] = useState<string | null>(null);
  const [transferNotes, setTransferNotes] = useState('');


  // --- Loading & Error State ---
  const [loading, setLoading] = useState(true);
  const [isPromoting, setIsPromoting] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // --- Derived Filters ---
  const courseOptions = useMemo(() => allCourses.filter(c => c.stream_id === sourceStreamId), [allCourses, sourceStreamId]);
  const sourceSemesterOptions = useMemo(() => allSemesters.filter(s => s.course_id === sourceCourseId), [allSemesters, sourceCourseId]);
  
  const destinationSemesterOptions = useMemo(() => {
    if (!sourceSemesterId) return [];
    const sourceSem = allSemesters.find(s => s.id === sourceSemesterId);
    if (!sourceSem) return [];
    const sourceSemNumber = getSemNumber(sourceSem.name);
    const destSemName = `Semester ${sourceSemNumber + 1}`;
    return allSemesters.filter(s => s.course_id === sourceCourseId && s.name === destSemName);
  }, [sourceSemesterId, allSemesters, sourceCourseId]);
  
  const demotionSemesterOptions = useMemo(() => {
    if (!sourceSemesterId) return [];
    const sourceSem = allSemesters.find(s => s.id === sourceSemesterId);
    if (!sourceSem) return [];
    const sourceSemNumber = getSemNumber(sourceSem.name);
    if (sourceSemNumber <= 1) return [];
    const destSemName = `Semester ${sourceSemNumber - 1}`;
    return allSemesters.filter(s => s.course_id === sourceCourseId && s.name === destSemName);
  }, [sourceSemesterId, allSemesters, sourceCourseId]);

  const currentSemNumber = useMemo(() => {
    if (!sourceSemesterId) return 1;
    const sourceSem = allSemesters.find(s => s.id === sourceSemesterId);
    return sourceSem ? getSemNumber(sourceSem.name) : 1;
  }, [sourceSemesterId, allSemesters]);


  // --- Data Fetching: Students (UPDATED) ---
  const fetchStudents = useCallback(async () => {
    if (!sourceSemesterId || !sourceCourseId) {
      setStudents([]);
      return;
    }
    setLoading(true);
    setStatusMessage(null);
    try {
      // Query 'student_semesters' and join 'students'
      const { data, error } = await supabase
        .from("student_semesters")
        .select(`
          roll_number,
          promotion_status,
          students (id, fullname, branch_history)
        `)
        .eq("semester_id", sourceSemesterId)
        .eq("course_id", sourceCourseId)
        .order("students(fullname)");
      
      if (error) throw error;

      // Transform the nested data
      const formattedStudents = (data as StudentSemesterRow[])
        .map((item: StudentSemesterRow) => {
          if (!item.students) return null; // Skip if join failed
          return {
            id: item.students.id,
            fullname: item.students.fullname,
            rollNumber: item.roll_number,
            promotion_status: item.promotion_status,
            branch_history: item.students.branch_history || []
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
  }, [sourceSemesterId, sourceCourseId, supabase]);
  

  // --- Initial Config & Student Fetch ---
  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      try {
        const [streamsRes, coursesRes, semestersRes] = await Promise.all([
          supabase.from("streams").select("id, name").order("name"),
          supabase.from("courses").select("id, name, stream_id").order("name"),
          supabase.from("semesters").select("id, name, course_id").order("name"),
        ]);
        
        if (streamsRes.data) setAllStreams(streamsRes.data);
        if (coursesRes.data) setAllCourses(coursesRes.data);
        if (semestersRes.data) setAllSemesters(semestersRes.data);

      } catch (err: any) {
        setStatusMessage({ type: 'error', message: `Config Error: ${err.message}` });
      } 
    };
    fetchConfig();
  }, [supabase]);

  // Re-fetch students when filters change
  useEffect(() => {
    if (sourceCourseId && sourceSemesterId) {
      fetchStudents();
    } else {
      setStudents([]); // Clear students if filters are incomplete
    }
  }, [fetchStudents, sourceCourseId, sourceSemesterId]);


  // --- Bulk Promotion Logic (UPDATED) ---
  const updateStudentsSemester = async (newSemesterId: string, statusChange: 'Promoted' | 'Eligible' | 'Hold') => {
    
    if (!sourceSemesterId || selectedStudentIds.length === 0) {
      setStatusMessage({ type: 'error', message: 'Please select source semester and students.' });
      return;
    }

    setIsPromoting(true); 
    setStatusMessage(null);

    try {
      // The old code updated 'students'. The new logic updates 'student_semesters'
      // We are "moving" the enrollment record to a new semester
      const { error } = await supabase
        .from("student_semesters")
        .update({ 
          semester_id: newSemesterId, 
          promotion_status: statusChange 
        })
        .in("student_id", selectedStudentIds)
        .eq("semester_id", sourceSemesterId); // Critial: only update their current enrollment

      if (error) throw error;

      await fetchStudents(); // Refresh the list
      const action = statusChange === 'Promoted' ? 'promoted' : 'demoted/rolled back';
      const semName = allSemesters.find(s => s.id === newSemesterId)?.name || 'Next Semester';

      setStatusMessage({ type: 'success', message: `${selectedStudentIds.length} students ${action} to ${semName} successfully!` });

    } catch (err: any) {
      setStatusMessage({ type: 'error', message: `Update Failed: ${err.message}` });
    } finally {
      setIsPromoting(false);
    }
  };

  const handleBulkPromotion = () => {
      if (!destinationSemesterOptions.length || !destinationSemesterOptions[0].id) {
          setStatusMessage({ type: 'error', message: 'Cannot promote: Next semester not found.' });
          return;
      }
      updateStudentsSemester(destinationSemesterOptions[0].id, 'Promoted');
  };

  const handleBulkDemotion = () => {
      if (!demotionSemesterOptions.length || !demotionSemesterOptions[0].id) {
          setStatusMessage({ type: 'error', message: 'Cannot demote: Previous semester not found (or already Sem 1).' });
          return;
      }
      updateStudentsSemester(demotionSemesterOptions[0].id, 'Eligible');
  };


  // --- Single Branch Transfer Logic (UPDATED) ---
  const handleBranchTransfer = async () => {
    if (!selectedStudent || !newCourseId || !sourceSemesterId || newCourseId === sourceCourseId) {
      setStatusMessage({ type: 'error', message: 'Select a student and a different branch.' });
      return;
    }

    setIsTransferring(true);
    setStatusMessage(null);
    const oldCourse = allCourses.find(c => c.id === sourceCourseId)?.name || 'N/A';
    const newCourse = allCourses.find(c => c.id === newCourseId)?.name || 'N/A';
    
    try {
      const targetSemName = `Semester ${currentSemNumber}`;
      const targetNewSemesterId = findSemesterId(allSemesters, newCourseId, targetSemName);
      
      if (!targetNewSemesterId) throw new Error(`Destination branch (${newCourse}) does not have a ${targetSemName} defined.`);

      // 1. Update the enrollment (student_semesters)
      const { error: semesterError } = await supabase
        .from("student_semesters")
        .update({
          course_id: newCourseId,
          semester_id: targetNewSemesterId,
          // You might want to reset promotion_status here too, e.g., promotion_status: 'Eligible'
        })
        .eq('student_id', selectedStudent.id)
        .eq('semester_id', sourceSemesterId); // Match the *current* enrollment
      
      if (semesterError) throw new Error(`Semester Update Error: ${semesterError.message}`);

      // 2. Update the student's permanent record (branch_history on 'students' table)
      const historyEntry = {
        date: new Date().toISOString().split('T')[0],
        old_course_id: sourceCourseId,
        new_course_id: newCourseId,
        old_semester_id: sourceSemesterId,
        new_semester_id: targetNewSemesterId,
        reason: transferNotes || 'Branch change requested by administration.',
        old_course_name: oldCourse,
        new_course_name: newCourse,
      };

      const { error: studentError } = await supabase
        .from("students")
        .update({ 
          branch_history: [
            ...(selectedStudent.branch_history as any[] || []), 
            historyEntry
          ] 
        })
        .eq('id', selectedStudent.id);

      if (studentError) throw new Error(`Student History Error: ${studentError.message}`);

      // 3. Success
      await fetchStudents();
      setSelectedStudent(null);
      setNewCourseId(null);
      setTransferNotes('');
      setStatusMessage({ type: 'success', message: `${selectedStudent.fullname} transferred from ${oldCourse} to ${newCourse} (retained ${targetSemName}) successfully!` });

    } catch (err: any) {
      setStatusMessage({ type: 'error', message: `Transfer Failed: ${err.message}` });
    } finally {
      setIsTransferring(false);
    }
  };


  // --- Search Logic ---
  const filteredStudents = useMemo(() => {
    if (!students.length) return [];
    if (!studentSearch) return students;

    const query = studentSearch.toLowerCase();
    return students.filter(student => 
      student.fullname?.toLowerCase().includes(query) ||
      student.rollNumber?.toLowerCase().includes(query)
    );
  }, [students, studentSearch]);
  
  // --- Student Selection Handlers ---
  const handleStudentToggle = (studentId: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };
  
  const handleSelectAll = () => {
    const filteredEligibleIds = filteredStudents
      .filter(s => s.promotion_status === 'Eligible')
      .map(s => s.id);
    
    const allFilteredSelected = filteredEligibleIds.length > 0 && 
                                filteredEligibleIds.every(id => selectedStudentIds.includes(id));

    if (allFilteredSelected) {
      setSelectedStudentIds(prev => prev.filter(id => !filteredEligibleIds.includes(id)));
    } else {
      setSelectedStudentIds(prev => [...new Set([...prev, ...filteredEligibleIds])]);
    }
  };
  
  const handleStudentSelectForTransfer = (student: Student) => {
    setSelectedStudent(student);
    setNewCourseId(null);
    setTransferNotes('');
    setStatusMessage(null);
  };
  
  const allPromotableSelected = useMemo(() => {
    const filteredEligibleIds = filteredStudents
      .filter(s => s.promotion_status === 'Eligible')
      .map(s => s.id);
    return filteredEligibleIds.length > 0 && 
           filteredEligibleIds.every(id => selectedStudentIds.includes(id));
  }, [filteredStudents, selectedStudentIds]);
  
  const isFilterReady = sourceSemesterId;


  // Render
  return (
    <div className="p-4 md:p-8 space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-blue-700">Academic Roll Forward & Transfer</CardTitle>
          <CardDescription>Manage bulk promotion and individual branch transfers.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && !students.length && <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />}

          {/* --- Global Messages --- */}
          {statusMessage && (
            <Alert variant={statusMessage.type === 'error' ? 'destructive' : 'default'} className={`mb-4 ${statusMessage.type === 'success' ? 'bg-green-100 border-green-400 text-green-800' : ''}`}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{statusMessage.type === 'error' ? 'Operation Failed' : 'Success!'}</AlertTitle>
              <AlertDescription>{statusMessage.message}</AlertDescription>
            </Alert>
          )}
          
          {/* --- Filter & Promotion Controls (Section 1) --- */}
          <h3 className="text-xl font-semibold mb-4 border-b pb-2">Promotion Setup</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            <DropdownSelect label="1. Stream" value={sourceStreamId} onChange={setSourceStreamId} options={allStreams} placeholder="Select Stream" />
            
            <DropdownSelect label="2. Course" value={sourceCourseId} onChange={setSourceCourseId} options={courseOptions} placeholder="Select Course" disabled={!sourceStreamId} />
            
            <DropdownSelect label="3. Semester" value={sourceSemesterId} onChange={setSourceSemesterId} options={sourceSemesterOptions} placeholder="Current Semester" disabled={!sourceCourseId} />
            
            {/* Display box for next/previous sem IDs */}
            <div className="space-y-1">
                <Label className="font-semibold">Promotion / Rollback Targets</Label>
                <div className="flex flex-col gap-2">
                    <p className="text-sm text-gray-700 bg-gray-100 p-2 rounded-md">
                        Promote to: 
                        <span className="font-bold ml-1">
                           {destinationSemesterOptions[0]?.name || 'N/A (End of course)'}
                        </span>
                    </p>
                    <p className="text-sm text-gray-700 bg-gray-100 p-2 rounded-md">
                        Demote to: 
                        <span className="font-bold ml-1">
                           {demotionSemesterOptions[0]?.name || 'N/A (Already Sem 1)'}
                        </span>
                    </p>
                </div>
            </div>
          </div>

          {/* --- Bulk Promotion List (Section 2) --- */}
          {sourceSemesterId && (
            <div className="mt-8 border-t pt-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Student List ({students.length})
              </h3>
              
              {/* --- Search Input for Students --- */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search student by name or roll number..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="mb-4 flex justify-between items-center space-x-2">
                <Button variant="outline" onClick={handleSelectAll}>
                  {allPromotableSelected ? 'Deselect All Filtered' : 'Select All Filtered'}
                </Button>
                
                {/* --- Action Buttons --- */}
                <div className="flex space-x-2">
                    <Button onClick={handleBulkPromotion} disabled={!isFilterReady || selectedStudentIds.length === 0 || isPromoting || isTransferring || !destinationSemesterOptions.length} className="bg-green-600 hover:bg-green-700">
                      {isPromoting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                      Promote ({selectedStudentIds.length})
                    </Button>
                    <Button onClick={handleBulkDemotion} disabled={!isFilterReady || selectedStudentIds.length === 0 || isPromoting || isTransferring || !demotionSemesterOptions.length} variant="destructive">
                      {isPromoting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowLeftCircle className="h-4 w-4 mr-2" />}
                      Demote ({selectedStudentIds.length})
                    </Button>
                </div>
              </div>

              {/* Student Grid */}
              <div className="max-h-80 overflow-y-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Select</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll No.</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Full Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transfer</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading && (
                        <tr>
                          <td colSpan={5} className="text-center py-8">
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
                            disabled={student.promotion_status !== 'Eligible'}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.rollNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.fullname}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={student.promotion_status === 'Eligible' ? 'default' : 'secondary'}>
                            {student.promotion_status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Button variant="link" size="sm" onClick={() => handleStudentSelectForTransfer(student)} disabled={isTransferring}>
                            <ArrowRightCircle className="w-4 h-4 mr-1" /> Branch
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!loading && filteredStudents.length === 0 && <p className="text-center py-4 text-gray-500">No students found matching your filters/search.</p>}
            </div>
          )}
          
          {/* --- Branch Transfer (Section 3) --- */}
          <div className="mt-8 border-t pt-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <GitBranch className="w-5 h-5" />
              Single Student Branch Transfer
            </h3>
            
            <Card className={`p-4 border ${selectedStudent ? 'border-red-400' : 'border-gray-200'}`}>
              <CardContent className="p-0 space-y-4">
                <p className={`text-lg font-bold ${selectedStudent ? 'text-red-700' : 'text-gray-500'}`}>
                  Student: {selectedStudent?.fullname || 'Select a student from the list above'}
                </p>

                {selectedStudent && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <DropdownSelect label="Current Course" value={sourceCourseId} onChange={() => {}} options={courseOptions} placeholder="N/A" disabled={true} />
                      
                      <DropdownSelect label="New Destination Course*" value={newCourseId} onChange={setNewCourseId} options={allCourses} placeholder="Select New Course" />
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="transfer-notes" className="font-semibold">Reason for Transfer (Saved to History)*</Label>
                      <Input id="transfer-notes" value={transferNotes} onChange={(e) => setTransferNotes(e.target.value)} placeholder="E.g., Requested internal transfer in 2nd year." required />
                    </div>

                    <Button onClick={handleBranchTransfer} disabled={!newCourseId || newCourseId === sourceCourseId || isTransferring || transferNotes.length < 5} className="bg-red-600 hover:bg-red-700">
                      {isTransferring ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <GitBranch className="h-4 w-4 mr-2" />}
                      Confirm Transfer
                    </Button>
                    <p className="text-sm text-gray-500 mt-2">
                      Transfer Note: Student will be moved to **Semester {currentSemNumber}** of the new branch.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

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
      options={options}
      onChange={(e) => onChange(e.value)}
      optionLabel="name"
      optionValue="id"
      placeholder={placeholder}
      className="w-full p-inputtext-sm"
      filter
      disabled={disabled}
    />
  </div>
);