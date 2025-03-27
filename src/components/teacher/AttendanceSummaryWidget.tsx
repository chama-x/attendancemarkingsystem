import { useState, useEffect } from "react";
import { fetchAttendanceHistory } from "../../utils/firebaseService";

interface AttendanceSummaryWidgetProps {
  grade: number;
  className: string;
}

function AttendanceSummaryWidget({ grade, className }: AttendanceSummaryWidgetProps) {
  const [recentAttendance, setRecentAttendance] = useState<any>(null);
  const [today, setToday] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<{
    present: number;
    absent: number;
    late: number;
    total: number;
    presentRate: number;
  }>({
    present: 0,
    absent: 0,
    late: 0,
    total: 0,
    presentRate: 0
  });

  useEffect(() => {
    // Set today's date
    const date = new Date();
    const formattedDate = date.toISOString().split('T')[0];
    setToday(formattedDate);
    
    // Load recent attendance data
    fetchRecentAttendance();
  }, [grade, className]);

  const fetchRecentAttendance = async () => {
    try {
      setLoading(true);
      // Fetch last 5 days of attendance
      const attendanceData = await fetchAttendanceHistory(grade, className, 5);
      
      if (Object.keys(attendanceData).length > 0) {
        setRecentAttendance(attendanceData);
        
        // Calculate stats for the most recent day
        const dates = Object.keys(attendanceData).sort().reverse();
        if (dates.length > 0) {
          const latestDate = dates[0];
          const dayData = attendanceData[latestDate];
          
          // Calculate statistics
          let present = 0;
          let absent = 0;
          let late = 0;
          
          Object.values(dayData).forEach((record: any) => {
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  const getRateColorClass = (rate: number) => {
    if (rate >= 90) return "good-rate";
    if (rate >= 75) return "average-rate";
    return "poor-rate";
  };

  if (loading) {
    return <div className="attendance-summary-widget loading">Loading summary...</div>;
  }

  return (
    <div className="attendance-summary-widget">
      <div className="widget-header">
        <h4>Quick Attendance Summary</h4>
        <span className="date-badge">{formatDate(today)}</span>
      </div>
      
      {recentAttendance && Object.keys(recentAttendance).length > 0 ? (
        <>
          <div className="attendance-status-summary">
            <div className="status-item">
              <span className="status-count present-count">{stats.present}</span>
              <span className="status-label">Present</span>
            </div>
            <div className="status-item">
              <span className="status-count absent-count">{stats.absent}</span>
              <span className="status-label">Absent</span>
            </div>
            <div className="status-item">
              <span className="status-count late-count">{stats.late}</span>
              <span className="status-label">Late</span>
            </div>
          </div>
          
          <div className="attendance-rate">
            <div className="rate-display">
              <span className={`rate-value ${getRateColorClass(stats.presentRate)}`}>
                {stats.presentRate}%
              </span>
              <span className="rate-label">Attendance Rate</span>
            </div>
            <div className="rate-progress-container">
              <div 
                className={`rate-progress ${getRateColorClass(stats.presentRate)}`}
                style={{ width: `${stats.presentRate}%` }}
              ></div>
            </div>
          </div>
          
          <div className="widget-actions">
            <button 
              className="widget-action-button" 
              onClick={() => window.location.href = "#mark-attendance"}
            >
              Mark Today
            </button>
            <button 
              className="widget-action-button secondary" 
              onClick={() => window.location.href = "#/attendance-history"}
            >
              View History
            </button>
          </div>
        </>
      ) : (
        <div className="no-data-message">
          <p>No recent attendance records found.</p>
          <button 
            className="widget-action-button"
            onClick={() => window.location.href = "#/mark-attendance"}
          >
            Mark Today's Attendance
          </button>
        </div>
      )}
    </div>
  );
}

export default AttendanceSummaryWidget; 