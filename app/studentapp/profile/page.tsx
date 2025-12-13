"use client"

import { ChevronLeft, User, Mail, Phone, MapPin, Calendar, Book, LogOut } from "lucide-react"
import Link from "next/link"

export default function ProfilePage() {
    const student = {
        name: "Shaikh Mudassir",
        id: "STU-2024-001",
        course: "B.Tech Computer Science",
        semester: "6th Semester",
        dob: "15 Aug 2003",
        email: "rahul.sharma@example.com",
        phone: "+91 98765 43210",
        address: "123, Gandhi Nagar, New Delhi, India",
        guardian: "Mr. Suresh Sharma",
        guardianPhone: "+91 98765 43211",
        bloodGroup: "O+"
    }

    return (
        <div className="bg-gray-50 min-h-screen pb-10 font-sans text-gray-900">
            {/* Header */}
            <div className="bg-indigo-600 p-4 text-white flex items-center gap-4 sticky top-0 z-10 shadow-md">
                <Link href="/studentapp">
                    <button className="p-2 hover:bg-white/20 rounded-full transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                </Link>
                <h1 className="text-lg font-bold">My Profile</h1>
            </div>

            <div className="p-5 space-y-6">
                {/* Profile Card */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-indigo-50 to-white"></div>

                    <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 border-4 border-white shadow-lg relative z-10 mb-3">
                        <User className="w-10 h-10" />
                    </div>

                    <h2 className="text-xl font-bold text-gray-900">{student.name}</h2>
                    <p className="text-sm text-gray-500 mb-4">{student.id}</p>

                    <div className="flex gap-2">
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold">
                            {student.course}
                        </span>
                        <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-bold">
                            {student.semester}
                        </span>
                    </div>
                </div>

                {/* Personal Details */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="font-bold text-gray-800 text-sm">Personal Information</h3>
                    </div>
                    <div className="p-4 space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                                <Mail className="w-4 h-4 text-gray-500" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-medium">Email Address</p>
                                <p className="text-sm font-semibold text-gray-800">{student.email}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                                <Phone className="w-4 h-4 text-gray-500" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-medium">Phone Number</p>
                                <p className="text-sm font-semibold text-gray-800">{student.phone}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                                <Calendar className="w-4 h-4 text-gray-500" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-medium">Date of Birth</p>
                                <p className="text-sm font-semibold text-gray-800">{student.dob}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                                <MapPin className="w-4 h-4 text-gray-500" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-medium">Address</p>
                                <p className="text-sm font-semibold text-gray-800">{student.address}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Other Details */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="font-bold text-gray-800 text-sm">Other Details</h3>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-gray-400 font-medium">Guardian Name</p>
                            <p className="text-sm font-semibold text-gray-800">{student.guardian}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-medium">Guardian Phone</p>
                            <p className="text-sm font-semibold text-gray-800">{student.guardianPhone}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-medium">Blood Group</p>
                            <p className="text-sm font-semibold text-gray-800">{student.bloodGroup}</p>
                        </div>
                    </div>
                </div>

                <button className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
                    <LogOut className="w-4 h-4" /> Sign Out
                </button>
            </div>
        </div>
    )
}
