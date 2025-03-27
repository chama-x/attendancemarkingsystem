import { ref, get, set, push, remove, query, limitToLast, orderByKey, update, serverTimestamp } from "firebase/database";
import { database } from "../firebaseConfig";
import { Student, AttendanceRecord } from "../types";

/**
 * Firebase service utility functions for common database operations
 */

// Students
export const fetchStudents = async (grade: number, className: string): Promise<Student[]> => {
  try {
    const studentsRef = ref(database, `students/grade${grade}${className}`);
    const snapshot = await get(studentsRef);
    
    if (snapshot.exists()) {
      const studentsData = snapshot.val();
      return Object.entries(studentsData).map(([id, data]) => ({
        id,
        name: (data as any).name,
        index: (data as any).index || '',
      }));
    }
    
    return [];
  } catch (error) {
    console.error("Error fetching students:", error);
    throw error;
  }
};

export const addStudent = async (grade: number, className: string, name: string, index: string): Promise<string> => {
  try {
    const studentsRef = ref(database, `students/grade${grade}${className}`);
    const newStudentRef = push(studentsRef);
    
    await set(newStudentRef, {
      name: name.trim(),
      index: index.trim(),
    });
    
    return newStudentRef.key || "";
  } catch (error) {
    console.error("Error adding student:", error);
    throw error;
  }
};

export const updateStudent = async (grade: number, className: string, studentId: string, data: {name?: string, index?: string}): Promise<void> => {
  try {
    const studentRef = ref(database, `students/grade${grade}${className}/${studentId}`);
    await update(studentRef, data);
  } catch (error) {
    console.error("Error updating student:", error);
    throw error;
  }
};

export const removeStudent = async (grade: number, className: string, studentId: string): Promise<void> => {
  try {
    const studentRef = ref(database, `students/grade${grade}${className}/${studentId}`);
    await remove(studentRef);
  } catch (error) {
    console.error("Error removing student:", error);
    throw error;
  }
};

// Attendance
export const fetchAttendanceForDate = async (
  grade: number, 
  className: string, 
  date: string
): Promise<Record<string, {
  studentName: string;
  studentIndex: string;
  status: "present" | "absent" | "late";
  timestamp: any;
}>> => {
  try {
    const attendanceRef = ref(database, `attendance/grade${grade}${className}/${date}`);
    const snapshot = await get(attendanceRef);
    
    if (snapshot.exists()) {
      return snapshot.val();
    }
    
    return {};
  } catch (error) {
    console.error("Error fetching attendance:", error);
    throw error;
  }
};

export const saveAttendance = async (
  grade: number, 
  className: string, 
  date: string, 
  attendanceData: Record<string, { status: "present" | "absent" | "late" }>
): Promise<void> => {
  try {
    // Get students to include names and indices
    const studentsList = await fetchStudents(grade, className);
    
    // Create a reference for the attendance data
    const attendanceRef = ref(database, `attendance/grade${grade}${className}/${date}`);
    
    // Prepare the attendance data with student names and indices
    const processedData: Record<string, any> = {};
    
    // For each student ID in the attendance data
    for (const studentId in attendanceData) {
      const student = studentsList.find(s => s.id === studentId);
      if (student) {
        processedData[studentId] = {
          studentName: student.name,
          studentIndex: student.index,
          status: attendanceData[studentId].status,
          timestamp: serverTimestamp()
        };
      }
    }
    
    // Set the attendance data
    await set(attendanceRef, processedData);
  } catch (error) {
    console.error("Error saving attendance:", error);
    throw error;
  }
};

export const fetchAttendanceHistory = async (
  grade: number, 
  className: string,
  limit = 30
): Promise<Record<string, Record<string, any>>> => {
  try {
    const attendanceRef = ref(database, `attendance/grade${grade}${className}`);
    const attendanceQuery = query(attendanceRef, orderByKey(), limitToLast(limit));
    const snapshot = await get(attendanceQuery);
    
    if (snapshot.exists()) {
      return snapshot.val();
    }
    
    // Check old path format for backward compatibility
    const oldFormatRef = ref(database, `attendance/${grade}/${className}`);
    const oldFormatQuery = query(oldFormatRef, orderByKey(), limitToLast(limit));
    const oldFormatSnapshot = await get(oldFormatQuery);
    
    if (oldFormatSnapshot.exists()) {
      console.log("Found attendance data in old format path, consider migrating");
      return oldFormatSnapshot.val();
    }
    
    return {};
  } catch (error) {
    console.error("Error fetching attendance history:", error);
    throw error;
  }
};

// Teacher Management
export const removeTeacher = async (teacherId: string): Promise<void> => {
  try {
    const teacherRef = ref(database, `users/${teacherId}`);
    await remove(teacherRef);
  } catch (error) {
    console.error("Error removing teacher:", error);
    throw error;
  }
};

export const updateTeacher = async (teacherId: string, data: {grade?: number, class?: string}): Promise<void> => {
  try {
    const teacherRef = ref(database, `users/${teacherId}`);
    await update(teacherRef, data);
  } catch (error) {
    console.error("Error updating teacher:", error);
    throw error;
  }
};

export const markAttendance = async (
  grade: number,
  className: string,
  date: string,
  attendanceData: Record<string, { status: "present" | "absent" | "late" }>
) => {
  try {
    const studentsList = await fetchStudents(grade, className);
    
    // Create a reference for the attendance data - Use consistent path format
    const attendanceRef = ref(database, `attendance/grade${grade}${className}/${date}`);
    
    // Prepare the attendance data
    const processedData: Record<string, any> = {};
    
    // For each student ID in the attendance data
    for (const studentId in attendanceData) {
      const student = studentsList.find(s => s.id === studentId);
      if (student) {
        processedData[studentId] = {
          studentName: student.name,
          studentIndex: student.index,
          status: attendanceData[studentId].status,
          timestamp: serverTimestamp()
        };
      }
    }
    
    // Set the attendance data
    await set(attendanceRef, processedData);
    return true;
  } catch (error) {
    console.error("Error marking attendance:", error);
    throw error;
  }
};

export const fetchAttendanceByDate = async (
  grade: number, 
  className: string, 
  date: string
): Promise<Array<{
  id: string;
  studentName: string;
  studentIndex: string;
  status: "present" | "absent" | "late";
  timestamp: any;
}>> => {
  try {
    // Use consistent path format
    const attendanceRef = ref(database, `attendance/grade${grade}${className}/${date}`);
    const snapshot = await get(attendanceRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const data = snapshot.val();
    return Object.keys(data).map(id => ({
      id,
      studentName: data[id].studentName,
      studentIndex: data[id].studentIndex || "", // Fallback for existing records
      status: data[id].status,
      timestamp: data[id].timestamp
    }));
  } catch (error) {
    console.error("Error fetching attendance:", error);
    throw error;
  }
};

// Attendance Permission Requests
export const requestAttendancePermission = async (
  requesterId: string,
  requesterEmail: string,
  requesterName: string,
  targetGrade: number,
  targetClass: string,
  targetDate: string,
  reason: string
): Promise<string> => {
  try {
    const permissionsRef = ref(database, 'attendancePermissions');
    const newRequestRef = push(permissionsRef);
    
    await set(newRequestRef, {
      requesterId,
      requesterEmail,
      requesterName,
      targetGrade,
      targetClass,
      targetDate,
      reason,
      status: 'pending',
      requestedAt: serverTimestamp(),
    });
    
    return newRequestRef.key || "";
  } catch (error) {
    console.error("Error requesting attendance permission:", error);
    throw error;
  }
};

export const fetchPermissionRequests = async (
  status?: 'pending' | 'approved' | 'rejected'
) => {
  try {
    const permissionsRef = ref(database, 'attendancePermissions');
    const snapshot = await get(permissionsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const requests = Object.entries(snapshot.val()).map(([id, data]) => ({
      id,
      ...data as any,
    }));
    
    // Filter by status if provided
    if (status) {
      return requests.filter(request => request.status === status);
    }
    
    return requests;
  } catch (error) {
    console.error("Error fetching permission requests:", error);
    throw error;
  }
};

export const fetchTeacherPermissionRequests = async (
  teacherId: string,
  status?: 'pending' | 'approved' | 'rejected'
) => {
  try {
    const permissionsRef = ref(database, 'attendancePermissions');
    const snapshot = await get(permissionsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const requests = Object.entries(snapshot.val())
      .map(([id, data]) => ({
        id,
        ...data as any,
      }))
      .filter(request => request.requesterId === teacherId);
    
    // Filter by status if provided
    if (status) {
      return requests.filter(request => request.status === status);
    }
    
    return requests;
  } catch (error) {
    console.error("Error fetching teacher permission requests:", error);
    throw error;
  }
};

export const approvePermissionRequest = async (
  requestId: string,
  responderId: string
) => {
  try {
    const requestRef = ref(database, `attendancePermissions/${requestId}`);
    await update(requestRef, {
      status: 'approved',
      responderId,
      respondedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error("Error approving permission request:", error);
    throw error;
  }
};

export const rejectPermissionRequest = async (
  requestId: string,
  responderId: string
) => {
  try {
    const requestRef = ref(database, `attendancePermissions/${requestId}`);
    await update(requestRef, {
      status: 'rejected',
      responderId,
      respondedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error("Error rejecting permission request:", error);
    throw error;
  }
};

export const checkPermissionToMarkAttendance = async (
  teacherId: string,
  grade: number,
  className: string,
  date: string
) => {
  try {
    // Check if the teacher is assigned to this class (naturally has permission)
    const userRef = ref(database, `users/${teacherId}`);
    const userSnapshot = await get(userRef);
    
    if (userSnapshot.exists()) {
      const userData = userSnapshot.val();
      if (userData.role === 'teacher' && 
          userData.grade === grade && 
          userData.class === className) {
        return { hasPermission: true, isAssigned: true };
      }
    }
    
    // Check if teacher has an approved permission
    const permissionsRef = ref(database, 'attendancePermissions');
    const snapshot = await get(permissionsRef);
    
    if (!snapshot.exists()) {
      return { hasPermission: false, isAssigned: false };
    }
    
    const requests = Object.values(snapshot.val() as any).filter((request: any) => 
      request.requesterId === teacherId &&
      request.targetGrade === grade &&
      request.targetClass === className &&
      request.targetDate === date &&
      request.status === 'approved'
    );
    
    return { 
      hasPermission: requests.length > 0, 
      isAssigned: false,
      permissionRequest: requests.length > 0 ? requests[0] : null
    };
  } catch (error) {
    console.error("Error checking attendance permission:", error);
    throw error;
  }
};

// Data migration utilities
export const migrateAttendanceData = async (
  grade: number,
  className: string,
  date: string
): Promise<boolean> => {
  try {
    console.log(`Migrating attendance data for Grade ${grade}${className} on ${date}...`);
    
    // Check if data exists in old format
    const oldFormatRef = ref(database, `attendance/${grade}/${className}/${date}`);
    const oldSnapshot = await get(oldFormatRef);
    
    if (!oldSnapshot.exists()) {
      console.log(`No old format data found for Grade ${grade}${className} on ${date}`);
      return false;
    }
    
    // Get the old data
    const oldData = oldSnapshot.val();
    
    // Get student data to enrich the records
    const students = await fetchStudents(grade, className);
    
    // Create the new format data
    const newData: Record<string, any> = {};
    
    for (const studentId in oldData) {
      const student = students.find(s => s.id === studentId);
      if (student) {
        const oldStatus = oldData[studentId];
        // Convert boolean status to string format
        const status = typeof oldStatus === 'boolean' 
          ? (oldStatus ? 'present' : 'absent') 
          : (oldStatus.status || 'unknown');
        
        newData[studentId] = {
          studentName: student.name,
          studentIndex: student.index,
          status: status,
          timestamp: serverTimestamp()
        };
      }
    }
    
    // Save to new format path
    const newFormatRef = ref(database, `attendance/grade${grade}${className}/${date}`);
    await set(newFormatRef, newData);
    
    console.log(`Successfully migrated data for Grade ${grade}${className} on ${date}`);
    
    // Optionally, remove old data (uncomment if desired)
    // await remove(oldFormatRef);
    // console.log(`Removed old format data for Grade ${grade}${className} on ${date}`);
    
    return true;
  } catch (error) {
    console.error(`Error migrating attendance data for Grade ${grade}${className} on ${date}:`, error);
    return false;
  }
}; 