// e.g., app/dashboard/academics/page.tsx
"use client"

import React, { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"

// --- UI Components ---
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// --- Icons ---
import {
  Plus,
  ChevronRight,
  Loader2,
  Book,
  FlaskConical,
  AlertTriangle,
  GraduationCap,
  Calendar,
  Layers,
  Pencil, // NEW
  Trash2, // NEW
} from "lucide-react"

// --- PrimeReact Components ---
import { Dialog } from "primereact/dialog"
import { Dropdown } from "primereact/dropdown"
import { InputSwitch } from "primereact/inputswitch"

// --- PrimeReact CSS ---
import "primereact/resources/themes/saga-blue/theme.css"
import "primereact/resources/primereact.min.css"
import "primeicons/primeicons.css"

// --- Type Definitions (Updated) ---
interface Stream {
  id: string
  name: string
  description?: string
}
interface Course {
  id: string
  name: string
  description?: string
  stream_id: string
}
interface AcademicYear {
  id: string
  name: string
  course_id: string
}
interface Semester {
  id: string
  name: string
  academic_year_id: string
}
interface Subject {
  id: string
  name: string
  subject_code?: string
  type: "theory" | "practical"
  semester_id: string
  is_optional: boolean
}

type ModalType = "stream" | "course" | "academicYear" | "semester" | "subject"

const subjectTypeOptions = [
  { label: "Theory", value: "theory" },
  { label: "Practical", value: "practical" },
]

/**
 * Main Academics Management Page
 */
export default function AcademicsPage() {
  // --- Data State ---
  const [streams, setStreams] = useState<Stream[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])

  // --- Selection State ---
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null)
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null)

  // --- Loading State ---
  const [loading, setLoading] = useState({
    streams: false,
    courses: false,
    academicYears: false,
    semesters: false,
    subjects: false,
  })

  // --- Create/Edit Modal State ---
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [modalType, setModalType] = useState<ModalType | null>(null)
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  const [editingItem, setEditingItem] = useState<any | null>(null)
  const [formData, setFormData] = useState<any>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  // --- Delete Modal State (NEW) ---
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ item: any; type: ModalType } | null>(null)
  const [deletePassword, setDeletePassword] = useState("")
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const supabase = getSupabaseClient()

  // --- Data Fetching Functions ---
  const fetchStreams = async () => {
    setLoading(prev => ({ ...prev, streams: true }))
    const { data } = await supabase.from("streams").select("*").order("name")
    if (data) setStreams(data)
    setLoading(prev => ({ ...prev, streams: false }))
  }

  const fetchCourses = async (streamId: string) => {
    setLoading(prev => ({ ...prev, courses: true }))
    const { data } = await supabase.from("courses").select("*").eq("stream_id", streamId).order("name")
    if (data) setCourses(data)
    setLoading(prev => ({ ...prev, courses: false }))
  }

  const fetchAcademicYears = async (courseId: string) => {
    setLoading(prev => ({ ...prev, academicYears: true }))
    const { data } = await supabase.from("academic_years").select("*").eq("course_id", courseId).order("name")
    if (data) setAcademicYears(data)
    setLoading(prev => ({ ...prev, academicYears: false }))
  }

  const fetchSemesters = async (academicYearId: string) => {
    setLoading(prev => ({ ...prev, semesters: true }))
    const { data } = await supabase.from("semesters").select("*").eq("academic_year_id", academicYearId).order("name")
    if (data) setSemesters(data)
    setLoading(prev => ({ ...prev, semesters: false }))
  }

  const fetchSubjects = async (semesterId: string) => {
    setLoading(prev => ({ ...prev, subjects: true }))
    const { data } = await supabase.from("subjects").select("*").eq("semester_id", semesterId).order("name")
    if (data) setSubjects(data)
    setLoading(prev => ({ ...prev, subjects: false }))
  }

  // --- Initial Data Load ---
  useEffect(() => {
    fetchStreams()
  }, [])

  // --- Chained Data Loading ---
  useEffect(() => {
    if (selectedStream) {
      fetchCourses(selectedStream.id)
    } else {
      setCourses([])
    }
    setSelectedCourse(null)
  }, [selectedStream])

  useEffect(() => {
    if (selectedCourse) {
      fetchAcademicYears(selectedCourse.id)
    } else {
      setAcademicYears([])
    }
    setSelectedYear(null)
  }, [selectedCourse])

  useEffect(() => {
    if (selectedYear) {
      fetchSemesters(selectedYear.id)
    } else {
      setSemesters([])
    }
    setSelectedSemester(null)
  }, [selectedYear])

  useEffect(() => {
    if (selectedSemester) {
      fetchSubjects(selectedSemester.id)
    } else {
      setSubjects([])
    }
  }, [selectedSemester])

  // --- Create/Edit Modal Handlers ---
  const openCreateModal = (type: ModalType) => {
    setModalType(type)
    setModalMode("create")
    setFormData(type === "subject" ? { is_optional: false, type: "theory" } : {})
    setEditingItem(null)
    setModalError(null)
    setIsModalVisible(true)
  }

  const openEditModal = (type: ModalType, item: any) => {
    setModalType(type)
    setModalMode("edit")
    setFormData(item)
    setEditingItem(item)
    setModalError(null)
    setIsModalVisible(true)
  }

  const closeModal = () => {
    setIsModalVisible(false)
    setModalType(null)
    setFormData({})
    setEditingItem(null)
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev: any) => ({ ...prev, [name]: value }))
  }

  const handleDropdownChange = (name: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setModalError(null)

    let table = ""
    let dataToSubmit: any = { ...formData }
    let error = null
    let data: any = null

    try {
      switch (modalType) {
        case "stream":
          table = "streams"
          break
        case "course":
          table = "courses"
          if (modalMode === "create") dataToSubmit.stream_id = selectedStream?.id
          break
        case "academicYear":
          table = "academic_years"
          if (modalMode === "create") dataToSubmit.course_id = selectedCourse?.id
          break
        case "semester":
          table = "semesters"
          if (modalMode === "create") dataToSubmit.academic_year_id = selectedYear?.id
          break
        case "subject":
          table = "subjects"
          if (modalMode === "create") dataToSubmit.semester_id = selectedSemester?.id
          dataToSubmit.is_optional = !!dataToSubmit.is_optional
          break
      }

      // --- Validation ---
      if (
        !table ||
        (modalType === "course" && !dataToSubmit.stream_id) ||
        (modalType === "academicYear" && !dataToSubmit.course_id) ||
        (modalType === "semester" && !dataToSubmit.academic_year_id) ||
        (modalType === "subject" && !dataToSubmit.semester_id)
      ) {
        throw new Error("Missing required parent selection.")
      }
      
      // --- Remove ID for submission (if it exists) ---
      const { id, ...dataToInsert } = dataToSubmit;
      
      if (modalMode === "create") {
        // --- CREATE ---
        const { error: insertError, data: insertData } = await supabase
          .from(table)
          .insert([dataToInsert])
          .select()
          .single()
        error = insertError
        data = insertData
      } else {
        // --- UPDATE ---
        // Don't update linking keys (stream_id, course_id, etc.)
        const { stream_id, course_id, academic_year_id, semester_id, ...dataToUpdate } = dataToInsert;
        
        const { error: updateError, data: updateData } = await supabase
          .from(table)
          .update(dataToUpdate)
          .eq("id", editingItem.id)
          .select()
          .single()
        error = updateError
        data = updateData
      }

      if (error) throw error

      // --- Update UI State (FIXED SECTION) ---
      switch (modalType) {
        case "stream":
          setStreams(prev => {
            const newArray = modalMode === "create"
              ? [...prev, data as Stream]
              : prev.map(i => (i.id === data.id ? (data as Stream) : i));
            return newArray.sort((a, b) => a.name.localeCompare(b.name));
          });
          break
        case "course":
          setCourses(prev => {
            const newArray = modalMode === "create"
              ? [...prev, data as Course]
              : prev.map(i => (i.id === data.id ? (data as Course) : i));
            return newArray.sort((a, b) => a.name.localeCompare(b.name));
          });
          break
        case "academicYear":
          setAcademicYears(prev => {
            const newArray = modalMode === "create"
              ? [...prev, data as AcademicYear]
              : prev.map(i => (i.id === data.id ? (data as AcademicYear) : i));
            return newArray.sort((a, b) => a.name.localeCompare(b.name));
          });
          break
        case "semester":
          setSemesters(prev => {
            const newArray = modalMode === "create"
              ? [...prev, data as Semester]
              : prev.map(i => (i.id === data.id ? (data as Semester) : i));
            return newArray.sort((a, b) => a.name.localeCompare(b.name));
          });
          break
        case "subject":
          setSubjects(prev => {
            const newArray = modalMode === "create"
              ? [...prev, data as Subject]
              : prev.map(i => (i.id === data.id ? (data as Subject) : i));
            return newArray.sort((a, b) => a.name.localeCompare(b.name));
          });
          break
      }

      closeModal()
    } catch (err: any) {
      console.error("Submission error:", err)
      setModalError(err.message || "Failed to save item.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- Delete Modal Handlers (NEW) ---
  const openDeleteModal = (type: ModalType, item: any) => {
    setItemToDelete({ item, type })
    setIsDeleteModalVisible(true)
    setDeleteError(null)
    setDeletePassword("")
  }

  const closeDeleteModal = () => {
    setIsDeleteModalVisible(false)
    setItemToDelete(null)
    setDeleteError(null)
    setDeletePassword("")
    setIsDeleting(false)
  }

  const handleDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setDeleteError(null)

    if (deletePassword !== "472") {
      setDeleteError("Incorrect password.")
      return
    }

    if (!itemToDelete) return
    setIsDeleting(true)

    let table = ""
    switch (itemToDelete.type) {
      case "stream": table = "streams"; break
      case "course": table = "courses"; break
      case "academicYear": table = "academic_years"; break
      case "semester": table = "semesters"; break
      case "subject": table = "subjects"; break
    }

    try {
      const { error } = await supabase.from(table).delete().eq("id", itemToDelete.item.id)
      if (error) throw error

      // --- Remove item from UI state ---
      switch (itemToDelete.type) {
        case "stream":
          setStreams(prev => prev.filter(i => i.id !== itemToDelete.item.id))
          if (selectedStream?.id === itemToDelete.item.id) setSelectedStream(null)
          break
        case "course":
          setCourses(prev => prev.filter(i => i.id !== itemToDelete.item.id))
          if (selectedCourse?.id === itemToDelete.item.id) setSelectedCourse(null)
          break
        case "academicYear":
          setAcademicYears(prev => prev.filter(i => i.id !== itemToDelete.item.id))
          if (selectedYear?.id === itemToDelete.item.id) setSelectedYear(null)
          break
        case "semester":
          setSemesters(prev => prev.filter(i => i.id !== itemToDelete.item.id))
          if (selectedSemester?.id === itemToDelete.item.id) setSelectedSemester(null)
          break
        case "subject":
          setSubjects(prev => prev.filter(i => i.id !== itemToDelete.item.id))
          break
      }
      closeDeleteModal()
    } catch (err: any) {
      console.error("Delete error:", err)
      setDeleteError(err.message || "Failed to delete item.")
    } finally {
      setIsDeleting(false)
    }
  }

  // --- Dynamic Modal Content ---
  const renderModalContent = () => {
    switch (modalType) {
      case "stream":
        return (
          <>
            <FormInputGroup label="Stream Name" name="name" value={formData.name || ""} onChange={handleFormChange} required />
            <FormTextareaGroup label="Description (Optional)" name="description" value={formData.description || ""} onChange={handleFormChange} />
          </>
        )
      case "course":
        return (
          <>
            <FormInputGroup label="Course Name" name="name" value={formData.name || ""} onChange={handleFormChange} required />
            <FormTextareaGroup label="Description (Optional)" name="description" value={formData.description || ""} onChange={handleFormChange} />
          </>
        )
      case "academicYear":
        return (
          <>
            <FormInputGroup label="Academic Year Name" name="name" value={formData.name || ""} onChange={handleFormChange} placeholder="e.g., First Year, Second Year" required />
          </>
        )
      case "semester":
        return (
          <>
            <FormInputGroup label="Semester Name" name="name" value={formData.name || ""} onChange={handleFormChange} placeholder="e.g., Semester 1" required />
          </>
        )
      case "subject":
        return (
          <>
            <FormInputGroup label="Subject Name" name="name" value={formData.name || ""} onChange={handleFormChange} required />
            <FormInputGroup label="Subject Code (Optional)" name="subject_code" value={formData.subject_code || ""} onChange={handleFormChange} />
            <div className="space-y-1">
              <Label htmlFor="type" className="font-semibold">Subject Type*</Label>
              <Dropdown
                id="type"
                name="type"
                value={formData.type}
                options={subjectTypeOptions}
                onChange={e => handleDropdownChange("type", e.value)}
                placeholder="Select a Type"
                className="w-full p-inputtext-sm"
                required
              />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <InputSwitch
                id="is_optional"
                name="is_optional"
                checked={formData.is_optional || false}
                onChange={e => handleDropdownChange("is_optional", e.value)}
              />
              <Label htmlFor="is_optional" className="font-semibold">Is this an optional subject?</Label>
            </div>
          </>
        )
      default:
        return null
    }
  }

  // --- Render ---
  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* 1. Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Academics Management
          </h1>
          <p className="text-lg text-gray-600">
            Manage streams, courses, years, semesters, and subjects.
          </p>
        </div>
      </div>

      {/* 2. Cascading Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* --- Column 1: Streams --- */}
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-bold">Streams</CardTitle>
            <Button size="sm" onClick={() => openCreateModal("stream")}>
              <Plus className="h-4 w-4 mr-2" /> Add
            </Button>
          </CardHeader>
          <CardContent>
            {loading.streams ? (
              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            ) : (
              <div className="space-y-2">
                {streams.map(stream => (
                  <ListItem
                    key={stream.id}
                    name={stream.name}
                    icon={<GraduationCap className="h-4 w-4 text-gray-500" />}
                    isActive={selectedStream?.id === stream.id}
                    onClick={() => setSelectedStream(stream)}
                    onEdit={() => openEditModal("stream", stream)}
                    onDelete={() => openDeleteModal("stream", stream)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* --- Column 2: Courses --- */}
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-bold">Courses</CardTitle>
            <Button size="sm" onClick={() => openCreateModal("course")} disabled={!selectedStream}>
              <Plus className="h-4 w-4 mr-2" /> Add
            </Button>
          </CardHeader>
          <CardContent>
            {!selectedStream ? (
              <p className="text-sm text-gray-500 text-center">Select a stream.</p>
            ) : loading.courses ? (
              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            ) : (
              <div className="space-y-2">
                {courses.map(course => (
                  <ListItem
                    key={course.id}
                    name={course.name}
                    icon={<Book className="h-4 w-4 text-gray-500" />}
                    isActive={selectedCourse?.id === course.id}
                    onClick={() => setSelectedCourse(course)}
                    onEdit={() => openEditModal("course", course)}
                    onDelete={() => openDeleteModal("course", course)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* --- Column 3: Academic Years --- */}
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-bold">Years</CardTitle>
            <Button size="sm" onClick={() => openCreateModal("academicYear")} disabled={!selectedCourse}>
              <Plus className="h-4 w-4 mr-2" /> Add
            </Button>
          </CardHeader>
          <CardContent>
            {!selectedCourse ? (
              <p className="text-sm text-gray-500 text-center">Select a course.</p>
            ) : loading.academicYears ? (
              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            ) : (
              <div className="space-y-2">
                {academicYears.map(year => (
                  <ListItem
                    key={year.id}
                    name={year.name}
                    icon={<Calendar className="h-4 w-4 text-gray-500" />}
                    isActive={selectedYear?.id === year.id}
                    onClick={() => setSelectedYear(year)}
                    onEdit={() => openEditModal("academicYear", year)}
                    onDelete={() => openDeleteModal("academicYear", year)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* --- Column 4: Semesters --- */}
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-bold">Semesters</CardTitle>
            <Button size="sm" onClick={() => openCreateModal("semester")} disabled={!selectedYear}>
              <Plus className="h-4 w-4 mr-2" /> Add
            </Button>
          </CardHeader>
          <CardContent>
            {!selectedYear ? (
              <p className="text-sm text-gray-500 text-center">Select a year.</p>
            ) : loading.semesters ? (
              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            ) : (
              <div className="space-y-2">
                {semesters.map(sem => (
                  <ListItem
                    key={sem.id}
                    name={sem.name}
                    icon={<Layers className="h-4 w-4 text-gray-500" />}
                    isActive={selectedSemester?.id === sem.id}
                    onClick={() => setSelectedSemester(sem)}
                    onEdit={() => openEditModal("semester", sem)}
                    onDelete={() => openDeleteModal("semester", sem)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* --- 3. Subjects Section --- */}
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold">
            Subjects for: <span className="text-blue-600">{selectedSemester?.name || "..."}</span>
          </CardTitle>
          <Button size="sm" onClick={() => openCreateModal("subject")} disabled={!selectedSemester}>
            <Plus className="h-4 w-4 mr-2" /> Add Subject
          </Button>
        </CardHeader>
        <CardContent>
          {!selectedSemester ? (
            <p className="text-sm text-gray-500 text-center">Select a stream, course, year, and semester to see subjects.</p>
          ) : loading.subjects ? (
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          ) : subjects.length === 0 ? (
            <p className="text-sm text-gray-500 text-center">No subjects found for this semester.</p>
          ) : (
            <div className="space-y-2">
              {subjects.map(sub => (
                <SubjectListItem
                  key={sub.id}
                  subject={sub}
                  onEdit={() => openEditModal("subject", sub)}
                  onDelete={() => openDeleteModal("subject", sub)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- Create/Edit Modal --- */}
      <Dialog
        header={`${modalMode === "edit" ? "Edit" : "Create New"} ${
          modalType ? modalType.charAt(0).toUpperCase() + modalType.slice(1) : ""
        }`}
        visible={isModalVisible}
        style={{ width: "90vw", maxWidth: "500px" }}
        onHide={closeModal}
        modal
        className="p-dialog"
      >
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {modalError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{modalError}</AlertDescription>
            </Alert>
          )}

          {renderModalContent()}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="ghost" onClick={closeModal} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </div>
        </form>
      </Dialog>
      
      {/* --- Delete Confirmation Modal (NEW) --- */}
      <Dialog
        header="Delete Confirmation"
        visible={isDeleteModalVisible}
        style={{ width: "90vw", maxWidth: "500px" }}
        onHide={closeDeleteModal}
        modal
        className="p-dialog"
      >
        <form onSubmit={handleDeleteSubmit} className="p-4 space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Are you absolutely sure?</AlertTitle>
            <AlertDescription>
              This action cannot be undone. This will permanently delete the item
              <strong className="mx-1">{itemToDelete?.item.name}</strong>
              and all its associated data (if applicable).
            </AlertDescription>
          </Alert>

          <p className="text-sm text-gray-700">
            To confirm, please type the administrator password: <strong className="text-gray-900">472</strong>
          </p>

          <FormInputGroup
            label="Password"
            name="password"
            type="password"
            value={deletePassword}
            onChange={e => setDeletePassword(e.target.value)}
            required
          />

          {deleteError && (
            <p className="text-sm font-medium text-red-600">{deleteError}</p>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="ghost" onClick={closeDeleteModal} disabled={isDeleting}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}

// --- Helper Components (Updated) ---

/**
 * A consistent list item with Edit/Delete actions
 */
const ListItem: React.FC<{
  name: string
  icon: React.ReactNode
  isActive: boolean
  onClick: () => void
  onEdit: () => void
  onDelete: () => void
}> = ({ name, icon, isActive, onClick, onEdit, onDelete }) => (
  <div
    className={`w-full p-3 rounded-md border transition-all flex justify-between items-center group
      ${
        isActive
          ? "bg-blue-600 text-white shadow-md border-blue-700"
          : "bg-white hover:bg-gray-50 border-gray-200"
      }`}
  >
    <div
      className="flex items-center gap-2 flex-grow cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => (e.key === "Enter" || e.key === " ") && onClick()}
    >
      <span className={isActive ? "text-white" : "text-gray-500"}>{icon}</span>
      <span className="font-medium text-sm">{name}</span>
    </div>
    
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={`h-7 w-7 ${isActive ? 'text-white hover:bg-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={`h-7 w-7 ${isActive ? 'text-white hover:bg-blue-700' : 'text-red-600 hover:bg-red-50'}`}
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
    
    {/* Show chevron when active or not hovering */}
    <ChevronRight className={`h-4 w-4 flex-shrink-0 group-hover:opacity-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
  </div>
)

/**
 * A list item specifically for subjects with Edit/Delete
 */
const SubjectListItem: React.FC<{
  subject: Subject
  onEdit: () => void
  onDelete: () => void
}> = ({ subject, onEdit, onDelete }) => (
  <div className="w-full p-3 rounded-md border bg-white border-gray-200 flex justify-between items-center group">
    {/* Left Side: Info */}
    <div className="flex items-center gap-3">
      {subject.type === "practical" ? (
        <FlaskConical className="h-4 w-4 text-green-600" />
      ) : (
        <Book className="h-4 w-4 text-blue-600" />
      )}
      <div>
        <p className="font-medium text-sm">{subject.name}</p>
        <p className="text-xs text-gray-500">{subject.subject_code || "No Code"}</p>
      </div>
    </div>
    
    {/* Right Side: Badges & Actions */}
    <div className="flex items-center gap-3">
      <div className="flex flex-col items-end gap-1">
        <Badge
          variant={subject.type === "practical" ? "default" : "secondary"}
          className={subject.type === "practical" ? "bg-green-100 text-green-800" : ""}
        >
          {subject.type}
        </Badge>
        {subject.is_optional && (
          <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">
            Optional
          </Badge>
        )}
      </div>
       <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-gray-600 hover:bg-gray-100"
          onClick={onEdit}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-red-600 hover:bg-red-50"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  </div>
)

/**
 * Helper for form inputs
 */
const FormInputGroup: React.FC<{
  label: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  type?: string
  required?: boolean
  placeholder?: string
}> = ({ label, name, value, onChange, type = "text", required = false, placeholder = "" }) => (
  <div className="space-y-1">
    <Label htmlFor={name} className="font-semibold">{label}{required && '*'}</Label>
    <Input
      id={name}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
    />
  </div>
)

/**
 * Helper for form textareas
 */
const FormTextareaGroup: React.FC<{
  label: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
}> = ({ label, name, value, onChange }) => (
  <div className="space-y-1">
    <Label htmlFor={name} className="font-semibold">{label}</Label>
    <Textarea
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      placeholder="Enter description..."
    />
  </div>
)