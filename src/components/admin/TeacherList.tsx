import { useState, useEffect } from "react";
import { ref, get } from "firebase/database";
import { database } from "../../firebaseConfig";
import { Teacher } from "../../types";

function TeacherList() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoading(true);
        const usersRef = ref(database, "users");
        const snapshot = await get(usersRef);

        if (snapshot.exists()) {
          const usersData = snapshot.val();
          const teachersList: Teacher[] = [];

          // Filter users with role "teacher"
          Object.entries(usersData).forEach(([uid, userData]) => {
            const user = userData as any;
            if (user.role === "teacher") {
              teachersList.push({
                uid,
                email: user.email,
                role: "teacher",
                grade: user.grade,
                class: user.class,
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

    fetchTeachers();
  }, []);

  if (loading) {
    return <div>Loading teachers...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (teachers.length === 0) {
    return <div>No teachers found. Add a teacher to get started.</div>;
  }

  return (
    <div className="teacher-list section">
      <h3>Teachers</h3>
      <div className="table-container">
        <table className="mobile-friendly-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Grade</th>
              <th>Class</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((teacher) => (
              <tr key={teacher.uid}>
                <td data-label="Email">{teacher.email}</td>
                <td data-label="Grade">{teacher.grade}</td>
                <td data-label="Class">{teacher.class}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TeacherList; 