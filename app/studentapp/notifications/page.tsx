"use client"

import { ChevronLeft, Bell, Calendar, AlertCircle, Info } from "lucide-react"
import Link from "next/link"

export default function NotificationsPage() {
    const notifications = [
        {
            id: 1,
            title: "End Semester Exam Schedule Released",
            date: "12 Dec 2024",
            time: "10:30 AM",
            type: "urgent",
            description: "The end semester examination schedule for all B.Tech courses has been released. Please check the examination portal for detailed dates."
        },
        {
            id: 2,
            title: "Holiday on Friday (Guru Nanak Jayanti)",
            date: "10 Dec 2024",
            time: "09:00 AM",
            type: "info",
            description: "The college will remain closed on Friday, 15th Dec 2024 on account of Guru Nanak Jayanti."
        },
        {
            id: 3,
            title: "Library Due Date Extended",
            date: "08 Dec 2024",
            time: "02:15 PM",
            type: "info",
            description: "The last date for returning library books for this semester has been extended to 20th Dec 2024."
        },
        {
            id: 4,
            title: "Campus Recruitment Drive - TCS",
            date: "05 Dec 2024",
            time: "11:00 AM",
            type: "urgent",
            description: "TCS will be visiting the campus for recruitment on 25th Dec. Eligible students must register by 15th Dec."
        },
        {
            id: 5,
            title: "Annual Sports Meet Registration",
            date: "01 Dec 2024",
            time: "04:00 PM",
            type: "general",
            description: "Registration for the Annual Sports Meet is now open. Interested students can register at the sports complex."
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
                <h1 className="text-lg font-bold">Notifications</h1>
            </div>

            <div className="p-5 space-y-4">
                {notifications.map((notice) => (
                    <div key={notice.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${notice.type === 'urgent' ? 'bg-red-500' :
                                notice.type === 'info' ? 'bg-blue-500' : 'bg-gray-400'
                            }`}></div>

                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                {notice.type === 'urgent' ? (
                                    <AlertCircle className="w-4 h-4 text-red-500" />
                                ) : notice.type === 'info' ? (
                                    <Info className="w-4 h-4 text-blue-500" />
                                ) : (
                                    <Bell className="w-4 h-4 text-gray-400" />
                                )}
                                <span className={`text-xs font-bold uppercase tracking-wider ${notice.type === 'urgent' ? 'text-red-500' :
                                        notice.type === 'info' ? 'text-blue-500' : 'text-gray-500'
                                    }`}>
                                    {notice.type}
                                </span>
                            </div>
                            <span className="text-[10px] text-gray-400 font-medium">{notice.date}</span>
                        </div>

                        <h3 className="font-bold text-gray-800 text-sm mb-2 leading-snug">{notice.title}</h3>
                        <p className="text-xs text-gray-500 leading-relaxed mb-3">{notice.description}</p>

                        <div className="flex items-center gap-1 text-[10px] text-gray-400 border-t border-gray-50 pt-2">
                            <Calendar className="w-3 h-3" />
                            Posted at {notice.time}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
