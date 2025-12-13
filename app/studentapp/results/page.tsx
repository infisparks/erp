"use client"

import { ChevronLeft, Download, Award, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function ResultsPage() {
    const [activeSemester, setActiveSemester] = useState(6)

    const semesters = [
        { sem: 6, sgpa: 8.5, cgpa: 8.2, status: "Passed" },
        { sem: 5, sgpa: 8.0, cgpa: 8.1, status: "Passed" },
        { sem: 4, sgpa: 7.8, cgpa: 8.1, status: "Passed" },
        { sem: 3, sgpa: 8.2, cgpa: 8.2, status: "Passed" },
        { sem: 2, sgpa: 7.5, cgpa: 8.2, status: "Passed" },
        { sem: 1, sgpa: 7.9, cgpa: 8.3, status: "Passed" },
    ]

    const currentResults = [
        { subject: "Advanced Algorithms", code: "CS601", grade: "A", points: 9 },
        { subject: "Web Technologies", code: "CS602", grade: "A+", points: 10 },
        { subject: "Data Science", code: "CS603", grade: "B+", points: 8 },
        { subject: "Cloud Computing", code: "CS604", grade: "A", points: 9 },
        { subject: "Project Work", code: "CS605", grade: "O", points: 10 },
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
                <h1 className="text-lg font-bold">Results</h1>
            </div>

            <div className="p-5 space-y-6">
                {/* CGPA Card */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    <div className="flex justify-between items-center relative z-10">
                        <div>
                            <p className="text-indigo-100 text-sm font-medium mb-1">Overall CGPA</p>
                            <h2 className="text-4xl font-bold">8.2</h2>
                        </div>
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                            <Award className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-indigo-100 text-xs">
                        <TrendingUp className="w-4 h-4" />
                        <span>Top 10% of class</span>
                    </div>
                </div>

                {/* Semester Selector */}
                <div>
                    <h3 className="font-bold text-gray-800 mb-3">Semesters</h3>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {semesters.map((sem) => (
                            <button
                                key={sem.sem}
                                onClick={() => setActiveSemester(sem.sem)}
                                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-colors border ${activeSemester === sem.sem
                                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                                    }`}
                            >
                                Sem {sem.sem}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Result Details */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <div>
                            <h3 className="font-bold text-gray-800">Semester {activeSemester}</h3>
                            <p className="text-xs text-gray-500">SGPA: {semesters.find(s => s.sem === activeSemester)?.sgpa}</p>
                        </div>
                        <button className="flex items-center gap-1 text-indigo-600 text-xs font-semibold bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">
                            <Download className="w-3 h-3" /> Download
                        </button>
                    </div>

                    <div className="divide-y divide-gray-50">
                        {currentResults.map((subject, index) => (
                            <div key={index} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                <div>
                                    <h4 className="font-semibold text-gray-800 text-sm">{subject.subject}</h4>
                                    <p className="text-xs text-gray-500">{subject.code}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${subject.grade.startsWith('A') || subject.grade === 'O'
                                            ? 'bg-green-100 text-green-700'
                                            : subject.grade.startsWith('B')
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        Grade {subject.grade}
                                    </span>
                                    <p className="text-[10px] text-gray-400 mt-1">Points: {subject.points}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
