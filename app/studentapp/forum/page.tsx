"use client"

import { ChevronLeft, MessageCircle, ThumbsUp, Share2, MoreHorizontal } from "lucide-react"
import Link from "next/link"

export default function ForumPage() {
    const posts = [
        {
            id: 1,
            user: "Rahul Sharma",
            avatar: "bg-blue-100 text-blue-600",
            time: "2 hours ago",
            content: "Does anyone have the previous year question papers for Advanced Algorithms? Need them urgently for prep!",
            tags: ["Exam Prep", "CS601"],
            likes: 12,
            comments: 5
        },
        {
            id: 2,
            user: "Priya Singh",
            avatar: "bg-pink-100 text-pink-600",
            time: "5 hours ago",
            content: "Lost my ID card near the canteen. If found, please submit it to the admin block or contact me.",
            tags: ["Lost & Found"],
            likes: 8,
            comments: 2
        },
        {
            id: 3,
            user: "Tech Club",
            avatar: "bg-purple-100 text-purple-600",
            time: "1 day ago",
            content: "Hackathon registration deadline extended by 2 days! Don't miss out on the chance to win prizes worth 50k.",
            tags: ["Events", "Hackathon"],
            likes: 45,
            comments: 10
        }
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
                <h1 className="text-lg font-bold">Student Forum</h1>
            </div>

            <div className="p-5 space-y-4">
                {/* Create Post Input */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-3 items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0"></div>
                    <input
                        type="text"
                        placeholder="Start a discussion..."
                        className="flex-1 bg-gray-50 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                </div>

                {/* Posts Feed */}
                {posts.map((post) => (
                    <div key={post.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex gap-3 items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${post.avatar}`}>
                                    {post.user.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800 text-sm">{post.user}</h4>
                                    <p className="text-xs text-gray-400">{post.time}</p>
                                </div>
                            </div>
                            <button className="text-gray-400 hover:text-gray-600">
                                <MoreHorizontal className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-sm text-gray-600 mb-3 leading-relaxed">{post.content}</p>

                        <div className="flex gap-2 mb-4">
                            {post.tags.map((tag, i) => (
                                <span key={i} className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                                    #{tag}
                                </span>
                            ))}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                            <button className="flex items-center gap-1.5 text-gray-500 hover:text-indigo-600 transition-colors text-xs font-bold">
                                <ThumbsUp className="w-4 h-4" /> {post.likes}
                            </button>
                            <button className="flex items-center gap-1.5 text-gray-500 hover:text-indigo-600 transition-colors text-xs font-bold">
                                <MessageCircle className="w-4 h-4" /> {post.comments}
                            </button>
                            <button className="flex items-center gap-1.5 text-gray-500 hover:text-indigo-600 transition-colors text-xs font-bold">
                                <Share2 className="w-4 h-4" /> Share
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
