import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import TeacherForm from "../components/admin/TeacherForm";
import TeacherList from "../components/admin/TeacherList";
import PermissionRequestList from "../components/admin/PermissionRequestList";
import AdminStatistics from "../components/admin/AdminStatistics";

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"teachers" | "permissions" | "statistics">("teachers");

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="dashboard admin-dashboard">
      <header className="dashboard-header">
        <div className="dashboard-title">
          <h1>Admin Dashboard</h1>
          <div className="dashboard-subtitle">Administrator Portal</div>
        </div>
        <button onClick={handleLogout} className="logout-button">
          <span>Logout</span>
        </button>
      </header>

      <nav className="dashboard-nav">
        <button
          className={`nav-tab ${activeTab === "teachers" ? "active" : ""}`}
          onClick={() => setActiveTab("teachers")}
        >
          Manage Teachers
        </button>
        <button
          className={`nav-tab ${activeTab === "permissions" ? "active" : ""}`}
          onClick={() => setActiveTab("permissions")}
        >
          Permission Requests
        </button>
        <button
          className={`nav-tab ${activeTab === "statistics" ? "active" : ""}`}
          onClick={() => setActiveTab("statistics")}
        >
          Attendance Statistics
        </button>
      </nav>

      <main className="dashboard-content">
        {activeTab === "teachers" && (
          <div className="teachers-section">
            <div className="section-row">
              <div className="section-col">
                <TeacherForm />
              </div>
              <div className="section-col">
                <TeacherList />
              </div>
            </div>
          </div>
        )}
        
        {activeTab === "permissions" && (
          <div className="permissions-section">
            <PermissionRequestList />
          </div>
        )}

        {activeTab === "statistics" && (
          <div className="statistics-section">
            <AdminStatistics />
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard; 