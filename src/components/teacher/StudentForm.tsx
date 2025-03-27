import { useState, FormEvent } from "react";
import { addStudent } from "../../utils/firebaseService";

interface StudentFormProps {
  grade: number;
  className: string;
  onStudentAdded: () => void;
}

function StudentForm({ grade, className, onStudentAdded }: StudentFormProps) {
  const [studentName, setStudentName] = useState("");
  const [studentIndex, setStudentIndex] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!studentName.trim()) {
      setError("Student name is required");
      return;
    }
    
    if (!studentIndex.trim()) {
      setError("Student index is required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await addStudent(grade, className, studentName, studentIndex);
      setStudentName("");
      setStudentIndex("");
      onStudentAdded();
    } catch (error) {
      console.error("Error adding student:", error);
      setError("Failed to add student. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="student-form-container">
      <h3>Add New Student</h3>
      <form onSubmit={handleSubmit} className="student-form">
        <div className="form-group">
          <label htmlFor="studentIndex">Student Index:</label>
          <input
            type="text"
            id="studentIndex"
            value={studentIndex}
            onChange={(e) => setStudentIndex(e.target.value)}
            placeholder="Enter student index"
            disabled={isSubmitting}
          />
        </div>
        <div className="form-group">
          <label htmlFor="studentName">Student Name:</label>
          <input
            type="text"
            id="studentName"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="Enter student name"
            disabled={isSubmitting}
          />
        </div>
        {error && <div className="error-message">{error}</div>}
        <button type="submit" disabled={isSubmitting} className="add-button">
          {isSubmitting ? "Adding..." : "Add Student"}
        </button>
      </form>
    </div>
  );
}

export default StudentForm; 