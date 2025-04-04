import { useState, useEffect } from "react";
import { fetchPermissionRequests, approvePermissionRequest, rejectPermissionRequest } from "../../utils/firebaseService";
import { useAuth } from "../../context/AuthContext";
import { AttendancePermissionRequest } from "../../types";

function PermissionRequestList() {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState<AttendancePermissionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  useEffect(() => {
    const loadRequests = async () => {
      try {
        setLoading(true);
        const status = filter === "all" ? undefined : filter;
        const requestsList = await fetchPermissionRequests(status as any);
        setRequests(requestsList);
      } catch (error) {
        console.error("Error fetching permission requests:", error);
        setError("Failed to load permission requests. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, [filter]);

  const handleApprove = async (requestId: string) => {
    if (!currentUser) return;
    
    try {
      await approvePermissionRequest(requestId, currentUser.uid);
      
      // Update the local state to reflect the change
      setRequests(requests.map(req => 
        req.id === requestId 
          ? { ...req, status: 'approved', responderId: currentUser.uid, respondedAt: new Date() } 
          : req
      ));
    } catch (error) {
      console.error("Error approving request:", error);
      alert("Failed to approve request. Please try again.");
    }
  };

  const handleReject = async (requestId: string) => {
    if (!currentUser) return;
    
    try {
      await rejectPermissionRequest(requestId, currentUser.uid);
      
      // Update the local state to reflect the change
      setRequests(requests.map(req => 
        req.id === requestId 
          ? { ...req, status: 'rejected', responderId: currentUser.uid, respondedAt: new Date() } 
          : req
      ));
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert("Failed to reject request. Please try again.");
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    
    // If it's a Firebase server timestamp
    if (timestamp && typeof timestamp === 'object' && timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleString();
    }
    
    // If it's a regular Date object
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return <div>Loading permission requests...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="permission-requests">
      <div className="requests-header">
        <h3>Attendance Permission Requests</h3>
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
              <th>Teacher</th>
              <th>Target Class</th>
              <th>Date</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Requested At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id} className={`status-${request.status}`}>
                <td>{request.requesterEmail}</td>
                <td>Grade {request.targetGrade} {request.targetClass}</td>
                <td>{request.targetDate}</td>
                <td>{request.reason}</td>
                <td className="request-status">
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </td>
                <td>{formatDate(request.requestedAt)}</td>
                <td data-label="Actions">
                  {request.status === "pending" && (
                    <div className="actions-cell" style={{ display: 'flex', gap: '20px', justifyContent: 'flex-end' }}>
                      <button
                        className="small-button approve-button"
                        onClick={() => handleApprove(request.id)}
                        style={{ minWidth: '80px' }}
                      >
                        Approve
                      </button>
                      <button
                        className="small-button reject-button"
                        onClick={() => handleReject(request.id)}
                        style={{ minWidth: '80px' }}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default PermissionRequestList; 