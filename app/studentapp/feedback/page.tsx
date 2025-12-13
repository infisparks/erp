"use client"

import { ChevronLeft, Star, Send, MessageSquare } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function FeedbackPage() {
    const [selectedFaculty, setSelectedFaculty] = useState<number | null>(null)
    const [rating, setRating] = useState(0)

    const facultyList = [
        { id: 1, name: "Dr. A. Verma", subject: "Advanced Algorithms", image: "bg-blue-100 text-blue-600" },
        { id: 2, name: "Prof. S. Gupta", subject: "Web Technologies", image: "bg-green-100 text-green-600" },
        { id: 3, name: "Dr. R. Singh", subject: "Data Science", image: "bg-purple-100 text-purple-600" },
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
                <h1 className="text-lg font-bold">Faculty Feedback</h1>
            </div>

            <div className="p-5 space-y-6">
                <p className="text-sm text-gray-500">Your feedback helps us improve the quality of education. All submissions are anonymous.</p>

                {/* Faculty List */}
                <div className="space-y-3">
                    {facultyList.map((faculty) => (
                        <div
                            key={faculty.id}
                            onClick={() => { setSelectedFaculty(faculty.id); setRating(0); }}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${selectedFaculty === faculty.id
                                    ? "bg-indigo-50 border-indigo-500 shadow-md"
                                    : "bg-white border-gray-100 shadow-sm hover:border-indigo-200"
                                }`}
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${faculty.image}`}>
                                {faculty.name.charAt(4)}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-800 text-sm">{faculty.name}</h3>
                                <p className="text-xs text-gray-500">{faculty.subject}</p>
                            </div>
                            {selectedFaculty === faculty.id && <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>}
                        </div>
                    ))}
                </div>

                {/* Rating Section */}
                {selectedFaculty && (
                    <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 animate-in slide-in-from-bottom-4 duration-300">
                        <h3 className="font-bold text-gray-800 text-center mb-4">Rate your experience</h3>
                        <div className="flex justify-center gap-2 mb-6">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setRating(star)}
                                    className={`p-2 transition-transform hover:scale-110 ${rating >= star ? 'text-yellow-400' : 'text-gray-200'}`}
                                >
                                    <Star className="w-8 h-8 fill-current" />
                                </button>
                            ))}
                        </div>

                        <div className="relative mb-4">
                            <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <textarea
                                placeholder="Write your comments here (optional)..."
                                className="w-full bg-gray-50 pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none h-24"
                            ></textarea>
                        </div>

                        <button className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors">
                            Submit Feedback <Send className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
