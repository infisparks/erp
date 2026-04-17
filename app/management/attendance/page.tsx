"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Save,
  Plus,
  Trash2,
  Check,
  X,
  Loader2,
  Filter,
  FileText,
  FileSpreadsheet,
  Download,
} from "lucide-react"
import { Dropdown } from "primereact/dropdown"
import { format, parseISO } from "date-fns"
import { toast } from "sonner"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

// --- Types ---

interface Stream {
  id: string
  name: string
}
interface Course {
  id: string
  name: string
  stream_id: string
}
interface AcademicYear {
  id: string
  name: string
  course_id: string
  sequence: number
}
interface Semester {
  id: string
  name: string
  academic_year_id: string
}
interface Subject {
  id: string
  name: string
  semester_id: string
}

interface Student {
  id: number
  fullname: string
  roll_number: string
}

interface AttendanceSession {
  id: string
  date: string
  lecture_number: number
  subject_id: string
}

interface AttendanceRecord {
  id: string
  session_id: string
  student_id: number
  status: 'P' | 'A' | null
}

// -------------------------------------------------------------------

export default function AttendancePage() {
  const supabase = getSupabaseClient()

  // --- Filter State ---
  const [selectedStream, setSelectedStream] = useState<string | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<string | null>(null)
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null)
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)

  // --- Config State ---
  const [streams, setStreams] = useState<Stream[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [years, setYears] = useState<AcademicYear[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])

  // --- Data State ---
  const [students, setStudents] = useState<Student[]>([])
  const [sessions, setSessions] = useState<AttendanceSession[]>([])
  const [attendanceGrid, setAttendanceGrid] = useState<Record<string, 'P' | 'A' | null>>({})
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // --- Defaulter Settings ---
  const [showDefaulters, setShowDefaulters] = useState(false)
  const [defaulterThreshold, setDefaulterThreshold] = useState(75)

  // --- Date Picker & Lecture Session for creating new column ---
  const [newDate, setNewDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [newLecture, setNewLecture] = useState(1)

  // --- Initial Config Fetch ---
  useEffect(() => {
    const fetchConfig = async () => {
      const { data: stData } = await supabase.from("streams").select("*")
      const { data: cData } = await supabase.from("courses").select("*")
      const { data: ayData } = await supabase.from("academic_years").select("*")
      const { data: semData } = await supabase.from("semesters").select("*")
      const { data: subData } = await supabase.from("subjects").select("*")

      if (stData) setStreams(stData)
      if (cData) setCourses(cData)
      if (ayData) setYears(ayData)
      if (semData) setSemesters(semData)
      if (subData) setSubjects(subData)
    }
    fetchConfig()
  }, [supabase])

  // --- Hierarchical Filtering ---
  const filteredCourses = useMemo(() => courses.filter(c => c.stream_id === selectedStream), [courses, selectedStream])
  const filteredYears = useMemo(() => years.filter(y => y.course_id === selectedCourse).sort((a,b) => a.sequence - b.sequence), [years, selectedCourse])
  const filteredSemesters = useMemo(() => semesters.filter(s => s.academic_year_id === selectedYear), [semesters, selectedYear])
  const filteredSubjects = useMemo(() => subjects.filter(sub => sub.semester_id === selectedSemester), [subjects, selectedSemester])

  // --- Fetch Main Data when Subject is Selected ---
  const fetchAttendanceData = useCallback(async () => {
    if (!selectedSubject || !selectedYear) return
    setLoading(true)
    try {
      // 1. Fetch Students linked to this Course & Year
      const yearName = years.find(y => y.id === selectedYear)?.name
      const { data: studentData, error: studentError } = await supabase
        .from("student_academic_years")
        .select(`
          student_id,
          students ( id, fullname, roll_number )
        `)
        .eq("course_id", selectedCourse)
        .eq("academic_year_name", yearName)

      if (studentError) throw studentError
      const flattenedStudents = ((studentData as any[]) || []).map((item: any) => ({
        id: item.students.id,
        fullname: item.students.fullname,
        roll_number: item.students.roll_number
      }))
      setStudents(flattenedStudents)

      // 2. Fetch Attendance Sessions for this Subject
      const { data: sessionData, error: sessionError } = await supabase
        .from("attendance_sessions")
        .select("*")
        .eq("subject_id", selectedSubject)
        .order("date", { ascending: true })
        .order("lecture_number", { ascending: true })

      if (sessionError) throw sessionError
      setSessions(sessionData as AttendanceSession[])

      // 3. Fetch Records for these sessions
      if (sessionData && sessionData.length > 0) {
        const sessionIds = sessionData.map((s: AttendanceSession) => s.id)
        const { data: recordData, error: recordError } = await supabase
          .from("attendance_records")
          .select("*")
          .in("session_id", sessionIds)

        if (recordError) throw recordError
        
        const grid: Record<string, 'P' | 'A' | null> = {}
        recordData.forEach((r: any) => {
          grid[`${r.student_id}_${r.session_id}`] = r.status as 'P' | 'A'
        })
        setAttendanceGrid(grid)
      } else {
        setAttendanceGrid({})
      }
    } catch (err: any) {
      console.error(err)
      toast.error("Failed to load attendance data")
    } finally {
      setLoading(false)
    }
  }, [supabase, selectedSubject, selectedYear, selectedCourse, years])

  useEffect(() => {
    fetchAttendanceData()
  }, [fetchAttendanceData])

  // --- Interaction Logic ---
  const toggleStatus = (studentId: number, sessionId: string) => {
    const key = `${studentId}_${sessionId}`
    const current = attendanceGrid[key] || null

    let next: 'P' | 'A' | null = null
    if (current === null) next = 'P'
    else if (current === 'P') next = 'A'
    else if (current === 'A') next = null

    setAttendanceGrid(prev => ({
      ...prev,
      [key]: next
    }))
  }

  // --- Column Management ---
  const addSession = async () => {
    if (!selectedSubject) return
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from("attendance_sessions")
        .insert({
          subject_id: selectedSubject,
          date: newDate,
          lecture_number: newLecture
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') throw new Error("A session already exists for this date and lecture number.")
        throw error
      }

      setSessions(prev => [...prev, data as AttendanceSession].sort((a,b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date)
        return a.lecture_number - b.lecture_number
      }))
      toast.success("New lecture session added")
    } catch (err: any) {
      toast.error(err.message || "Failed to add session")
    } finally {
      setSaving(false)
    }
  }

  const deleteSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to delete this entire session? All records for this day will be lost.")) return
    try {
      const { error } = await supabase.from("attendance_sessions").delete().eq("id", sessionId)
      if (error) throw error
      setSessions(prev => prev.filter(s => s.id !== sessionId))
      toast.success("Session deleted")
    } catch (err: any) {
      toast.error("Failed to delete session")
    }
  }

  // --- Save Logic ---
  const saveAttendance = async () => {
    if (!selectedSubject) return
    setSaving(true)
    try {
      const upsertBatch: any[] = []
      Object.entries(attendanceGrid).forEach(([key, status]) => {
        const [studentId, sessionId] = key.split("_")
        if (status) {
          upsertBatch.push({
            session_id: sessionId,
            student_id: parseInt(studentId),
            status: status,
            updated_at: new Date().toISOString()
          })
        }
      })
      if (upsertBatch.length > 0) {
        const { error } = await supabase
          .from("attendance_records")
          .upsert(upsertBatch, { onConflict: 'session_id, student_id' })
        if (error) throw error
      }
      toast.success("Attendance saved successfully!")
    } catch (err: any) {
      console.error(err)
      toast.error("Error saving attendance")
    } finally {
      setSaving(false)
    }
  }

  // --- Export Functions ---
  const exportToPDF = () => {
    if (students.length === 0) return toast.error("No data to export")
    
    const doc = new jsPDF('l', 'mm', 'a4')
    const subjectName = subjects.find(s => s.id === selectedSubject)?.name || "Subject"
    const courseName = courses.find(c => c.id === selectedCourse)?.name || "Course"
    const streamName = streams.find(s => s.id === selectedStream)?.name || "Stream"
    
    // --- Ultra-Professional PDF Layout ---
    const primaryColor: [number, number, number] = [37, 99, 235] // Indigo-600
    
    // Header Indigo Block
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.rect(0, 0, 297, 40, 'F')
    
    // Title Section
    doc.setFont("helvetica", "bold")
    doc.setFontSize(24)
    doc.setTextColor(255, 255, 255)
    doc.text("OFFICIAL ATTENDANCE REPORT", 14, 18)
    
    // Metadata in Header
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Department: ${streamName} | Course: ${courseName}`, 14, 26)
    doc.text(`Generated on: ${format(new Date(), 'PPP p')}`, 14, 32)

    // Summary Box (Top Right)
    doc.setFillColor(255, 255, 255) // White
    doc.setGState(new (doc as any).GState({ opacity: 0.1 })) // Subtitle opac
    doc.roundedRect(210, 8, 75, 25, 2, 2, 'F')
    doc.setGState(new (doc as any).GState({ opacity: 1 })) // Reset
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text(`Subject: ${subjectName}`, 215, 15)
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.text(`Total Students: ${students.length}`, 215, 22)
    doc.text(`Total Sessions: ${sessions.length}`, 215, 28)

    // Footer - Page Info
    const totalPagesExp = "{total_pages_count_string}";
    
    // Table Prep
    const tableColumn = ["#", "Student Name", "Roll Number", ...sessions.map(s => `${s.date}\nL${s.lecture_number}`), "Attendance (%)"]
    const tableRows = students.map((student, idx) => {
      let presentCount = 0
      let totalMarked = 0
      const row = [
        idx + 1,
        student.fullname,
        student.roll_number || "-",
        ...sessions.map(s => {
          const status = attendanceGrid[`${student.id}_${s.id}`]
          if (status === 'P') { presentCount++; totalMarked++; return "P" }
          if (status === 'A') { totalMarked++; return "A" }
          return "-"
        }),
        totalMarked > 0 ? `${((presentCount / totalMarked) * 100).toFixed(1)}%` : "0%"
      ]
      return row
    })

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2.5, halign: 'center', font: 'helvetica' },
      headStyles: { 
        fillColor: primaryColor, 
        textColor: 255, 
        fontSize: 9, 
        fontStyle: 'bold', 
        minCellHeight: 12,
        valign: 'middle'
      },
      columnStyles: {
        1: { halign: 'left', fontStyle: 'bold', overflow: 'ellipsize', cellWidth: 40 },
        2: { halign: 'center', cellWidth: 25 }
      },
      alternateRowStyles: { fillColor: [245, 248, 255] },
      didDrawPage: (data) => {
        // Simple Footer
        doc.setFontSize(8)
        doc.setTextColor(100)
        doc.text(`Authorized Personnel Signature: __________________________`, 14, 200)
        doc.text(`Page ${doc.getNumberOfPages()}`, 270, 200)
      },
      willDrawCell: (data) => {
        if (showDefaulters && data.section === 'body' && data.column.index === tableColumn.length - 1) {
          const percText = data.cell.text[0];
          const percVal = parseFloat(percText);
          if (!isNaN(percVal) && percVal < defaulterThreshold) {
            data.cell.styles.textColor = [220, 38, 38]; // Red-600
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    })

    // Output to Blob URL and Open in New Tab
    const blob = doc.output('blob')
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    toast.success("PDF Preview opened in new tab")
  }

  const exportToExcel = () => {
    if (students.length === 0) return toast.error("No data to export")
    
    const subjectName = subjects.find(s => s.id === selectedSubject)?.name || "Subject"
    
    // Prepare CSV Content
    const headers = ["#", "Student Name", "Roll Number", ...sessions.map(s => `${s.date} (Lec ${s.lecture_number})`), "Attendance (%)"]
    const rows = students.map((student, idx) => {
      let present = 0, total = 0
      const sessionStatuses = sessions.map(s => {
        const status = attendanceGrid[`${student.id}_${s.id}`]
        if (status === 'P') { present++; total++; return "P" }
        if (status === 'A') { total++; return "A" }
        return "-"
      })
      const perc = total > 0 ? ((present / total) * 100).toFixed(2) : "0"
      return [idx + 1, `"${student.fullname}"`, `"${student.roll_number}"`, ...sessionStatuses, `${perc}%`]
    })

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `Attendance_${subjectName}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("Excel/CSV Downloaded")
  }

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-slate-50 dark:bg-slate-950">
      
      <Card className="border-none shadow-premium bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Attendance Management
              </CardTitle>
              <CardDescription>Select Stream and Subject to manage student attendance matrix</CardDescription>
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-4 px-4 py-2 bg-slate-100/50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="defaulter-toggle" 
                    checked={showDefaulters} 
                    onCheckedChange={(checked) => setShowDefaulters(!!checked)} 
                  />
                  <Label htmlFor="defaulter-toggle" className="cursor-pointer text-xs font-bold whitespace-nowrap">Show Defaulters</Label>
                </div>
                {showDefaulters && (
                  <div className="flex items-center gap-2 border-l pl-4 border-slate-300">
                    <span className="text-xs text-slate-500 font-medium">Below:</span>
                    <Input 
                      type="number" 
                      value={defaulterThreshold} 
                      onChange={(e) => setDefaulterThreshold(parseInt(e.target.value) || 0)}
                      className="w-16 h-8 text-xs font-bold text-red-600 bg-white"
                    />
                    <span className="text-xs text-slate-500 font-bold">%</span>
                  </div>
                )}
              </div>
              <Button 
                variant="outline"
                onClick={exportToPDF}
                disabled={!selectedSubject || loading}
                className="border-slate-200 hover:bg-slate-50"
              >
                <FileText className="mr-2 h-4 w-4 text-red-500" />
                PDF
              </Button>
              <Button 
                variant="outline"
                onClick={exportToExcel}
                disabled={!selectedSubject || loading}
                className="border-slate-200 hover:bg-slate-50"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-500" />
                Excel
              </Button>
              <Button 
                onClick={saveAttendance} 
                className="bg-blue-600 hover:bg-blue-700 shadow-md transition-all active:scale-95" 
                disabled={saving || !selectedSubject}
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-500">Stream</Label>
              <Dropdown
                value={selectedStream}
                options={streams.map(s => ({ label: s.name, value: s.id }))}
                onChange={(e) => {
                  setSelectedStream(e.value)
                  setSelectedCourse(null)
                  setSelectedYear(null)
                  setSelectedSemester(null)
                  setSelectedSubject(null)
                }}
                placeholder="Select Stream"
                className="w-full h-10 flex items-center border rounded-md px-3"
                filter
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-500">Course</Label>
              <Dropdown
                value={selectedCourse}
                options={filteredCourses.map(c => ({ label: c.name, value: c.id }))}
                onChange={(e) => {
                  setSelectedCourse(e.value)
                  setSelectedYear(null)
                  setSelectedSemester(null)
                  setSelectedSubject(null)
                }}
                disabled={!selectedStream}
                placeholder="Select Course"
                className="w-full h-10 flex items-center border rounded-md px-3"
                filter
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-500">Academic Year</Label>
              <Dropdown
                value={selectedYear}
                options={filteredYears.map(y => ({ label: y.name, value: y.id }))}
                onChange={(e) => {
                  setSelectedYear(e.value)
                  setSelectedSemester(null)
                  setSelectedSubject(null)
                }}
                disabled={!selectedCourse}
                placeholder="Select Year"
                className="w-full h-10 flex items-center border rounded-md px-3"
                filter
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-500">Semester</Label>
              <Dropdown
                value={selectedSemester}
                options={filteredSemesters.map(s => ({ label: s.name, value: s.id }))}
                onChange={(e) => {
                  setSelectedSemester(e.value)
                  setSelectedSubject(null)
                }}
                disabled={!selectedYear}
                placeholder="Select Sem"
                className="w-full h-10 flex items-center border rounded-md px-3"
                filter
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-500">Subject</Label>
              <Dropdown
                value={selectedSubject}
                options={filteredSubjects.map(sub => ({ label: sub.name, value: sub.id }))}
                onChange={(e) => setSelectedSubject(e.value)}
                disabled={!selectedSemester}
                placeholder="Select Subject"
                className="w-full h-10 flex items-center border rounded-md px-3"
                filter
              />
            </div>

          </div>
        </CardContent>
      </Card>

      {selectedSubject ? (
        <Card className="border-none shadow-xl overflow-hidden bg-white dark:bg-slate-900 min-h-[500px]">
          <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date & Lecture</span>
                <div className="flex gap-2 items-center">
                  <Input 
                    type="date" 
                    value={newDate} 
                    onChange={e => setNewDate(e.target.value)}
                    className="w-40 h-9"
                  />
                  <Dropdown
                    value={newLecture}
                    options={[1,2,3,4,5,6].map(n => ({ label: `Lec ${n}`, value: n }))}
                    onChange={e => setNewLecture(e.value)}
                    className="w-24 h-9 flex items-center border px-2 bg-white"
                  />
                  <Button onClick={addSession} size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-9" disabled={saving}>
                    <Plus className="h-4 w-4 mr-1" /> AddColumn
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full bg-emerald-500" /> Present (P)
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-500" /> Absent (A)
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full bg-slate-200" /> None
              </div>
            </div>
          </div>

          <CardContent className="p-0 overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-20 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-slate-500">Loading data...</p>
              </div>
            ) : students.length > 0 ? (
              <Table className="border-collapse">
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-900 border-b">
                    <TableHead className="sticky left-0 z-20 bg-slate-50 dark:bg-slate-900 w-[50px] text-center border-r">#</TableHead>
                    <TableHead className="sticky left-[50px] z-20 bg-slate-50 dark:bg-slate-900 w-[200px] border-r">Student Name</TableHead>
                    <TableHead className="sticky left-[250px] z-20 bg-slate-50 dark:bg-slate-900 w-[100px] border-r">Roll No</TableHead>
                    
                    {sessions.map(session => (
                      <TableHead key={session.id} className="min-w-[100px] text-center border-r group relative">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 font-mono">{session.date}</span>
                          <span className="font-bold">Lec {session.lecture_number}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute -top-1 -right-1 h-5 w-5 opacity-0 group-hover:opacity-100 text-red-500"
                          onClick={() => deleteSession(session.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student, idx) => {
                    // Calculate individual percentage for UI highlighting
                    let pCount = 0, tMarked = 0
                    sessions.forEach(s => {
                      const stat = attendanceGrid[`${student.id}_${s.id}`]
                      if (stat === 'P') { pCount++; tMarked++ }
                      else if (stat === 'A') { tMarked++ }
                    })
                    const studentPerc = tMarked > 0 ? (pCount / tMarked) * 100 : 100
                    const isDefaulter = showDefaulters && studentPerc < defaulterThreshold

                    return (
                      <TableRow 
                        key={student.id} 
                        className={`transition-colors hover:bg-slate-50/50 ${isDefaulter ? 'bg-red-50/80 dark:bg-red-900/10' : ''}`}
                      >
                        <TableCell className={`sticky left-0 z-10 text-center border-r text-xs text-slate-400 ${isDefaulter ? 'bg-red-50/100 dark:bg-red-900/20' : 'bg-white dark:bg-slate-900'}`}>{idx + 1}</TableCell>
                        <TableCell className={`sticky left-[50px] z-10 border-r font-medium truncate max-w-[200px] ${isDefaulter ? 'bg-red-50/100 dark:bg-red-900/20 text-red-700' : 'bg-white dark:bg-slate-900'}`}>
                          {student.fullname}
                          {isDefaulter && <Badge variant="destructive" className="ml-2 scale-75 origin-left">Defaulter</Badge>}
                        </TableCell>
                        <TableCell className={`sticky left-[250px] z-10 border-r text-xs font-mono ${isDefaulter ? 'bg-red-50/100 dark:bg-red-900/20' : 'bg-white dark:bg-slate-900'}`}>
                          {student.roll_number || 'N/A'}
                        </TableCell>

                        {sessions.map(session => {
                          const status = attendanceGrid[`${student.id}_${session.id}`]
                          return (
                            <TableCell 
                              key={session.id} 
                              className={`text-center border-r p-0 cursor-pointer hover:bg-slate-100 transition-colors ${isDefaulter ? 'border-red-100' : ''}`}
                              onClick={() => toggleStatus(student.id, session.id)}
                            >
                              <div className="h-10 flex items-center justify-center select-none">
                                {status === 'P' && <Badge className="bg-emerald-500">P</Badge>}
                                {status === 'A' && <Badge className="bg-red-500">A</Badge>}
                                {!status && <span className="text-slate-200">●</span>}
                              </div>
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center p-20 text-slate-400">
                <p>No students found for this year.</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed rounded-xl">
           <p className="text-lg">Please select all parameters to load the attendance terminal</p>
        </div>
      )}

      <style jsx global>{`
        .shadow-premium {
          box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.05);
        }
      `}</style>
    </div>
  )
}
