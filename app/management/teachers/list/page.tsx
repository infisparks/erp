// e.g., app/dashboard/teachers/page.tsx OR app/teachers/list/page.tsx
"use client"

import React, { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"

// --- UI Components ---
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Loader2,
  Save,
  X,
  File,
  Trash2,
  Download,
  Upload,
  UserSquare,
  Briefcase,
  BookOpen,
  Building,
  CheckCircle,
} from "lucide-react"

// --- PrimeReact Components ---
import { DataTable } from "primereact/datatable"
import { Column } from "primereact/column"
import { Dialog } from "primereact/dialog"
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { AutoComplete, AutoCompleteCompleteEvent } from 'primereact/autocomplete';

// --- PrimeReact CSS ---
import "primereact/resources/themes/saga-blue/theme.css"
import "primereact/resources/primereact.min.css"
import "primeicons/primeicons.css"

// --- Type Definitions ---

// 🔧 FIX: Updated DocumentItem to include optional fields
interface DocumentItem {
  id: string
  name: string
  file?: File
  path?: string;
  fileName?: string;
  fileType?: string;
}
interface CustomField {
  id: string
  label: string
  value: string
}
interface FieldOption {
    label: string;
    type: string;
}
interface DocOption {
    name: string;
    description: string;
}

// For the main list
interface TeacherList {
  id: string
  fullname: string | null
  email: string
  phone_primary: string
  teacher_type: string
  specialization: string
}

// For the modal (full details)
interface TeacherDetail {
  id: string
  firstname: string
  middlename: string | null
  lastname: string
  fullname: string | null
  email: string
  phone_primary: string
  phone_secondary: string | null
  teacher_type: string
  specialization: string
  experience_start_date: string
  custom_data: Record<string, string> | null
  documents: StudentDocument[] | null
}

// For assignments
interface TeacherAssignment {
  teacher_id: string;
  course_id: string;
  subject_id: string;
}

// For dropdowns, etc.
interface TeacherType { name: string; }
interface Specialization { name: string; }
interface Course { id: string; name: string; }
interface Semester { id: string; course_id: string; }
interface Subject { id: string; name: string; semester_id: string; type: string; }
interface SelectedCourse { id: string; name: string; }
type SubjectAssignment = { [courseId: string]: string[]; }
interface StudentDocument { name: string; path: string; fileName: string; fileType: string; }
interface FileToAdd { id: string; name: string; file: File; }

// --- Helper: Calculate Experience ---
const calculateExperience = (startDate: string) => {
  if (!startDate) return "N/A";
  const start = new Date(startDate);
  const now = new Date();
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }
  return `${years} years, ${months} months`;
};

// --- Helper Components ---
const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
    <p className="md:col-span-1 text-sm font-semibold text-gray-600">{label}</p>
    <div className="md:col-span-2 text-sm text-gray-900 break-words">{value || "N/A"}</div>
  </div>
);

const DocumentLinkItem: React.FC<{ doc: StudentDocument }> = ({ doc }) => {
  const supabase = getSupabaseClient();
  const { data: { publicUrl } } = supabase.storage.from('teacher_documents').getPublicUrl(doc.path);
  return (
     <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-2 bg-white rounded-md border border-gray-200 hover:bg-gray-50 group">
      <div className="flex items-center gap-2"><File className="w-4 h-4 text-blue-600" /><div><p className="text-sm font-medium text-blue-700 group-hover:underline">{doc.name}</p><p className="text-xs text-gray-500">{doc.fileName}</p></div></div>
      <Download className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
    </a>
  );
};

const FormInputGroup: React.FC<{
  label: string, name: string, value: string,
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
  type?: string, required?: boolean, placeholder?: string, className?: string
}> = ({ label, name, value, onChange, type = "text", required = false, placeholder = "", className = "" }) => (
  <div className={`space-y-1 ${className}`}>
    <Label htmlFor={name} className="font-semibold">{label}{required && '*'}</Label>
    <Input id={name} name={name} type={type} value={value} onChange={onChange} required={required} placeholder={placeholder} />
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode; icon: React.ReactNode }> = ({ title, children, icon }) => (
  <section className="space-y-4 p-4 border rounded-lg">
    <h2 className="flex items-center gap-2 text-xl font-semibold border-b pb-2">{icon}{title}</h2>
    <div className="space-y-4">{children}</div>
  </section>
);
// --- End Helper Components ---


/**
 * Main Teacher List Page
 */
export default function TeacherListPage() {
  // --- Page State ---
  const [teachers, setTeachers] = useState<TeacherList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");

  // --- Modal State ---
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit">("view");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // --- Data State ---
  const [currentTeacher, setCurrentTeacher] = useState<TeacherDetail | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<TeacherDetail>>({});
  
  // --- Config & Academic State ---
  const [teacherTypes, setTeacherTypes] = useState<TeacherType[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [allSemesters, setAllSemesters] = useState<Semester[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  
  // --- Assignment State ---
  const [teacherAssignments, setTeacherAssignments] = useState<any[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<SelectedCourse[]>([]);
  const [subjectAssignments, setSubjectAssignments] = useState<SubjectAssignment>({});

  // --- Custom Fields & Documents State ---
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [availableCustomFields, setAvailableCustomFields] = useState<FieldOption[]>([])
  const [availableDocuments, setAvailableDocuments] = useState<DocOption[]>([])
  const [selectedCustomField, setSelectedCustomField] = useState<FieldOption | string>("")
  const [filteredCustomFieldSuggestions, setFilteredCustomFieldSuggestions] = useState<FieldOption[]>([])
  const [selectedDocument, setSelectedDocument] = useState<DocOption | string>("")
  const [filteredDocumentSuggestions, setFilteredDocumentSuggestions] = useState<DocOption[]>([])
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null)
  const [filesToAdd, setFilesToAdd] = useState<FileToAdd[]>([]);
  const [filesToRemove, setFilesToRemove] = useState<StudentDocument[]>([]);

  const supabase = getSupabaseClient();

  // --- Data Fetching (Main List) ---
  const fetchTeachers = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("teachers")
      .select("id, fullname, email, phone_primary, teacher_type, specialization")
      .order("fullname");
    
    if (data) setTeachers(data as TeacherList[]);
    if (error) setError(error.message);
    setLoading(false);
  };
  
  // --- Data Fetching (Configs for Modals) ---
  const fetchConfigs = async () => {
      try {
        const [typesRes, specsRes, customFieldsRes, documentsRes, coursesRes, semestersRes, subjectsRes] = await Promise.all([
          supabase.from("form_config").select("data_jsonb").eq("data_name", "teacher_types").single(),
          supabase.from("form_config").select("data_jsonb").eq("data_name", "teacher_specializations").single(),
          supabase.from("form_config").select("data_jsonb").eq("data_name", "custom_field_options").single(),
          supabase.from("form_config").select("data_jsonb").eq("data_name", "document_options").single(),
          supabase.from("courses").select("id, name"),
          supabase.from("semesters").select("id, course_id"),
          supabase.from("subjects").select("id, name, semester_id, type")
        ]);

        setTeacherTypes(typesRes.data?.data_jsonb as TeacherType[] || []);
        setSpecializations(specsRes.data?.data_jsonb as Specialization[] || []);
        setAvailableCustomFields(customFieldsRes.data?.data_jsonb as FieldOption[] || []);
        setAvailableDocuments(documentsRes.data?.data_jsonb as DocOption[] || []);
        setAllCourses(coursesRes.data as Course[] || []);
        setAllSemesters(semestersRes.data as Semester[] || []);
        setAllSubjects(subjectsRes.data as Subject[] || []);

      } catch (err: any) {
        setError(err.message);
      }
  };

  useEffect(() => {
    fetchTeachers();
    fetchConfigs();
  }, []);

  // --- Modal Logic ---
  const openModal = async (teacherId: string, mode: "view" | "edit") => {
    setModalMode(mode);
    setIsModalVisible(true);
    setModalLoading(true);
    setModalError(null);
    setCurrentTeacher(null);
    setTeacherAssignments([]);
    setEditFormData({});
    setCustomFields([]);
    setDocuments([]);
    setFilesToAdd([]);
    setFilesToRemove([]);
    setSubjectAssignments({});
    setSelectedCourses([]);

    try {
      // 1. Fetch Teacher Details
      const { data: teacherData, error: teacherError } = await supabase
        .from("teachers")
        .select("*")
        .eq("id", teacherId)
        .single();
      if (teacherError) throw teacherError;
      setCurrentTeacher(teacherData as TeacherDetail);

      // 2. Fetch Assignments
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('teacher_assignments')
        .select(`
          course_id,
          courses ( name ),
          subjects ( id, name, type )
        `)
        .eq('teacher_id', teacherId);
      if (assignmentError) throw assignmentError;
      
      const groupedAssignments = (assignmentData || []).reduce((acc: Record<string, any[]>, item: any) => {
        const courseName = item.courses?.name || 'Unknown Course';
        if (!acc[courseName]) {
          acc[courseName] = [];
        }
        acc[courseName].push(item.subjects);
        return acc;
      }, {} as Record<string, any[]>);
      setTeacherAssignments(Object.entries(groupedAssignments));

      // 3. Set data for Edit Mode
      if (mode === 'edit') {
        setEditFormData(teacherData);
        
        const loadedCustomFields = Object.entries(teacherData.custom_data || {}).map(([label, value], i) => ({
          id: `cf-${i}`,
          label,
          value: value as string 
        }));
        setCustomFields(loadedCustomFields);

        // This mapping is now valid
        const loadedDocuments = (teacherData.documents || []).map((doc: StudentDocument, i: number) => ({
          id: `doc-${i}`,
          file: undefined,
          ...doc
        }));
        setDocuments(loadedDocuments);

        const assignmentsForEdit = (assignmentData || []).reduce((acc: SubjectAssignment, item: any) => {
          if (!acc[item.course_id]) {
            acc[item.course_id] = [];
          }
          acc[item.course_id].push(item.subjects.id);
          return acc;
        }, {} as SubjectAssignment);
        setSubjectAssignments(assignmentsForEdit);
        
        setSelectedCourses(allCourses.filter(c => assignmentsForEdit[c.id]));
      }
      
    } catch (err: any) {
      setModalError(err.message || "Failed to load teacher details.");
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setCurrentTeacher(null);
    setEditFormData({});
    setCustomFields([]);
    setDocuments([]);
    setFilesToAdd([]);
    setFilesToRemove([]);
  };

  // --- Edit Form Handlers ---
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleDropdownChange = (name: string, value: any) => {
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCourseSelect = (selected: SelectedCourse[]) => {
    setSelectedCourses(selected);
    setSubjectAssignments(prev => {
      const newAssignments: SubjectAssignment = {};
      for (const course of selected) {
        newAssignments[course.id] = prev[course.id] || [];
      }
      return newAssignments;
    });
  };

  const handleSubjectSelect = (courseId: string, subjectIds: string[]) => {
    setSubjectAssignments(prev => ({
      ...prev,
      [courseId]: subjectIds
    }));
  };
  
  // --- Form Submission (Edit) ---
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTeacher) return;

    setIsSubmitting(true);
    setModalError(null);

    if (documents.some(doc => !doc.file && !doc.path)) {
      setModalError("Please upload a file for all newly added document types.");
      setIsSubmitting(false);
      return;
    }
    if (customFields.some(field => field.value.trim() === "")) {
      setModalError("Please fill in a value for all custom fields.");
      setIsSubmitting(false);
      return;
    }

    try {
      const teacherId = currentTeacher.id;

      // 1. --- Update Teacher Personal/Professional Details ---
      const { id, fullname, custom_data, documents: oldDocs, ...teacherUpdateData } = editFormData;
      const { error: teacherError } = await supabase
        .from("teachers")
        .update(teacherUpdateData)
        .eq("id", teacherId);
      if (teacherError) throw teacherError;

      // 2. --- Update Assignments ---
      const { error: deleteError } = await supabase.from("teacher_assignments").delete().eq("teacher_id", teacherId);
      if (deleteError) throw deleteError;

      const assignmentsToInsert = [];
      for (const [courseId, subjectIds] of Object.entries(subjectAssignments)) {
        for (const subjectId of subjectIds) {
          assignmentsToInsert.push({
            teacher_id: teacherId,
            course_id: courseId,
            subject_id: subjectId,
          });
        }
      }
      if (assignmentsToInsert.length > 0) {
        const { error: assignmentError } = await supabase.from("teacher_assignments").insert(assignmentsToInsert);
        if (assignmentError) throw assignmentError;
      }
      
      // 3. --- Update Documents & Custom Fields ---
      const bucketName = 'teacher_documents';
      
      if (filesToRemove.length > 0) {
        const pathsToRemove = filesToRemove.map(f => f.path).filter(p => p) as string[];
        if (pathsToRemove.length > 0) {
          await supabase.storage.from(bucketName).remove(pathsToRemove);
        }
      }
      
      let finalDocumentsArray = documents.filter(doc => doc.path) as StudentDocument[];

      for (const newDoc of filesToAdd) {
        const fileExt = newDoc.file.name.split('.').pop();
        const cleanDocName = newDoc.name.replace(/[^a-zA-Z0-9]/g, '_');
        const uniqueFileName = `${cleanDocName}-${Date.now()}.${fileExt}`;
        const filePath = `${teacherId}/${uniqueFileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName).upload(filePath, newDoc.file);
        if (uploadError) throw uploadError;
        
        finalDocumentsArray.push({
          name: newDoc.name, path: uploadData.path,
          fileName: newDoc.file.name, fileType: newDoc.file.type,
        });
      }
      
      const finalCustomData = customFields.reduce((acc, field) => {
          acc[field.label] = field.value.trim();
          return acc;
      }, {} as Record<string, string>);

      const { error: finalUpdateError } = await supabase
        .from("teachers")
        .update({
          documents: finalDocumentsArray,
          custom_data: finalCustomData
        })
        .eq("id", teacherId);
      if (finalUpdateError) throw finalUpdateError;

      // 4. --- Success ---
      await fetchTeachers();
      closeModal();
      
    } catch (err: any) {
      setModalError(err.message || "Failed to save changes.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Handlers from AdmissionForm (for Edit Modal) ---
  const searchCustomFieldsSuggestions = (event: AutoCompleteCompleteEvent) => {
    let _suggestions: FieldOption[] = availableCustomFields.filter(option => 
      option.label.toLowerCase().includes(event.query.toLowerCase())
    );
    setFilteredCustomFieldSuggestions(_suggestions);
  };
  const searchDocumentSuggestions = (event: AutoCompleteCompleteEvent) => {
    let _suggestions: DocOption[] = availableDocuments.filter(option => 
      option.name.toLowerCase().includes(event.query.toLowerCase())
    );
    setFilteredDocumentSuggestions(_suggestions);
  };
  const itemTemplate = (item: FieldOption | DocOption, key: 'label' | 'name') => {
      const text = (item as any)[key]
      return <div className="p-2 text-sm hover:bg-gray-100">{text}</div>;
  };
  const handleAddCustomField = () => {
    if (typeof selectedCustomField === 'object' && selectedCustomField.label) {
      const cleanLabel = selectedCustomField.label.trim()
      if (customFields.some(field => field.label === cleanLabel)) {
          setModalError(`Custom field "${cleanLabel}" has already been added.`);
          return;
      }
      setCustomFields((prev) => [...prev, { id: Date.now().toString(), label: cleanLabel, value: "" }])
      setSelectedCustomField("") 
      setModalError(null)
    }
  }
  const handleCustomFieldChange = (id: string, value: string) => {
    setCustomFields((prev) => prev.map((field) => (field.id === id ? { ...field, value } : field)))
  }
  const handleRemoveCustomField = (id: string) => {
    setCustomFields((prev) => prev.filter((field) => field.id !== id))
  }
  const handleAddDocument = () => {
    if (typeof selectedDocument === 'object' && selectedDocument.name) {
      const cleanDocName = selectedDocument.name.trim()
      if (documents.some(doc => doc.name === cleanDocName)) {
          setModalError(`Document "${cleanDocName}" has already been added.`);
          return;
      }
      const newDoc: DocumentItem = { id: Date.now().toString(), name: cleanDocName }
      setDocuments((prev) => [...prev, newDoc])
      setExpandedDocId(newDoc.id)
      setSelectedDocument("") 
      setModalError(null)
    }
  }
  const toggleDocumentExpand = (docId: string) => setExpandedDocId(expandedDocId === docId ? null : docId)
  
  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>, docId: string) => {
    const file = e.target.files?.[0]
    if (file) {
      const isNew = !documents.find(d => d.id === docId && d.path);
      if (isNew) {
        setFilesToAdd(prev => [...prev.filter(f => f.id !== docId), { id: docId, name: documents.find(d=>d.id===docId)!.name, file }]);
      }
      setDocuments((prev) => prev.map((doc) => (doc.id === docId ? { ...doc, file } : doc)))
    }
  }
  const handleRemoveDocument = (docId: string) => {
    const docToRemove = documents.find(d => d.id === docId);
    if (docToRemove && docToRemove.path) {
      setFilesToRemove(prev => [...prev, docToRemove as StudentDocument]);
    }
    setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
    setFilesToAdd((prev) => prev.filter(f => f.id !== docId));
  }
  
  // --- Memoized Data for Edit Modal ---
  const subjectsByCourseMap = useMemo(() => {
    const map = new Map<string, Subject[]>();
    for (const course of allCourses) {
      const courseSemesterIds = allSemesters.filter(sem => sem.course_id === course.id).map(sem => sem.id);
      const courseSubjects = allSubjects.filter(sub => courseSemesterIds.includes(sub.semester_id));
      map.set(course.id, courseSubjects);
    }
    return map;
  }, [allCourses, allSemesters, allSubjects]);

  
  // --- Table Header & Column Templates ---
  const tableHeader = (
    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
      <h3 className="text-xl font-semibold text-gray-800">Manage Teachers</h3>
      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="search"
          placeholder="Search teachers..."
          className="pl-9 w-full"
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
      </div>
    </div>
  )
  
  const actionBodyTemplate = (rowData: TeacherList) => (
    <div className="flex gap-2">
      <Button variant="outline" size="icon" onClick={() => openModal(rowData.id, "view")} title="View Teacher"><Eye className="h-4 w-4" /></Button>
      <Button variant="secondary" size="icon" onClick={() => openModal(rowData.id, "edit")} title="Edit Teacher"><Edit className="h-4 w-4" /></Button>
    </div>
  );

  // --- Modal Content Renderers ---
  const renderViewContent = () => (
    <div className="space-y-6">
      <Section title="Personal Details" icon={<UserSquare className="w-5 h-5 text-blue-700" />}>
        <DetailItem label="Full Name" value={currentTeacher?.fullname} />
        <DetailItem label="Email" value={currentTeacher?.email} />
        <DetailItem label="Primary Phone" value={currentTeacher?.phone_primary} />
        <DetailItem label="Secondary Phone" value={currentTeacher?.phone_secondary} />
      </Section>
      
      <Section title="Professional Details" icon={<Briefcase className="w-5 h-5 text-blue-700" />}>
        <DetailItem label="Teacher Type" value={<Badge>{currentTeacher?.teacher_type}</Badge>} />
        <DetailItem label="Specialization" value={<Badge variant="secondary">{currentTeacher?.specialization}</Badge>} />
        <DetailItem label="Experience" value={calculateExperience(currentTeacher?.experience_start_date || "")} />
        <DetailItem label="Joining Date" value={currentTeacher?.experience_start_date} />
      </Section>

      <Section title="Assignments" icon={<Building className="w-5 h-5 text-blue-700" />}>
        {teacherAssignments.length === 0 ? (
          <p className="text-sm text-gray-500">No subject assignments found.</p>
        ) : (
          teacherAssignments.map(([courseName, subjects]) => (
            <div key={courseName} className="p-3 bg-gray-50 rounded-md">
              <h4 className="font-semibold text-gray-800">{courseName}</h4>
              <ul className="list-disc list-inside pl-2 mt-1 space-y-1">
                {(subjects as any[]).map(sub => (
                  <li key={sub.id} className="text-sm text-gray-700">{sub.name} <Badge variant="outline">{sub.type}</Badge></li>
                ))}
              </ul>
            </div>
          ))
        )}
      </Section>

      {currentTeacher?.custom_data && Object.keys(currentTeacher.custom_data).length > 0 && (
        <Section title="Additional Information" icon={<BookOpen className="w-5 h-5 text-blue-700" />}>
          {Object.entries(currentTeacher.custom_data).map(([key, value]) => (
            <DetailItem key={key} label={key} value={value} />
          ))}
        </Section>
      )}

      {currentTeacher?.documents && currentTeacher.documents.length > 0 && (
        <Section title="Uploaded Documents" icon={<File className="w-5 h-5 text-blue-700" />}>
          {currentTeacher.documents.map((doc) => (
            <DocumentLinkItem key={doc.path} doc={doc} />
          ))}
        </Section>
      )}
    </div>
  );

  const renderEditContent = () => (
    <form onSubmit={handleEditSubmit} className="space-y-6">
      <Section title="Personal Details" icon={<UserSquare className="w-5 h-5 text-blue-700" />}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormInputGroup label="First Name" name="firstname" value={editFormData.firstname || ""} onChange={handleEditChange} required />
          <FormInputGroup label="Middle Name" name="middlename" value={editFormData.middlename || ""} onChange={handleEditChange} />
          <FormInputGroup label="Last Name" name="lastname" value={editFormData.lastname || ""} onChange={handleEditChange} required />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInputGroup label="Email" name="email" type="email" value={editFormData.email || ""} onChange={handleEditChange} required />
          <FormInputGroup label="Primary Phone" name="phone_primary" type="tel" value={editFormData.phone_primary || ""} onChange={handleEditChange} required />
        </div>
        <FormInputGroup label="Secondary Phone" name="phone_secondary" type="tel" value={editFormData.phone_secondary || ""} onChange={handleEditChange} />
      </Section>

      <Section title="Professional Details" icon={<Briefcase className="w-5 h-5 text-blue-700" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1"><Label htmlFor="teacher_type" className="font-semibold">Teacher Type*</Label>
            <Dropdown id="teacher_type" value={editFormData.teacher_type} options={teacherTypes} onChange={(e) => handleDropdownChange('teacher_type', e.value)} optionLabel="name" optionValue="name" placeholder="Select a type" className="w-full p-inputtext-sm" required/>
          </div>
          <div className="space-y-1"><Label htmlFor="specialization" className="font-semibold">Specialization*</Label>
            <Dropdown id="specialization" value={editFormData.specialization} options={specializations} onChange={(e) => handleDropdownChange('specialization', e.value)} optionLabel="name" optionValue="name" placeholder="Select a specialization" className="w-full p-inputtext-sm" required/>
          </div>
        </div>
        <FormInputGroup label="Experience Starting Date" name="experience_start_date" type="date" value={editFormData.experience_start_date || ""} onChange={handleEditChange} required />
      </Section>
      
      <Section title="Department & Subject Assignments" icon={<Building className="w-5 h-5 text-blue-700" />}>
        <div className="space-y-1"><Label htmlFor="departments" className="font-semibold">Select Departments (Courses)*</Label>
          <MultiSelect 
            id="departments" 
            value={selectedCourses} 
            options={allCourses} 
            onChange={(e) => handleCourseSelect(e.value)}
            dataKey="id"
            optionLabel="name" 
            placeholder="Select one or more departments" 
            className="w-full p-inputtext-sm" 
          />
        </div>
        {selectedCourses.length > 0 && (
          <div className="space-y-4 mt-4 pt-4 border-t">
            {selectedCourses.map(course => (
              <div key={course.id} className="p-4 border rounded-lg bg-gray-50">
                <h3 className="font-semibold text-gray-800">{course.name}</h3>
                <MultiSelect
                  value={subjectAssignments[course.id] || []}
                  options={subjectsByCourseMap.get(course.id) || []}
                  onChange={(e) => handleSubjectSelect(course.id, e.value)}
                  optionLabel="name" optionValue="id" placeholder="Select subjects..." className="w-full p-inputtext-sm"
                  itemTemplate={(option: Subject) => (
                    <div className="flex items-center gap-2"><span className="text-sm">{option.name}</span><Badge variant={option.type === 'practical' ? 'default' : 'secondary'} className={option.type === 'practical' ? 'bg-green-100 text-green-800' : ''}>{option.type}</Badge></div>
                  )}
                />
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Additional Information" icon={<BookOpen className="w-5 h-5 text-blue-700" />}>
        <div className="p-3 bg-gray-50 rounded-lg border"><label className="block text-sm font-bold text-gray-700 mb-2">Select Custom Field</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <AutoComplete value={selectedCustomField} suggestions={filteredCustomFieldSuggestions} completeMethod={searchCustomFieldsSuggestions} onChange={(e) => setSelectedCustomField(e.value)} field="label" placeholder="Search field" dropdown itemTemplate={(item) => itemTemplate(item as FieldOption, 'label')} className="flex-1 w-full" inputClassName="p-inputtext p-component w-full px-3 py-2 border border-gray-300 rounded-md"/>
            <Button type="button" onClick={handleAddCustomField} disabled={typeof selectedCustomField !== 'object' || !selectedCustomField} className="w-full sm:w-auto"><Plus size={16} className="mr-2" />Add Field</Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {customFields.map((field) => (
            <div key={field.id} className="relative group">
              <FormInputGroup label={field.label} name={field.id} value={field.value} onChange={(e) => handleCustomFieldChange(field.id, e.target.value)} placeholder={`Enter ${field.label}`} />
              <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveCustomField(field.id)} className="absolute -top-2 -right-2 p-1 text-red-500 bg-white rounded-full" title={`Remove ${field.label}`}><X size={16} /></Button>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Additional Documents" icon={<File className="w-5 h-5 text-blue-700" />}>
        <div className="p-3 bg-gray-50 rounded-lg border"><label className="block text-sm font-bold text-gray-700 mb-2">Select Document Type</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <AutoComplete value={selectedDocument} suggestions={filteredDocumentSuggestions} completeMethod={searchDocumentSuggestions} onChange={(e) => setSelectedDocument(e.value)} field="name" placeholder="Search document type" dropdown itemTemplate={(item) => itemTemplate(item as DocOption, 'name')} className="flex-1 w-full" inputClassName="p-inputtext p-component w-full px-3 py-2 border border-gray-300 rounded-md"/>
            <Button type="button" onClick={handleAddDocument} disabled={typeof selectedDocument !== 'object' || !selectedDocument} className="w-full sm:w-auto"><Plus size={16} className="mr-2"/>Add Doc</Button>
          </div>
        </div>
        <div className="space-y-3">
          {documents.map((doc) => (
            <div key={doc.id} className="border rounded-lg overflow-hidden">
              <button type="button" onClick={() => toggleDocumentExpand(doc.id)} className={`w-full p-3 flex items-center justify-between text-left ${expandedDocId === doc.id ? "bg-blue-50" : "bg-white"}`}>
                <div className="flex items-center gap-3"><File size={18} className="text-blue-600" />
                  <div>
                    <p className="font-semibold text-sm">{doc.name}</p>
                    {doc.path && !doc.file ? (<p className="text-xs text-green-700 flex items-center gap-1"><CheckCircle size={12} />Uploaded: {doc.fileName}</p>)
                    : doc.file ? (<p className="text-xs text-green-700 flex items-center gap-1"><CheckCircle size={12} />New File: {doc.file.name}</p>)
                    : (<p className="text-xs text-red-500">File required</p>)}
                  </div>
                </div>
                <Trash2 onClick={(e) => { e.stopPropagation(); handleRemoveDocument(doc.id); }} className="w-4 h-4 text-red-600"/>
              </button>
              {expandedDocId === doc.id && (
                <div className="p-3 bg-white border-t">
                  <Label className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-md cursor-pointer hover:bg-blue-50">
                    <Upload className="w-6 h-6 text-blue-600 mb-1" />
                    <span className="text-sm font-medium text-blue-700">Click to upload/change {doc.name}</span>
                    <Input type="file" onChange={(e) => handleDocumentUpload(e, doc.id)} className="hidden" />
                  </Label>
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="ghost" onClick={closeModal} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Changes
        </Button>
      </div>
    </form>
  );
  
  // Modal footer (only for view mode)
  const viewModalFooter = (
    <div className="flex justify-end gap-2">
      <Button variant="secondary" onClick={() => currentTeacher && openModal(currentTeacher.id, "edit")}><Edit className="h-4 w-4 mr-2" />Edit</Button>
      <Button variant="outline" onClick={closeModal}>Close</Button>
    </div>
  );

  // --- Main Page Render ---
  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Teacher List
          </h1>
          <p className="text-lg text-gray-600">
            View, manage, and search all registered teachers.
          </p>
        </div>
        <Link href="/dashboard/teachers" passHref>
          <Button className="flex items-center gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Add New Teacher
          </Button>
        </Link>
      </div>

      {/* 2. Error Message */}
      {error && !modalError && (
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
            value={teachers}
            loading={loading}
            paginator
            rows={10}
            rowsPerPageOptions={[10, 25, 50]}
            globalFilter={globalFilter}
            header={tableHeader}
            emptyMessage="No teachers found."
            className="w-full"
            removableSort
            dataKey="id"
          >
            <Column
              field="fullname"
              header="Full Name"
              sortable
              body={(rowData: TeacherList) => (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-full">
                    <UserSquare className="w-4 h-4 text-gray-600" />
                  </div>
                  <span className="font-medium text-gray-900">{rowData.fullname || "N/A"}</span>
                </div>
              )}
            />
            <Column
              field="teacher_type"
              header="Type"
              sortable
              body={(rowData: TeacherList) => <Badge>{rowData.teacher_type}</Badge>}
            />
            <Column field="specialization" header="Specialization" sortable />
            <Column field="email" header="Email" />
            <Column field="phone_primary" header="Phone" />
            <Column
              header="Actions"
              body={actionBodyTemplate}
              style={{ width: "120px" }}
              align="center"
            />
          </DataTable>
        </CardContent>
      </Card>

      {/* 4. TEACHER DETAIL MODAL (POPUP) */}
      <Dialog
        header={modalMode === "view" ? "Teacher Details" : "Edit Teacher Information"}
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
          {!modalLoading && currentTeacher && (
            <>
              {modalMode === "view" ? renderViewContent() : renderEditContent()}
            </>
          )}
        </div>
      </Dialog>
    </div>
  );
}