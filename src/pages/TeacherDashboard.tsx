import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { ref, get } from "firebase/database";
import { auth, database } from "../firebaseConfig";
import { useAuth } from "../context/AuthContext";
import StudentForm from "../components/teacher/StudentForm";
import StudentList from "../components/teacher/StudentList";
import AttendanceMarker from "../components/teacher/AttendanceMarker";
import AttendanceHistory from "../components/teacher/AttendanceHistory";
import OtherClassAttendance from "../components/teacher/OtherClassAttendance";
import RequestPermissionForm from "../components/teacher/RequestPermissionForm";
import TeacherPermissionRequests from "../components/teacher/TeacherPermissionRequests";
import AttendanceStatistics from "../components/teacher/AttendanceStatistics";
import TeacherDashboardHome from "../components/teacher/TeacherDashboardHome";

function TeacherDashboard() {
  const { currentUser } = useAuth();
  const [teacherGrade, setTeacherGrade] = useState<number>(0);
  const [teacherClass, setTeacherClass] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("home");
  const [studentRefreshTrigger, setStudentRefreshTrigger] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchTeacherData();
    
    // Set active tab from URL hash if present
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      // Map hash values to tab names
      const hashMap: Record<string, string> = {
        '': 'home',
        'mark-attendance': 'attendance',
        'view-attendance': 'view',
        'students': 'students',
        'manage-students': 'students',
        'other-classes': 'otherClass',
        'statistics': 'stats',
        'requests': 'otherClass'
      };
      
      if (hashMap[hash]) {
        setActiveTab(hashMap[hash]);
      }
    }
    
    // Set up hash change listener
    const handleHashChange = () => {
      const newHash = window.location.hash.replace('#', '');
      const hashMap: Record<string, string> = {
        '': 'home',
        'mark-attendance': 'attendance',
        'view-attendance': 'view',
        'students': 'students',
        'manage-students': 'students',
        'other-classes': 'otherClass',
        'statistics': 'stats',
        'requests': 'otherClass'
      };
      
      if (hashMap[newHash]) {
        setActiveTab(hashMap[newHash]);
      }
    };
    
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [currentUser]);

  const fetchTeacherData = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const userRef = ref(database, `users/${currentUser.uid}`);
      const snapshot = await get(userRef);
      
      if (snapshot.exists()) {
        const userData = snapshot.val();
        setTeacherGrade(userData.grade);
        setTeacherClass(userData.class);
      }
    } catch (error) {
      console.error("Error fetching teacher data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleStudentAdded = () => {
    // Trigger a refresh of the student list
    setStudentRefreshTrigger(prev => prev + 1);
  };
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    // Set URL hash for navigation
    const hashMap: Record<string, string> = {
      'home': '',
      'attendance': 'mark-attendance',
      'view': 'view-attendance',
      'students': 'students',
      'otherClass': 'other-classes',
      'stats': 'statistics'
    };
    
    if (hashMap[tab]) {
      window.location.hash = hashMap[tab];
    }
  };

  if (loading) {
    return (
      <div className="loading-dashboard">
        <div className="loading-spinner"></div>
        <p>Loading teacher data...</p>
      </div>
    );
  }

  return (
    <div className="dashboard teacher-dashboard">
      <header className="dashboard-header">
        <div className="dashboard-title">
          <h1>Teacher Dashboard</h1>
          <div className="teacher-info">
            <div className="dashboard-subtitle">Teacher Portal</div>
            <span className="teacher-class-badge">Grade {teacherGrade} {teacherClass}</span>
          </div>
        </div>
        <button onClick={handleLogout} className="logout-button">
          <span>Logout</span>
        </button>
      </header>

      <nav className="dashboard-nav">
        <button
          className={`nav-tab ${activeTab === "home" ? "active" : ""}`}
          onClick={() => handleTabChange("home")}
        >
          <i className="tab-icon home-icon">🏠</i> Dashboard
        </button>
        <button
          className={`nav-tab ${activeTab === "attendance" ? "active primary-tab" : ""}`}
          onClick={() => handleTabChange("attendance")}
        >
          <i className="tab-icon attendance-icon">📋</i> Mark Attendance
        </button>
        <button
          className={`nav-tab ${activeTab === "view" ? "active" : ""}`}
          onClick={() => handleTabChange("view")}
        >
          <i className="tab-icon view-icon">👁️</i> View Records
        </button>
        <button
          className={`nav-tab ${activeTab === "students" ? "active" : ""}`}
          onClick={() => handleTabChange("students")}
        >
          <i className="tab-icon students-icon">👨‍🎓</i> Manage Students
        </button>
        <button
          className={`nav-tab ${activeTab === "otherClass" ? "active" : ""}`}
          onClick={() => handleTabChange("otherClass")}
        >
          <i className="tab-icon other-class-icon">🔄</i> Other Classes
        </button>
        <button
          className={`nav-tab ${activeTab === "stats" ? "active" : ""}`}
          onClick={() => handleTabChange("stats")}
        >
          <i className="tab-icon stats-icon">📊</i> Statistics
        </button>
      </nav>

      <main className="dashboard-content">
        {activeTab === "home" && (
          <TeacherDashboardHome grade={teacherGrade} className={teacherClass} />
        )}
      
        {activeTab === "attendance" && (
          <div className="primary-section attendance-section">
            <AttendanceMarker grade={teacherGrade} className={teacherClass} />
          </div>
        )}
        
        {activeTab === "view" && (
          <div className="section">
            <AttendanceHistory grade={teacherGrade} className={teacherClass} />
          </div>
        )}
        
        {activeTab === "students" && (
          <div className="section-row">
            <div className="section-col">
              <StudentForm 
                grade={teacherGrade} 
                className={teacherClass} 
                onStudentAdded={handleStudentAdded}
              />
            </div>
            <div className="section-col">
              <StudentList 
                grade={teacherGrade} 
                className={teacherClass} 
                refreshTrigger={studentRefreshTrigger}
              />
            </div>
          </div>
        )}
        
        {activeTab === "otherClass" && (
          <div className="section-row">
            <div className="section-col">
              <OtherClassAttendance />
            </div>
            <div className="section-col">
              <div className="permission-requests-container">
                <RequestPermissionForm onRequestSubmitted={() => {}} />
                <TeacherPermissionRequests />
              </div>
            </div>
          </div>
        )}
        
        {activeTab === "stats" && (
          <div className="section">
            <AttendanceStatistics grade={teacherGrade} className={teacherClass} />
          </div>
        )}
      </main>
    </div>
  );
}

export default TeacherDashboard; 