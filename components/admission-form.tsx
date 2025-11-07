"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
// Assuming these components are available in the local project (shadcn/ui placeholders)
interface CardProps { children: React.ReactNode; className?: string }
const Card: React.FC<CardProps> = ({ children, className }) => <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}>{children}</div>
const CardHeader: React.FC<CardProps> = ({ children, className }) => <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>
const CardTitle: React.FC<CardProps> = ({ children, className }) => <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`}>{children}</h3>
const CardDescription: React.FC<CardProps> = ({ children, className }) => <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>
const CardContent: React.FC<CardProps> = ({ children, className }) => <div className={`p-6 pt-0 ${className}`}>{children}</div>

import { AlertCircle, Upload, Trash2, Plus, File, CheckCircle, X, Loader2, Image as ImageIcon } from "lucide-react"

// --- PrimeReact Imports ---
import { AutoComplete, AutoCompleteCompleteEvent } from 'primereact/autocomplete';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';


// --- Helper Component for Input Styling ---
interface InputGroupProps {
  label: string
  name: string
  type: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
  subLabel?: string
  maxLength?: number
  inputClassName?: string
}

const InputGroup: React.FC<InputGroupProps> = ({
  label,
  name,
  type,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  className = "",
  subLabel,
  maxLength,
  inputClassName = ""
}) => (
  <div className={className}>
    <label className="block text-sm font-semibold text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {subLabel && <p className="text-xs text-gray-500 mb-1">{subLabel}</p>}
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      placeholder={placeholder}
      maxLength={maxLength}
      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-colors bg-white shadow-sm text-sm ${inputClassName}`}
    />
  </div>
)

// Helper component for section titles
const FormSectionHeader: React.FC<{ step: number, title: string }> = ({ step, title }) => (
  <div className="flex items-center gap-3 border-b pb-2 border-gray-200">
    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-md">
      {step}
    </div>
    <h3 className="text-xl font-bold text-gray-800">{title}</h3>
  </div>
);

// --- Type Definitions ---
interface AdmissionFormProps {
  user: {
    id: string
    email: string | undefined
  }
}

interface DocumentItem {
  id: string
  name: string
  file?: File
}

interface UploadedDocument {
  name: string;
  path: string;
  fileName: string;
  fileType: string;
}

interface CustomField {
  id: string
  label: string
  value: string
}

interface FieldOption { label: string; type: string; }
interface DocOption { name: string; description: string; }
interface CourseOption { id: string; name: string; }
interface SemesterOption { id: string; name: string; course_id: string; }
interface CategoryOption { name: string; description: string; }
interface AdmissionTypeOption { name: string; }
interface DropdownOption { label: string; value: string; }


// --- Comprehensive FormData structure reflecting all image fields ---
interface FormData {
  // Top Section (Image 1)
  formNo: string;
  registrationNo: string;
  meritNo: string;
  academicYear: string; 
  quotaSelection: string; 
  discipline: string; 
  branchPreferences: string; 
  howDidYouKnow: string;
  howDidYouKnowOther: string;

  // Section 1 - Course Enrollment (Existing/Kept logic)
  admission_year: string; 
  course_id: string;
  semester_id: string; 
  admission_category: string;
  admission_type: string; 

  // Section 2 - Personal Information (Image 1)
  firstName: string; 
  middleName: string;
  lastName: string;
 
  fatherName: string;
  fatherOccupation: string;
  fatherAnnualIncome: string;
  motherName: string;
  motherOccupation: string;
  motherAnnualIncome: string;
  dateOfBirth: string;
  gender: string; 
  nationality: string;
  placeOfBirth: string;
  domicileOfMaharashtra: string; 
  phdHandicap: string; 
  religion: string;
  caste: string;
  bloodGroup: string;
  categoryType: string; 
  aadharCardNumber: string;
  panNo: string;
 
  // Section 3 - Address (Image 1)
  correspondenceAddress: string; 
  correspondenceCity: string
  correspondencePinCode: string
  correspondencePost: string;
  correspondenceTaluka: string;
  correspondenceDistrict: string;
  correspondenceState: string;
 
  permanentAddress: string;
  permanentCity: string
  permanentPinCode: string
  permanentPost: string;
  permanentTaluka: string;
  permanentDistrict: string;
  permanentState: string;
 
  studentMobileNo: string;
  fatherMobileNo: string;
  motherMobileNo: string;
  email: string;

  // Section 6 - Academic Information (Image 2)
  ssc_monthYear: string;
  ssc_institute: string;
  ssc_board: string;
  ssc_aggPercent: string;
  ssc_seatNo: string;
 
  hsc_monthYear: string;
  hsc_institute: string;
  hsc_board: string;
  hsc_aggPercent: string;
  hsc_seatNo: string;
 
  diploma_monthYear: string;
  diploma_institute: string;
  diploma_board: string;
  diploma_aggPercent: string;
  diploma_seatNo: string;

  ssc_maths_obtained: string;
  ssc_maths_outOf: string;
  ssc_science_obtained: string;
  ssc_science_outOf: string;
  ssc_aggMarks_obtained: string;
  ssc_aggMarks_outOf: string;

  hsc_physics_obtained: string;
  hsc_maths_obtained: string;
  hsc_bioChemVoc_obtained: string;
  hsc_pcbm_obtained: string; // P+C+M/P+C+B/TECH/VOC
  hsc_totalMarks_obtained: string;
  hsc_totalMarks_outOf: string;

  mhtcet_seatNumber: string;
  mhtcet_phy_obtained: string;
  mhtcet_chem_obtained: string;
  mhtcet_maths_obtained: string;
  mhtcet_bio_obtained: string;
  mhtcet_pcm_percentile: string;
  mhtcet_pcb_percentile: string;

  jee_main_seatNumber: string;
  jee_main_phy_obtained: string;
  jee_main_chem_obtained: string;
  jee_main_maths_obtained: string;
  jee_main_pcM_obtained: string;

  nata_test_seatNo: string;
  nata_marks_obtained: string;
  nata_marks_outOf: string;
  nata_monthYear: string;

  direct_second_year_instituteNameCode: string;
  direct_second_year_technicalBoard: string;
  direct_second_year_branchName: string;
  direct_second_year_aggMarks_obtained: string;
  direct_second_year_aggMarks_outOf: string;
}


// --- AdmissionForm Component ---
export default function AdmissionForm({ user }: AdmissionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null)
 
  // Photo State
  const [colorPhotograph, setColorPhotograph] = useState<File | null>(null);

  // --- Dynamic Option States ---
  const [availableCustomFields, setAvailableCustomFields] = useState<FieldOption[]>([])
  const [availableDocuments, setAvailableDocuments] = useState<DocOption[]>([])
  const [availableCourses, setAvailableCourses] = useState<CourseOption[]>([])
  const [allSemesters, setAllSemesters] = useState<SemesterOption[]>([]) 
  const [availableCategories, setAvailableCategories] = useState<CategoryOption[]>([])
  const [availableAdmissionTypes, setAvailableAdmissionTypes] = useState<AdmissionTypeOption[]>([]) 
  const [admissionYears, setAdmissionYears] = useState<string[]>([])
  
  // --- UPDATED: Fee State ---
  const [loadingFees, setLoadingFees] = useState(false)
  const [openFee, setOpenFee] = useState<number | null>(null) // The "Open" category fee
  const [payableFee, setPayableFee] = useState<number | null>(null) // The student's actual payable fee
  const [scholarshipAmount, setScholarshipAmount] = useState<number | null>(null) // The calculated difference


  // AutoComplete State Variables
  const [selectedCustomField, setSelectedCustomField] = useState<FieldOption | string>("")
  const [filteredCustomFieldSuggestions, setFilteredCustomFieldSuggestions] = useState<FieldOption[]>([])
  const [selectedDocument, setSelectedDocument] = useState<DocOption | string>("")
  const [filteredDocumentSuggestions, setFilteredDocumentSuggestions] = useState<DocOption[]>([])

  // Branch Selection State (Used for multi-select dropdown)
  const [selectedBranches, setSelectedBranches] = useState<DropdownOption[]>([]);
  const [filteredBranchSuggestions, setFilteredBranchSuggestions] = useState<DropdownOption[]>([]);


  // Dropdown Options
  const genderOptions: DropdownOption[] = [{ label: 'Male', value: 'Male' }, { label: 'Female', value: 'Female' }, { label: 'Transgender', value: 'Transgender' }];
  const yesNoOptions: DropdownOption[] = [{ label: 'Yes', value: 'Y' }, { label: 'No', value: 'N' }];
  const categoryTypeOptions: DropdownOption[] = [{ label: 'OPEN (A)', value: 'OPEN' }, { label: 'RESERVED (B)', value: 'RESERVED' }, { label: 'OBC/SC/ST/VJNT', value: 'OBC/SC/ST/VJNT' }];
  const quotaOptions: DropdownOption[] = [{ label: 'MINORITY QUOTA', value: 'MINORITY' }, { label: 'CAP SEATS', value: 'CAP' }, { label: 'INSTITUTE LEVEL SEATS', value: 'INSTITUTE' }];
  const sourceOptions: DropdownOption[] = [
    { label: 'Banner (A)', value: 'Banner' }, { label: 'Counsellor (B)', value: 'Counsellor' }, 
    { label: 'Friend (E)', value: 'Friend' }, { label: 'Social Media/Internet (F)', value: 'Social Media/Internet' },
    { label: 'Newspaper/Pamphlets (C/D)', value: 'Newspaper/Pamphlets' }, { label: 'Other (G)', value: 'Other' }
  ];
 
  const disciplineOptions: DropdownOption[] = [
    { label: 'B. Pharmacy', value: 'B. PHARMACY' },
    { label: 'D. Pharmacy', value: 'D. PHARMACY' },
    { label: 'B. Architecture', value: 'ARCHITECTURE' },
    { label: 'D.D.D.D.', value: 'DDDD' },
    { label: 'B.Sc.', value: 'B.SC.' },
  ];
 
  // List of Engineering Branches for Multi-select
  const branchOptions: DropdownOption[] = [
    { label: 'Computer Engineering (CE)', value: 'CE' },
    { label: 'Computer Science (CO)', value: 'CO' },
    { label: 'Electrical Engineering (EE)', value: 'EE' },
    { label: 'Electronics & Comm. (EC)', value: 'EC' },
    { label: 'Mechanical Engineering (ME)', value: 'ME' },
    { label: 'Artificial Intelligence (AI)', value: 'AI' },
    { label: 'Data Science (DS)', value: 'DS' },
    { label: 'Basic Science (BS)', value: 'BS' },
  ];


  // --- Initial FormData (Comprehensive) ---
  const initialFormData: FormData = {
    // Top Section
    formNo: "",
    registrationNo: "",
    meritNo: "",
    academicYear: `${new Date().getFullYear()} - ${new Date().getFullYear() + 1}`,
    quotaSelection: "",
    discipline: "",
    branchPreferences: "", 
    howDidYouKnow: "",
    howDidYouKnowOther: "",

    // Section 1 - Academic Details (Existing/Kept logic)
    admission_year: new Date().getFullYear().toString(),
    course_id: "",
    semester_id: "", 
    admission_category: "",
    admission_type: "", 
   
    // Section 2 - Personal Information (Image 1)
    firstName: "",
    middleName: "",
    lastName: "",
    fatherName: "",
    fatherOccupation: "",
    fatherAnnualIncome: "",
    motherName: "",
    motherOccupation: "",
    motherAnnualIncome: "",
    dateOfBirth: "",
    gender: "", 
    nationality: "INDIAN", 
    placeOfBirth: "",
    domicileOfMaharashtra: "", 
    phdHandicap: "", 
    religion: "",
    caste: "",
    bloodGroup: "",
    categoryType: "", 
    aadharCardNumber: "",
    panNo: "",
   
    // Section 3 - Address (Image 1)
    correspondenceAddress: "", 
    correspondenceCity: "",
    correspondencePinCode: "",
    correspondencePost: "",
    correspondenceTaluka: "",
    correspondenceDistrict: "",
    correspondenceState: "",
    permanentAddress: "",
    permanentCity: "",
    permanentPinCode: "",
    permanentPost: "",
    permanentTaluka: "",
    permanentDistrict: "",
    permanentState: "",
    studentMobileNo: "",
    fatherMobileNo: "",
    motherMobileNo: "",
    email: "", // CLEARED: Student email must be filled by user
    // Section 6 - Academic Information (Image 2)
    ssc_monthYear: "",
    ssc_institute: "",
    ssc_board: "",
    ssc_aggPercent: "",
    ssc_seatNo: "",
   
    hsc_monthYear: "",
    hsc_institute: "",
    hsc_board: "",
    hsc_aggPercent: "",
    hsc_seatNo: "",
   
    diploma_monthYear: "",
    diploma_institute: "",
    diploma_board: "",
    diploma_aggPercent: "",
    diploma_seatNo: "",

    ssc_maths_obtained: "",
    ssc_maths_outOf: "",
    ssc_science_obtained: "",
    ssc_science_outOf: "",
    ssc_aggMarks_obtained: "",
    ssc_aggMarks_outOf: "",

    hsc_physics_obtained: "",
    hsc_maths_obtained: "",
    hsc_bioChemVoc_obtained: "",
    hsc_pcbm_obtained: "",
    hsc_totalMarks_obtained: "",
    hsc_totalMarks_outOf: "",

    mhtcet_seatNumber: "",
    mhtcet_phy_obtained: "",
    mhtcet_chem_obtained: "",
    mhtcet_maths_obtained: "",
    mhtcet_bio_obtained: "",
    mhtcet_pcm_percentile: "",
    mhtcet_pcb_percentile: "",

    jee_main_seatNumber: "",
    jee_main_phy_obtained: "",
    jee_main_chem_obtained: "",
    jee_main_maths_obtained: "",
    jee_main_pcM_obtained: "",

    nata_test_seatNo: "",
    nata_marks_obtained: "",
    nata_marks_outOf: "",
    nata_monthYear: "",

    direct_second_year_instituteNameCode: "",
    direct_second_year_technicalBoard: "",
    direct_second_year_branchName: "",
    direct_second_year_aggMarks_obtained: "",
    direct_second_year_aggMarks_outOf: "",
  };

  const [formData, setFormData] = useState<FormData>(initialFormData);


  // Dynamic Custom Fields & Documents
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [documents, setDocuments] = useState<DocumentItem[]>([])

  // --- Data Fetching & Hooks ---
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    setAdmissionYears([
      `${currentYear + 1}`,
      `${currentYear}`,
      `${currentYear - 1}`,
      `${currentYear - 2}`
    ]);
   
    setFormData(prev => ({ 
        ...prev, 
        academicYear: `${currentYear} - ${currentYear + 1}`,
        admission_year: `${currentYear}`
    }));

    const fetchFormConfig = async () => {
        try {
            const supabase = getSupabaseClient()
           
            const [customData, docData, courseData, categoryData, semesterData, admissionTypeData] = await Promise.all([
                supabase.from("form_config").select("data_jsonb").eq("data_name", "custom_field_options").single(),
                supabase.from("form_config").select("data_jsonb").eq("data_name", "document_options").single(),
                supabase.from("courses").select("id, name").order("name"),
                supabase.from("form_config").select("data_jsonb").eq("data_name", "fee_categories").single(),
                supabase.from("semesters").select("id, name, course_id"), 
                supabase.from("form_config").select("data_jsonb").eq("data_name", "admission_types").single() 
            ]);

            if (customData.data) setAvailableCustomFields(customData.data.data_jsonb as FieldOption[]);
            if (docData.data) setAvailableDocuments(docData.data.data_jsonb as DocOption[]);
            if (courseData.data) setAvailableCourses(courseData.data as CourseOption[]);
            if (categoryData.data) setAvailableCategories(categoryData.data.data_jsonb as CategoryOption[]);
            if (semesterData.data) setAllSemesters(semesterData.data as SemesterOption[]);
            if (admissionTypeData.data) setAvailableAdmissionTypes(admissionTypeData.data.data_jsonb as AdmissionTypeOption[]);
           
            if (customData.error) throw new Error("Failed to load custom fields");
            if (docData.error) throw new Error("Failed to load document options");
            if (courseData.error) throw new Error("Failed to load courses");
            if (categoryData.error) throw new Error("Failed to load fee categories");
            if (semesterData.error) throw new Error("Failed to load semesters");
            if (admissionTypeData.error) throw new Error("Failed to load admission types");

        } catch (error: any) {
            console.error("Error fetching form config:", error)
            setErrorMessage(error.message || "Failed to load all form configuration options.");
        }
    }
    fetchFormConfig()
  }, [])

  // --- Derived State: Available Semesters (Fixed logic) ---
  const availableSemesters = useMemo(() => {
    if (!formData.course_id) return [];
    return allSemesters
      .filter(sem => sem.course_id === formData.course_id)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  }, [formData.course_id, allSemesters]);

  // --- Effect to auto-select semester (Kept logic) ---
  useEffect(() => {
    if (formData.course_id && availableSemesters.length > 0) {
      const defaultSem = availableSemesters.find(s => s.name.toLowerCase() === "semester 1") || availableSemesters[0];
      if (defaultSem && formData.semester_id !== defaultSem.id) {
        setFormData(prev => ({ ...prev, semester_id: defaultSem.id }));
      }
    } else if (formData.semester_id && !formData.course_id) {
        setFormData(prev => ({ ...prev, semester_id: "" }));
    }
  }, [formData.course_id, availableSemesters, formData.semester_id]); // Added formData.semester_id

  // --- UPDATED: Effect to fetch fees and calculate scholarship ---
  useEffect(() => {
    const fetchFees = async () => {
      // We need both a course and a category selected
      if (formData.course_id && formData.admission_category) {
        setLoadingFees(true);
        setPayableFee(null);
        setOpenFee(null);
        setScholarshipAmount(null);
        setErrorMessage("");
       
        try {
          const supabase = getSupabaseClient();
          
          // 1. Fetch the fee for the student's selected category (e.g., "EBC")
          const { data: payableData, error: payableError } = await supabase
            .from("course_fees")
            .select("amount")
            .eq("course_id", formData.course_id)
            .eq("category_name", formData.admission_category)
            .single();

          if (payableError) {
            if (payableError.code === 'PGRST116') {
              setErrorMessage(`No fee structure found for this course and category: ${formData.admission_category}.`);
            } else {
              throw payableError;
            }
            return; // Stop if we can't find the payable fee
          }

          const payable = payableData.amount;
          setPayableFee(payable);

          // 2. Fetch the "Open" fee (the total course fee)
          // We assume "Open" is the name of your full fee category
          const { data: openData, error: openError } = await supabase
            .from("course_fees")
            .select("amount")
            .eq("course_id", formData.course_id)
            .eq("category_name", "Open") // <-- This MUST match your "Open" category name
            .single();
          
          if (openError) {
             console.error("Could not fetch 'Open' fee. Scholarship will be 0.");
             setOpenFee(payable); // Set open fee to payable fee
             setScholarshipAmount(0); // Set scholarship to 0
          } else {
            const open = openData.amount;
            setOpenFee(open);
            // 3. Calculate Scholarship
            setScholarshipAmount(open - payable);
          }

          setErrorMessage("");
         
        } catch (error: any) {
          console.error("Error fetching fees:", error);
          setErrorMessage("Failed to fetch admission fees. Please try again.");
        } finally {
          setLoadingFees(false);
        }
      }
    };
   
    fetchFees();
  }, [formData.course_id, formData.admission_category]);


  // --- AutoComplete Logic ---
  const searchCustomFieldsSuggestions = (event: AutoCompleteCompleteEvent) => {
    let _suggestions: FieldOption[] = [];
    _suggestions = availableCustomFields.filter(option => 
      option.label.toLowerCase().includes(event.query.toLowerCase())
    );
    setFilteredCustomFieldSuggestions(_suggestions);
  };
 
  const searchDocumentSuggestions = (event: AutoCompleteCompleteEvent) => {
    let _suggestions: DocOption[] = [];
    _suggestions = availableDocuments.filter(option => 
      option.name.toLowerCase().includes(event.query.toLowerCase())
    );
    setFilteredDocumentSuggestions(_suggestions);
  };
 
  // Branch Preference Search
  const searchBranchSuggestions = (event: AutoCompleteCompleteEvent) => {
    let _suggestions: DropdownOption[] = branchOptions.filter(option => 
      option.label.toLowerCase().includes(event.query.toLowerCase())
    );
    setFilteredBranchSuggestions(_suggestions);
  };

  // --- Handlers ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }
 
  const handleDropdownChange = (e: DropdownChangeEvent) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMessage("Please upload a valid image file for the photograph.");
        setColorPhotograph(null);
        return;
      }
      setColorPhotograph(file);
      setErrorMessage("");
    }
  };

  const handleAddCustomField = () => {
    if (typeof selectedCustomField === 'object' && selectedCustomField.label) {
      const cleanLabel = selectedCustomField.label.trim()
      if (customFields.some(field => field.label === cleanLabel)) {
          setErrorMessage(`Custom field "${cleanLabel}" has already been added.`);
          return;
      }
      const newField: CustomField = {
        id: Date.now().toString(),
        label: cleanLabel,
        value: "",
      }
      setCustomFields((prev) => [...prev, newField])
      setSelectedCustomField("") 
      setErrorMessage("")
    }
  }

  const handleCustomFieldChange = (id: string, value: string) => {
    setCustomFields((prev) =>
      prev.map((field) => (field.id === id ? { ...field, value } : field))
    )
  }

  const handleRemoveCustomField = (id: string) => {
    setCustomFields((prev) => prev.filter((field) => field.id !== id))
  }
 
  const handleAddDocument = () => {
    if (typeof selectedDocument === 'object' && selectedDocument.name) {
      const cleanDocName = selectedDocument.name.trim()
      if (documents.some(doc => doc.name === cleanDocName)) {
          setErrorMessage(`Document "${cleanDocName}" has already been added.`);
          return;
      }
      const newDoc: DocumentItem = { id: Date.now().toString(), name: cleanDocName }
      setDocuments((prev) => [...prev, newDoc])
      setExpandedDocId(newDoc.id)
      setSelectedDocument("") 
      setErrorMessage("")
    }
  }

  const toggleDocumentExpand = (docId: string) => { setExpandedDocId(expandedDocId === docId ? null : docId) }

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>, docId: string) => {
    const file = e.target.files?.[0]
    if (file) {
      setDocuments((prev) => prev.map((doc) => (doc.id === docId ? { ...doc, file } : doc)))
    }
  }

  const handleRemoveDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== docId))
    if (expandedDocId === docId) {
      setExpandedDocId(null)
    }
  }


  const resetForm = () => {
      setFormData(initialFormData)
      setColorPhotograph(null);
      setCustomFields([])
      setDocuments([])
      setExpandedDocId(null)
      setSelectedCustomField("") 
      setSelectedDocument("") 
      setSelectedBranches([]); // Reset branch selection
      setPayableFee(null) // --- UPDATED ---
      setOpenFee(null) // --- UPDATED ---
      setScholarshipAmount(null) // --- UPDATED ---
      setErrorMessage("")
      setSuccessMessage("")
  }
 
  // --- Form Submission (UPDATED for Scholarship) ---
 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsSubmitting(true)
  setSuccessMessage("")
  setErrorMessage("")

  // 1. Prepare Branch Preferences and validate
  const branchPreferenceCodes = selectedBranches.map(b => b.value).join(', ');
  const cleanedFormData = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => [key, (value as string).trim()])
  ) as unknown as FormData;

  // --- [Validation logic remains the same] ---
  const requiredFields: (keyof FormData)[] = [
      "firstName", "lastName", "email", "studentMobileNo", "dateOfBirth",
      "fatherName", "fatherOccupation", "motherName", "motherOccupation",
      "gender", "nationality", "domicileOfMaharashtra", "categoryType",  
      "quotaSelection", "discipline", "course_id", "semester_id",
      "correspondenceAddress", "permanentAddress",
      "ssc_monthYear", "ssc_institute", "ssc_board", "ssc_aggPercent", "ssc_seatNo",
  ];

  if (!colorPhotograph) {
      setErrorMessage("Please upload your recent color photograph.");
      setIsSubmitting(false);
      return;
  }
 
  for (const field of requiredFields) {
      if (field === "branchPreferences" && !branchPreferenceCodes) {
           setErrorMessage(`Validation Error: Engineering & Technology Branch Preferences is required.`);
         setIsSubmitting(false);
         return;
      }

      if (field !== "branchPreferences" && (!cleanedFormData[field] || (typeof cleanedFormData[field] === 'string' && !(cleanedFormData[field] as string).trim()) ) ) {
          setErrorMessage(`Validation Error: The field "${field.replace(/([A-Z])/g, ' $1')}" is required.`);
          setIsSubmitting(false);
          return;  
      }
  }
 
  // --- UPDATED: Check all fee states ---
  if (payableFee === null || openFee === null || scholarshipAmount === null) {
      setErrorMessage("Validation Error: Admission fees could not be determined. Please re-select course and category.");
      setIsSubmitting(false);
      return;
  }
 
  if (documents.some(doc => !doc.file)) {
    setErrorMessage("Please upload a file for all added document types.");
    setIsSubmitting(false);
    return;
  }
  // --- [End of validation logic] ---


  try {
    const supabase = getSupabaseClient()
    const studentIdentifier = cleanedFormData.aadharCardNumber.trim() || user.id;

    // --- 1. Photo Upload (Same as before) ---
    let photoPath = '';
    if (colorPhotograph) {
      const fileExt = colorPhotograph.name.split('.').pop();
      const photoFileName = `photo-${Date.now()}.${fileExt}`;
      const photoFilePath = `${user.id}/${studentIdentifier}/profile/${photoFileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('student_documents')
        .upload(photoFilePath, colorPhotograph);
       
      if (uploadError) throw new Error(`Failed to upload photo: ${uploadError.message}`);
      photoPath = uploadData.path;
    }

    // --- 2. Document Uploads (Same as before) ---
    const uploadedDocumentsData: UploadedDocument[] = [];  

    for (const doc of documents) {
      if (!doc.file) continue;  
     
      const cleanDocName = doc.name.replace(/[^a-zA-Z0-9]/g, '_');
      const fileExt = doc.file.name.split('.').pop();
      const uniqueFileName = `${cleanDocName}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${studentIdentifier}/documents/${uniqueFileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('student_documents')
        .upload(filePath, doc.file);

      if (uploadError) throw new Error(`Failed to upload ${doc.name}: ${uploadError.message}`);
     
      uploadedDocumentsData.push({
        name: doc.name,
        path: uploadData.path,  
        fileName: doc.file.name,
        fileType: doc.file.type,
      });
    }
   
    // --- 3. Consolidate Academic Records (Same as before) ---
    const academicRecords = {
        ssc: {
            monthYear: cleanedFormData.ssc_monthYear, institute: cleanedFormData.ssc_institute, board: cleanedFormData.ssc_board, aggPercent: cleanedFormData.ssc_aggPercent, seatNo: cleanedFormData.ssc_seatNo,
            maths: { obtained: cleanedFormData.ssc_maths_obtained, outOf: cleanedFormData.ssc_maths_outOf },
            science: { obtained: cleanedFormData.ssc_science_obtained, outOf: cleanedFormData.ssc_science_outOf },
            aggregate: { obtained: cleanedFormData.ssc_aggMarks_obtained, outOf: cleanedFormData.ssc_aggMarks_outOf },
        },
        hsc: {
            monthYear: cleanedFormData.hsc_monthYear, institute: cleanedFormData.hsc_institute, board: cleanedFormData.hsc_board, aggPercent: cleanedFormData.hsc_aggPercent, seatNo: cleanedFormData.hsc_seatNo,
            physics: cleanedFormData.hsc_physics_obtained, maths: cleanedFormData.hsc_maths_obtained, bioChemVoc: cleanedFormData.hsc_bioChemVoc_obtained, pcbm: cleanedFormData.hsc_pcbm_obtained,
            aggregate: { obtained: cleanedFormData.hsc_totalMarks_obtained, outOf: cleanedFormData.hsc_totalMarks_outOf },
        },
        diploma: {
            monthYear: cleanedFormData.diploma_monthYear, institute: cleanedFormData.diploma_institute, board: cleanedFormData.diploma_board, aggPercent: cleanedFormData.diploma_aggPercent, seatNo: cleanedFormData.diploma_seatNo,
        },
        mht_cet: { seatNumber: cleanedFormData.mhtcet_seatNumber, phy: cleanedFormData.mhtcet_phy_obtained, chem: cleanedFormData.mhtcet_chem_obtained, maths: cleanedFormData.mhtcet_maths_obtained, bio: cleanedFormData.mhtcet_bio_obtained, pcmPercentile: cleanedFormData.mhtcet_pcm_percentile, pcbPercentile: cleanedFormData.mhtcet_pcb_percentile },
        jee_main: { seatNumber: cleanedFormData.jee_main_seatNumber, phy: cleanedFormData.jee_main_phy_obtained, chem: cleanedFormData.jee_main_chem_obtained, maths: cleanedFormData.jee_main_maths_obtained, pcM: cleanedFormData.jee_main_pcM_obtained },
        nata: { seatNo: cleanedFormData.nata_test_seatNo, marks: cleanedFormData.nata_marks_obtained, outOf: cleanedFormData.nata_marks_outOf, monthYear: cleanedFormData.nata_monthYear },
        direct_second_year: { instituteNameCode: cleanedFormData.direct_second_year_instituteNameCode, technicalBoard: cleanedFormData.direct_second_year_technicalBoard, branchName: cleanedFormData.direct_second_year_branchName, aggregate: { obtained: cleanedFormData.direct_second_year_aggMarks_obtained, outOf: cleanedFormData.direct_second_year_aggMarks_outOf } },
    };


    // --- 4. NEW: Split Payload Construction ---
   
    // 4a. Payload for 'students' table (Permanent Info)
    const studentInsertData = {
      user_id: user.id,
      firstname: cleanedFormData.firstName,
      lastname: cleanedFormData.lastName,
      middlename: cleanedFormData.middleName,
      email: cleanedFormData.email,
      phone: cleanedFormData.studentMobileNo, // primary phone
      dateofbirth: cleanedFormData.dateOfBirth,

      // Address (from correspondence)
      address: cleanedFormData.correspondenceAddress,  
      city: cleanedFormData.correspondenceCity,
      state: cleanedFormData.correspondenceState,
      zipcode: cleanedFormData.correspondencePinCode,

      // --- UPDATED: Save all fee details ---
      admission_year: cleanedFormData.admission_year,
      admission_category: cleanedFormData.admission_category,
      admission_type: cleanedFormData.admission_type,
      original_admission_fee: payableFee, // This is the NET payable fee
      original_total_fee: openFee, // This is the full "Open" fee
      original_scholarship_name: formData.admission_category, // e.g., "EBC"
      original_scholarship_amount: scholarshipAmount, // e.g., 40000

      // Data and Documents
      documents: uploadedDocumentsData, // JSONB
      custom_data: customFields.reduce((acc, field) => { acc[field.label] = field.value.trim(); return acc; }, {} as Record<string, string>), // JSONB

      // NEW FIELDS (matching SQL snake_case)
      photo_path: photoPath,
      quota_selection: cleanedFormData.quotaSelection,
      discipline: cleanedFormData.discipline,
      branch_preferences: branchPreferenceCodes,
      how_did_you_know: cleanedFormData.howDidYouKnow,
      form_no: cleanedFormData.formNo,
      registration_no: cleanedFormData.registrationNo,
      merit_no: cleanedFormData.meritNo,

      // Personal Details
      father_name: cleanedFormData.fatherName,
      mother_name: cleanedFormData.motherName,
      father_occupation: cleanedFormData.fatherOccupation,
      mother_occupation: cleanedFormData.motherOccupation,
      father_annual_income: cleanedFormData.fatherAnnualIncome,
      mother_annual_income: cleanedFormData.motherAnnualIncome,
      gender: cleanedFormData.gender,
      nationality: cleanedFormData.nationality,
      place_of_birth: cleanedFormData.placeOfBirth,
      domicile_of_maharashtra: cleanedFormData.domicileOfMaharashtra,
      phd_handicap: cleanedFormData.phdHandicap,
      religion: cleanedFormData.religion,
      caste: cleanedFormData.caste,
      blood_group: cleanedFormData.bloodGroup,
      category_type: cleanedFormData.categoryType,
      aadhar_card_number: cleanedFormData.aadharCardNumber,
      pan_no: cleanedFormData.panNo,
      student_mobile_no: cleanedFormData.studentMobileNo,
      father_mobile_no: cleanedFormData.fatherMobileNo,
      mother_mobile_no: cleanedFormData.motherMobileNo,

      // Address Details (JSONB strings)
      correspondence_details: JSON.stringify({
          post: cleanedFormData.correspondencePost,  
          taluka: cleanedFormData.correspondenceTaluka,  
          district: cleanedFormData.correspondenceDistrict,  
          address_line: cleanedFormData.correspondenceAddress,
      }),
      permanent_details: JSON.stringify({
          address_line: cleanedFormData.permanentAddress,  
          city: cleanedFormData.permanentCity,  
          pinCode: cleanedFormData.permanentPinCode,  
          post: cleanedFormData.permanentPost,  
          taluka: cleanedFormData.permanentTaluka,  
          district: cleanedFormData.permanentDistrict,  
          state: cleanedFormData.permanentState,
      }),
     
      // Academic Records (JSONB string)
      academic_records: JSON.stringify(academicRecords),
    };

    // 4b. Data for 'student_semesters' table (Semester-Specific Info)
    const semesterInsertData = {
      course_id: cleanedFormData.course_id,
      semester_id: cleanedFormData.semester_id,
      academic_year: cleanedFormData.academicYear, // Use the form's academic year
      roll_number: cleanedFormData.ssc_seatNo, // Using SSC seat no as roll no, as in original code
      
      // --- UPDATED: Save all fee details to the semester record too ---
      fees_details: {
          total_fee: openFee, // Full course fee
          scholarship_name: formData.admission_category,
          scholarship_amount: scholarshipAmount,
          net_payable_fee: payableFee, // The amount they actually have to pay
          paid: 0, // Assuming 0 is paid at time of admission form
          due: payableFee, // The initial due amount is the net payable fee
          category: cleanedFormData.admission_category
      },
      status: 'active',
      promotion_status: 'Eligible'
    };

    // --- 5. NEW: Two-Step Insert ---
   
    // Step 1: Insert the student and get their new ID
    const { data: newStudent, error: studentError } = await supabase
      .from("students")
      .insert(studentInsertData)
      .select("id") // Select the 'id' of the newly created student
      .single();

    if (studentError) throw studentError;
   
    if (!newStudent || !newStudent.id) {
        throw new Error("Failed to create student record or retrieve new student ID.");
    }

    // Step 2: Use the new student ID to insert their first semester record
    const { error: semesterError } = await supabase
      .from("student_semesters")
      .insert({
          ...semesterInsertData,
          student_id: newStudent.id // Link to the student we just created
      });

    if (semesterError) {
        // Note: In a real-world scenario, you might want to delete the
        // student record created in Step 1 if this step fails (a "rollback").
        // For now, we'll just report the error.
        throw new Error(`Student created, but failed to enroll in semester: ${semesterError.message}`);
    }

    setSuccessMessage("Your enrollment application has been submitted successfully!")
    resetForm()
  } catch (error: any) {
    console.error("Submission error:", error)
    const displayMessage = (error.details || error.message || "Failed to submit form. Please check your inputs.")
    setErrorMessage(displayMessage)
  } finally {
    setIsSubmitting(false)
  }
}
  // Custom template for displaying AutoComplete options (Kept logic)
  const itemTemplate = (item: FieldOption | DocOption | DropdownOption, key: 'label' | 'name' | 'value') => {
      const text = (item as any)[key]
      return <div className="p-2 text-sm hover:bg-gray-100">{text}</div>;
  };

  const branchItemTemplate = (item: DropdownOption) => {
    return <div className="p-2 text-sm hover:bg-gray-100">{item.label}</div>;
  };
 
  const selectedBranchTemplate = (branch: DropdownOption) => {
    return (
        <span className="inline-flex items-center text-xs font-medium bg-blue-100 text-blue-800 rounded-full px-2.5 py-0.5 mr-1">
            {branch.value}
        </span>
    );
  };

  // --- Render ---
  return (
    <div className="max-w-6xl mx-auto py-2 md:py-4">
      <Card className="border-0 shadow-lg rounded-lg overflow-hidden bg-white">
        <CardHeader className="bg-gradient-to-r from-blue-700 to-blue-900 text-white p-4 md:p-6">
          <CardTitle className="text-3xl font-extrabold tracking-tight">Anjuman-I-Islam's Kalsekar Technical Campus</CardTitle>
          <CardDescription className="text-blue-200 text-base mt-1">
            **First Year / Direct Second Year Admission Form** for the Academic Year {formData.academicYear}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 md:p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
           
            {/* --- TOP SECTION (Image 1 Header Fields) --- */}
            <section className="space-y-4 border-b pb-4 border-dashed border-gray-300">
                <h3 className="text-xl font-bold text-gray-800">Application Status & Quota</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <InputGroup label="Form No." name="formNo" type="text" value={formData.formNo} onChange={handleChange} placeholder="e.g., KT2025/123" required />
                    <InputGroup label="Registration No." name="registrationNo" type="text" value={formData.registrationNo} onChange={handleChange} placeholder="Registration Number" required />
                    <InputGroup label="Merit No." name="meritNo" type="text" value={formData.meritNo} onChange={handleChange} placeholder="Merit Rank" required />
                    <div className="space-y-1">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Quota Selection <span className="text-red-500">*</span></label>
                      <Dropdown
                        name="quotaSelection"
                        value={formData.quotaSelection}
                        options={quotaOptions}
                        onChange={handleDropdownChange}
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Select Quota (Please select any one)"
                        required
                        className="w-full p-inputtext-sm"
                      />
                    </div>
                </div>
               
                <h4 className="text-lg font-bold text-gray-700 mt-4">Discipline & Branch Preferences</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Discipline Selection <span className="text-red-500">*</span></label>
                        <Dropdown
                          name="discipline"
                          value={formData.discipline}
                          options={disciplineOptions} 
                          onChange={handleDropdownChange}
                          optionLabel="label"
                          optionValue="value"
                          placeholder="Select Discipline"
                          required
                          className="w-full p-inputtext-sm"
                        />
                    </div>
                    {/* Branch Preference Multi-select */}
                    <div className="md:col-span-2 space-y-1">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Engineering & Technology Branch Preferences (1, 2, 3...) <span className="text-red-500">*</span></label>
                        <AutoComplete 
                            value={selectedBranches} 
                            suggestions={filteredBranchSuggestions}
                            completeMethod={searchBranchSuggestions}
                            multiple
                            dropdown
                            field="label"
                            onChange={(e) => {
                                setSelectedBranches(e.value);
                            }}
                            placeholder="Select up to 5 preferred branches"
                            itemTemplate={branchItemTemplate}
                            selectedItemTemplate={selectedBranchTemplate}
                            className="w-full"
                            inputClassName="p-inputtext p-component w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 transition text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">Select course name in order of preference (Codes: CE | CO | EE | EC | ME | AI | DS | BS)</p>
                    </div>
                </div>
               
                <h4 className="text-lg font-bold text-gray-700 mt-4">Source of Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">How did you know about the Campus? <span className="text-red-500">*</span></label>
                      <Dropdown
                        name="howDidYouKnow"
                        value={formData.howDidYouKnow}
                        options={sourceOptions}
                        onChange={handleDropdownChange}
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Select Source"
                        required
                        className="w-full p-inputtext-sm"
                      />
                    </div>
                    {formData.howDidYouKnow === 'Other' && (
                        <InputGroup label="Specify Other Source" name="howDidYouKnowOther" type="text" value={formData.howDidYouKnowOther} onChange={handleChange} placeholder="Please specify" required />
                    )}
                </div>
            </section>


            {/* --- 1. Course Enrollment Details (Keep existing logic) --- */}
            <section className="space-y-4">
              <FormSectionHeader step={1} title="Course Enrollment Details" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Admission Year <span className="text-red-500">*</span></label>
                  <Dropdown
                    name="admission_year"
                    value={formData.admission_year}
                    options={admissionYears}
                    onChange={handleDropdownChange}
                    placeholder="Select Year"
                    required
                    className="w-full p-inputtext-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Select Course <span className="text-red-500">*</span></label>
                  <Dropdown
                    name="course_id"
                    value={formData.course_id}
                    options={availableCourses}
                    onChange={(e) => {
                      handleDropdownChange(e);
                      setFormData(prev => ({...prev, semester_id: ""}));
                    }}
                    optionLabel="name"
                    optionValue="id"
                    placeholder="Select a Course"
                    filter required
                    className="w-full p-inputtext-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Select Semester <span className="text-red-500">*</span></label>
                  <Dropdown
                    name="semester_id"
                    value={formData.semester_id}
                    options={availableSemesters} 
                    onChange={handleDropdownChange}
                    optionLabel="name"
                    optionValue="id"
                    placeholder="Select Semester"
                    required
                    disabled={!formData.course_id || availableSemesters.length === 0} 
                    className="w-full p-inputtext-sm"
                  />
                </div>
              </div>
             
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Admission Category <span className="text-red-500">*</span></label>
                  <Dropdown
                    name="admission_category"
                    value={formData.admission_category}
                    options={availableCategories}
                    onChange={handleDropdownChange}
                    optionLabel="name"
                    optionValue="name"
                    placeholder="Select a Category (e.g., General, Minority)"
                    required
                    className="w-full p-inputtext-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Admission Type <span className="text-red-500">*</span></label>
                  <Dropdown
                    name="admission_type"
                    value={formData.admission_type}
                    options={availableAdmissionTypes}
                    onChange={handleDropdownChange}
                    optionLabel="name"
                    optionValue="name"
                    placeholder="Select Admission Type (e.g., First Year, Direct Second Year)"
                    required
                    className="w-full p-inputtext-sm"
                  />
                </div>
              </div>

              {/* --- UPDATED: Fee Display Box --- */}
              {(formData.course_id && formData.admission_category) && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                  {loadingFees ? (
                    <div className="flex justify-center items-center h-24">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Total Course Fee */}
                      <div>
                        <label className="text-sm font-semibold text-gray-600">Total Course Fee</label>
                        <p className={`text-2xl font-bold ${openFee !== null ? 'text-gray-800' : 'text-gray-500'}`}>
                          {openFee !== null 
                            ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(openFee)
                            : '---'}
                        </p>
                      </div>
                      {/* Scholarship Amount */}
                      <div>
                        <label className="text-sm font-semibold text-gray-600">Scholarship ({formData.admission_category})</label>
                        <p className={`text-2xl font-bold ${scholarshipAmount !== null ? 'text-orange-600' : 'text-gray-500'}`}>
                          - {scholarshipAmount !== null 
                            ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(scholarshipAmount)
                            : '---'}
                        </p>
                      </div>
                      {/* Net Payable Fee */}
                      <div>
                        <label className="text-sm font-semibold text-gray-600">Net Payable Fee</label>
                        <p className={`text-3xl font-bold ${payableFee !== null ? 'text-green-700' : 'text-gray-500'}`}>
                          {payableFee !== null 
                            ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(payableFee)
                            : '---'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
            <hr className="my-6" />

            {/* --- 2. Personal Information Section (Image 1 Full Fields) --- */}
            <section className="space-y-4">
              <FormSectionHeader step={2} title="Personal & Family Information" />
             
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-8 space-y-4">
                      <h4 className="text-lg font-bold text-gray-700">Name as appears on HSC/Diploma marksheet (IN CAPITALS) <span className="text-red-500">*</span></h4>
                      <div className="grid grid-cols-3 gap-4">
                          <InputGroup label="Surname" name="lastName" type="text" value={formData.lastName} onChange={handleChange} placeholder="SURNAME" required />
                          <InputGroup label="First Name" name="firstName" type="text" value={formData.firstName} onChange={handleChange} placeholder="FIRST NAME" required />
                          <InputGroup label="Middle Name" name="middleName" type="text" value={formData.middleName} onChange={handleChange} placeholder="MIDDLE NAME" />
                      </div>

                      <h4 className="text-lg font-bold text-gray-700 mt-4">Parent/Guardian Information</h4>
                      <div className="grid grid-cols-3 gap-4">
                          <InputGroup label="Father's Name" name="fatherName" type="text" value={formData.fatherName} onChange={handleChange} placeholder="Father's Full Name" required />
                          <InputGroup label="Father's Occupation" name="fatherOccupation" type="text" value={formData.fatherOccupation} onChange={handleChange} placeholder="Occupation" required />
                          <InputGroup label="Annual Income (Rs.)" name="fatherAnnualIncome" type="text" value={formData.fatherAnnualIncome} onChange={handleChange} placeholder="Annual Income" />
                         
                          <InputGroup label="Mother's Name" name="motherName" type="text" value={formData.motherName} onChange={handleChange} placeholder="Mother's Full Name" required />
                          <InputGroup label="Mother's Occupation" name="motherOccupation" type="text" value={formData.motherOccupation} onChange={handleChange} placeholder="Occupation" required />
                          <InputGroup label="Annual Income (Rs.)" name="motherAnnualIncome" type="text" value={formData.motherAnnualIncome} onChange={handleChange} placeholder="Annual Income" />
                      </div>
                  </div>
                 
                  {/* Photo Upload Area */}
                  <div className="md:col-span-4 flex flex-col items-center justify-start p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                      <p className="text-sm font-semibold mb-2 text-center text-gray-700">Affix your recent Colour Photograph <span className="text-red-500">*</span></p>
                      <div className="w-32 h-40 border border-gray-400 bg-white flex items-center justify-center mb-3 overflow-hidden relative">
                          {colorPhotograph ? (
                              <img src={URL.createObjectURL(colorPhotograph)} alt="Passport" className="w-full h-full object-cover" />
                          ) : (
                              <ImageIcon size={40} className="text-gray-400" />
                          )}
                          <label className="absolute bottom-0 w-full text-center bg-blue-500 text-white text-xs py-1 cursor-pointer hover:bg-blue-600">
                            {colorPhotograph ? "Change Photo" : "Upload Photo"}
                            <input type="file" onChange={handlePhotoUpload} className="hidden" accept="image/*" required />
                          </label>
                      </div>
                      <p className="text-xs text-gray-500">Student's Signature (Placeholder)</p>
                  </div>
              </div>

              <h4 className="text-lg font-bold text-gray-700 mt-6">Other Personal Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <InputGroup label="Date of Birth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} required />
                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Gender <span className="text-red-500">*</span></label>
                    <Dropdown
                      name="gender"
                      value={formData.gender}
                      options={genderOptions}
                      onChange={handleDropdownChange}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Select Gender"
                      required
                      className="w-full p-inputtext-sm"
                    />
                  </div>
                  <InputGroup label="Nationality" name="nationality" type="text" value={formData.nationality} onChange={handleChange} placeholder="e.g., INDIAN" required />
                  <InputGroup label="Place of Birth" name="placeOfBirth" type="text" value={formData.placeOfBirth} onChange={handleChange} placeholder="City of Birth" required />
                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Domicile of Maharashtra <span className="text-red-500">*</span></label>
                    <Dropdown
                      name="domicileOfMaharashtra"
                      value={formData.domicileOfMaharashtra}
                      options={yesNoOptions}
                      onChange={handleDropdownChange}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Y/N"
                      required
                      className="w-full p-inputtext-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">PH/Handicap <span className="text-red-500">*</span></label>
                    <Dropdown
                      name="phdHandicap"
                      value={formData.phdHandicap}
                      options={yesNoOptions}
                      onChange={handleDropdownChange}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Y/N"
                      required
                      className="w-full p-inputtext-sm"
                    />
                  </div>
                 
                  <InputGroup label="Religion" name="religion" type="text" value={formData.religion} onChange={handleChange} placeholder="Religion" required />
                  <InputGroup label="Caste" name="caste" type="text" value={formData.caste} onChange={handleChange} placeholder="Caste" required />
                  <InputGroup label="Blood Group (Opt.)" name="bloodGroup" type="text" value={formData.bloodGroup} onChange={handleChange} placeholder="e.g., A+" />

                  <div className="space-y-1 md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Category <span className="text-red-500">*</span> (Please tick the appropriate one)</label>
                    <Dropdown
                      name="categoryType"
                      value={formData.categoryType}
                      options={categoryTypeOptions}
                      onChange={handleDropdownChange}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Select Category"
                      required
                      className="w-full p-inputtext-sm"
                    />
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputGroup label="Aadhar Card Number" name="aadharCardNumber" type="text" value={formData.aadharCardNumber} onChange={handleChange} placeholder="12-digit number" required maxLength={12} />
                  <InputGroup label="PAN No. (Opt.)" name="panNo" type="text" value={formData.panNo} onChange={handleChange} placeholder="PAN Number" maxLength={10} />
              </div>
            </section>
            <hr className="my-6" />

            {/* --- 3. Address Section (Image 1 Full Fields) --- */}
            <section className="space-y-4">
              <FormSectionHeader step={3} title="Address & Contact Details" />
             
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               
                {/* Correspondence Address */}
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                    <h4 className="font-bold text-gray-700">Correspondence Address <span className="text-red-500">*</span></h4>
                    <InputGroup label="Address Line" name="correspondenceAddress" type="text" value={formData.correspondenceAddress} onChange={handleChange} placeholder="Street Address / Line 1" required className="col-span-2" />
                    <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="City" name="correspondenceCity" type="text" value={formData.correspondenceCity} onChange={handleChange} placeholder="City" required />
                        <InputGroup label="Pin Code" name="correspondencePinCode" type="text" value={formData.correspondencePinCode} onChange={handleChange} placeholder="Pin Code" required maxLength={6} />
                        <InputGroup label="Post (Opt.)" name="correspondencePost" type="text" value={formData.correspondencePost} onChange={handleChange} placeholder="Post" />
                        <InputGroup label="Taluka (Opt.)" name="correspondenceTaluka" type="text" value={formData.correspondenceTaluka} onChange={handleChange} placeholder="Taluka" />
                        <InputGroup label="District (Opt.)" name="correspondenceDistrict" type="text" value={formData.correspondenceDistrict} onChange={handleChange} placeholder="District" />
                        <InputGroup label="State" name="correspondenceState" type="text" value={formData.correspondenceState} onChange={handleChange} placeholder="State" required />
                    </div>
                </div>

                {/* Permanent Address */}
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                    <h4 className="font-bold text-gray-700">Permanent Address <span className="text-red-500">*</span></h4>
                    <InputGroup label="Address Line" name="permanentAddress" type="text" value={formData.permanentAddress} onChange={handleChange} placeholder="Street Address / Line 1" required className="col-span-2" />
                    <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="City" name="permanentCity" type="text" value={formData.permanentCity} onChange={handleChange} placeholder="City" required />
                        <InputGroup label="Pin Code" name="permanentPinCode" type="text" value={formData.permanentPinCode} onChange={handleChange} placeholder="Pin Code" required maxLength={6} />
                        <InputGroup label="Post (Opt.)" name="permanentPost" type="text" value={formData.permanentPost} onChange={handleChange} placeholder="Post" />
                        <InputGroup label="Taluka (Opt.)" name="permanentTaluka" type="text" value={formData.permanentTaluka} onChange={handleChange} placeholder="Taluka" />
                        <InputGroup label="District (Opt.)" name="permanentDistrict" type="text" value={formData.permanentDistrict} onChange={handleChange} placeholder="District" />
                        <InputGroup label="State" name="permanentState" type="text" value={formData.permanentState} onChange={handleChange} placeholder="State" required />
                    </div>
                </div>
              </div>
             
              <h4 className="text-lg font-bold text-gray-700 mt-6">Mobile Contacts</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <InputGroup label="Student's Mobile No." name="studentMobileNo" type="tel" value={formData.studentMobileNo} onChange={handleChange} placeholder="Student's Mobile" required maxLength={10} />
                  <InputGroup label="Student's Email Address" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="student@example.com" required />
                  <InputGroup label="Father's Mobile No." name="fatherMobileNo" type="tel" value={formData.fatherMobileNo} onChange={handleChange} placeholder="Father's Mobile" maxLength={10} />
                  <InputGroup label="Mother's Mobile No." name="motherMobileNo" type="tel" value={formData.motherMobileNo} onChange={handleChange} placeholder="Mother's Mobile" maxLength={10} />
              </div>
            </section>
            <hr className="my-6" />

            {/* --- 4. Custom Fields Section (Keep existing logic) --- */}
            <section className="space-y-4">
              <FormSectionHeader step={4} title="Additional Information & Custom Fields" />
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <label className="block text-sm font-bold text-gray-700 mb-2">Select or Search Custom Field</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <AutoComplete 
                    value={selectedCustomField} 
                    suggestions={filteredCustomFieldSuggestions} 
                    completeMethod={searchCustomFieldsSuggestions}
                    onChange={(e) => setSelectedCustomField(e.value)} 
                    field="label"
                    placeholder="Search or select field label"
                    dropdown
                    itemTemplate={(item) => itemTemplate(item as FieldOption, 'label')}
                    className="flex-1 w-full"
                    inputClassName="p-inputtext p-component w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 transition text-sm"
                  />
                  <button type="button" onClick={handleAddCustomField} disabled={typeof selectedCustomField !== 'object' || !selectedCustomField}
                    className="w-full sm:w-auto px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-semibold flex items-center justify-center gap-1 shadow-sm text-sm disabled:opacity-50">
                    <Plus size={16} /> Add Field
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customFields.map((field) => (
                  <div key={field.id} className="relative group">
                    <InputGroup 
                      label={field.label} 
                      name={field.id} 
                      type="text" 
                      value={field.value} 
                      onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                      placeholder={`Enter value for ${field.label}`} 
                      required 
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomField(field.id)}
                      className="absolute top-0 right-0 p-1 text-red-500 bg-white rounded-bl-md hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                      title={`Remove custom field: ${field.label}`}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
            <hr className="my-6" />

            {/* --- 5. Required Documents Section (Keep existing logic) --- */}
            <section className="space-y-4">
              <FormSectionHeader step={5} title="Required Documents Upload" />
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <label className="block text-sm font-bold text-gray-700 mb-2">Select or Search Document Type</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <AutoComplete
                    value={selectedDocument} 
                    suggestions={filteredDocumentSuggestions} 
                    completeMethod={searchDocumentSuggestions}
                    onChange={(e) => setSelectedDocument(e.value)} 
                    field="name"
                    placeholder="Search or select document type"
                    dropdown
                    itemTemplate={(item) => itemTemplate(item as DocOption, 'name')}
                    className="flex-1 w-full"
                    inputClassName="p-inputtext p-component w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 transition text-sm"
                  />
                  <button type="button" onClick={handleAddDocument} disabled={typeof selectedDocument !== 'object' || !selectedDocument}
                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold flex items-center justify-center gap-1 shadow-sm text-sm disabled:opacity-50">
                    <Plus size={16} /> Add Doc
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {documents.length === 0 ? (
                  <div className="p-4 text-center bg-white rounded-lg border-2 border-dashed border-gray-300">
                    <File className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 font-semibold text-sm">No documents added yet</p>
                  </div>
                ) : (
                  documents.map((doc) => (
                    <div key={doc.id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                      <button
                        type="button"
                        onClick={() => toggleDocumentExpand(doc.id)}
                        className={`w-full p-3 flex items-center justify-between transition-colors text-left ${
                          expandedDocId === doc.id ? "bg-blue-50 border-b border-blue-200" : "bg-white hover:bg-gray-50"
                        }`}>
                        <div className="flex items-center gap-3">
                          <File size={18} className="text-blue-600" />
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{doc.name} <span className="text-red-500">*</span></p>
                            {doc.file ? (
                              <p className="text-xs text-green-700 flex items-center gap-1">
                                <CheckCircle size={12} /> Uploaded: {doc.file.name}
                              </p>
                            ) : (
                              <p className="text-xs text-red-500">File required - Click to upload</p>
                            )}
                          </div>
                        </div>
                        <div className="text-gray-400 text-xs">{expandedDocId === doc.id ? "▼" : "▶"}</div>
                      </button>

                      {expandedDocId === doc.id && (
                        <div className="p-3 bg-white border-t border-gray-100 space-y-2">
                          {doc.file ? (
                            <div className="flex flex-col sm:flex-row items-center justify-between p-2 bg-green-50 border border-green-200 rounded-md">
                              <div>
                                <p className="text-xs font-medium text-green-900">{doc.file.name}</p>
                                <p className="text-xs text-green-700">{(doc.file.size / 1024).toFixed(2)} KB</p>
                              </div>
                              <label className="text-blue-600 hover:text-blue-700 cursor-pointer text-xs font-medium mt-1 sm:mt-0">
                                Change File
                                <input type="file" onChange={(e) => handleDocumentUpload(e, doc.id)} className="hidden"
                                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"/>
                              </label>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-blue-300 rounded-md hover:border-blue-500 hover:bg-blue-50 cursor-pointer">
                              <Upload className="w-6 h-6 text-blue-600 mb-1" />
                              <span className="text-sm font-medium text-blue-700">Click to upload **{doc.name}**</span>
                              <span className="text-xs text-gray-600 mt-0">or drag and drop</span>
                              <input type="file" onChange={(e) => handleDocumentUpload(e, doc.id)} className="hidden"
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"/>
                            </label>
                          )}
                        </div>
                      )}

                      <div className="px-3 py-1 bg-gray-50 border-t border-gray-100 flex justify-between">
                        <p className="text-xs text-gray-500 italic">Required for submission</p>
                        <button
                          type="button"
                          onClick={() => handleRemoveDocument(doc.id)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded-md transition flex items-center gap-1 text-xs font-medium"
                          title="Remove document">
                            <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
            <hr className="my-6" />


            {/* --- 6. Academic Information (Full Section from Image 2) --- */}
            <section className="space-y-6">
              <FormSectionHeader step={6} title="Academic Information" />
             
              <h4 className="text-lg font-bold text-gray-700 mt-4">Details of Institutions where you studied and passed</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">Examination</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Month & Year of Passing <span className="text-red-500">*</span></th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">Name & Address of the Institute <span className="text-red-500">*</span></th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">Name of the Board <span className="text-red-500">*</span></th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Aggregate Percentage <span className="text-red-500">*</span></th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Seat No. <span className="text-red-500">*</span></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 text-sm">
                    {/* S.S.C (Std. X) */}
                    <tr>
                      <td className="px-3 py-2 whitespace-nowrap font-medium">S.S.C (Std. X) or Equivalent</td>
                      <td><input type="text" name="ssc_monthYear" value={formData.ssc_monthYear} onChange={handleChange} required placeholder="Month/Year" className="w-full p-1 border border-gray-300 rounded-md text-sm" /></td>
                      <td><input type="text" name="ssc_institute" value={formData.ssc_institute} onChange={handleChange} required placeholder="Institute Name/Address" className="w-full p-1 border border-gray-300 rounded-md text-sm" /></td>
                      <td><input type="text" name="ssc_board" value={formData.ssc_board} onChange={handleChange} required placeholder="Board Name" className="w-full p-1 border border-gray-300 rounded-md text-sm" /></td>
                      <td><input type="text" name="ssc_aggPercent" value={formData.ssc_aggPercent} onChange={handleChange} required placeholder="Percentage" className="w-full p-1 border border-gray-300 rounded-md text-sm" /></td>
                      <td><input type="text" name="ssc_seatNo" value={formData.ssc_seatNo} onChange={handleChange} required placeholder="Seat No." className="w-full p-1 border border-gray-300 rounded-md text-sm" /></td>
                    </tr>
                    {/* H.S.C (Std. XII) */}
                    <tr>
                      <td className="px-3 py-2 whitespace-nowrap font-medium">H.S.C (Std. XII) or Equivalent</td>
                      <td><input type="text" name="hsc_monthYear" value={formData.hsc_monthYear} onChange={handleChange} required placeholder="Month/Year" className="w-full p-1 border border-gray-300 rounded-md text-sm" /></td>
                      <td><input type="text" name="hsc_institute" value={formData.hsc_institute} onChange={handleChange} required placeholder="Institute Name/Address" className="w-full p-1 border border-gray-300 rounded-md text-sm" /></td>
                      <td><input type="text" name="hsc_board" value={formData.hsc_board} onChange={handleChange} required placeholder="Board Name" className="w-full p-1 border border-gray-300 rounded-md text-sm" /></td>
                      <td><input type="text" name="hsc_aggPercent" value={formData.hsc_aggPercent} onChange={handleChange} required placeholder="Percentage" className="w-full p-1 border border-gray-300 rounded-md text-sm" /></td>
                      <td><input type="text" name="hsc_seatNo" value={formData.hsc_seatNo} onChange={handleChange} required placeholder="Seat No." className="w-full p-1 border border-gray-300 rounded-md text-sm" /></td>
                    </tr>
                    {/* Diploma */}
                    <tr>
                      <td className="px-3 py-2 whitespace-nowrap font-medium">Diploma</td>
                      <td><input type="text" name="diploma_monthYear" value={formData.diploma_monthYear} onChange={handleChange} placeholder="Month/Year" className="w-full p-1 border border-gray-300 rounded-md text-sm" /></td>
                      <td><input type="text" name="diploma_institute" value={formData.diploma_institute} onChange={handleChange} placeholder="Institute Name/Address" className="w-full p-1 border border-gray-300 rounded-md text-sm" /></td>
                      <td><input type="text" name="diploma_board" value={formData.diploma_board} onChange={handleChange} placeholder="Board Name" className="w-full p-1 border border-gray-300 rounded-md text-sm" /></td>
                      <td><input type="text" name="diploma_aggPercent" value={formData.diploma_aggPercent} onChange={handleChange} placeholder="Percentage" className="w-full p-1 border border-gray-300 rounded-md text-sm" /></td>
                      <td><input type="text" name="diploma_seatNo" value={formData.diploma_seatNo} onChange={handleChange} placeholder="Seat No." className="w-full p-1 border border-gray-300 rounded-md text-sm" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h4 className="text-lg font-bold text-gray-700 mt-6">Details of Marks (Please write digits appropriately)</h4>
             
              <InputGroup label="Roll Number/Seat No. (for HSC/SSC details)" name="rollNumber" type="text" value={formData.ssc_seatNo} onChange={handleChange} placeholder="Roll/Seat Number" required />


              {/* S.S.C. (Std. X) Marks */}
              <div className="p-4 border rounded-lg">
                <p className="font-semibold mb-3">S.S.C. (Std. X) Marks</p>
                <div className="grid grid-cols-6 gap-4">
                  <span className="col-span-2 text-sm font-medium">Subject</span>
                  <span className="col-span-2 text-sm font-medium text-center">Marks Obtained <span className="text-red-500">*</span></span>
                  <span className="col-span-2 text-sm font-medium text-center">Out of <span className="text-red-500">*</span></span>
                 
                  <span className="col-span-2 text-sm">Mathematics</span>
                  <input type="number" name="ssc_maths_obtained" value={formData.ssc_maths_obtained} onChange={handleChange} required placeholder="Obtained" className="col-span-2 p-2 border rounded-md text-sm text-center" />
                  <input type="number" name="ssc_maths_outOf" value={formData.ssc_maths_outOf} onChange={handleChange} required placeholder="Out of" className="col-span-2 p-2 border rounded-md text-sm text-center" />

                  <span className="col-span-2 text-sm">Science</span>
                  <input type="number" name="ssc_science_obtained" value={formData.ssc_science_obtained} onChange={handleChange} required placeholder="Obtained" className="col-span-2 p-2 border rounded-md text-sm text-center" />
                  <input type="number" name="ssc_science_outOf" value={formData.ssc_science_outOf} onChange={handleChange} required placeholder="Out of" className="col-span-2 p-2 border rounded-md text-sm text-center" />
                 
                  <span className="col-span-2 text-sm font-bold">Aggregate Marks</span>
                  <input type="number" name="ssc_aggMarks_obtained" value={formData.ssc_aggMarks_obtained} onChange={handleChange} required placeholder="Obtained" className="col-span-2 p-2 border rounded-md text-sm text-center" />
                  <input type="number" name="ssc_aggMarks_outOf" value={formData.ssc_aggMarks_outOf} onChange={handleChange} required placeholder="Out of" className="col-span-2 p-2 border rounded-md text-sm text-center" />
                </div>
              </div>

              {/* H.S.C. (Std. XII) Marks */}
              <div className="p-4 border rounded-lg">
                <p className="font-semibold mb-3">H.S.C. (Std. XII) Marks</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <InputGroup label="Marks obtained in Physics (Out of 100)" name="hsc_physics_obtained" type="number" value={formData.hsc_physics_obtained} onChange={handleChange} placeholder="Obtained" required />
                  <InputGroup label="Marks obtained in Mathematics (Out of 100)" name="hsc_maths_obtained" type="number" value={formData.hsc_maths_obtained} onChange={handleChange} placeholder="Obtained" required />
                  <InputGroup 
                    label="Marks obtained in Chemistry/Biology/Technical/Vocational (Out of 100)" 
                    name="hsc_bioChemVoc_obtained" 
                    type="number" 
                    value={formData.hsc_bioChemVoc_obtained} 
                    onChange={handleChange} 
                    placeholder="Obtained" 
                    required 
                    className="md:col-span-2"
                  />
                  <InputGroup 
                    label="Marks obtained out of 300 P+M/C+B/Tech/Vocational" 
                    name="hsc_pcbm_obtained" 
                    type="number" 
                    value={formData.hsc_pcbm_obtained} 
                    onChange={handleChange} 
                    placeholder="Total PCM/PCB" 
                    required 
                    className="md:col-span-2"
                  />
                  <InputGroup label="Total Marks Obtained" name="hsc_totalMarks_obtained" type="number" value={formData.hsc_totalMarks_obtained} onChange={handleChange} placeholder="Total Obtained" required />
                  <InputGroup label="Total Marks Out of" name="hsc_totalMarks_outOf" type="number" value={formData.hsc_totalMarks_outOf} onChange={handleChange} placeholder="Total Out Of" required />
                </div>
              </div>

              {/* MHT-CET Marks */}
              <div className="p-4 border rounded-lg">
                <p className="font-semibold mb-3">MHT-CET Details (If Applicable)</p>
                <InputGroup label="MHT-CET Seat Number" name="mhtcet_seatNumber" type="text" value={formData.mhtcet_seatNumber} onChange={handleChange} placeholder="MHT-CET Seat Number" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                  <InputGroup label="Physics (Out of 100)" name="mhtcet_phy_obtained" type="number" value={formData.mhtcet_phy_obtained} onChange={handleChange} placeholder="Score" />
                  <InputGroup label="Chemistry (Out of 100)" name="mhtcet_chem_obtained" type="number" value={formData.mhtcet_chem_obtained} onChange={handleChange} placeholder="Score" />
                  <InputGroup label="Mathematics (Out of 100)" name="mhtcet_maths_obtained" type="number" value={formData.mhtcet_maths_obtained} onChange={handleChange} placeholder="Score" />
                  <InputGroup label="Biology (Out of 100)" name="mhtcet_bio_obtained" type="number" value={formData.mhtcet_bio_obtained} onChange={handleChange} placeholder="Score" />
                  <InputGroup label="Total PCM Percentile" name="mhtcet_pcm_percentile" type="text" value={formData.mhtcet_pcm_percentile} onChange={handleChange} placeholder="Percentile" className="md:col-span-2" />
                  <InputGroup label="Total PCB Percentile" name="mhtcet_pcb_percentile" type="text" value={formData.mhtcet_pcb_percentile} onChange={handleChange} placeholder="Percentile" className="md:col-span-2" />
                </div>
              </div>

              {/* JEE MAIN Marks */}
              <div className="p-4 border rounded-lg">
                <p className="font-semibold mb-3">JEE MAIN PAPER-1 Details (If Applicable)</p>
                <InputGroup label="JEE MAIN Seat Number" name="jee_main_seatNumber" type="text" value={formData.jee_main_seatNumber} onChange={handleChange} placeholder="JEE MAIN Seat Number" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                  <InputGroup label="Physics (Out of 100)" name="jee_main_phy_obtained" type="number" value={formData.jee_main_phy_obtained} onChange={handleChange} placeholder="Marks Obtained" />
                  <InputGroup label="Chemistry (Out of 100)" name="jee_main_chem_obtained" type="number" value={formData.jee_main_chem_obtained} onChange={handleChange} placeholder="Marks Obtained" />
                  <InputGroup label="Mathematics (Out of 100)" name="jee_main_maths_obtained" type="number" value={formData.jee_main_maths_obtained} onChange={handleChange} placeholder="Marks Obtained" />
                  <InputGroup label="P+C+M (Out of 300)" name="jee_main_pcM_obtained" type="number" value={formData.jee_main_pcM_obtained} onChange={handleChange} placeholder="Marks Obtained" />
                </div>
              </div>

              {/* NATA Test Details */}
              <div className="p-4 border rounded-lg">
                <p className="font-semibold mb-3">NATA Test Details (For Architecture)</p>
                <InputGroup label="NATA Test Seat Number" name="nata_test_seatNo" type="text" value={formData.nata_test_seatNo} onChange={handleChange} placeholder="Seat Number" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                    <InputGroup label="NATA Marks Obtained" name="nata_marks_obtained" type="number" value={formData.nata_marks_obtained} onChange={handleChange} placeholder="Marks" />
                    <InputGroup label="NATA Marks Out Of" name="nata_marks_outOf" type="number" value={formData.nata_marks_outOf} onChange={handleChange} placeholder="Out of" />
                    <InputGroup label="Month & Year of Passing" name="nata_monthYear" type="text" value={formData.nata_monthYear} onChange={handleChange} placeholder="Month/Year" />
                </div>
              </div>
             
              {/* Diploma / B.Sc. Marks (For Direct Second Year) */}
              <div className="p-4 border rounded-lg">
                <p className="font-semibold mb-3">DIPLOMA / B.Sc. MARKS (To be filled by students seeking Direct Second Year to Engineering/Pharmacy/First Year Architecture)</p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <InputGroup label="Institute Name & Code" name="direct_second_year_instituteNameCode" type="text" value={formData.direct_second_year_instituteNameCode} onChange={handleChange} placeholder="Institute Name/Code" className="md:col-span-2" />
                  <InputGroup label="Name of Technical Board" name="direct_second_year_technicalBoard" type="text" value={formData.direct_second_year_technicalBoard} onChange={handleChange} placeholder="Board Name" className="md:col-span-2" />
                  <InputGroup label="Branch Name" name="direct_second_year_branchName" type="text" value={formData.direct_second_year_branchName} onChange={handleChange} placeholder="Branch" className="md:col-span-4" />
                  <InputGroup label="Aggregate Marks of Final Year Obtained" name="direct_second_year_aggMarks_obtained" type="number" value={formData.direct_second_year_aggMarks_obtained} onChange={handleChange} placeholder="Obtained" className="md:col-span-2" />
                  <InputGroup label="Aggregate Marks of Final Year Out Of" name="direct_second_year_aggMarks_outOf" type="number" value={formData.direct_second_year_aggMarks_outOf} onChange={handleChange} placeholder="Out of" className="md:col-span-2" />
                </div>
              </div>

            </section>
            <hr className="my-6" />

            {/* --- Messages --- */}
            {successMessage && (
              <div className="p-3 rounded-md bg-green-50 border-2 border-green-300 flex items-start gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-green-800 font-medium">{successMessage}</p>
              </div>
            )}
            {errorMessage && (
              <div className="p-3 rounded-md bg-red-50 border-2 border-red-300 flex items-start gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-800 font-medium">{errorMessage}</p>
              </div>
            )}

            {/* --- Submit Button --- */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t-2 border-gray-200">
              <button
                type="submit"
                disabled={isSubmitting || documents.some(doc => !doc.file) || customFields.some(field => field.value.trim() === "") || payableFee === null || loadingFees || !colorPhotograph || selectedBranches.length === 0}
                className="flex-1 py-3 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed text-base"
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-3 bg-gray-200 text-gray-900 font-bold rounded-md hover:bg-gray-300 transition text-base"
              >
                Reset Form
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}