import { useState, FormEvent } from "react";
import { requestAttendancePermission } from "../../utils/firebaseService";
import { useAuth } from "../../context/AuthContext";

interface RequestPermissionFormProps {
  onRequestSubmitted?: () => void;
}

function RequestPermissionForm({ onRequestSubmitted }: RequestPermissionFormProps) {
  const { currentUser } = useAuth();
  const [targetGrade, setTargetGrade] = useState("");
  const [targetClass, setTargetClass] = useState("");
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError("You must be logged in to request permission");
      return;
    }
    
    // Validate inputs
    if (!targetGrade) {
      setError("Grade is required");
      return;
    }
    
    if (!targetClass) {
      setError("Class is required");
      return;
    }
    
    if (!targetDate) {
      setError("Date is required");
      return;
    }
    
    if (!reason.trim()) {
      setError("Reason is required");
      return;
    }
    
    setIsSubmitting(true);
    setError("");
    setSuccess("");
    
    try {
      const userEmail = currentUser.email || "Unknown";
      const userName = userEmail.split('@')[0]; // Simple name extraction from email
      
      await requestAttendancePermission(
        currentUser.uid,
        userEmail,
        userName,
        parseInt(targetGrade),
        targetClass,
        targetDate,
        reason.trim()
      );
      
      setSuccess("Permission request submitted successfully!");
      
      // Reset form
      setTargetGrade("");
      setTargetClass("");
      setTargetDate(new Date().toISOString().split('T')[0]);
      setReason("");
      
      // Notify parent component if callback provided
      if (onRequestSubmitted) {
        onRequestSubmitted();
      }
    } catch (error) {
      console.error("Error submitting permission request:", error);
      setError("Failed to submit permission request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="permission-request-form">
      <h3>Request Attendance Marking Permission</h3>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="targetGrade">Grade:</label>
          <input
            type="number"
            id="targetGrade"
            min="1"
            max="13"
            value={targetGrade}
            onChange={(e) => setTargetGrade(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="targetClass">Class:</label>
          <input
            type="text"
            id="targetClass"
            value={targetClass}
            onChange={(e) => setTargetClass(e.target.value)}
            placeholder="e.g., A, B, C"
            disabled={isSubmitting}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="targetDate">Date:</label>
          <input
            type="date"
            id="targetDate"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="reason">Reason:</label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why you need to mark attendance for this class"
            disabled={isSubmitting}
            required
            rows={4}
          />
        </div>
        
        <button 
          type="submit" 
          className="submit-button" 
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit Request"}
        </button>
      </form>
    </div>
  );
}

export default RequestPermissionForm; 