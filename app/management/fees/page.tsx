// e.g., app/dashboard/fees/page.tsx
"use client"

import React, { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"

// --- UI Components ---
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// --- Icons ---
import { ChevronRight, Loader2, AlertTriangle, Save, GraduationCap, IndianRupee, Info, Calendar } from "lucide-react"

// --- UI Components ---
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"

// --- PrimeReact Components ---
import { InputNumber } from 'primereact/inputnumber'; // <-- For currency input

// --- PrimeReact CSS ---
import "primereact/resources/themes/saga-blue/theme.css"
import "primereact/resources/primereact.min.css"
import "primeicons/primeicons.css"

// --- Type Definitions ---
interface Course {
  id: string
  name: string
  description?: string
  stream_id: string
}

interface ScholarshipCategory {
  id: string
  name: string
  description?: string
}

interface YearCategory {
  id: string
  name: string
}

/**
 * Main Financial Management Page
 * Handles Course Fees (per Year Category) and Scholarships (per Category)
 */
export default function FeeStructurePage() {
  // --- Data State ---
  const [courses, setCourses] = useState<Course[]>([])
  const [scholarshipCategories, setScholarshipCategories] = useState<ScholarshipCategory[]>([])
  const [yearCategories, setYearCategories] = useState<YearCategory[]>([])
  
  // --- Selection & Edit State ---
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [activeTab, setActiveTab] = useState("fees")

  // Fees State (Stored per Year Category ID)
  const [currentFees, setCurrentFees] = useState<Record<string, number>>({})
  const [editFees, setEditFees] = useState<Record<string, number>>({})

  // Scholarships State (Calculated amount given to student per Category)
  const [currentScholarships, setCurrentScholarships] = useState<Record<string, { amount: number; description: string }>>({})
  const [editScholarships, setEditScholarships] = useState<Record<string, { amount: number; description: string }>>({})

  // --- Loading & Error State ---
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [loadingData, setLoadingData] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = getSupabaseClient()

  // --- Data Fetching ---

  // Initial loads: Courses, Categories, and Year Master List
  useEffect(() => {
    const init = async () => {
      setLoadingInitial(true)
      try {
        const [cRes, catRes, yearRes] = await Promise.all([
          supabase.from("courses").select("*").order("name"),
          supabase.from("scholarship_categories").select("*").order("name"),
          supabase.from("year_category").select("*").order("name")
        ])

        if (cRes.error) throw cRes.error
        if (catRes.error) throw catRes.error
        if (yearRes.error) throw yearRes.error

        setCourses(cRes.data || [])
        setScholarshipCategories(catRes.data || [])
        setYearCategories(yearRes.data || [])
      } catch (err: any) {
        setError(err.message || "Failed to initialize financial setup.")
      } finally {
        setLoadingInitial(false)
      }
    }
    init()
  }, [supabase])

  // Fetch Session-specific Fees & Scholarships when selectedCourse changes
  useEffect(() => {
    if (!selectedCourse) {
      setCurrentFees({})
      setEditFees({})
      setCurrentScholarships({})
      setEditScholarships({})
      return
    }

    const fetchData = async () => {
      setLoadingData(true)
      setEditFees({})
      setEditScholarships({})
      setSuccess(null)
      setError(null)
      
      try {
        const [feesRes, schRes] = await Promise.all([
          supabase.from("course_fees").select("academic_year_id, amount").eq("course_id", selectedCourse.id),
          supabase.from("scholarship_amounts").select("category_id, amount, description").eq("course_id", selectedCourse.id)
        ])

        if (feesRes.error) throw feesRes.error
        if (schRes.error) throw schRes.error

        // Map Fees (Key: Academic Year ID)
        const feeMap = (feesRes.data || []).reduce((acc: any, fee: any) => {
          acc[fee.academic_year_id] = fee.amount
          return acc
        }, {})
        setCurrentFees(feeMap)

        // Map Scholarships (Key: Scholarship Category ID)
        const schMap = (schRes.data || []).reduce((acc: any, sch: any) => {
          acc[sch.category_id] = { amount: sch.amount, description: sch.description || "" }
          return acc
        }, {})
        setCurrentScholarships(schMap)

      } catch (err: any) {
        setError("Failed to load financial configurations.")
      } finally {
        setLoadingData(false)
      }
    }
    
    fetchData()
  }, [selectedCourse, supabase])

  const handleCreateYearCategory = async (name: string) => {
    if (!name.trim()) return
    setError(null)
    try {
      const { data, error } = await supabase
        .from("year_category")
        .insert([{ name }])
        .select()
        .single()
      
      if (error) throw error
      if (data) setYearCategories(prev => [...prev, data])
      setSuccess(`Year Category '${name}' created!`)
    } catch (err: any) {
      setError(err.message || "Failed to create category.")
    }
  }

  // --- Form Handlers ---

  const handleFeeChange = (yearId: string, value: number | null | undefined) => {
    setSuccess(null)
    setEditFees(prev => ({
      ...prev,
      [yearId]: value ?? 0,
    }))
  }

  const handleScholarshipChange = (categoryId: string, field: 'amount' | 'description', value: any) => {
    setSuccess(null)
    setEditScholarships(prev => {
      const current = prev[categoryId] || currentScholarships[categoryId] || { amount: 0, description: "" }
      return {
        ...prev,
        [categoryId]: { ...current, [field]: value }
      }
    })
  }

  const handleFeeSave = async () => {
    if (!selectedCourse || Object.keys(editFees).length === 0) return
    setIsSubmitting(true)
    setError(null)
    try {
      const upsertArray = Object.entries(editFees).map(([yearId, amount]) => ({
        course_id: selectedCourse.id,
        academic_year_id: yearId,
        amount,
      }))
      const { error } = await supabase.from("course_fees").upsert(upsertArray, { onConflict: 'course_id, academic_year_id' })
      if (error) throw error
      setCurrentFees(prev => ({ ...prev, ...editFees }))
      setEditFees({})
      setSuccess("Annual course fees updated successfully!")
    } catch (err: any) {
      setError(err.message || "Failed to save fees.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleScholarshipSave = async () => {
    if (!selectedCourse || Object.keys(editScholarships).length === 0) return
    setIsSubmitting(true)
    setError(null)
    try {
      const upsertArray = Object.entries(editScholarships).map(([catId, data]) => ({
        course_id: selectedCourse.id,
        category_id: catId,
        amount: data.amount,
        description: data.description,
      }))
      const { error } = await supabase.from("scholarship_amounts").upsert(upsertArray, { onConflict: 'course_id, category_id' })
      if (error) throw error
      setCurrentScholarships(prev => ({ ...prev, ...editScholarships }))
      setEditScholarships({})
      setSuccess("Category scholarship benefits updated successfully!")
    } catch (err: any) {
      setError(err.message || "Failed to save scholarships.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasUnsavedFees = Object.keys(editFees).length > 0;
  const hasUnsavedScholarships = Object.keys(editScholarships).length > 0;
  const isModified = activeTab === "fees" ? hasUnsavedFees : hasUnsavedScholarships;

  // --- Render ---

  if (loadingInitial) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 1. Page Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Fee Structure Setup</h1>
        <p className="text-slate-400 text-sm mt-0.5">Configure course fees and category-wise scholarship deductions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* --- Column 1: Course Selection --- */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-5 border-b border-slate-100 flex items-center gap-3">
            <div className="h-9 w-9 bg-emerald-50 rounded-xl flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-sm">Select Course</h2>
              <p className="text-[10px] text-slate-400">{courses.length} courses available</p>
            </div>
          </div>
          <div className="p-3 space-y-1 max-h-[70vh] overflow-y-auto">
            {courses.map(course => (
              <ListItem
                key={course.id}
                name={course.name}
                isActive={selectedCourse?.id === course.id}
                onClick={() => setSelectedCourse(course)}
              />
            ))}
          </div>
        </div>

        {/* --- Column 2: Configuration Panel --- */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-6 pt-6 pb-0 border-b border-slate-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Active Course</span>
                  <h2 className="text-xl font-black text-slate-900 mt-0.5">
                    {selectedCourse ? selectedCourse.name : "Choose a Course"}
                  </h2>
                </div>
                <TabsList className="bg-slate-100 p-1 rounded-xl">
                  <TabsTrigger value="fees" className="rounded-lg font-bold px-6 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-700 text-slate-500 text-[12px]">Admission Fees</TabsTrigger>
                  <TabsTrigger value="scholarships" className="rounded-lg font-bold px-6 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-700 text-slate-500 text-[12px]">Scholarships</TabsTrigger>
                </TabsList>
              </div>
            </div>

            <div className="px-6 py-6">
              {!selectedCourse ? (
                <div className="py-40 text-center">
                   <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-white shadow-inner">
                      <Info className="h-12 w-12 text-slate-300" />
                   </div>
                   <h3 className="text-2xl font-black text-slate-900 mb-3">No Course Selected</h3>
                   <p className="text-slate-500 max-w-sm mx-auto font-medium">Please select a course from the sidebar to view or edit its financial structure.</p>
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                  {error && (
                    <Alert variant="destructive" className="mb-8 rounded-2xl border-red-100 bg-red-50 text-red-900 py-6">
                      <AlertTriangle className="h-6 w-6" />
                      <AlertTitle className="font-bold text-lg">System Error</AlertTitle>
                      <AlertDescription className="font-medium">{error}</AlertDescription>
                    </Alert>
                  )}
                  {success && !isModified && (
                    <Alert className="mb-8 bg-emerald-50 border-emerald-100 text-emerald-900 rounded-2xl py-6">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-emerald-100 rounded-full">
                          <Info className="h-5 w-5 text-emerald-600" />
                        </div>
                        <AlertDescription className="font-bold text-lg">{success}</AlertDescription>
                      </div>
                    </Alert>
                  )}

                  {loadingData ? (
                     <div className="py-32 flex flex-col items-center justify-center space-y-6">
                        <div className="relative">
                          <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl scale-150 animate-pulse" />
                          <Loader2 className="h-12 w-12 animate-spin text-blue-600 relative" />
                        </div>
                        <p className="text-slate-500 font-bold text-lg">Synchronizing data...</p>
                     </div>
                  ) : (
                    <>
                      {/* --- Tab 1: Base Fees (Per Academic Year) --- */}
                      <TabsContent value="fees" className="mt-0 space-y-5">
                        <div className="flex items-center justify-between mb-6">
                           <div className="flex items-center gap-2">
                             <Calendar className="h-5 w-5 text-slate-400" />
                             <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">Uniform Fees Per Admission Session</p>
                           </div>
                           <button 
                             className="h-8 px-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-[11px] font-bold hover:bg-emerald-100 transition-colors"
                             onClick={() => {
                               const name = prompt("Enter New Year Category Name (e.g. 2027-28):")
                               if (name) handleCreateYearCategory(name)
                             }}
                           >
                             + Add Year
                           </button>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          {yearCategories.map(year => {
                            const value = editFees[year.id] ?? currentFees[year.id] ?? 0;
                            return (
                              <div key={year.id} className="group flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 border border-slate-100 rounded-3xl bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-blue-50 transition-all duration-300 gap-6">
                                <div className="space-y-1">
                                  <Label className="font-black text-slate-900 block text-lg group-hover:text-blue-700 transition-colors">
                                    {year.name}
                                  </Label>
                                  <span className="text-sm text-slate-400 font-bold">Standard tuition for this Year Category</span>
                                </div>
                                <div className="relative">
                                  <InputNumber
                                    value={value}
                                    onValueChange={(e) => handleFeeChange(year.id, e.value)}
                                    mode="decimal"
                                    prefix="₹ "
                                    inputClassName="w-full sm:w-56 text-right font-black text-slate-900 bg-white border border-slate-200 rounded-2xl p-4 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-xl"
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </TabsContent>

                      {/* --- Tab 2: Scholarships (Per Category) --- */}
                      <TabsContent value="scholarships" className="mt-0 space-y-5">
                         <div className="flex items-center gap-2 mb-6">
                           <IndianRupee className="h-5 w-5 text-slate-400" />
                           <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">Category-wise Scholarship Deductions</p>
                        </div>
                        <div className="grid grid-cols-1 gap-6">
                          {scholarshipCategories.map(category => {
                            const data = editScholarships[category.id] || currentScholarships[category.id] || { amount: 0, description: "" }
                            return (
                              <div key={category.id} className="p-6 border border-slate-100 rounded-3xl bg-slate-50/50 space-y-5 hover:bg-white hover:border-blue-200 transition-all duration-300 hover:shadow-xl hover:shadow-blue-50">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                                  <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-100 rounded-2xl group-hover:bg-blue-600 transition-colors">
                                       <IndianRupee className="h-6 w-6 text-blue-700 group-hover:text-white" />
                                    </div>
                                    <div>
                                      <Label className="font-black text-slate-900 text-lg">
                                        {category.name}
                                      </Label>
                                      <p className="text-xs font-bold text-slate-400">Total benefit for {category.name} students</p>
                                    </div>
                                  </div>
                                  <div className="w-full sm:w-1/3">
                                    <InputNumber
                                      value={data.amount}
                                      onValueChange={(e) => handleScholarshipChange(category.id, 'amount', e.value)}
                                      mode="decimal"
                                      prefix="₹ "
                                      placeholder="Amount"
                                      inputClassName="w-full text-right font-black text-blue-700 bg-blue-50/50 border border-blue-100 rounded-2xl p-4 focus:ring-4 focus:ring-blue-200 outline-none transition-all text-xl"
                                    />
                                  </div>
                                </div>
                                <div className="relative">
                                  <Input
                                    placeholder="e.g., Only for Maharashtra domicile students..."
                                    value={data.description}
                                    onChange={(e) => handleScholarshipChange(category.id, 'description', e.target.value)}
                                    className="pl-12 h-14 bg-slate-100/50 border-none text-slate-700 focus-visible:ring-4 focus-visible:ring-blue-100 rounded-2xl font-medium placeholder:text-slate-400"
                                  />
                                  <Info className="absolute left-4 top-4.5 h-5 w-5 text-slate-400 font-bold" />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </TabsContent>

                      <div className="flex justify-end pt-6 mt-6 border-t border-slate-100">
                        <button
                          onClick={activeTab === "fees" ? handleFeeSave : handleScholarshipSave}
                          disabled={!isModified || isSubmitting}
                          className="h-12 px-8 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2"
                        >
                          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          Update {activeTab === "fees" ? "Admission Fees" : "Category Benefits"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

// --- Helper Components ---

const ListItem: React.FC<{
  name: string
  isActive: boolean
  onClick: () => void
}> = ({ name, isActive, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full px-4 py-3.5 text-left rounded-xl border transition-all flex justify-between items-center group
      ${isActive
        ? "bg-[#0F1923] border-[#0F1923] text-white shadow-lg"
        : "bg-transparent border-transparent hover:bg-slate-50 hover:border-slate-100 text-slate-600"
      }`}
  >
    <span className={`font-semibold text-[13px] tracking-tight ${isActive ? 'text-white' : 'text-slate-700'}`}>
      {name}
    </span>
    <ChevronRight className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${isActive ? 'text-white/50' : 'text-slate-300'}`} />
  </button>
)