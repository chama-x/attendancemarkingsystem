import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Home() {
  const { currentUser, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const [debugInfo, setDebugInfo] = useState<string>("Initial state");

  useEffect(() => {
    setDebugInfo(prev => prev + `\nAuth state changed - Loading: ${loading}, User: ${currentUser?.email || 'none'}, Role: ${userRole || 'none'}`);
    
    if (!loading) {
      if (!currentUser) {
        setDebugInfo(prev => prev + "\nNo user found, redirecting to login...");
        navigate("/login");
      } else if (userRole === "admin") {
        setDebugInfo(prev => prev + "\nAdmin role detected, redirecting to admin dashboard...");
        navigate("/admin");
      } else if (userRole === "teacher") {
        setDebugInfo(prev => prev + "\nTeacher role detected, redirecting to teacher dashboard...");
        navigate("/teacher");
      } else {
        setDebugInfo(prev => prev + "\nUnknown role, redirecting to login...");
        navigate("/login");
      }
    }
  }, [currentUser, userRole, loading, navigate]);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Loading Authentication Status...</h2>
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px', whiteSpace: 'pre-line' }}>
        <h4>Debug Info:</h4>
        <code>{debugInfo}</code>
      </div>
    </div>
  );
}

export default Home; 