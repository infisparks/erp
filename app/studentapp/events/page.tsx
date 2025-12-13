"use client"

import { ChevronLeft, Calendar, MapPin, Users, ExternalLink, Clock } from "lucide-react"
import Link from "next/link"

export default function EventsPage() {
    const events = [
        {
            id: 1,
            title: "TechFest 2024",
            date: "25 Dec 2024",
            time: "10:00 AM",
            location: "Main Auditorium",
            category: "Technical",
            image: "bg-gradient-to-br from-purple-500 to-indigo-600"
        },
        {
            id: 2,
            title: "Annual Sports Meet",
            date: "15 Jan 2025",
            time: "08:00 AM",
            location: "Sports Complex",
            category: "Sports",
            image: "bg-gradient-to-br from-orange-400 to-red-500"
        },
        {
            id: 3,
            title: "Hackathon v2.0",
            date: "05 Feb 2025",
            time: "09:00 AM",
            location: "CS Department",
            category: "Coding",
            image: "bg-gradient-to-br from-blue-400 to-cyan-500"
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
                <h1 className="text-lg font-bold">Events & Clubs</h1>
            </div>

            <div className="p-5 space-y-6">
                {/* Featured Event */}
                <div className="relative rounded-2xl overflow-hidden shadow-lg h-48 group cursor-pointer">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10"></div>
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80')] bg-cover bg-center transition-transform duration-500 group-hover:scale-110"></div>

                    <div className="absolute bottom-0 left-0 right-0 p-5 z-20 text-white">
                        <span className="bg-indigo-600 text-xs font-bold px-2 py-1 rounded mb-2 inline-block">Featured</span>
                        <h2 className="text-xl font-bold mb-1">Cultural Night 2024</h2>
                        <p className="text-sm text-gray-200 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> 31st Dec • 6:00 PM
                        </p>
                    </div>
                </div>

                {/* Upcoming Events List */}
                <div>
                    <h3 className="font-bold text-gray-800 mb-3 text-lg">Upcoming Events</h3>
                    <div className="space-y-4">
                        {events.map((event) => (
                            <div key={event.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex group hover:shadow-md transition-all">
                                <div className={`w-24 ${event.image} flex flex-col items-center justify-center text-white p-2 shrink-0`}>
                                    <span className="text-xs font-medium opacity-80">{event.date.split(' ')[1]}</span>
                                    <span className="text-2xl font-bold">{event.date.split(' ')[0]}</span>
                                </div>

                                <div className="p-4 flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{event.category}</span>
                                        <ExternalLink className="w-3 h-3 text-gray-400" />
                                    </div>
                                    <h4 className="font-bold text-gray-800 text-sm mb-2">{event.title}</h4>

                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                            <Clock className="w-3 h-3" /> {event.time}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                            <MapPin className="w-3 h-3" /> {event.location}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
