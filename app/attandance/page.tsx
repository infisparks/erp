// e.g., app/dashboard/attendance/page.tsx
"use client"

import React, { useState, useEffect, useMemo } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"

// --- UI Components ---
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// --- Icons ---
import { Plus, Minus, Loader2, AlertTriangle, Calendar as CalendarIcon, X } from "lucide-react"

// --- PrimeReact Components ---
import { Dropdown } from 'primereact/dropdown';

// --- PrimeReact CSS ---
import "primereact/resources/themes/saga-blue/theme.css"
import "primereact/resources/primereact.min.css"
import "primeicons/primeicons.css"

// --- Type Definitions ---
interface Stream { id: string; name: string; }
interface Course { id: string; name: string; stream_id: string; }
interface Semester { id: string; name: string; course_id: string; }
interface Subject { id: string; name: string; semester_id: string; }

interface Student {
  id: string;
  fullname: string | null;
  "rollNumber": string;
}

// Represents the state of the grid: { "student-uuid": { "2025-11-02": "P" } }
type AttendanceData = Record<string, Record<string, string>>;

const ATTENDANCE_STATUS = [
  { label: 'Present', value: 'P' },
  { label: 'Absent', value: 'A' },
  { label: 'Leave', value: 'L' },
];

// Helper to get today's date in "YYYY-MM-DD" format
const getISODate = (date: Date = new Date()) => {
  return date.toISOString().split('T')[0];
};

/**
 * Main Attendance Management Page
 */
export default function AttendancePage() {
  const supabase = getSupabaseClient();
  
  // --- Filter Data ---
  const [allStreams, setAllStreams] = useState<Stream[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [allSemesters, setAllSemesters] = useState<Semester[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);

  // --- Filter Selections ---
  const [selectedStream, setSelectedStream] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  
  // --- Grid State ---
  const [students, setStudents] = useState<Student[]>([]);
  const [dates, setDates] = useState<string[]>([getISODate()]);
  const [attendanceData, setAttendanceData] = useState<AttendanceData>({});
  const [newDate, setNewDate] = useState(getISODate());

  // --- Loading & Error State ---
  const [loading, setLoading] = useState({
    config: false,
    students: false,
    attendance: false
  });
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // --- Filter Options (derived from data) ---
  const courseOptions = useMemo(() => allCourses.filter(c => c.stream_id === selectedStream), [allCourses, selectedStream]);
  const subjectOptions = useMemo(() => {
    if (!selectedCourse) return [];
    const courseSemesterIds = allSemesters
      .filter(s => s.course_id === selectedCourse)
      .map(s => s.id);
    return allSubjects.filter(s => courseSemesterIds.includes(s.semester_id));
  }, [allSemesters, allSubjects, selectedCourse]);

  // --- Data Fetching: Initial Config ---
  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(prev => ({ ...prev, config: true }));
      try {
        const [streamsRes, coursesRes, semestersRes, subjectsRes] = await Promise.all([
          supabase.from("streams").select("id, name"),
          supabase.from("courses").select("id, name, stream_id"),
          supabase.from("semesters").select("id, name, course_id"),
          supabase.from("subjects").select("id, name, semester_id"),
        ]);
        
        if (streamsRes.data) setAllStreams(streamsRes.data);
        if (coursesRes.data) setAllCourses(coursesRes.data);
        if (semestersRes.data) setAllSemesters(semestersRes.data);
        if (subjectsRes.data) setAllSubjects(subjectsRes.data);

      } catch (err: any) {
        setError(err.message || "Failed to load academic data.");
      }
      setLoading(prev => ({ ...prev, config: false }));
    };
    fetchConfig();
  }, [supabase]);

  // --- Data Fetching: Students ---
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedCourse) {
        setStudents([]);
        return;
      }
      setLoading(prev => ({ ...prev, students: true }));
      try {
        // This query correctly fetches students based on the selected course ID
        const { data, error } = await supabase
          .from("students")
          .select('id, fullname, "rollNumber"')
          .eq("course_id", selectedCourse)
          .order("fullname");
        
        if (error) throw error;
        setStudents(data || []);
      } catch (err: any) {
        setError(err.message || "Failed to load students.");
      }
      setLoading(prev => ({ ...prev, students: false }));
    };
    fetchStudents();
  }, [selectedCourse, supabase]); // This runs every time 'selectedCourse' changes

  // --- Data Fetching: Attendance ---
  useEffect(() => {
    const fetchAttendance = async () => {
      if (!selectedSubject || students.length === 0 || dates.length === 0) {
        setAttendanceData({});
        return;
      }
      setLoading(prev => ({ ...prev, attendance: true }));
      try {
        const studentIds = students.map(s => s.id);
        const { data, error } = await supabase
          .from("attendance")
          .select("student_id, date, status")
          .eq("subject_id", selectedSubject)
          .in("student_id", studentIds)
          .in("date", dates);
          
        if (error) throw error;
        
        const newAttendanceData: AttendanceData = {};
        for (const student of students) {
          newAttendanceData[student.id] = {};
        }
        for (const record of data) {
          if (newAttendanceData[record.student_id]) {
            newAttendanceData[record.student_id][record.date] = record.status;
          }
        }
        setAttendanceData(newAttendanceData);
        
      } catch (err: any) {
        setError(err.message || "Failed to load attendance records.");
      }
      setLoading(prev => ({ ...prev, attendance: false }));
    };
    fetchAttendance();
  }, [selectedSubject, students, dates, supabase]);


  // --- Grid Management ---
  const addDateColumn = () => {
    if (newDate && !dates.includes(newDate)) {
      setDates(prev => [...prev, newDate].sort());
      setNewDate(getISODate());
    }
  };

  const removeDateColumn = (dateToRemove: string) => {
    setDates(prev => prev.filter(d => d !== dateToRemove));
  };
  
  const handleStatusChange = async (studentId: string, date: string, newStatus: string) => {
    if (!selectedSubject) return;

    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [date]: newStatus
      }
    }));
    setSaveStatus('saving');

    try {
      const { error } = await supabase
        .from("attendance")
        .upsert(
          {
            student_id: studentId,
            subject_id: selectedSubject,
            date: date,
            status: newStatus
          },
          { onConflict: 'student_id, subject_id, date' }
        );
      
      if (error) throw error;
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1000);
      
    } catch (err: any) {
      setError(err.message || "Failed to save attendance.");
      setSaveStatus('error');
      setAttendanceData(prev => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          [date]: attendanceData[studentId]?.[date] || ''
        }
      }));
    }
  };

  const isLoading = loading.config || loading.students;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Attendance Management
          </h1>
          <p className="text-lg text-gray-600">
            Select a subject to view and manage student attendance.
          </p>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Dropdown
              value={selectedStream}
              options={allStreams}
              onChange={(e) => { setSelectedStream(e.value); setSelectedCourse(null); setSelectedSubject(null); }}
              optionLabel="name"
              optionValue="id"
              placeholder="1. Select Stream"
              className="w-full"
              filter
            />
            <Dropdown
              value={selectedCourse}
              options={courseOptions}
              onChange={(e) => { setSelectedCourse(e.value); setSelectedSubject(null); }}
              optionLabel="name"
              optionValue="id"
              placeholder="2. Select Course"
              className="w-full"
              filter
              disabled={!selectedStream}
            />
            <Dropdown
              value={selectedSubject}
              options={subjectOptions}
              onChange={(e) => setSelectedSubject(e.value)}
              optionLabel="name"
              optionValue="id"
              placeholder="3. Select Subject"
              className="w-full"
              filter
              disabled={!selectedCourse}
            />
          </div>
          {error && (
             <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      {isLoading ? (
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
      ) : !selectedSubject ? (
        <Card className="shadow-lg">
          <CardContent className="p-10 text-center text-gray-500">
            Please select a stream, course, and subject to load the attendance sheet.
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg">
          <CardContent className="p-0">
            <div className="p-2 text-sm text-right text-gray-500 h-8">
              {saveStatus === 'saving' && <span className="flex items-center justify-end"><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</span>}
              {saveStatus === 'saved' && <span className="text-green-600">Saved</span>}
              {saveStatus === 'error' && <span className="text-red-600">Save Error</span>}
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="sticky left-0 bg-gray-200 border border-gray-300 p-2 text-left text-sm font-semibold text-gray-700 z-10">
                      Student Name
                    </th>
                    
                    {dates.map(date => (
                      <th key={date} className="border border-gray-300 p-2 text-sm font-semibold text-gray-700 text-center whitespace-nowrap">
                        <div className="flex items-center gap-2 justify-center">
                          {date}
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeDateColumn(date)}>
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </th>
                    ))}
                    
                    <th className="border border-gray-300 p-2 text-sm font-semibold text-gray-700">
                      <div className="flex items-center gap-2">
                        <Input
                          type="date"
                          value={newDate}
                          onChange={(e) => setNewDate(e.target.value)}
                          className="w-40"
                        />
                        <Button size="icon" className="h-9 w-9" onClick={addDateColumn}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading.attendance ? (
                    <tr>
                      <td colSpan={dates.length + 2} className="p-10 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                      </td>
                    </tr>
                  ) : (
                    // This maps over the 'students' state
                    students.map(student => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="sticky left-0 bg-white border border-gray-200 p-2 text-sm text-gray-800 font-medium z-10">
                          {student.fullname} ({student["rollNumber"]})
                        </td>
                        
                        {dates.map(date => {
                          const status = attendanceData[student.id]?.[date] || '';
                          return (
                            <td key={date} className="border border-gray-200 p-0 text-center">
                              <AttendanceCell
                                status={status}
                                onChange={(newStatus) => handleStatusChange(student.id, date, newStatus)}
                              />
                            </td>
                          );
                        })}
                        
                        <td className="border border-gray-200 p-0"></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/**
 * A custom component for each attendance cell
 */
const AttendanceCell: React.FC<{
  status: string;
  onChange: (newStatus: string) => void;
}> = ({ status, onChange }) => {
  
  const cycleStatus = () => {
    if (status === 'P') {
      onChange('A');
    } else if (status === 'A') {
      onChange('L');
    } else if (status === 'L') {
      onChange('');
    } else {
      onChange('P');
    }
  };

  const getBgColor = () => {
    if (status === 'P') return 'bg-green-100 text-green-800';
    if (status === 'A') return 'bg-red-100 text-red-800';
    if (status === 'L') return 'bg-yellow-100 text-yellow-800';
    return 'bg-white hover:bg-gray-100';
  };

  return (
    <button
      type="button"
      onClick={cycleStatus}
      className={`w-full h-10 flex items-center justify-center text-sm font-bold transition-colors ${getBgColor()}`}
    >
      {status}
    </button>
  );
};