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
import { ChevronRight, Loader2, AlertTriangle, Save } from "lucide-react"

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

interface FeeCategory {
  name: string
  description: string
}

interface CourseFee {
  id?: string
  course_id: string
  category_name: string
  amount: number
}

/**
 * Main Fee Structure Management Page
 */
export default function FeeStructurePage() {
  // --- Data State ---
  const [courses, setCourses] = useState<Course[]>([])
  const [availableCategories, setAvailableCategories] = useState<FeeCategory[]>([])
  
  // --- Selection & Edit State ---
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [currentFees, setCurrentFees] = useState<Record<string, number>>({})
  const [editFees, setEditFees] = useState<Record<string, number>>({})

  // --- Loading & Error State ---
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [loadingFees, setLoadingFees] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = getSupabaseClient()

  // --- Data Fetching ---

  // Fetch Courses (on load)
  useEffect(() => {
    const fetchCourses = async () => {
      setLoadingCourses(true)
      const { data, error } = await supabase.from("courses").select("*").order("name")
      if (data) setCourses(data)
      if (error) setError("Failed to fetch courses.")
      setLoadingCourses(false)
    }
    fetchCourses()
  }, [])

  // Fetch Fee Categories (on load)
  useEffect(() => {
    const fetchFeeCategories = async () => {
      setLoadingCategories(true)
      const { data, error } = await supabase
        .from("form_config")
        .select("data_jsonb")
        .eq("data_name", "fee_categories")
        .single()
      
      if (data) setAvailableCategories(data.data_jsonb as FeeCategory[])
      if (error) setError("Failed to fetch fee categories from form_config.")
      setLoadingCategories(false)
    }
    fetchFeeCategories()
  }, [])

  // Fetch Fees (when a course is selected)
  useEffect(() => {
    if (!selectedCourse) {
      setCurrentFees({})
      setEditFees({})
      return
    }

    // 🔧 FIX: Removed typo '_' from 'async ()_ =>'
    const fetchCourseFees = async () => {
      setLoadingFees(true)
      setEditFees({}) // Clear edits
      setSuccess(null) // Clear success message
      
      const { data, error } = await supabase
        .from("course_fees")
        .select("category_name, amount")
        .eq("course_id", selectedCourse.id)
      
      if (error) {
        setError("Failed to fetch fee structure for this course.")
        setCurrentFees({})
      } else if (data) {
        // 🔧 FIX: Added explicit types for 'acc' and 'fee'
        const feeMap = data.reduce((
          acc: Record<string, number>, 
          fee: { category_name: string; amount: number }
        ) => {
          acc[fee.category_name] = fee.amount
          return acc
        }, {} as Record<string, number>)
        setCurrentFees(feeMap)
      }
      setLoadingFees(false)
    }
    
    fetchCourseFees()
  }, [selectedCourse, supabase]) // Added supabase to dependency array

  // --- Form Handlers ---

  // 🔧 FIX: Added 'undefined' to the 'value' type
  const handleFeeChange = (categoryName: string, value: number | null | undefined) => {
    setSuccess(null) // Clear success message on edit
    setEditFees(prev => ({
      ...prev,
      // 'value ?? 0' correctly handles null and undefined
      [categoryName]: value ?? 0,
    }))
  }

  const handleSave = async () => {
    if (!selectedCourse || Object.keys(editFees).length === 0) return
    
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    const upsertArray = Object.entries(editFees).map(([categoryName, amount]) => ({
      course_id: selectedCourse.id,
      category_name: categoryName,
      amount: amount,
    }))
    
    try {
      const { error } = await supabase
        .from("course_fees")
        .upsert(upsertArray, {
          onConflict: 'course_id, category_name'
        })

      if (error) throw error

      setCurrentFees(prev => ({ ...prev, ...editFees }))
      setEditFees({})
      setSuccess("Fee structure saved successfully!")

    } catch (err: any) {
      console.error("Save error:", err)
      setError(err.message || "Failed to save fee structure.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasUnsavedChanges = Object.keys(editFees).length > 0;

  // --- Render ---
  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* 1. Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Fee Structure
          </h1>
          <p className="text-lg text-gray-600">
            Define fee amounts for each course and category.
          </p>
        </div>
      </div>

      {/* 2. Main Content Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* --- Column 1: Course List --- */}
        <Card className="lg:col-span-1 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Select a Course</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCourses ? (
              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {courses.map(course => (
                  <ListItem
                    key={course.id}
                    name={course.name}
                    isActive={selectedCourse?.id === course.id}
                    onClick={() => setSelectedCourse(course)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* --- Column 2: Fee Editor --- */}
        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">
              {selectedCourse 
                ? `Edit Fees for ${selectedCourse.name}` 
                : "Select a Course to Begin"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedCourse ? (
              <p className="text-sm text-gray-500 text-center">Please select a course from the list on the left.</p>
            ) : loadingCategories || loadingFees ? (
              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            ) : error ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {availableCategories.map(category => {
                  const currentValue = editFees[category.name] ?? currentFees[category.name] ?? 0;
                  
                  return (
                    <div key={category.name} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg bg-gray-50">
                      <Label htmlFor={`fee-${category.name}`} className="font-semibold text-base text-gray-800">
                        {category.name}
                        <p className="text-sm font-normal text-gray-500">{category.description}</p>
                      </Label>
                      <InputNumber
                        id={`fee-${category.name}`}
                        value={currentValue}
                        onValueChange={(e) => handleFeeChange(category.name, e.value)}
                        mode="decimal"
                        minFractionDigits={0}
                        maxFractionDigits={0}
                        prefix="₹ "
                        placeholder="Enter amount"
                        className="p-inputtext-lg"
                        inputClassName="w-full sm:w-48 text-right"
                      />
                    </div>
                  )
                })}
                
                {/* Save Button & Messages */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
                  <div className="flex-1">
                    {success && !hasUnsavedChanges && (
                       <p className="text-sm text-green-600 font-medium">{success}</p>
                    )}
                     {error && (
                       <p className="text-sm text-red-600 font-medium">{error}</p>
                    )}
                  </div>
                  <Button 
                    size="lg" 
                    onClick={handleSave} 
                    disabled={!hasUnsavedChanges || isSubmitting}
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                </div>

              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// --- Helper Components ---

/**
 * A consistent list item for selection
 */
const ListItem: React.FC<{
  name: string
  isActive: boolean
  onClick: () => void
}> = ({ name, isActive, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full p-3 text-left rounded-md border transition-all flex justify-between items-center
      ${isActive
        ? "bg-blue-600 text-white shadow-md border-blue-700"
        : "bg-white hover:bg-gray-50 border-gray-200"
      }`}
  >
    <span className="font-medium text-sm">{name}</span>
    <ChevronRight className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
  </button>
)