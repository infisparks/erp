"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
// import Sidebar from "@/components/sidebar"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Plus, Trash2, Edit2 } from "lucide-react"

interface Course {
  id: string
  name: string
  code: string
  credits: number
  description: string
  created_at: string
}

export default function CoursesPage() {
  const [user, setUser] = useState<any>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    credits: 3,
    description: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabaseClient()
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        router.push("/")
      } else {
        setUser(authUser)
        fetchCourses()
      }
      setLoading(false)
    }

    checkAuth()
  }, [router])

  const fetchCourses = async () => {
    // Mock data for demonstration
    const mockCourses: Course[] = [
      {
        id: "1",
        name: "Introduction to Computer Science",
        code: "CS101",
        credits: 3,
        description: "Fundamentals of programming and computer science",
        created_at: "2024-01-15",
      },
      {
        id: "2",
        name: "Data Structures",
        code: "CS201",
        credits: 4,
        description: "Advanced data structures and algorithms",
        created_at: "2024-01-20",
      },
    ]
    setCourses(mockCourses)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const newCourse: Course = {
        id: Math.random().toString(),
        name: formData.name,
        code: formData.code,
        credits: formData.credits,
        description: formData.description,
        created_at: new Date().toISOString(),
      }
      setCourses([...courses, newCourse])
      setFormData({ name: "", code: "", credits: 3, description: "" })
      setShowForm(false)
    } catch (error) {
      console.error("Error creating course:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = (id: string) => {
    setCourses(courses.filter((course) => course.id !== id))
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* <Sidebar user={user} /> */}

      <main className="flex-1 md:ml-64 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Courses</h1>
              <p className="text-slate-600">Manage college courses</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:shadow-lg transition-all hover:scale-105"
            >
              <Plus size={20} />
              Add Course
            </button>
          </div>

          {/* Add Course Form */}
          {showForm && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Create New Course</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Course Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Course Code (e.g., CS101)"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Credits</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: Number.parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <textarea
                  placeholder="Course Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? "Creating..." : "Create Course"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 py-2 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Courses List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div key={course.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{course.name}</h3>
                    <p className="text-sm text-slate-600 mt-1">{course.code}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(course.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <p className="text-slate-600 text-sm mb-4">{course.description}</p>
                <div className="flex justify-between items-center">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                    {course.credits} Credits
                  </span>
                </div>
              </div>
            ))}
          </div>

          {courses.length === 0 && !showForm && (
            <div className="text-center py-12">
              <p className="text-slate-500 text-lg">No courses created yet</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
