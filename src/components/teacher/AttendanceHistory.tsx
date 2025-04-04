import { useState, useEffect } from "react";
import { fetchStudents, fetchAttendanceHistory } from "../../utils/firebaseService";
import { Student } from "../../types";
import React from "react";

interface AttendanceHistoryProps {
  grade: number;
  className: string;
}

interface AttendanceRecord {
  status: string; 
  studentName: string; 
  studentIndex: string; 
  timestamp: {
    seconds: number;
    nanoseconds: number;
  } | string | number;
}

// Define the type for the attendance history data
type AttendanceData = Record<string, Record<string, AttendanceRecord | boolean>>;

function AttendanceHistory({ grade, className }: AttendanceHistoryProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceData>({});
  const [dates, setDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch students
        const studentsList = await fetchStudents(grade, className);
        setStudents(studentsList);
        
        // Fetch attendance history
        const attendanceData = await fetchAttendanceHistory(grade, className);
        
        if (Object.keys(attendanceData).length > 0) {
          setAttendanceHistory(attendanceData as AttendanceData);
          
          // Extract and sort dates
          const datesList = Object.keys(attendanceData);
          datesList.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
          setDates(datesList);
        } else {
          setAttendanceHistory({});
          setDates([]);
        }
      } catch (error) {
        console.error("Error fetching attendance history:", error);
        setError("Failed to load attendance history. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [grade, className]);
  
  if (loading) {
    return (
      <div className="attendance-history">
        <h3>Attendance History - Grade {grade} {className}</h3>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading attendance records...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="attendance-history">
        <h3>Attendance History - Grade {grade} {className}</h3>
        <div className="error-state">
          <p>{error}</p>
        </div>
      </div>
    );
  }
  
  if (dates.length === 0) {
    return (
      <div className="attendance-history">
        <h3>Attendance History - Grade {grade} {className}</h3>
        <div className="empty-state">
          <p>No attendance records found for this class.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="attendance-history">
      <h3>Attendance History - Grade {grade} {className}</h3>
      
      <div className="attendance-legend">
        <div className="legend-item">
          <div className="color-box present"></div>
          <span>Present</span>
        </div>
        <div className="legend-item">
          <div className="color-box absent"></div>
          <span>Absent</span>
        </div>
        <div className="legend-item">
          <div className="color-box late"></div>
          <span>Late</span>
        </div>
        <div className="legend-item">
          <div className="color-box unknown"></div>
          <span>No Record</span>
        </div>
      </div>
      
      <div className="simple-table-container">
        <table className="simple-attendance-table">
          <thead>
            <tr>
              <th>Student</th>
              {dates.map(date => (
                <th key={date}>{formatDate(date)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map(student => (
              <tr key={student.id}>
                <td className="student-name">{student.name}</td>
                {dates.map(date => {
                  const record = attendanceHistory[date]?.[student.id];
                  const status = getAttendanceStatus(record);
                  return (
                    <td 
                      key={`${student.id}-${date}`}
                      className={`attendance-cell ${status}`}
                      title={getStatusText(status)}
                    >
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  };
  return date.toLocaleDateString(undefined, options);
}

function getAttendanceStatus(record: AttendanceRecord | undefined | boolean): string {
  if (!record) {
    return 'unknown';
  }
  
  if (typeof record === 'boolean') {
    return record ? 'present' : 'absent';
  }
  
  if (typeof record === 'object' && 'status' in record) {
    return record.status;
  }
  
  return 'unknown';
}

function getStatusText(status: string): string {
  switch(status) {
    case 'present':
      return 'Present';
    case 'absent':
      return 'Absent';
    case 'late':
      return 'Late (counted as present)';
    default:
      return 'No record';
  }
}

export default AttendanceHistory;