"use client"

import type React from "react"

import { useState } from "react"
import Layout from "@/components/layout"
import { getSupabaseClient } from "@/lib/supabase/client"
import { AlertCircle, Trash2, Plus } from "lucide-react"

const documentOptions = ["Aadhar Card", "PAN Card", "SSC Result", "HSC Result", "Leaving Certificate"]

export default function StudentAdmissionForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  // Section 1: Personal Details
  const [personalDetails, setPersonalDetails] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    contactNumber: "",
    familyNumber: "",
    dateOfBirth: "",
    rollNumber: "",
    gender: "",
  })

  // Section 2: Documents Submitted
  const [documents, setDocuments] = useState({
    aadhar_card: false,
    pan_card: false,
    ssc_result: false,
    hsc_result: false,
    leaving_certificate: false,
  })

  // Section 3: Other Details (Dynamic)
  const [otherDetails, setOtherDetails] = useState<Array<{ label: string; value: string }>>([{ label: "", value: "" }])

  const handlePersonalDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setPersonalDetails((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleDocumentChange = (key: string) => {
    setDocuments((prev) => ({
      ...prev,
      [key]: !prev[key as keyof typeof documents],
    }))
  }

  const handleOtherDetailsChange = (index: number, field: "label" | "value", value: string) => {
    const updated = [...otherDetails]
    updated[index] = { ...updated[index], [field]: value }
    setOtherDetails(updated)
  }

  const addOtherDetail = () => {
    setOtherDetails((prev) => [...prev, { label: "", value: "" }])
  }

  const removeOtherDetail = (index: number) => {
    setOtherDetails((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)

    // Validate required fields
    if (
      !personalDetails.firstName ||
      !personalDetails.lastName ||
      !personalDetails.contactNumber ||
      !personalDetails.dateOfBirth ||
      !personalDetails.rollNumber ||
      !personalDetails.gender
    ) {
      setError("Please fill in all required fields in Personal Details")
      setLoading(false)
      return
    }

    try {
      const supabase = getSupabaseClient()

      const submissionData = {
        first_name: personalDetails.firstName,
        middle_name: personalDetails.middleName,
        last_name: personalDetails.lastName,
        contact_number: personalDetails.contactNumber,
        family_number: personalDetails.familyNumber || null,
        date_of_birth: personalDetails.dateOfBirth,
        roll_number: personalDetails.rollNumber,
        gender: personalDetails.gender,
        documents_submitted: documents,
        other_details: otherDetails.filter((item) => item.label || item.value),
      }

      const { data, error: insertError } = await supabase.from("students").insert([submissionData])

      if (insertError) {
        setError(`Failed to submit form: ${insertError.message || "Unknown error"}`)
      } else {
        setSuccess(true)
        // Reset form
        setPersonalDetails({
          firstName: "",
          middleName: "",
          lastName: "",
          contactNumber: "",
          familyNumber: "",
          dateOfBirth: "",
          rollNumber: "",
          gender: "",
        })
        setDocuments({
          aadhar_card: false,
          pan_card: false,
          ssc_result: false,
          hsc_result: false,
          leaving_certificate: false,
        })
        setOtherDetails([{ label: "", value: "" }])

        setTimeout(() => setSuccess(false), 5000)
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Student Admission Form</h1>
          <p className="text-slate-600">Please fill in all required fields to complete your admission application.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-800 font-medium">
              Form submitted successfully! Your admission application has been recorded.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Personal Details */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                1
              </span>
              Personal Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={personalDetails.firstName}
                  onChange={handlePersonalDetailsChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition bg-slate-50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Middle Name</label>
                <input
                  type="text"
                  name="middleName"
                  value={personalDetails.middleName}
                  onChange={handlePersonalDetailsChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={personalDetails.lastName}
                  onChange={handlePersonalDetailsChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition bg-slate-50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Contact Number *</label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={personalDetails.contactNumber}
                  onChange={handlePersonalDetailsChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition bg-slate-50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Family Number (Optional)</label>
                <input
                  type="tel"
                  name="familyNumber"
                  value={personalDetails.familyNumber}
                  onChange={handlePersonalDetailsChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Date of Birth *</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={personalDetails.dateOfBirth}
                  onChange={handlePersonalDetailsChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition bg-slate-50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Roll Number *</label>
                <input
                  type="text"
                  name="rollNumber"
                  value={personalDetails.rollNumber}
                  onChange={handlePersonalDetailsChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition bg-slate-50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Gender *</label>
                <select
                  name="gender"
                  value={personalDetails.gender}
                  onChange={handlePersonalDetailsChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition bg-slate-50"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Documents Submitted */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                2
              </span>
              Documents Submitted
            </h2>

            <div className="space-y-3">
              {documentOptions.map((doc, index) => (
                <label
                  key={index}
                  className="flex items-center gap-3 cursor-pointer p-3 hover:bg-slate-50 rounded-lg transition"
                >
                  <input
                    type="checkbox"
                    checked={documents[doc.toLowerCase().replace(/\s+/g, "_") as keyof typeof documents]}
                    onChange={() => handleDocumentChange(doc.toLowerCase().replace(/\s+/g, "_"))}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-200 cursor-pointer"
                  />
                  <span className="text-slate-900 font-medium">{doc}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Section 3: Other Details (Dynamic) */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                3
              </span>
              Other Details
            </h2>

            <div className="space-y-4 mb-4">
              {otherDetails.map((detail, index) => (
                <div key={index} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Attribute Name</label>
                    <input
                      type="text"
                      value={detail.label}
                      onChange={(e) => handleOtherDetailsChange(index, "label", e.target.value)}
                      placeholder="e.g., Aadhar Number"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition bg-slate-50"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Attribute Value</label>
                    <input
                      type="text"
                      value={detail.value}
                      onChange={(e) => handleOtherDetailsChange(index, "value", e.target.value)}
                      placeholder="e.g., 1234 5678 9012"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition bg-slate-50"
                    />
                  </div>

                  {otherDetails.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeOtherDetail(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      aria-label="Remove field"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addOtherDetail}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              <Plus size={20} />
              Add Field
            </button>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? "Submitting..." : "Submit Application"}
            </button>
            <button
              type="reset"
              className="px-6 py-3 bg-slate-200 text-slate-900 rounded-lg font-semibold hover:bg-slate-300 transition"
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
