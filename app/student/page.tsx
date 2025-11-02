// app/dashboard/students/page.tsx
"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"

// --- UI Components ---
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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
} from "lucide-react"

// --- PrimeReact Components ---
import { DataTable } from "primereact/datatable"
import { Column } from "primereact/column"
import { Dialog } from "primereact/dialog"
import { Dropdown } from 'primereact/dropdown';
import { AutoComplete, AutoCompleteCompleteEvent } from 'primereact/autocomplete';

// --- PrimeReact CSS ---
import "primereact/resources/themes/saga-blue/theme.css"
import "primereact/resources/primereact.min.css"
import "primeicons/primeicons.css"

// --- Type Definitions ---

interface StudentList {
  id: string
  fullname: string | null
  email: string
  phone: string
  "rollNumber": string
  status: string
  created_at: string
}

interface StudentDocument {
  name: string;
  path: string;
  fileName: string;
  fileType: string;
}

interface StudentDetail {
  id: string
  user_id: string
  created_at: string
  firstname: string
  middlename: string | null
  lastname: string
  fullname: string | null
  email: string
  phone: string
  secondary_phone: string | null
  family_phone: string | null
  dateofbirth: string
  address: string
  city: string
  state: string
  zipcode: string
  "rollNumber": string
  status: string
  custom_data: Record<string, string> | null
  documents: StudentDocument[] | null
}

interface FileToAdd {
  id: string;
  name: string;
  file: File;
}

interface FieldOption {
    label: string;
    type: string;
}
interface DocOption {
    name: string;
    description: string;
}

const statusOptions = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

// -------------------------------------------------------------------
// 🔧 FIX: HELPER COMPONENTS MOVED OUTSIDE 🔧
// 
// By defining these components here (outside StudentListPage),
// they won't be re-created on every state change, which fixes
// the input focus-losing bug.
// -------------------------------------------------------------------

/**
 * Helper component for read-only detail items in view mode
 */
const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
    <p className="md:col-span-1 text-sm font-semibold text-gray-600">{label}</p>
    <div className="md:col-span-2 text-sm text-gray-900 break-words">{value || "N/A"}</div>
  </div>
)

/**
 * Helper component for rendering a downloadable document link
 */
const DocumentLinkItem: React.FC<{ doc: StudentDocument }> = ({ doc }) => {
  // This is safe to call here as getSupabaseClient() is not a hook
  const supabase = getSupabaseClient()
  const { data: { publicUrl } } = supabase
    .storage
    .from('student_documents')
    .getPublicUrl(doc.path)

  return (
     <a
      href={publicUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between p-2 bg-white rounded-md border border-gray-200 hover:bg-gray-50 group"
    >
      <div className="flex items-center gap-2">
        <File className="w-4 h-4 text-blue-600" />
        <div>
          <p className="text-sm font-medium text-blue-700 group-hover:underline">{doc.name}</p>
          <p className="text-xs text-gray-500">{doc.fileName}</p>
        </div>
      </div>
      <Download className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
    </a>
  )
}

/**
 * Helper component for a consistent form input group
 */
const FormInputGroup: React.FC<{
  label: string,
  name: string,
  value: string,
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
  type?: string,
  required?: boolean,
  placeholder?: string
  className?: string
}> = ({ label, name, value, onChange, type = "text", required = false, placeholder = "", className = "" }) => (
  <div className={`space-y-1 ${className}`}>
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

// -------------------------------------------------------------------
// END OF FIX
// -------------------------------------------------------------------


/**
 * Main Student List Page
 */
export default function StudentListPage() {
  // --- Page State ---
  const [students, setStudents] = useState<StudentList[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [globalFilter, setGlobalFilter] = useState("")

  // --- Modal State ---
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [modalMode, setModalMode] = useState<"view" | "edit">("view")
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // --- Data State ---
  const [currentStudent, setCurrentStudent] = useState<StudentDetail | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<StudentDetail>>({})
  
  // --- Document Management State ---
  const [filesToAdd, setFilesToAdd] = useState<FileToAdd[]>([]);
  const [filesToRemove, setFilesToRemove] = useState<StudentDocument[]>([]);
  const [newDocFile, setNewDocFile] = useState<File | null>(null);

  // --- AutoComplete & Form Config State ---
  const [availableCustomFields, setAvailableCustomFields] = useState<FieldOption[]>([])
  const [availableDocuments, setAvailableDocuments] = useState<DocOption[]>([])
  
  const [selectedCustomField, setSelectedCustomField] = useState<FieldOption | string>("")
  const [filteredCustomFieldSuggestions, setFilteredCustomFieldSuggestions] = useState<FieldOption[]>([])
  
  const [selectedDocument, setSelectedDocument] = useState<DocOption | string>("")
  const [filteredDocumentSuggestions, setFilteredDocumentSuggestions] = useState<DocOption[]>([])

  // --- Data Fetching (Students) ---
  useEffect(() => {
    fetchStudents()
  }, [])

  // --- Data Fetching (Form Config) ---
  useEffect(() => {
    const fetchFormConfig = async () => {
      try {
        const supabase = getSupabaseClient()
        
        // Fetch Custom Field Options
        const { data: customData, error: customError } = await supabase
          .from("form_config")
          .select("data_jsonb")
          .eq("data_name", "custom_field_options")
          .single()
        
        if (customError) throw customError;
        if (customData) setAvailableCustomFields(customData.data_jsonb as FieldOption[])

        // Fetch Document Options
        const { data: docData, error: docError } = await supabase
          .from("form_config")
          .select("data_jsonb")
          .eq("data_name", "document_options")
          .single()
        
        if (docError) throw docError;
        if (docData) setAvailableDocuments(docData.data_jsonb as DocOption[])

      } catch (error) {
        console.error("Error fetching form config:", error)
        setError("Failed to load form configuration options.")
      }
    }
    fetchFormConfig()
  }, [])


  const fetchStudents = async () => {
    setLoading(true)
    setError(null)
    const supabase = getSupabaseClient()

    try {
      const { data, error } = await supabase
        .from("students")
        .select(
          `id, fullname, email, phone, "rollNumber", status, created_at`,
        )
        .order("created_at", { ascending: false })

      if (error) throw error
      if (data) setStudents(data as StudentList[])
    } catch (err: any)
    {
      console.error("Error fetching students:", err)
      setError(err.message || "An unknown error occurred while fetching students.")
    } finally {
      setLoading(false)
    }
  }

  // --- Modal Logic ---
  const openModal = async (studentId: string, mode: "view" | "edit") => {
    setModalMode(mode)
    setIsModalVisible(true)
    setModalLoading(true)
    setModalError(null)
    setCurrentStudent(null)
    setFilesToAdd([])
    setFilesToRemove([])
    setNewDocFile(null)
    setSelectedCustomField("")
    setSelectedDocument("")

    const supabase = getSupabaseClient()

    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("id", studentId)
        .single()

      if (error) throw error

      if (data) {
        const studentData = data as StudentDetail
        setCurrentStudent(studentData)
        if (mode === 'edit') {
          setEditFormData({
            ...studentData,
            documents: studentData.documents || [],
            custom_data: studentData.custom_data || {}, // Ensure custom_data is an object
          })
        }
      }
    } catch (err: any) {
      console.error("Error fetching student details:", err)
      setModalError(err.message || "Failed to load student details.")
    } finally {
      setModalLoading(false)
    }
  }

  const closeModal = () => {
    setIsModalVisible(false)
    setCurrentStudent(null)
    setEditFormData({})
    setModalError(null)
    setFilesToAdd([])
    setFilesToRemove([])
    setNewDocFile(null)
    setSelectedCustomField("")
    setSelectedDocument("")
  }

  // --- Edit Form Handlers ---
  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = e.target
    setEditFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleStatusChange = (e: { value: any }) => {
     setEditFormData((prev) => ({ ...prev, status: e.value }))
  }

  // --- Custom Field Handlers (Edit Mode) ---
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
    if (typeof selectedCustomField === 'object' && selectedCustomField.label) {
      const newLabel = selectedCustomField.label;
      if (editFormData.custom_data && newLabel in editFormData.custom_data) {
        setModalError(`Field "${newLabel}" already exists.`);
        return;
      }
      
      handleCustomFieldChange(newLabel, ""); // Add new field with empty value
      setSelectedCustomField(""); // Reset autocomplete
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

  // --- Document Management Handlers (Edit Mode) ---
  const stageFileForUpload = () => {
    if (typeof selectedDocument === 'object' && selectedDocument.name && newDocFile) {
      const docName = selectedDocument.name;
      
      const newFileToAdd: FileToAdd = {
        id: Date.now().toString(),
        name: docName,
        file: newDocFile,
      }
      setFilesToAdd(prev => [...prev, newFileToAdd]);
      
      setSelectedDocument("")
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
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentStudent) return

    setIsSubmitting(true)
    setModalError(null)
    const supabase = getSupabaseClient()
    
    const { id, user_id, "rollNumber": rollNumber } = currentStudent
    const bucketName = 'student_documents'

    try {
      // 1. --- Handle File Deletions from Storage ---
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

      // 2. --- Handle File Uploads to Storage ---
      if (filesToAdd.length > 0) {
        for (const newDoc of filesToAdd) {
          const fileExt = newDoc.file.name.split('.').pop();
          const cleanDocName = newDoc.name.replace(/[^a-zA-Z0-9]/g, '_');
          const uniqueFileName = `${cleanDocName}-${Date.now()}.${fileExt}`;
          const filePath = `${user_id}/${rollNumber}/${uniqueFileName}`;

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
      
      // 3. --- Prepare Final Data for Database Update ---
      const { 
        id: formId, 
        created_at, 
        user_id: formUserId, 
        fullname, 
        documents,
        ...restOfUpdateData 
      } = editFormData
      
      const finalUpdateData = {
        ...restOfUpdateData,
        documents: finalDocumentsArray,
        custom_data: editFormData.custom_data,
      }

      // 4. --- Update the Student Record in Database ---
      const { data: updatedStudent, error: updateError } = await supabase
        .from("students")
        .update(finalUpdateData)
        .eq("id", currentStudent.id)
        .select(`id, fullname, email, phone, "rollNumber", status, created_at`)
        .single()
      
      if (updateError) throw updateError

      // 5. --- Success: Update UI and Close ---
      if (updatedStudent) {
        setStudents((prev) =>
          prev.map((s) =>
            s.id === updatedStudent.id ? (updatedStudent as StudentList) : s,
          ),
        )
      }
      closeModal()

    } catch (err: any) {
      console.error("Error updating student:", err)
      setModalError(err.message || "Failed to save changes.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- AutoComplete Logic ---
  const searchCustomFieldsSuggestions = (event: AutoCompleteCompleteEvent) => {
    let query = event.query;
    let _suggestions: FieldOption[] = [];

    if (query.length === 0) {
      _suggestions = availableCustomFields;
    }
    else {
      _suggestions = availableCustomFields.filter(option => 
        option.label.toLowerCase().includes(query.toLowerCase())
      );
    }
    setFilteredCustomFieldSuggestions(_suggestions);
  };
  
  const searchDocumentSuggestions = (event: AutoCompleteCompleteEvent) => {
    let query = event.query;
    let _suggestions: DocOption[] = [];

    if (query.length === 0) {
      _suggestions = availableDocuments;
    }
    else {
      _suggestions = availableDocuments.filter(option => 
        option.name.toLowerCase().includes(query.toLowerCase())
      );
    }
    setFilteredDocumentSuggestions(_suggestions);
  };
  
  const itemTemplate = (item: FieldOption | DocOption, key: 'label' | 'name') => {
      const text = (item as any)[key]
      return <div className="p-2 text-sm hover:bg-gray-100">{text}</div>;
  };

  // --- Table Column Templates ---
  const getVariantForStatus = (
    status: string,
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "default"
      case "pending":
        return "secondary"
      case "rejected":
        return "destructive"
      default:
        return "outline"
    }
  }

  const statusBodyTemplate = (rowData: StudentList) => {
    return (
      <Badge variant={getVariantForStatus(rowData.status)}>
        {rowData.status
          ? rowData.status.charAt(0).toUpperCase() + rowData.status.slice(1)
          : "N/A"}
      </Badge>
    )
  }

  const actionBodyTemplate = (rowData: StudentList) => {
    return (
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => openModal(rowData.id, "view")}
          title="View Student"
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={() => openModal(rowData.id, "edit")}
          title="Edit Student"
        >
          <Edit className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  const tableHeader = (
    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
      <h3 className="text-xl font-semibold text-gray-800">Manage Students</h3>
      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="search"
          placeholder="Search students..."
          className="pl-9 w-full"
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
      </div>
    </div>
  )

  // --- Modal Content Renderers ---
  
  const renderViewContent = () => (
    <div className="space-y-6">
      <section>
        <h4 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">Personal Details</h4>
        <div className="space-y-2">
          <DetailItem label="Full Name" value={currentStudent?.fullname} />
          <DetailItem label="Roll Number" value={currentStudent?.['rollNumber']} />
          <DetailItem label="Email" value={currentStudent?.email} />
          <DetailItem label="Phone" value={currentStudent?.phone} />
          <DetailItem label="Date of Birth" value={currentStudent?.dateofbirth} />
          <DetailItem label="Status" value={
            <Badge variant={getVariantForStatus(currentStudent?.status || '')}>
              {currentStudent?.status}
            </Badge>
          }/>
          <DetailItem label="Address" value={`${currentStudent?.address}, ${currentStudent?.city}, ${currentStudent?.state} - ${currentStudent?.zipcode}`} />
          <DetailItem label="Secondary Phone" value={currentStudent?.secondary_phone} />
          <DetailItem label="Family Phone" value={currentStudent?.family_phone} />
        </div>
      </section>

      {currentStudent?.custom_data && Object.keys(currentStudent.custom_data).length > 0 && (
        <section>
          <h4 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">Additional Information</h4>
          <div className="space-y-2">
            {Object.entries(currentStudent.custom_data).map(([key, value]) => (
              <DetailItem key={key} label={key} value={value} />
            ))}
          </div>
        </section>
      )}

      {currentStudent?.documents && currentStudent.documents.length > 0 && (
        <section>
          <h4 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">Uploaded Documents</h4>
          <div className="space-y-2">
            {currentStudent.documents.map((doc) => (
              <DocumentLinkItem key={doc.path} doc={doc} />
            ))}
          </div>
        </section>
      )}
    </div>
  )

  const renderEditContent = () => (
    <form onSubmit={handleEditSubmit} className="space-y-6">
      <section>
        <h4 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">Personal Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormInputGroup label="First Name" name="firstname" value={editFormData.firstname || ""} onChange={handleEditChange} required />
          <FormInputGroup label="Middle Name" name="middlename" value={editFormData.middlename || ""} onChange={handleEditChange} />
          <FormInputGroup label="Last Name" name="lastname" value={editFormData.lastname || ""} onChange={handleEditChange} required />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <FormInputGroup label="Email Address" name="email" type="email" value={editFormData.email || ""} onChange={handleEditChange} required />
          <FormInputGroup label="Roll Number" name="rollNumber" value={editFormData['rollNumber'] || ""} onChange={handleEditChange} required />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <FormInputGroup label="Primary Phone" name="phone" type="tel" value={editFormData.phone || ""} onChange={handleEditChange} required />
          <FormInputGroup label="Date of Birth" name="dateofbirth" type="date" value={editFormData.dateofbirth || ""} onChange={handleEditChange} required />
        </div>
        <div className="mt-4">
          <FormInputGroup label="Address" name="address" value={editFormData.address || ""} onChange={handleEditChange} required />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <FormInputGroup label="City" name="city" value={editFormData.city || ""} onChange={handleEditChange} required />
          <FormInputGroup label="State" name="state" value={editFormData.state || ""} onChange={handleEditChange} required />
          <FormInputGroup label="ZIP Code" name="zipcode" value={editFormData.zipcode || ""} onChange={handleEditChange} required />
        </div>
        <div className="mt-4">
          <Label htmlFor="status" className="font-semibold">Enrollment Status</Label>
          <Dropdown 
            id="status"
            value={editFormData.status} 
            options={statusOptions} 
            onChange={handleStatusChange} 
            placeholder="Select a Status"
            className="w-full p-inputtext-sm"
          />
        </div>
      </section>

      {/* --- Manage Custom Fields --- */}
      <section>
        <h4 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">Additional Information</h4>
        <div className="space-y-3">
          {Object.keys(editFormData.custom_data || {}).length === 0 && (
             <p className="text-sm text-gray-500 italic">No additional information added.</p>
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
                <Trash2 className="w-4 h-4 text-red-600" />
              </Button>
            </div>
          ))}

          <div className="mt-4 p-3 bg-gray-100 rounded-lg border">
            <h5 className="text-sm font-semibold mb-2">Add New Field</h5>
            <div className="flex flex-col sm:flex-row gap-3">
              <AutoComplete 
                value={selectedCustomField} 
                suggestions={filteredCustomFieldSuggestions} 
                completeMethod={searchCustomFieldsSuggestions} 
                onChange={(e) => setSelectedCustomField(e.value)} 
                field="label"
                placeholder="Search field to add"
                dropdown
                itemTemplate={(item) => itemTemplate(item as FieldOption, 'label')}
                className="flex-1 w-full"
                inputClassName="p-inputtext p-component w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 transition text-sm"
              />
              <Button
                type="button"
                onClick={handleAddCustomFieldToEdit}
                disabled={typeof selectedCustomField !== 'object' || !selectedCustomField}
                className="w-full sm:w-auto"
              >
                <Plus size={16} className="mr-2" />
                Add Field
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* --- Manage Documents --- */}
      <section>
        <h4 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">Manage Documents</h4>
        
        <div className="space-y-2">
          {(editFormData.documents || []).length === 0 && filesToAdd.length === 0 && (
            <p className="text-sm text-gray-500 italic">No documents uploaded.</p>
          )}
          
          {(editFormData.documents || []).map((doc) => (
            <div key={doc.path} className="flex items-center justify-between p-2 bg-gray-50 rounded-md border">
              <div className="flex items-center gap-2">
                <File className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">{doc.name}</span>
                <span className="text-xs text-gray-500">({doc.fileName})</span>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => stageFileForRemoval(doc)} title="Remove this document">
                <Trash2 className="w-4 h-4 text-red-600" />
              </Button>
            </div>
          ))}

          {filesToAdd.map((doc) => (
             <div key={doc.id} className="flex items-center justify-between p-2 bg-green-50 rounded-md border border-green-200">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">{doc.name}</span>
                <span className="text-xs text-gray-500">({doc.file.name})</span>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => cancelStagedFile(doc.id)} title="Cancel upload">
                <X className="w-4 h-4 text-gray-700" />
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-gray-100 rounded-lg border">
          <h5 className="text-sm font-semibold mb-2">Add New Document</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
             <div className="space-y-1">
                <Label htmlFor="docTypeAutoComplete">Document Type*</Label>
                <AutoComplete
                  id="docTypeAutoComplete"
                  value={selectedDocument} 
                  suggestions={filteredDocumentSuggestions} 
                  completeMethod={searchDocumentSuggestions} 
                  onChange={(e) => setSelectedDocument(e.value)} 
                  field="name"
                  placeholder="Search document type"
                  dropdown
                  itemTemplate={(item) => itemTemplate(item as DocOption, 'name')}
                  className="w-full"
                  inputClassName="p-inputtext p-component w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 transition text-sm"
                />
             </div>
             <div className="space-y-1">
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
            disabled={typeof selectedDocument !== 'object' || !newDocFile}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Document to List
          </Button>
        </div>
      </section>

      {/* Submission Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="ghost" onClick={closeModal}>
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
  
  // Modal footer (only for view mode)
  const viewModalFooter = (
    <div className="flex justify-end gap-2">
      <Button 
        variant="secondary" 
        onClick={() => currentStudent && openModal(currentStudent.id, "edit")}
      >
        <Edit className="h-4 w-4 mr-2" />
        Edit
      </Button>
      <Button variant="outline" onClick={closeModal}>
        Close
      </Button>
    </div>
  )

  // --- Main Page Render ---
  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Student List
          </h1>
          <p className="text-lg text-gray-600">
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

      {/* 2. Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Fetching Data</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 3. Data Table */}
      <Card className="overflow-hidden shadow-lg">
        <CardContent className="p-0">
          <DataTable
            value={students}
            loading={loading}
            paginator
            rows={10}
            rowsPerPageOptions={[10, 25, 50]}
            globalFilter={globalFilter}
            header={tableHeader}
            emptyMessage="No students found."
            className="w-full"
            removableSort
            dataKey="id"
          >
            <Column
              field="fullname"
              header="Full Name"
              sortable
              body={(rowData: StudentList) => (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-full">
                    <UserRound className="w-4 h-4 text-gray-600" />
                  </div>
                  <span className="font-medium text-gray-900">
                    {rowData.fullname || "N/A"}
                  </span>
                </div>
              )}
            />
            <Column
              field="rollNumber"
              header="Roll Number"
              sortable
            />
            <Column field="email" header="Email" />
            <Column field="phone" header="Phone" />
            <Column
              field="status"
              header="Status"
              sortable
              body={statusBodyTemplate}
            />
            <Column
              header="Actions"
              body={actionBodyTemplate}
              style={{ width: "120px" }}
              align="center"
            />
          </DataTable>
        </CardContent>
      </Card>

      {/* 4. STUDENT DETAIL MODAL (POPUP) */}
      <Dialog
        header={
          modalMode === "view" ? "Student Details" : "Edit Student Information"
        }
        visible={isModalVisible}
        style={{ width: "90vw", maxWidth: "800px" }}
        onHide={closeModal}
        footer={modalMode === "view" ? viewModalFooter : null}
        modal
        className="p-dialog"
      >
        <div className="p-4 max-h-[80vh] overflow-y-auto">
          {modalLoading && (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          )}

          {modalError && (
             <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{modalError}</AlertDescription>
            </Alert>
          )}
          
          {!modalLoading && currentStudent && (
            <>
              {modalMode === "view" ? renderViewContent() : renderEditContent()}
            </>
          )}
        </div>
      </Dialog>
    </div>
  )
}