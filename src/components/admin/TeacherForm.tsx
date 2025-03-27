import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set } from "firebase/database";
import { auth, database } from "../../firebaseConfig";

function TeacherForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [grade, setGrade] = useState("");
  const [className, setClassName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!email || !password || !grade || !className) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Store teacher data in Realtime Database
      await set(ref(database, `users/${user.uid}`), {
        role: "teacher",
        email: email,
        grade: parseInt(grade),
        class: className,
      });

      // Clear form
      setEmail("");
      setPassword("");
      setGrade("");
      setClassName("");
      
      setSuccess("Teacher added successfully!");
    } catch (error) {
      setError("Failed to create teacher account. " + (error as Error).message);
      console.error("Error creating teacher:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="teacher-form">
      <h3>Add New Teacher</h3>
      
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="grade">Grade:</label>
          <input
            id="grade"
            type="number"
            min="1"
            max="13"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="className">Class:</label>
          <input
            id="className"
            type="text"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            required
            placeholder="e.g., A, B, C"
          />
        </div>
        
        <button
          type="submit"
          className="submit-button"
          disabled={loading}
        >
          {loading ? "Adding..." : "Add Teacher"}
        </button>
      </form>
    </div>
  );
}

export default TeacherForm; 