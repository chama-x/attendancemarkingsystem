import { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GOOGLE_GENAI_API_KEY } from '../../firebaseConfig';
import { 
  fetchStudents, 
  fetchAttendanceForDate, 
  saveAttendance, 
  addStudent,
  fetchAttendanceHistory
} from '../../utils/firebaseService';
import { Student } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface AIAssistantWidgetProps {
  grade: number;
  className: string;
}

interface Message {
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface CommandResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

// AI Tools interfaces
interface ToolResult {
  success: boolean;
  result: string;
  data?: unknown;
}

interface ToolResponse {
  toolName: string;
  result: ToolResult;
}

interface AttendanceStatus {
  status: "present" | "absent" | "late";
}

// Specific tool parameter types
interface MarkAttendanceParams {
  studentName: string;
  status: string;
}

interface AddStudentParams {
  studentName: string;
  studentIndex?: string;
}

interface GetStudentAttendanceParams {
  studentName: string;
}

// Add a new interface for bulk attendance marking parameters
interface MarkBulkAttendanceParams {
  includedStudentNames?: string[];
  excludedStudentNames?: string[];
  status: string;
  markAll?: boolean;
}

type AnyToolParams = MarkAttendanceParams | AddStudentParams | GetStudentAttendanceParams | MarkBulkAttendanceParams | Record<string, never>;

// Add this error handler before the AIAssistantWidget component
const errorHandler = (error: unknown): ToolResult => ({
  success: false,
  result: error instanceof Error 
    ? `Error: ${error.message}` 
    : 'An unknown error occurred'
});

// Helper function to find matching students for bulk operations
const findMatchingStudents = (
  allStudents: Student[],
  options: {
    includedNames?: string[],
    excludedNames?: string[],
    includeAll?: boolean
  }
) => {
  const { includedNames, excludedNames, includeAll } = options;
  
  if (includeAll) {
    if (!excludedNames || excludedNames.length === 0) {
      return { matches: allStudents, notFound: [] };
    }
    
    // Include all students except those in excludedNames
    const excludedStudents = allStudents.filter(student => 
      excludedNames.some(name => 
        student.name.toLowerCase().includes(name.toLowerCase())
      )
    );
    
    return { 
      matches: allStudents.filter(s => !excludedStudents.includes(s)),
      notFound: []
    };
  }
  
  if (!includedNames || includedNames.length === 0) {
    return { matches: [], notFound: [] };
  }
  
  // Process each name to find matching students
  const matches: Student[] = [];
  const notFound: string[] = [];
  
  for (const name of includedNames) {
    const student = allStudents.find(s => 
      s.name.toLowerCase().includes(name.toLowerCase())
    );
    
    if (student) {
      matches.push(student);
    } else {
      notFound.push(name);
    }
  }
  
  return { matches, notFound };
};

// Add custom message hooks for better organization
function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  
  const addMessage = useCallback((text: string, sender: 'user' | 'ai') => {
    const newMessage: Message = {
      text,
      sender,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);
  
  const addUserMessage = useCallback((text: string) => {
    return addMessage(text, 'user');
  }, [addMessage]);
  
  const addAIMessage = useCallback((text: string) => {
    return addMessage(text, 'ai');
  }, [addMessage]);
  
  return { messages, setMessages, addUserMessage, addAIMessage };
}

// Add request status type
type RequestStatus = 'idle' | 'loading' | 'error' | 'success';

const StatusIndicator = ({ status }: { status: RequestStatus }) => {
  if (status === 'idle') return null;
  
  const statusMap = {
    loading: { text: 'Processing...', class: 'status-loading' },
    error: { text: 'Error occurred', class: 'status-error' },
    success: { text: 'Completed', class: 'status-success' }
  };
  
  const { text, class: className } = statusMap[status];
  
  return <div className={`status-indicator ${className}`}>{text}</div>;
};

function AIAssistantWidget({ grade, className }: AIAssistantWidgetProps) {
  useAuth();
  // Use the custom messages hook
  const { messages, setMessages, addUserMessage, addAIMessage } = useMessages();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<RequestStatus>('idle');
  const [students, setStudents] = useState<Student[]>([]);
  const [currentDate] = useState(new Date().toISOString().split('T')[0]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Dynamic command registry
  const commandRegistry = {
    '/add-student': {
      execute: async (text: string) => {
        const namePart = text.replace('/add-student', '').trim();
        if (!namePart) {
          return { success: false, message: 'Please provide a student name. Example: /add-student John Doe' };
        }
        
        const result = await executeAITool('addNewStudent', { studentName: namePart });
        return { 
          success: result?.result.success || false, 
          message: result?.result.result || 'Failed to add student'
        };
      }
    },
    '/mark-present': {
      execute: async (text: string) => {
        const namePart = text.replace('/mark-present', '').trim();
        if (!namePart) {
          return { success: false, message: 'Please provide a student name. Example: /mark-present John Doe' };
        }
        
        const result = await executeAITool('markAttendance', {
          studentName: namePart,
          status: 'present'
        });
        
        return { 
          success: result?.result.success || false, 
          message: result?.result.result || 'Failed to mark attendance'
        };
      }
    },
    '/mark-absent': {
      execute: async (text: string) => {
        const namePart = text.replace('/mark-absent', '').trim();
        if (!namePart) {
          return { success: false, message: 'Please provide a student name. Example: /mark-absent John Doe' };
        }
        
        const result = await executeAITool('markAttendance', {
          studentName: namePart,
          status: 'absent'
        });
        
        return { 
          success: result?.result.success || false, 
          message: result?.result.result || 'Failed to mark attendance'
        };
      }
    },
    '/stats': {
      execute: async () => {
        const result = await executeAITool('getAttendanceStats', {});
        return { 
          success: result?.result.success || false, 
          message: result?.result.result || 'Failed to get attendance statistics'
        };
      }
    },
    '/students': {
      execute: async () => {
        const result = await executeAITool('getStudentList', {});
        return { 
          success: result?.result.success || false, 
          message: result?.result.result || 'Failed to get student list'
        };
      }
    },
    '/today': {
      execute: async () => {
        const result = await executeAITool('getTodayAttendance', {});
        return { 
          success: result?.result.success || false, 
          message: result?.result.result || 'Failed to get today\'s attendance'
        };
      }
    },
    '/help': {
      execute: async () => {
        const timeOfDay = new Date().getHours();
        let timeGreeting = '';
        let suggestedCommand = '';
        
        // Provide context-aware suggestions
        if (timeOfDay < 10) {
          timeGreeting = "Good morning! 🌞 Here are some commands to help you start your day:";
          suggestedCommand = "Tip: Use `/mark-all present` to quickly mark everyone present, then adjust any absences individually.";
        } else if (timeOfDay < 15) {
          timeGreeting = "Hello there! Here are the commands you can use:";
          suggestedCommand = "Tip: Need to see who's here? Try `/present` to see all present students.";
        } else {
          timeGreeting = "Good afternoon! 🌤️ Here are commands that might be helpful as you wrap up the day:";
          suggestedCommand = "Tip: Use `/today` to get a summary of today's attendance before you leave.";
        }
        
        return { 
          success: true, 
          message: `${timeGreeting}

• /add-student [name] - Add a new student (index will be auto-generated)
• /mark-present [name] - Mark student as present
• /mark-absent [name] - Mark student as absent
• /mark-all [status] - Mark all students with a status
• /mark-all [status] except [names] - Mark all students except specified ones
• /mark-students [status] [name1], [name2], ... - Mark multiple specific students
• /today - Show today's attendance statistics
• /present - List students who are present today
• /absent - List students who are absent today
• /late - List students who are late today
• /stats - Show overall attendance statistics
• /students - List all students
• /help - Show this help message

${suggestedCommand}

You can also just chat with me naturally! I'm here to help make your day easier.`
        };
      }
    },
    '/mark-all': {
      execute: async (text: string) => {
        const parts = text.replace('/mark-all', '').trim().split('except');
        const status = parts[0].trim();
        
        if (!status || !['present', 'absent', 'late'].includes(status)) {
          return { 
            success: false, 
            message: 'Please provide a valid status (present, absent, or late). Example: /mark-all present' 
          };
        }
        
        if (parts.length > 1) {
          // We have exceptions
          const excludedNames = parts[1].trim().split(',').map(name => name.trim());
          
          const result = await executeAITool('markBulkAttendance', {
            excludedStudentNames: excludedNames,
            status: status
          });
          
          return { 
            success: result?.result.success || false, 
            message: result?.result.result || 'Failed to mark attendance'
          };
        } else {
          // Mark all students
          const result = await executeAITool('markBulkAttendance', {
            markAll: true,
            status: status
          });
          
          return { 
            success: result?.result.success || false, 
            message: result?.result.result || 'Failed to mark attendance'
          };
        }
      }
    },
    '/mark-students': {
      execute: async (text: string) => {
        const parts = text.replace('/mark-students', '').trim().split(' ');
        
        if (parts.length < 2) {
          return { 
            success: false, 
            message: 'Please provide a status and student names. Example: /mark-students present Sunil, Sampath' 
          };
        }
        
        const status = parts[0];
        if (!['present', 'absent', 'late'].includes(status)) {
          return { 
            success: false, 
            message: 'Please provide a valid status (present, absent, or late). Example: /mark-students present Sunil, Sampath' 
          };
        }
        
        // Get student names - everything after the status, then split by commas
        const studentNamesInput = parts.slice(1).join(' ');
        const studentNames = studentNamesInput.split(',').map(name => name.trim());
        
        if (studentNames.length === 0 || (studentNames.length === 1 && studentNames[0] === '')) {
          return { 
            success: false, 
            message: 'Please provide student names separated by commas. Example: /mark-students present Sunil, Sampath' 
          };
        }
        
        const result = await executeAITool('markBulkAttendance', {
          includedStudentNames: studentNames,
          status: status
        });
        
        return { 
          success: result?.result.success || false, 
          message: result?.result.result || 'Failed to mark attendance'
        };
      }
    },
    '/present': {
      execute: async () => {
        const result = await executeAITool('getStudentsByStatus', { status: 'present' });
        
        return { 
          success: result?.result.success || false, 
          message: result?.result.result || 'Failed to get present students'
        };
      }
    },
    '/absent': {
      execute: async () => {
        const result = await executeAITool('getStudentsByStatus', { status: 'absent' });
        
        return { 
          success: result?.result.success || false, 
          message: result?.result.result || 'Failed to get absent students'
        };
      }
    },
    '/late': {
      execute: async () => {
        const result = await executeAITool('getStudentsByStatus', { status: 'late' });
        
        return { 
          success: result?.result.success || false, 
          message: result?.result.result || 'Failed to get late students'
        };
      }
    }
  };
  
  // Define the AI tools
  const aiTools = [
    {
      name: 'markAttendance' as const,
      description: 'Mark a student as present, absent, or late for the current day',
      execute: async (params: MarkAttendanceParams): Promise<ToolResult> => {
        try {
          const { studentName, status } = params;
          
          if (!studentName || !status) {
            return {
              success: false,
              result: 'Missing required parameters: studentName or status'
            };
          }
          
          // Find the student by name (case insensitive partial match)
          const student = students.find(s => 
            s.name.toLowerCase().includes(studentName.toLowerCase())
          );
          
          if (!student) {
            return {
              success: false,
              result: `I couldn't find a student named "${studentName}" in your class. 🔍 Did you maybe spell the name differently? You can type /students to see a list of all students in your class.`
            };
          }
          
          // Validate status
          const validStatus = ['present', 'absent', 'late'].includes(status.toLowerCase());
          if (!validStatus) {
            return {
              success: false,
              result: `Hmm, I can only mark students as "present", "absent", or "late". 🤔 Could you try again with one of these statuses?`
            };
          }
          
          // Get current attendance data to avoid overwriting other students
          const attendanceData = await fetchAttendanceForDate(grade, className, currentDate);
          
          // Prepare the updated attendance data
          const updatedAttendance: Record<string, AttendanceStatus> = {};
          
          // Keep existing attendance data
          Object.entries(attendanceData).forEach(([studentId, data]) => {
            updatedAttendance[studentId] = { status: data.status as "present" | "absent" | "late" };
          });
          
          // Update this student's attendance
          updatedAttendance[student.id] = { 
            status: status.toLowerCase() as "present" | "absent" | "late" 
          };
          
          // Save the updated attendance
          await saveAttendance(grade, className, currentDate, updatedAttendance);
          
          return {
            success: true,
            result: `Great! I've marked ${student.name} as ${status} for today. ✅`,
            data: { student, status }
          };
        } catch (error) {
          console.error('Error marking attendance:', error);
          return errorHandler(error);
        }
      }
    },
    {
      name: 'addNewStudent' as const,
      description: 'Add a new student to the class',
      execute: async (params: AddStudentParams): Promise<ToolResult> => {
        try {
          const { studentName, studentIndex: providedIndex } = params;
          
          if (!studentName) {
            return {
              success: false,
              result: 'Missing required parameter: studentName'
            };
          }
          
          // Check if student already exists
          const existingStudent = students.find(s => 
            s.name.toLowerCase() === studentName.toLowerCase()
          );
          
          if (existingStudent) {
            return {
              success: false,
              result: `A student named "${studentName}" is already in your class. Did you want to mark their attendance instead? You can use "Mark ${studentName} as present" if that's what you meant.`
            };
          }
          
          // Auto-generate student index if not provided
          let studentIndex = providedIndex || '';
          if (!studentIndex) {
            // Extract existing indices to find the next number
            const existingIndices = students
              .filter(s => s.index && s.index.startsWith(`${grade}${className}`))
              .map(s => s.index)
              .sort();
              
            // Find the next available index number
            let nextNum = 1;
            if (existingIndices.length > 0) {
              // Try to extract the numeric part from the last index
              const lastIndex = existingIndices[existingIndices.length - 1];
              const match = lastIndex.match(/\d+$/);
              if (match) {
                nextNum = parseInt(match[0], 10) + 1;
              }
            }
            
            // Format with padded zeros (e.g., 001, 012, etc.)
            studentIndex = `${grade}${className}${nextNum.toString().padStart(3, '0')}`;
          }
          
          // Add the new student with the generated or provided index
          const newStudentId = await addStudent(grade, className, studentName, studentIndex);
          
          // Refresh the students list
          const updatedStudents = await fetchStudents(grade, className);
          setStudents(updatedStudents);
          
          return {
            success: true,
            result: `Perfect! I've added ${studentName} to your class with index ${studentIndex}. ✨`,
            data: { newStudentId, studentName, studentIndex }
          };
        } catch (error) {
          console.error('Error adding student:', error);
          return {
            success: false,
            result: `I ran into a problem while adding that student to your class. 😓 Please check that the name is unique and try again. If you keep having trouble, you might want to refresh the page.`
          };
        }
      }
    },
    {
      name: 'getAttendanceStats' as const,
      description: 'Get attendance statistics for the class',
      execute: async (): Promise<ToolResult> => {
        try {
          // Get last 30 days of attendance
          const historyData = await fetchAttendanceHistory(grade, className, 30);
          
          if (Object.keys(historyData).length === 0) {
            return {
              success: true,
              result: `I don't see any attendance records for this class in the last 30 days. Once you start recording attendance, I'll be able to show you helpful statistics here!`
            };
          }
          
          // Calculate statistics
          let presentCount = 0;
          let absentCount = 0;
          let lateCount = 0;
          let totalRecords = 0;
          
          Object.entries(historyData).forEach(([, records]) => {
            Object.values(records).forEach((record: { status?: string }) => {
              totalRecords++;
              if (record.status === 'present') presentCount++;
              else if (record.status === 'absent') absentCount++;
              else if (record.status === 'late') lateCount++;
            });
          });
          
          const presentRate = totalRecords > 0 ? (presentCount / totalRecords * 100).toFixed(1) : '0';
          const absentRate = totalRecords > 0 ? (absentCount / totalRecords * 100).toFixed(1) : '0';
          const lateRate = totalRecords > 0 ? (lateCount / totalRecords * 100).toFixed(1) : '0';
          
          return {
            success: true,
            result: `Attendance statistics for the last 30 days:
- Present: ${presentCount} (${presentRate}%)
- Absent: ${absentCount} (${absentRate}%)
- Late: ${lateCount} (${lateRate}%)
- Total records: ${totalRecords}`,
            data: {
              presentCount,
              absentCount,
              lateCount,
              totalRecords,
              presentRate,
              absentRate,
              lateRate
            }
          };
        } catch (error) {
          console.error('Error fetching attendance statistics:', error);
          return {
            success: false,
            result: 'There was an error retrieving attendance statistics. Please try again.'
          };
        }
      }
    },
    {
      name: 'getStudentList' as const,
      description: 'Get the list of students in the class',
      execute: async (): Promise<ToolResult> => {
        try {
          if (students.length === 0) {
            return {
              success: true,
              result: `It looks like there aren't any students in your class yet. Would you like me to help you add some students? Just say "Add a new student" or use the /add-student command.`
            };
          }
          
          const studentList = students.map(s => `${s.name}${s.index ? ` (${s.index})` : ''}`).join(', ');
          
          return {
            success: true,
            result: `Students in Grade ${grade} ${className} (${students.length} total):\n${studentList}`,
            data: { students }
          };
        } catch (error) {
          console.error('Error getting student list:', error);
          return {
            success: false,
            result: 'There was an error retrieving the student list. Please try again.'
          };
        }
      }
    },
    {
      name: 'getStudentAttendance' as const,
      description: 'Get attendance info for a specific student',
      execute: async (params: GetStudentAttendanceParams): Promise<ToolResult> => {
        try {
          const { studentName } = params;
          
          if (!studentName) {
            return {
              success: false,
              result: 'Missing required parameter: studentName'
            };
          }
          
          // Find the student by name
          const student = students.find(s => 
            s.name.toLowerCase().includes(studentName.toLowerCase())
          );
          
          if (!student) {
            return {
              success: false,
              result: `Could not find a student named "${studentName}" in this class`
            };
          }
          
          // Get attendance history
          const historyData = await fetchAttendanceHistory(grade, className, 30);
          
          if (Object.keys(historyData).length === 0) {
            return {
              success: true,
              result: `No attendance records found for ${student.name} in the last 30 days.`
            };
          }
          
          // Compile student attendance
          let presentCount = 0;
          let absentCount = 0;
          let lateCount = 0;
          let totalDays = 0;
          const records: {date: string, status: string}[] = [];
          
          Object.entries(historyData).forEach(([date, dateRecords]) => {
            // Check if this student has a record for this date
            const studentRecord = Object.entries(dateRecords).find(
              ([id]) => id === student.id
            );
            
            if (studentRecord) {
              const [, record] = studentRecord;
              totalDays++;
              
              if ((record as { status: string }).status === 'present') presentCount++;
              else if ((record as { status: string }).status === 'absent') absentCount++;
              else if ((record as { status: string }).status === 'late') lateCount++;
              
              records.push({
                date: date,
                status: (record as { status: string }).status
              });
            }
          });
          
          // Sort records by date (most recent first)
          records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          // Format the top 5 most recent records
          const recentRecords = records.slice(0, 5).map(r => 
            `${new Date(r.date).toLocaleDateString()}: ${r.status.charAt(0).toUpperCase() + r.status.slice(1)}`
          ).join('\n');
          
          const attendanceRate = totalDays > 0 ? (presentCount / totalDays * 100).toFixed(1) : '0';
          
          return {
            success: true,
            result: `Attendance for ${student.name}:
- Present: ${presentCount} days
- Absent: ${absentCount} days
- Late: ${lateCount} days
- Attendance rate: ${attendanceRate}%

Recent attendance:
${recentRecords}`,
            data: {
              student,
              presentCount,
              absentCount,
              lateCount,
              attendanceRate,
              records
            }
          };
        } catch (error) {
          console.error('Error getting student attendance:', error);
          return {
            success: false,
            result: 'There was an error retrieving the student attendance. Please try again.'
          };
        }
      }
    },
    {
      name: 'markBulkAttendance' as const,
      description: 'Mark multiple students or all students except some with a specified attendance status',
      execute: async (params: MarkBulkAttendanceParams): Promise<ToolResult> => {
        try {
          const { includedStudentNames, excludedStudentNames, status, markAll } = params;

          // Validate status
          const validStatus = ['present', 'absent', 'late'].includes(status.toLowerCase());
          if (!validStatus) {
            return {
              success: false,
              result: 'Status must be one of: present, absent, late'
            };
          }

          // Get current attendance data to avoid overwriting other students
          const attendanceData = await fetchAttendanceForDate(grade, className, currentDate);
          
          // Prepare the updated attendance data
          const updatedAttendance: Record<string, AttendanceStatus> = { ...attendanceData };

          // Find students to update using our new helper function
          const { matches: studentsToUpdate, notFound } = findMatchingStudents(students, {
            includedNames: includedStudentNames,
            excludedNames: excludedStudentNames,
            includeAll: markAll
          });

          if (studentsToUpdate.length === 0) {
            return {
              success: false,
              result: 'No students were found to update.'
            };
          }

          const statusToSet = status.toLowerCase() as "present" | "absent" | "late";
          
          // Update attendance for matching students
          studentsToUpdate.forEach(student => {
            updatedAttendance[student.id] = { status: statusToSet };
          });

          // Save the updated attendance
          await saveAttendance(grade, className, currentDate, updatedAttendance);
          
          // Prepare response message
          let resultMessage = '';
          const studentNames = studentsToUpdate.map(s => s.name);
          
          if (markAll) {
            resultMessage = `✅ All ${studentNames.length} students have been marked as ${status}. Have a great day!`;
          } else if (includedStudentNames) {
            resultMessage = `✅ Successfully marked ${studentNames.join(', ')} as ${status}.`;
            if (notFound.length > 0) {
              resultMessage += ` I couldn't find these students: ${notFound.join(', ')}. Please check their names and try again if needed.`;
            }
          } else if (excludedStudentNames) {
            resultMessage += `✅ All students except ${excludedStudentNames.join(', ')} have been marked as ${status}.`;
          }
          
          return {
            success: true,
            result: resultMessage,
            data: { updatedStudents: studentNames, notFoundStudents: notFound, status }
          };
        } catch (error) {
          console.error('Error marking bulk attendance:', error);
          return errorHandler(error);
        }
      }
    },
    {
      name: 'getTodayAttendance' as const,
      description: 'Get attendance information for today only',
      execute: async (): Promise<ToolResult> => {
        try {
          // Get today's attendance records
          const attendanceData = await fetchAttendanceForDate(grade, className, currentDate);
          
          if (Object.keys(attendanceData).length === 0) {
            return {
              success: true,
              result: `No attendance has been recorded for today yet. Would you like me to help you mark attendance now? You can say "Mark all present" to get started quickly.`
            };
          }
          
          // Calculate statistics
          let presentCount = 0;
          let absentCount = 0;
          let lateCount = 0;
          let recordedCount = 0;
          let notRecordedCount = 0;
          
          // Get the full student list to check who's not been marked
          const allStudents = [...students];
          const markedStudentIds = new Set(Object.keys(attendanceData));
          
          // Count by status
          Object.values(attendanceData).forEach((record) => {
            recordedCount++;
            if (record.status === 'present') presentCount++;
            else if (record.status === 'absent') absentCount++;
            else if (record.status === 'late') lateCount++;
          });
          
          // Find students without attendance records
          const studentsWithoutRecords = allStudents.filter(student => !markedStudentIds.has(student.id));
          notRecordedCount = studentsWithoutRecords.length;
          
          // Build result message
          let resultMessage = `Today's Attendance (${new Date(currentDate).toLocaleDateString()}):\n`;
          resultMessage += `- Present: ${presentCount} students\n`;
          resultMessage += `- Absent: ${absentCount} students\n`;
          resultMessage += `- Late: ${lateCount} students\n`;
          resultMessage += `- Total recorded: ${recordedCount} students\n`;
          
          if (notRecordedCount > 0) {
            resultMessage += `- Not yet recorded: ${notRecordedCount} students\n`;
            
            // List students without attendance records, but limit to 10 to avoid too long messages
            const studentsToList = studentsWithoutRecords.slice(0, 10);
            if (studentsToList.length > 0) {
              resultMessage += `\nStudents without attendance records today:\n`;
              studentsToList.forEach(student => {
                resultMessage += `- ${student.name}\n`;
              });
              
              if (studentsWithoutRecords.length > 10) {
                resultMessage += `... and ${studentsWithoutRecords.length - 10} more\n`;
              }
            }
            
            const timeOfDay = new Date().getHours();
            if (timeOfDay < 10) {
              resultMessage += `\nIt's still early - would you like me to help you mark these students now?`;
            } else if (timeOfDay > 14) {
              resultMessage += `\nThe day is almost over - don't forget to complete your attendance records. Need help?`;
            }
          } else if (recordedCount === allStudents.length && recordedCount > 0) {
            // All students have attendance recorded
            resultMessage += `\nGreat job! You've recorded attendance for all ${recordedCount} students today. 👍`;
            
            if (presentCount === recordedCount) {
              resultMessage += ` Everyone is present today - that's fantastic!`;
            }
          }
          
          return {
            success: true,
            result: resultMessage,
            data: {
              date: currentDate,
              presentCount,
              absentCount,
              lateCount,
              recordedCount,
              notRecordedCount,
              studentsWithoutRecords: studentsWithoutRecords.map(s => s.name)
            }
          };
        } catch (error) {
          console.error('Error getting today\'s attendance:', error);
          return {
            success: false,
            result: 'There was an error retrieving today\'s attendance data. Please try again.'
          };
        }
      }
    },
    {
      name: 'getStudentsByStatus' as const,
      description: 'Get a list of students with a specific attendance status for today or a given date',
      execute: async (params: { status: string, date?: string }): Promise<ToolResult> => {
        try {
          const { status, date = currentDate } = params;
          
          // Validate status
          const validStatus = ['present', 'absent', 'late'].includes(status.toLowerCase());
          if (!validStatus) {
            return {
              success: false,
              result: 'Status must be one of: present, absent, or late'
            };
          }
          
          // Get attendance data for the specified date
          const attendanceData = await fetchAttendanceForDate(grade, className, date);
          
          if (Object.keys(attendanceData).length === 0) {
            return {
              success: true,
              result: `No attendance has been recorded for ${date === currentDate ? 'today' : date}.`
            };
          }
          
          // Filter records by the requested status
          const targetStatus = status.toLowerCase();
          const studentsByStatus: {id: string, name: string, index: string}[] = [];
          
          // Iterate through attendance records
          Object.entries(attendanceData).forEach(([studentId, record]) => {
            if (record.status === targetStatus) {
              // Find the student in our local data
              const student = students.find(s => s.id === studentId);
              if (student) {
                studentsByStatus.push({
                  id: studentId,
                  name: student.name,
                  index: student.index
                });
              }
            }
          });
          
          // Sort by name
          studentsByStatus.sort((a, b) => a.name.localeCompare(b.name));
          
          if (studentsByStatus.length === 0) {
            return {
              success: true,
              result: `No students were marked as "${status}" ${date === currentDate ? 'today' : 'on ' + date}.`
            };
          }
          
          // Format the result
          const dateText = date === currentDate ? 'today' : 'on ' + new Date(date).toLocaleDateString();
          let resultMessage = `Students who are ${status} ${dateText} (${studentsByStatus.length} total):\n`;
          
          studentsByStatus.forEach((student, index) => {
            resultMessage += `${index + 1}. ${student.name}${student.index ? ` (${student.index})` : ''}\n`;
          });
          
          return {
            success: true,
            result: resultMessage,
            data: {
              date,
              status: targetStatus,
              count: studentsByStatus.length,
              students: studentsByStatus
            }
          };
        } catch (error) {
          console.error('Error getting students by status:', error);
          return {
            success: false,
            result: 'There was an error retrieving the student list. Please try again.'
          };
        }
      }
    }
  ] as const;
  
  // Initialize with a welcome message
  useEffect(() => {
    const welcomeMessage = {
      text: `Hello there! 👋 I'm your teaching assistant AI for Grade ${grade} ${className}. I'm here to make your day easier!

I can help you with:
      
• Marking attendance (e.g., "Mark Hasith as absent" or "Mark Sunil and Sampath as present")
• Adding new students to your class (I'll auto-generate their indices!)
• Showing you who's present, absent, or late today
• Providing attendance statistics and reports

What can I help you with today? Feel free to ask me anything!`,
      sender: 'ai' as const,
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage]);
    
    // Fetch class students
    const fetchClassStudents = async () => {
      try {
        const studentsList = await fetchStudents(grade, className);
        setStudents(studentsList);
      } catch (error) {
        console.error('Error fetching students:', error);
      }
    };
    
    fetchClassStudents();
  }, [grade, className, setMessages]);
  
  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Add user message
    addUserMessage(input);
    setInput('');
    setLoading(true);
    setStatus('loading');
    
    try {
      // Check if this is a command
      if (isCommand(input)) {
        const result = await processCommand(input);
        addAIMessage(result.message);
        setStatus(result.success ? 'success' : 'error');
      } else {
        // Process with AI
        const aiResponse = await processWithGemini(input);
        addAIMessage(aiResponse);
        setStatus('success');
      }
    } catch (error) {
      console.error('Error processing message:', error);
      addAIMessage(`I'm sorry, I ran into a problem while processing your request. 😥 

Could you try rephrasing that, or use one of the commands from the /help menu? I want to make sure I'm understanding what you need assistance with.`);
      setStatus('error');
    } finally {
      setLoading(false);
      // Reset status after a delay
      setTimeout(() => setStatus('idle'), 3000);
    }
  };
  
  const isCommand = (text: string): boolean => {
    const commandPrefix = '/';
    return text.trim().startsWith(commandPrefix);
  };
  
  // Replace the existing processCommand with the new version using the command registry
  const processCommand = async (command: string): Promise<CommandResult> => {
    const trimmed = command.trim();
    
    // Find the matching command handler
    for (const [prefix, handler] of Object.entries(commandRegistry)) {
      if (trimmed.toLowerCase().startsWith(prefix)) {
        return handler.execute(trimmed);
      }
    }
    
    return { 
      success: false, 
      message: `I don't recognize that command. 🤔 

Did you mean one of these?
• /help - See all available commands
• /today - Check today's attendance 
• /students - See your class list

Or just ask me in plain language what you'd like to do!`
    };
  };
  
  type ToolName = typeof aiTools[number]['name'];
  
  const findTool = (name: string) => {
    return aiTools.find(t => t.name === name as ToolName);
  };
  
  // Improved error handling with the error handler
  const executeAITool = async <T extends AnyToolParams>(toolName: ToolName, params: T): Promise<ToolResponse | null> => {
    const tool = findTool(toolName);
    if (!tool) return null;
    
    try {
      const result = await (tool.execute as (params: T) => Promise<ToolResult>)(params);
      return { toolName, result };
    } catch (error) {
      console.error(`Error executing AI tool ${toolName}:`, error);
      return { toolName, result: errorHandler(error) };
    }
  };
  
  // Function to dynamically generate AI context
  const generateAIContext = () => {
    const timeOfDay = new Date().getHours();
    let timeGreeting = '';
    
    if (timeOfDay < 12) {
      timeGreeting = "Good morning! It's a great time to take attendance for today.";
    } else if (timeOfDay < 17) {
      timeGreeting = "Good afternoon! How is your class going today?";
    } else {
      timeGreeting = "Good evening! Wrapping up for the day?";
    }
    
    const toolDescriptions = aiTools.map(tool => 
      `- ${tool.name}: ${tool.description}`
    ).join('\n');
    
    return `You are a friendly, helpful AI teaching assistant named "Edu" for a school attendance management system. The current user is a teacher for Grade ${grade} ${className}.

${timeGreeting}

Current date: ${new Date().toLocaleDateString()}
Current time: ${new Date().toLocaleTimeString()}

Student count in class: ${students.length}

Available tools:
${toolDescriptions}

IMPORTANT RULES:
1. If the user mentions multiple student names like "Mark John and Mary as present", use the markBulkAttendance tool with includedStudentNames.
2. For attendance questions for today, use getTodayAttendance.
3. For specific status inquiries, use getStudentsByStatus.
4. Be warm, encouraging, and positive in your responses.`;
  };
  
  const processWithGemini = async (prompt: string): Promise<string> => {
    try {
      const genAI = new GoogleGenerativeAI(GOOGLE_GENAI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      // Generate context dynamically
      const context = generateAIContext();
      
      // Update the JSON analysis prompt to include bulk operations
      const analysisPrompt = `${context}\n\nUser: ${prompt}\n\nPrevious conversation context:
${messages.slice(-3).map(m => `${m.sender === 'user' ? 'Teacher' : 'Assistant'}: ${m.text}`).join('\n')}

Analyze what the user is asking for. If they want to perform an action, identify which tool should be used and what parameters would be needed. 

IMPORTANT RULES:
1. If the user mentions multiple student names like "Mark John and Mary as present" or "Mark John, Mary, and Sam as present", this should use the markBulkAttendance tool with includedStudentNames properly parsed.

2. If the user is asking about today's attendance or attendance for today, use the getTodayAttendance tool which is specifically designed for current day attendance information.

3. If the user is asking about which students are present, absent, or late (e.g., "Who is present today?", "Which students are absent?", "Show me the late students"), use the getStudentsByStatus tool with the appropriate status parameter.

4. If the user seems to be asking a follow-up question related to previous information, consider the conversation context.

5. If the user is expressing frustration or confusion, acknowledge their feelings first before providing a solution.

For example:
- "Who is present today?" → getStudentsByStatus with status="present"
- "Show me the absent students" → getStudentsByStatus with status="absent"
- "List students who are late" → getStudentsByStatus with status="late"

Reply with a JSON object like this:
{
  "intention": "get_attendance_stats | get_today_attendance | get_students_by_status | mark_attendance | mark_bulk_attendance | add_student | get_student_info | general_question",
  "toolToUse": "markAttendance | markBulkAttendance | addNewStudent | getAttendanceStats | getTodayAttendance | getStudentsByStatus | getStudentList | getStudentAttendance | none",
  "params": {
    "studentName": "name of student if applicable",
    "status": "present | absent | late (if marking attendance or filtering students)",
    "studentIndex": "optional student ID (will be auto-generated if not provided)",
    "includedStudentNames": ["student1", "student2"] (for bulk attendance of specific students),
    "excludedStudentNames": ["student3"] (for bulk attendance of all EXCEPT these students),
    "markAll": true/false (for marking ALL students),
    "date": "specific date if not today (YYYY-MM-DD format)"
  },
  "sentimentAnalysis": "neutral | confused | frustrated | happy | curious",
  "explanation": "Brief explanation of why this tool was chosen, considering context"
}`;
      
      // First, get AI's interpretation of the user request
      const analysisResult = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: analysisPrompt }] }]
      });
      
      let analysisText = analysisResult.response.text();
      
      // Extract JSON from the response (in case the AI added additional text)
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisText = jsonMatch[0];
      }
      
      interface AnalysisResult {
        intention: string;
        toolToUse: string;
        params: Record<string, string | string[] | boolean | number>;
        sentimentAnalysis?: string;
        explanation?: string;
      }
      
      let analysis: AnalysisResult;
      try {
        analysis = JSON.parse(analysisText) as AnalysisResult;
      } catch (error) {
        console.error('Error parsing AI analysis:', error);
        // Fallback to showing a direct response
        const directResult = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: `${context}\n\nUser: ${prompt}\n\nPrevious messages: ${messages.slice(-3).map(m => `${m.sender === 'user' ? 'Teacher' : 'Assistant'}: ${m.text}`).join('\n')}\n\nRespond directly to the user's question in a friendly, helpful way. Include contextual information if relevant. Keep your response focused but with a warm, conversational tone.` }] }]
        });
        return directResult.response.text();
      }
      
      // If analysis indicates we should use a tool, execute it
      if (analysis.toolToUse && analysis.toolToUse !== 'none') {
        const toolResponse = await executeAITool(
          analysis.toolToUse as ToolName, 
          analysis.params as AnyToolParams
        );
        
        if (toolResponse && toolResponse.result.success) {
          // Return the tool result
          return toolResponse.result.result;
        } else {
          // Tool execution failed, get AI to generate a response about the failure
          const errorResult = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: `${context}\n\nUser: ${prompt}\n\nPrevious messages: ${messages.slice(-3).map(m => `${m.sender === 'user' ? 'Teacher' : 'Assistant'}: ${m.text}`).join('\n')}\n\nI tried to use the ${analysis.toolToUse} tool but it failed with error: ${toolResponse?.result.result || 'Unknown error'}. Please generate a helpful response that explains the issue in a friendly, empathetic way. Offer alternative suggestions if appropriate.` }] }]
          });
          return errorResult.response.text();
        }
      }
      
      // If no tool is needed, just get a direct response
      const directResult = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: `${context}\n\nUser: ${prompt}\n\nPrevious messages: ${messages.slice(-3).map(m => `${m.sender === 'user' ? 'Teacher' : 'Assistant'}: ${m.text}`).join('\n')}\n\nRespond directly to the user's question in a friendly, helpful way. Include contextual information if relevant. Keep your response focused but with a warm, conversational tone.` }] }]
      });
      
      return directResult.response.text();
    } catch (error) {
      console.error('Error with Gemini API:', error);
      return 'I apologize, but I encountered an error connecting to my knowledge base. Please try again later.';
    }
  };
  
  const formatTimestamp = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="ai-assistant-widget">
      <div className="widget-header">
        <h4>Attendance AI Assistant</h4>
        <StatusIndicator status={status} />
      </div>
      <div className="chat-container">
        <div className="message-list">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`message ${message.sender === 'user' ? 'user-message' : 'ai-message'}`}
            >
              <div className="message-content">
                <p>{message.text}</p>
                <span className="message-time">{formatTimestamp(message.timestamp)}</span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSubmit} className="message-input-form">
          <div className="input-container">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={loading ? 'Processing...' : 'Ask me anything or type / for commands...'}
              disabled={loading}
              className="message-input"
            />
            <button 
              type="submit" 
              disabled={loading || !input.trim()} 
              className="send-button"
            >
              {loading ? 
                <span className="loading-indicator"></span> : 
                <span className="send-icon">→</span>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AIAssistantWidget; 