  <div className="attendance-section">
    <h3>Mark Attendance for {selectedDate}</h3>
    <div className="attendance-list">
      {loading ? (
        <p>Loading students...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : students.length === 0 ? (
        <p>No students found for this class. Please add students first.</p>
      ) : (
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
              {students.map((student) => (
                <tr key={student.id}>
                  <td data-label="Index">{student.index}</td>
                  <td data-label="Name">{student.name}</td>
                  <td data-label="Status" className="status-cell">
                    <select
                      value={
                        attendance[student.id]?.status || "present"
                      }
                      onChange={(e) =>
                        handleAttendanceChange(
                          student.id,
                          e.target.value as "present" | "absent" | "late"
                        )
                      }
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="late">Late</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {students.length > 0 && (
        <div className="attendance-save-container">
          <button 
            className="save-button" 
            onClick={handleSaveAttendance}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Attendance"}
          </button>
        </div>
      )}
    </div>
  </div> 