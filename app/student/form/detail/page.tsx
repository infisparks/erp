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
    id: string // This is students.id
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
    admission_category: string | null
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
    quota_selection: string | null
    discipline: string | null
    branch_preferences: string | null
    how_did_you_know: string | null
    form_no: string | null
    registration_no: string | null
    merit_no: string | null
    roll_number: string;

    // From student_semesters
    enrollment_id: string // student_semesters.id
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
        total_fee: number | null;
        net_payable_fee: number | null;
    } | null;

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
        return supabase.storage.from('student_documents').getPublicUrl(src).data.publicUrl;
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
                    academicYearData, // This is from 'academic_years'
                    semesterData
                ] = await Promise.all([
                    supabase.from("form_config").select("data_jsonb").eq("data_name", "custom_field_options").single(),
                    supabase.from("form_config").select("data_jsonb").eq("data_name", "document_options").single(),
                    supabase.from("courses").select("id, name"), 
                    supabase.from("academic_years").select("id, name, course_id"), 
                    supabase.from("semesters").select("id, name, academic_year_id") 
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

                // 2. Fetch Student Data
                const { data: studentD, error: studentError } = await supabase
                    .from("students")
                    .select("*")
                    .eq("id", studentId)
                    .single()
                if (studentError) throw new Error(`Failed to fetch student: ${studentError.message}`);

                // 3. Fetch Active Academic Year
                const { data: activeAY, error: ayError } = await supabase
                    .from("student_academic_years")
                    .select("*")
                    .eq("student_id", studentId)
                    .eq("status", "Active") // Find the active year
                    .single();
                
                if (ayError || !activeAY) throw new Error("Could not find an active academic year for this student.");

                // 4. Fetch Active Semester
                const { data: activeSem, error: semError } = await supabase
                    .from("student_semesters")
                    .select("*")
                    .eq("student_id", studentId)
                    .eq("student_academic_year_id", activeAY.id) // Match the active year
                    .eq("status", "active") // Find the active semester
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (semError || !activeSem) throw new Error("Could not find an active semester for this student's active year.");

                // --- Find matching Academic Year UUID ---
                const matchingAcademicYear = fetchedAcademicYears.find(
                    ay => ay.course_id === activeAY.course_id &&
                          ay.name === activeAY.academic_year_name
                );
                
                const academicYearUUID = matchingAcademicYear?.id || null;

                // 5. Merge and Set State
                const mergedData = {
                    ...studentD,
                    ...activeSem, // Contains semester_id, status, promotion_status
                    id: studentD.id, // Ensure student ID is primary
                    enrollment_id: activeSem.id, // This is the active enrollment
                    "rollNumber": studentD.roll_number,
                    
                    // This is the 'academic_years.id' (UUID) for the dropdown
                    student_academic_year_id: academicYearUUID, 
                    
                    // This data is just for reference/display
                    academic_year_data: {
                        id: activeAY.id.toString(), // The 'student_academic_years.id' (bigint)
                        name: activeAY.academic_year_name,
                        course_id: activeAY.course_id, // The course_id (uuid)
                        session: activeAY.academic_year_session,
                        total_fee: activeAY.total_fee,
                        net_payable_fee: activeAY.net_payable_fee,
                    },
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
    }, [studentId, supabase]) // 🚀 Removed enrollmentId and academicYearId


    // --- Document Viewer Handler ---
    const handleViewDocument = (doc: StudentDocument) => {
        const { data: { publicUrl } } = supabase
            .storage
            .from('student_documents')
            .getPublicUrl(doc.path);
        
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
                // All fields from 'students' table
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
                admission_year: editFormData.admission_year,
                admission_category: editFormData.admission_category,
                admission_type: editFormData.admission_type,
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
                category_type: editFormData.category_type,
                aadhar_card_number: editFormData.aadhar_card_number,
                pan_no: editFormData.pan_no,
                student_mobile_no: editFormData.student_mobile_no,
                father_mobile_no: editFormData.father_mobile_no,
                mother_mobile_no: editFormData.mother_mobile_no,
                photo_path: editFormData.photo_path,
                quota_selection: editFormData.quota_selection,
                discipline: editFormData.discipline,
                branch_preferences: editFormData.branch_preferences,
                how_did_you_know: editFormData.how_did_you_know,
                form_no: editFormData.form_no,
                registration_no: editFormData.registration_no,
                merit_no: editFormData.merit_no,
                roll_number: editFormData["rollNumber"],
            };
            
            // Only 'status' is editable for the semester
            const semesterUpdateData = {
                status: editFormData.status,
                // Pass back the other fields as they were (since they are disabled)
                promotion_status: editFormData.promotion_status, 
                semester_id: editFormData.semester_id,
                student_academic_year_id: currentStudentAcademicYearId, 
            };

            // 3. Database Transactions
            const { error: studentUpdateError } = await supabase
                .from("students")
                .update(studentUpdateData)
                .eq("id", currentStudentId);

            if (studentUpdateError) throw new Error(`Student update failed: ${studentUpdateError.message}`);

            // No need to update student_academic_years, as it's all disabled
            
            const { error: semesterUpdateError } = await supabase
                .from("student_semesters")
                .update(semesterUpdateData)
                .eq("id", currentEnrollmentId); // Update the specific active semester

            if (semesterUpdateError) throw new Error(`Enrollment update failed: ${semesterUpdateError.message}`);

            // 4. Update UI
            const updatedStudentData = {
                ...studentData, // Start with the original loaded data
                ...studentUpdateData, // Overlay student table changes
                ...semesterUpdateData, // Overlay semester table changes
            } as StudentDetail;


            setFilesToAdd([])
            setFilesToRemove([])
            setNewDocFile(null)
            setStudentData(updatedStudentData) // Update view state
            setMode('view') // Switch back to view mode

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
                const { data: blob, error } = await supabase.storage
                    .from('student_documents')
                    .download(studentData.photo_path);
                
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
            ["Domicile", student.domicile_of_maharashtra],
            ["PHD/Handicap", student.phd_handicap],
        ]);

        // --- 7. Family Details ---
        addSection("Family Details", [
            ["Father's Name", student.father_name],
            ["Father's Mobile", student.father_mobile_no],
            ["Father's Occupation", student.father_occupation],
            ["Father's Income", student.father_annual_income],
            ["Mother's Name", student.mother_name],
            ["Mother's Mobile", student.mother_mobile_no],
            ["Mother's Occupation", student.mother_occupation],
            ["Mother's Income", student.mother_annual_income],
        ]);
        
        // --- 8. Address Details ---
        addSection("Address Details", [
            ["Address", student.address],
            ["City", student.city],
            ["State", student.state],
            ["ZIP Code", student.zipcode],
        ]);

        // --- 9. Application & Category Details ---
        addSection("Application & Category Details", [
            ["Form No.", student.form_no],
            ["Registration No.", student.registration_no],
            ["Merit No.", student.merit_no],
            ["Admission Year", student.admission_year],
            ["Admission Type", student.admission_type],
            ["Admission Category", student.admission_category],
            ["Category Type", student.category_type],
            ["Quota Selection", student.quota_selection],
        ]);

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
        const courseName = allCourses.find(c => c.id === student.academic_year_data?.course_id)?.name || "N/A";
        const academicYearName = allAcademicYears.find(ay => ay.id === student.student_academic_year_id)?.name || "N/A";
        const semesterName = allSemesters.find(s => s.id === student.semester_id)?.name || "N/A";

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
                        <AccordionContent className="pt-4 space-y-4">
                            <DetailItem label="Address Line" value={student.address} />
                            <DetailItem label="City" value={student.city} />
                            <DetailItem label="State" value={student.state} />
                            <DetailItem label="ZIP Code" value={student.zipcode} />
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-5">
                        <AccordionTrigger className="text-lg font-semibold">Application & Category Details</AccordionTrigger>
                        <AccordionContent className="pt-4 space-y-4">
                            <DetailItem label="Form No." value={student.form_no} />
                            <DetailItem label="Registration No." value={student.registration_no} />
                            <DetailItem label="Merit No." value={student.merit_no} />
                            <DetailItem label="Admission Year" value={student.admission_year} />
                            <DetailItem label="Admission Type" value={student.admission_type} />
                            <DetailItem label="Admission Category" value={student.admission_category} />
                            <DetailItem label="Category Type" value={student.category_type} />
                            <DetailItem label="Quota Selection" value={student.quota_selection} />
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
                                {student.documents.map((doc) => (
                                    <button
                                        key={doc.path}
                                        onClick={() => handleViewDocument(doc)}
                                        className="flex w-full items-center justify-between p-3 bg-secondary rounded-md border hover:bg-muted group text-left"
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <File className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                            <div className="overflow-hidden">
                                                <p className="text-sm font-medium group-hover:underline truncate">{doc.name}</p>
                                                <p className="text-xs text-muted-foreground truncate">{doc.fileName}</p>
                                            </div>
                                        </div>
                                        <Eye className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                                    </button>
                                ))}
                            </AccordionContent>
                        </AccordionItem>
                    )}

                </Accordion>
            </div>
        )
    }

    const renderEditForm = () => (
        <form onSubmit={handleEditSubmit}>
            <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="personal">Personal</TabsTrigger>
                    <TabsTrigger value="admission">Enrollment</TabsTrigger>
                    <TabsTrigger value="application">Application</TabsTrigger>
                    <TabsTrigger value="docs">Docs & Custom</TabsTrigger>
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
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormInputGroup label="Primary Phone" name="phone" type="tel" value={editFormData.phone || ""} onChange={handleEditChange} required />
                                <FormInputGroup label="Student Mobile" name="student_mobile_no" type="tel" value={editFormData.student_mobile_no || ""} onChange={handleEditChange} />
                                <FormInputGroup label="Secondary Phone" name="secondary_phone" type="tel" value={editFormData.secondary_phone || ""} onChange={handleEditChange} />
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
                            </div>
                            <Separator />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormInputGroup label="Mother's Name" name="mother_name" value={editFormData.mother_name || ""} onChange={handleEditChange} />
                                <FormInputGroup label="Mother's Occupation" name="mother_occupation" value={editFormData.mother_occupation || ""} onChange={handleEditChange} />
                                <FormInputGroup label="Mother's Annual Income" name="mother_annual_income" value={editFormData.mother_annual_income || ""} onChange={handleEditChange} />
                                <FormInputGroup label="Mother's Mobile" name="mother_mobile_no" type="tel" value={editFormData.mother_mobile_no || ""} onChange={handleEditChange} />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Enrollment & Address Tab */}
                <TabsContent value="admission" className="space-y-6 pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Enrollment Details</CardTitle>
                            <CardDescription>
                                Only the 'Enrollment Status' is editable. Other fields are locked to this active enrollment.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormSearchableSelectGroup
                                    label="Course"
                                    value={editFormData.academic_year_data?.course_id ?? null}
                                    onChange={(val) => handleEditSearchableSelectChange("course_id", val)}
                                    options={allCourseOptions}
                                    placeholder="Select course"
                                    required
                                    disabled={true} 
                                />
                                <FormSearchableSelectGroup
                                    label="Academic Year"
                                    value={editFormData.student_academic_year_id ?? null}
                                    onChange={(val) => handleEditSearchableSelectChange("student_academic_year_id", val)}
                                    options={editModalAcademicYearOptions}
                                    placeholder="Select academic year"
                                    disabled={true}
                                    required
                                />
                                <FormSearchableSelectGroup
                                    label="Semester"
                                    value={editFormData.semester_id ?? null}
                                    onChange={(val) => handleEditSearchableSelectChange("semester_id", val)}
                                    options={editModalSemesterOptions}
                                    placeholder="Select semester"
                                    disabled={true}
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
                                    disabled={true} 
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormInputGroup label="Admission Year (Session Start)" name="admission_year" value={editFormData.admission_year || ""} onChange={handleEditChange} />
                                <FormInputGroup label="Academic Year Session" name="session" value={editFormData.academic_year_data?.session || ""} onChange={() => { }} disabled />
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
                            </div>
                        </CardContent>
                    </Card>
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
                                <FormInputGroup label="Quota Selection" name="quota_selection" value={editFormData.quota_selection || ""} onChange={handleEditChange} />
                                <FormInputGroup label="Admission Type" name="admission_type" value={editFormData.admission_type || ""} onChange={handleEditChange} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Category Details</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormInputGroup label="Admission Category" name="admission_category" value={editFormData.admission_category || ""} onChange={handleEditChange} />
                                <FormInputGroup label="Category Type" name="category_type" value={editFormData.category_type || ""} onChange={handleEditChange} />
                            </div>
                        </CardContent>
                    </Card>
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

                                {(editFormData.documents || []).map((doc) => (
                                    <div key={doc.path} className="flex items-center justify-between p-2 bg-secondary rounded-md border">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <File className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                            <span className="text-sm font-medium truncate">{doc.name}</span>
                                            <span className="text-xs text-muted-foreground truncate">({doc.fileName})</span>
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => stageFileForRemoval(doc)} title="Remove this document">
                                            <Trash2 className="w-4 h-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}

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
                    <AlertDescription>The URL is missing a 'student_id'. Please return to the <Link href="/student" className="font-semibold underline">Student List</Link>.</AlertDescription>
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
                <Button onClick={() => router.push('/student')}>
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

    return (
        <div className="p-4 md:p-8 space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {studentData.fullname || 'Student'}
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        Roll No: **{studentData['rollNumber']}** | ID: {studentData.id}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push('/student')}>
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Back to List
                    </Button>
                    
                    {/* 🚀 PDF Download Button 🚀 */}
                    {mode === 'view' && (
                        <Button variant="outline" onClick={prepareAndDownloadPDF} disabled={isGeneratingPDF}>
                            {isGeneratingPDF ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Download className="h-4 w-4 mr-2" />
                            )}
                            Download PDF
                        </Button>
                    )}

                    {mode === 'view' ? (
                        <Button onClick={() => setMode('edit')}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Enrollment
                        </Button>
                    ) : (
                        <Button variant="secondary" onClick={() => setMode('view')}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Mode
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

            {/* Document Viewer Dialog */}
            <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
                <DialogContent className="max-w-4xl h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>{viewingDoc?.doc.name}</DialogTitle>
                        <p className="text-sm text-muted-foreground">{viewingDoc?.doc.fileName}</p>
                    </DialogHeader>
                    <div className="h-full w-full rounded-md bg-muted overflow-hidden">
                        {viewingDoc && viewingDoc.doc.fileType?.startsWith("image/") ? (
                            <img
                                src={viewingDoc.publicUrl}
                                alt={viewingDoc.doc.name}
                                className="h-full w-full object-contain"
                            />
                        ) : viewingDoc ? (
                            <iframe
                                src={viewingDoc.publicUrl}
                                title={viewingDoc.doc.name}
                                className="h-full w-full"
                                frameBorder="0"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="h-8 w-8 animate-spin" />
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