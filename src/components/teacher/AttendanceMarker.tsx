import { useState, useEffect } from "react";
import { fetchStudents, fetchAttendanceForDate, saveAttendance } from "../../utils/firebaseService";
import { Student } from "../../types";

interface AttendanceMarkerProps {
  grade: number;
  className: string;
}

function AttendanceMarker({ grade, className }: AttendanceMarkerProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, { status: "present" | "absent" | "late" }>>({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load students for this class
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const studentsList = await fetchStudents(grade, className);
        setStudents(studentsList);
        
        // Check if there's existing attendance data for this date
        if (studentsList.length > 0) {
          await loadAttendanceForDate(date, studentsList);
        } else {
          setAttendance({});
        }
      } catch (error) {
        console.error("Error loading students:", error);
        setError("Failed to load students. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [grade, className]);
  
  // When date changes, load attendance for that date
  useEffect(() => {
    if (students.length > 0) {
      loadAttendanceForDate(date, students);
    }
  }, [date]);
  
  const loadAttendanceForDate = async (selectedDate: string, studentsList: Student[]) => {
    try {
      const attendanceData = await fetchAttendanceForDate(grade, className, selectedDate);
      
      if (Object.keys(attendanceData).length > 0) {
        // Use existing attendance data
        // Convert the new format to the format expected by the component
        const initialAttendance: Record<string, { status: "present" | "absent" | "late" }> = {};
        Object.entries(attendanceData).forEach(([studentId, data]) => {
          initialAttendance[studentId] = { 
            status: data.status
          };
        });
        setAttendance(initialAttendance);
      } else {
        // Initialize all students as present by default
        const initialAttendance: Record<string, { status: "present" | "absent" | "late" }> = {};
        studentsList.forEach(student => {
          initialAttendance[student.id] = { status: "present" };
        });
        setAttendance(initialAttendance);
      }
    } catch (error) {
      console.error("Error loading attendance:", error);
    }
  };
  
  const handleAttendanceChange = (studentId: string, status: "present" | "absent" | "late") => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: { status }
    }));
  };
  
  const handleSaveAttendance = async () => {
    setError("");
    setSuccess("");
    setSaveLoading(true);
    
    try {
      await saveAttendance(grade, className, date, attendance);
      setSuccess("Attendance saved successfully!");
    } catch (error) {
      setError("Failed to save attendance. Please try again.");
      console.error("Error saving attendance:", error);
    } finally {
      setSaveLoading(false);
    }
  };
  
  if (loading) {
    return <div>Loading attendance records...</div>;
  }
  
  if (students.length === 0) {
    return <div>No students found. Please add students to your class first.</div>;
  }
  
  return (
    <div className="attendance-marker">
      <h3>Mark Attendance</h3>
      
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}
      
      <div className="date-selector">
        <label htmlFor="date">Date: </label>
        <input 
          id="date"
          type="date" 
          value={date} 
          onChange={(e) => setDate(e.target.value)} 
        />
      </div>
      
      <div className="attendance-note">
        <p><em>Note: Late arrivals are counted as present for attendance rate calculations.</em></p>
      </div>
      
      <div className="table-container">
        <table className="attendance-table mobile-friendly-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Index</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {students.map(student => (
              <tr key={student.id}>
                <td data-label="Name">{student.name}</td>
                <td data-label="Index">{student.index}</td>
                <td data-label="Status" className="status-cell">
                  <div className="button-group">
                    <button 
                      className={`small-button ${attendance[student.id]?.status === "present" ? "approve-button" : ""}`}
                      onClick={() => handleAttendanceChange(student.id, "present")}
                    >
                      Present
                    </button>
                    <button 
                      className={`small-button ${attendance[student.id]?.status === "absent" ? "reject-button" : ""}`}
                      onClick={() => handleAttendanceChange(student.id, "absent")}
                    >
                      Absent
                    </button>
                    <button 
                      className={`small-button ${attendance[student.id]?.status === "late" ? "check-button" : ""}`}
                      onClick={() => handleAttendanceChange(student.id, "late")}
                    >
                      Late
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="attendance-save-container">
        <button 
          onClick={handleSaveAttendance} 
          className="save-button"
          disabled={saveLoading}
        >
          {saveLoading ? "Saving..." : "Save Attendance"}
        </button>
      </div>
    </div>
  );
}

export default AttendanceMarker; 