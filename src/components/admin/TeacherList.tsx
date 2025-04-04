import { useState, useEffect } from "react";
import { ref, get } from "firebase/database";
import { database } from "../../firebaseConfig";
import { removeTeacher, updateTeacher } from "../../utils/firebaseService";
import { Teacher } from "../../types";

interface EditableTeacher extends Teacher {
  isEditing?: boolean;
}

interface UserData {
  email: string;
  role: string;
  grade: number;
  class: string;
}

function TeacherList() {
  const [teachers, setTeachers] = useState<EditableTeacher[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [editFormData, setEditFormData] = useState<{
    grade: number;
    class: string;
  }>({
    grade: 1,
    class: "A"
  });

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      const usersRef = ref(database, "users");
      const snapshot = await get(usersRef);

      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const teachersList: EditableTeacher[] = [];

        // Filter users with role "teacher"
        Object.entries(usersData).forEach(([uid, userData]) => {
          const user = userData as UserData;
          if (user.role === "teacher") {
            teachersList.push({
              uid,
              email: user.email,
              role: "teacher" as const,
              grade: user.grade,
              class: user.class,
              isEditing: false
            });
          }
        });

        setTeachers(teachersList);
      } else {
        setTeachers([]);
      }
    } catch (error) {
      console.error("Error fetching teachers:", error);
      setError("Failed to load teachers. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeacher = async (teacherId: string, email: string) => {
    if (!confirm(`Are you sure you want to delete teacher ${email}?`)) {
      return;
    }
    
    try {
      setLoading(true);
      await removeTeacher(teacherId);
      setSuccess(`Teacher ${email} was successfully deleted.`);
      // Refresh the list
      fetchTeachers();
    } catch (error) {
      console.error("Error deleting teacher:", error);
      setError("Failed to delete teacher. Please try again.");
      setLoading(false);
    }
  };

  const toggleEditMode = (teacherId: string, isEditing: boolean) => {
    setTeachers(prevTeachers => 
      prevTeachers.map(teacher => {
        if (teacher.uid === teacherId) {
          if (isEditing) {
            // If entering edit mode, set the form values to current teacher values
            setEditFormData({
              grade: teacher.grade,
              class: teacher.class
            });
          }
          return { ...teacher, isEditing };
        }
        // Turn off edit mode for other teachers
        return { ...teacher, isEditing: false };
      })
    );
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: name === "grade" ? parseInt(value) : value
    }));
  };

  const handleUpdateTeacher = async (teacherId: string, email: string) => {
    try {
      setLoading(true);
      await updateTeacher(teacherId, editFormData);
      setSuccess(`Teacher ${email} was successfully updated.`);
      
      // Update the local state
      setTeachers(prevTeachers =>
        prevTeachers.map(teacher => {
          if (teacher.uid === teacherId) {
            return {
              ...teacher,
              ...editFormData,
              isEditing: false
            };
          }
          return teacher;
        })
      );
    } catch (error) {
      console.error("Error updating teacher:", error);
      setError("Failed to update teacher. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && teachers.length === 0) {
    return <div>Loading teachers...</div>;
  }

  if (error) {
    return (
      <div>
        <div className="error-message">{error}</div>
        <button className="refresh-button" onClick={fetchTeachers}>
          Try Again
        </button>
      </div>
    );
  }

  if (teachers.length === 0) {
    return <div>No teachers found. Add a teacher to get started.</div>;
  }

  return (
    <div className="teacher-list section">
      <h3>Manage Teachers</h3>
      
      {success && <div className="success-message">{success}</div>}
      {error && <div className="error-message">{error}</div>}
      
      <div className="table-container">
        <table className="mobile-friendly-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Grade</th>
              <th>Class</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((teacher) => (
              <tr key={teacher.uid}>
                <td data-label="Email">{teacher.email}</td>
                
                {teacher.isEditing ? (
                  <>
                    <td data-label="Grade">
                      <select 
                        name="grade" 
                        value={editFormData.grade}
                        onChange={handleEditFormChange}
                      >
                        {Array.from({ length: 13 }, (_, i) => i + 1).map(num => (
                          <option key={num} value={num}>
                            {num}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td data-label="Class">
                      <input 
                        type="text" 
                        name="class" 
                        value={editFormData.class}
                        onChange={handleEditFormChange}
                        maxLength={1}
                      />
                    </td>
                    <td data-label="Actions" className="actions-cell">
                      <button 
                        className="small-button approve-button"
                        onClick={() => handleUpdateTeacher(teacher.uid, teacher.email)}
                        disabled={loading}
                      >
                        Save
                      </button>
                      <button 
                        className="small-button secondary-button"
                        onClick={() => toggleEditMode(teacher.uid, false)}
                      >
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td data-label="Grade">{teacher.grade}</td>
                    <td data-label="Class">{teacher.class}</td>
                    <td data-label="Actions" className="actions-cell">
                      <button 
                        className="small-button edit-button"
                        onClick={() => toggleEditMode(teacher.uid, true)}
                      >
                        Edit
                      </button>
                      <button 
                        className="small-button delete-button"
                        onClick={() => handleDeleteTeacher(teacher.uid, teacher.email)}
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="refresh-section">
        <button 
          className="refresh-button"
          onClick={fetchTeachers}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh List"}
        </button>
      </div>
    </div>
  );
}

export default TeacherList; 