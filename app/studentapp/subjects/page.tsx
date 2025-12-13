"use client"

import { ChevronLeft, BookOpen, User, BarChart, Book } from "lucide-react"
import Link from "next/link"

export default function SubjectsPage() {
    const subjects = [
        {
            id: 1,
            name: "Advanced Algorithms",
            code: "CS601",
            faculty: "Dr. A. Verma",
            attendance: 85,
            credits: 4,
            books: ["Introduction to Algorithms by CLRS", "Algorithm Design by Kleinberg"],
            color: "bg-blue-50 text-blue-600"
        },
        {
            id: 2,
            name: "Web Technologies",
            code: "CS602",
            faculty: "Prof. S. Gupta",
            attendance: 72,
            credits: 3,
            books: ["HTML & CSS: Design and Build Websites", "JavaScript: The Good Parts"],
            color: "bg-purple-50 text-purple-600"
        },
        {
            id: 3,
            name: "Data Science",
            code: "CS603",
            faculty: "Dr. R. Singh",
            attendance: 90,
            credits: 4,
            books: ["Python for Data Analysis", "Hands-On Machine Learning"],
            color: "bg-green-50 text-green-600"
        },
        {
            id: 4,
            name: "Cloud Computing",
            code: "CS604",
            faculty: "Dr. K. Kumar",
            attendance: 65,
            credits: 3,
            books: ["Cloud Computing: Concepts, Technology & Architecture"],
            color: "bg-orange-50 text-orange-600"
        },
        {
            id: 5,
            name: "Project Work",
            code: "CS605",
            faculty: "Dr. A. Verma",
            attendance: 100,
            credits: 2,
            books: ["-"],
            color: "bg-pink-50 text-pink-600"
        },
    ]

    return (
        <div className="bg-gray-50 min-h-screen pb-10 font-sans text-gray-900">
            {/* Header */}
            <div className="bg-indigo-600 p-4 text-white flex items-center gap-4 sticky top-0 z-10 shadow-md">
                <Link href="/studentapp">
                    <button className="p-2 hover:bg-white/20 rounded-full transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                </Link>
                <h1 className="text-lg font-bold">My Subjects</h1>
            </div>

            <div className="p-5 space-y-4">
                {subjects.map((subject) => (
                    <div key={subject.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex gap-3 items-center">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${subject.color}`}>
                                    <BookOpen className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 text-sm">{subject.name}</h3>
                                    <p className="text-xs text-gray-500">{subject.code} • {subject.credits} Credits</p>
                                </div>
                            </div>
                            <div className={`px-2 py-1 rounded-lg text-xs font-bold ${subject.attendance >= 75 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                {subject.attendance}%
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="text-xs font-medium">{subject.faculty}</span>
                            </div>

                            <div className="flex items-start gap-3 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                                <Book className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                <div className="flex flex-col gap-1">
                                    {subject.books.map((book, idx) => (
                                        <span key={idx} className="text-xs font-medium leading-tight">{book}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                            <span className="text-[10px] text-gray-400 font-medium">Last class: Yesterday</span>
                            <button className="text-indigo-600 text-xs font-bold flex items-center gap-1 hover:underline">
                                View Syllabus <ChevronLeft className="w-3 h-3 rotate-180" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
