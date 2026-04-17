// e.g., app/dashboard/teachers/page.tsx
"use client"

import React, { useState, useEffect, useMemo } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"

// --- UI Components ---
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// --- Icons ---
import {
  Plus,
  Loader2,
  AlertTriangle,
  BookOpen,
  Building,
  Upload,
  Trash2,
  File,
  CheckCircle,
  X,
} from "lucide-react"

// --- PrimeReact Components ---
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { AutoComplete, AutoCompleteCompleteEvent } from 'primereact/autocomplete';

// --- PrimeReact CSS ---
import "primereact/resources/themes/saga-blue/theme.css"
import "primereact/resources/primereact.min.css"
import "primeicons/primeicons.css"
import { Badge } from "@/components/ui/badge"

// --- Type Definitions (from AdmissionForm) ---
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
interface FieldOption {
    label: string;
    type: string;
}
interface DocOption {
    name: string;
    description: string;
}

// --- Type Definitions (for Teacher Page) ---
interface TeacherType {
  name: string;
}
interface Specialization {
  name: string;
}
interface Course { // Used as "Department"
  id: string;
  name: string;
}
interface Semester {
  id: string;
  course_id: string;
}
interface Subject {
  id: string;
  name: string;
  semester_id: string;
  type: string;
}

// State for the main form
interface TeacherFormData {
  firstname: string;
  middlename: string;
  lastname: string;
  email: string;
  phone_primary: string;
  phone_secondary: string;
  teacher_type: string;
  specialization: string;
  experience_start_date: string;
}

// State for selected departments (courses)
type SelectedCourse = {
  id: string;
  name: string;
}

// State for the final subject assignments
type SubjectAssignment = {
  [courseId: string]: string[];
}


// --- Main Teacher Registration Page ---
export default function TeacherRegistrationPage() {
  const [formData, setFormData] = useState<TeacherFormData>({
    firstname: "",
    middlename: "",
    lastname: "",
    email: "",
    phone_primary: "",
    phone_secondary: "",
    teacher_type: "",
    specialization: "",
    experience_start_date: "",
  });

  // --- Dropdown Options State ---
  const [teacherTypes, setTeacherTypes] = useState<TeacherType[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  
  // --- Academic Data State ---
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [allSemesters, setAllSemesters] = useState<Semester[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);

  // --- Assignment State ---
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

  // --- Loading & Error State ---
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const supabase = getSupabaseClient();

  // --- Data Fetching ---
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch Form Config
        const [typesRes, specsRes, customFieldsRes, documentsRes] = await Promise.all([
          supabase.from("form_config").select("data_jsonb").eq("data_name", "teacher_types").single(),
          supabase.from("form_config").select("data_jsonb").eq("data_name", "teacher_specializations").single(),
          supabase.from("form_config").select("data_jsonb").eq("data_name", "custom_field_options").single(),
          supabase.from("form_config").select("data_jsonb").eq("data_name", "document_options").single()
        ]);
        
        if (typesRes.error) throw new Error("Failed to fetch teacher types.");
        if (specsRes.error) throw new Error("Failed to fetch specializations.");
        if (customFieldsRes.error) throw new Error("Failed to fetch custom fields.");
        if (documentsRes.error) throw new Error("Failed to fetch document options.");
        
        setTeacherTypes(typesRes.data.data_jsonb as TeacherType[]);
        setSpecializations(specsRes.data.data_jsonb as Specialization[]);
        setAvailableCustomFields(customFieldsRes.data.data_jsonb as FieldOption[]);
        setAvailableDocuments(documentsRes.data.data_jsonb as DocOption[]);

        // 2. Fetch Academic Structure
        const [coursesRes, semestersRes, subjectsRes] = await Promise.all([
          supabase.from("courses").select("id, name"),
          supabase.from("semesters").select("id, course_id"),
          supabase.from("subjects").select("id, name, semester_id, type")
        ]);

        if (coursesRes.error) throw new Error("Failed to fetch courses/departments.");
        if (semestersRes.error) throw new Error("Failed to fetch semesters.");
        if (subjectsRes.error) throw new Error("Failed to fetch subjects.");

        setAllCourses(coursesRes.data as Course[]);
        setAllSemesters(semestersRes.data as Semester[]);
        setAllSubjects(subjectsRes.data as Subject[]);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [supabase]);

  // --- Form Handlers ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleDropdownChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
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

  // --- Handlers from AdmissionForm ---
  const searchCustomFieldsSuggestions = (event: AutoCompleteCompleteEvent) => {
    let query = event.query;
    let _suggestions: FieldOption[] = [];
    _suggestions = availableCustomFields.filter(option => 
      option.label.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredCustomFieldSuggestions(_suggestions);
  };
  
  const searchDocumentSuggestions = (event: AutoCompleteCompleteEvent) => {
    let query = event.query;
    let _suggestions: DocOption[] = [];
    _suggestions = availableDocuments.filter(option => 
      option.name.toLowerCase().includes(query.toLowerCase())
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
          setError(`Custom field "${cleanLabel}" has already been added.`);
          return;
      }
      const newField: CustomField = {
        id: Date.now().toString(),
        label: cleanLabel,
        value: "",
      }
      setCustomFields((prev) => [...prev, newField])
      setSelectedCustomField("") 
      setError(null)
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
          setError(`Document "${cleanDocName}" has already been added.`);
          return;
      }
      const newDoc: DocumentItem = {
        id: Date.now().toString(),
        name: cleanDocName,
      }
      setDocuments((prev) => [...prev, newDoc])
      setExpandedDocId(newDoc.id)
      setSelectedDocument("") 
      setError(null)
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

  // --- Reset Form Function ---
  const resetForm = () => {
    setFormData({
      firstname: "", middlename: "", lastname: "", email: "",
      phone_primary: "", phone_secondary: "", teacher_type: "",
      specialization: "", experience_start_date: "",
    });
    setSelectedCourses([]);
    setSubjectAssignments({});
    setCustomFields([]);
    setDocuments([]);
    setExpandedDocId(null);
    setSelectedCustomField("");
    setSelectedDocument("");
  }
  
  // --- Form Submission ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    if (documents.some(doc => !doc.file)) {
      setError("Please upload a file for all added document types.");
      setIsSubmitting(false);
      return;
    }
    if (customFields.some(field => field.value.trim() === "")) {
      setError("Please fill in a value for all added custom fields.");
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. Insert into 'teachers' table
      const { data: teacherData, error: teacherError } = await supabase
        .from("teachers")
        .insert([formData])
        .select()
        .single();

      if (teacherError) throw teacherError;
      
      const newTeacherId = teacherData.id;

      // 2. Prepare 'teacher_assignments'
      const assignmentsToInsert = [];
      for (const [courseId, subjectIds] of Object.entries(subjectAssignments)) {
        for (const subjectId of subjectIds) {
          assignmentsToInsert.push({
            teacher_id: newTeacherId,
            course_id: courseId,
            subject_id: subjectId,
          });
        }
      }

      // 3. Insert into 'teacher_assignments'
      if (assignmentsToInsert.length > 0) {
        const { error: assignmentError } = await supabase
          .from("teacher_assignments")
          .insert(assignmentsToInsert);

        if (assignmentError) throw assignmentError;
      }

      // 4. Upload Documents & Prepare Custom Data
      const bucketName = 'teacher_documents';
      const uploadedDocumentsData = [];

      for (const doc of documents) {
        if (!doc.file) continue;
        
        const fileExt = doc.file.name.split('.').pop();
        const cleanDocName = doc.name.replace(/[^a-zA-Z0-9]/g, '_');
        const uniqueFileName = `${cleanDocName}-${Date.now()}.${fileExt}`;
        const filePath = `${newTeacherId}/${uniqueFileName}`;

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

      const customData = customFields.reduce((acc, field) => {
          acc[field.label] = field.value.trim();
          return acc;
      }, {} as Record<string, string>);

      // 5. Update Teacher with Docs and Custom Data
      const { error: updateError } = await supabase
        .from("teachers")
        .update({
          documents: uploadedDocumentsData,
          custom_data: customData
        })
        .eq("id", newTeacherId);
      
      if (updateError) throw updateError;
      
      // 6. Success
      setSuccess(`Teacher ${teacherData.fullname} has been registered successfully!`);
      resetForm();
      
    } catch (err: any) {
      setError(err.message || "An error occurred during registration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Memoized Data for Render ---
  const subjectsByCourseMap = useMemo(() => {
    const map = new Map<string, Subject[]>();
    for (const course of allCourses) {
      const courseSemesterIds = allSemesters
        .filter(sem => sem.course_id === course.id)
        .map(sem => sem.id);
      
      const courseSubjects = allSubjects
        .filter(sub => courseSemesterIds.includes(sub.semester_id));
      
      map.set(course.id, courseSubjects);
    }
    return map;
  }, [allCourses, allSemesters, allSubjects]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <Card className="max-w-4xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Teacher Registration</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <Section title="Personal Details">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormInputGroup label="First Name" name="firstname" value={formData.firstname} onChange={handleChange} required />
                <FormInputGroup label="Middle Name" name="middlename" value={formData.middlename} onChange={handleChange} />
                <FormInputGroup label="Last Name" name="lastname" value={formData.lastname} onChange={handleChange} required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInputGroup label="Primary Email" name="email" type="email" value={formData.email} onChange={handleChange} required />
                <FormInputGroup label="Primary Phone" name="phone_primary" type="tel" value={formData.phone_primary} onChange={handleChange} required />
              </div>
              <FormInputGroup label="Secondary Phone (Optional)" name="phone_secondary" type="tel" value={formData.phone_secondary} onChange={handleChange} />
            </Section>

            <Section title="Professional Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="teacher_type" className="font-semibold">Teacher Type*</Label>
                  {/* --- FIX IS HERE --- */}
                  <Dropdown
                    id="teacher_type"
                    value={formData.teacher_type}
                    options={teacherTypes}
                    onChange={(e) => handleDropdownChange('teacher_type', e.value)} // <-- Use e.value
                    optionLabel="name"
                    optionValue="name" // <-- Add this
                    placeholder="Select a type"
                    className="w-full p-inputtext-sm"
                    required
                  />
                  {/* --- END OF FIX --- */}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="specialization" className="font-semibold">Specialization*</Label>
                  {/* --- FIX IS HERE --- */}
                  <Dropdown
                    id="specialization"
                    value={formData.specialization}
                    options={specializations}
                    onChange={(e) => handleDropdownChange('specialization', e.value)} // <-- Use e.value
                    optionLabel="name"
                    optionValue="name" // <-- Add this
                    placeholder="Select a specialization"
                    className="w-full p-inputtext-sm"
                    required
                  />
                  {/* --- END OF FIX --- */}
                </div>
              </div>
              <FormInputGroup
                label="Experience Starting Date"
                name="experience_start_date"
                type="date"
                value={formData.experience_start_date}
                onChange={handleChange}
                required
              />
            </Section>

            <Section title="Department & Subject Assignments">
              <div className="space-y-1">
                <Label htmlFor="departments" className="font-semibold">Select Departments (Courses)*</Label>
                <MultiSelect
                  id="departments"
                  value={selectedCourses}
                  options={allCourses}
                  onChange={(e) => handleCourseSelect(e.value)}
                  optionLabel="name"
                  placeholder="Select one or more departments"
                  className="w-full p-inputtext-sm"
                />
              </div>

              {selectedCourses.length > 0 && (
                <div className="space-y-4 mt-4 pt-4 border-t">
                  {selectedCourses.map(course => {
                    const subjectsForThisCourse = subjectsByCourseMap.get(course.id) || [];
                    return (
                      <div key={course.id} className="p-4 border rounded-lg bg-gray-50">
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                          <Building className="w-5 h-5 text-blue-600" />
                          {course.name}
                        </h3>
                        <p className="text-sm text-gray-500 mb-3">Select subjects for this department</p>
                        <MultiSelect
                          value={subjectAssignments[course.id] || []}
                          options={subjectsForThisCourse}
                          onChange={(e) => handleSubjectSelect(course.id, e.value)}
                          optionLabel="name"
                          optionValue="id"
                          placeholder="Select subjects..."
                          className="w-full p-inputtext-sm"
                          itemTemplate={(option: Subject) => (
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{option.name}</span>
                              <Badge variant={option.type === 'practical' ? 'default' : 'secondary'}
                                     className={option.type === 'practical' ? 'bg-green-100 text-green-800' : ''}>
                                {option.type}
                              </Badge>
                            </div>
                          )}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </Section>

            <Section title="Additional Information">
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
                  <Button
                    type="button"
                    onClick={handleAddCustomField}
                    disabled={typeof selectedCustomField !== 'object' || !selectedCustomField}
                    className="w-full sm:w-auto"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Field
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customFields.map((field) => (
                  <div key={field.id} className="relative group">
                    <FormInputGroup 
                      label={field.label} 
                      name={field.id} 
                      value={field.value} 
                      onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                      placeholder={`Enter value for ${field.label}`} 
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveCustomField(field.id)}
                      className="absolute -top-2 -right-2 p-1 text-red-500 bg-white rounded-full hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                      title={`Remove ${field.label}`}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Additional Documents">
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
                  <Button
                    type="button"
                    onClick={handleAddDocument}
                    disabled={typeof selectedDocument !== 'object' || !selectedDocument}
                    className="w-full sm:w-auto"
                  >
                    <Plus size={16} className="mr-2"/>
                    Add Doc
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <button
                      type="button"
                      onClick={() => toggleDocumentExpand(doc.id)}
                      className={`w-full p-3 flex items-center justify-between transition-colors text-left ${
                        expandedDocId === doc.id ? "bg-blue-50 border-b border-blue-200" : "bg-white hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <File size={18} className="text-blue-600" />
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{doc.name}</p>
                          {doc.file ? (
                            <p className="text-xs text-green-700 flex items-center gap-1">
                              <CheckCircle size={12} />
                              Uploaded: {doc.file.name}
                            </p>
                          ) : (
                            <p className="text-xs text-red-500">
                              File required - Click to upload
                            </p>
                          )}
                        </div>
                      </div>
                      <Trash2
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveDocument(doc.id);
                        }}
                        className="w-4 h-4 text-red-600 hover:text-red-800"
                      />
                    </button>

                    {expandedDocId === doc.id && (
                      <div className="p-3 bg-white border-t border-gray-100">
                        {doc.file ? (
                          <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-md">
                            <p className="text-xs font-medium text-green-900">{doc.file.name}</p>
                            <Label className="text-blue-600 hover:text-blue-700 cursor-pointer text-xs font-medium">
                              Change File
                              <Input type="file" onChange={(e) => handleDocumentUpload(e, doc.id)} className="hidden" />
                            </Label>
                          </div>
                        ) : (
                          <Label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-blue-300 rounded-md hover:border-blue-500 hover:bg-blue-50 cursor-pointer">
                            <Upload className="w-6 h-6 text-blue-600 mb-1" />
                            <span className="text-sm font-medium text-blue-700">Click to upload {doc.name}</span>
                            <Input type="file" onChange={(e) => handleDocumentUpload(e, doc.id)} className="hidden" />
                          </Label>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Section>

            {/* --- Submission & Messages --- */}
            <div>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Registration Failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert variant="default" className="mb-4 bg-green-50 border-green-200">
                  <AlertTitle className="text-green-800">Success</AlertTitle>
                  <AlertDescription className="text-green-700">{success}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <Plus className="h-5 w-5 mr-2" />
                )}
                Register Teacher
              </Button>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Helper Components ---

/**
 * A consistent section wrapper
 */
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="space-y-4 p-4 border rounded-lg">
    <h2 className="flex items-center gap-2 text-xl font-semibold border-b pb-2">
      <BookOpen className="w-5 h-5 text-blue-700" />
      {title}
    </h2>
    <div className="space-y-4">
      {children}
    </div>
  </section>
);

/**
 * Helper for form inputs
 */
const FormInputGroup: React.FC<{
  label: string,
  name: string,
  value: string,
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
  type?: string,
  required?: boolean,
  placeholder?: string
}> = ({ label, name, value, onChange, type = "text", required = false, placeholder = "" }) => (
  <div className="space-y-1">
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
);