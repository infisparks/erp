import type React from "react"
import BottomNav from "./_components/bottom-nav"

export default function StudentAppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-gray-100 flex justify-center items-start pt-0 sm:pt-10 font-sans">
            <div className="w-full max-w-md bg-gray-50 min-h-screen sm:min-h-[800px] sm:h-[85vh] sm:rounded-3xl shadow-2xl overflow-hidden relative flex flex-col sm:border-[8px] sm:border-gray-900">
                <div className="flex-1 overflow-y-auto pb-20 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                    {children}
                </div>
                <BottomNav />
            </div>
        </div>
    )
}
