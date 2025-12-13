"use client"

import { ChevronLeft, Clock, MapPin, Calendar } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function TimetablePage() {
    const [activeDay, setActiveDay] = useState("Mon")

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri"]

    const schedule = {
        Mon: [
            { time: "09:00 AM - 10:00 AM", subject: "Advanced Algorithms", type: "Lecture", room: "LH-101", faculty: "Dr. A. Verma" },
            { time: "10:00 AM - 11:00 AM", subject: "Web Technologies", type: "Lecture", room: "LH-102", faculty: "Prof. S. Gupta" },
            { time: "11:00 AM - 11:15 AM", subject: "Break", type: "Break", room: "-", faculty: "-" },
            { time: "11:15 AM - 01:15 PM", subject: "Web Tech Lab", type: "Lab", room: "Lab-2", faculty: "Prof. S. Gupta" },
        ],
        Tue: [
            { time: "09:00 AM - 10:00 AM", subject: "Data Science", type: "Lecture", room: "LH-103", faculty: "Dr. R. Singh" },
            { time: "10:00 AM - 11:00 AM", subject: "Cloud Computing", type: "Lecture", room: "LH-101", faculty: "Dr. K. Kumar" },
        ],
        Wed: [
            { time: "09:00 AM - 11:00 AM", subject: "Project Work", type: "Practical", room: "Lab-1", faculty: "Dr. A. Verma" },
            { time: "11:15 AM - 12:15 PM", subject: "Advanced Algorithms", type: "Lecture", room: "LH-101", faculty: "Dr. A. Verma" },
        ],
        Thu: [
            { time: "09:00 AM - 10:00 AM", subject: "Web Technologies", type: "Lecture", room: "LH-102", faculty: "Prof. S. Gupta" },
            { time: "10:00 AM - 11:00 AM", subject: "Data Science", type: "Lecture", room: "LH-103", faculty: "Dr. R. Singh" },
        ],
        Fri: [
            { time: "09:00 AM - 10:00 AM", subject: "Cloud Computing", type: "Lecture", room: "LH-101", faculty: "Dr. K. Kumar" },
            { time: "10:00 AM - 12:00 PM", subject: "Data Science Lab", type: "Lab", room: "Lab-3", faculty: "Dr. R. Singh" },
        ],
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
                <h1 className="text-lg font-bold">Timetable</h1>
            </div>

            <div className="p-5 space-y-6">
                {/* Day Selector */}
                <div className="flex justify-between items-center bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                    {days.map((day) => (
                        <button
                            key={day}
                            onClick={() => setActiveDay(day)}
                            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${activeDay === day
                                    ? "bg-indigo-600 text-white shadow-md"
                                    : "text-gray-500 hover:bg-gray-50"
                                }`}
                        >
                            {day}
                        </button>
                    ))}
                </div>

                {/* Schedule List */}
                <div className="space-y-4">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-indigo-600" /> {activeDay}'s Schedule
                    </h3>

                    {schedule[activeDay as keyof typeof schedule]?.map((item, index) => (
                        <div key={index} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.type === 'Lecture' ? 'bg-blue-500' :
                                    item.type === 'Lab' ? 'bg-purple-500' :
                                        item.type === 'Break' ? 'bg-gray-300' : 'bg-green-500'
                                }`}></div>

                            <div className="flex gap-4">
                                <div className="flex flex-col items-center justify-center min-w-[60px] border-r border-gray-100 pr-4">
                                    <span className="text-xs font-bold text-gray-500">{item.time.split(' - ')[0]}</span>
                                    <div className="w-1 h-8 border-l border-dashed border-gray-200 my-1"></div>
                                    <span className="text-xs font-bold text-gray-400">{item.time.split(' - ')[1]}</span>
                                </div>

                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-gray-800 text-sm">{item.subject}</h4>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${item.type === 'Lecture' ? 'bg-blue-50 text-blue-600' :
                                                item.type === 'Lab' ? 'bg-purple-50 text-purple-600' :
                                                    item.type === 'Break' ? 'bg-gray-100 text-gray-500' : 'bg-green-50 text-green-600'
                                            }`}>
                                            {item.type}
                                        </span>
                                    </div>

                                    {item.type !== 'Break' && (
                                        <div className="flex items-center gap-4 mt-2">
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <MapPin className="w-3 h-3" />
                                                {item.room}
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <Clock className="w-3 h-3" />
                                                {item.faculty}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
