"use client"

import React, { useState, useMemo, useEffect, useRef } from "react"
import {
  Calendar as CalendarIcon,
  QrCode,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Filter,
  Download,
  Maximize2,
  Zap,
  RotateCcw,
  Save,
  ScanBarcode
} from "lucide-react"

// --- TYPES ---

type AttendanceStatus = "present" | "absent" | "late" | "unmarked"

interface Student {
  id: string
  rollNo: string
  name: string
  avatarColor: string
  status: AttendanceStatus
  lastScanTime?: string
}

// --- MOCK DATA GENERATOR ---

const generateStudents = (): Student[] => {
  const names = [
    "Aarav Sharma", "Vihaan Patel", "Aditya Verma", "Sai Khan", "Arjun Singh", 
    "Reyansh Das", "Rohan Nair", "Ishaan Mehta", "Vivaan Chopra", "Diya Desai", 
    "Saanvi Joshi", "Ananya Ansari", "Aadhya Shaikh", "Pari Reddy", "Fatima Gupta",
    "Zoya Malhotra", "Kiara Bhat", "Myra Iyer", "Riya Kulkarni", "Kabir Jadhav",
    "Neel Siddiqui", "Atharv Mishra", "Shivansh Gowda", "Ayaan Fernandes"
  ]
  
  const colors = ["bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-amber-500", "bg-rose-500", "bg-indigo-500"]

  return names.map((name, i) => ({
    id: (i + 1).toString(),
    rollNo: `25CE${(i + 1).toString().padStart(3, '0')}`,
    name: name.toUpperCase(),
    avatarColor: colors[i % colors.length],
    status: "unmarked"
  }))
}

// --- COMPONENT: STATUS BADGE ---

const StatusBadge = ({ status, size = "md" }: { status: AttendanceStatus, size?: "sm" | "md" | "lg" }) => {
  const styles = {
    present: "bg-emerald-100 text-emerald-700 border-emerald-200",
    absent: "bg-rose-100 text-rose-700 border-rose-200",
    late: "bg-amber-100 text-amber-700 border-amber-200",
    unmarked: "bg-slate-100 text-slate-500 border-slate-200"
  }

  const icons = {
    present: <CheckCircle2 className={size === "lg" ? "h-6 w-6" : "h-4 w-4"} />,
    absent: <XCircle className={size === "lg" ? "h-6 w-6" : "h-4 w-4"} />,
    late: <Clock className={size === "lg" ? "h-6 w-6" : "h-4 w-4"} />,
    unmarked: <div className="h-2 w-2 rounded-full bg-slate-400" />
  }

  const labels = {
    present: "Present",
    absent: "Absent",
    late: "Late Entry",
    unmarked: "Not Marked"
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-medium transition-all duration-200 ${styles[status]} ${size === "sm" ? "text-xs" : "text-sm"}`}>
      {icons[status]}
      <span>{labels[status]}</span>
    </span>
  )
}

// --- MAIN COMPONENT ---

export default function AttendancePage() {
  const [students, setStudents] = useState<Student[]>(generateStudents())
  const [mode, setMode] = useState<"manual" | "scanner">("manual")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("Data Structures (CS-201)")
  const [scanInput, setScanInput] = useState("")
  const [lastScannedStudent, setLastScannedStudent] = useState<Student | null>(null)
  const scannerInputRef = useRef<HTMLInputElement>(null)

  // --- LOGIC: STATS ---
  const stats = useMemo(() => {
    const total = students.length
    const present = students.filter(s => s.status === 'present').length
    const absent = students.filter(s => s.status === 'absent').length
    const late = students.filter(s => s.status === 'late').length
    const unmarked = students.filter(s => s.status === 'unmarked').length
    const attendancePercentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0

    return { total, present, absent, late, unmarked, attendancePercentage }
  }, [students])

  // --- LOGIC: MANUAL TOGGLE ---
  const toggleStatus = (id: string) => {
    setStudents(prev => prev.map(student => {
      if (student.id === id) {
        // Cycle: Unmarked -> Present -> Absent -> Late -> Unmarked
        const nextStatus: Record<AttendanceStatus, AttendanceStatus> = {
          unmarked: "present",
          present: "absent",
          absent: "late",
          late: "unmarked"
        }
        return { ...student, status: nextStatus[student.status] }
      }
      return student
    }))
  }

  // Quick Actions
  const markAll = (status: AttendanceStatus) => {
    setStudents(prev => prev.map(s => ({ ...s, status })))
  }

  // --- LOGIC: SCANNER ---
  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!scanInput) return

    // Find student by ID or Roll No
    const foundStudent = students.find(s => 
      s.rollNo.toLowerCase() === scanInput.toLowerCase() || 
      s.id === scanInput
    )

    if (foundStudent) {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      setStudents(prev => prev.map(s => 
        s.id === foundStudent.id ? { ...s, status: "present", lastScanTime: now } : s
      ))
      setLastScannedStudent({ ...foundStudent, status: "present", lastScanTime: now })
      setScanInput("")
      
      // Keep focus on input for rapid scanning
      setTimeout(() => scannerInputRef.current?.focus(), 10)
    } else {
      // Error feedback could go here
      setScanInput("")
    }
  }

  // Auto-focus scanner input when entering mode
  useEffect(() => {
    if (mode === "scanner") {
      scannerInputRef.current?.focus()
    }
  }, [mode])

  // --- UI PARTS ---

  const Header = () => (
    <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-200">
             <CalendarIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Attendance Register</h1>
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <span className="font-medium text-slate-700">{selectedSubject}</span>
              <span className="h-1 w-1 rounded-full bg-slate-300"></span>
              {currentDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex bg-slate-100 p-1 rounded-lg border border-slate-200">
             <button 
               onClick={() => setMode("manual")}
               className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${mode === 'manual' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-800'}`}
             >
               <Users className="h-4 w-4" /> Manual List
             </button>
             <button 
               onClick={() => setMode("scanner")}
               className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${mode === 'scanner' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-800'}`}
             >
               <QrCode className="h-4 w-4" /> QR / Barcode
             </button>
          </div>
          <button className="p-2.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 bg-white">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )

  const StatsBar = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="relative h-12 w-12 flex items-center justify-center">
           <svg className="h-full w-full rotate-[-90deg]" viewBox="0 0 36 36">
              <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
              <path className="text-blue-600 drop-shadow-sm transition-all duration-1000 ease-out" strokeDasharray={`${stats.attendancePercentage}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
           </svg>
           <span className="absolute text-xs font-bold text-slate-700">{stats.attendancePercentage}%</span>
        </div>
        <div>
           <p className="text-sm font-medium text-slate-500">Attendance Rate</p>
           <p className="text-lg font-bold text-slate-800">{stats.present + stats.late} / {stats.total}</p>
        </div>
      </div>

      <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-center justify-between group cursor-pointer hover:shadow-md transition-all">
        <div>
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Present</p>
          <p className="text-2xl font-bold text-emerald-800">{stats.present}</p>
        </div>
        <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        </div>
      </div>

      <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 flex items-center justify-between group cursor-pointer hover:shadow-md transition-all">
        <div>
          <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">Absent</p>
          <p className="text-2xl font-bold text-rose-800">{stats.absent}</p>
        </div>
        <div className="h-10 w-10 bg-rose-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
          <XCircle className="h-5 w-5 text-rose-600" />
        </div>
      </div>

      <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-center justify-between group cursor-pointer hover:shadow-md transition-all">
        <div>
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Late</p>
          <p className="text-2xl font-bold text-amber-800">{stats.late}</p>
        </div>
        <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
          <Clock className="h-5 w-5 text-amber-600" />
        </div>
      </div>
    </div>
  )

  const ManualView = () => (
    <div className="animate-in fade-in duration-300 space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
         <div className="relative w-full sm:w-64">
           <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
           <input 
             type="text" 
             placeholder="Search student..." 
             className="w-full pl-9 pr-4 h-10 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
           />
         </div>
         
         <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap mr-2">Quick Mark:</span>
            <button onClick={() => markAll('present')} className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-medium hover:bg-emerald-100 border border-emerald-100 transition-colors whitespace-nowrap">
              All Present
            </button>
            <button onClick={() => markAll('absent')} className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-sm font-medium hover:bg-rose-100 border border-rose-100 transition-colors whitespace-nowrap">
              All Absent
            </button>
            <button onClick={() => markAll('unmarked')} className="px-3 py-1.5 rounded-lg bg-slate-50 text-slate-600 text-sm font-medium hover:bg-slate-100 border border-slate-200 transition-colors whitespace-nowrap">
              Reset
            </button>
         </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map((student) => (
          <div 
            key={student.id} 
            onClick={() => toggleStatus(student.id)}
            className={`
              relative p-4 rounded-xl border cursor-pointer group transition-all duration-200 hover:shadow-md select-none
              ${student.status === 'present' ? 'bg-emerald-50/50 border-emerald-200' : 
                student.status === 'absent' ? 'bg-rose-50/50 border-rose-200' :
                student.status === 'late' ? 'bg-amber-50/50 border-amber-200' :
                'bg-white border-slate-200 hover:border-blue-300'}
            `}
          >
            <div className="flex items-start justify-between">
               <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-full ${student.avatarColor} text-white flex items-center justify-center font-bold text-lg shadow-sm`}>
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className={`font-semibold ${student.status === 'unmarked' ? 'text-slate-700' : 'text-slate-900'}`}>{student.name}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{student.rollNo}</p>
                  </div>
               </div>
               
               <div className="flex flex-col items-end gap-2">
                 <StatusBadge status={student.status} size="sm" />
                 {student.status === 'unmarked' && (
                   <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">Tap to mark</span>
                 )}
               </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Bottom Floating Save Action */}
      <div className="fixed bottom-6 right-6 z-30">
        <button className="bg-slate-900 text-white px-6 py-3 rounded-full shadow-xl shadow-slate-900/20 font-medium flex items-center gap-2 hover:bg-slate-800 transition-transform active:scale-95">
          <Save className="h-4 w-4" /> Save Attendance
        </button>
      </div>
    </div>
  )

  const ScannerView = () => (
    <div className="animate-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
       <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 p-8 text-center text-white relative overflow-hidden">
             <div className="relative z-10">
                <div className="mx-auto h-20 w-20 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm mb-4 border border-white/20">
                   <ScanBarcode className="h-10 w-10 text-blue-300" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Ready to Scan</h2>
                <p className="text-slate-300 text-sm">Use a barcode scanner or enter Roll No manually</p>
             </div>
             {/* Decorative circles */}
             <div className="absolute top-[-50%] left-[-20%] h-64 w-64 bg-blue-500/20 rounded-full blur-3xl"></div>
             <div className="absolute bottom-[-50%] right-[-20%] h-64 w-64 bg-purple-500/20 rounded-full blur-3xl"></div>
          </div>

          <div className="p-8 space-y-8">
             {/* Input Area */}
             <form onSubmit={handleScanSubmit} className="relative">
                <input 
                  ref={scannerInputRef}
                  type="text" 
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  placeholder="Scan or type ID..."
                  className="w-full h-16 pl-6 pr-14 rounded-xl border-2 border-slate-200 text-xl font-mono text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                  autoFocus
                />
                <button 
                  type="submit"
                  className="absolute right-3 top-3 h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center text-white hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
             </form>

             {/* Feedback Area */}
             {lastScannedStudent ? (
               <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-100 animate-in zoom-in-95 duration-300 text-center">
                  <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">{lastScannedStudent.name}</h3>
                  <p className="text-slate-500 font-mono mb-2">{lastScannedStudent.rollNo}</p>
                  <p className="text-sm font-medium text-emerald-700 bg-emerald-100/50 inline-block px-3 py-1 rounded-full">
                    Marked Present at {lastScannedStudent.lastScanTime}
                  </p>
               </div>
             ) : (
               <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Waiting for scan...</p>
               </div>
             )}

             <div className="border-t border-slate-100 pt-6">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Live Session Stats</h4>
                <div className="flex justify-between items-center text-center">
                   <div>
                     <p className="text-2xl font-bold text-slate-800">{stats.present}</p>
                     <p className="text-xs text-slate-500">Present</p>
                   </div>
                   <div className="h-8 w-px bg-slate-200"></div>
                   <div>
                     <p className="text-2xl font-bold text-slate-800">{stats.absent + stats.unmarked}</p>
                     <p className="text-xs text-slate-500">Remaining</p>
                   </div>
                   <div className="h-8 w-px bg-slate-200"></div>
                   <div>
                     <p className="text-2xl font-bold text-slate-800">{stats.attendancePercentage}%</p>
                     <p className="text-xs text-slate-500">Coverage</p>
                   </div>
                </div>
             </div>
          </div>
       </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StatsBar />
        
        {mode === "manual" ? <ManualView /> : <ScannerView />}
      </main>
    </div>
  )
}