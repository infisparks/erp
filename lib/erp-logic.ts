/**
 * ERP Logic Layer
 * 
 * This file contains business logic migrated from the server-side to be 
 * accessible directly from the client. This handles fee calculations,
 * data hydration, and complex student registration logic.
 */

import { SupabaseClient } from "@supabase/supabase-js";

// --- Metadata & Configuration ---

export async function getAdmissionMetadata(supabase: SupabaseClient) {
    const [
        streamsRes,
        yearCatRes,
        scholarshipRes,
        coursesRes,
        semestersRes,
        academicYearsRes
    ] = await Promise.all([
        supabase.from('streams').select('id, name').order('name'),
        supabase.from('year_category').select('id, name').order('name'),
        supabase.from('scholarship_categories').select('id, name').order('name'),
        supabase.from('courses').select('id, name, stream_id').order('name'),
        supabase.from('semesters').select('id, name, academic_year_id').order('name'),
        supabase.from('academic_years').select('id, name, course_id, sequence').order('sequence')
    ]);

    if (streamsRes.error) console.error("Metadata Error (Streams):", streamsRes.error.message);
    if (yearCatRes.error) console.error("Metadata Error (YearCat):", yearCatRes.error.message);
    if (scholarshipRes.error) console.error("Metadata Error (Scholarship):", scholarshipRes.error.message);
    if (coursesRes.error) console.error("Metadata Error (Courses):", coursesRes.error.message);
    if (semestersRes.error) console.error("Metadata Error (Semesters):", semestersRes.error.message);
    if (academicYearsRes.error) console.error("Metadata Error (AcademicYears):", academicYearsRes.error.message);

    return {
        streams: streamsRes.data || [],
        yearCategories: yearCatRes.data || [],
        scholarshipCategories: scholarshipRes.data || [],
        courses: coursesRes.data || [],
        semesters: semestersRes.data || [],
        academicYears: academicYearsRes.data || [],
        staticOptions: {
            quotas: ["Minority", "Management", "Government", "NRI", "Tuition Fee Waiver"],
            disciplines: ["Engineering", "Architecture", "Pharmacy", "Management"],
            howDidYouKnow: ["Counsellor", "Advertisement", "Friend", "Social Media", "Website"],
            admissionTypes: ["First Year", "Direct Second Year"],
            genders: ["Male", "Female", "Other"],
            bloodGroups: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
            paymentPlans: ["One Time", "Installments"]
        }
    };
}

// --- Fee Calculations ---

export async function calculateStudentFees(supabase: SupabaseClient, params: {
    courseId: string;
    academicYearId: string;
    scholarshipCategoryId?: string;
}) {
    const { courseId, academicYearId, scholarshipCategoryId } = params;

    // 1. Fetch Gross Course Fee
    const { data: feeData, error: feeError } = await supabase
        .from('course_fees')
        .select('id, amount')
        .eq('course_id', courseId)
        .eq('academic_year_id', academicYearId)
        .maybeSingle();

    if (feeError) throw new Error(`Fee lookup failed: ${feeError.message}`);

    const totalFee = Number(feeData?.amount || 0);

    // 2. Fetch Scholarship Amount
    let scholarshipAmt = 0;
    if (scholarshipCategoryId) {
        const { data: schData, error: schError } = await supabase
            .from('scholarship_amounts')
            .select('amount')
            .eq('course_id', courseId)
            .eq('category_id', scholarshipCategoryId)
            .maybeSingle();
            
        if (schError) console.warn("Scholarship lookup error:", schError.message);
        scholarshipAmt = Number(schData?.amount || 0);
    }

    return {
        feeId: feeData?.id,
        totalFee,
        scholarshipAmt,
        netPayable: totalFee - scholarshipAmt,
        currency: "INR",
        timestamp: new Date().toISOString()
    };
}

// --- Student Operations ---

export async function getStudentProfile(supabase: SupabaseClient, userId: string) {
    const { data, error } = await supabase
        .from("students")
        .select(`
            *,
            courses (id, name, stream_id),
            year_category (id, name),
            semesters!students_current_sem_id_fkey (
                id, 
                name,
                academic_years (id, name)
            )
        `)
        .eq("user_id", userId)
        .maybeSingle();

    if (error) throw new Error(`Database Error: ${error.message}`);
    return data;
}

export async function getStudentEnrollmentProgress(supabase: SupabaseClient, studentId: string) {
    const { data: student } = await supabase
        .from('students')
        .select('course_id')
        .eq('id', studentId)
        .single();
    if (!student) return null;

    const [yearsRes, enrollmentsRes] = await Promise.all([
        supabase
            .from('academic_years')
            .select('*, semesters(*, subjects(*))')
            .eq('course_id', student.course_id)
            .order('sequence', { ascending: true }),
        supabase
            .from('student_semesters')
            .select('*, semesters(id, name, academic_year_id)')
            .eq('student_id', studentId)
    ]);
    return {
        years: yearsRes.data || [],
        enrollments: enrollmentsRes.data || []
    };
}

export async function submitAdmissionForm(supabase: SupabaseClient, userId: string, formData: any) {
    // 1. Validation Logic
    const requiredFields = [
        'firstName', 'lastName', 'email', 'studentMobileNo',
        'fatherName', 'motherName', 'dateOfBirth', 'gender',
        'course_id', 'academic_year_id', 'semester_id',
        'admission_category', 'admission_type',
        'correspondenceAddress', 'correspondenceCity', 'correspondencePinCode',
        'permanentAddress', 'permanentCity', 'permanentPinCode',
        'aadharCardNumber', 'nationality', 'religion', 'caste'
    ];

    const missing = requiredFields.filter(field => !formData[field]);
    if (missing.length > 0) {
        throw new Error(`Incomplete Application: Missing fields (${missing.join(", ")})`);
    }

    // 2. Prepare Insert Data
    const studentInsertData = {
        user_id: userId,
        registration_no: formData.registration_no,
        merit_no: formData.merit_no,
        quota_selection: formData.quota_selection,
        discipline: formData.discipline,
        branch_preferences: Array.isArray(formData.branch_preferences) 
            ? formData.branch_preferences.join(", ") 
            : formData.branch_preferences,
        how_did_you_know: formData.how_did_you_know,
        scholarship_category_id: formData.scholarship_category_id,
        admission_type: formData.admission_type,
        fullname: `${formData.firstName} ${formData.middleName} ${formData.lastName}`.toUpperCase(),
        firstname: formData.firstName,
        lastname: formData.lastName,
        middlename: formData.middleName,
        father_name: formData.fatherName,
        mother_name: formData.motherName,
        father_occupation: formData.father_occupation,
        mother_occupation: formData.mother_occupation,
        father_annual_income: formData.father_annual_income,
        mother_annual_income: formData.mother_annual_income,
        email: formData.email,
        dateofbirth: formData.dateOfBirth,
        gender: formData.gender,
        religion: formData.religion,
        caste: formData.caste,
        blood_group: formData.blood_group,
        aadhar_card_number: formData.aadharCardNumber,
        pan_no: formData.pan_no,
        admission_year_id: formData.academic_year_id,
        course_id: formData.course_id,
        student_mobile_no: formData.studentMobileNo,
        secondary_phone: formData.secondary_phone,
        address: formData.correspondenceAddress,
        city: formData.correspondenceCity,
        state: formData.correspondenceState,
        zipcode: formData.correspondencePinCode,
        domicile_of_maharashtra: formData.domicile_of_maharashtra,
        phd_handicap: formData.ph_handicap,
        nationality: formData.nationality,
        place_of_birth: formData.place_of_birth,
        native_place: formData.native_place,
        correspondence_details: {
            taluka: formData.correspondenceTaluka,
            district: formData.correspondenceDistrict,
            post: formData.correspondencePost,
        },
        permanent_details: {
            address: formData.permanentAddress,
            city: formData.permanentCity,
            state: formData.permanentState,
            zipcode: formData.permanentPinCode,
            post: formData.permanentPost,
            taluka: formData.permanentTaluka,
            district: formData.permanentDistrict,
        },
        academic_records: formData.academic_records || {},
        documents: formData.documents || [],
        is_verifiedby_admin: false,
        current_sem_id: formData.semester_id
    };

    // 3. Check for existing student record
    const { data: existing } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

    const { data: newStudent, error: studentError } = await supabase
        .from("students")
        .upsert(studentInsertData) 
        .select("id")
        .single();

    if (studentError) throw new Error(`Student Record Error: ${studentError.message}`);

    // 4. Academic Year & Semester Initialization (only for new students)
    if (!existing) {
        const { data: academicYear, error: ayError } = await supabase
            .from("student_academic_years")
            .insert({
                student_id: newStudent.id,
                course_id: formData.course_id,
                academic_year_session: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
                status: 'Active'
            })
            .select("id")
            .single();

        if (ayError) throw new Error(`Academic Entry Error: ${ayError.message}`);

        const { error: semesterError } = await supabase
            .from("student_semesters")
            .insert({
                student_id: newStudent.id,
                student_academic_year_id: academicYear.id,
                semester_id: formData.semester_id || 1,
                status: 'active'
            });

        if (semesterError) throw new Error(`Semester Enrollment Error: ${semesterError.message}`);
    }

    return newStudent;
}

// --- Management Logic ---

export async function getAllPendingStudents(supabase: SupabaseClient) {
    const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("is_verifiedby_admin", false);

    if (error) throw new Error(`Fetch Failed: ${error.message}`);
    return data;
}

export async function verifyStudent(supabase: SupabaseClient, studentId: string) {
    const { data, error } = await supabase
        .from("students")
        .update({ is_verifiedby_admin: true })
        .eq("id", studentId)
        .select()
        .single();

    if (error) throw new Error(`Verification Failed: ${error.message}`);
    return data;
}

/**
 * Determines the user type and their status across the system.
 */
export async function getUserType(supabase: any, userId: string): Promise<{
    type: 'student' | 'management' | null,
    role?: string,
    isApproved: boolean,
    profile?: any
}> {
    // Check Management first
    const { data: mgmt } = await supabase
        .from('management')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

    if (mgmt) {
        return {
            type: 'management',
            role: mgmt.role,
            isApproved: mgmt.is_approved,
            profile: mgmt
        };
    }

    // Check Student
    const { data: student } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    if (student) {
        return {
            type: 'student',
            isApproved: student.is_verifiedby_admin,
            profile: student
        };
    }

    return { type: null, isApproved: false };
}
