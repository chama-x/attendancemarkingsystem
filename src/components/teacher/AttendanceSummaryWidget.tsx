import { useState, useEffect } from "react";
import { fetchAttendanceHistory } from "../../utils/firebaseService";

interface AttendanceSummaryWidgetProps {
  grade: number;
  className: string;
}

interface AttendanceStats {
  present: number;
  absent: number;
  late: number;
  total: number;
  presentRate: number;
}

// Define the type for attendance history data
type AttendanceHistory = Record<string, Record<string, {
  status: "present" | "absent" | "late";
  studentName: string;
  studentIndex: string;
  timestamp: unknown;
}>>;

function AttendanceSummaryWidget({ grade, className }: AttendanceSummaryWidgetProps) {
  const [recentAttendance, setRecentAttendance] = useState<AttendanceHistory | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<AttendanceStats>({
    present: 0,
    absent: 0,
    late: 0,
    total: 0,
    presentRate: 0
  });
  
  const today = new Date().toISOString().split('T')[0];
  
  useEffect(() => {
    fetchAttendanceData();
  }, [grade, className]);
  
  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      // Fetch last 5 days of attendance
      const attendanceData = await fetchAttendanceHistory(grade, className, 5);
      
      if (Object.keys(attendanceData).length > 0) {
        setRecentAttendance(attendanceData as AttendanceHistory);
        
        // Calculate stats for the most recent day
        const dates = Object.keys(attendanceData).sort().reverse();
        if (dates.length > 0) {
          const latestDate = dates[0];
          const dayData = attendanceData[latestDate];
          
          // Calculate statistics
          let present = 0;
          let absent = 0;
          let late = 0;
          
          Object.values(dayData).forEach((record) => {
            if (record.status === "present") present++;
            else if (record.status === "absent") absent++;
            else if (record.status === "late") late++;
          });
          
          const total = present + absent + late;
          const presentRate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
          
          setStats({
            present,
            absent,
            late,
            total,
            presentRate
          });
        }
      }
    } catch (error) {
      console.error("Error fetching attendance summary:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleDateString(undefined, options);
  };
  
  const getRateColorClass = (rate: number): string => {
    if (rate >= 90) return "good-rate";
    if (rate >= 75) return "average-rate";
    return "poor-rate";
  };

  if (loading) {
    return (
      <div className="attendance-summary-card loading">
        <div className="card-loader">
          <div className="loader-spinner"></div>
          <p>Loading attendance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="attendance-summary-card">
      <div className="summary-header">
        <div className="date-display">
          <div className="current-date">{formatDate(today)}</div>
        </div>
      </div>
      
      {recentAttendance && Object.keys(recentAttendance).length > 0 ? (
        <div className="summary-content">
          <div className="stats-grid">
            <div className="stat-box present-stat">
              <div className="stat-icon">👨‍👩‍👧‍👦</div>
              <div className="stat-count">{stats.present}</div>
              <div className="stat-label">Present</div>
            </div>
            
            <div className="stat-box absent-stat">
              <div className="stat-icon">🏠</div>
              <div className="stat-count">{stats.absent}</div>
              <div className="stat-label">Absent</div>
            </div>
            
            <div className="stat-box late-stat">
              <div className="stat-icon">⏰</div>
              <div className="stat-count">{stats.late}</div>
              <div className="stat-label">Late</div>
            </div>
            
            <div className="stat-box rate-stat">
              <div className={`stat-count ${getRateColorClass(stats.presentRate)}`}>
                {stats.presentRate}%
              </div>
              <div className="stat-label">Attendance Rate</div>
              <div className="progress-bar-container">
                <div 
                  className={`progress-bar ${getRateColorClass(stats.presentRate)}`}
                  style={{ width: `${stats.presentRate}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="action-buttons">
            <button 
              className="action-button primary"
              onClick={() => window.location.hash = "mark-attendance"}
            >
              Mark Today
            </button>
            <button 
              className="action-button secondary"
              onClick={() => window.location.hash = "view-attendance"}
            >
              View History
            </button>
          </div>
        </div>
      ) : (
        <div className="no-data-container">
          <div className="no-data-icon">📊</div>
          <p className="no-data-message">No recent attendance records.</p>
          <button 
            className="action-button primary"
            onClick={() => window.location.hash = "mark-attendance"}
          >
            Mark Today's Attendance
          </button>
        </div>
      )}
    </div>
  );
}

export default AttendanceSummaryWidget; 