import { useState, useEffect } from "react";
import { fetchStudents } from "../../utils/firebaseService";
import AttendanceSummaryWidget from "./AttendanceSummaryWidget";

interface TeacherDashboardHomeProps {
  grade: number;
  className: string;
}

function TeacherDashboardHome({ grade, className }: TeacherDashboardHomeProps) {
  const [studentCount, setStudentCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentDate, setCurrentDate] = useState<string>("");

  useEffect(() => {
    fetchData();
    
    // Set current date
    const date = new Date();
    setCurrentDate(date.toLocaleDateString(undefined, { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }));
  }, [grade, className]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch students to get count
      const students = await fetchStudents(grade, className);
      setStudentCount(students.length);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-section">Loading dashboard...</div>;
  }

  return (
    <div className="teacher-dashboard-home">
      <div className="dashboard-welcome">
        <h2>Welcome to Grade {grade} {className}</h2>
        <p className="current-date">{currentDate}</p>
      </div>
      
      <div className="dashboard-cards">
        <div className="dashboard-row">
          <div className="dashboard-col">
            <AttendanceSummaryWidget grade={grade} className={className} />
          </div>
          
          <div className="dashboard-col">
            <div className="quick-stats-card">
              <div className="card-header">
                <h4>Class Information</h4>
              </div>
              <div className="card-content">
                <div className="stat-item">
                  <span className="stat-label">Total Students</span>
                  <span className="stat-value">{studentCount}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Grade</span>
                  <span className="stat-value">{grade}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Class</span>
                  <span className="stat-value">{className}</span>
                </div>
              </div>
              <div className="card-actions">
                <button 
                  className="card-action-button"
                  onClick={() => window.location.href = "#/manage-students"}
                >
                  Manage Students
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherDashboardHome; 