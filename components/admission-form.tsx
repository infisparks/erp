"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Upload, Trash2, Plus, File, CheckCircle, X, Loader2 } from "lucide-react"

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
}) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1">
      {label}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      placeholder={placeholder}
      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-colors bg-white shadow-sm text-sm ${className}`}
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

interface CustomField {
  id: string
  label: string
  value: string
}

// --- Data structures for fetched options ---
interface FieldOption {
    label: string;
    type: string;
}
interface DocOption {
    name: string;
    description: string;
}
interface CourseOption {
    id: string;
    name: string;
}
interface SemesterOption {
    id: string;
    name: string;
    course_id: string;
}
interface CategoryOption {
    name: string;
    description: string;
}
// NEW Admission Type
interface AdmissionTypeOption {
    name: string;
}

// --- Updated FormData structure ---
interface FormData {
  firstName: string
  middleName: string
  lastName: string
  email: string
  phone: string
  secondary_phone: string;
  family_phone: string;
  dateOfBirth: string;
  rollNumber: string;
  address: string;
  city: string
  state: string
  zipCode: string
  
  admission_year: string;
  course_id: string;
  semester_id: string; // <-- ADDED
  admission_category: string;
  admission_type: string; // <-- ADDED
}

// --- AdmissionForm Component ---
export default function AdmissionForm({ user }: AdmissionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null)
  
  // --- Dynamic Option States ---
  const [availableCustomFields, setAvailableCustomFields] = useState<FieldOption[]>([])
  const [availableDocuments, setAvailableDocuments] = useState<DocOption[]>([])
  const [availableCourses, setAvailableCourses] = useState<CourseOption[]>([])
  const [allSemesters, setAllSemesters] = useState<SemesterOption[]>([]) // <-- ADDED
  const [availableCategories, setAvailableCategories] = useState<CategoryOption[]>([])
  const [availableAdmissionTypes, setAvailableAdmissionTypes] = useState<AdmissionTypeOption[]>([]) // <-- ADDED
  const [admissionYears, setAdmissionYears] = useState<string[]>([])

  // --- State for Admission Fees ---
  const [admissionFees, setAdmissionFees] = useState<number | null>(null)
  const [loadingFees, setLoadingFees] = useState(false)

  // AutoComplete States
  const [selectedCustomField, setSelectedCustomField] = useState<FieldOption | string>("")
  const [filteredCustomFieldSuggestions, setFilteredCustomFieldSuggestions] = useState<FieldOption[]>([])
  const [selectedDocument, setSelectedDocument] = useState<DocOption | string>("")
  const [filteredDocumentSuggestions, setFilteredDocumentSuggestions] = useState<DocOption[]>([])

  // --- Standard Form Data (UPDATED) ---
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phone: "",
    secondary_phone: "",
    family_phone: "",
    dateOfBirth: "",
    rollNumber: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    admission_year: new Date().getFullYear().toString(),
    course_id: "",
    semester_id: "", // <-- ADDED
    admission_category: "",
    admission_type: "", // <-- ADDED
  })

  // Dynamic Custom Fields & Documents
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [documents, setDocuments] = useState<DocumentItem[]>([])

  // --- Data Fetching (UPDATED) ---
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    setAdmissionYears([
      (currentYear + 1).toString(),
      currentYear.toString(),
      (currentYear - 1).toString(),
      (currentYear - 2).toString()
    ]);
    
    const fetchFormConfig = async () => {
      try {
        const supabase = getSupabaseClient()
        
        // Fetch all configs in parallel
        const [customData, docData, courseData, categoryData, semesterData, admissionTypeData] = await Promise.all([
          supabase.from("form_config").select("data_jsonb").eq("data_name", "custom_field_options").single(),
          supabase.from("form_config").select("data_jsonb").eq("data_name", "document_options").single(),
          supabase.from("courses").select("id, name").order("name"),
          supabase.from("form_config").select("data_jsonb").eq("data_name", "fee_categories").single(),
          supabase.from("semesters").select("id, name, course_id"), // <-- Fetch all semesters
          supabase.from("form_config").select("data_jsonb").eq("data_name", "admission_types").single() // <-- Fetch admission types
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

  // --- Derived State: Available Semesters ---
  const availableSemesters = useMemo(() => {
    if (!formData.course_id) return [];
    return allSemesters
      .filter(sem => sem.course_id === formData.course_id)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })); // Sorts "Semester 1", "Semester 2"
  }, [formData.course_id, allSemesters]);

  // --- Effect to auto-select semester ---
  useEffect(() => {
    if (formData.course_id && availableSemesters.length > 0) {
      // Find "Semester 1" or default to the first in the list
      const defaultSem = availableSemesters.find(s => s.name.toLowerCase() === "semester 1") || availableSemesters[0];
      if (defaultSem) {
        setFormData(prev => ({ ...prev, semester_id: defaultSem.id }));
      }
    } else {
      // Clear semester if course is cleared
      setFormData(prev => ({ ...prev, semester_id: "" }));
    }
  }, [formData.course_id, availableSemesters]);

  // --- Effect to fetch fees ---
  useEffect(() => {
    const fetchFees = async () => {
      if (formData.course_id && formData.admission_category) {
        setLoadingFees(true);
        setAdmissionFees(null);
        setErrorMessage("");
        
        try {
          const supabase = getSupabaseClient();
          const { data, error } = await supabase
            .from("course_fees")
            .select("amount")
            .eq("course_id", formData.course_id)
            .eq("category_name", formData.admission_category)
            .single();

          if (error) {
            if (error.code === 'PGRST116') {
              setErrorMessage(`No fee structure found for this course and category combination.`);
            } else {
              throw error;
            }
          }
          
          if (data) {
            setAdmissionFees(data.amount);
            setErrorMessage("");
          } else {
            setAdmissionFees(null);
          }
          
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

  // --- Handlers ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }
  
  const handleDropdownChange = (e: DropdownChangeEvent) => {
     const { name, value } = e.target;
     setFormData((prev) => ({ ...prev, [name]: value }))
  }

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
      
      const newDoc: DocumentItem = {
        id: Date.now().toString(),
        name: cleanDocName,
      }
      setDocuments((prev) => [...prev, newDoc])
      setExpandedDocId(newDoc.id)
      setSelectedDocument("") 
      setErrorMessage("")
    }
  }

  const toggleDocumentExpand = (docId: string) => {
    setExpandedDocId(expandedDocId === docId ? null : docId)
  }

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
      setFormData({
        firstName: "",
        middleName: "",
        lastName: "",
        email: "",
        phone: "",
        secondary_phone: "",
        family_phone: "",
        dateOfBirth: "",
        rollNumber: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        admission_year: new Date().getFullYear().toString(),
        course_id: "",
        semester_id: "", // <-- ADDED
        admission_category: "",
        admission_type: "", // <-- ADDED
      })
      setCustomFields([])
      setDocuments([])
      setExpandedDocId(null)
      setSelectedCustomField("")
      setSelectedDocument("")
      setAdmissionFees(null)
      setErrorMessage("")
      setSuccessMessage("")
  }
  
  // --- Form Submission (UPDATED) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSuccessMessage("")
    setErrorMessage("")

    const requiredFields: (keyof FormData)[] = [
        "firstName", "lastName", "email", "phone", "dateOfBirth", "rollNumber",
        "address", "city", "state", "zipCode",
        "admission_year", "course_id", "semester_id", // <-- ADDED
        "admission_category", "admission_type" // <-- ADDED
    ];

    for (const field of requiredFields) {
        if (!formData[field] || (typeof formData[field] === 'string' && !(formData[field] as string).trim()) ) {
            let label = field.replace(/([A-Z])/g, ' $1').replace("_", " ").trim()
            label = label.charAt(0).toUpperCase() + label.slice(1);
            setErrorMessage(`Validation Error: The field "${label}" is required.`);
            setIsSubmitting(false);
            return; 
        }
    }
    
    if (admissionFees === null) {
        setErrorMessage("Validation Error: Admission fees could not be determined. Please check the course and category selection.");
        setIsSubmitting(false);
        return;
    }
    
    if (documents.some(doc => !doc.file)) {
      setErrorMessage("Please upload a file for all added document types.");
      setIsSubmitting(false);
      return;
    }
    if (customFields.some(field => field.value.trim() === "")) {
      setErrorMessage("Please fill in a value for all custom fields.");
      setIsSubmitting(false);
      return;
    }

    try {
      const supabase = getSupabaseClient()
      const rollNumber = formData.rollNumber.trim();

      // --- File Upload Logic ---
      const bucketName = 'student_documents';
      const uploadedDocumentsData = [];

      for (const doc of documents) {
        if (!doc.file) {
          throw new Error(`File not found for document: ${doc.name}`);
        }
        
        const cleanDocName = doc.name.replace(/[^a-zA-Z0-9]/g, '_');
        const fileExt = doc.file.name.split('.').pop();
        const uniqueFileName = `${cleanDocName}-${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${rollNumber}/${uniqueFileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, doc.file);

        if (uploadError) {
          throw new Error(`Failed to upload ${doc.name}: ${uploadError.message}`);
        }
        
        uploadedDocumentsData.push({
          name: doc.name,
          path: uploadData.path, 
          fileName: doc.file.name,
          fileType: doc.file.type,
        });
      }
      
      // Prepare Custom Data
      const customData = customFields.reduce((acc, field) => {
          acc[field.label] = field.value.trim();
          return acc;
      }, {} as Record<string, string>);

      
      // Clean the rest of the form data
      const cleanedFormData = Object.fromEntries(
          Object.entries(formData).map(([key, value]) => [key, (value as string).trim()])
      ) as unknown as FormData;


      // Prepare the final object for insertion
      const dataToInsert = {
        user_id: user.id,
        
        firstname: cleanedFormData.firstName,
        middlename: cleanedFormData.middleName,
        lastname: cleanedFormData.lastName,        
        dateofbirth: cleanedFormData.dateOfBirth,    
        zipcode: cleanedFormData.zipCode,
        
        "rollNumber": cleanedFormData.rollNumber, 

        email: cleanedFormData.email,
        phone: cleanedFormData.phone,
        secondary_phone: cleanedFormData.secondary_phone,
        family_phone: cleanedFormData.family_phone,
        address: cleanedFormData.address,
        city: cleanedFormData.city,
        state: cleanedFormData.state,
        
        admission_year: cleanedFormData.admission_year,
        course_id: cleanedFormData.course_id,
        semester_id: cleanedFormData.semester_id, // <-- ADDED
        admission_category: cleanedFormData.admission_category,
        admission_type: cleanedFormData.admission_type, // <-- ADDED
        admission_fees: admissionFees,
        
        documents: uploadedDocumentsData,
        custom_data: customData,
      };

      // Insert into 'students' table
      const { error: insertError } = await supabase
        .from("students")
        .insert([ dataToInsert ]); 

      if (insertError) throw insertError

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
  
  // Custom template for displaying AutoComplete options
  const itemTemplate = (item: FieldOption | DocOption, key: 'label' | 'name') => {
      const text = (item as any)[key]
      return <div className="p-2 text-sm hover:bg-gray-100">{text}</div>;
  };
  
  // --- Render ---
  return (
    <div className="max-w-4xl mx-auto py-2 md:py-4">
      <Card className="border-0 shadow-lg rounded-lg overflow-hidden bg-white">
        <CardHeader className="bg-gradient-to-r from-blue-700 to-blue-900 text-white p-4 md:p-6">
          <CardTitle className="text-3xl font-extrabold tracking-tight">Enrollment Application</CardTitle>
          <CardDescription className="text-blue-200 text-base mt-1">
            Complete all sections (* required).
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 md:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* --- 1. Academic Details (UPDATED) --- */}
            <section className="space-y-4">
              <FormSectionHeader step={1} title="Academic Details" />
              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Admission Year *</label>
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
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Select Course *</label>
                  <Dropdown
                    name="course_id"
                    value={formData.course_id}
                    options={availableCourses}
                    onChange={(e) => {
                      handleDropdownChange(e);
                      // Clear semester when course changes, it will be auto-set by effect
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
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Select Semester *</label>
                  <Dropdown
                    name="semester_id"
                    value={formData.semester_id}
                    options={availableSemesters} // Use the derived list
                    onChange={handleDropdownChange}
                    optionLabel="name"
                    optionValue="id"
                    placeholder="Select Semester"
                    required
                    disabled={!formData.course_id} // Disable until course is selected
                    className="w-full p-inputtext-sm"
                  />
                </div>
              </div>
              
              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Admission Category *</label>
                  <Dropdown
                    name="admission_category"
                    value={formData.admission_category}
                    options={availableCategories}
                    onChange={handleDropdownChange}
                    optionLabel="name"
                    optionValue="name"
                    placeholder="Select a Category"
                    required
                    className="w-full p-inputtext-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Admission Type *</label>
                  <Dropdown
                    name="admission_type"
                    value={formData.admission_type}
                    options={availableAdmissionTypes}
                    onChange={handleDropdownChange}
                    optionLabel="name"
                    optionValue="name"
                    placeholder="Select Admission Type"
                    required
                    className="w-full p-inputtext-sm"
                  />
                </div>
              </div>

              {/* Fee Display Box */}
              {(formData.course_id || formData.admission_category) && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center text-center">
                  {loadingFees ? (
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  ) : (
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Admission Fees</label>
                      <p className={`text-3xl font-bold ${admissionFees !== null ? 'text-green-700' : 'text-gray-500'}`}>
                        {admissionFees !== null 
                          ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(admissionFees)
                          : '---'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </section>
            
            {/* --- 2. Personal Information Section --- */}
            <section className="space-y-4">
              <FormSectionHeader step={2} title="Personal Details" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InputGroup label="First Name *" name="firstName" type="text" value={formData.firstName} onChange={handleChange} placeholder="First name" required />
                    <InputGroup label="Middle Name" name="middleName" type="text" value={formData.middleName} onChange={handleChange} placeholder="Middle name" />
                    <InputGroup label="Last Name *" name="lastName" type="text" value={formData.lastName} onChange={handleChange} placeholder="Last name" required />
                  </div>
                </div>
                <InputGroup label="Email Address *" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Your email" required />
                <InputGroup label="Roll Number *" name="rollNumber" type="text" value={formData.rollNumber} onChange={handleChange} placeholder="Your Roll Number" required />
                <InputGroup label="Primary Phone *" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="Mobile number" required />
                <InputGroup label="Date of Birth *" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} required />
                <InputGroup label="Secondary Phone (Opt.)" name="secondary_phone" type="tel" value={formData.secondary_phone} onChange={handleChange} placeholder="Optional number" />
                <InputGroup label="Family Contact (Opt.)" name="family_phone" type="tel" value={formData.family_phone} onChange={handleChange} placeholder="Family/Emergency" />
              </div>
            </section>

            {/* --- 3. Address Section --- */}
            <section className="space-y-4">
              <FormSectionHeader step={3} title="Current Address" />
              <div className="space-y-4">
                <InputGroup label="Street Address *" name="address" type="text" value={formData.address} onChange={handleChange} placeholder="Street address" required />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <InputGroup label="City *" name="city" type="text" value={formData.city} onChange={handleChange} placeholder="City" required />
                  <InputGroup label="State *" name="state" type="text" value={formData.state} onChange={handleChange} placeholder="State" required />
                  <InputGroup label="ZIP Code *" name="zipCode" type="text" value={formData.zipCode} onChange={handleChange} placeholder="ZIP Code" required />
                </div>
              </div>
            </section>

            {/* --- 4. Custom Fields Section --- */}
            <section className="space-y-4">
              <FormSectionHeader step={4} title="Additional Information" />
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

            {/* --- 5. Documents Section --- */}
            <section className="space-y-4">
              <FormSectionHeader step={5} title="Required Documents" />
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
                            <p className="font-semibold text-gray-900 text-sm">{doc.name} *</p>
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
                disabled={isSubmitting || documents.some(doc => !doc.file) || customFields.some(field => field.value.trim() === "") || admissionFees === null || loadingFees}
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