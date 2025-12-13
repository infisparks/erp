"use client"

import { ChevronLeft, MapPin, Armchair, Clock, Calendar } from "lucide-react"
import Link from "next/link"

export default function ExamSeatingPage() {
    const examDetails = {
        exam: "End Semester Examination - Dec 2024",
        subject: "Advanced Algorithms (CS601)",
        date: "12 Dec 2024",
        time: "10:00 AM - 01:00 PM",
        venue: "Examination Hall A",
        floor: "2nd Floor, Main Block",
        seat: "A-24"
    }

    return (
        <div className="bg-gray-50 min-h-screen pb-24 font-sans text-gray-900">
            {/* Header */}
            <div className="bg-indigo-600 p-4 text-white flex items-center gap-4 sticky top-0 z-10 shadow-md">
                <Link href="/studentapp">
                    <button className="p-2 hover:bg-white/20 rounded-full transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                </Link>
                <h1 className="text-lg font-bold">Exam Seating</h1>
            </div>

            <div className="p-5 space-y-6">
                {/* Ticket Card */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden relative">
                    <div className="bg-gray-900 p-6 text-white text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                        <h2 className="text-xl font-bold relative z-10">{examDetails.exam}</h2>
                        <p className="text-gray-400 text-sm mt-1 relative z-10">{examDetails.subject}</p>
                    </div>

                    <div className="p-6 relative">
                        {/* Cutout circles */}
                        <div className="absolute top-0 left-0 -mt-3 -ml-3 w-6 h-6 bg-gray-50 rounded-full"></div>
                        <div className="absolute top-0 right-0 -mt-3 -mr-3 w-6 h-6 bg-gray-50 rounded-full"></div>

                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Date</p>
                                <p className="font-bold text-gray-800 flex items-center gap-1 mt-1">
                                    <Calendar className="w-4 h-4 text-indigo-600" /> {examDetails.date}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Time</p>
                                <p className="font-bold text-gray-800 flex items-center gap-1 mt-1">
                                    <Clock className="w-4 h-4 text-indigo-600" /> {examDetails.time}
                                </p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Venue</p>
                                <p className="font-bold text-gray-800 flex items-center gap-1 mt-1">
                                    <MapPin className="w-4 h-4 text-indigo-600" /> {examDetails.venue}, {examDetails.floor}
                                </p>
                            </div>
                        </div>

                        <div className="border-t-2 border-dashed border-gray-100 pt-6 text-center">
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Your Seat Number</p>
                            <div className="inline-flex items-center justify-center w-24 h-24 bg-indigo-50 rounded-2xl border-2 border-indigo-100">
                                <div className="text-center">
                                    <Armchair className="w-8 h-8 text-indigo-600 mx-auto mb-1" />
                                    <span className="text-3xl font-black text-indigo-600">{examDetails.seat}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Instructions */}
                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                    <h3 className="font-bold text-yellow-800 text-sm mb-2">Important Instructions</h3>
                    <ul className="list-disc list-inside text-xs text-yellow-700 space-y-1">
                        <li>Carry your ID card and Hall Ticket.</li>
                        <li>Report to the hall 15 minutes before exam time.</li>
                        <li>Electronic gadgets are strictly prohibited.</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
