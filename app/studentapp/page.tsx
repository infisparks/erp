"use client"

import {
    Bell,
    BookOpen,
    Calendar,
    ChevronRight,
    Clock,
    CreditCard,
    GraduationCap,
    LayoutDashboard,
    User,
    AlertTriangle,
    FileText,
    Briefcase,
    QrCode,
    Utensils,
    Ticket,
    Folder,
    Bus,
    Armchair,
    Star,
    Search,
    BedDouble,
    MessageCircle,
    HelpCircle
} from "lucide-react"
import { useState } from "react"
import Link from "next/link"

export default function StudentDashboard() {
    const [student] = useState({
        name: "Rahul Sharma",
        id: "STU-2024-001",
        phone: "+91 98765 43210",
        course: "B.Tech Computer Science",
        semester: "6th Semester",
        attendance: 72,
        feesPending: 15000,
        feesDueDate: "2024-04-15",
    })

    const notices = [
        { id: 1, title: "End Semester Exam Schedule", date: "12 Dec 2024", type: "urgent" },
        { id: 2, title: "Holiday on Friday (Guru Nanak Jayanti)", date: "10 Dec 2024", type: "info" },
    ]

    const subjects = [
        { name: "Advanced Algorithms", code: "CS601", faculty: "Dr. A. Verma" },
        { name: "Web Technologies", code: "CS602", faculty: "Prof. S. Gupta" },
        { name: "Data Science", code: "CS603", faculty: "Dr. R. Singh" },
    ]

    return (
        <div className="pb-20 bg-gray-50 min-h-screen font-sans text-gray-900">
            {/* Header */}
            <header className="bg-indigo-600 text-white p-6 rounded-b-3xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
                <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 bg-white opacity-10 rounded-full blur-xl"></div>

                <div className="flex justify-between items-start mb-6 relative z-10">
                    <div>
                        <p className="text-indigo-100 text-sm font-medium">Welcome back,</p>
                        <h1 className="text-2xl font-bold">{student.name}</h1>
                        <p className="text-indigo-200 text-xs mt-1">{student.phone}</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm cursor-pointer hover:bg-white/30 transition-colors flex flex-col items-center justify-center w-12 h-12">
                            <QrCode className="w-6 h-6 text-white" />
                        </div>
                        <Link href="/studentapp/profile">
                            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm cursor-pointer hover:bg-white/30 transition-colors flex flex-col items-center justify-center w-12 h-12">
                                <User className="w-6 h-6 text-white" />
                            </div>
                        </Link>
                    </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 flex justify-between items-center border border-white/10 relative z-10">
                    <div>
                        <p className="text-indigo-100 text-xs">Student ID</p>
                        <p className="font-semibold">{student.id}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-indigo-100 text-xs">Course</p>
                        <p className="font-semibold text-sm">{student.course}</p>
                    </div>
                </div>
            </header>

            <div className="p-5 space-y-6">
                {/* Attendance Card */}
                <section>
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-indigo-600" /> Attendance
                        </h2>
                        <span className="text-xs font-medium text-gray-500">Updated Today</span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-500 text-sm mb-1">Total Attendance</p>
                                <div className="flex items-baseline gap-1">
                                    <span className={`text-4xl font-bold ${student.attendance < 75 ? 'text-red-500' : 'text-green-500'}`}>
                                        {student.attendance}%
                                    </span>
                                    <span className="text-gray-400 text-sm">/ 100%</span>
                                </div>
                            </div>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${student.attendance < 75 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                                <div className="text-xs font-bold">{student.attendance}%</div>
                            </div>
                        </div>

                        {student.attendance < 75 && (
                            <div className="mt-4 bg-red-50 border border-red-100 rounded-xl p-3 flex gap-3 items-start">
                                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-red-700 font-semibold text-sm">Low Attendance Warning</p>
                                    <p className="text-red-600 text-xs mt-0.5">Your attendance is below 75%. Please attend more classes to avoid debarment.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Fees Card */}
                <section>
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-indigo-600" /> Fees Status
                        </h2>
                    </div>
                    <Link href="/studentapp/fees" className="block">
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-5 rounded-2xl shadow-lg text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 opacity-10 rounded-full blur-2xl -mr-10 -mt-10"></div>

                            <p className="text-gray-400 text-sm mb-1">Remaining Amount</p>
                            <h3 className="text-3xl font-bold mb-4">₹ {student.feesPending.toLocaleString('en-IN')}</h3>

                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 flex gap-3 items-center">
                                <Calendar className="w-5 h-5 text-orange-400" />
                                <div>
                                    <p className="text-orange-300 text-xs font-medium uppercase tracking-wider">Due Date</p>
                                    <p className="text-white text-sm font-semibold">{student.feesDueDate}</p>
                                </div>
                            </div>
                            <button className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors shadow-lg shadow-indigo-900/20 group-hover:scale-[1.02] transform duration-200">
                                Pay Now
                            </button>
                        </div>
                    </Link>
                </section>

                {/* Quick Actions Grid */}
                <section className="grid grid-cols-4 gap-3">
                    <Link href="/studentapp/results" className="block">
                        <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer group h-full aspect-square">
                            <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                                <GraduationCap className="w-5 h-5 text-purple-600" />
                            </div>
                            <span className="font-semibold text-gray-700 text-[10px] text-center leading-tight">Results</span>
                        </div>
                    </Link>
                    <Link href="/studentapp/timetable" className="block">
                        <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer group h-full aspect-square">
                            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <span className="font-semibold text-gray-700 text-[10px] text-center leading-tight">Timetable</span>
                        </div>
                    </Link>
                    <Link href="/studentapp/library" className="block">
                        <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer group h-full aspect-square">
                            <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                                <BookOpen className="w-5 h-5 text-orange-600" />
                            </div>
                            <span className="font-semibold text-gray-700 text-[10px] text-center leading-tight">Library</span>
                        </div>
                    </Link>
                    <Link href="/studentapp/assignments" className="block">
                        <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer group h-full aspect-square">
                            <div className="w-10 h-10 bg-pink-50 rounded-full flex items-center justify-center group-hover:bg-pink-100 transition-colors">
                                <Clock className="w-5 h-5 text-pink-600" />
                            </div>
                            <span className="font-semibold text-gray-700 text-[10px] text-center leading-tight">Tasks</span>
                        </div>
                    </Link>
                    <Link href="/studentapp/events" className="block">
                        <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer group h-full aspect-square">
                            <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                                <Calendar className="w-5 h-5 text-teal-600" />
                            </div>
                            <span className="font-semibold text-gray-700 text-[10px] text-center leading-tight">Events</span>
                        </div>
                    </Link>
                    <Link href="/studentapp/placements" className="block">
                        <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer group h-full aspect-square">
                            <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                                <Briefcase className="w-5 h-5 text-indigo-600" />
                            </div>
                            <span className="font-semibold text-gray-700 text-[10px] text-center leading-tight">Jobs</span>
                        </div>
                    </Link>
                    <Link href="/studentapp/attendance-qr" className="block">
                        <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer group h-full aspect-square">
                            <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center group-hover:bg-gray-800 transition-colors">
                                <QrCode className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-semibold text-gray-700 text-[10px] text-center leading-tight">Attendance QR</span>
                        </div>
                    </Link>

                    <Link href="/studentapp/canteen" className="block">
                        <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer group h-full aspect-square">
                            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center group-hover:bg-red-100 transition-colors">
                                <Utensils className="w-5 h-5 text-red-600" />
                            </div>
                            <span className="font-semibold text-gray-700 text-[10px] text-center leading-tight">Canteen</span>
                        </div>
                    </Link>
                    <Link href="/studentapp/resources" className="block">
                        <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer group h-full aspect-square">
                            <div className="w-10 h-10 bg-cyan-50 rounded-full flex items-center justify-center group-hover:bg-cyan-100 transition-colors">
                                <Folder className="w-5 h-5 text-cyan-600" />
                            </div>
                            <span className="font-semibold text-gray-700 text-[10px] text-center leading-tight">Resources</span>
                        </div>
                    </Link>
                    <Link href="/studentapp/exam-seating" className="block">
                        <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer group h-full aspect-square">
                            <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                                <Armchair className="w-5 h-5 text-indigo-600" />
                            </div>
                            <span className="font-semibold text-gray-700 text-[10px] text-center leading-tight">Exam Seat</span>
                        </div>
                    </Link>
                    <Link href="/studentapp/feedback" className="block">
                        <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer group h-full aspect-square">
                            <div className="w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center group-hover:bg-yellow-100 transition-colors">
                                <Star className="w-5 h-5 text-yellow-600" />
                            </div>
                            <span className="font-semibold text-gray-700 text-[10px] text-center leading-tight">Feedback</span>
                        </div>
                    </Link>
                    <Link href="/studentapp/lost-found" className="block">
                        <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer group h-full aspect-square">
                            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center group-hover:bg-red-100 transition-colors">
                                <Search className="w-5 h-5 text-red-600" />
                            </div>
                            <span className="font-semibold text-gray-700 text-[10px] text-center leading-tight">Lost & Found</span>
                        </div>
                    </Link>
                    <Link href="/studentapp/hostel" className="block">
                        <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer group h-full aspect-square">
                            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center group-hover:bg-green-100 transition-colors">
                                <BedDouble className="w-5 h-5 text-green-600" />
                            </div>
                            <span className="font-semibold text-gray-700 text-[10px] text-center leading-tight">Hostel</span>
                        </div>
                    </Link>
                    <Link href="/studentapp/forum" className="block">
                        <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer group h-full aspect-square">
                            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                <MessageCircle className="w-5 h-5 text-blue-600" />
                            </div>
                            <span className="font-semibold text-gray-700 text-[10px] text-center leading-tight">Forum</span>
                        </div>
                    </Link>
                    <Link href="/studentapp/helpdesk" className="block">
                        <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer group h-full aspect-square">
                            <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                                <HelpCircle className="w-5 h-5 text-teal-600" />
                            </div>
                            <span className="font-semibold text-gray-700 text-[10px] text-center leading-tight">Helpdesk</span>
                        </div>
                    </Link>
                </section>
                {/* Notices */}
                <section>
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                            <Bell className="w-5 h-5 text-indigo-600" /> Notice Board
                        </h2>
                        <Link href="/studentapp/notifications" className="text-indigo-600 text-xs font-semibold hover:underline">View All</Link>
                    </div>
                    <div className="space-y-3">
                        {notices.map((notice) => (
                            <div key={notice.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 items-start">
                                <div className={`w-2 h-full min-h-[40px] rounded-full shrink-0 ${notice.type === 'urgent' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-800 text-sm leading-tight mb-1">{notice.title}</h4>
                                    <p className="text-xs text-gray-500">{notice.date}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300 mt-1" />
                            </div>
                        ))}
                    </div>
                </section>

                {/* Subjects */}
                <section>
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-indigo-600" /> My Subjects
                        </h2>
                        <Link href="/studentapp/subjects" className="text-indigo-600 text-xs font-semibold hover:underline">View Details</Link>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {subjects.map((subject, index) => (
                            <div key={index} className="p-4 border-b border-gray-50 last:border-0 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                <div>
                                    <h4 className="font-semibold text-gray-800 text-sm">{subject.name}</h4>
                                    <p className="text-xs text-gray-500">{subject.code} • {subject.faculty}</p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                    <span className="text-xs font-bold text-gray-600">{subject.name.charAt(0)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    )
}
