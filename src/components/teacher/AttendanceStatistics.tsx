import { useState, useEffect } from "react";
import { fetchStudents, fetchAttendanceHistory } from "../../utils/firebaseService";
import { Student } from "../../types";

interface AttendanceStatisticsProps {
  grade: number;
  className: string;
}

interface StatisticsByDate {
  [date: string]: {
    present: number;
    absent: number;
    late: number;
    total: number;
    presentPercentage: number;
  }
}

interface StatisticsByStudent {
  [studentId: string]: {
    name: string;
    index: string;
    present: number;
    absent: number;
    late: number;
    total: number;
    presentPercentage: number;
  }
}

function AttendanceStatistics({ grade, className }: AttendanceStatisticsProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<Record<string, Record<string, any>>>({});
  const [statsByDate, setStatsByDate] = useState<StatisticsByDate>({});
  const [statsByStudent, setStatsByStudent] = useState<StatisticsByStudent>({});
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch students
        const studentsList = await fetchStudents(grade, className);
        setStudents(studentsList);
        
        // Fetch attendance history
        const attendanceData = await fetchAttendanceHistory(grade, className, 100); // Get more data for better statistics
        
        if (Object.keys(attendanceData).length > 0) {
          setAttendanceHistory(attendanceData);
          calculateStatistics(attendanceData, studentsList);
        } else {
          setStatsByDate({});
          setStatsByStudent({});
        }
      } catch (error) {
        console.error("Error fetching attendance data:", error);
        setError("Failed to load attendance data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [grade, className]);

  useEffect(() => {
    if (Object.keys(attendanceHistory).length > 0 && students.length > 0) {
      calculateStatistics(attendanceHistory, students);
    }
  }, [dateRange, attendanceHistory, students]);

  const calculateStatistics = (attendanceData: Record<string, Record<string, any>>, studentsList: Student[]) => {
    const statsByDate: StatisticsByDate = {};
    const statsByStudent: StatisticsByStudent = {};
    
    // Initialize student statistics
    studentsList.forEach(student => {
      statsByStudent[student.id] = {
        name: student.name,
        index: student.index,
        present: 0,
        absent: 0,
        late: 0,
        total: 0,
        presentPercentage: 0
      };
    });
    
    // Filter dates by date range
    const filteredDates = Object.keys(attendanceData).filter(date => {
      return date >= dateRange.start && date <= dateRange.end;
    });
    
    // Calculate statistics for each date
    filteredDates.forEach(date => {
      const dayData = attendanceData[date];
      const stats = {
        present: 0,
        absent: 0,
        late: 0,
        total: 0,
        presentPercentage: 0
      };
      
      // Count by status for this date
      Object.entries(dayData).forEach(([studentId, record]) => {
        const status = typeof record === "boolean" ? 
          (record ? "present" : "absent") : 
          record.status || "unknown";
        
        stats.total++;
        if (status === "present") stats.present++;
        else if (status === "absent") stats.absent++;
        else if (status === "late") stats.late++;
        
        // Update student stats if student exists
        if (statsByStudent[studentId]) {
          statsByStudent[studentId].total++;
          if (status === "present") statsByStudent[studentId].present++;
          else if (status === "absent") statsByStudent[studentId].absent++;
          else if (status === "late") statsByStudent[studentId].late++;
        }
      });
      
      // Calculate percentage - Consider both "present" and "late" as attended
      stats.presentPercentage = stats.total > 0 ? 
        Math.round(((stats.present + stats.late) / stats.total) * 100) : 0;
      
      statsByDate[date] = stats;
    });
    
    // Calculate percentages for each student - Consider both "present" and "late" as attended
    Object.keys(statsByStudent).forEach(studentId => {
      const student = statsByStudent[studentId];
      student.presentPercentage = student.total > 0 ? 
        Math.round(((student.present + student.late) / student.total) * 100) : 0;
    });
    
    setStatsByDate(statsByDate);
    setStatsByStudent(statsByStudent);
  };

  const generateHTMLReport = () => {
    // Get filtered dates
    const dates = Object.keys(statsByDate).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );
    
    // Table styles
    const styles = `
      <style>
        table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .report-container { font-family: Arial, sans-serif; padding: 20px; }
        .report-header { margin-bottom: 20px; text-align: center; }
        .good { color: green; }
        .average { color: orange; }
        .poor { color: red; }
        @media print {
          .no-print { display: none; }
          body { font-size: 12pt; }
          .report-container { padding: 0; }
        }
      </style>
    `;
    
    // Create attendance summary by date
    let dateTable = `
      <h2>Attendance Summary by Date</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Present</th>
            <th>Late (Counted as Present)</th>
            <th>Absent</th>
            <th>Attendance Rate</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    dates.forEach(date => {
      const stats = statsByDate[date];
      const formattedDate = new Date(date).toLocaleDateString();
      const rateClass = stats.presentPercentage >= 90 ? 'good' : (stats.presentPercentage >= 75 ? 'average' : 'poor');
      
      dateTable += `
        <tr>
          <td>${formattedDate}</td>
          <td>${stats.present}</td>
          <td>${stats.late}</td>
          <td>${stats.absent}</td>
          <td class="${rateClass}">${stats.presentPercentage}%</td>
        </tr>
      `;
    });
    
    dateTable += `</tbody></table>`;
    
    // Create student attendance summary
    let studentTable = `
      <h2>Student Attendance Summary</h2>
      <table>
        <thead>
          <tr>
            <th>Index</th>
            <th>Name</th>
            <th>Present Days</th>
            <th>Late Days (Counted as Present)</th>
            <th>Absent Days</th>
            <th>Attendance Rate</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    // Sort students by attendance rate (ascending)
    const sortedStudents = Object.values(statsByStudent).sort((a, b) => a.presentPercentage - b.presentPercentage);
    
    sortedStudents.forEach(student => {
      const rateClass = student.presentPercentage >= 90 ? 'good' : (student.presentPercentage >= 75 ? 'average' : 'poor');
      
      studentTable += `
        <tr>
          <td>${student.index}</td>
          <td>${student.name}</td>
          <td>${student.present}</td>
          <td>${student.late}</td>
          <td>${student.absent}</td>
          <td class="${rateClass}">${student.presentPercentage}%</td>
        </tr>
      `;
    });
    
    studentTable += `</tbody></table>`;
    
    // Overall statistics
    const totalPresent = Object.values(statsByStudent).reduce((sum, student) => sum + student.present, 0);
    const totalLate = Object.values(statsByStudent).reduce((sum, student) => sum + student.late, 0);
    const totalAbsent = Object.values(statsByStudent).reduce((sum, student) => sum + student.absent, 0);
    const totalDays = totalPresent + totalAbsent + totalLate;
    const overallRate = totalDays > 0 ? Math.round(((totalPresent + totalLate) / totalDays) * 100) : 0;
    const rateClass = overallRate >= 90 ? 'good' : (overallRate >= 75 ? 'average' : 'poor');
    
    const overallStats = `
      <h2>Overall Statistics</h2>
      <p>Period: ${new Date(dateRange.start).toLocaleDateString()} to ${new Date(dateRange.end).toLocaleDateString()}</p>
      <p>Class: Grade ${grade}${className}</p>
      <p>Total Students: ${students.length}</p>
      <p>Present Days: ${totalPresent}</p>
      <p>Late Days (Counted as Present): ${totalLate}</p>
      <p>Absent Days: ${totalAbsent}</p>
      <p>Overall Attendance Rate: <span class="${rateClass}">${overallRate}%</span></p>
      <p><em>Note: Late arrivals are counted as present for attendance rate calculations.</em></p>
    `;
    
    // Complete HTML report
    const reportHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Attendance Report - Grade ${grade}${className}</title>
        ${styles}
      </head>
      <body>
        <div class="report-container">
          <div class="report-header">
            <h1>Attendance Report</h1>
            <h3>Grade ${grade}${className}</h3>
            <p>${new Date(dateRange.start).toLocaleDateString()} to ${new Date(dateRange.end).toLocaleDateString()}</p>
          </div>
          
          ${overallStats}
          ${dateTable}
          ${studentTable}
          
          <div class="no-print" style="margin-top: 20px; text-align: center;">
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return reportHTML;
  };

  const handleDateRangeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGenerateReport = () => {
    const reportHTML = generateHTMLReport();
    
    // Create a new window and write the report HTML
    const reportWindow = window.open('', '_blank');
    if (reportWindow) {
      reportWindow.document.write(reportHTML);
      reportWindow.document.close();
      reportWindow.focus();
      // Add slight delay to ensure content loads before printing
      setTimeout(() => {
        reportWindow.print();
      }, 500);
    } else {
      alert("Please allow pop-ups to view the report");
    }
  };

  const downloadReportAsHTML = () => {
    const reportHTML = generateHTMLReport();
    
    // Create a download link for the HTML file
    const blob = new Blob([reportHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Attendance_Report_Grade${grade}${className}_${dateRange.start}_to_${dateRange.end}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div>Loading attendance statistics...</div>;
  }
  
  if (error) {
    return <div className="error-message">{error}</div>;
  }
  
  return (
    <div className="attendance-statistics">
      <h3>Attendance Statistics - Grade {grade} {className}</h3>
      
      <div className="date-range-selector">
        <label htmlFor="start">Start Date:</label>
        <input 
          type="date" 
          id="start" 
          name="start" 
          value={dateRange.start} 
          onChange={handleDateRangeChange}
          max={dateRange.end}
        />
        
        <label htmlFor="end">End Date:</label>
        <input 
          type="date" 
          id="end" 
          name="end" 
          value={dateRange.end} 
          onChange={handleDateRangeChange}
          min={dateRange.start}
          max={new Date().toISOString().split('T')[0]}
        />
      </div>
      
      <div className="report-actions">
        <button onClick={handleGenerateReport} className="report-button">
          View & Print Report
        </button>
        <button onClick={downloadReportAsHTML} className="download-button">
          Download Report
        </button>
      </div>
      
      {Object.keys(statsByDate).length === 0 ? (
        <div>No attendance data available for the selected period.</div>
      ) : (
        <div className="statistics-summary">
          <div className="stat-card">
            <h4>Overall Attendance Rate</h4>
            <div className="stat-value">
              {Math.round(Object.values(statsByDate).reduce((sum, day) => sum + day.presentPercentage, 0) / Object.keys(statsByDate).length)}%
            </div>
            <div className="stat-description">Average for selected period</div>
          </div>
          
          <div className="stat-card">
            <h4>Total Classes</h4>
            <div className="stat-value">{Object.keys(statsByDate).length}</div>
            <div className="stat-description">Days with attendance records</div>
          </div>
          
          <div className="stat-card">
            <h4>Student Attendance</h4>
            <div className="stat-value">
              {Object.values(statsByStudent).filter(s => s.presentPercentage >= 90).length} / {students.length}
            </div>
            <div className="stat-description">Students with 90%+ attendance</div>
          </div>
        </div>
      )}
      
      <div className="statistics-note">
        <p><em>Note: Late arrivals are counted as present for attendance rate calculations.</em></p>
      </div>
      
      {Object.keys(statsByStudent).length > 0 && (
        <div className="statistics-tables">
          <h4>Attendance by Student</h4>
          <div className="table-container">
            <table className="statistics-table mobile-friendly-table">
              <thead>
                <tr>
                  <th>Index</th>
                  <th>Name</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>Late</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(statsByStudent)
                  .sort((a, b) => a.presentPercentage - b.presentPercentage)
                  .map(student => (
                    <tr key={student.index}>
                      <td data-label="Index">{student.index}</td>
                      <td data-label="Name">{student.name}</td>
                      <td data-label="Present">{student.present}</td>
                      <td data-label="Absent">{student.absent}</td>
                      <td data-label="Late">{student.late}</td>
                      <td 
                        data-label="Rate"
                        className={
                          student.presentPercentage >= 90 ? 'good-rate' : 
                          student.presentPercentage >= 75 ? 'average-rate' : 'poor-rate'
                        }
                      >
                        {student.presentPercentage}%
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AttendanceStatistics; 