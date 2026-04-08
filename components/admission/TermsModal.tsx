"use client"

import React, { useState, useRef, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { ShieldCheck, FileText, Info } from "lucide-react"

interface TermsModalProps {
  onAccept: () => void
}

export default function TermsModal({ onAccept }: TermsModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hasReadToBottom, setHasReadToBottom] = useState(false)
  const [isChecked, setIsChecked] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const accepted = localStorage.getItem("admission_terms_accepted")
    if (!accepted) {
      setIsOpen(true)
    }
  }, [])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    
    // Check if the user has scrolled to the bottom (with a small buffer)
    if (scrollHeight - scrollTop <= clientHeight + 20) {
      setHasReadToBottom(true)
    }
  }

  const handleAccept = () => {
    localStorage.setItem("admission_terms_accepted", "true")
    setIsOpen(false)
    onAccept()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      // Prevent closing if not accepted
      if (!open && !localStorage.getItem("admission_terms_accepted")) return
      setIsOpen(open)
    }}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl bg-white/95 backdrop-blur-md">
        <DialogHeader className="p-6 pb-2 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-t-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight">Student Declaration</DialogTitle>
          </div>
          <DialogDescription className="text-blue-100/80 text-sm">
            Please review the rules and regulations carefully before proceeding with your admission.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden p-6 pt-2">
          <div className="mb-4 flex items-center gap-2 p-3 bg-blue-50/50 rounded-lg border border-blue-100 text-blue-800 text-xs font-medium">
            <Info className="w-4 h-4" />
            <span>Scroll through the entire content to enable the accept button.</span>
          </div>

          <div 
            className="h-[400px] pr-4 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent rounded-xl border border-gray-100 bg-gray-50/30 shadow-inner"
            onScroll={handleScroll}
          >
            <div className="p-4 space-y-5 text-sm text-gray-700 leading-relaxed font-normal">
              <h3 className="font-bold text-gray-900 border-b pb-2 flex items-center gap-2 sticky top-0 bg-gray-50/95 backdrop-blur-sm z-10 py-2">
                <FileText className="w-4 h-4 text-blue-600" />
                DECLARATION BY THE STUDENT (In the presence of Parent/Guardian)
              </h3>
              
              <div className="space-y-4">
                <p className="font-medium italic text-gray-600 bg-white p-3 rounded-lg border border-gray-100 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                  I hereby undertake that,
                </p>

                {[
                  "I have read all the Rules of Admission and after understanding these rules thoroughly, I have filled in the application form of admission for the current year.",
                  "The information given by me in my application is true to the best of my knowledge and belief. I understand that if any of the statements made by me in the application form or any information supplied by me in connection with my admission is found to be false my admission will be cancelled, fees forfeited and I may be expelled from the college.",
                  "I have not been debarred from appearing at any examination held by any government constituted or statutory examination authority in India.",
                  "I fully understand that the offer of a course will be made to me depending on my inter se merit and availability of a seat at the time of counselling, when I will actually report to the admission authority according to the schedule of admission.",
                  "I understand that no document after the last date of submission will be entertained for the purpose of Claims or Concessions etc. in connection with my admission unless otherwise mentioned in the rules.",
                  "I am fully aware that the Competent Authority or its representative will not make any correspondence with me regarding admission. I am also aware that it is entirely my responsibility to see the notices on the notice boards of concerned Admission Centre.",
                  "I am that any rule imposed by the University such as imposing limits on the number of attempts permissible to pass any examination shall be binding on me.",
                  "I hereby agree to confirm to any Rules, Acts and Laws enforced by Government and I hereby undertake that, I will do nothing either inside or outside the college which may result in disciplinary prescribed action against me under these rules, acts and laws referred to.",
                  "I fully understand that the Director/Dean of the college where I am admitted, has a right to expel me from college for any infringement of the Rules of conduct and discipline prescribed by the college or University or Government and the undertaking given above.",
                  "I am fully aware that, I will not be allowed to appear for the examination if I do not attend minimum 75% classes of theory, practicals, drawings, etc.",
                  "I will compulsorily follow the dress code and code of conduct prescribed by the institution.",
                  "I will not use mobile phone within the campus during examination period / lectures/practicals and the phone shall be kept in 'switch-off-mode.",
                  "I hereby declare that the information given above is true to the best of my knowledge and belief.",
                  "In case of admission cancellation norms prescribe by admission authority will be followed.",
                  "Admission Process will be followed by CET cell Guidelines."
                ].map((text, i) => (
                  <div key={i} className="flex gap-4 group items-start">
                    <span className="flex-shrink-0 w-6 h-6 mt-0.5 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold group-hover:bg-blue-600 group-hover:text-white transition-all duration-200">
                      {(i + 1).toString().padStart(2, '0')}
                    </span>
                    <p className="flex-1 text-gray-600 group-hover:text-gray-900 transition-colors leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50/50 border-t flex flex-col gap-4">
          <div className="flex items-start space-x-3">
            <Checkbox 
              id="terms" 
              checked={isChecked} 
              onCheckedChange={(checked) => setIsChecked(checked as boolean)}
              className="mt-1"
            />
            <label 
              htmlFor="terms" 
              className="text-xs font-medium leading-relaxed text-gray-600 cursor-pointer select-none"
            >
              I certify that I have read and understand all the terms mentioned in the declaration and agree to abide by them.
            </label>
          </div>
          
          <Button 
            onClick={handleAccept} 
            disabled={!hasReadToBottom || !isChecked}
            className="w-full h-11 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-bold shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none transition-all duration-200 rounded-xl"
          >
            {hasReadToBottom ? "Accept and Proceed" : "Scroll down to accept"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
