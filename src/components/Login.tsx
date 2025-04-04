import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { FirebaseError } from "firebase/app";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [debug, setDebug] = useState("");
  const navigate = useNavigate();

  const fillAdminCredentials = () => {
    setEmail("admin@school.com");
    setPassword("admin123");
    setDebug("Admin credentials filled automatically");
  };

  const fillTeacherCredentials = () => {
    setEmail("teacher.grade10A@school.com");
    setPassword("teacher123");
    setDebug("Grade 10A Teacher credentials filled automatically");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setDebug("Login attempt started...");
    setLoading(true);
    
    try {
      setDebug(prev => prev + "\nAttempting to sign in with Firebase...");
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setDebug(prev => prev + "\nFirebase authentication successful!");
      
      // If we reached here, authentication was successful
      setDebug(prev => prev + "\nUser authenticated: " + userCredential.user.email);
      
      // Manually redirect based on UID check
      const uid = userCredential.user.uid;
      if (uid === "2ZRotg3Ya8PQ4amHNkHENjPai9u2") { // Admin UID from the exported JSON
        setDebug(prev => prev + "\nRecognized as admin, redirecting...");
        setTimeout(() => navigate("/admin"), 1000);
      } else {
        setDebug(prev => prev + "\nAssuming teacher role, redirecting...");
        setTimeout(() => navigate("/teacher"), 1000);
      }
    } catch (error: unknown) {
      const firebaseError = error as FirebaseError;
      setDebug(prev => prev + "\nLogin error: " + firebaseError.message);
      setError("Failed to log in. Please check your credentials.");
      console.error("Login error:", firebaseError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <img src="/logo.jpeg" alt="School Logo" className="login-logo" />
        <h4 className="school-name">Mo/Kukurampola K.V.</h4>
        <h2>Smart Attendance System</h2>
        <h3>Teacher & Admin Portal</h3>
        
        {error && <p className="error-message">{error}</p>}
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input 
              id="email"
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              placeholder="Enter your email"
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
              placeholder="Enter your password"
            />
          </div>
          
          <button 
            type="submit" 
            className="login-button" 
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        
        <div className="autofill-buttons">
          <button 
            onClick={fillAdminCredentials} 
            type="button"
            className="autofill-button admin"
          >
            Admin Demo
          </button>
          <button 
            onClick={fillTeacherCredentials} 
            type="button"
            className="autofill-button teacher"
          >
            Teacher Demo
          </button>
        </div>
        
        {debug && (
          <div className="debug-info">
            <h4>Debug Info:</h4>
            <code>{debug}</code>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login; 