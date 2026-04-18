"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { 
    User, Home, BookOpen, Trophy, Folder, Check, 
    ArrowLeft, ArrowRight, Lock, RefreshCw, Upload, MapPin,
    ChevronDown, Trash2, Camera, Info, FileText,
    Calendar, CheckCircle, CreditCard, AlertCircle, Eye, ShieldAlert
} from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { 
    getAdmissionMetadata, 
    calculateStudentFees,
    getStudentProfile
} from "@/lib/erp-logic"

const StepIcons = [User, Home, BookOpen, Trophy, Folder]
const StepNames = ["Personal", "Address", "Academic", "Exams", "Docs"]

// ─────────────────────────────────────────────────────────────────────────────
// CRITICAL: These helper components are defined OUTSIDE AdmissionForm.
// If they were inside, every keystroke would cause React to unmount/remount
// them (treating them as new component types), losing focus and scrolling to
// the top. Keeping them outside ensures stable component identity across renders.
// ─────────────────────────────────────────────────────────────────────────────

const TF = React.memo(({ label, val, k, type = "text", max, icon: Icon, isTA, isLocked, onChange }: any) => (
    <div className="flex flex-col mb-3">
        <label className="text-[10px] font-medium text-gray-500 mb-1.5 uppercase tracking-wider">{label}</label>
        <div className="relative w-full">
            {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" size={15} />}
            {isTA ? (
                <textarea
                    disabled={isLocked}
                    value={val}
                    onChange={e => onChange(k, e.target.value)}
                    rows={3}
                    style={{ paddingLeft: Icon ? '2.5rem' : '0.875rem' }}
                    className={`w-full rounded-xl border-2 focus:border-[#2E75C7] focus:ring-2 focus:ring-[#2E75C7]/10 outline-none py-2.5 pr-3 text-sm font-light text-gray-900 placeholder-gray-300 transition-all resize-none ${isLocked ? 'bg-gray-100 border-gray-200 cursor-not-allowed' : 'bg-white border-gray-100 hover:border-gray-200'}`}
                />
            ) : (
                <input
                    type={type}
                    disabled={isLocked}
                    value={val}
                    onChange={e => onChange(k, e.target.value)}
                    maxLength={max}
                    style={{ paddingLeft: Icon ? '2.5rem' : '0.875rem' }}
                    className={`w-full h-11 rounded-xl border-2 focus:border-[#2E75C7] focus:ring-2 focus:ring-[#2E75C7]/10 outline-none pr-3 text-sm font-light text-gray-900 placeholder-gray-300 transition-all ${isLocked ? 'bg-gray-100 border-gray-200 cursor-not-allowed' : 'bg-white border-gray-100 hover:border-gray-200'}`}
                />
            )}
        </div>
    </div>
))
TF.displayName = "TF"

const AcadTF = React.memo(({ label, val, k, type = "text", icon: Icon, isLocked, onChange }: any) => (
    <div className="flex flex-col mb-3">
        <label className="text-[10px] font-medium text-gray-500 mb-1.5 uppercase tracking-wider">{label}</label>
        <div className="relative w-full">
            {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" size={15} />}
            <input
                type={type}
                disabled={isLocked}
                value={val}
                onChange={e => onChange(k, e.target.value)}
                style={{ paddingLeft: Icon ? '2.5rem' : '0.875rem' }}
                className={`w-full h-11 rounded-xl border-2 focus:border-[#2E75C7] focus:ring-2 focus:ring-[#2E75C7]/10 outline-none pr-3 text-sm font-light text-gray-900 placeholder-gray-300 transition-all ${isLocked ? 'bg-gray-100 border-gray-200 cursor-not-allowed' : 'bg-white border-gray-100 hover:border-gray-200'}`}
            />
        </div>
    </div>
))
AcadTF.displayName = "AcadTF"

const DD = React.memo(({ label, val, k, opts, icon: Icon, isObj = false, isLocked, onChange }: any) => (
    <div className="flex flex-col mb-3">
        <label className="text-[10px] font-medium text-gray-500 mb-1.5 uppercase tracking-wider">{label}</label>
        <div className="relative w-full">
            {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" size={15} />}
            <select
                disabled={isLocked}
                value={val}
                onChange={e => onChange(k, e.target.value)}
                style={{ paddingLeft: Icon ? '2.5rem' : '0.875rem' }}
                className={`w-full h-11 rounded-xl border-2 appearance-none focus:border-[#2E75C7] focus:ring-2 focus:ring-[#2E75C7]/10 outline-none pr-9 text-sm font-light text-gray-900 transition-all ${isLocked ? 'bg-gray-100 border-gray-200 cursor-not-allowed' : 'bg-white border-gray-100 hover:border-gray-200'}`}
            >
                <option value="">Select</option>
                {opts?.map((o: any, i: number) => {
                    const optId = isObj ? o.id : o
                    const optVal = isObj ? (o.name || o.value) : o
                    return <option key={i} value={optId}>{optVal}</option>
                })}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={15} />
        </div>
    </div>
))
DD.displayName = "DD"

const Section = ({ title, icon: Icon, children }: any) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
        <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2.5 bg-gray-50/50">
            <div className="p-1.5 bg-[#2E75C7]/10 rounded-lg flex-shrink-0">
                <Icon size={15} className="text-[#2E75C7]" />
            </div>
            <h3 className="font-semibold text-[#1A3A6B] text-sm">{title}</h3>
        </div>
        <div className="p-4">{children}</div>
    </div>
)

// ─────────────────────────────────────────────────────────────────────────────

export default function AdmissionForm({ user, onSuccess }: { user: any, onSuccess?: () => void }) {
    const router = useRouter()
    const supabase = getSupabaseClient()
    
    const [currentStep, setCurrentStep] = useState(0)
    const [metadata, setMetadata] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isLocked, setIsLocked] = useState(false)
    const [feeDetails, setFeeDetails] = useState<any>(null)
    const [fetchingFees, setFetchingFees] = useState(false)
    const [isUploadingDoc, setIsUploadingDoc] = useState(false)
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
    const [docType, setDocType] = useState("")

    const [formData, setFormData] = useState<any>({
        registration_no: "", merit_no: "", 
        stream_id: "", course_id: "", academic_year_id: "", 
        scholarship_category_id: "", admission_type: "",
        admission_category: "",
        how_did_you_know: "",
        firstname: "", middlename: "", lastname: "", fullname: "",
        fatherName: "", father_email: "", 
        motherName: "", mother_email: "",
        father_occupation: "", mother_occupation: "",
        father_annual_income: "", mother_annual_income: "",
        email: user?.email || "", dateOfBirth: "", gender: "",
        religion: "", caste: "", blood_group: "",
        nationality: "Indian", place_of_birth: "", native_place: "",
        aadharCardNumber: "", pan_no: "",
        abc_id: "", apaar_id: "",
        father_mobile_no: "", mother_mobile_no: "",
        domicile_of_maharashtra: "false", phd_handicap: "false",
        studentMobileNo: "", secondary_phone: "",
        address: "", city: "", state: "", zipcode: "",
        taluka: "", district: "",
        perm_address: "", perm_city: "", perm_state: "", perm_zipcode: "",
        perm_taluka: "", perm_district: "",
        same_as_correspondence: false,
        other_doc_name: "",
        academic_records: {
            ssc_year: "", ssc_seat: "", ssc_inst: "", ssc_inst_addr: "", ssc_board: "", ssc_obt: "", ssc_out: "", ssc_pct: "",
            hsc_year: "", hsc_seat: "", hsc_inst: "", hsc_inst_addr: "", hsc_board: "", hsc_phy: "", hsc_math: "", hsc_chem: "", hsc_obt: "", hsc_out: "", hsc_pct: "",
            dip_year: "", dip_seat: "", dip_inst: "", dip_inst_addr: "", dip_board: "", dip_pct: "",
            dsy_inst: "", dsy_inst_addr: "", dsy_code: "", dsy_branch: "", dsy_obt: "", dsy_out: "",
            cet_seat: "", cet_pct: "", jee_seat: "", jee_total: "", nata_seat: "", nata_obt: "", nata_out: ""
        },
        documents: [],
        photo_path: ""
    })

    useEffect(() => { init() }, [])

    const init = async () => {
        setIsLoading(true)
        try {
            await Promise.all([fetchMetadata(), fetchStudent()])
        } catch (error) {
            console.error("Init Error", error)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchMetadata = async () => {
        const data = await getAdmissionMetadata(supabase)
        setMetadata(data)
    }

    const fetchStudent = async () => {
        try {
            const student = await getStudentProfile(supabase, user.id)
            if (student) {
                setIsLocked(student.is_locked === true)
                setFormData({
                    how_did_you_know: student.how_did_you_know || "",
                    registration_no: student.registration_no || "",
                    merit_no: student.merit_no || "",
                    scholarship_category_id: student.scholarship_category_id || "",
                    stream_id: student.courses?.stream_id || "",
                    course_id: student.course_id || "",
                    academic_year_id: student.admission_year_id || "",
                    admission_type: student.admission_type || "",
                    admission_category: student.admission_category || "",
                    firstname: student.firstname || "",
                    middlename: student.middlename || "",
                    lastname: student.lastname || "",
                    fullname: student.fullname || "",
                    fatherName: student.father_name || "",
                    father_email: student.father_email || "",
                    motherName: student.mother_name || "",
                    mother_email: student.mother_email || "",
                    father_occupation: student.father_occupation || "",
                    mother_occupation: student.mother_occupation || "",
                    father_annual_income: student.father_annual_income || "",
                    mother_annual_income: student.mother_annual_income || "",
                    email: student.email || user.email || "",
                    dateOfBirth: student.dateofbirth || "",
                    gender: student.gender || "",
                    religion: student.religion || "",
                    caste: student.caste || "",
                    blood_group: student.blood_group || "",
                    nationality: student.nationality || "Indian",
                    place_of_birth: student.place_of_birth || "",
                    native_place: student.native_place || "",
                    aadharCardNumber: student.aadhar_card_number || "",
                    pan_no: student.pan_no || "",
                    abc_id: student.abc_id || "",
                    apaar_id: student.apaar_id || "",
                    father_mobile_no: student.father_mobile_no || "",
                    mother_mobile_no: student.mother_mobile_no || "",
                    domicile_of_maharashtra: student.domicile_of_maharashtra === "true" || student.domicile_of_maharashtra === true ? "true" : "false",
                    phd_handicap: student.phd_handicap === "true" || student.phd_handicap === true ? "true" : "false",
                    studentMobileNo: student.student_mobile_no || student.phone || "",
                    secondary_phone: student.secondary_phone || "",
                    address: student.address || "",
                    city: student.city || "",
                    state: student.state || "",
                    zipcode: student.zipcode || "",
                    taluka: student.correspondence_details?.taluka || "",
                    district: student.correspondence_details?.district || "",
                    perm_address: student.permanent_details?.address || "",
                    perm_city: student.permanent_details?.city || "",
                    perm_state: student.permanent_details?.state || "",
                    perm_zipcode: student.permanent_details?.zipcode || "",
                    perm_taluka: student.permanent_details?.taluka || "",
                    perm_district: student.permanent_details?.district || "",
                    academic_records: {
                        ssc_year: student.academic_records?.ssc_year || "",
                        ssc_seat: student.academic_records?.ssc_seat || "",
                        ssc_inst: student.academic_records?.ssc_inst || "",
                        ssc_inst_addr: student.academic_records?.ssc_inst_addr || "",
                        ssc_board: student.academic_records?.ssc_board || "",
                        ssc_obt: student.academic_records?.ssc_obt || "",
                        ssc_out: student.academic_records?.ssc_out || "",
                        ssc_pct: student.academic_records?.ssc_pct || "",
                        hsc_year: student.academic_records?.hsc_year || "",
                        hsc_seat: student.academic_records?.hsc_seat || "",
                        hsc_inst: student.academic_records?.hsc_inst || "",
                        hsc_inst_addr: student.academic_records?.hsc_inst_addr || "",
                        hsc_board: student.academic_records?.hsc_board || "",
                        hsc_phy: student.academic_records?.hsc_phy || "",
                        hsc_math: student.academic_records?.hsc_math || "",
                        hsc_chem: student.academic_records?.hsc_chem || "",
                        hsc_obt: student.academic_records?.hsc_obt || "",
                        hsc_out: student.academic_records?.hsc_out || "",
                        hsc_pct: student.academic_records?.hsc_pct || "",
                        dip_year: student.academic_records?.dip_year || "",
                        dip_seat: student.academic_records?.dip_seat || "",
                        dip_inst: student.academic_records?.dip_inst || "",
                        dip_inst_addr: student.academic_records?.dip_inst_addr || "",
                        dip_board: student.academic_records?.dip_board || "",
                        dip_pct: student.academic_records?.dip_pct || "",
                        dsy_inst: student.academic_records?.dsy_inst || "",
                        dsy_inst_addr: student.academic_records?.dsy_inst_addr || "",
                        dsy_code: student.academic_records?.dsy_code || "",
                        dsy_branch: student.academic_records?.dsy_branch || "",
                        dsy_obt: student.academic_records?.dsy_obt || "",
                        dsy_out: student.academic_records?.dsy_out || "",
                        cet_seat: student.academic_records?.cet_seat || "",
                        cet_pct: student.academic_records?.cet_pct || "",
                        jee_seat: student.academic_records?.jee_seat || "",
                        jee_total: student.academic_records?.jee_total || "",
                        nata_seat: student.academic_records?.nata_seat || "",
                        nata_obt: student.academic_records?.nata_obt || "",
                        nata_out: student.academic_records?.nata_out || ""
                    },
                    photo_path: student.photo_path || "",
                    documents: student.documents || []
                })
            }
        } catch (error) {
            console.error("Fetch Student Error", error)
        }
    }

    useEffect(() => {
        const fetchFees = async () => {
            const { course_id, academic_year_id, scholarship_category_id } = formData
            if (!course_id || !academic_year_id) { setFeeDetails(null); return }
            setFetchingFees(true)
            try {
                const feesRes = await calculateStudentFees(supabase, {
                    courseId: course_id, 
                    academicYearId: academic_year_id, 
                    scholarshipCategoryId: scholarship_category_id,
                })
                setFeeDetails(feesRes)
            } catch (err) { console.error("Fee Fetch Error:", err) }
            finally { setFetchingFees(false) }
        }
        const t = setTimeout(fetchFees, 300)
        return () => clearTimeout(t)
    }, [formData.course_id, formData.academic_year_id, formData.scholarship_category_id])

    useEffect(() => {
        const obt = parseFloat(formData.academic_records.ssc_obt)
        const out = parseFloat(formData.academic_records.ssc_out)
        if (!isNaN(obt) && !isNaN(out) && out > 0)
            updateAcademic("ssc_pct", ((obt / out) * 100).toFixed(2))
    }, [formData.academic_records.ssc_obt, formData.academic_records.ssc_out])

    useEffect(() => {
        const obt = parseFloat(formData.academic_records.hsc_obt)
        const out = parseFloat(formData.academic_records.hsc_out)
        if (!isNaN(obt) && !isNaN(out) && out > 0)
            updateAcademic("hsc_pct", ((obt / out) * 100).toFixed(2))
    }, [formData.academic_records.hsc_obt, formData.academic_records.hsc_out])

    // useCallback to give stable references to change handlers passed into memoized components
    const update = React.useCallback((k: string, v: any) => {
        if (k === "stream_id") setFormData((f: any) => ({ ...f, [k]: v, course_id: "" }))
        else setFormData((f: any) => ({ ...f, [k]: v }))
    }, [])

    const updateAcademic = React.useCallback((k: string, v: any) => {
        setFormData((f: any) => ({ ...f, academic_records: { ...f.academic_records, [k]: v } }))
    }, [])

    const filteredCourses = metadata?.courses?.filter((c: any) => !formData.stream_id || c.stream_id === formData.stream_id) || []

    const saveDraft = async () => {
        if (isLocked) return
        const studentData: any = {
            user_id: user.id,
            registration_no: formData.registration_no,
            merit_no: formData.merit_no,
            admission_type: formData.admission_type,
            admission_category: formData.admission_category,
            scholarship_category_id: formData.scholarship_category_id,
            firstname: formData.firstname,
            middlename: formData.middlename,
            lastname: formData.lastname,
            fullname: formData.fullname || `${formData.firstname} ${formData.middlename} ${formData.lastname}`.replace(/\s+/g, ' ').trim(),
            father_name: formData.fatherName,
            father_email: formData.father_email,
            mother_name: formData.motherName,
            mother_email: formData.mother_email,
            father_occupation: formData.father_occupation,
            mother_occupation: formData.mother_occupation,
            father_annual_income: formData.father_annual_income,
            mother_annual_income: formData.mother_annual_income,
            email: formData.email,
            dateofbirth: formData.dateOfBirth,
            admission_year_id: formData.academic_year_id,
            course_id: formData.course_id,
            gender: formData.gender,
            religion: formData.religion,
            caste: formData.caste,
            blood_group: formData.blood_group,
            nationality: formData.nationality,
            place_of_birth: formData.place_of_birth,
            native_place: formData.native_place,
            aadhar_card_number: formData.aadharCardNumber,
            abc_id: formData.abc_id,
            apaar_id: formData.apaar_id,
            pan_no: formData.pan_no,
            student_mobile_no: formData.studentMobileNo,
            phone: formData.studentMobileNo,
            secondary_phone: formData.secondary_phone,
            father_mobile_no: formData.father_mobile_no,
            mother_mobile_no: formData.mother_mobile_no,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zipcode: formData.zipcode,
            correspondence_details: { taluka: formData.taluka, district: formData.district },
            permanent_details: {
                address: formData.perm_address,
                city: formData.perm_city,
                state: formData.perm_state,
                zipcode: formData.perm_zipcode,
                taluka: formData.perm_taluka,
                district: formData.perm_district
            },
            domicile_of_maharashtra: formData.domicile_of_maharashtra,
            phd_handicap: formData.phd_handicap,
            academic_records: formData.academic_records,
            photo_path: formData.photo_path,
            documents: formData.documents,
            how_did_you_know: formData.how_did_you_know
        }
        const { error } = await supabase.from('students').upsert(studentData, { onConflict: 'user_id' })
        if (error) console.error("Save Error:", error)
    }

    const next = async () => {
        if (currentStep < 4) {
            await saveDraft()
            setCurrentStep(s => s + 1)
            // Scroll to top of content area only, not window - prevents UX issues
            document.getElementById('form-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    }

    const prev = () => {
        if (currentStep > 0) { setCurrentStep(s => s - 1) }
    }

    const submit = async () => {
        setIsSaving(true)
        try {
            await saveDraft()
            alert("Application submitted successfully!")
            if (onSuccess) {
                onSuccess()
            } else {
                router.push("/")
            }
        } catch { alert("Error submitting. Please try again.") }
        finally { setIsSaving(false) }
    }

    const uploadDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!docType || isLocked) return
        const finalDocType = docType === "Other" ? formData.other_doc_name : docType
        if (!finalDocType) {
            alert("Please enter document name")
            return
        }
        const file = e.target.files?.[0]; if (!file) return
        setIsUploadingDoc(true)
        try {
            const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
            const fileName = `${user.id}_${Date.now()}_${cleanName}`
            const path = `student_docs/${fileName}`
            const { error } = await supabase.storage.from('student_documents').upload(path, file)
            if (error) throw error
            update("documents", [...formData.documents, { type: finalDocType, path }])
            setDocType("")
            update("other_doc_name", "")
            e.target.value = ""
        } catch { alert("Upload failed") }
        finally { setIsUploadingDoc(false) }
    }

    const previewDoc = (path: string) => {
        if (!path) return
        const { data } = supabase.storage.from('student_documents').getPublicUrl(path)
        window.open(data.publicUrl, '_blank')
    }

    const uploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isLocked) return
        const file = e.target.files?.[0]; if (!file) return
        setIsUploadingPhoto(true)
        try {
            const fileExt = file.name.split('.').pop()
            const path = `profile_photos/photo_${user.id}_${Date.now()}.${fileExt}`
            const { error } = await supabase.storage.from('student_documents').upload(path, file)
            if (error) throw error
            update("photo_path", path)
        } catch { alert("Photo upload failed") }
        finally { setIsUploadingPhoto(false) }
    }

    const removeDoc = (path: string) => {
        update("documents", formData.documents.filter((d: any) => (typeof d === 'string' ? d !== path : d.path !== path)))
    }

    const getPhotoUrl = () => {
        if (!formData.photo_path) return ""
        return supabase.storage.from('student_documents').getPublicUrl(formData.photo_path).data.publicUrl
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="animate-spin text-[#2E75C7]" size={32} />
                    <p className="font-light text-[#1A3A6B] text-sm tracking-wide">Initializing...</p>
                </div>
            </div>
        )
    }

    const photoUrl = getPhotoUrl()

    const getRequiredDocs = () => {
        if (!metadata?.documentRequirements) return []
        const reqs = metadata.documentRequirements
        const activeDocs = new Set<string>()

        // 1. Universal
        const universal = reqs.find((r: any) => r.value === 'Universal')
        if (universal) universal.metadata.docs.forEach((d: string) => activeDocs.add(d))

        // 2. Admission Type (FY / DSY)
        const typeReq = reqs.find((r: any) => r.value === formData.admission_type)
        if (typeReq) typeReq.metadata.docs.forEach((d: string) => activeDocs.add(d))

        // 3. Category
        const catReq = reqs.find((r: any) => r.value === formData.admission_category)
        if (catReq) catReq.metadata.docs.forEach((d: string) => activeDocs.add(d))

        // 4. Scholarship
        const schInfo = metadata.scholarshipCategories?.find((s: any) => s.id === formData.scholarship_category_id)
        if (schInfo) {
            const schReq = reqs.find((r: any) => r.value === schInfo.name)
            if (schReq) schReq.metadata.docs.forEach((d: string) => activeDocs.add(d))
        }

        return Array.from(activeDocs)
    }

    const mandatoryDocs = getRequiredDocs()

    return (
        <div className="min-h-screen bg-[#F5F7FB] pb-28" style={{ fontFamily: "'Poppins', sans-serif" }}>

            {/* ── Sticky Header ─────────────────────────────────── */}
            <div className={`sticky top-0 z-50 shadow-md ${isLocked ? 'bg-[#7B3F00]' : 'bg-gradient-to-r from-[#1A3A6B] to-[#2E75C7]'}`}>
                <div className="max-w-3xl mx-auto px-3 pt-3 pb-0">

                    {/* Top row */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <button onClick={() => router.push('/')} className="p-1.5 hover:bg-white/20 rounded-lg transition flex-shrink-0">
                                <ArrowLeft color="white" size={18} />
                            </button>
                            <div className="min-w-0">
                                <h1 className="text-white font-bold text-[11px] sm:text-base tracking-wider uppercase leading-tight">
                                    {isLocked ? 'System Enrollment (Locked)' : 'System Enrollment'}
                                </h1>
                                <p className="text-white/50 text-[7px] font-medium uppercase tracking-[0.15em] leading-tight">Secure Backend Validation In Effect</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                            <button onClick={init} className="p-1.5 hover:bg-white/10 rounded-lg transition">
                                <RefreshCw size={15} className="text-white/80" />
                            </button>
                            {isLocked ? (
                                <div className="flex items-center gap-1 bg-white/15 px-2.5 py-1 rounded-full">
                                    <Lock size={11} color="white" />
                                    <span className="text-white text-[10px] font-medium">Locked</span>
                                </div>
                            ) : (
                                <div className="bg-white/20 px-2.5 py-1 rounded-full border border-white/10">
                                    <span className="text-white text-[10px] font-medium">{currentStep + 1} / 5</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Step Bar */}
                    <div className="flex items-end gap-0">
                        {StepNames.map((name, i) => {
                            const IconComponent = StepIcons[i]
                            const active = i === currentStep
                            const done = i < currentStep
                            return (
                                <div key={i} onClick={() => setCurrentStep(i)}
                                    className="flex-1 cursor-pointer group flex flex-col items-center">
                                    <div className={`w-full h-1 rounded-t-sm transition-all ${done ? 'bg-green-400' : active ? 'bg-white' : 'bg-white/20'}`} />
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center mt-2 mb-2 transition-all ${done ? 'bg-green-400' : active ? 'bg-white shadow-md' : 'bg-white/10'}`}>
                                        {done
                                            ? <Check size={13} color="white" />
                                            : <IconComponent size={13} className={active ? 'text-[#1A3A6B]' : 'text-white/50'} />
                                        }
                                    </div>
                                    <span className={`text-[8px] font-medium pb-1.5 hidden sm:block ${active ? 'text-white' : 'text-white/40'}`}>{name}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Lock Banner */}
            {isLocked && (
                <div className="max-w-3xl mx-auto px-3 mt-4">
                    <div className="bg-orange-50 border border-orange-200 px-4 py-3 rounded-xl flex items-center gap-3">
                        <Lock size={15} className="text-orange-500 flex-shrink-0" />
                        <p className="text-orange-800 text-xs font-light">This application is locked for administrative review. No changes can be made.</p>
                    </div>
                </div>
            )}

            {/* ── Form Content ──────────────────────────────────── */}
            <div id="form-content" className="max-w-3xl mx-auto sm:px-3 px-0 pt-4">

                {/* STEP 0: Personal */}
                {currentStep === 0 && (
                    <div>
                        <Section title="Institutional Records" icon={CheckCircle}>
                            <div className="mb-4 bg-amber-50/50 border border-dashed border-amber-200 rounded-xl p-3 flex items-center gap-3">
                                <Info size={14} className="text-amber-600" />
                                <p className="text-[10px] font-medium text-amber-800 uppercase tracking-wide">Note: The following records are assigned by the Administration Office.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <TF label="Registration No." val={formData.registration_no} k="registration_no" icon={CheckCircle} isLocked={true} onChange={update} />
                                    <div className="flex items-center gap-1 mt-[-8px] mb-2 px-1">
                                        <ShieldAlert size={10} className="text-blue-500" />
                                        <span className="text-[9px] font-bold text-blue-500 uppercase tracking-tighter">Admin Assigned</span>
                                    </div>
                                </div>
                                <div>
                                    <TF label="Merit No." val={formData.merit_no} k="merit_no" icon={Trophy} isLocked={true} onChange={update} />
                                    <div className="flex items-center gap-1 mt-[-8px] mb-2 px-1">
                                        <ShieldAlert size={10} className="text-blue-500" />
                                        <span className="text-[9px] font-bold text-blue-500 uppercase tracking-tighter">Admin Assigned</span>
                                    </div>
                                </div>
                            </div>
                        </Section>

                        <Section title="Academic Routing" icon={BookOpen}>
                             <div className="grid grid-cols-2 gap-3">
                                <DD label="Stream" val={formData.stream_id} k="stream_id" opts={metadata?.streams} isObj icon={Info} isLocked={isLocked} onChange={update} />
                                <DD label="Course" val={formData.course_id} k="course_id" opts={filteredCourses} isObj icon={BookOpen} isLocked={isLocked} onChange={update} />
                                <DD label="Admission Year" val={formData.academic_year_id} k="academic_year_id" opts={metadata?.yearCategories} isObj icon={Calendar} isLocked={isLocked} onChange={update} />
                            </div>


                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <DD label="Scholarship Scheme" val={formData.scholarship_category_id} k="scholarship_category_id" opts={metadata?.scholarshipCategories} isObj icon={CreditCard} isLocked={isLocked} onChange={update} />
                                    {formData.scholarship_category_id && (
                                        <div className="flex items-start gap-1 pb-1 px-1">
                                            <ShieldAlert size={10} className="text-amber-500 mt-0.5 shrink-0" />
                                            <p className="text-[9px] font-medium text-amber-600 leading-tight italic">
                                                Adds: {metadata?.documentRequirements?.find((r: any) => r.value === metadata.scholarshipCategories?.find((s: any) => s.id === formData.scholarship_category_id)?.name)?.metadata?.docs?.join(", ")}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <DD label="Admission Type" val={formData.admission_type} k="admission_type" opts={metadata?.staticOptions?.admissionTypes} icon={CheckCircle} isLocked={isLocked} onChange={update} />
                                <div className="space-y-1 md:col-span-2">
                                    <DD label="Admission Category" val={formData.admission_category} k="admission_category" opts={metadata?.staticOptions?.admissionCategories} icon={Info} isLocked={isLocked} onChange={update} />
                                    {formData.admission_category && (
                                        <div className="flex items-start gap-1 pb-1 px-1">
                                            <ShieldAlert size={10} className="text-blue-500 mt-0.5 shrink-0" />
                                            <p className="text-[9px] font-medium text-blue-600 leading-tight italic">
                                                Adds: {metadata?.documentRequirements?.find((r: any) => r.value === formData.admission_category)?.metadata?.docs?.join(", ")}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Dynamic Summary Box */}
                            {formData.admission_type && formData.admission_category && (
                                <div className="mt-4 p-4 bg-[#F0F7FF] border border-[#2E75C7]/20 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="flex items-center gap-2 mb-3">
                                        <ShieldAlert size={16} className="text-[#1A3A6B]" />
                                        <h4 className="text-[#1A3A6B] font-black text-[10px] uppercase tracking-widest">Registration Requirement Summary</h4>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {mandatoryDocs.map((doc: string) => (
                                            <div 
                                                key={doc} 
                                                className="px-3 py-1 bg-white border border-[#2E75C7]/15 rounded-full text-[9px] font-light text-[#2E75C7] capitalize tracking-wide shadow-sm"
                                                style={{ fontFamily: "'Poppins', sans-serif" }}
                                            >
                                                {doc.toLowerCase()}
                                            </div>
                                        ))}
                                    </div>
                                    <p className="mt-3 text-[9px] text-gray-400 font-medium italic border-t border-[#2E75C7]/5 pt-2 uppercase tracking-tighter">
                                        * Total {mandatoryDocs.length} documents identified for your {formData.admission_type} ({formData.admission_category}) profile.
                                    </p>
                                </div>
                            )}

                            {formData.course_id && formData.academic_year_id && (
                                <div className="my-3 bg-white border-2 border-[#2E75C7]/20 rounded-2xl overflow-hidden">
                                    <div className="px-4 py-3 flex justify-between items-center border-b border-gray-50">
                                        <span className="text-gray-400 text-[10px] font-medium uppercase tracking-wider">Gross Fee</span>
                                        <span className="text-[#1A3A6B] text-sm font-semibold">₹{feeDetails?.totalFee || 0}</span>
                                    </div>
                                    <div className="px-4 py-3 flex justify-between items-center border-b border-gray-50">
                                        <span className="text-gray-400 text-[10px] font-medium uppercase tracking-wider">Scholarship Offset</span>
                                        <span className="text-green-600 text-sm font-semibold">- ₹{feeDetails?.scholarshipAmt || 0}</span>
                                    </div>
                                    <div className="px-4 py-3 flex justify-between items-center bg-gradient-to-r from-[#1A3A6B] to-[#2E75C7]">
                                        <span className="text-white/80 text-[10px] font-medium uppercase tracking-wider">Net Payable</span>
                                        <span className="text-white text-lg font-bold">₹{feeDetails?.netPayable || 0}</span>
                                    </div>
                                </div>
                            )}

                            <DD label="How did you hear about us?" val={formData.how_did_you_know} k="how_did_you_know" opts={metadata?.staticOptions?.howDidYouKnow} icon={Info} isLocked={isLocked} onChange={update} />
                        </Section>

                        <Section title="Personal & Family" icon={User}>
                            {/* Photo Upload - clickable frame, no button */}
                            <label className={`flex items-center gap-4 mb-4 p-3 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-all ${isLocked ? '' : 'cursor-pointer'}`}>
                                <div className="flex-shrink-0 w-14 h-16 rounded-lg border border-gray-200 bg-white flex items-center justify-center overflow-hidden shadow-sm">
                                    {photoUrl ? (
                                        <img src={photoUrl} alt="Student" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={28} className="text-gray-200" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-[#1A3A6B] leading-snug">Passport Photo</p>
                                    <p className="text-[10px] font-light text-gray-400 mt-0.5 leading-relaxed">
                                        {isUploadingPhoto ? "Uploading..." : photoUrl ? "✓ Uploaded — tap to change" : "Tap to upload · JPG, PNG · max 2MB"}
                                    </p>
                                </div>
                                {isUploadingPhoto && <RefreshCw className="animate-spin text-[#2E75C7] flex-shrink-0" size={16} />}
                                {!isLocked && <input type="file" className="hidden" accept="image/*" onChange={uploadPhoto} />}
                            </label>

                            <div className="grid grid-cols-3 gap-3">
                                <TF label="First Name" val={formData.firstname} k="firstname" icon={User} isLocked={isLocked} onChange={update} />
                                <TF label="Middle Name" val={formData.middlename} k="middlename" icon={User} isLocked={isLocked} onChange={update} />
                                <TF label="Last Name" val={formData.lastname} k="lastname" icon={User} isLocked={isLocked} onChange={update} />
                            </div>
                            <TF label="Full Name (As per Marksheet)" val={formData.fullname} k="fullname" icon={User} isLocked={isLocked} onChange={update} />
                            
                            <div className="grid grid-cols-2 gap-3">
                                <TF label="Father's Name" val={formData.fatherName} k="fatherName" icon={User} isLocked={isLocked} onChange={update} />
                                <TF label="Father Email" val={formData.father_email} k="father_email" type="email" icon={Info} isLocked={isLocked} onChange={update} />
                                <TF label="Mother's Name" val={formData.motherName} k="motherName" icon={User} isLocked={isLocked} onChange={update} />
                                <TF label="Mother Email" val={formData.mother_email} k="mother_email" type="email" icon={Info} isLocked={isLocked} onChange={update} />
                                <TF label="Father's Occupation" val={formData.father_occupation} k="father_occupation" icon={Info} isLocked={isLocked} onChange={update} />
                                <TF label="Mother's Occupation" val={formData.mother_occupation} k="mother_occupation" icon={Info} isLocked={isLocked} onChange={update} />
                                <TF label="Father Annual Income" val={formData.father_annual_income} k="father_annual_income" type="number" icon={CreditCard} isLocked={isLocked} onChange={update} />
                                <TF label="Mother Annual Income" val={formData.mother_annual_income} k="mother_annual_income" type="number" icon={CreditCard} isLocked={isLocked} onChange={update} />
                                <TF label="Email" val={formData.email} k="email" type="email" icon={Info} isLocked={isLocked} onChange={update} />
                                <TF label="Date of Birth" val={formData.dateOfBirth} k="dateOfBirth" type="date" icon={Calendar} isLocked={isLocked} onChange={update} />
                                <DD label="Gender" val={formData.gender} k="gender" opts={metadata?.staticOptions?.genders} icon={User} isLocked={isLocked} onChange={update} />
                                <TF label="Nationality" val={formData.nationality} k="nationality" icon={Info} isLocked={isLocked} onChange={update} />
                                <TF label="Religion" val={formData.religion} k="religion" icon={Info} isLocked={isLocked} onChange={update} />
                                <TF label="Caste / Sub-Caste" val={formData.caste} k="caste" icon={Info} isLocked={isLocked} onChange={update} />
                                <DD label="Blood Group" val={formData.blood_group} k="blood_group" opts={metadata?.staticOptions?.bloodGroups} icon={Info} isLocked={isLocked} onChange={update} />
                                 <TF label="Place of Birth" val={formData.place_of_birth} k="place_of_birth" icon={Home} isLocked={isLocked} onChange={update} />
                                <TF label="Native Place" val={formData.native_place} k="native_place" icon={Home} isLocked={isLocked} onChange={update} />
                                <TF label="Aadhar No." val={formData.aadharCardNumber} k="aadharCardNumber" max={12} type="number" icon={Info} isLocked={isLocked} onChange={update} />
                                <TF label="ABC ID" val={formData.abc_id} k="abc_id" icon={Info} isLocked={isLocked} onChange={update} />
                                <TF label="APAAR ID" val={formData.apaar_id} k="apaar_id" icon={Info} isLocked={isLocked} onChange={update} />
                            </div>
                            <TF label="PAN No." val={formData.pan_no} k="pan_no" max={10} icon={Info} isLocked={isLocked} onChange={update} />

                            <div className="grid grid-cols-2 gap-3 mt-2">
                                <label className={`border ${formData.domicile_of_maharashtra === 'true' ? 'bg-[#2E75C7]/5 border-[#2E75C7]' : 'bg-gray-50 border-gray-100'} rounded-xl p-3 flex justify-between items-center ${isLocked ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                                    <span className={`text-[10px] font-medium ${formData.domicile_of_maharashtra === 'true' ? 'text-[#1A3A6B]' : 'text-gray-400'}`}>MH Domicile</span>
                                    <input type="checkbox" disabled={isLocked} className="accent-[#1A3A6B]" checked={formData.domicile_of_maharashtra === 'true'} onChange={e => update('domicile_of_maharashtra', e.target.checked ? 'true' : 'false')} />
                                </label>
                                <label className={`border ${formData.phd_handicap === 'true' ? 'bg-[#2E75C7]/5 border-[#2E75C7]' : 'bg-gray-50 border-gray-100'} rounded-xl p-3 flex justify-between items-center ${isLocked ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                                    <span className={`text-[10px] font-medium ${formData.phd_handicap === 'true' ? 'text-[#1A3A6B]' : 'text-gray-400'}`}>Physically Handicapped</span>
                                    <input type="checkbox" disabled={isLocked} className="accent-[#1A3A6B]" checked={formData.phd_handicap === 'true'} onChange={e => update('phd_handicap', e.target.checked ? 'true' : 'false')} />
                                </label>
                            </div>
                        </Section>
                    </div>
                )}

                {/* STEP 1: Address */}
                {currentStep === 1 && (
                    <div className="space-y-6">
                        <Section title="Correspondence Address" icon={MapPin}>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <TF label="Student Mobile" val={formData.studentMobileNo} k="studentMobileNo" type="tel" icon={Info} isLocked={isLocked} onChange={update} />
                                <TF label="Alternate Mobile" val={formData.secondary_phone} k="secondary_phone" type="tel" icon={Info} isLocked={isLocked} onChange={update} />
                                <TF label="Father Mobile" val={formData.father_mobile_no} k="father_mobile_no" type="tel" icon={Info} isLocked={isLocked} onChange={update} />
                                <TF label="Mother Mobile" val={formData.mother_mobile_no} k="mother_mobile_no" type="tel" icon={Info} isLocked={isLocked} onChange={update} />
                            </div>
                            <TF label="Current Address" val={formData.address} k="address" isTA isLocked={isLocked} onChange={update} />
                            <div className="grid grid-cols-2 gap-3">
                                <TF label="City" val={formData.city} k="city" icon={Home} isLocked={isLocked} onChange={update} />
                                <TF label="State" val={formData.state} k="state" icon={Info} isLocked={isLocked} onChange={update} />
                                <TF label="Pin Code" val={formData.zipcode} k="zipcode" type="number" max={6} icon={Info} isLocked={isLocked} onChange={update} />
                                <TF label="Taluka" val={formData.taluka} k="taluka" icon={Info} isLocked={isLocked} onChange={update} />
                            </div>
                            <TF label="District" val={formData.district} k="district" icon={MapPin} isLocked={isLocked} onChange={update} />
                        </Section>

                        <Section title="Permanent Address" icon={Home}>
                            <label className={`flex items-center gap-3 mb-6 p-4 bg-[#F5F7FB] border border-dashed border-[#2E75C7]/30 rounded-2xl transition-all ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-[#F0F4F8]'}`}>
                                <input 
                                    type="checkbox" 
                                    disabled={isLocked}
                                    className="w-5 h-5 accent-[#1A3A6B] rounded-lg"
                                    checked={formData.same_as_correspondence}
                                    onChange={e => {
                                        const checked = e.target.checked
                                        update('same_as_correspondence', checked)
                                        if (checked) {
                                            setFormData((f: any) => ({
                                                ...f,
                                                perm_address: f.address,
                                                perm_city: f.city,
                                                perm_state: f.state,
                                                perm_zipcode: f.zipcode,
                                                perm_taluka: f.taluka,
                                                perm_district: f.district
                                            }))
                                        }
                                    }}
                                />
                                <span className="text-[11px] font-semibold text-[#1A3A6B] uppercase tracking-wider">Same as correspondence address</span>
                            </label>

                            {!formData.same_as_correspondence && (
                                <div className="space-y-0">
                                    <TF label="Full Permanent Address" val={formData.perm_address} k="perm_address" isTA isLocked={isLocked} onChange={update} />
                                    <div className="grid grid-cols-2 gap-3">
                                        <TF label="City" val={formData.perm_city} k="perm_city" icon={Home} isLocked={isLocked} onChange={update} />
                                        <TF label="State" val={formData.perm_state} k="perm_state" icon={Info} isLocked={isLocked} onChange={update} />
                                        <TF label="Pin Code" val={formData.perm_zipcode} k="perm_zipcode" type="number" max={6} icon={Info} isLocked={isLocked} onChange={update} />
                                        <TF label="Taluka" val={formData.perm_taluka} k="perm_taluka" icon={Info} isLocked={isLocked} onChange={update} />
                                    </div>
                                    <TF label="District" val={formData.perm_district} k="perm_district" icon={MapPin} isLocked={isLocked} onChange={update} />
                                </div>
                            )}
                            
                            {formData.same_as_correspondence && (
                                <div className="p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3">
                                    <CheckCircle size={18} className="text-green-500" />
                                    <p className="text-[10px] font-medium text-green-800 uppercase tracking-widest leading-none">Address Data Synchronized</p>
                                </div>
                            )}
                        </Section>
                    </div>
                )}

                {/* STEP 2: Academic */}
                {currentStep === 2 && (
                    <div>
                        <Section title="SSC (10th)" icon={BookOpen}>
                            <div className="grid grid-cols-2 gap-3">
                                <AcadTF label="Month & Year" val={formData.academic_records.ssc_year} k="ssc_year" isLocked={isLocked} onChange={updateAcademic} />
                                <AcadTF label="Seat No." val={formData.academic_records.ssc_seat} k="ssc_seat" isLocked={isLocked} onChange={updateAcademic} />
                            </div>
                             <AcadTF label="Institute Name" val={formData.academic_records.ssc_inst} k="ssc_inst" isLocked={isLocked} onChange={updateAcademic} />
                            <AcadTF label="Institute Address" val={formData.academic_records.ssc_inst_addr} k="ssc_inst_addr" isLocked={isLocked} onChange={updateAcademic} />
                            <AcadTF label="Board" val={formData.academic_records.ssc_board} k="ssc_board" isLocked={isLocked} onChange={updateAcademic} />
                            <div className="grid grid-cols-2 gap-3">
                                <AcadTF label="Marks Obtained" val={formData.academic_records.ssc_obt} k="ssc_obt" type="number" isLocked={isLocked} onChange={updateAcademic} />
                                <AcadTF label="Out of" val={formData.academic_records.ssc_out} k="ssc_out" type="number" isLocked={isLocked} onChange={updateAcademic} />
                            </div>
                            <AcadTF label="Aggregate %" val={formData.academic_records.ssc_pct} k="ssc_pct" isLocked={isLocked} onChange={updateAcademic} />
                        </Section>

                        <Section title="HSC (12th)" icon={BookOpen}>
                            <div className="grid grid-cols-2 gap-3">
                                <AcadTF label="Month & Year" val={formData.academic_records.hsc_year} k="hsc_year" isLocked={isLocked} onChange={updateAcademic} />
                                <AcadTF label="Seat No." val={formData.academic_records.hsc_seat} k="hsc_seat" isLocked={isLocked} onChange={updateAcademic} />
                            </div>
                             <AcadTF label="Institute Name" val={formData.academic_records.hsc_inst} k="hsc_inst" isLocked={isLocked} onChange={updateAcademic} />
                            <AcadTF label="Institute Address" val={formData.academic_records.hsc_inst_addr} k="hsc_inst_addr" isLocked={isLocked} onChange={updateAcademic} />
                            <AcadTF label="Board" val={formData.academic_records.hsc_board} k="hsc_board" isLocked={isLocked} onChange={updateAcademic} />
                            <div className="bg-[#2E75C7]/5 px-3 py-2 rounded-lg mb-3 border-l-2 border-[#2E75C7]">
                                <span className="text-[#2E75C7] text-[10px] font-medium uppercase tracking-wide">Subject Marks (per 100)</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <AcadTF label="Physics" val={formData.academic_records.hsc_phy} k="hsc_phy" isLocked={isLocked} onChange={updateAcademic} />
                                <AcadTF label="Maths" val={formData.academic_records.hsc_math} k="hsc_math" isLocked={isLocked} onChange={updateAcademic} />
                                <AcadTF label="Chemistry" val={formData.academic_records.hsc_chem} k="hsc_chem" isLocked={isLocked} onChange={updateAcademic} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <AcadTF label="Total Obtained" val={formData.academic_records.hsc_obt} k="hsc_obt" type="number" isLocked={isLocked} onChange={updateAcademic} />
                                <AcadTF label="Out of" val={formData.academic_records.hsc_out} k="hsc_out" type="number" isLocked={isLocked} onChange={updateAcademic} />
                            </div>
                            <AcadTF label="Aggregate %" val={formData.academic_records.hsc_pct} k="hsc_pct" isLocked={isLocked} onChange={updateAcademic} />
                        </Section>

                        <Section title="Diploma (if applicable)" icon={Trophy}>
                            <div className="grid grid-cols-2 gap-3">
                                <AcadTF label="Month & Year" val={formData.academic_records.dip_year} k="dip_year" isLocked={isLocked} onChange={updateAcademic} />
                                <AcadTF label="Seat No." val={formData.academic_records.dip_seat} k="dip_seat" isLocked={isLocked} onChange={updateAcademic} />
                            </div>
                             <AcadTF label="Institute Name" val={formData.academic_records.dip_inst} k="dip_inst" isLocked={isLocked} onChange={updateAcademic} />
                            <AcadTF label="Institute Address" val={formData.academic_records.dip_inst_addr} k="dip_inst_addr" isLocked={isLocked} onChange={updateAcademic} />
                            <AcadTF label="Board / University" val={formData.academic_records.dip_board} k="dip_board" isLocked={isLocked} onChange={updateAcademic} />
                            <AcadTF label="Aggregate %" val={formData.academic_records.dip_pct} k="dip_pct" isLocked={isLocked} onChange={updateAcademic} />
                        </Section>

                        <Section title="Direct Second Year (DSY)" icon={CheckCircle}>
                             <div className="grid grid-cols-2 gap-3">
                                <AcadTF label="Institute" val={formData.academic_records.dsy_inst} k="dsy_inst" isLocked={isLocked} onChange={updateAcademic} />
                                <AcadTF label="Institute Address" val={formData.academic_records.dsy_inst_addr} k="dsy_inst_addr" isLocked={isLocked} onChange={updateAcademic} />
                                <AcadTF label="Institute Code" val={formData.academic_records.dsy_code} k="dsy_code" isLocked={isLocked} onChange={updateAcademic} />
                                <AcadTF label="Board" val={formData.academic_records.dsy_branch} k="dsy_branch" isLocked={isLocked} onChange={updateAcademic} />
                                <AcadTF label="Branch" val={formData.academic_records.dsy_code} k="dsy_code" isLocked={isLocked} onChange={updateAcademic} />
                            </div>
                        </Section>
                    </div>
                )}

                {/* STEP 3: Exams */}
                {currentStep === 3 && (
                    <div>
                        <Section title="MHT-CET" icon={Trophy}>
                            <div className="grid grid-cols-2 gap-3">
                                <AcadTF label="CET Seat No." val={formData.academic_records.cet_seat} k="cet_seat" isLocked={isLocked} onChange={updateAcademic} />
                                <AcadTF label="Percentile" val={formData.academic_records.cet_pct} k="cet_pct" isLocked={isLocked} onChange={updateAcademic} />
                            </div>
                        </Section>
                        <Section title="JEE Main" icon={Trophy}>
                            <div className="grid grid-cols-2 gap-3">
                                <AcadTF label="Application No." val={formData.academic_records.jee_seat} k="jee_seat" isLocked={isLocked} onChange={updateAcademic} />
                                <AcadTF label="P+C+M Score" val={formData.academic_records.jee_total} k="jee_total" isLocked={isLocked} onChange={updateAcademic} />
                            </div>
                        </Section>
                        <Section title="NATA (Architecture)" icon={BookOpen}>
                            <AcadTF label="NATA Seat No." val={formData.academic_records.nata_seat} k="nata_seat" isLocked={isLocked} onChange={updateAcademic} />
                            <div className="grid grid-cols-2 gap-3">
                                <AcadTF label="Marks Obtained" val={formData.academic_records.nata_obt} k="nata_obt" isLocked={isLocked} onChange={updateAcademic} />
                                <AcadTF label="Out of" val={formData.academic_records.nata_out} k="nata_out" isLocked={isLocked} onChange={updateAcademic} />
                            </div>
                        </Section>
                        <div className="flex gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <Info size={16} className="text-[#2E75C7] flex-shrink-0 mt-0.5" />
                            <p className="text-xs font-light text-blue-900 leading-relaxed">Only fill in the exam results relevant to your application. Blank fields are acceptable.</p>
                        </div>
                    </div>
                )}

                {/* STEP 4: Documents */}
                {currentStep === 4 && (
                    <div className="space-y-4">
                        {/* Mandatory Checklist */}
                        <Section title="Mandatory Submission Checklist" icon={ShieldAlert}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                                {mandatoryDocs.map((docName: string) => {
                                    const isUploaded = formData.documents.some((d: any) => (typeof d === 'string' ? d === docName : d.type === docName))
                                    return (
                                        <div 
                                            key={docName} 
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 ${
                                                isUploaded 
                                                ? 'bg-green-50/50 border-green-200 text-green-700 shadow-sm' 
                                                : 'bg-red-50/50 border-red-200 text-red-600 shadow-sm'
                                            }`}
                                            style={{ fontFamily: "'Poppins', sans-serif" }}
                                        >
                                            <div className={`w-1.5 h-1.5 rounded-full ${isUploaded ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`} />
                                            <span className="text-[10px] font-light tracking-wide capitalize">
                                                {docName.toLowerCase()}
                                            </span>
                                            {isUploaded && <Check size={10} className="ml-auto text-green-600" />}
                                        </div>
                                    )
                                })}
                            </div>
                            <p className="text-[9px] text-gray-400 font-medium italic mt-2 uppercase tracking-tighter">* All above documents are mandatory based on your Category and Scholarship selections.</p>
                        </Section>

                        <Section title="Document Vault" icon={Folder}>
                            <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 mb-4">
                                <p className="text-[10px] font-medium text-blue-800 uppercase tracking-wide mb-3">Upload Documents</p>
                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="relative">
                                        <select
                                            disabled={isLocked}
                                            value={docType}
                                            onChange={e => setDocType(e.target.value)}
                                            className="w-full h-11 rounded-xl border-2 border-blue-100 bg-white pl-3 pr-9 text-sm font-light text-[#1A3A6B] focus:border-[#2E75C7] outline-none appearance-none"
                                        >
                                            <option value="">Select document type</option>
                                            {["Aadhar Card", "PAN Card", "SSC Marksheet", "HSC Marksheet", "Diploma Marksheet", "Diploma Passing Certificate", "MHT-CET Score Card", "NATA Score Card", "JEE Score Card", "Transfer Certificate", "Migration Certificate", "Income Certificate", "Caste Certificate", "Caste Validity", "Non-Creamy Layer", "EWS Certificate", "Domicile Certificate", "Leaving Certificate", "Minority Affidavit", "Passport Size Photo", "Other"].map(v => (
                                                <option key={v} value={v}>{v}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={15} />
                                    </div>
                                    {docType === "Other" && (
                                        <input
                                            type="text"
                                            placeholder="Enter document name"
                                            value={formData.other_doc_name}
                                            onChange={e => update("other_doc_name", e.target.value)}
                                            className="w-full h-11 rounded-xl border-2 border-blue-100 bg-white px-3 text-sm font-light text-[#1A3A6B] focus:border-[#2E75C7] outline-none"
                                        />
                                    )}
                                    {!isLocked && (
                                        <label className={`flex items-center justify-center gap-2 h-11 rounded-xl text-[11px] font-medium uppercase tracking-wide cursor-pointer transition-all ${docType ? 'bg-[#1A3A6B] text-white hover:bg-[#2E75C7] shadow-md' : 'bg-gray-100 text-gray-300 cursor-not-allowed pointer-events-none'}`}>
                                            {isUploadingDoc ? <RefreshCw className="animate-spin" size={15} /> : <Upload size={15} />}
                                            <span>{isUploadingDoc ? "Uploading..." : "Upload File"}</span>
                                            <input type="file" className="hidden" accept=".pdf,image/*" onChange={uploadDoc} disabled={!docType} />
                                        </label>
                                    )}
                                </div>
                                <p className="text-[10px] text-gray-400 mt-3 font-light">PDF, JPG, PNG · Max 5MB per file</p>
                            </div>

                            <div className="space-y-2">
                                {formData.documents.map((doc: any, i: number) => {
                                    const isObj = typeof doc === 'object' && doc !== null
                                    const label = isObj ? doc.type : doc
                                    const path = isObj ? doc.path : null

                                    return (
                                        <div key={i} className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-xl shadow-sm group/doc">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                                                    <FileText size={14} className="text-[#2E75C7]" />
                                                </div>
                                                <span className="text-xs font-light text-gray-700 truncate">{label}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {path && (
                                                    <button onClick={() => previewDoc(path)} className="p-1.5 hover:bg-[#EEF2F7] rounded-lg transition text-gray-400 hover:text-[#2E75C7]">
                                                        <Eye size={14} />
                                                    </button>
                                                )}
                                                {!isLocked && (
                                                    <button onClick={() => removeDoc(path || doc)} className="p-1.5 hover:bg-red-50 rounded-lg transition ml-1 flex-shrink-0">
                                                        <Trash2 size={14} className="text-gray-300 hover:text-red-400" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                                {formData.documents.length === 0 && (
                                    <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-2xl">
                                        <Folder size={36} className="text-gray-200 mb-3" />
                                        <p className="text-xs font-light text-gray-300">No documents uploaded yet</p>
                                    </div>
                                )}
                            </div>
                        </Section>

                        <div className="flex gap-3 p-4 bg-orange-50/70 rounded-xl border border-orange-100 mb-4">
                            <AlertCircle size={16} className="text-orange-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs font-light text-orange-800 leading-relaxed">I certify that all information submitted is accurate. AIKTC reserves the right to cancel admission for false declarations.</p>
                        </div>

                        <div className="p-4 bg-blue-50/30 rounded-2xl border border-dashed border-blue-200 mt-6">
                            <h4 className="text-[#1A3A6B] font-black text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Info size={14} className="text-[#2E75C7]" />
                                Data Discrepancy?
                            </h4>
                            <p className="text-gray-500 text-[11px] leading-relaxed mb-4">
                                If you find any pre-filled information is incorrect and you cannot edit it, please click below. We will inform the admin that your details are wrong, and they will update them for you.
                            </p>
                            <button 
                                type="button"
                                onClick={() => alert("Admin has been notified about the incorrect details. They will contact you shortly.")}
                                className="text-[#2E75C7] font-black text-[10px] uppercase tracking-widest hover:underline"
                            >
                                Inform Admin regarding wrong details →
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Bottom Navigation ─────────────────────────────── */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-100 px-3 py-3 shadow-lg z-40">
                <div className="max-w-3xl mx-auto flex gap-2.5">
                    {currentStep > 0 && (
                        <button onClick={prev} className="px-4 h-12 rounded-xl bg-white border-2 border-gray-100 text-[#1A3A6B] flex items-center gap-2 font-medium text-sm hover:bg-gray-50 transition-all active:scale-95">
                            <ArrowLeft size={16} />
                        </button>
                    )}
                    <button
                        onClick={currentStep === 4 ? submit : next}
                        disabled={isSaving || (currentStep === 4 && isLocked)}
                        className="flex-1 h-12 rounded-xl bg-gradient-to-r from-[#1A3A6B] to-[#2E75C7] text-white flex items-center justify-center gap-2.5 font-medium text-sm shadow-lg shadow-[#2E75C7]/20 hover:shadow-[#2E75C7]/40 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <><RefreshCw className="animate-spin" size={16} /><span>Saving...</span></>
                        ) : (
                            <><span>{currentStep === 4 ? "Submit Application" : "Continue"}</span>
                            {currentStep === 4 ? <CheckCircle size={16} /> : <ArrowRight size={16} />}</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}