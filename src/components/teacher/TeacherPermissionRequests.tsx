import { useState, useEffect } from "react";
import { fetchTeacherPermissionRequests } from "../../utils/firebaseService";
import { useAuth } from "../../context/AuthContext";
import { AttendancePermissionRequest } from "../../types";

function TeacherPermissionRequests() {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState<AttendancePermissionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  useEffect(() => {
    const loadRequests = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        const status = filter === "all" ? undefined : filter;
        const requestsList = await fetchTeacherPermissionRequests(currentUser.uid, status as any);
        setRequests(requestsList);
      } catch (error) {
        console.error("Error fetching permission requests:", error);
        setError("Failed to load permission requests. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, [currentUser, filter]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    
    // If it's a Firebase server timestamp
    if (timestamp && typeof timestamp === 'object' && timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleString();
    }
    
    // If it's a regular Date object
    return new Date(timestamp).toLocaleString();
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'approved': return 'status-badge approved';
      case 'rejected': return 'status-badge rejected';
      default: return 'status-badge pending';
    }
  };

  if (loading) {
    return <div>Loading your permission requests...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="teacher-permission-requests">
      <div className="requests-header">
        <h3>Your Permission Requests</h3>
        <div className="filter-controls">
          <label htmlFor="filter">Filter: </label>
          <select 
            id="filter" 
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
          >
            <option value="all">All Requests</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {requests.length === 0 ? (
        <p>No {filter !== "all" ? filter : ""} permission requests found.</p>
      ) : (
        <table className="requests-table">
          <thead>
            <tr>
              <th>Target Class</th>
              <th>Date</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Requested At</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id}>
                <td>Grade {request.targetGrade} {request.targetClass}</td>
                <td>{request.targetDate}</td>
                <td>{request.reason}</td>
                <td>
                  <span className={getStatusBadgeClass(request.status)}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                </td>
                <td>{formatDate(request.requestedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default TeacherPermissionRequests; 