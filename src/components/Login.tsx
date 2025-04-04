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
            style={{ 
              width: '100%', 
              padding: '12px 16px', 
              margin: '16px 0 0 0',
              backgroundColor: '#4A85E1',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        
        <div className="autofill-buttons" style={{ 
          marginTop: '20px', 
          display: 'flex', 
          gap: '10px',
          justifyContent: 'space-between' 
        }}>
          <button 
            onClick={fillAdminCredentials} 
            type="button"
            className="autofill-button admin"
            style={{ 
              flex: '1', 
              padding: '8px 12px',
              backgroundColor: '#34495e',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Admin Demo
          </button>
          <button 
            onClick={fillTeacherCredentials} 
            type="button"
            className="autofill-button teacher"
            style={{ 
              flex: '1', 
              padding: '8px 12px',
              backgroundColor: '#2980b9',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
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