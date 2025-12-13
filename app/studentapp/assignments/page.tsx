"use client"

import { ChevronLeft, FileText, Upload, CheckCircle, Clock, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function AssignmentsPage() {
    const assignments = [
        {
            id: 1,
            subject: "Advanced Algorithms",
            title: "Dynamic Programming Problem Set",
            dueDate: "14 Dec 2024",
            status: "Pending",
            type: "urgent"
        },
        {
            id: 2,
            subject: "Web Technologies",
            title: "React.js Portfolio Project",
            dueDate: "18 Dec 2024",
            status: "Pending",
            type: "normal"
        },
        {
            id: 3,
            subject: "Data Science",
            title: "Exploratory Data Analysis Report",
            dueDate: "10 Dec 2024",
            status: "Submitted",
            type: "done"
        },
    ]

    return (
        <div className="bg-gray-50 min-h-screen pb-24 font-sans text-gray-900">
            {/* Header */}
            <div className="bg-indigo-600 p-4 text-white flex items-center gap-4 sticky top-0 z-10 shadow-md">
                <Link href="/studentapp">
                    <button className="p-2 hover:bg-white/20 rounded-full transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                </Link>
                <h1 className="text-lg font-bold">Assignments</h1>
            </div>

            <div className="p-5 space-y-4">
                {assignments.map((task) => (
                    <div key={task.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${task.status === 'Submitted' ? 'bg-green-500' :
                                task.type === 'urgent' ? 'bg-red-500' : 'bg-blue-500'
                            }`}></div>

                        <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{task.subject}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${task.status === 'Submitted' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'
                                }`}>
                                {task.status}
                            </span>
                        </div>

                        <h3 className="font-bold text-gray-800 text-sm mb-3">{task.title}</h3>

                        <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                {task.status === 'Submitted' ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                    <Clock className={`w-4 h-4 ${task.type === 'urgent' ? 'text-red-500' : 'text-blue-500'}`} />
                                )}
                                <span>Due: {task.dueDate}</span>
                            </div>

                            {task.status !== 'Submitted' && (
                                <button className="flex items-center gap-1.5 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors">
                                    <Upload className="w-3 h-3" /> Upload
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
