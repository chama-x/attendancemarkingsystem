import { useState, useEffect } from "react";
import { fetchStudents, checkPermissionToMarkAttendance, markAttendance } from "../../utils/firebaseService";
import { useAuth } from "../../context/AuthContext";
import { Student } from "../../types";
import RequestPermissionForm from "./RequestPermissionForm";

function OtherClassAttendance() {
  const { currentUser } = useAuth();
  const [grade, setGrade] = useState("");
  const [className, setClassName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [hasPermission, setHasPermission] = useState(false);
  const [isAssigned, setIsAssigned] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState(false);
  const [permissionMessage, setPermissionMessage] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [attendance, setAttendance] = useState<Record<string, { status: "present" | "absent" | "late" }>>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Reset whenever grade, class or date changes
    setHasPermission(false);
    setIsAssigned(false);
    setPermissionMessage("");
    setStudents([]);
    setAttendance({});
    setError("");
    setSuccess("");
  }, [grade, className, date]);

  const handleCheckPermission = async () => {
    if (!currentUser) return;
    if (!grade || !className || !date) {
      setError("Please select a grade, class, and date");
      return;
    }

    setCheckingPermission(true);
    setPermissionMessage("");
    setError("");
    
    try {
      const result = await checkPermissionToMarkAttendance(
        currentUser.uid,
        parseInt(grade),
        className,
        date
      );
      
      setHasPermission(result.hasPermission);
      setIsAssigned(result.isAssigned);
      
      if (result.hasPermission) {
        if (result.isAssigned) {
          setPermissionMessage("You are assigned to this class");
        } else {
          setPermissionMessage("You have permission to mark attendance for this class");
        }
        
        // Fetch students
        await loadStudents();
      } else {
        setPermissionMessage("You don't have permission to mark attendance for this class");
      }
    } catch (error) {
      console.error("Error checking permission:", error);
      setError("Failed to check permission. Please try again.");
    } finally {
      setCheckingPermission(false);
    }
  };

  const loadStudents = async () => {
    if (!grade || !className) return;
    
    setLoading(true);
    setError("");
    
    try {
      const studentsList = await fetchStudents(parseInt(grade), className);
      setStudents(studentsList);
      
      // Initialize attendance with all students present
      const initialAttendance: Record<string, { status: "present" | "absent" | "late" }> = {};
      studentsList.forEach(student => {
        initialAttendance[student.id] = { status: "present" };
      });
      setAttendance(initialAttendance);
    } catch (error) {
      console.error("Error loading students:", error);
      setError("Failed to load students. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = (studentId: string, status: "present" | "absent" | "late") => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: { status }
    }));
  };

  const handleSaveAttendance = async () => {
    if (!currentUser || !hasPermission) return;
    
    setSaving(true);
    setError("");
    setSuccess("");
    
    try {
      await markAttendance(
        parseInt(grade),
        className,
        date,
        attendance
      );
      
      setSuccess("Attendance saved successfully!");
    } catch (error) {
      console.error("Error saving attendance:", error);
      setError("Failed to save attendance. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handlePermissionRequested = () => {
    // Reset form state
    setGrade("");
    setClassName("");
    setDate(new Date().toISOString().split('T')[0]);
    setHasPermission(false);
    setPermissionMessage("");
  };

  return (
    <div className="other-class-attendance">
      <h3>Mark Attendance for Other Classes</h3>
      
      <div className="class-selection-form">
        <div className="form-group">
          <label htmlFor="grade">Grade:</label>
          <input
            type="number"
            id="grade"
            min="1"
            max="13"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            disabled={checkingPermission || loading || saving}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="className">Class:</label>
          <input
            type="text"
            id="className"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="e.g., A, B, C"
            disabled={checkingPermission || loading || saving}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="date">Date:</label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={checkingPermission || loading || saving}
          />
        </div>
        
        <button
          onClick={handleCheckPermission}
          className="check-button"
          disabled={!grade || !className || !date || checkingPermission}
        >
          {checkingPermission ? "Checking..." : "Check Permission"}
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      {permissionMessage && (
        <div className={`permission-message ${hasPermission ? 'has-permission' : 'no-permission'}`}>
          {permissionMessage}
        </div>
      )}
      
      {!hasPermission && !loading && permissionMessage && (
        <div className="request-permission-section">
          <h4>Don't have permission? Request it:</h4>
          <RequestPermissionForm onRequestSubmitted={handlePermissionRequested} />
        </div>
      )}
      
      {hasPermission && students.length > 0 && (
        <div className="attendance-marking-section">
          <h4>Mark attendance for Grade {grade} {className} on {date}</h4>
          
          <div className="attendance-note">
            <p><em>Note: Late arrivals are counted as present for attendance rate calculations.</em></p>
          </div>
          
          <div className="table-container">
            <table className="attendance-table mobile-friendly-table">
              <thead>
                <tr>
                  <th>Index</th>
                  <th>Name</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td data-label="Index">{student.index}</td>
                    <td data-label="Name">{student.name}</td>
                    <td data-label="Status" className="status-cell">
                      <select
                        value={attendance[student.id]?.status || "present"}
                        onChange={(e) => 
                          handleAttendanceChange(
                            student.id, 
                            e.target.value as "present" | "absent" | "late"
                          )
                        }
                        disabled={saving}
                      >
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="late">Late</option>
                      </select>
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
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Attendance"}
            </button>
          </div>
        </div>
      )}
      
      {hasPermission && loading && <div>Loading students...</div>}
      {hasPermission && !loading && students.length === 0 && (
        <div>No students found for this class</div>
      )}
    </div>
  );
}

export default OtherClassAttendance; 