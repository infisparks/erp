"use client"

import { ChevronLeft, FileText, Download, Folder, Search, Video, BookOpen } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function ResourcesPage() {
    const [activeTab, setActiveTab] = useState("notes")

    const resources = [
        { id: 1, title: "Data Structures & Algorithms", unit: "Unit 1 - Arrays & Linked Lists", type: "pdf", size: "2.4 MB", date: "12 Dec 2024" },
        { id: 2, title: "Web Technologies", unit: "Unit 3 - React Hooks", type: "pdf", size: "1.8 MB", date: "10 Dec 2024" },
        { id: 3, title: "Operating Systems", unit: "Unit 2 - Process Scheduling", type: "ppt", size: "5.1 MB", date: "08 Dec 2024" },
        { id: 4, title: "Database Management", unit: "Unit 4 - Normalization", type: "pdf", size: "3.2 MB", date: "05 Dec 2024" },
    ]

    const videos = [
        { id: 1, title: "Graph Traversal Algorithms (BFS/DFS)", duration: "45:20", faculty: "Dr. A. Verma", thumbnail: "bg-purple-100" },
        { id: 2, title: "Introduction to Next.js 14", duration: "1:12:00", faculty: "Prof. S. Gupta", thumbnail: "bg-blue-100" },
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
                <h1 className="text-lg font-bold">Study Resources</h1>
            </div>

            <div className="p-5 space-y-6">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search notes, papers, videos..."
                        className="w-full bg-white pl-10 pr-4 py-3 rounded-xl shadow-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                </div>

                {/* Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {['notes', 'papers', 'videos', 'labs'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-full text-sm font-bold capitalize whitespace-nowrap transition-all ${activeTab === tab
                                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                                    : "bg-white text-gray-500 border border-gray-200"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="space-y-4">
                    {activeTab === 'notes' && resources.map((item) => (
                        <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 group hover:shadow-md transition-all">
                            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-800 text-sm truncate">{item.title}</h3>
                                <p className="text-xs text-gray-500 truncate">{item.unit}</p>
                                <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                                    <span className="uppercase bg-gray-100 px-1.5 py-0.5 rounded">{item.type}</span>
                                    <span>{item.size}</span>
                                    <span>• {item.date}</span>
                                </div>
                            </div>
                            <button className="p-2 hover:bg-gray-50 rounded-full text-gray-400 hover:text-indigo-600 transition-colors">
                                <Download className="w-5 h-5" />
                            </button>
                        </div>
                    ))}

                    {activeTab === 'videos' && videos.map((video) => (
                        <div key={video.id} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex gap-4 group hover:shadow-md transition-all cursor-pointer">
                            <div className={`w-28 h-20 rounded-lg ${video.thumbnail} flex items-center justify-center relative shrink-0 overflow-hidden`}>
                                <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm">
                                    <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-indigo-600 border-b-[5px] border-b-transparent ml-1"></div>
                                </div>
                                <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 rounded font-medium">{video.duration}</span>
                            </div>
                            <div className="flex-1 py-1">
                                <h3 className="font-bold text-gray-800 text-sm line-clamp-2 leading-tight mb-1">{video.title}</h3>
                                <p className="text-xs text-gray-500">{video.faculty}</p>
                                <div className="mt-2 flex items-center gap-1 text-[10px] text-indigo-600 font-bold">
                                    <BookOpen className="w-3 h-3" /> Watch Lecture
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
