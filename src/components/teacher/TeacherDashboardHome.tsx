import { useState, useEffect } from "react";
import { fetchStudents } from "../../utils/firebaseService";
import AttendanceSummaryWidget from "./AttendanceSummaryWidget";

interface TeacherDashboardHomeProps {
  grade: number;
  className: string;
}

function TeacherDashboardHome({ grade, className }: TeacherDashboardHomeProps) {
  const [studentCount, setStudentCount] = useState<number>(0);
  const [currentDate, setCurrentDate] = useState<string>("");

  useEffect(() => {
    // Format current date 
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    setCurrentDate(today.toLocaleDateString(undefined, options));
    
    // Fetch student count
    const getStudentCount = async () => {
      try {
        const students = await fetchStudents(grade, className);
        setStudentCount(students.length);
      } catch (error) {
        console.error("Error fetching student count:", error);
      }
    };
    
    getStudentCount();
  }, [grade, className]);

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
                  onClick={() => window.location.hash = "students"}
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