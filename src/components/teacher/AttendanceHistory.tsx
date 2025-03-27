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

function AttendanceHistory({ grade, className }: AttendanceHistoryProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<Record<string, Record<string, AttendanceRecord>>>({});
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
          setAttendanceHistory(attendanceData);
          
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
    return <div>Loading attendance history...</div>;
  }
  
  if (error) {
    return <div className="error-message">{error}</div>;
  }
  
  if (dates.length === 0) {
    return <div>No attendance records found for this class.</div>;
  }
  
  return (
    <div className="attendance-history">
      <h3>Attendance History - Grade {grade} {className}</h3>
      
      <div className="attendance-note">
        <p><em>Note: Late arrivals (*) are counted as present for attendance rate calculations.</em></p>
      </div>
      
      {dates.length > 0 ? (
        <div className="table-container">
          <table className="attendance-table mobile-friendly-table">
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
                  <td data-label="Student">{student.name}</td>
                  {dates.map(date => (
                    <td 
                      key={`${student.id}-${date}`} 
                      data-label={formatDate(date)} 
                      className="status-cell"
                    >
                      {renderAttendanceStatus(attendanceHistory[date]?.[student.id])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No attendance records found for this class.</p>
      )}
      
      <div className="attendance-legend">
        <p><span className="attendance-present">✅</span> Present</p>
        <p><span className="attendance-absent">❌</span> Absent</p>
        <p><span className="attendance-late">⏰*</span> Late (Counted as Present for attendance rate)</p>
        <p><span className="attendance-unknown">-</span> No record</p>
      </div>
    </div>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

function renderAttendanceStatus(record: AttendanceRecord | undefined | boolean): React.ReactElement {
  if (!record) {
    return <span className="attendance-unknown">Unknown</span>;
  }
  
  if (typeof record === 'boolean') {
    return record ? 
      <span className="attendance-present">Present</span> : 
      <span className="attendance-absent">Absent</span>;
  }
  
  if (typeof record === 'object' && 'status' in record) {
    switch(record.status) {
      case 'present':
        return <span className="attendance-present">Present</span>;
      case 'absent':
        return <span className="attendance-absent">Absent</span>;
      case 'late':
        return <span className="attendance-late">Late*</span>;
      default:
        return <span className="attendance-unknown">Unknown</span>;
    }
  }
  
  return <span className="attendance-unknown">Unknown</span>;
}

export default AttendanceHistory; 