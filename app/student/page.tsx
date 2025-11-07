"use client"

import React, { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"
import { SupabaseClient } from "@supabase/supabase-js"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  ColumnFiltersState,
  SortingState,
  getSortedRowModel,
} from "@tanstack/react-table"
import { format, parseISO } from "date-fns" // For date formatting

// --- ShadCN UI Components ---
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils" // Assumes you have this from shadcn install

// --- Icons ---
import {
  Plus,
  Search,
  Eye,
  Edit,
  AlertTriangle,
  UserRound,
  Loader2,
  Save,
  X,
  File,
  Trash2,
  Download,
  Upload,
  Filter,
  XCircle,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Check,
  CalendarIcon,
  ArrowUpDown,
  Image as ImageIcon,
} from "lucide-react"

// --- Type Definitions ---

// --- UPDATED: For the main list, based on student_semesters ---
interface StudentList {
  enrollment_id: string;      // student_semesters.id
  student_id: string;         // students.id
  academic_year_id: string; // student_academic_years.id
  fullname: string | null;
  email: string | null;
  phone: string | null;
  roll_number: string;        // --- From students table ---
  status: string;             // --- From student_semesters table ---
  promotion_status: string;   // --- From student_semesters table ---
  created_at: string;         // from student_semesters
  photo_path: string | null;
  course_name: string;
  semester_name: string;
  academic_year_name: string;
  academic_year_session: string;
}

// For the modal details & edit form
interface StudentDetail {
  // From students
  id: string // This is students.id
  user_id: string
  created_at: string // from students
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
  roll_number: string | null; // --- NEW: From students table ---
  
  // From student_semesters
  enrollment_id: string // student_semesters.id
  "rollNumber": string // This maps to students.roll_number
  status: string // from student_semesters
  promotion_status: string
  semester_id: string | null
  student_academic_year_id: string | null
  
  // From student_academic_years (nested for editing)
  academic_year_data: {
    id: string;
    name: string;
    course_id: string;
    session: string;
    total_fee: number | null;
    net_payable_fee: number | null;
  } | null;
  
  [key: string]: any // To allow for dynamic properties
}

interface StudentDocument {
  name: string;
  path: string;
  fileName: string;
  fileType: string;
}

interface FileToAdd {
  id: string;
  name: string;
  file: File;
}

// For form config options
interface FieldOption { label: string; type: string; }
interface DocOption { name: string; description: string; }

// For filters
interface Stream { id: string; name: string; }
interface Course { id: string; name: string; stream_id: string; }
interface AcademicYear { id: string; name: string; course_id: string; } 
interface Semester { id: string; name: string; academic_year_id: string; } 

// For Combobox props
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

/**
 * Professional Searchable Select (Combobox)
 */
const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
}) => {
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
                    className={`mr-2 h-4 w-4 ${
                      value === option.value ? "opacity-100" : "opacity-0"
                    }`}
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

/**
 * Helper for View-Mode Details
 */
const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div>
    <p className="text-sm font-medium text-muted-foreground">{label}</p>
    <p className="text-base break-words">{value || "N/A"}</p>
  </div>
)

/**
 * Helper for Downloadable Document Link
 */
const DocumentLinkItem: React.FC<{ doc: StudentDocument, supabase: SupabaseClient }> = ({ doc, supabase }) => {
  const { data: { publicUrl } } = supabase
    .storage
    .from('student_documents')
    .getPublicUrl(doc.path)

  return (
     <a
      href={publicUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between p-3 bg-secondary rounded-md border hover:bg-muted group"
    >
      <div className="flex items-center gap-3">
        <File className="w-5 h-5 text-blue-500" />
        <div>
          <p className="text-sm font-medium group-hover:underline">{doc.name}</p>
          <p className="text-xs text-muted-foreground">{doc.fileName}</p>
        </div>
      </div>
      <Download className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
    </a>
  )
}

/**
 * 🌟 NEW: Document Image Viewer Component 🌟
 */
const DocumentViewer: React.FC<{ documents: StudentDocument[], supabase: SupabaseClient }> = ({ documents, supabase }) => {
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  // Filter for images and generate public URLs
  const imageDocs = useMemo(() => {
    return documents
      .filter(doc => doc.fileType && doc.fileType.startsWith("image/"))
      .map(doc => ({
        ...doc,
        publicUrl: supabase.storage.from('student_documents').getPublicUrl(doc.path).data.publicUrl
      }))
  }, [documents, supabase])

  if (imageDocs.length === 0) {
    return null // Don't render anything if no images
  }

  const currentImage = imageDocs[currentIndex]

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % imageDocs.length)
  }

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + imageDocs.length) % imageDocs.length)
  }

  return (
    <>
      <Button variant="outline" onClick={() => setIsViewerOpen(true)} className="mb-4 w-full">
        <ImageIcon className="mr-2 h-4 w-4" />
        View All Images ({imageDocs.length})
      </Button>

      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Image Viewer</DialogTitle>
            <DialogDescription>
              {currentImage.name} ({currentImage.fileName})
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-center items-center p-4 bg-muted rounded-md min-h-[400px]">
            {currentImage ? (
              <img 
                src={currentImage.publicUrl} 
                alt={currentImage.name} 
                className="max-h-[500px] max-w-full object-contain"
              />
            ) : (
              <p>Error loading image.</p>
            )}
          </div>

          <DialogFooter className="flex-row justify-between items-center">
            <Button variant="outline" onClick={handlePrev}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Image {currentIndex + 1} of {imageDocs.length}
            </span>
            <Button variant="outline" onClick={handleNext}>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}


/**
 * Helper for Form Input Group in Edit Mode
 */
const FormInputGroup: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, name, ...props }) => (
  <div className="space-y-2">
    <Label htmlFor={name} className="font-medium">{label}{props.required && '*'}</Label>
    <Input id={name} name={name} {...props} />
  </div>
)

/**
 * Helper for Form Select Group in Edit Mode
 */
const FormSelectGroup: React.FC<{
  label: string;
  name: string;
  value: string | null | undefined;
  onValueChange: (value: string) => void;
  options: { label: string; value: string; }[];
  placeholder: string;
  required?: boolean;
}> = ({ label, name, value, onValueChange, options, placeholder, required = false }) => (
  <div className="space-y-2">
    <Label htmlFor={name} className="font-medium">{label}{required && '*'}</Label>
    <Select value={value || ""} onValueChange={onValueChange}>
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

/**
 * Helper for Form Searchable Select Group in Edit Mode
 */
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

/**
 * Helper for Form Date Picker Group in Edit Mode
 */
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


/**
 * Helper for Rounded Square Avatar
 */
const StudentAvatar: React.FC<{ src: string | null, alt: string | null }> = ({ src, alt }) => {
  // This is a duplicate definition, but we'll keep it for this file context
  // In a real app, this would be in a shared file
  const supabase = getSupabaseClient()
  const publicUrl = useMemo(() => {
    if (!src) return null;
    return supabase.storage.from('student_documents').getPublicUrl(src).data.publicUrl;
  }, [src, supabase]);

  return (
    <Avatar className="h-10 w-10 rounded-md">
      <AvatarImage 
        src={publicUrl || undefined} 
        alt={alt || "Student Photo"} 
        className="rounded-md object-cover"
      />
      <AvatarFallback className="rounded-md bg-muted">
        <UserRound className="h-5 w-5 text-muted-foreground" />
      </AvatarFallback>
    </Avatar>
  )
}
// -------------------------------------------------------------------
// 🎓 Main Student List Page Component 🎓
// -------------------------------------------------------------------

export default function StudentListPage() {
  const supabase = getSupabaseClient()

  // --- Page State ---
  const [students, setStudents] = useState<StudentList[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // --- Table State ---
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [sorting, setSorting] = useState<SortingState>([
    { id: "fullname", desc: false },
  ])

  // --- Modal State ---
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // --- Data State ---
  const [selectedStudent, setSelectedStudent] = useState<StudentDetail | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<StudentDetail>>({})
  const [editFormDateOfBirth, setEditFormDateOfBirth] = useState<Date | undefined>()
  
  // --- Document Management State ---
  const [filesToAdd, setFilesToAdd] = useState<FileToAdd[]>([]);
  const [filesToRemove, setFilesToRemove] = useState<StudentDocument[]>([]);
  const [newDocFile, setNewDocFile] = useState<File | null>(null);

  // --- AutoComplete & Form Config State ---
  const [availableCustomFields, setAvailableCustomFields] = useState<FieldOption[]>([])
  const [availableDocuments, setAvailableDocuments] = useState<DocOption[]>([])
  
  const [selectedCustomField, setSelectedCustomField] = useState<FieldOption | null>(null)
  const [selectedDocument, setSelectedDocument] = useState<DocOption | null>(null)

  // --- Filter States ---
  const [selectedStream, setSelectedStream] = useState<string | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string | null>(null); // --- NEW ---
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null)

  const [allStreams, setAllStreams] = useState<Stream[]>([])
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [allAcademicYears, setAllAcademicYears] = useState<AcademicYear[]>([]) // NEW
  const [allSemesters, setAllSemesters] = useState<Semester[]>([]) // UPDATED
  
  const [loadingFilters, setLoadingFilters] = useState(true)

  // --- Memoized Filter Options ---
  const streamOptions = useMemo(() => {
    return allStreams.map(s => ({ label: s.name, value: s.id }))
  }, [allStreams])

  const courseOptions = useMemo(() => {
    if (!selectedStream) return []
    return allCourses
      .filter(c => c.stream_id === selectedStream)
      .map(c => ({ label: c.name, value: c.id }))
  }, [allCourses, selectedStream])

  // --- NEW: Academic Year & Semester Filter Options ---
  const academicYearOptions = useMemo(() => {
    if (!selectedCourse) return [];
    return allAcademicYears
      .filter(ay => ay.course_id === selectedCourse)
      .map(ay => ({ label: ay.name, value: ay.id }));
  }, [allAcademicYears, selectedCourse]);

  const semesterOptions = useMemo(() => {
    if (!selectedAcademicYear) return [];
    return allSemesters
      .filter(s => s.academic_year_id === selectedAcademicYear)
      .map(s => ({ label: s.name, value: s.id }));
  }, [allSemesters, selectedAcademicYear]);

  
  // --- Options for Edit Modal ---
  const allCourseOptions = useMemo(() => {
    return allCourses.map(c => ({ label: c.name, value: c.id }))
  }, [allCourses])

  const allSemesterOptions = useMemo(() => {
     return allSemesters.map(s => ({ label: s.name, value: s.id }))
  }, [allSemesters])
  
  // --- NEW: Memoized Options for Edit Modal Cascade ---
  const editModalAcademicYearOptions = useMemo(() => {
    const courseId = editFormData.academic_year_data?.course_id;
    if (!courseId) return [];
    return allAcademicYears
      .filter(ay => ay.course_id === courseId)
      .map(ay => ({ label: ay.name, value: ay.id }));
  }, [allAcademicYears, editFormData.academic_year_data?.course_id]);

  const editModalSemesterOptions = useMemo(() => {
    const ayId = editFormData.student_academic_year_id;
    if (!ayId) return [];
    return allSemesters
      .filter(s => s.academic_year_id === ayId)
      .map(s => ({ label: s.name, value: s.id }));
  }, [allSemesters, editFormData.student_academic_year_id]);


  // --- Data Fetching (Students) ---
  useEffect(() => {
    fetchStudents()
  }, []) // Load all active students on mount
  
  // --- Data Fetching (Form Config & Filters) ---
  useEffect(() => {
    const fetchAllConfig = async () => {
      setLoadingFilters(true)
      try {
        const [
          customData, 
          docData, 
          streamData, 
          courseData, 
          academicYearData, // NEW
          semesterData
        ] = await Promise.all([
          supabase.from("form_config").select("data_jsonb").eq("data_name", "custom_field_options").single(),
          supabase.from("form_config").select("data_jsonb").eq("data_name", "document_options").single(),
          supabase.from("streams").select("*"),
          supabase.from("courses").select("*"),
          supabase.from("academic_years").select("id, name, course_id"), // NEW
          supabase.from("semesters").select("id, name, academic_year_id") // UPDATED
        ])

        if (customData.data) setAvailableCustomFields(customData.data.data_jsonb as FieldOption[])
        if (docData.data) setAvailableDocuments(docData.data.data_jsonb as DocOption[])
        if (streamData.data) setAllStreams(streamData.data as Stream[])
        if (courseData.data) setAllCourses(courseData.data as Course[])
        if (academicYearData.data) setAllAcademicYears(academicYearData.data as AcademicYear[]) // NEW
        if (semesterData.data) setAllSemesters(semesterData.data as Semester[]) // UPDATED

        const errors = [customData.error, docData.error, streamData.error, courseData.error, academicYearData.error, semesterData.error].filter(Boolean)
        if (errors.length > 0) {
          throw new Error(errors.map(e => e.message).join(", "))
        }

      } catch (error: any) {
        console.error("Error fetching form/filter config:", error)
        setError("Failed to load form and filter configuration options.")
      } finally {
        setLoadingFilters(false)
      }
    }
    fetchAllConfig()
  }, [supabase])

  // --- UPDATED: Fetch from student_semesters and join all related data ---
  const fetchStudents = async () => {
    setLoading(true)
    setError(null)
    
    try {
      let query = supabase
        .from("student_semesters")
        .select(
          `
          id, 
          status,
          promotion_status,
          created_at,
          student_academic_year_id,
          student:students (
            id,
            fullname,
            email,
            phone,
            photo_path,
            roll_number
          ),
          semester:semesters ( name ),
          academic_year:student_academic_years (
            id,
            academic_year_name,
            academic_year_session,
            course:courses ( name )
          )
          `
        )
        .eq('status', 'active') // --- NEW: Only fetch ACTIVE students ---
        .order("created_at", { ascending: false })

      // --- NEW Filter Logic ---
      let ayFilterIds: string[] | null = null;

      if (selectedCourse) {
        // Find academic_year IDs for the selected course
        const { data: ayIds, error } = await supabase
          .from("student_academic_years")
          .select("id")
          .eq("course_id", selectedCourse);
        if (error) throw error;
        ayFilterIds = ayIds.map((ay: { id: any }) => ay.id);
      } else if (selectedStream) {
        // Find course IDs for the selected stream
        const { data: courseIdsData, error: cError } = await supabase
          .from("courses")
          .select("id")
          .eq("stream_id", selectedStream);
        if (cError) throw cError;
        const courseIds = courseIdsData.map((c: { id: any }) => c.id);

        if (courseIds.length > 0) {
          // Find academic_year IDs for those courses
          const { data: ayIds, error: ayError } = await supabase
            .from("student_academic_years")
            .select("id")
            .in("course_id", courseIds);
          if (ayError) throw ayError;
          ayFilterIds = ayIds.map((ay: { id: any }) => ay.id);
        } else {
          ayFilterIds = []; // No courses in stream, so no results
        }
      }

      // Apply the Academic Year filter (from Stream/Course)
      if (ayFilterIds !== null) {
        if (ayFilterIds.length === 0) {
          query = query.eq("student_academic_year_id", "00000000-0000-0000-0000-000000000000"); 
        } else {
          query = query.in("student_academic_year_id", ayFilterIds);
        }
      }
      
      // --- UPDATED: Apply new filters ---
      if (selectedAcademicYear) {
        query = query.eq("student_academic_year_id", selectedAcademicYear);
      }

      if (selectedSemester) {
        query = query.eq("semester_id", selectedSemester)
      }
      // --- End of New Filter Logic ---

      const { data, error } = await query

      if (error) throw error
      
      if (data) {
        // Flatten the data for the table
        const flattenedData: StudentList[] = data.map((item: any) => ({
          enrollment_id: item.id,
          student_id: item.student.id,
          academic_year_id: item.student_academic_year_id,
          fullname: item.student.fullname,
          email: item.student.email,
          phone: item.student.phone,
          roll_number: item.student.roll_number, // --- FIXED ---
          status: item.status,
          promotion_status: item.promotion_status, // --- NEW ---
          created_at: item.created_at,
          photo_path: item.student.photo_path,
          course_name: item.academic_year?.course?.name || "N/A",
          semester_name: item.semester?.name || "N/A",
          academic_year_name: item.academic_year?.academic_year_name || "N/A",
          academic_year_session: item.academic_year?.academic_year_session || "N/A",
        }));
        setStudents(flattenedData)
      }
    } catch (err: any) {
      console.error("Error fetching students:", err)
      setError(err.message || "An unknown error occurred while fetching students.")
    } finally {
      setLoading(false)
    }
  }
  
  // --- Filter Handlers ---
  const handleStreamChange = (value: string | null) => {
    setSelectedStream(value)
    setSelectedCourse(null)
    setSelectedAcademicYear(null) // --- NEW ---
    setSelectedSemester(null)
  }

  const handleCourseChange = (value: string | null) => {
    setSelectedCourse(value)
    setSelectedAcademicYear(null) // --- NEW ---
    setSelectedSemester(null)
  }

  // --- NEW ---
  const handleAcademicYearChange = (value: string | null) => {
    setSelectedAcademicYear(value)
    setSelectedSemester(null)
  }

  const handleSemesterChange = (value: string | null) => {
    setSelectedSemester(value)
  }

  const handleFilterSearch = () => {
    fetchStudents()
  }
  
  const handleFilterClear = () => {
    setSelectedStream(null)
    setSelectedCourse(null)
    setSelectedAcademicYear(null) // --- NEW ---
    setSelectedSemester(null)
    setGlobalFilter("")
    setStudents([])
    setTimeout(() => {
      fetchStudents() // This will fetch all active students
    }, 0)
  }

  // --- Modal Logic ---

  // --- UPDATED: Fetches from all 3 tables and merges ---
  const openViewModal = async (studentId: string, enrollmentId: string, academicYearId: string) => {
    setIsViewModalOpen(true)
    setModalLoading(true)
    setModalError(null)
    setSelectedStudent(null)

    try {
      // Fetch permanent student data
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("*")
        .eq("id", studentId)
        .single()
      if (studentError) throw studentError;

      // Fetch specific enrollment data
      const { data: semesterData, error: semesterError } = await supabase
        .from("student_semesters")
        .select("*") // This no longer has roll_number
        .eq("id", enrollmentId)
        .single()
      if (semesterError) throw semesterError;
        
      // Fetch academic year data
      const { data: academicYearData, error: ayError } = await supabase
        .from("student_academic_years")
        .select("id, name:academic_year_name, course_id, session:academic_year_session, total_fee, net_payable_fee")
        .eq("id", academicYearId)
        .single()
      if (ayError) throw ayError;

      // Merge them into one object for the modal
      const mergedData = {
        ...studentData,
        ...semesterData,
        id: studentData.id,
        enrollment_id: semesterData.id,
        "rollNumber": studentData.roll_number, // --- FIXED: Get from studentData ---
        academic_year_data: academicYearData,
      } as StudentDetail;
      
      setSelectedStudent(mergedData)
      
    } catch (err: any) {
      console.error("Error fetching student details:", err)
      setModalError(err.message || "Failed to load student details.")
    } finally {
      setModalLoading(false)
    }
  }

  // --- This function just sets up the form state from an existing object ---
  const setupEditModal = (student: StudentDetail) => {
    setEditFormData(student)
    // Set date picker state
    if (student.dateofbirth) {
      setEditFormDateOfBirth(parseISO(student.dateofbirth))
    } else {
      setEditFormDateOfBirth(undefined)
    }
    // Reset document management state
    setFilesToAdd([])
    setFilesToRemove([])
    setNewDocFile(null)
    setSelectedCustomField(null)
    setSelectedDocument(null)
    setModalError(null)
    
    setIsViewModalOpen(false) // Close view modal
    setIsEditModalOpen(true) // Open edit modal
  }

  // --- UPDATED: New function to handle direct edit click from the list ---
  const handleDirectEditClick = async (studentId: string, enrollmentId: string, academicYearId: string) => {
    setIsEditModalOpen(true)
    setModalLoading(true)
    setModalError(null)
    setEditFormData({})
    
    try {
      // Fetch permanent student data
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("*")
        .eq("id", studentId)
        .single()
      if (studentError) throw studentError;

      // Fetch specific enrollment data
      const { data: semesterData, error: semesterError } = await supabase
        .from("student_semesters")
        .select("*") // This no longer has roll_number
        .eq("id", enrollmentId)
        .single()
      if (semesterError) throw semesterError;

      // Fetch academic year data
      const { data: academicYearData, error: ayError } = await supabase
        .from("student_academic_years")
        .select("id, name:academic_year_name, course_id, session:academic_year_session, total_fee, net_payable_fee")
        .eq("id", academicYearId)
        .single()
      if (ayError) throw ayError;

      // Merge them
      const mergedData = {
        ...studentData,
        ...semesterData,
        id: studentData.id,
        enrollment_id: semesterData.id,
        "rollNumber": studentData.roll_number, // --- FIXED: Get from studentData ---
        academic_year_data: academicYearData,
      } as StudentDetail;
      
      // Use the setup function to populate the form
      setupEditModal(mergedData);
      
    } catch (err: any) {
        console.error("Error fetching details for edit:", err)
        setModalError(err.message || "Failed to load student details for editing.")
    } finally {
        setModalLoading(false)
    }
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
  
  // --- UPDATED: Handles the new 3-level cascade ---
  const handleEditSearchableSelectChange = (name: string, value: string | null) => {
      if (name === "course_id") {
        // Course changed: reset AY and Semester
        setEditFormData(prev => ({
          ...prev,
          academic_year_data: {
            ...(prev.academic_year_data || { id: "", name: "", course_id: "", session: "", total_fee: 0, net_payable_fee: 0 }),
            course_id: value || ""
          },
          student_academic_year_id: null,
          semester_id: null,
        }));
      } else if (name === "student_academic_year_id") {
        // AY changed: reset Semester
        setEditFormData(prev => ({
          ...prev,
          student_academic_year_id: value,
          semester_id: null,
        }));
      } else {
        // Semester or other changed
        setEditFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
  }

  // --- Custom Field Handlers (Edit Mode) (Unchanged) ---
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
        setModalError(`Field "${newLabel}" already exists.`);
        return;
      }
      
      handleCustomFieldChange(newLabel, "");
      setSelectedCustomField(null)
      setModalError(null)
    }
  }

  const handleRemoveCustomField = (key: string) => {
     setEditFormData(prev => {
       const newData = { ...(prev.custom_data || {}) };
       delete newData[key];
       return { ...prev, custom_data: newData };
     });
  }

  // --- Document Management Handlers (Edit Mode) (Unchanged) ---
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
      setModalError(null)
    } else {
      setModalError("Please select a document type and provide a file.")
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
  // --- UPDATED: Splits data and saves to *three* tables ---
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const studentId = editFormData.id;
    const enrollmentId = (editFormData as any).enrollment_id;
    const academicYearId = (editFormData as any).student_academic_year_id;
    
    if (!studentId || !enrollmentId || !academicYearId) {
      setModalError("Error: Student, Enrollment, or Academic Year ID is missing. Cannot save.");
      return;
    }

    setIsSubmitting(true)
    setModalError(null)
    
    const { user_id, "rollNumber": rollNumber } = editFormData
    const bucketName = 'student_documents'

    try {
      // --- 1. Document Management (Unchanged from original) ---
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
          // Use the roll number from the form for the path
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
      
      // --- 2. Data Splitting ---
      
      // Data for public.students table
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
        roll_number: editFormData["rollNumber"], // --- FIXED: Save roll_number to students table ---
      };
      
      // Data for public.student_academic_years table
      const academicYearUpdateData = {
        course_id: editFormData.academic_year_data?.course_id,
        // Add other AY fields here if you add them to the form
        // e.g., total_fee: editFormData.academic_year_data?.total_fee
      };

      // Data for public.student_semesters table
      const semesterUpdateData = {
        // --- FIXED: roll_number removed from this table ---
        status: editFormData.status,
        promotion_status: editFormData.promotion_status,
        semester_id: editFormData.semester_id,
        student_academic_year_id: editFormData.student_academic_year_id,
      };

      // --- 3. Database Transactions ---
      
      // Update students table
      const { error: studentUpdateError } = await supabase
        .from("students")
        .update(studentUpdateData)
        .eq("id", studentId);
        
      if (studentUpdateError) throw new Error(`Student update failed: ${studentUpdateError.message}`);

      // Update student_academic_years table
      const { error: ayUpdateError } = await supabase
        .from("student_academic_years")
        .update(academicYearUpdateData)
        .eq("id", academicYearId);

      if (ayUpdateError) throw new Error(`Academic Year update failed: ${ayUpdateError.message}`);

      // Update student_semesters table
      const { error: semesterUpdateError } = await supabase
        .from("student_semesters")
        .update(semesterUpdateData)
        .eq("id", enrollmentId);
        
      if (semesterUpdateError) throw new Error(`Enrollment update failed: ${semesterUpdateError.message}`);

      // --- 4. Refresh List ---
      setIsEditModalOpen(false)
      setEditFormData({})
      fetchStudents() // This will refetch the list with all new data.

    } catch (err: any) {
      console.error("Error updating student:", err)
      setModalError(err.message || "Failed to save changes.")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // --- Table Columns Definition ---
  // --- UPDATED: Columns reflect new StudentList data ---
  const columns: ColumnDef<StudentList>[] = [
    {
      accessorKey: "photo_path",
      header: "Photo",
      cell: ({ row }) => {
        const student = row.original
        return <StudentAvatar src={student.photo_path} alt={student.fullname} />
      },
    },
    {
      accessorKey: "fullname",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Full Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-medium">{row.getValue("fullname") || "N/A"}</div>,
    },
    {
      accessorKey: "roll_number", // --- FIXED: Now correctly read from student ---
      header: "Roll Number",
    },
    {
      accessorKey: "academic_year_name", // --- NEW: Current Year Column ---
      header: "Current Year",
      cell: ({ row }) => {
        const student = row.original;
        return (
          <div>
            <div className="font-medium">{student.academic_year_name}</div>
            <div className="text-xs text-muted-foreground">{student.academic_year_session}</div>
          </div>
        )
      },
    },
    {
      accessorKey: "semester_name", // --- NEW: Current Semester Column ---
      header: "Current Semester",
      cell: ({ row }) => <div className="text-sm">{row.getValue("semester_name")}</div>,
    },
    {
      accessorKey: "promotion_status", // --- NEW: Promotion Status Column ---
      header: "Promotion Status",
      cell: ({ row }) => {
        const status = row.getValue("promotion_status") as string;
        return (
          <Badge variant={status === 'Eligible' ? 'default' : 'secondary'} className="capitalize">
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: "status", // This is the semester status
      header: "Enrollment Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        const variant = (
          status === "approved" || status === "active" ? "default" :
          status === "rejected" || status === "inactive" ? "destructive" :
          "secondary"
        ) as "default" | "destructive" | "secondary"
        
        return (
          <Badge variant={variant} className="capitalize">
            {status}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const student = row.original
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => openViewModal(student.student_id, student.enrollment_id, student.academic_year_id)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDirectEditClick(student.student_id, student.enrollment_id, student.academic_year_id)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Enrollment
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete (Not Implemented)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  // --- Table Instance (Unchanged) ---
  const table = useReactTable({
    data: students,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  })

  // --- Modal Content Renderers ---
  
  // --- UPDATED: Uses `selectedStudent` which now contains merged data ---
  const renderViewContent = () => (
    <div className="space-y-6">
      {selectedStudent?.photo_path && (
        <div className="flex justify-center">
          <Avatar className="h-24 w-24 rounded-lg">
            <AvatarImage 
              src={supabase.storage.from('student_documents').getPublicUrl(selectedStudent.photo_path).data.publicUrl} 
              alt="Student Photo" 
              className="rounded-lg object-cover" 
            />
            <AvatarFallback className="rounded-lg bg-muted">
              <UserRound className="h-10 w-10 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
        </div>
      )}
      <section>
        <h4 className="text-lg font-semibold mb-3">Personal Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DetailItem label="Full Name" value={selectedStudent?.fullname} />
          {/* --- UPDATED: Reads `rollNumber` from the merged object --- */}
          <DetailItem label="Roll Number" value={selectedStudent?.['rollNumber']} />
          <DetailItem label="Email" value={selectedStudent?.email} />
          <DetailItem label="Phone" value={selectedStudent?.phone} />
          <DetailItem label="Date of Birth" value={selectedStudent?.dateofbirth ? format(parseISO(selectedStudent.dateofbirth), "PPP") : "N/A"} />
          {/* --- UPDATED: Reads `status` from the merged object --- */}
          <DetailItem label="Status" value={
            <Badge 
              variant={
                selectedStudent?.status === "approved" || selectedStudent?.status === "active" ? "default" :
                selectedStudent?.status === "rejected" || selectedStudent?.status === "inactive" ? "destructive" :
                "secondary"
              }
              className="capitalize"
            >
              {selectedStudent?.status}
            </Badge>
          }/>
          <DetailItem label="Address" value={`${selectedStudent?.address}, ${selectedStudent?.city}, ${selectedStudent?.state} - ${selectedStudent?.zipcode}`} />
          <DetailItem label="Secondary Phone" value={selectedStudent?.secondary_phone} />
        </div>
      </section>

      <Separator />

      {/* --- This section for custom_data remains correct --- */}
      {selectedStudent?.custom_data && Object.keys(selectedStudent.custom_data).length > 0 && (
        <section>
          <h4 className="text-lg font-semibold mb-3">Additional Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(selectedStudent.custom_data).map(([key, value]) => (
              <DetailItem key={key} label={key} value={value} />
            ))}
          </div>
        </section>
      )}

      {/* --- This section for documents remains correct --- */}
      {selectedStudent?.documents && selectedStudent.documents.length > 0 && (
        <section>
          <h4 className="text-lg font-semibold mb-3">Uploaded Documents</h4>
          <DocumentViewer documents={selectedStudent.documents} supabase={supabase} />
          <div className="space-y-2">
            {selectedStudent.documents
              .filter(doc => !doc.fileType || !doc.fileType.startsWith("image/")) // Only show non-images here
              .map((doc) => (
                <DocumentLinkItem key={doc.path} doc={doc} supabase={supabase} />
              ))}
          </div>
        </section>
      )}
    </div>
  )
  
  // --- UPDATED: This form now edits fields from all three tables ---
  const renderEditForm = () => (
    <form onSubmit={handleEditSubmit}>
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="admission">Admission</TabsTrigger>
          <TabsTrigger value="application">Application</TabsTrigger>
          <TabsTrigger value="docs">Docs</TabsTrigger>
        </TabsList>
        
        {/* Personal & Parent Tab (Fields from `students` table) */}
        <TabsContent value="personal" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Details</CardTitle>
            </CardHeader>
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
                {/* --- UPDATED: This field is now from `students` --- */}
                <FormInputGroup label="Roll Number" name="rollNumber" value={editFormData['rollNumber'] || ""} onChange={handleEditChange} required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <FormInputGroup label="Primary Phone" name="phone" type="tel" value={editFormData.phone || ""} onChange={handleEditChange} required />
                 <FormInputGroup label="Student Mobile" name="student_mobile_no" type="tel" value={editFormData.student_mobile_no || ""} onChange={handleEditChange} />
                 <FormInputGroup label="Secondary Phone" name="secondary_phone" type="tel" value={editFormData.secondary_phone || ""} onChange={handleEditChange} />
              </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInputGroup label="Nationality" name="nationality" value={editFormData.nationality || ""} onChange={handleEditChange} />
                <FormInputGroup label="Place of Birth" name="place_of_birth" value={editFormData.place_of_birth || ""} onChange={handleEditChange} />
                <FormInputGroup label="Religion" name="religion" value={editFormData.religion || ""} onChange={handleEditChange} />
                <FormInputGroup label="Caste" name="caste" value={editFormData.caste || ""} onChange={handleEditChange} />
                <FormInputGroup label="Blood Group" name="blood_group" value={editFormData.blood_group || ""} onChange={handleEditChange} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormInputGroup label="Aadhar Card Number" name="aadhar_card_number" value={editFormData.aadhar_card_number || ""} onChange={handleEditChange} />
                 <FormInputGroup label="PAN Number" name="pan_no" value={editFormData.pan_no || ""} onChange={handleEditChange} />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Parent / Guardian Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* ... All parent fields are from `students` table, this is correct ... */}
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
        
        {/* --- UPDATED: Admission & Address Tab --- */}
        <TabsContent value="admission" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Enrollment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* --- NEW: 3-Level Cascade --- */}
                <FormSearchableSelectGroup
                  label="Course"
                  value={editFormData.academic_year_data?.course_id ?? null}
                  onChange={(val) => handleEditSearchableSelectChange("course_id", val)}
                  options={allCourseOptions}
                  placeholder="Select course"
                  required
                />
                <FormSearchableSelectGroup
                  label="Academic Year"
                  value={editFormData.student_academic_year_id ?? null}
                  onChange={(val) => handleEditSearchableSelectChange("student_academic_year_id", val)}
                  options={editModalAcademicYearOptions}
                  placeholder="Select academic year"
                  disabled={!editFormData.academic_year_data?.course_id}
                  required
                />
                <FormSearchableSelectGroup
                  label="Semester"
                  value={editFormData.semester_id ?? null}
                  onChange={(val) => handleEditSearchableSelectChange("semester_id", val)}
                  options={editModalSemesterOptions} 
                  placeholder="Select semester"
                  disabled={!editFormData.student_academic_year_id}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* --- Fields from `student_semesters` --- */}
                <FormSelectGroup label="Enrollment Status" name="status" value={editFormData.status} onValueChange={(val: string) => handleEditSelectChange("status", val)} options={statusOptions} placeholder="Select status" required />
                <FormSelectGroup label="Promotion Status" name="promotion_status" value={editFormData.promotion_status} onValueChange={(val: string) => handleEditSelectChange("promotion_status", val)} options={promotionStatusOptions} placeholder="Select status" required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {/* --- Field from `students` --- */}
                 <FormInputGroup label="Admission Year" name="admission_year" value={editFormData.admission_year || ""} onChange={handleEditChange} />
                 {/* --- Field from `student_academic_years` (Read-only for now) --- */}
                 <FormInputGroup label="Academic Year Session" name="session" value={editFormData.academic_year_data?.session || ""} onChange={() => {}} disabled />
              </div>
            </CardContent>
          </Card>
          
          {/* --- Address fields are on `students` table, this is correct --- */}
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
        
        {/* Application & Category Tab (All fields from `students` table) */}
        <TabsContent value="application" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Original Application Details</CardTitle>
            </CardHeader>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInputGroup label="Discipline" name="discipline" value={editFormData.discipline || ""} onChange={handleEditChange} />
                <FormInputGroup label="Branch Preferences" name="branch_preferences" value={editFormData.branch_preferences || ""} onChange={handleEditChange} />
              </div>
              <FormInputGroup label="How did you know?" name="how_did_you_know" value={editFormData.how_did_you_know || ""} onChange={handleEditChange} />
            </CardContent>
          </Card>
          
           <Card>
            <CardHeader>
              <CardTitle>Category Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormInputGroup label="Admission Category" name="admission_category" value={editFormData.admission_category || ""} onChange={handleEditChange} />
                <FormInputGroup label="Category Type" name="category_type" value={editFormData.category_type || ""} onChange={handleEditChange} />
              </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormSelectGroup label="Domicile of Maharashtra" name="domicile_of_maharashtra" value={editFormData.domicile_of_maharashtra} onValueChange={(val: string) => handleEditSelectChange("domicile_of_maharashtra", val)} options={yesNoOptions} placeholder="Select Y/N" />
                <FormSelectGroup label="PH/Handicap" name="phd_handicap" value={editFormData.phd_handicap} onValueChange={(val: string) => handleEditSelectChange("phd_handicap", val)} options={yesNoOptions} placeholder="Select Y/N" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Documents & Custom Fields Tab (Fields from `students` table) */}
        <TabsContent value="docs" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Manage Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* ... Document management UI ... (Unchanged) */}
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
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* ... Custom fields UI ... (Unchanged) */}
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
      
      {/* Submission Buttons */}
      <DialogFooter className="pt-6 mt-6 border-t">
        <DialogClose asChild>
          <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </DialogFooter>
    </form>
  )
  
  // --- Main Page Render ---
  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* 1. Page Header (Unchanged) */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Student List
          </h1>
          <p className="text-lg text-muted-foreground">
            View, manage, and search all student enrollments.
          </p>
        </div>
        <Link href="/dashboard/students/new" passHref>
          <Button className="flex items-center gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Add New Student
          </Button>
        </Link>
      </div>

      {/* 2. Error Message (Unchanged) */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Fetching Data</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 3. Data Table Card */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Manage Student Enrollments</CardTitle>
          {/* Filter Bar (UPDATED) */}
          <div className="py-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <SearchableSelect
                options={streamOptions}
                value={selectedStream}
                onChange={handleStreamChange}
                placeholder="Filter by Stream..."
                disabled={loadingFilters}
              />
              <SearchableSelect
                options={courseOptions}
                value={selectedCourse}
                onChange={handleCourseChange}
                placeholder="Filter by Course..."
                disabled={loadingFilters || !selectedStream}
              />
              <SearchableSelect
                options={academicYearOptions}
                value={selectedAcademicYear}
                onChange={handleAcademicYearChange}
                placeholder="Filter by Year..."
                disabled={loadingFilters || !selectedCourse}
              />
              <SearchableSelect
                options={semesterOptions}
                value={selectedSemester}
                onChange={handleSemesterChange}
                placeholder="Filter by Semester..."
                disabled={loadingFilters || !selectedAcademicYear}
              />
            </div>
            <div className="flex flex-col md:flex-row gap-2 justify-between">
              {/* Global Search Input */}
              <div className="relative w-full md:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search name, email, roll..."
                  className="pl-9 w-full"
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={handleFilterClear} disabled={loading}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Clear
                </Button>
                <Button onClick={handleFilterSearch} disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Filter className="h-4 w-4 mr-2" />
                  )}
                  Search
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      {loading ? "Loading students..." : "No results found."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {/* Pagination (Unchanged) */}
          <div className="flex items-center justify-end space-x-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 4. STUDENT VIEW MODAL */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6 pt-0">
            {modalLoading && (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}
            {modalError && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{modalError}</AlertDescription>
              </Alert>
            )}
            {!modalLoading && selectedStudent && (
              renderViewContent()
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="default" 
              onClick={() => selectedStudent && setupEditModal(selectedStudent)}
              disabled={!selectedStudent}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 5. STUDENT EDIT MODAL */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Student Information</DialogTitle>
            <DialogDescription>
              Make changes to the student's profile. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6 pt-0">
            {modalLoading && (
              <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}
            {modalError && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{modalError}</AlertDescription>
              </Alert>
            )}
            {!modalLoading && editFormData.id && (
              renderEditForm()
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}