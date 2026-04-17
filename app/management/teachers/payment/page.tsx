// e.g., app/dashboard/teachers/payment/page.tsx
"use client"

import React, { useState, useEffect, useMemo } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"

// --- UI Components ---
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input";

// --- Icons ---
import {
  ChevronRight,
  Loader2,
  AlertTriangle,
  Save,
  Search,
  UserSquare,
  DollarSign,
  Clock,
  Hourglass,
  LogIn, // New Icon
  LogOut, // New Icon
} from "lucide-react"

// --- PrimeReact Components ---
import { InputNumber, InputNumberValueChangeEvent } from 'primereact/inputnumber';
// 🔧 FIX: Removed Calendar import
// import { Calendar, CalendarViewChangeEvent } from 'primereact/calendar';

// --- PrimeReact CSS ---
import "primereact/resources/themes/saga-blue/theme.css"
import "primereact/resources/primereact.min.css"
import "primeicons/primeicons.css"

// --- Type Definitions ---

// Type for the teacher list
interface Teacher {
  id: string
  fullname: string | null
  monthly_salary: number
  overtime_rate_per_hour: number
  entry_time: string | null // e.g., "09:00:00"
  exit_time: string | null  // e.g., "17:00:00"
}

// Type for the edit form
interface PaymentFormData {
  monthly_salary: number | null
  overtime_rate_per_hour: number | null
  entry_time: string | null // Storing as string "HH:mm:ss"
  exit_time: string | null
}

/**
 * Helper to calculate total time
 */
const calculateTotalTime = (entry: string | null, exit: string | null): string => {
  if (!entry || !exit) {
    return "N/A";
  }
  
  try {
    const [entryHours, entryMinutes] = entry.split(':').map(Number);
    const [exitHours, exitMinutes] = exit.split(':').map(Number);

    const entryDate = new Date();
    entryDate.setHours(entryHours, entryMinutes, 0, 0);

    const exitDate = new Date();
    exitDate.setHours(exitHours, exitMinutes, 0, 0);

    let diff = exitDate.getTime() - entryDate.getTime();
    if (diff < 0) {
      // Handle overnight case
      diff += 24 * 60 * 60 * 1000;
    }

    const totalMinutes = Math.floor(diff / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours} hours, ${minutes} minutes`;
  } catch (e) {
    return "Invalid Time";
  }
};


/**
 * Main Teacher Payment Management Page
 */
export default function TeacherPaymentPage() {
  // --- Data State ---
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [teacherSearch, setTeacherSearch] = useState("");
  
  // --- Selection & Edit State ---
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [editFormData, setEditFormData] = useState<PaymentFormData>({
    monthly_salary: 0,
    overtime_rate_per_hour: 0,
    entry_time: null,
    exit_time: null
  });

  // --- Loading & Error State ---
  const [loadingTeachers, setLoadingTeachers] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = getSupabaseClient()

  // --- Data Fetching ---
  useEffect(() => {
    const fetchTeachers = async () => {
      setLoadingTeachers(true)
      const { data, error } = await supabase
        .from("teachers")
        .select("id, fullname, monthly_salary, overtime_rate_per_hour, entry_time, exit_time")
        .order("fullname")
        
      if (data) setTeachers(data as Teacher[])
      if (error) setError("Failed to fetch teachers.")
      setLoadingTeachers(false)
    }
    fetchTeachers()
  }, [])

  // --- Update form when a teacher is selected ---
  useEffect(() => {
    if (selectedTeacher) {
      setEditFormData({
        monthly_salary: selectedTeacher.monthly_salary,
        overtime_rate_per_hour: selectedTeacher.overtime_rate_per_hour,
        entry_time: selectedTeacher.entry_time,
        exit_time: selectedTeacher.exit_time,
      })
      setError(null)
      setSuccess(null)
    } else {
      setEditFormData({
        monthly_salary: 0,
        overtime_rate_per_hour: 0,
        entry_time: null,
        exit_time: null
      })
    }
  }, [selectedTeacher])

  // --- Form Handlers ---

  // 🔧 FIX: Handle 'undefined' from InputNumberValueChangeEvent
  const handleNumberChange = (name: keyof PaymentFormData, value: number | null | undefined) => {
    setSuccess(null)
    setEditFormData(prev => ({ ...prev, [name]: value ?? 0 }))
  }

  // 🔧 FIX: New handler for <input type="time">
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSuccess(null);
    const { name, value } = e.target; // value is "HH:mm" or ""
    
    setEditFormData(prev => ({ 
      ...prev, 
      [name]: value ? `${value}:00` : null // Convert "HH:mm" to "HH:mm:ss"
    }));
  }

  // --- Auto-calculated total time ---
  const totalTime = useMemo(() => {
    return calculateTotalTime(editFormData.entry_time, editFormData.exit_time);
  }, [editFormData.entry_time, editFormData.exit_time]);


  const handleSave = async () => {
    if (!selectedTeacher) return
    
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    const updateData = {
      monthly_salary: editFormData.monthly_salary ?? 0,
      overtime_rate_per_hour: editFormData.overtime_rate_per_hour ?? 0,
      entry_time: editFormData.entry_time,
      exit_time: editFormData.exit_time
    }
    
    try {
      const { data, error } = await supabase
        .from("teachers")
        .update(updateData)
        .eq("id", selectedTeacher.id)
        .select("id, fullname, monthly_salary, overtime_rate_per_hour, entry_time, exit_time")
        .single()

      if (error) throw error

      if (data) {
        setTeachers(prevTeachers => prevTeachers.map(t => t.id === data.id ? data as Teacher : t))
        setSelectedTeacher(data as Teacher)
        setSuccess("Payment terms saved successfully!")
      }

    } catch (err: any) {
      console.error("Save error:", err)
      setError(err.message || "Failed to save payment terms.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filtered teachers for search
  const filteredTeachers = teachers.filter(teacher =>
    teacher.fullname?.toLowerCase().includes(teacherSearch.toLowerCase())
  );
  
  // Check if there are unsaved changes
  const hasUnsavedChanges = selectedTeacher ? 
    (editFormData.monthly_salary !== selectedTeacher.monthly_salary) ||
    (editFormData.overtime_rate_per_hour !== selectedTeacher.overtime_rate_per_hour) ||
    (editFormData.entry_time !== selectedTeacher.entry_time) ||
    (editFormData.exit_time !== selectedTeacher.exit_time)
    : false;
    
  // 🔧 FIX: This helper is no longer needed
  // const timeStringToDate = (timeStr: string | null): Date | null => { ... }

  // --- Render ---
  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* 1. Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Teacher Payment
          </h1>
          <p className="text-lg text-gray-600">
            Manage salaries, hours, and overtime rates for teachers.
          </p>
        </div>
      </div>

      {/* 2. Main Content Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* --- Column 1: Teacher List --- */}
        <Card className="lg:col-span-1 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Select a Teacher</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTeachers ? (
              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            ) : (
              <>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search teachers..."
                    value={teacherSearch}
                    onChange={(e) => setTeacherSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {filteredTeachers.length > 0 ? (
                    filteredTeachers.map(teacher => (
                      <ListItem
                        key={teacher.id}
                        name={teacher.fullname || "No Name"}
                        isActive={selectedTeacher?.id === teacher.id}
                        onClick={() => setSelectedTeacher(teacher)}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center">No teachers found.</p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* --- Column 2: Payment Editor --- */}
        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold">
              {selectedTeacher 
                ? `Edit Terms for ${selectedTeacher.fullname}` 
                : "Select a Teacher to Begin"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedTeacher ? (
              <p className="text-sm text-gray-500 text-center">Please select a teacher from the list on the left.</p>
            ) : (
              <div className="space-y-6">
                
                {/* --- Base Salary --- */}
                <PaymentInputGroup
                  label="Monthly Base Salary"
                  name="monthly_salary"
                  value={editFormData.monthly_salary}
                  onChange={(e) => handleNumberChange('monthly_salary', e.value)}
                  icon={<DollarSign className="h-5 w-5 text-gray-500" />}
                  prefix="₹ "
                  placeholder="Enter base salary"
                />
                
                {/* --- 🔧 FIX: Replaced Calendar with HTML <input type="time"> --- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="entry_time" className="font-semibold text-base text-gray-800 flex items-center gap-2">
                      <LogIn className="h-5 w-5 text-gray-500" />
                      Standard Entry Time
                    </Label>
                    <Input
                      id="entry_time"
                      name="entry_time"
                      type="time"
                      // Format "HH:mm:ss" to "HH:mm" for the input, handle null
                      value={(editFormData.entry_time || "").substring(0, 5)}
                      onChange={handleTimeChange}
                      className="text-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="exit_time" className="font-semibold text-base text-gray-800 flex items-center gap-2">
                      <LogOut className="h-5 w-5 text-gray-500" />
                      Standard Exit Time
                    </Label>
                    <Input
                      id="exit_time"
                      name="exit_time"
                      type="time"
                      value={(editFormData.exit_time || "").substring(0, 5)}
                      onChange={handleTimeChange}
                      className="text-lg"
                    />
                  </div>
                </div>

                {/* --- Total Time Display --- */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center text-center">
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Total Standard Time</label>
                    <p className={`text-3xl font-bold ${totalTime !== 'N/A' ? 'text-blue-700' : 'text-gray-500'}`}>
                      {totalTime}
                    </p>
                  </div>
                </div>

                {/* --- Overtime Rate --- */}
                <PaymentInputGroup
                  label="Overtime Rate (per hour)"
                  name="overtime_rate_per_hour"
                  value={editFormData.overtime_rate_per_hour}
                  onChange={(e) => handleNumberChange('overtime_rate_per_hour', e.value)}
                  icon={<Hourglass className="h-5 w-5 text-gray-500" />}
                  prefix="₹ "
                  placeholder="Enter overtime rate"
                />
                
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
    <div className="flex items-center gap-3">
      <UserSquare className={`h-4 w-4 ${isActive ? 'text-white' : 'text-blue-600'}`} />
      <span className="font-medium text-sm">{name}</span>
    </div>
    <ChevronRight className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
  </button>
)

/**
 * Helper for a styled InputNumber
 */
interface PaymentInputGroupProps {
  label: string;
  name: string;
  value: number | null;
  onChange: (e: InputNumberValueChangeEvent) => void;
  icon: React.ReactNode;
  placeholder: string;
  prefix?: string;
  suffix?: string;
}

const PaymentInputGroup: React.FC<PaymentInputGroupProps> = ({
  label, name, value, onChange, icon, placeholder, prefix, suffix
}) => (
  <div className="space-y-1">
    <Label htmlFor={name} className="font-semibold text-base text-gray-800 flex items-center gap-2">
      {icon}
      {label}
    </Label>
    <InputNumber
      id={name}
      value={value}
      onValueChange={onChange}
      mode="decimal"
      minFractionDigits={0}
      maxFractionDigits={0}
      prefix={prefix}
      suffix={suffix}
      placeholder={placeholder}
      className="p-inputtext-lg w-full"
      inputClassName="w-full"
    />
  </div>
)