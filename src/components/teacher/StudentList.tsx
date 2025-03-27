import { useState, useEffect } from "react";
import { fetchStudents, removeStudent, updateStudent } from "../../utils/firebaseService";
import { Student } from "../../types";

interface StudentListProps {
  grade: number;
  className: string;
  refreshTrigger: number;
}

function StudentList({ grade, className, refreshTrigger }: StudentListProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingStudent, setEditingStudent] = useState<{id: string, name: string, index: string} | null>(null);

  useEffect(() => {
    const loadStudents = async () => {
      try {
        setLoading(true);
        const studentsList = await fetchStudents(grade, className);
        setStudents(studentsList);
      } catch (error) {
        console.error("Error fetching students:", error);
        setError("Failed to load students. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, [grade, className, refreshTrigger]);

  const handleRemoveStudent = async (studentId: string) => {
    if (!confirm("Are you sure you want to remove this student?")) {
      return;
    }

    try {
      await removeStudent(grade, className, studentId);
      
      // Update the local state by removing the student
      setStudents(students.filter(student => student.id !== studentId));
    } catch (error) {
      console.error("Error removing student:", error);
      alert("Failed to remove student. Please try again.");
    }
  };

  const handleEditClick = (student: Student) => {
    setEditingStudent({
      id: student.id,
      name: student.name,
      index: student.index
    });
  };

  const handleCancelEdit = () => {
    setEditingStudent(null);
  };

  const handleSaveEdit = async () => {
    if (!editingStudent) return;
    
    try {
      await updateStudent(grade, className, editingStudent.id, {
        name: editingStudent.name,
        index: editingStudent.index
      });
      
      // Update the student in the local state
      setStudents(students.map(student => 
        student.id === editingStudent.id 
          ? { ...student, name: editingStudent.name, index: editingStudent.index } 
          : student
      ));
      
      setEditingStudent(null);
    } catch (error) {
      console.error("Error updating student:", error);
      alert("Failed to update student. Please try again.");
    }
  };

  if (loading) {
    return <div>Loading students...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (students.length === 0) {
    return <div>No students found. Add a student to get started.</div>;
  }

  return (
    <div className="student-list">
      <h3>Students in Grade {grade} {className}</h3>
      <div className="table-container">
        <table className="mobile-friendly-table">
          <thead>
            <tr>
              <th>Index</th>
              <th>Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td data-label="Index">
                  {editingStudent && editingStudent.id === student.id ? (
                    <input
                      type="text"
                      value={editingStudent.index}
                      onChange={(e) => setEditingStudent({...editingStudent, index: e.target.value})}
                    />
                  ) : (
                    student.index
                  )}
                </td>
                <td data-label="Name">
                  {editingStudent && editingStudent.id === student.id ? (
                    <input
                      type="text"
                      value={editingStudent.name}
                      onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})}
                    />
                  ) : (
                    student.name
                  )}
                </td>
                <td data-label="Actions">
                  {editingStudent && editingStudent.id === student.id ? (
                    <div className="button-group">
                      <button
                        onClick={handleSaveEdit}
                        className="save-button small-button"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="cancel-button small-button"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="button-group">
                      <button 
                        onClick={() => handleEditClick(student)}
                        className="edit-button small-button"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleRemoveStudent(student.id)}
                        className="remove-button small-button"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default StudentList; 