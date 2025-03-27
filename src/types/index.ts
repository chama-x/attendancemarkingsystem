// User types
export interface User {
  uid: string;
  email: string;
  role: 'admin' | 'teacher';
}

export interface Teacher extends User {
  role: 'teacher';
  grade: number;
  class: string;
}

export interface Admin extends User {
  role: 'admin';
}

// Student type
export interface Student {
  id: string;
  name: string;
  index: string;
}

// Attendance type
export interface AttendanceRecord {
  id: string;
  studentName: string;
  studentIndex: string;
  status: "present" | "absent" | "late";
  timestamp: any;
}

export interface AttendanceData {
  [date: string]: AttendanceRecord;
}

export interface ClassAttendance {
  [classId: string]: AttendanceData;
}

// Permission request types
export type PermissionStatus = 'pending' | 'approved' | 'rejected';

export interface AttendancePermissionRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  targetGrade: number;
  targetClass: string;
  targetDate: string;
  reason: string;
  status: PermissionStatus;
  requestedAt: any;
  respondedAt?: any;
  responderId?: string;
} 