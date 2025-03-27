import { useState, useEffect } from "react";
import { ref, get } from "firebase/database";
import { database } from "../../firebaseConfig";

interface ClassData {
  grade: number;
  class: string;
  present: number;
  absent: number;
  late: number;
  total: number;
  presentPercentage: number;
}

function AdminStatistics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [classesData, setClassesData] = useState<ClassData[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    totalAttendanceRecords: 0,
    overallAttendanceRate: 0
  });
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchSchoolData();
  }, [dateRange]);

  const fetchSchoolData = async () => {
    try {
      setLoading(true);
      
      // First get all classes (teachers)
      const teachersRef = ref(database, "users");
      const teachersSnapshot = await get(teachersRef);
      
      if (!teachersSnapshot.exists()) {
        setError("No teachers found.");
        setLoading(false);
        return;
      }
      
      // Extract all grade/class combinations
      const classes: {grade: number, class: string}[] = [];
      const teachersData = teachersSnapshot.val();
      
      Object.values(teachersData).forEach((teacher: any) => {
        if (teacher.role === "teacher" && teacher.grade && teacher.class) {
          classes.push({
            grade: teacher.grade,
            class: teacher.class
          });
        }
      });
      
      // Get attendance data for each class
      const classesStats: ClassData[] = [];
      let totalStudents = 0;
      let totalPresent = 0;
      let totalAbsent = 0;
      let totalLate = 0;
      let totalAttendanceRecords = 0;
      
      for (const classInfo of classes) {
        // Fetch students for this class to get total student count
        const studentsRef = ref(database, `students/grade${classInfo.grade}${classInfo.class}`);
        const studentsSnapshot = await get(studentsRef);
        
        const studentCount = studentsSnapshot.exists() ? Object.keys(studentsSnapshot.val()).length : 0;
        totalStudents += studentCount;
        
        // Fetch attendance data
        const attendanceRef = ref(database, `attendance/grade${classInfo.grade}${classInfo.class}`);
        const attendanceSnapshot = await get(attendanceRef);
        
        if (attendanceSnapshot.exists()) {
          const attendanceData = attendanceSnapshot.val();
          
          // Filter dates by date range
          const filteredDates = Object.keys(attendanceData).filter(date => {
            return date >= dateRange.start && date <= dateRange.end;
          });
          
          totalAttendanceRecords += filteredDates.length;
          
          let classPresent = 0;
          let classAbsent = 0;
          let classLate = 0;
          let classTotal = 0;
          
          // Process each date's attendance
          filteredDates.forEach(date => {
            const dayData = attendanceData[date];
            
            Object.values(dayData).forEach((record: any) => {
              classTotal++;
              
              const status = typeof record === "boolean" ? 
                (record ? "present" : "absent") : 
                record.status || "unknown";
              
              if (status === "present") {
                classPresent++;
                totalPresent++;
              } else if (status === "absent") {
                classAbsent++;
                totalAbsent++;
              } else if (status === "late") {
                classLate++;
                totalLate++;
              }
            });
          });
          
          // Calculate percentage
          const presentPercentage = classTotal > 0 ? Math.round((classPresent / classTotal) * 100) : 0;
          
          // Add to class stats
          classesStats.push({
            grade: classInfo.grade,
            class: classInfo.class,
            present: classPresent,
            absent: classAbsent,
            late: classLate,
            total: classTotal,
            presentPercentage
          });
        } else {
          // No attendance data for this class
          classesStats.push({
            grade: classInfo.grade,
            class: classInfo.class,
            present: 0,
            absent: 0,
            late: 0,
            total: 0,
            presentPercentage: 0
          });
        }
      }
      
      // Calculate overall attendance rate
      const totalRecords = totalPresent + totalAbsent + totalLate;
      const overallAttendanceRate = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;
      
      // Sort classes by attendance rate (ascending)
      classesStats.sort((a, b) => a.presentPercentage - b.presentPercentage);
      
      setClassesData(classesStats);
      setTotalStats({
        totalStudents,
        totalClasses: classes.length,
        totalAttendanceRecords,
        overallAttendanceRate
      });
      
    } catch (error) {
      console.error("Error fetching school data:", error);
      setError("Failed to load school statistics.");
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateHTMLReport = () => {
    // Table styles
    const styles = `
      <style>
        table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .report-container { font-family: Arial, sans-serif; padding: 20px; }
        .report-header { margin-bottom: 20px; text-align: center; }
        .report-section { margin-bottom: 30px; }
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
    
    // Overview section
    const overview = `
      <div class="report-section">
        <h2>School Overview</h2>
        <p>Period: ${new Date(dateRange.start).toLocaleDateString()} to ${new Date(dateRange.end).toLocaleDateString()}</p>
        <p>Total Classes: ${totalStats.totalClasses}</p>
        <p>Total Students: ${totalStats.totalStudents}</p>
        <p>Total Attendance Records: ${totalStats.totalAttendanceRecords}</p>
        <p>Overall Attendance Rate: <span class="${
          totalStats.overallAttendanceRate >= 90 ? 'good' : 
          totalStats.overallAttendanceRate >= 75 ? 'average' : 'poor'
        }">${totalStats.overallAttendanceRate}%</span></p>
      </div>
    `;
    
    // Class comparison table
    let classTable = `
      <div class="report-section">
        <h2>Class Attendance Comparison</h2>
        <table>
          <thead>
            <tr>
              <th>Grade</th>
              <th>Class</th>
              <th>Present</th>
              <th>Absent</th>
              <th>Late</th>
              <th>Total</th>
              <th>Attendance Rate</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    classesData.forEach(cls => {
      const rateClass = cls.presentPercentage >= 90 ? 'good' : (cls.presentPercentage >= 75 ? 'average' : 'poor');
      
      classTable += `
        <tr>
          <td>${cls.grade}</td>
          <td>${cls.class}</td>
          <td>${cls.present}</td>
          <td>${cls.absent}</td>
          <td>${cls.late}</td>
          <td>${cls.total}</td>
          <td class="${rateClass}">${cls.presentPercentage}%</td>
        </tr>
      `;
    });
    
    classTable += `</tbody></table></div>`;
    
    // Complete HTML report
    const reportHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>School Attendance Report</title>
        ${styles}
      </head>
      <body>
        <div class="report-container">
          <div class="report-header">
            <h1>School Attendance Report</h1>
            <p>${new Date(dateRange.start).toLocaleDateString()} to ${new Date(dateRange.end).toLocaleDateString()}</p>
          </div>
          
          ${overview}
          ${classTable}
          
          <div class="no-print" style="margin-top: 20px; text-align: center;">
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return reportHTML;
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
    a.download = `School_Attendance_Report_${dateRange.start}_to_${dateRange.end}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div>Loading school statistics...</div>;
  }
  
  if (error) {
    return <div className="error-message">{error}</div>;
  }
  
  return (
    <div className="attendance-statistics">
      <h3>School Attendance Statistics</h3>
      
      <div className="date-range-selector">
        <label htmlFor="admin-start">Start Date:</label>
        <input 
          type="date" 
          id="admin-start" 
          name="start" 
          value={dateRange.start} 
          onChange={handleDateRangeChange}
          max={dateRange.end}
        />
        
        <label htmlFor="admin-end">End Date:</label>
        <input 
          type="date" 
          id="admin-end" 
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
      
      <div className="statistics-summary">
        <div className="stat-card">
          <h4>Overall Attendance Rate</h4>
          <div className="stat-value">{totalStats.overallAttendanceRate}%</div>
          <div className="stat-description">School-wide average</div>
        </div>
        
        <div className="stat-card">
          <h4>Total Classes</h4>
          <div className="stat-value">{totalStats.totalClasses}</div>
          <div className="stat-description">Across all grades</div>
        </div>
        
        <div className="stat-card">
          <h4>Total Students</h4>
          <div className="stat-value">{totalStats.totalStudents}</div>
          <div className="stat-description">Enrolled in all classes</div>
        </div>
      </div>
      
      {classesData.length > 0 &&
        <div className="statistics-tables">
          <h4>Attendance by Class</h4>
          <div className="table-container">
            <table className="statistics-table mobile-friendly-table">
              <thead>
                <tr>
                  <th>Grade</th>
                  <th>Class</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>Late</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                {classesData.map(cls => (
                  <tr key={`${cls.grade}${cls.class}`}>
                    <td data-label="Grade">{cls.grade}</td>
                    <td data-label="Class">{cls.class}</td>
                    <td data-label="Present">{cls.present}</td>
                    <td data-label="Absent">{cls.absent}</td>
                    <td data-label="Late">{cls.late}</td>
                    <td 
                      data-label="Rate"
                      className={
                        cls.presentPercentage >= 90 ? 'good-rate' : 
                        cls.presentPercentage >= 75 ? 'average-rate' : 'poor-rate'
                      }
                    >
                      {cls.presentPercentage}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  );
}

export default AdminStatistics; 