"use client"

import { ChevronLeft, Briefcase, Building, MapPin, DollarSign, ExternalLink } from "lucide-react"
import Link from "next/link"

export default function PlacementsPage() {
    const jobs = [
        {
            id: 1,
            company: "Google",
            role: "Software Engineer Intern",
            location: "Bangalore",
            stipend: "₹80,000/mo",
            deadline: "20 Dec 2024",
            logo: "bg-red-50 text-red-600"
        },
        {
            id: 2,
            company: "Microsoft",
            role: "SDE - 1",
            location: "Hyderabad",
            stipend: "₹45 LPA",
            deadline: "25 Dec 2024",
            logo: "bg-blue-50 text-blue-600"
        },
        {
            id: 3,
            company: "Amazon",
            role: "Cloud Support Associate",
            location: "Pune",
            stipend: "₹18 LPA",
            deadline: "15 Jan 2025",
            logo: "bg-orange-50 text-orange-600"
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
                <h1 className="text-lg font-bold">Placements</h1>
            </div>

            <div className="p-5 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
                        <h3 className="text-3xl font-bold text-indigo-600">85%</h3>
                        <p className="text-xs text-gray-500 font-medium mt-1">Placement Rate</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
                        <h3 className="text-3xl font-bold text-green-600">12 LPA</h3>
                        <p className="text-xs text-gray-500 font-medium mt-1">Avg Package</p>
                    </div>
                </div>

                {/* Job Listings */}
                <div>
                    <h3 className="font-bold text-gray-800 mb-3 text-lg">New Opportunities</h3>
                    <div className="space-y-4">
                        {jobs.map((job) => (
                            <div key={job.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex gap-3 items-center">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${job.logo}`}>
                                            <Building className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-sm">{job.company}</h4>
                                            <p className="text-xs text-gray-500">{job.location}</p>
                                        </div>
                                    </div>
                                    <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-1 rounded-full">
                                        Apply by {job.deadline.split(' ')[0]} {job.deadline.split(' ')[1]}
                                    </span>
                                </div>

                                <h3 className="font-bold text-gray-800 mb-2">{job.role}</h3>

                                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                                    <div className="flex items-center gap-1">
                                        <Briefcase className="w-3 h-3" /> Full Time
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <DollarSign className="w-3 h-3" /> {job.stipend}
                                    </div>
                                </div>

                                <button className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                                    Apply Now <ExternalLink className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
