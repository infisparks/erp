"use client"

import React, { useState, useEffect, useMemo, Suspense } from "react" // ⬅️ ADDED Suspense
import { useRouter, useSearchParams } from 'next/navigation' 
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"
import { SupabaseClient } from "@supabase/supabase-js"
import { format, parseISO } from "date-fns"
import jsPDF from "jspdf" // 🚀 For PDF Download

// --- ShadCN UI Components ---
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils" 

// --- Icons ---
import {
    Plus,
    Eye,
    Edit,
    AlertTriangle,
    UserRound,
    Loader2,
    Save,
    X,
    File,
    Trash2,
    Download, // 🚀 For PDF Button
    Upload,
    ChevronsUpDown,
    Check,
    CalendarIcon,
    ChevronLeft,
    Lock,
    Unlock,
    ShieldCheck,
    ShieldAlert,
    CheckSquare,
    ExternalLink,
    ChevronRight,
} from "lucide-react"

// --- Type Definitions ---

type Mode = 'view' | 'edit'

interface StudentDocument {
    name: string;
    path: string;
    fileName: string;
    fileType: string;
}

interface StudentDetail {
    // From students
    id: number // This is students.id (bigint)
    user_id: string
    created_at: string 
    firstname: string
    lastname: string
    email: string
    phone: string
    dateofbirth: string
    address: string
    city: string
    state: string
    zipcode: string
    documents: StudentDocument[] | null
    custom_data: Record<string, string> | null
    secondary_phone: string | null
    family_phone: string | null
    middlename: string | null
    fullname: string | null
    admission_year: string | null
    admission_type: string | null
    father_name: string | null
    mother_name: string | null
    father_occupation: string | null
    mother_occupation: string | null
    father_annual_income: string | null
    mother_annual_income: string | null
    gender: string | null
    nationality: string | null
    place_of_birth: string | null
    domicile_of_maharashtra: string | null
    phd_handicap: string | null
    religion: string | null
    caste: string | null
    blood_group: string | null
    category_type: string | null
    aadhar_card_number: string | null
    pan_no: string | null
    student_mobile_no: string | null
    father_mobile_no: string | null
    mother_mobile_no: string | null
    photo_path: string | null
    how_did_you_know: string | null
    form_no: string | null
    registration_no: string | null
    merit_no: string | null
    abc_id: string | null
    apaar_id: string | null
    roll_number: string;
    is_locked: boolean;
    is_verifiedby_admin: boolean;
    is_verifiedby_examcell: boolean;
    scholarship_categories: { name: string } | null;
    courses: { name: string } | null;
    year_category: { name: string } | null;
    semesters: { name: string } | null;

    // From student_semesters
    enrollment_id: number // student_semesters.id (bigint)
    "rollNumber": string // This maps to students.roll_number
    status: string // from student_semesters (e.g., 'active')
    promotion_status: string
    semester_id: string | null 
    student_academic_year_id: string | null // This will be the UUID from 'academic_years'

    // From student_academic_years (nested for editing)
    academic_year_data: {
        id: string; // This is the 'student_academic_years.id' (bigint)
        name: string; // academic_year_name (e.g., 'First Year')
        course_id: string;
        session: string; // academic_year_session (e.g., '2024-2025')
        year_category_id: string | null;
        scholarship_category_id: string | null;
        scholarship_amount_id: string | null;
        total_fee: number | null;
        net_payable_fee: number | null;
    } | null;

    academic_records: {
        ssc_year: string; ssc_seat: string; ssc_inst: string; ssc_inst_addr: string; ssc_board: string; ssc_obt: string; ssc_out: string; ssc_pct: string;
        hsc_year: string; hsc_seat: string; hsc_inst: string; hsc_inst_addr: string; hsc_board: string; hsc_phy: string; hsc_math: string; hsc_chem: string; hsc_obt: string; hsc_out: string; hsc_pct: string;
        dip_year: string; dip_seat: string; dip_inst: string; dip_inst_addr: string; dip_board: string; dip_pct: string;
        dsy_inst: string; dsy_inst_addr: string; dsy_code: string; dsy_branch: string; dsy_obt: string; dsy_out: string;
        cet_seat: string; cet_pct: string; jee_seat: string; jee_total: string; nata_seat: string; nata_obt: string; nata_out: string;
    } | null;
    correspondence_details: { taluka: string; district: string; } | null;
    permanent_details: {
        address: string; city: string; state: string; zipcode: string; taluka: string; district: string;
    } | null;
    native_place: string | null;
    mother_email: string | null;
    father_email: string | null;
    admission_category: string | null;
    [key: string]: any 
}

interface FileToAdd {
    id: string;
    name: string;
    file: File;
}

// 🚀 Updated types to match your DB
interface FieldOption { label: string; type: string; }
interface DocOption { name: string; description: string; }

// Interface for fetching and mapping names in the detail view
interface Course { id: string; name: string; stream_id: string; }
interface AcademicYear { id: string; name: string; course_id: string; } // 'name' is academic_year_name
interface Semester { id: string; name: string; academic_year_id: string; }

interface SearchableSelectProps {
    options: { label: string; value: string; }[];
    value: string | null;
    onChange: (value: string | null) => void;
    placeholder: string;
    disabled?: boolean;
}


// --- Constants ---
const statusOptions = [
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Graduated', value: 'graduated' },
];

const promotionStatusOptions = [
    { label: 'Eligible', value: 'Eligible' },
    { label: 'Not Eligible', value: 'Not Eligible' },
    { label: 'Year Drop', value: 'Year Drop' },
];

const genderOptions = [
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Other', value: 'Other' },
];

const yesNoOptions = [
    { label: 'Yes', value: 'Y' },
    { label: 'No', value: 'N' },
];

// -------------------------------------------------------------------
// 🚀 Reusable Helper Components 🚀
// -------------------------------------------------------------------

const SearchableSelect: React.FC<SearchableSelectProps> = ({ options, value, onChange, placeholder, disabled = false, }) => {
    const [open, setOpen] = useState(false)
    const selectedLabel = options.find((option) => option.value === value)?.label

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal"
                    disabled={disabled}
                >
                    {value ? (
                        <span className="truncate">{selectedLabel}</span>
                    ) : (
                        <span className="text-muted-foreground">{placeholder}</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                <Command>
                    <CommandInput placeholder="Search..." />
                    <CommandEmpty>No results found.</CommandEmpty>
                    <CommandList>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.label}
                                    onSelect={() => {
                                        onChange(option.value)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={`mr-2 h-4 w-4 ${value === option.value ? "opacity-100" : "opacity-0"}`}
                                    />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="grid grid-cols-2 gap-4">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-sm break-words">{value || <span className="text-muted-foreground">N/A</span>}</p>
    </div>
)

const FormInputGroup: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, name, ...props }) => (
    <div className="space-y-2">
        <Label htmlFor={name} className="font-medium">{label}{props.required && '*'}</Label>
        <Input id={name} name={name} {...props} />
    </div>
)

const FormSelectGroup: React.FC<{
    label: string;
    name: string;
    value: string | null | undefined;
    onValueChange: (value: string) => void;
    options: { label: string; value: string; }[];
    placeholder: string;
    required?: boolean;
    disabled?: boolean;
}> = ({ label, name, value, onValueChange, options, placeholder, required = false, disabled = false }) => (
    <div className="space-y-2">
        <Label htmlFor={name} className="font-medium">{label}{required && '*'}</Label>
        <Select value={value || ""} onValueChange={onValueChange} disabled={disabled}>
            <SelectTrigger id={name}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {options.map(option => (
                    <SelectItem key={option.value} value={option.value} className="capitalize">
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    </div>
)

const FormSearchableSelectGroup: React.FC<{
    label: string;
    value: string | null;
    onChange: (value: string | null) => void;
    options: { label: string; value: string; }[];
    placeholder: string;
    disabled?: boolean;
    required?: boolean;
}> = ({ label, value, onChange, options, placeholder, disabled = false, required = false }) => (
    <div className="space-y-2">
        <Label className="font-medium">{label}{required && '*'}</Label>
        <SearchableSelect
            options={options}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
        />
    </div>
)

const FormDatePickerGroup: React.FC<{
    label: string;
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
    required?: boolean;
}> = ({ label, date, setDate, required = false }) => (
    <div className="space-y-2">
        <Label className="font-medium">{label}{required && '*'}</Label>
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    </div>
)

const StudentAvatar: React.FC<{ src: string | null, alt: string | null }> = ({ src, alt }) => {
    const supabase = getSupabaseClient()
    const publicUrl = useMemo(() => {
        if (!src) return null;
        const cleanSrc = src.includes('%') ? decodeURIComponent(src) : src;
        return supabase.storage.from('student_documents').getPublicUrl(cleanSrc).data.publicUrl;
    }, [src, supabase]);

    return (
        <Avatar className="h-24 w-24 rounded-lg">
            <AvatarImage
                src={publicUrl || undefined}
                alt={alt || "Student Photo"}
                className="rounded-lg object-cover"
            />
            <AvatarFallback className="rounded-lg bg-muted">
                <UserRound className="h-10 w-10 text-muted-foreground" />
            </AvatarFallback>
        </Avatar>
    )
}

// -------------------------------------------------------------------
// 🎯 Student Detail Page Component 🎯
// -------------------------------------------------------------------
// Renamed the main component to StudentDetailContent
function StudentDetailContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = getSupabaseClient()

    // 🚀 Get Student ID from URL
    const studentId = searchParams.get('student_id')
    const initialMode = searchParams.get('mode') as Mode || 'view'

    // --- Page State ---
    const [mode, setMode] = useState<Mode>(initialMode)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false) // 🚀 PDF Loading
    const [activeEditTab, setActiveEditTab] = useState("personal") // 🚀 Control current tab

    // --- Data State ---
    const [studentData, setStudentData] = useState<StudentDetail | null>(null)
    const [editFormData, setEditFormData] = useState<Partial<StudentDetail>>({})
    const [editFormDateOfBirth, setEditFormDateOfBirth] = useState<Date | undefined>()

    // --- Document Management State ---
    const [filesToAdd, setFilesToAdd] = useState<FileToAdd[]>([]);
    const [filesToRemove, setFilesToRemove] = useState<StudentDocument[]>([]);
    const [newDocFile, setNewDocFile] = useState<File | null>(null);
    
    // --- Document Viewer State ---
    const [viewingDoc, setViewingDoc] = useState<{ doc: StudentDocument, publicUrl: string } | null>(null);
    const [isViewerOpen, setIsViewerOpen] = useState(false);

    // --- Form Config State ---
    const [availableCustomFields, setAvailableCustomFields] = useState<FieldOption[]>([])
    const [availableDocuments, setAvailableDocuments] = useState<DocOption[]>([])
    const [selectedCustomField, setSelectedCustomField] = useState<FieldOption | null>(null)
    const [selectedDocument, setSelectedDocument] = useState<DocOption | null>(null)

    // --- Filter/Edit Options State ---
    const [allCourses, setAllCourses] = useState<Course[]>([])
    const [allAcademicYears, setAllAcademicYears] = useState<AcademicYear[]>([])
    const [allSemesters, setAllSemesters] = useState<Semester[]>([])
    const [allCategories, setAllCategories] = useState<{ id: string, name: string }[]>([])
    const [docRules, setDocRules] = useState<any[]>([])

    // --- New State for Profile Extensions ---
    const [allScholarships, setAllScholarships] = useState<any[]>([])
    const [cancellationRequests, setCancellationRequests] = useState<any[]>([])
    const [enrollmentHistory, setEnrollmentHistory] = useState<any[]>([])


    // --- Memoized Options for Edit Form Cascade ---
    const allCourseOptions = useMemo(() => {
        return allCourses.map(c => ({ label: c.name, value: c.id }))
    }, [allCourses])

    const editModalAcademicYearOptions = useMemo(() => {
        const courseId = editFormData.academic_year_data?.course_id;
        if (!courseId) return [];
        return allAcademicYears
            .filter(ay => ay.course_id === courseId)
            .map(ay => ({ label: ay.name, value: ay.id }));
    }, [allAcademicYears, editFormData.academic_year_data?.course_id]);

    const editModalSemesterOptions = useMemo(() => {
        const ayId = editFormData.student_academic_year_id; // This is now the UUID
        if (!ayId) return [];
        return allSemesters
            .filter(s => s.academic_year_id === ayId)
            .map(s => ({ label: s.name, value: s.id }));
    }, [allSemesters, editFormData.student_academic_year_id]);


    // --- 🚀 Data Fetching (Config & Detail) - Updated Logic 🚀 ---
    useEffect(() => {
        const fetchAllData = async () => {
            if (!studentId) {
                setError("No student_id provided in the URL.")
                setLoading(false)
                return;
            }

            setLoading(true)
            setError(null)

            try {
                // 1. Fetch Config Data
                const [
                    customData,
                    docData,
                    courseData,
                    academicYearData, 
                    semesterData,
                    scholarshipCategories,
                    docRulesData
                ] = await Promise.all([
                   supabase.from("form_config").select("data_jsonb").eq("data_name", "custom_field_options").single(),
                    supabase.from("form_config").select("data_jsonb").eq("data_name", "document_options").single(),
                    supabase.from("courses").select("id, name"), 
                    supabase.from("academic_years").select("id, name, course_id"), 
                    supabase.from("semesters").select("id, name, academic_year_id"),
                    supabase.from("scholarship_categories").select("id, name"),
                    supabase.from("master_data").select("*").eq("type", "required_docs")
                ])

                // 🚀 FIX: Set state for form_config data
                if (customData.data) setAvailableCustomFields(customData.data.data_jsonb as FieldOption[])
                if (docData.data) setAvailableDocuments(docData.data.data_jsonb as DocOption[])
                
                const fetchedCourses = courseData.data as Course[] || [];
                const fetchedAcademicYears = academicYearData.data as AcademicYear[] || [];
                const fetchedSemesters = semesterData.data as Semester[] || [];

                setAllCourses(fetchedCourses);
                setAllAcademicYears(fetchedAcademicYears);
                setAllSemesters(fetchedSemesters);
                setAllCategories(scholarshipCategories.data || []);
                setDocRules(docRulesData.data || []);

                // 2. Fetch Student Data (with JOINs for descriptive names)
                const { data: studentD, error: studentError } = await supabase
                    .from("students")
                    .select("*, scholarship_categories(name), courses(name), year_category(name), semesters(name)")
                    .eq("id", studentId)
                    .single()
                if (studentError) throw new Error(`Failed to fetch student: ${studentError.message}`);

                // 3. Fetch Profile Extensions (Scholarships, Cancellations, History)
                const [
                    scholarshipData,
                    cancellationData,
                    historyData,
                    semHistoryData
                ] = await Promise.all([
                    supabase.from('student_academic_years').select('*').eq('student_id', studentId).not('scholarship_application_id', 'is', null).order('created_at', { ascending: false }),
                    supabase.from('cancellation_requests').select('*').eq('student_id', studentId).order('created_at', { ascending: false }),
                    supabase.from('student_academic_years').select('*, courses(name)').eq('student_id', studentId).order('created_at', { ascending: false }),
                    supabase.from('student_semesters').select('*, semesters(name)').eq('student_id', studentId).order('created_at', { ascending: false })
                ])

                setAllScholarships(scholarshipData.data || [])
                setCancellationRequests(cancellationData.data || [])

                // Merge history
                const combinedHistory = (historyData.data || []).map((ay: any) => ({
                    ...ay,
                    semesters: (semHistoryData.data || []).filter((s: any) => s.student_academic_year_id === ay.id)
                }))
                setEnrollmentHistory(combinedHistory)

                // 4. Fetch Latest Academic Year
                const { data: latestAY, error: ayError } = await supabase
                    .from("student_academic_years")
                    .select("*")
                    .eq("student_id", studentId)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();
                
                // 4. Fetch Latest Semester
                let latestSem = null;
                if (latestAY) {
                    const { data: semData } = await supabase
                        .from("student_semesters")
                        .select("*")
                        .eq("student_id", studentId)
                        .eq("student_academic_year_id", latestAY.id)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();
                    latestSem = semData;
                }

                // --- Find matching Academic Year UUID ---
                const matchingAcademicYear = fetchedAcademicYears.find(
                    ay => ay.course_id === latestAY?.course_id &&
                          ay.name === latestAY?.academic_year_name
                );
                
                const academicYearUUID = matchingAcademicYear?.id || null;

                // 5. Merge and Set State
                const mergedData = {
                    ...studentD,
                    ...(latestSem || {}), 
                    id: studentD.id,
                    enrollment_id: latestSem?.id || null, 
                    semester_id: latestSem?.semester_id || studentD.current_sem_id || null,
                    "rollNumber": studentD.roll_number,
                    
                    student_academic_year_id: academicYearUUID || studentD.admission_year_id || null, 
                    
                    academic_year_data: latestAY ? {
                        id: latestAY.id.toString(),
                        name: latestAY.academic_year_name,
                        course_id: latestAY.course_id,
                        session: latestAY.academic_year_session,
                        year_category_id: latestAY.year_category_id,
                        scholarship_category_id: latestAY.scholarship_category_id,
                        scholarship_amount_id: latestAY.scholarship_amount_id,
                        total_fee: latestAY.total_fee,
                        net_payable_fee: latestAY.net_payable_fee,
                    } : (studentD.course_id ? {
                        id: "",
                        name: studentD.year_category?.name || "",
                        course_id: studentD.course_id,
                        session: studentD.admission_year || "",
                        scholarship_category_id: studentD.scholarship_category_id || "",
                        scholarship_amount_id: null, // Would need fee calc lookup
                        total_fee: 0,
                        net_payable_fee: 0,
                    } : null),
                } as StudentDetail;

                setStudentData(mergedData)
                setEditFormData(mergedData) // This now has the correct UUIDs
                
                if (mergedData.dateofbirth) {
                    setEditFormDateOfBirth(parseISO(mergedData.dateofbirth))
                }

            } catch (err: any) {
                console.error("Error fetching student details:", err)
                setError(err.message || "Failed to load student details for editing.")
            } finally {
                setLoading(false)
            }
        }

        fetchAllData()
    }, [studentId, supabase]) 

    // --- 🚀 Mandatory Doc Calculation 🚀 ---
    const mandatoryDocs = useMemo(() => {
        if (!studentData || docRules.length === 0) return [];
        
        let docs = new Set<string>();
        
        // Universal docs
        const universal = docRules.find(r => r.value === 'Universal');
        if (universal?.metadata?.docs) universal.metadata.docs.forEach((d: string) => docs.add(d));

        // Admission Type docs
        if (studentData.admission_type) {
            const typeRule = docRules.find(r => r.value === studentData.admission_type);
            if (typeRule?.metadata?.docs) typeRule.metadata.docs.forEach((d: string) => docs.add(d));
        }

        // Admission Category docs
        if (studentData.admission_category) {
            const catRule = docRules.find(r => r.value === studentData.admission_category);
            if (catRule?.metadata?.docs) catRule.metadata.docs.forEach((d: string) => docs.add(d));
        }

        // Scholarship docs
        const scholarshipName = studentData.scholarship_categories?.name;
        if (scholarshipName) {
            const scholRule = docRules.find(r => r.value === scholarshipName);
            if (scholRule?.metadata?.docs) scholRule.metadata.docs.forEach((d: string) => docs.add(d));
        }

        return Array.from(docs);
    }, [studentData, docRules]);

    const missingDocs = useMemo(() => {
        if (!studentData) return [];
        const uploaded = (studentData.documents || []).map((d: any) => 
            (typeof d === 'string' ? d : (d.type || d.name || "")).toLowerCase()
        );
        return mandatoryDocs.filter(doc => !uploaded.includes(doc.toLowerCase()));
    }, [studentData, mandatoryDocs]);


    // --- 🚀 Nested Field Handlers 🚀 ---
    const handleAcademicChange = (name: string, value: string) => {
        setEditFormData(prev => ({
            ...prev,
            academic_records: {
                ...(prev.academic_records as any || {}),
                [name]: value,
            }
        }))
    }

    const handleCorrespondenceChange = (name: string, value: string) => {
        setEditFormData(prev => ({
            ...prev,
            correspondence_details: {
                ...(prev.correspondence_details as any || {}),
                [name]: value,
            }
        }))
    }

    const handlePermanentChange = (name: string, value: string) => {
        setEditFormData(prev => ({
            ...prev,
            permanent_details: {
                ...(prev.permanent_details as any || {}),
                [name]: value,
            }
        }))
    }

    // --- Document Viewer Handler ---
    const handleViewDocument = (doc: StudentDocument) => {
        // Decode path in case it was stored URL-encoded
        const cleanPath = doc.path.includes('%') ? decodeURIComponent(doc.path) : doc.path;
        
        const { data: { publicUrl } } = supabase
            .storage
            .from('student_documents')
            .getPublicUrl(cleanPath);
        
        setViewingDoc({ doc, publicUrl });
        setIsViewerOpen(true);
    }

    // --- Edit Form Handlers ---
    const handleEditChange = (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const { name, value } = e.target
        setEditFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleEditSelectChange = (name: string, value: string) => {
        setEditFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleEditSearchableSelectChange = (name: string, value: string | null) => {
        // All these are disabled, so this is just for safety
        setEditFormData(prev => ({ ...prev, [name]: value }));
    }

    const handleCustomFieldChange = (key: string, value: string) => {
        setEditFormData(prev => ({
            ...prev,
            custom_data: {
                ...(prev.custom_data || {}),
                [key]: value,
            }
        }))
    }

    const handleAddCustomFieldToEdit = () => {
        if (selectedCustomField) {
            const newLabel = selectedCustomField.label;
            if (editFormData.custom_data && newLabel in editFormData.custom_data) {
                setError(`Field "${newLabel}" already exists.`);
                return;
            }

            handleCustomFieldChange(newLabel, "");
            setSelectedCustomField(null)
            setError(null)
        }
    }

    const handleRemoveCustomField = (key: string) => {
        setEditFormData(prev => {
            const newData = { ...(prev.custom_data || {}) };
            delete newData[key];
            return { ...prev, custom_data: newData };
        });
    }

    const stageFileForUpload = () => {
        if (selectedDocument && newDocFile) {
            const docName = selectedDocument.name;

            const newFileToAdd: FileToAdd = {
                id: Date.now().toString(),
                name: docName,
                file: newDocFile,
            }
            setFilesToAdd(prev => [...prev, newFileToAdd]);

            setSelectedDocument(null)
            setNewDocFile(null)
            const fileInput = document.getElementById('newDocFileInput') as HTMLInputElement;
            if (fileInput) fileInput.value = "";
            setError(null)
        } else {
            setError("Please select a document type and provide a file.")
        }
    }

    const cancelStagedFile = (tempId: string) => {
        setFilesToAdd(prev => prev.filter(f => f.id !== tempId));
    }

    const stageFileForRemoval = (docToMove: StudentDocument) => {
        if (!docToMove || !docToMove.path) return;
        setFilesToRemove(prev => [...prev, docToMove]);
        setEditFormData(prev => ({
            ...prev,
            documents: (prev.documents || []).filter(doc => doc.path !== docToMove.path),
        }));
    }

    // --- Form Submission ---
    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const currentStudentId = editFormData.id;
        const currentEnrollmentId = (editFormData as any).enrollment_id;
        const currentStudentAcademicYearId = editFormData.academic_year_data?.id; 

        if (!currentStudentId || !currentEnrollmentId || !currentStudentAcademicYearId) {
            setError("Error: Student, Enrollment, or Academic Year ID is missing. Cannot save.");
            return;
        }

        setIsSubmitting(true)
        setError(null)

        const { user_id } = editFormData
        const bucketName = 'student_documents'

        try {
            // 1. Document Management
            if (filesToRemove.length > 0) {
                const pathsToRemove = filesToRemove.map(f => f.path)
                const { error: deleteError } = await supabase.storage
                    .from(bucketName)
                    .remove(pathsToRemove)

                if (deleteError) {
                    throw new Error(`Failed to delete documents: ${deleteError.message}`)
                }
            }

            let finalDocumentsArray = [...(editFormData.documents || [])]

            if (filesToAdd.length > 0) {
                for (const newDoc of filesToAdd) {
                    const fileExt = newDoc.file.name.split('.').pop();
                    const cleanDocName = newDoc.name.replace(/[^a-zA-Z0-9]/g, '_');
                    const uniqueFileName = `${cleanDocName}-${Date.now()}.${fileExt}`;
                    const studentRollNumber = editFormData['rollNumber'] || 'UNKNOWN_ROLL';
                    const filePath = `${user_id}/${studentRollNumber}/${uniqueFileName}`;

                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from(bucketName)
                        .upload(filePath, newDoc.file);

                    if (uploadError) {
                        throw new Error(`Failed to upload ${newDoc.name}: ${uploadError.message}`)
                    }

                    finalDocumentsArray.push({
                        name: newDoc.name,
                        path: uploadData.path,
                        fileName: newDoc.file.name,
                        fileType: newDoc.file.type,
                    });
                }
            }

            // 2. Data Splitting
            const studentUpdateData = {
                firstname: editFormData.firstname,
                lastname: editFormData.lastname,
                email: editFormData.email,
                phone: editFormData.phone,
                dateofbirth: editFormDateOfBirth ? format(editFormDateOfBirth, "yyyy-MM-dd") : null,
                address: editFormData.address,
                city: editFormData.city,
                state: editFormData.state,
                zipcode: editFormData.zipcode,
                documents: finalDocumentsArray,
                custom_data: editFormData.custom_data,
                secondary_phone: editFormData.secondary_phone,
                family_phone: editFormData.family_phone,
                middlename: editFormData.middlename,
                father_name: editFormData.father_name,
                mother_name: editFormData.mother_name,
                father_occupation: editFormData.father_occupation,
                mother_occupation: editFormData.mother_occupation,
                father_annual_income: editFormData.father_annual_income,
                mother_annual_income: editFormData.mother_annual_income,
                gender: editFormData.gender,
                nationality: editFormData.nationality,
                place_of_birth: editFormData.place_of_birth,
                domicile_of_maharashtra: editFormData.domicile_of_maharashtra,
                phd_handicap: editFormData.phd_handicap,
                religion: editFormData.religion,
                caste: editFormData.caste,
                blood_group: editFormData.blood_group,
                aadhar_card_number: editFormData.aadhar_card_number,
                pan_no: editFormData.pan_no,
                student_mobile_no: editFormData.student_mobile_no,
                father_mobile_no: editFormData.father_mobile_no,
                mother_mobile_no: editFormData.mother_mobile_no,
                form_no: editFormData.form_no,
                registration_no: editFormData.registration_no,
                merit_no: editFormData.merit_no,
                admission_year: editFormData.admission_year,
                admission_type: editFormData.admission_type,
                category_type: editFormData.category_type,
                how_did_you_know: editFormData.how_did_you_know,
                roll_number: editFormData["rollNumber"],
                
                // New Fields from Admission Form
                academic_records: editFormData.academic_records,
                correspondence_details: editFormData.correspondence_details,
                permanent_details: editFormData.permanent_details,
                native_place: editFormData.native_place,
                mother_email: editFormData.mother_email,
                father_email: editFormData.father_email,
                admission_category: editFormData.admission_category,
                
                // Enrollment Sync
                course_id: editFormData.academic_year_data?.course_id,
                admission_year_id: editFormData.student_academic_year_id,
                current_sem_id: editFormData.semester_id,
            };
            
            // Only 'status' is editable for the semester
            const semesterUpdateData = {
                status: editFormData.status,
                promotion_status: editFormData.promotion_status, 
                semester_id: editFormData.semester_id,
                student_academic_year_id: editFormData.student_academic_year_id, 
            };

            // 2.5 Update Academic Year Details if they changed
            if (currentStudentAcademicYearId) {
                const ayUpdateData = {
                    academic_year_session: editFormData.session,
                    academic_year_name: allAcademicYears.find(ay => ay.id === editFormData.student_academic_year_id)?.name,
                    year_category_id: editFormData.academic_year_data?.year_category_id, // Preserve or update session ID
                    scholarship_category_id: editFormData.academic_year_data?.scholarship_category_id,
                    scholarship_amount_id: editFormData.academic_year_data?.scholarship_amount_id,
                    course_id: editFormData.academic_year_data?.course_id
                };

                const { error: ayError } = await supabase
                    .from("student_academic_years")
                    .update(ayUpdateData)
                    .eq("id", currentStudentAcademicYearId);

                if (ayError) throw new Error(`Academic year update failed: ${ayError.message}`);
            }

            // 3. Database Transactions
            const { error: studentUpdateError } = await supabase
                .from("students")
                .update(studentUpdateData)
                .eq("id", currentStudentId);

            if (studentUpdateError) throw new Error(`Student update failed: ${studentUpdateError.message}`);

            if (currentEnrollmentId) {
                const { error: semesterUpdateError } = await supabase
                    .from("student_semesters")
                    .update(semesterUpdateData)
                    .eq("id", currentEnrollmentId);

                if (semesterUpdateError) throw new Error(`Enrollment update failed: ${semesterUpdateError.message}`);
            }

            // 4. Update UI
            const updatedStudentData = {
                ...studentData, 
                ...studentUpdateData, 
                ...semesterUpdateData, 
            } as StudentDetail;


            setFilesToAdd([])
            setFilesToRemove([])
            setNewDocFile(null)
            setStudentData(updatedStudentData) 
            setMode('view') 

        } catch (err: any) {
            console.error("Error updating student:", err)
            setError(err.message || "Failed to save changes.")
        } finally {
            setIsSubmitting(false)
        }
    }

    // --- 🚀 PDF Download Handlers 🚀 ---

    // 1. Fetches image and triggers PDF generation
    const prepareAndDownloadPDF = async () => {
        if (!studentData) return;
        
        setIsGeneratingPDF(true);
        let imageBase64 = null;

        if (studentData.photo_path) {
            try {
                // Decode path in case it was stored URL-encoded
                const cleanPhotoPath = studentData.photo_path.includes('%') 
                    ? decodeURIComponent(studentData.photo_path) 
                    : studentData.photo_path;

                const { data: blob, error } = await supabase.storage
                    .from('student_documents')
                    .download(cleanPhotoPath);
                
                if (error) throw error;

                // Convert blob to Base64
                imageBase64 = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onerror = reject;
                    reader.onloadend = () => {
                        resolve(reader.result as string);
                    };
                    reader.readAsDataURL(blob);
                });
            } catch (error) {
                console.error("Error fetching student photo for PDF:", error);
            }
        }
        
        // Call the generator function
        generatePDF(studentData, typeof imageBase64 === "string" ? imageBase64 : null);
        setIsGeneratingPDF(false);
    };

    // 2. The main PDF generation logic
    const generatePDF = (student: StudentDetail, imageBase64: string | null) => {
        const doc = new jsPDF();
        const pageMargin = 15;
        const pageHeight = doc.internal.pageSize.height;
        let yPos = 20; // Initial Y position

        // --- Helper: Add Section with 2-Column Layout ---
        const addSection = (title: string, fields: (string | null)[][]) => {
            if (yPos > pageHeight - 30) { // Check for space
                doc.addPage();
                yPos = 20;
            }
            doc.setFont('helvetica', 'bold').setFontSize(14);
            doc.text(title, pageMargin, yPos);
            yPos += 5;
            // 🚀 FIX: Corrected line drawing with all 4 arguments (x1, y1, x2, y2)
            doc.setDrawColor(200).line(pageMargin, yPos, 195, yPos);
            yPos += 8;

            doc.setFont('helvetica', 'normal').setFontSize(10);
            
            for (let i = 0; i < fields.length; i += 2) {
                if (yPos > pageHeight - 20) {
                    doc.addPage();
                    yPos = 20;
                }
                const field1 = fields[i];
                const field2 = (i + 1 < fields.length) ? fields[i+1] : null;

                // Column 1
                doc.setFont('helvetica', 'bold');
                doc.text(field1[0] + ":", pageMargin, yPos);
                doc.setFont('helvetica', 'normal');
                doc.text(field1[1] || 'N/A', pageMargin + 45, yPos, { maxWidth: 60 });

                // Column 2
                if (field2) {
                    doc.setFont('helvetica', 'bold');
                    doc.text(field2[0] + ":", 110, yPos);
                    doc.setFont('helvetica', 'normal');
                    doc.text(field2[1] || 'N/A', 110 + 45, yPos, { maxWidth: 60 });
                }
                yPos += 7;
            }
            yPos += 5; // Space after section
        };

        // --- 1. PDF Header ---
        doc.setFillColor(240, 240, 240);
        doc.rect(0, 0, 210, 35, 'F');
        doc.setFont('helvetica', 'bold').setFontSize(18);
        doc.text("Student Profile Report", 105, 15, { align: 'center' });
        doc.setFontSize(12);
        doc.text("InfiEdu College Management", 105, 25, { align: 'center' });
        yPos = 45; // Start content below header

        // --- 2. Student Photo ---
        if (imageBase64) {
            try {
                // Determine format
                const format = imageBase64.substring(imageBase64.indexOf('/') + 1, imageBase64.indexOf(';')).toUpperCase();
                if (format === 'JPEG' || format === 'PNG' || format === 'JPG') {
                    doc.addImage(imageBase64, format, 150, 40, 45, 45);
                }
            } catch (e) {
                console.error("jsPDF addImage Error:", e);
            }
        }

        // --- 3. Student Name & Roll ---
        doc.setFont('helvetica', 'bold').setFontSize(22);
        doc.text(student.fullname || 'Student Name', pageMargin, yPos);
        yPos += 8;
        doc.setFont('helvetica', 'normal').setFontSize(14);
        doc.text(`Roll No: ${student.rollNumber}`, pageMargin, yPos);
        yPos += 15;
        doc.setDrawColor(200).line(pageMargin, yPos, 195, yPos);
        yPos += 10;
        
        // --- 4. Get Mapped Names ---
        const courseName = allCourses.find(c => c.id === student.academic_year_data?.course_id)?.name || "N/A";
        const academicYearName = allAcademicYears.find(ay => ay.id === student.student_academic_year_id)?.name || "N/A";
        const semesterName = allSemesters.find(s => s.id === student.semester_id)?.name || "N/A";
        const dob = student.dateofbirth ? format(parseISO(student.dateofbirth), "PPP") : "N/A";

        // --- 5. Enrollment Details ---
        addSection("Enrollment Details", [
            ["Course", courseName],
            ["Academic Year", academicYearName],
            ["Semester", semesterName],
            ["Session", student.academic_year_data?.session || "N/A"],
            ["Enrollment Status", student.status],
            ["Promotion Status", student.promotion_status],
        ]);

        // --- 6. Personal & Contact Details ---
        addSection("Personal & Contact Details", [
            ["First Name", student.firstname],
            ["Middle Name", student.middlename],
            ["Last Name", student.lastname],
            ["Date of Birth", dob],
            ["Gender", student.gender],
            ["Blood Group", student.blood_group],
            ["Primary Phone", student.phone],
            ["Email Address", student.email],
            ["Student Mobile", student.student_mobile_no],
            ["Secondary Phone", student.secondary_phone],
            ["Aadhar Number", student.aadhar_card_number],
            ["PAN", student.pan_no],
            ["Religion", student.religion],
            ["Caste", student.caste],
            ["Nationality", student.nationality],
            ["Place of Birth", student.place_of_birth],
            ["Native Place", student.native_place],
            ["Domicile", student.domicile_of_maharashtra],
            ["PHD/Handicap", student.phd_handicap],
        ]);

        // --- 7. Family Details ---
        addSection("Family Details", [
            ["Father's Name", student.father_name],
            ["Father's Mobile", student.father_mobile_no],
            ["Father's Occupation", student.father_occupation],
            ["Father's Income", student.father_annual_income],
            ["Father's Income", student.father_annual_income],
            ["Father's Email", student.father_email],
            ["Mother's Name", student.mother_name],
            ["Mother's Mobile", student.mother_mobile_no],
            ["Mother's Occupation", student.mother_occupation],
            ["Mother's Income", student.mother_annual_income],
            ["Mother's Email", student.mother_email],
        ]);
        
        // --- 8. Address Details ---
         addSection("Address Details", [
            ["Corr. Address", student.address],
            ["Corr. City", student.city],
            ["Corr. State", student.state],
            ["Corr. ZIP", student.zipcode],
            ["Corr. Taluka", student.correspondence_details?.taluka ?? null],
            ["Corr. District", student.correspondence_details?.district ?? null],
            ["Perm. Address", student.permanent_details?.address ?? null],
            ["Perm. City", student.permanent_details?.city ?? null],
            ["Perm. State", student.permanent_details?.state ?? null],
            ["Perm. ZIP", student.permanent_details?.zipcode ?? null],
            ["Perm. Taluka", student.permanent_details?.taluka ?? null],
            ["Perm. District", student.permanent_details?.district ?? null],
        ]);

        // --- 9. Application & Category Details ---
        addSection("Application & Category Details", [
            ["Form No.", student.form_no],
            ["Registration No.", student.registration_no],
            ["Merit No.", student.merit_no],
             ["Admission Year", student.admission_year],
            ["Admission Type", student.admission_type],
            ["Adm. Category", student.admission_category],
            ["Category Type", student.category_type],
            ["Scholarship", student.scholarship_categories?.name ?? null],
        ]);

        // --- 10. Academic History ---
        const acad = student.academic_records;
        if (acad) {
            const acadRows: (string | null)[][] = [];
            if (acad.ssc_year) {
                acadRows.push(["SSC Year", acad.ssc_year], ["SSC %", acad.ssc_pct]);
            }
            if (acad.hsc_year) {
                acadRows.push(["HSC Year", acad.hsc_year], ["HSC %", acad.hsc_pct]);
            }
            if (acad.dip_year) {
                acadRows.push(["Diploma Year", acad.dip_year], ["Dip. %", acad.dip_pct]);
            }
            if (acad.dsy_inst) {
                acadRows.push(["DSY Inst", acad.dsy_inst], ["DSY Branch", acad.dsy_branch]);
            }
            if (acad.cet_seat) {
                acadRows.push(["MHT-CET Seat", acad.cet_seat], ["CET %", acad.cet_pct]);
            }
            if (acad.jee_seat) {
                acadRows.push(["JEE Seat", acad.jee_seat], ["JEE Score", acad.jee_total]);
            }
            if (acad.nata_seat) {
                acadRows.push(["NATA Seat", acad.nata_seat], ["NATA Marks", acad.nata_obt]);
            }
            
            if (acadRows.length > 0) {
                addSection("Academic History", acadRows);
            }
        }

        // --- 10. Additional Information ---
        if (student.custom_data && Object.keys(student.custom_data).length > 0) {
            const customFields = Object.entries(student.custom_data).map(([key, value]) => [key, value]);
            addSection("Additional Information", customFields);
        }

        // --- 11. Save the PDF ---
        doc.save(`${student.fullname || 'student'}_profile.pdf`);
    };


    // --- Content Renderers ---

    const renderViewContent = (student: StudentDetail) => {
        const courseName = student.courses?.name || allCourses.find(c => c.id === (student.academic_year_data?.course_id || student.course_id))?.name || "N/A";
        const linkedAYIdFromSem = allSemesters.find(s => s.id === (student.semester_id || student.current_sem_id))?.academic_year_id;
        const academicYearName = student.year_category?.name || allAcademicYears.find(ay => ay.id === (student.student_academic_year_id || student.admission_year_id || linkedAYIdFromSem))?.name || "N/A";
        const semesterName = student.semesters?.name || allSemesters.find(s => s.id === (student.semester_id || student.current_sem_id))?.name || "N/A";

        const getStatusVariant = (status: string | null) => {
            if (!status) return 'secondary';
            if (status.toLowerCase() === 'active' || status.toLowerCase() === 'approved') return 'default';
            if (status.toLowerCase() === 'rejected' || status.toLowerCase() === 'inactive') return 'destructive';
            return 'secondary';
        };

        return (
            <div className="space-y-6">
                <div className="flex justify-center">
                    <StudentAvatar src={student.photo_path} alt={student.fullname} />
                </div>
                
                <Accordion type="multiple" defaultValue={['item-1', 'item-2']} className="w-full">
                    
                    <AccordionItem value="item-1">
                        <AccordionTrigger className="text-lg font-semibold">Enrollment Details</AccordionTrigger>
                        <AccordionContent className="pt-4 space-y-4">
                            <DetailItem label="Course" value={courseName} />
                            <DetailItem label="Academic Year" value={academicYearName} />
                            <DetailItem label="Semester" value={semesterName} />
                            <DetailItem label="Enrollment Status" value={
                                <Badge variant={getStatusVariant(student.status)} className="capitalize">{student.status}</Badge>
                            } />
                            <DetailItem label="Promotion Status" value={
                                <Badge variant={student.promotion_status === "Eligible" ? "default" : "secondary"} className="capitalize">{student.promotion_status}</Badge>
                            } />
                            <DetailItem label="Admission Year (Session)" value={student.academic_year_data?.session || student.admission_year} />
                        </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-2">
                        <AccordionTrigger className="text-lg font-semibold">Personal & Contact Details</AccordionTrigger>
                        <AccordionContent className="pt-4 space-y-4">
                            <DetailItem label="Full Name" value={student.fullname} />
                            <DetailItem label="Roll Number" value={student['rollNumber']} />
                            <DetailItem label="Email" value={student.email} />
                            <DetailItem label="Primary Phone" value={student.phone} />
                            <DetailItem label="Student Mobile" value={student.student_mobile_no} />
                            <DetailItem label="Secondary Phone" value={student.secondary_phone} />
                            <DetailItem label="Date of Birth" value={student.dateofbirth ? format(parseISO(student.dateofbirth), "PPP") : "N/A"} />
                            <DetailItem label="Gender" value={student.gender} />
                            <DetailItem label="Blood Group" value={student.blood_group} />
                            <DetailItem label="Religion" value={student.religion} />
                            <DetailItem label="Caste" value={student.caste} />
                            <DetailItem label="Nationality" value={student.nationality} />
                            <DetailItem label="Place of Birth" value={student.place_of_birth} />
                            <DetailItem label="Aadhar" value={student.aadhar_card_number} />
                            <DetailItem label="ABC ID" value={student.abc_id} />
                            <DetailItem label="APAAR ID" value={student.apaar_id} />
                            <DetailItem label="PAN" value={student.pan_no} />
                            <DetailItem label="Domicile of Maharashtra" value={student.domicile_of_maharashtra} />
                            <DetailItem label="PHD/Handicap" value={student.phd_handicap} />
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-3">
                        <AccordionTrigger className="text-lg font-semibold">Family Details</AccordionTrigger>
                        <AccordionContent className="pt-4 space-y-4">
                            <DetailItem label="Father's Name" value={student.father_name} />
                            <DetailItem label="Father's Occupation" value={student.father_occupation} />
                            <DetailItem label="Father's Annual Income" value={student.father_annual_income} />
                            <DetailItem label="Father's Mobile" value={student.father_mobile_no} />
                            <Separator />
                            <DetailItem label="Mother's Name" value={student.mother_name} />
                            <DetailItem label="Mother's Occupation" value={student.mother_occupation} />
                            <DetailItem label="Mother's Annual Income" value={student.mother_annual_income} />
                            <DetailItem label="Mother's Mobile" value={student.mother_mobile_no} />
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-4">
                        <AccordionTrigger className="text-lg font-semibold">Address Details</AccordionTrigger>
                        <AccordionContent className="pt-4 space-y-6">
                            <div className="space-y-4">
                                <h4 className="font-semibold text-primary/80 border-b pb-1">Correspondence Address</h4>
                                <DetailItem label="Address" value={student.address} />
                                <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                                    <DetailItem label="City" value={student.city} />
                                    <DetailItem label="State" value={student.state} />
                                    <DetailItem label="ZIP Code" value={student.zipcode} />
                                    <DetailItem label="Taluka" value={student.correspondence_details?.taluka} />
                                    <DetailItem label="District" value={student.correspondence_details?.district} />
                                </div>
                            </div>
                            
                            <Separator />
                            
                            <div className="space-y-4">
                                <h4 className="font-semibold text-primary/80 border-b pb-1">Permanent Address</h4>
                                <DetailItem label="Address" value={student.permanent_details?.address} />
                                <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                                    <DetailItem label="City" value={student.permanent_details?.city} />
                                    <DetailItem label="State" value={student.permanent_details?.state} />
                                    <DetailItem label="ZIP Code" value={student.permanent_details?.zipcode} />
                                    <DetailItem label="Taluka" value={student.permanent_details?.taluka} />
                                    <DetailItem label="District" value={student.permanent_details?.district} />
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-5">
                        <AccordionTrigger className="text-lg font-semibold">Academic History</AccordionTrigger>
                        <AccordionContent className="pt-4 space-y-6">
                            {/* SSC Section */}
                            <div className="space-y-4">
                                <h4 className="font-semibold text-primary/80 border-b pb-1">SSC (10th Standard)</h4>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                                    <DetailItem label="Year" value={student.academic_records?.ssc_year} />
                                    <DetailItem label="Board" value={student.academic_records?.ssc_board} />
                                    <DetailItem label="Institute" value={student.academic_records?.ssc_inst} />
                                    <DetailItem label="Institute Addr" value={student.academic_records?.ssc_inst_addr} />
                                    <DetailItem label="Seat No." value={student.academic_records?.ssc_seat} />
                                    <DetailItem label="Marks" value={`${student.academic_records?.ssc_obt} / ${student.academic_records?.ssc_out}`} />
                                    <DetailItem label="Percentage" value={student.academic_records?.ssc_pct ? `${student.academic_records.ssc_pct}%` : "N/A"} />
                                </div>
                            </div>

                            <Separator />

                            {/* HSC Section */}
                             <div className="space-y-4">
                                <h4 className="font-semibold text-primary/80 border-b pb-1">HSC (12th Standard)</h4>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                                    <DetailItem label="Year" value={student.academic_records?.hsc_year} />
                                    <DetailItem label="Board" value={student.academic_records?.hsc_board} />
                                    <DetailItem label="Institute" value={student.academic_records?.hsc_inst} />
                                    <DetailItem label="Institute Addr" value={student.academic_records?.hsc_inst_addr} />
                                    <DetailItem label="Seat No." value={student.academic_records?.hsc_seat} />
                                    <DetailItem label="Physics" value={student.academic_records?.hsc_phy} />
                                    <DetailItem label="Maths" value={student.academic_records?.hsc_math} />
                                    <DetailItem label="Chemistry" value={student.academic_records?.hsc_chem} />
                                    <DetailItem label="Marks" value={`${student.academic_records?.hsc_obt} / ${student.academic_records?.hsc_out}`} />
                                    <DetailItem label="Percentage" value={student.academic_records?.hsc_pct ? `${student.academic_records.hsc_pct}%` : "N/A"} />
                                </div>
                            </div>

                            {(student.academic_records?.dip_year || student.academic_records?.dip_pct) && (
                                <>
                                    <Separator />
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-primary/80 border-b pb-1">Diploma Details</h4>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                                            <DetailItem label="Year" value={student.academic_records?.dip_year} />
                                            <DetailItem label="Board" value={student.academic_records?.dip_board} />
                                            <DetailItem label="Institute" value={student.academic_records?.dip_inst} />
                                            <DetailItem label="Institute Addr" value={student.academic_records?.dip_inst_addr} />
                                            <DetailItem label="Seat No." value={student.academic_records?.dip_seat} />
                                            <DetailItem label="Percentage" value={student.academic_records?.dip_pct ? `${student.academic_records.dip_pct}%` : "N/A"} />
                                        </div>
                                    </div>
                                </>
                            )}

                            {(student.academic_records?.dsy_inst || student.academic_records?.dsy_branch) && (
                                <>
                                    <Separator />
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-primary/80 border-b pb-1">Direct Second Year (DSY)</h4>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                                            <DetailItem label="Institute" value={student.academic_records?.dsy_inst} />
                                            <DetailItem label="Institute Addr" value={student.academic_records?.dsy_inst_addr} />
                                            <DetailItem label="Code" value={student.academic_records?.dsy_code} />
                                            <DetailItem label="Branch" value={student.academic_records?.dsy_branch} />
                                            <DetailItem label="Marks" value={student.academic_records?.dsy_obt ? `${student.academic_records.dsy_obt} / ${student.academic_records.dsy_out}` : "N/A"} />
                                        </div>
                                    </div>
                                </>
                            )}
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-entrance">
                        <AccordionTrigger className="text-lg font-semibold">Entrance Exam Records</AccordionTrigger>
                        <AccordionContent className="pt-4 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* CET */}
                                <div className="space-y-2">
                                    <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">MHT-CET</h4>
                                    <div className="p-3 bg-muted rounded-lg space-y-2">
                                        <DetailItem label="Seat No." value={student.academic_records?.cet_seat} />
                                        <DetailItem label="Percentile" value={student.academic_records?.cet_pct} />
                                    </div>
                                </div>
                                {/* JEE */}
                                <div className="space-y-2">
                                    <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">JEE Main</h4>
                                    <div className="p-3 bg-muted rounded-lg space-y-2">
                                        <DetailItem label="Seat No." value={student.academic_records?.jee_seat} />
                                        <DetailItem label="Total Score" value={student.academic_records?.jee_total} />
                                    </div>
                                </div>
                                {/* NATA */}
                                <div className="space-y-2">
                                    <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">NATA</h4>
                                    <div className="p-3 bg-muted rounded-lg space-y-2">
                                        <DetailItem label="Seat No." value={student.academic_records?.nata_seat} />
                                        <DetailItem label="Marks" value={`${student.academic_records?.nata_obt} / ${student.academic_records?.nata_out}`} />
                                    </div>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-6">
                        <AccordionTrigger className="text-lg font-semibold">Application & Category Details</AccordionTrigger>
                        <AccordionContent className="pt-4 space-y-4">
                            <DetailItem label="Form No." value={student.form_no} />
                            <DetailItem label="Registration No." value={student.registration_no} />
                            <DetailItem label="Merit No." value={student.merit_no} />
                            <DetailItem label="Admission Year" value={student.admission_year} />
                            <DetailItem label="Admission Type" value={student.admission_type} />
                            <DetailItem label="Admission Category" value={student.admission_category} />
                            <DetailItem label="Category Type" value={student.category_type} />
                            <DetailItem label="Scholarship" value={student.scholarship_categories?.name} />
                            <DetailItem label="Source of Info" value={student.how_did_you_know} />
                        </AccordionContent>
                    </AccordionItem>

                    {student.custom_data && Object.keys(student.custom_data).length > 0 && (
                        <AccordionItem value="item-6">
                            <AccordionTrigger className="text-lg font-semibold">Additional Information</AccordionTrigger>
                            <AccordionContent className="pt-4 space-y-4">
                                {Object.entries(student.custom_data).map(([key, value]) => (
                                    <DetailItem key={key} label={key} value={value} />
                                ))}
                            </AccordionContent>
                        </AccordionItem>
                    )}

                    {student.documents && student.documents.length > 0 && (
                        <AccordionItem value="item-7">
                            <AccordionTrigger className="text-lg font-semibold">Uploaded Documents</AccordionTrigger>
                            <AccordionContent className="pt-4 space-y-2">
                                {student.documents.map((doc: any, index: number) => {
                                    const docName = typeof doc === 'string' ? doc : (doc.name || doc.type || doc.fileName || "Document");
                                    const subLabel = typeof doc === 'object' && doc !== null ? (doc.fileName || (doc.path ? doc.path.split('/').pop() : "")) : "";
                                    const isViewable = typeof doc === 'object' && doc !== null && doc.path;

                                    return (
                                        <button
                                            key={typeof doc === 'object' && doc !== null ? (doc.path || index) : index}
                                            onClick={() => isViewable ? handleViewDocument(doc) : null}
                                            className="flex w-full items-center justify-between p-3 bg-secondary rounded-md border hover:bg-muted group text-left"
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <File className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                                <div className="overflow-hidden">
                                                    <p className="text-sm font-medium group-hover:underline truncate">{docName}</p>
                                                    {subLabel && <p className="text-[10px] text-muted-foreground truncate">{subLabel}</p>}
                                                </div>
                                            </div>
                                            {isViewable && <Eye className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0 ml-2" />}
                                        </button>
                                    );
                                })}
                            </AccordionContent>
                        </AccordionItem>
                    )}
                    {missingDocs.length > 0 && (
                        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg mb-6 flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-bold text-red-700">Missing Mandatory Documents ({missingDocs.length})</h4>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {missingDocs.map(doc => (
                                        <Badge key={doc} variant="destructive" className="bg-red-100 text-red-700 border-red-200 font-normal hover:bg-red-100">
                                            {doc}
                                        </Badge>
                                    ))}
                                </div>
                                <p className="text-[10px] text-red-600 mt-2 italic">* Based on Student Category & Scholarship rules.</p>
                            </div>
                        </div>
                    )}

                    <AccordionItem value="item-scholarships">
                        <AccordionTrigger className="text-lg font-semibold">Scholarship Applications</AccordionTrigger>
                        <AccordionContent className="pt-4 space-y-3">
                            {allScholarships.length === 0 ? (
                                <p className="text-sm text-slate-400 italic py-4">No scholarship records found.</p>
                            ) : (
                                <div className="space-y-3">
                                    {allScholarships.map(s => (
                                        <div key={s.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between group">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[14px] font-bold text-slate-800">
                                                       {allCategories.find((c: any) => c.id === s.scholarship_category_id)?.name || "Scholarship"}
                                                    </span>
                                                    <Badge className={cn(
                                                        "text-[9px] font-bold uppercase",
                                                        s.scholarship_status === 'approved' ? "bg-emerald-50 text-emerald-600 border-none" :
                                                        s.scholarship_status === 'rejected' ? "bg-rose-50 text-rose-600 border-none" : "bg-amber-50 text-amber-600 border-none"
                                                    )}>{s.scholarship_status}</Badge>
                                                </div>
                                                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider leading-none">
                                                   APP ID: {s.scholarship_application_id} • Year {s.academic_year_name}
                                                </p>
                                            </div>
                                            <Button asChild size="sm" variant="ghost" className="h-8 group-hover:bg-white border-transparent hover:border-slate-200 transition-all">
                                                <Link href={`/management/students/scholarships/${s.id}`}>Verify <ExternalLink size={12} className="ml-1.5" /></Link>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-enrollment-history">
                        <AccordionTrigger className="text-lg font-semibold">Academic Timeline & Enrollments</AccordionTrigger>
                        <AccordionContent className="pt-4 space-y-4">
                            {enrollmentHistory.map(ay => (
                                <div key={ay.id} className="p-5 border border-slate-200 rounded-2xl bg-white shadow-sm space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-900">{ay.academic_year_name}</h4>
                                            <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">{ay.courses?.name} • Session {ay.academic_year_session}</p>
                                        </div>
                                        <Badge variant="outline" className="text-[9px] font-bold border-slate-200 text-slate-400">AY ID: {ay.id}</Badge>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {ay.semesters?.map((sem: any) => (
                                            <div key={sem.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                                                <div>
                                                    <p className="text-[12px] font-bold text-slate-700">{sem.semesters?.name || "Semester"}</p>
                                                    <p className="text-[9px] text-slate-400 font-medium mt-0.5">Enrollment: {new Date(sem.created_at).toLocaleDateString()}</p>
                                                </div>
                                                <Badge className={cn(
                                                    "text-[8px] font-bold uppercase",
                                                    sem.status === 'active' ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-400"
                                                )}>{sem.status}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-cancellations">
                        <AccordionTrigger className="text-lg font-semibold">Withdrawal & Cancellation Requests</AccordionTrigger>
                        <AccordionContent className="pt-4 space-y-3">
                            {cancellationRequests.length === 0 ? (
                                <p className="text-sm text-slate-400 italic py-4">No cancellation requests found.</p>
                            ) : (
                                <div className="space-y-3">
                                    {cancellationRequests.map(c => (
                                        <div key={c.id} className="p-4 bg-rose-50/30 border border-rose-100 rounded-xl space-y-3 group">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <AlertTriangle size={14} className="text-rose-500" />
                                                    <span className="text-[13px] font-bold text-slate-800">Cancellation for {c.cancel_year}</span>
                                                </div>
                                                <Badge className={cn(
                                                    "text-[9px] font-bold uppercase",
                                                    c.status === 'approved' ? "bg-emerald-50 text-emerald-600" :
                                                    c.status === 'rejected' ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                                                )}>{c.status}</Badge>
                                            </div>
                                            <p className="text-[12px] text-slate-600 line-clamp-2 px-6 border-l-2 border-rose-200">{c.reason}</p>
                                            <div className="mt-2 flex justify-end">
                                                <Button asChild size="sm" variant="outline" className="h-8 rounded-lg text-xs font-bold border-rose-200 text-rose-600 hover:bg-rose-50">
                                                    <Link href={`/management/students/cancellations/${c.id}`}>Process Request</Link>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </AccordionContent>
                    </AccordionItem>

                </Accordion>
            </div>
        )
    }

    const renderEditForm = () => (
        <form onSubmit={handleEditSubmit}>
            <Tabs value={activeEditTab} onValueChange={setActiveEditTab} className="w-full">
                <TabsList className="flex flex-wrap h-auto w-full gap-1 p-1 mb-4 bg-muted/50 rounded-lg">
                    <TabsTrigger value="personal" className="flex-1 text-[10px] sm:text-sm py-2">Personal</TabsTrigger>
                    <TabsTrigger value="academic" className="flex-1 text-[10px] sm:text-sm py-2">Academic</TabsTrigger>
                    <TabsTrigger value="admission" className="flex-1 text-[10px] sm:text-sm py-2">Enrollment</TabsTrigger>
                    <TabsTrigger value="application" className="flex-1 text-[10px] sm:text-sm py-2">Application</TabsTrigger>
                    <TabsTrigger value="docs" className="flex-1 text-[10px] sm:text-sm py-2">Documents</TabsTrigger>
                </TabsList>

                {/* Personal & Parent Tab */}
                <TabsContent value="personal" className="space-y-6 pt-4">
                    <Card>
                        <CardHeader><CardTitle>Personal Details</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormInputGroup label="First Name" name="firstname" value={editFormData.firstname || ""} onChange={handleEditChange} required />
                                <FormInputGroup label="Middle Name" name="middlename" value={editFormData.middlename || ""} onChange={handleEditChange} />
                                <FormInputGroup label="Last Name" name="lastname" value={editFormData.lastname || ""} onChange={handleEditChange} required />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormDatePickerGroup label="Date of Birth" date={editFormDateOfBirth} setDate={setEditFormDateOfBirth} required />
                                <FormSelectGroup label="Gender" name="gender" value={editFormData.gender} onValueChange={(val: string) => handleEditSelectChange("gender", val)} options={genderOptions} placeholder="Select gender" />
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormInputGroup label="Email Address" name="email" type="email" value={editFormData.email || ""} onChange={handleEditChange} required />
                                <FormInputGroup label="Roll Number" name="rollNumber" value={editFormData['rollNumber'] || ""} onChange={handleEditChange} required />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormInputGroup label="Place of Birth" name="place_of_birth" value={editFormData.place_of_birth || ""} onChange={handleEditChange} />
                                <FormInputGroup label="Native Place" name="native_place" value={editFormData.native_place || ""} onChange={handleEditChange} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormInputGroup label="Primary Phone" name="phone" type="tel" value={editFormData.phone || ""} onChange={handleEditChange} required />
                                <FormInputGroup label="Student Mobile" name="student_mobile_no" type="tel" value={editFormData.student_mobile_no || ""} onChange={handleEditChange} />
                                <FormInputGroup label="Secondary Phone" name="secondary_phone" type="tel" value={editFormData.secondary_phone || ""} onChange={handleEditChange} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Identity & Background</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormInputGroup label="Blood Group" name="blood_group" value={editFormData.blood_group || ""} onChange={handleEditChange} />
                                <FormInputGroup label="Nationality" name="nationality" value={editFormData.nationality || ""} onChange={handleEditChange} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormInputGroup label="Religion" name="religion" value={editFormData.religion || ""} onChange={handleEditChange} />
                                <FormInputGroup label="Caste" name="caste" value={editFormData.caste || ""} onChange={handleEditChange} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormSelectGroup label="Domicile" name="domicile_of_maharashtra" value={editFormData.domicile_of_maharashtra} onValueChange={(val) => handleEditSelectChange("domicile_of_maharashtra", val)} options={yesNoOptions} placeholder="Domicile?" />
                                <FormSelectGroup label="Handicap" name="phd_handicap" value={editFormData.phd_handicap} onValueChange={(val) => handleEditSelectChange("phd_handicap", val)} options={yesNoOptions} placeholder="Handicap?" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormInputGroup label="Aadhar Number" name="aadhar_card_number" value={editFormData.aadhar_card_number || ""} onChange={handleEditChange} />
                                <FormInputGroup label="ABC ID" name="abc_id" value={editFormData.abc_id || ""} onChange={handleEditChange} />
                                <FormInputGroup label="APAAR ID" name="apaar_id" value={editFormData.apaar_id || ""} onChange={handleEditChange} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormInputGroup label="PAN Card Number" name="pan_no" value={editFormData.pan_no || ""} onChange={handleEditChange} />
                                <FormInputGroup label="Source of Info" name="how_did_you_know" value={editFormData.how_did_you_know || ""} onChange={handleEditChange} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Parent / Guardian Details</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormInputGroup label="Father's Name" name="father_name" value={editFormData.father_name || ""} onChange={handleEditChange} />
                                 <FormInputGroup label="Father's Occupation" name="father_occupation" value={editFormData.father_occupation || ""} onChange={handleEditChange} />
                                <FormInputGroup label="Father's Annual Income" name="father_annual_income" value={editFormData.father_annual_income || ""} onChange={handleEditChange} />
                                <FormInputGroup label="Father's Mobile" name="father_mobile_no" type="tel" value={editFormData.father_mobile_no || ""} onChange={handleEditChange} />
                                <FormInputGroup label="Father's Email" name="father_email" type="email" value={editFormData.father_email || ""} onChange={handleEditChange} />
                            </div>
                            <Separator />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormInputGroup label="Mother's Name" name="mother_name" value={editFormData.mother_name || ""} onChange={handleEditChange} />
                                <FormInputGroup label="Mother's Occupation" name="mother_occupation" value={editFormData.mother_occupation || ""} onChange={handleEditChange} />
                                <FormInputGroup label="Mother's Annual Income" name="mother_annual_income" value={editFormData.mother_annual_income || ""} onChange={handleEditChange} />
                                <FormInputGroup label="Mother's Mobile" name="mother_mobile_no" type="tel" value={editFormData.mother_mobile_no || ""} onChange={handleEditChange} />
                                <FormInputGroup label="Mother's Email" name="mother_email" type="email" value={editFormData.mother_email || ""} onChange={handleEditChange} />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex flex-col sm:flex-row justify-between items-center pt-6 gap-4 border-t mt-6">
                        <p className="text-[10px] sm:text-xs text-muted-foreground w-full sm:w-auto text-center sm:text-left">Ensure all personal details are correct.</p>
                        <div className="flex gap-2 w-full sm:w-auto">
                             <Button type="submit" variant="secondary" size="sm" disabled={isSubmitting} className="flex-1 sm:flex-none">
                                <Save className="h-3 w-3 mr-2" /> Update
                            </Button>
                            <Button type="button" size="sm" onClick={() => setActiveEditTab("academic")} className="flex-1 sm:flex-none">
                                Next <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                {/* Academic Tab Content */}
                <TabsContent value="academic" className="space-y-6 pt-4">
                    <Card>
                        <CardHeader><CardTitle>SSC (10th Standard)</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormInputGroup label="Passing Year" value={editFormData.academic_records?.ssc_year || ""} onChange={(e) => handleAcademicChange("ssc_year", e.target.value)} />
                                <FormInputGroup label="Board" value={editFormData.academic_records?.ssc_board || ""} onChange={(e) => handleAcademicChange("ssc_board", e.target.value)} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormInputGroup label="Institute Name" value={editFormData.academic_records?.ssc_inst || ""} onChange={(e) => handleAcademicChange("ssc_inst", e.target.value)} />
                                <FormInputGroup label="Institute Address" value={editFormData.academic_records?.ssc_inst_addr || ""} onChange={(e) => handleAcademicChange("ssc_inst_addr", e.target.value)} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <FormInputGroup label="Seat No." value={editFormData.academic_records?.ssc_seat || ""} onChange={(e) => handleAcademicChange("ssc_seat", e.target.value)} />
                                <FormInputGroup label="Obtained" type="number" value={editFormData.academic_records?.ssc_obt || ""} onChange={(e) => handleAcademicChange("ssc_obt", e.target.value)} />
                                <FormInputGroup label="Total Marks" type="number" value={editFormData.academic_records?.ssc_out || ""} onChange={(e) => handleAcademicChange("ssc_out", e.target.value)} />
                                <FormInputGroup label="Percentage %" value={editFormData.academic_records?.ssc_pct || ""} onChange={(e) => handleAcademicChange("ssc_pct", e.target.value)} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>HSC (12th Standard)</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormInputGroup label="Passing Year" value={editFormData.academic_records?.hsc_year || ""} onChange={(e) => handleAcademicChange("hsc_year", e.target.value)} />
                                <FormInputGroup label="Board" value={editFormData.academic_records?.hsc_board || ""} onChange={(e) => handleAcademicChange("hsc_board", e.target.value)} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormInputGroup label="Institute Name" value={editFormData.academic_records?.hsc_inst || ""} onChange={(e) => handleAcademicChange("hsc_inst", e.target.value)} />
                                <FormInputGroup label="Institute Address" value={editFormData.academic_records?.hsc_inst_addr || ""} onChange={(e) => handleAcademicChange("hsc_inst_addr", e.target.value)} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormInputGroup label="Seat No." value={editFormData.academic_records?.hsc_seat || ""} onChange={(e) => handleAcademicChange("hsc_seat", e.target.value)} />
                                <FormInputGroup label="Physics" type="number" value={editFormData.academic_records?.hsc_phy || ""} onChange={(e) => handleAcademicChange("hsc_phy", e.target.value)} />
                                <FormInputGroup label="Maths" type="number" value={editFormData.academic_records?.hsc_math || ""} onChange={(e) => handleAcademicChange("hsc_math", e.target.value)} />
                                <FormInputGroup label="Chemistry" type="number" value={editFormData.academic_records?.hsc_chem || ""} onChange={(e) => handleAcademicChange("hsc_chem", e.target.value)} />
                                <FormInputGroup label="Obtained" type="number" value={editFormData.academic_records?.hsc_obt || ""} onChange={(e) => handleAcademicChange("hsc_obt", e.target.value)} />
                                <FormInputGroup label="Total Marks" type="number" value={editFormData.academic_records?.hsc_out || ""} onChange={(e) => handleAcademicChange("hsc_out", e.target.value)} />
                                <FormInputGroup label="Percentage %" value={editFormData.academic_records?.hsc_pct || ""} onChange={(e) => handleAcademicChange("hsc_pct", e.target.value)} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Diploma Details</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormInputGroup label="Passing Year" value={editFormData.academic_records?.dip_year || ""} onChange={(e) => handleAcademicChange("dip_year", e.target.value)} />
                                <FormInputGroup label="Board" value={editFormData.academic_records?.dip_board || ""} onChange={(e) => handleAcademicChange("dip_board", e.target.value)} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormInputGroup label="Institute Name" value={editFormData.academic_records?.dip_inst || ""} onChange={(e) => handleAcademicChange("dip_inst", e.target.value)} />
                                <FormInputGroup label="Institute Address" value={editFormData.academic_records?.dip_inst_addr || ""} onChange={(e) => handleAcademicChange("dip_inst_addr", e.target.value)} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormInputGroup label="Seat No." value={editFormData.academic_records?.dip_seat || ""} onChange={(e) => handleAcademicChange("dip_seat", e.target.value)} />
                                <FormInputGroup label="Percentage %" value={editFormData.academic_records?.dip_pct || ""} onChange={(e) => handleAcademicChange("dip_pct", e.target.value)} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Direct Second Year (DSY)</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormInputGroup label="Institute Name" value={editFormData.academic_records?.dsy_inst || ""} onChange={(e) => handleAcademicChange("dsy_inst", e.target.value)} />
                                <FormInputGroup label="Institute Address" value={editFormData.academic_records?.dsy_inst_addr || ""} onChange={(e) => handleAcademicChange("dsy_inst_addr", e.target.value)} />
                                <FormInputGroup label="Institute Code" value={editFormData.academic_records?.dsy_code || ""} onChange={(e) => handleAcademicChange("dsy_code", e.target.value)} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormInputGroup label="Branch" value={editFormData.academic_records?.dsy_branch || ""} onChange={(e) => handleAcademicChange("dsy_branch", e.target.value)} />
                                <FormInputGroup label="Obtained" type="number" value={editFormData.academic_records?.dsy_obt || ""} onChange={(e) => handleAcademicChange("dsy_obt", e.target.value)} />
                                <FormInputGroup label="Total Marks" type="number" value={editFormData.academic_records?.dsy_out || ""} onChange={(e) => handleAcademicChange("dsy_out", e.target.value)} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Entrance Exam Details</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold border-b pb-1">MHT-CET</h4>
                                    <div className="space-y-3">
                                        <FormInputGroup label="Seat No." value={editFormData.academic_records?.cet_seat || ""} onChange={(e) => handleAcademicChange("cet_seat", e.target.value)} />
                                        <FormInputGroup label="Percentile" value={editFormData.academic_records?.cet_pct || ""} onChange={(e) => handleAcademicChange("cet_pct", e.target.value)} />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold border-b pb-1">JEE Main</h4>
                                    <div className="space-y-3">
                                        <FormInputGroup label="Seat No." value={editFormData.academic_records?.jee_seat || ""} onChange={(e) => handleAcademicChange("jee_seat", e.target.value)} />
                                        <FormInputGroup label="Score" value={editFormData.academic_records?.jee_total || ""} onChange={(e) => handleAcademicChange("jee_total", e.target.value)} />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold border-b pb-1">NATA</h4>
                                    <div className="space-y-3">
                                        <FormInputGroup label="Seat No." value={editFormData.academic_records?.nata_seat || ""} onChange={(e) => handleAcademicChange("nata_seat", e.target.value)} />
                                        <div className="grid grid-cols-2 gap-2">
                                            <FormInputGroup label="Obtained" type="number" value={editFormData.academic_records?.nata_obt || ""} onChange={(e) => handleAcademicChange("nata_obt", e.target.value)} />
                                            <FormInputGroup label="Out of" type="number" value={editFormData.academic_records?.nata_out || ""} onChange={(e) => handleAcademicChange("nata_out", e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex flex-col sm:flex-row justify-between items-center pt-6 gap-4 border-t mt-6">
                        <Button type="button" variant="ghost" size="sm" onClick={() => setActiveEditTab("personal")} className="w-full sm:w-auto order-2 sm:order-1">
                           <ChevronLeft className="h-4 w-4 mr-1" /> Back
                        </Button>
                        <div className="flex gap-2 w-full sm:w-auto order-1 sm:order-2">
                             <Button type="submit" variant="secondary" size="sm" disabled={isSubmitting} className="flex-1 sm:flex-none">
                                <Save className="h-3 w-3 mr-2" /> Update
                            </Button>
                            <Button type="button" size="sm" onClick={() => setActiveEditTab("admission")} className="flex-1 sm:flex-none">
                                Next <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                {/* Enrollment & Address Tab */}
                <TabsContent value="admission" className="space-y-6 pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Enrollment Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormSearchableSelectGroup
                                    label="Course"
                                    value={editFormData.academic_year_data?.course_id ?? null}
                                    onChange={(val) => setEditFormData(prev => ({ 
                                        ...prev, 
                                        academic_year_data: { ...(prev.academic_year_data as any), course_id: val } 
                                    }))}
                                    options={allCourseOptions}
                                    placeholder="Select course"
                                    required
                                />
                                <FormSearchableSelectGroup
                                    label="Academic Year"
                                    value={editFormData.student_academic_year_id ?? null}
                                    onChange={(val) => setEditFormData(prev => ({ 
                                        ...prev, 
                                        student_academic_year_id: val 
                                    }))}
                                    options={editModalAcademicYearOptions}
                                    placeholder="Select academic year"
                                    required
                                />
                                <FormSearchableSelectGroup
                                    label="Semester"
                                    value={editFormData.semester_id ?? null}
                                    onChange={(val) => {
                                        handleEditSelectChange("semester_id", val || "");
                                        if (val) {
                                            const selectedSem = allSemesters.find(s => s.id === val);
                                            if (selectedSem?.academic_year_id) {
                                                setEditFormData(prev => ({ 
                                                    ...prev, 
                                                    student_academic_year_id: selectedSem.academic_year_id 
                                                }));
                                            }
                                        }
                                    }}
                                    options={editModalSemesterOptions}
                                    placeholder="Select semester"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormSelectGroup 
                                    label="Enrollment Status" 
                                    name="status" 
                                    value={editFormData.status} 
                                    onValueChange={(val: string) => handleEditSelectChange("status", val)} 
                                    options={statusOptions} 
                                    placeholder="Select status" 
                                    required 
                                />
                                <FormSelectGroup 
                                    label="Promotion Status" 
                                    name="promotion_status" 
                                    value={editFormData.promotion_status} 
                                    onValueChange={(val: string) => handleEditSelectChange("promotion_status", val)} 
                                    options={promotionStatusOptions} 
                                    placeholder="Select status" 
                                    required 
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormInputGroup label="Admission Year (Session Start)" name="admission_year" value={editFormData.admission_year || ""} onChange={handleEditChange} />
                                <FormInputGroup label="Academic Year Session" name="session" value={editFormData.academic_year_data?.session || ""} onChange={(e) => setEditFormData(prev => ({ ...prev, academic_year_data: { ...(prev.academic_year_data as any), session: e.target.value } }))} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Address Details</CardTitle>
                            <CardDescription>This is the primary (correspondence) address.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormInputGroup label="Address Line" name="address" value={editFormData.address || ""} onChange={handleEditChange} required />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormInputGroup label="City" name="city" value={editFormData.city || ""} onChange={handleEditChange} required />
                                <FormInputGroup label="State" name="state" value={editFormData.state || ""} onChange={handleEditChange} required />
                                <FormInputGroup label="ZIP Code" name="zipcode" value={editFormData.zipcode || ""} onChange={handleEditChange} required />
                                <FormInputGroup label="Taluka" name="taluka" value={editFormData.correspondence_details?.taluka || ""} onChange={(e) => handleCorrespondenceChange("taluka", e.target.value)} />
                                <FormInputGroup label="District" name="district" value={editFormData.correspondence_details?.district || ""} onChange={(e) => handleCorrespondenceChange("district", e.target.value)} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Permanent Address</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormInputGroup label="Address Line" name="perm_address" value={editFormData.permanent_details?.address || ""} onChange={(e) => handlePermanentChange("address", e.target.value)} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormInputGroup label="City" name="perm_city" value={editFormData.permanent_details?.city || ""} onChange={(e) => handlePermanentChange("city", e.target.value)} />
                                <FormInputGroup label="State" name="perm_state" value={editFormData.permanent_details?.state || ""} onChange={(e) => handlePermanentChange("state", e.target.value)} />
                                <FormInputGroup label="ZIP Code" name="perm_zipcode" value={editFormData.permanent_details?.zipcode || ""} onChange={(e) => handlePermanentChange("zipcode", e.target.value)} />
                                <FormInputGroup label="Taluka" name="perm_taluka" value={editFormData.permanent_details?.taluka || ""} onChange={(e) => handlePermanentChange("taluka", e.target.value)} />
                                <FormInputGroup label="District" name="perm_district" value={editFormData.permanent_details?.district || ""} onChange={(e) => handlePermanentChange("district", e.target.value)} />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex flex-col sm:flex-row justify-between items-center pt-6 gap-4 border-t mt-6">
                        <Button type="button" variant="ghost" size="sm" onClick={() => setActiveEditTab("academic")} className="w-full sm:w-auto order-2 sm:order-1">
                           <ChevronLeft className="h-4 w-4 mr-1" /> Back
                        </Button>
                        <div className="flex gap-2 w-full sm:w-auto order-1 sm:order-2">
                             <Button type="submit" variant="secondary" size="sm" disabled={isSubmitting} className="flex-1 sm:flex-none">
                                <Save className="h-3 w-3 mr-2" /> Update
                            </Button>
                            <Button type="button" size="sm" onClick={() => setActiveEditTab("application")} className="flex-1 sm:flex-none">
                                Next <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                {/* Application & Category Tab */}
                <TabsContent value="application" className="space-y-6 pt-4">
                    <Card>
                        <CardHeader><CardTitle>Original Application Details</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormInputGroup label="Form No." name="form_no" value={editFormData.form_no || ""} onChange={handleEditChange} />
                                <FormInputGroup label="Registration No." name="registration_no" value={editFormData.registration_no || ""} onChange={handleEditChange} />
                                <FormInputGroup label="Merit No." name="merit_no" value={editFormData.merit_no || ""} onChange={handleEditChange} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormInputGroup label="Admission Type" name="admission_type" value={editFormData.admission_type || ""} onChange={handleEditChange} />
                                <FormInputGroup label="Admission Category" name="admission_category" value={editFormData.admission_category || ""} onChange={handleEditChange} />
                            </div>
                            <FormInputGroup label="Source of Information (How did you hear about us?)" name="how_did_you_know" value={editFormData.how_did_you_know || ""} onChange={handleEditChange} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Category Details</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormInputGroup label="Category Type" name="category_type" value={editFormData.category_type || ""} onChange={handleEditChange} />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex flex-col sm:flex-row justify-between items-center pt-6 gap-4 border-t mt-6">
                        <Button type="button" variant="ghost" size="sm" onClick={() => setActiveEditTab("admission")} className="w-full sm:w-auto order-2 sm:order-1">
                           <ChevronLeft className="h-4 w-4 mr-1" /> Back
                        </Button>
                        <div className="flex gap-2 w-full sm:w-auto order-1 sm:order-2">
                             <Button type="submit" variant="secondary" size="sm" disabled={isSubmitting} className="flex-1 sm:flex-none">
                                <Save className="h-3 w-3 mr-2" /> Update
                            </Button>
                            <Button type="button" size="sm" onClick={() => setActiveEditTab("docs")} className="flex-1 sm:flex-none">
                                Next <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                {/* Documents & Custom Fields Tab */}
                <TabsContent value="docs" className="space-y-6 pt-4">
                    <Card>
                        <CardHeader><CardTitle>Manage Documents</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                {(editFormData.documents || []).length === 0 && filesToAdd.length === 0 && (
                                    <p className="text-sm text-muted-foreground italic">No documents uploaded.</p>
                                )}

                                {(editFormData.documents || []).map((doc: any, index: number) => {
                                    const docName = typeof doc === 'string' ? doc : (doc.name || doc.type || doc.fileName || "Document");
                                    const subLabel = typeof doc === 'object' && doc !== null ? (doc.fileName || (doc.path ? doc.path.split('/').pop() : "")) : "";
                                    
                                    return (
                                        <div key={typeof doc === 'object' && doc !== null ? (doc.path || index) : index} className="flex items-center justify-between p-2 bg-secondary rounded-md border">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <File className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                                <span className="text-sm font-medium truncate">{docName}</span>
                                                {subLabel && <span className="text-xs text-muted-foreground truncate">({subLabel})</span>}
                                            </div>
                                            <Button type="button" variant="ghost" size="icon" onClick={() => stageFileForRemoval(doc)} title="Remove this document">
                                                <Trash2 className="w-4 h-4 text-destructive" />
                                            </Button>
                                        </div>
                                    );
                                })}

                                {filesToAdd.map((doc) => (
                                    <div key={doc.id} className="flex items-center justify-between p-2 bg-green-900/10 rounded-md border border-green-700/20">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <Upload className="w-4 h-4 text-green-600 flex-shrink-0" />
                                            <span className="text-sm font-medium text-green-700 truncate">{doc.name}</span>
                                            <span className="text-xs text-muted-foreground truncate">({doc.file.name})</span>
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => cancelStagedFile(doc.id)} title="Cancel upload">
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 p-4 bg-muted rounded-lg border">
                                <h5 className="text-sm font-semibold mb-2">Add New Document</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label>Document Type*</Label>
                                        {/* 🚀 This now uses the fetched 'availableDocuments' state */}
                                        <SearchableSelect
                                            options={availableDocuments.map(d => ({ label: d.name, value: d.name }))}
                                            value={selectedDocument ? selectedDocument.name : null}
                                            onChange={(val) => setSelectedDocument(val ? { name: val, description: '' } : null)}
                                            placeholder="Search document type"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="newDocFileInput">Document File*</Label>
                                        <Input
                                            id="newDocFileInput"
                                            name="newDocFileInput"
                                            type="file"
                                            onChange={(e) => setNewDocFile(e.target.files?.[0] || null)}
                                        />
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    size="sm"
                                    className="mt-3"
                                    onClick={stageFileForUpload}
                                    disabled={!selectedDocument || !newDocFile}
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Document to List
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Additional Information</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                {Object.keys(editFormData.custom_data || {}).length === 0 && (
                                    <p className="text-sm text-muted-foreground italic">No additional information added.</p>
                                )}
                                {Object.entries(editFormData.custom_data || {}).map(([key, value]) => (
                                    <div key={key} className="flex items-end gap-2">
                                        <FormInputGroup
                                            label={key}
                                            name={key}
                                            value={value}
                                            onChange={(e) => handleCustomFieldChange(key, e.target.value)}
                                            className="flex-1"
                                        />
                                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveCustomField(key)} title={`Remove ${key}`}>
                                            <Trash2 className="w-4 h-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}

                                <div className="mt-4 p-4 bg-muted rounded-lg border">
                                    <h5 className="text-sm font-semibold mb-2">Add New Field</h5>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        {/* 🚀 This now uses the fetched 'availableCustomFields' state */}
                                        <SearchableSelect
                                            options={availableCustomFields.map(f => ({ label: f.label, value: f.label }))}
                                            value={selectedCustomField ? selectedCustomField.label : null}
                                            onChange={(val) => setSelectedCustomField(val ? { label: val, type: '' } : null)}
                                            placeholder="Search field to add"
                                        />
                                        <Button
                                            type="button"
                                            onClick={handleAddCustomFieldToEdit}
                                            disabled={!selectedCustomField}
                                            className="w-full sm:w-auto"
                                            size="sm"
                                        >
                                            <Plus size={16} className="mr-2" />
                                            Add Field
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex flex-col sm:flex-row justify-between items-center pt-6 gap-4 border-t mt-6">
                        <Button type="button" variant="ghost" size="sm" onClick={() => setActiveEditTab("application")} className="w-full sm:w-auto order-2 sm:order-1">
                           <ChevronLeft className="h-4 w-4 mr-1" /> Back
                        </Button>
                        <div className="flex gap-2 w-full sm:w-auto order-1 sm:order-2">
                             <Button type="submit" size="sm" disabled={isSubmitting} className="flex-1 sm:flex-none">
                                <Save className="h-3 w-3 mr-2" /> Finish & Save
                            </Button>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Form Actions */}
            <div className="flex justify-end pt-6 mt-6 border-t gap-2">
                <Button type="button" variant="outline" onClick={() => setMode('view')} disabled={isSubmitting}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Changes
                </Button>
            </div>
        </form>
    )

    // --- Main Page Structure ---

    if (!studentId) { // 🚀 Updated check
        return (
            <div className="p-8 space-y-4">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Invalid URL</AlertTitle>
                    <AlertDescription>The URL is missing a 'student_id'. Please return to the <Link href="/management/students" className="font-semibold underline">Student List</Link>.</AlertDescription>
                </Alert>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[500px]">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="ml-3 text-lg">Loading student's active enrollment...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-8 space-y-4">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error Loading Data</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
                <Button onClick={() => router.push('/management/students')}>
                    Go Back to List
                </Button>
            </div>
        )
    }

    if (!studentData) {
        return (
            <div className="p-8">
                <Alert variant="default">
                    <AlertTitle>Not Found</AlertTitle>
                    <AlertDescription>No student details could be loaded for the provided ID.</AlertDescription>
                </Alert>
            </div>
        )
    }

    const student_status_badges = (
        <div className="flex flex-wrap gap-2 mt-2">
            {studentData.is_locked && (
                <Badge variant="destructive">
                    <Lock className="h-3 w-3 mr-1" /> Profile Locked
                </Badge>
            )}
            <Badge variant={studentData.is_verifiedby_admin ? "default" : "secondary"} className="border">
                {studentData.is_verifiedby_admin ? <ShieldCheck className="h-3 w-3 mr-1" /> : <ShieldAlert className="h-3 w-3 mr-1" />}
                Admin: {studentData.is_verifiedby_admin ? "Verified" : "Pending"}
            </Badge>
            <Badge variant={studentData.is_verifiedby_examcell ? "secondary" : "secondary"} className="border">
                {studentData.is_verifiedby_examcell ? <CheckSquare className="h-3 w-3 mr-1" /> : <ShieldAlert className="h-3 w-3 mr-1" />}
                Exam Cell: {studentData.is_verifiedby_examcell ? "Approved" : "Pending"}
            </Badge>
        </div>
    );

    return (
        <div className="p-4 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-4">
                <div className="w-full sm:w-auto">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                        {studentData.fullname || 'Student'}
                    </h1>
                    <p className="text-base md:text-lg text-muted-foreground">
                        Roll No: **{studentData['rollNumber']}** | ID: {studentData.id}
                    </p>
                    {student_status_badges}
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <Button variant="outline" size="sm" onClick={() => router.push('/management/students')} className="flex-1 sm:flex-none">
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    
                    {/* 🚀 PDF Download Button 🚀 */}
                    {mode === 'view' && (
                        <Button variant="outline" size="sm" onClick={prepareAndDownloadPDF} disabled={isGeneratingPDF} className="flex-1 sm:flex-none">
                            {isGeneratingPDF ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Download className="h-4 w-4 mr-2" />
                            )}
                            PDF
                        </Button>
                    )}

                    {mode === 'view' ? (
                        <Button 
                            size="sm"
                            onClick={() => setMode('edit')}
                            disabled={studentData.is_locked}
                            title={studentData.is_locked ? "Profile is locked by admin" : ""}
                            className="flex-1 sm:flex-none"
                        >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                        </Button>
                    ) : (
                        <Button variant="secondary" size="sm" onClick={() => setMode('view')} className="flex-1 sm:flex-none">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                        </Button>
                    )}
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <Card className="p-6">
                {mode === 'view' ? renderViewContent(studentData) : renderEditForm()}
            </Card>

            <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
                <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-4 sm:p-6 gap-4">
                    <DialogHeader className="flex-shrink-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <DialogTitle className="text-xl">{viewingDoc?.doc.name}</DialogTitle>
                                <p className="text-xs text-muted-foreground truncate max-w-[300px] sm:max-w-md">
                                    {viewingDoc?.doc.fileName || viewingDoc?.doc.path.split('/').pop()}
                                </p>
                            </div>
                            {viewingDoc && (
                                <Button 
                                    variant="secondary" 
                                    size="sm" 
                                    onClick={() => window.open(viewingDoc.publicUrl, '_blank')}
                                    className="w-full sm:w-auto"
                                >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Open Full View
                                </Button>
                            )}
                        </div>
                    </DialogHeader>
                    <div className="flex-1 min-h-0 w-full rounded-xl bg-secondary/30 overflow-hidden relative border shadow-inner">
                        {viewingDoc && (viewingDoc.doc.fileType?.startsWith("image/") || viewingDoc.doc.path.match(/\.(jpg|jpeg|png|gif|webp)$/i)) ? (
                            <img
                                src={viewingDoc.publicUrl}
                                alt={viewingDoc.doc.name}
                                className="h-full w-full object-contain p-2"
                            />
                        ) : viewingDoc ? (
                            <iframe
                                src={`${viewingDoc.publicUrl}#toolbar=1&navpanes=0`}
                                title={viewingDoc.doc.name}
                                className="h-full w-full bg-white"
                                frameBorder="0"
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                <p className="text-sm">Loading document...</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

// -------------------------------------------------------------------
// 🎯 FINAL EXPORT WRAPPER 🎯
// Fixes the 'useSearchParams' error by adding a Suspense boundary.
// -------------------------------------------------------------------

const StudentDetailLoading = () => (
    <div className="p-8 flex items-center justify-center min-h-[500px]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-3 text-lg">Loading...</p>
    </div>
);

export default function StudentDetailPage() {
    return (
        <Suspense fallback={<StudentDetailLoading />}>
            <StudentDetailContent />
        </Suspense>
    )
}