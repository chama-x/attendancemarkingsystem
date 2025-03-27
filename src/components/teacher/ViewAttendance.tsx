{attendanceData.length > 0 ? (
  <div className="attendance-records">
    <h3>Attendance Records for {selectedDate}</h3>
    <div className="table-container">
      <table className="attendance-table mobile-friendly-table">
        <thead>
          <tr>
            <th>Index</th>
            <th>Name</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {attendanceData.map((record) => (
            <tr key={record.id} className={`status-${record.status}`}>
              <td data-label="Index">{record.studentIndex}</td>
              <td data-label="Name">{record.studentName}</td>
              <td data-label="Status" className="status-cell">
                {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
) : (
  selectedDate && <p>No attendance records found for this date.</p>
)} 