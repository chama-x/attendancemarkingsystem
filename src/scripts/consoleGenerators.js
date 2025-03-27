// Sample data generator for browser console
// Copy and paste this code into the browser console when logged into the app

/**
 * Generate sample students for a class
 * Use this in the browser console
 */
const generateSampleStudents = () => {
  // Sample student data
  const sampleStudentData = [
    { name: "Amal Perera", index: "ST12001" },
    { name: "Kamala Silva", index: "ST12002" },
    { name: "Nimal Fernando", index: "ST12003" },
    { name: "Sunil Rajapaksa", index: "ST12004" },
    { name: "Dilshan Wijeratne", index: "ST12005" },
    { name: "Priyanka Jayawardena", index: "ST12006" },
    { name: "Kasun Mendis", index: "ST12007" },
    { name: "Shani Gunawardena", index: "ST12008" },
    { name: "Lalith Bandara", index: "ST12009" },
    { name: "Malini Seneviratne", index: "ST12010" },
    { name: "Tharushi Karunaratne", index: "ST12011" },
    { name: "Ajith Kumara", index: "ST12012" },
  ];

  // Function to add sample students to a class
  const addSampleStudents = async (grade, className, count = 3) => {
    try {
      console.log(`Adding ${count} students to Grade ${grade}${className}...`);
      
      // Get Firebase database reference
      const db = firebase.database();
      const studentsRef = db.ref(`students/grade${grade}${className}`);
      
      // Generate an offset to get different students for different classes
      const offset = ((grade % 4) * 3 + (className.charCodeAt(0) - 65) * 3) % sampleStudentData.length;
      
      // Add students
      for (let i = 0; i < count; i++) {
        const studentIndex = (offset + i) % sampleStudentData.length;
        const student = sampleStudentData[studentIndex];
        
        // Customize the index for the grade and class
        const customIndex = `${grade}${className}${student.index.substring(4)}`;
        
        await studentsRef.push({
          name: student.name,
          index: customIndex
        });
        
        console.log(`  Added ${student.name} with index ${customIndex}`);
      }
      
      console.log(`✅ Successfully added ${count} students to Grade ${grade}${className}`);
      return true;
    } catch (error) {
      console.error(`❌ Error adding students to Grade ${grade}${className}:`, error);
      return false;
    }
  };

  // Function to generate sample data for multiple classes
  const generateForAll = async (grades = [10, 11, 12, 13], classes = ["A", "B", "C"], studentsPerClass = 3) => {
    console.log("🚀 Starting sample data generation...");
    
    for (const grade of grades) {
      for (const className of classes) {
        await addSampleStudents(grade, className, studentsPerClass);
      }
    }
    
    console.log("✅ Sample data generation completed!");
  };

  // Interactive console menu
  console.log("=== Sample Student Generator ===");
  console.log("Choose an option:");
  console.log("1. Generate students for all grades and classes");
  console.log("2. Generate students for a specific grade and class");
  
  const option = prompt("Enter option (1 or 2):");
  
  if (option === "1") {
    const studentsPerClass = prompt("How many students per class? (default: 3)", "3");
    generateForAll([10, 11, 12, 13], ["A", "B", "C"], parseInt(studentsPerClass) || 3);
  } else if (option === "2") {
    const grade = prompt("Enter grade (e.g., 10):");
    const className = prompt("Enter class (e.g., A):");
    const count = prompt("How many students? (default: 3)", "3");
    
    if (grade && className) {
      addSampleStudents(parseInt(grade), className, parseInt(count) || 3);
    } else {
      console.log("❌ Invalid grade or class");
    }
  } else {
    console.log("❌ Invalid option");
  }
};

/**
 * Generate sample permission requests
 * Use this in the browser console when logged in as a teacher
 */
const generateSamplePermissionRequests = () => {
  // Function to create a sample permission request
  const createPermissionRequest = async (teacherUid, teacherEmail, teacherName, targetGrade, targetClass, targetDate, reason) => {
    try {
      console.log(`Creating permission request for Grade ${targetGrade}${targetClass} on ${targetDate}...`);
      
      // Get Firebase database reference
      const db = firebase.database();
      const permissionsRef = db.ref('attendancePermissions');
      
      await permissionsRef.push({
        requesterId: teacherUid,
        requesterEmail: teacherEmail,
        requesterName: teacherName,
        targetGrade: targetGrade,
        targetClass: targetClass,
        targetDate: targetDate,
        reason: reason,
        status: 'pending',
        requestedAt: firebase.database.ServerValue.TIMESTAMP
      });
      
      console.log(`✅ Successfully created permission request`);
      return true;
    } catch (error) {
      console.error(`❌ Error creating permission request:`, error);
      return false;
    }
  };
  
  // Get current user
  const currentUser = firebase.auth().currentUser;
  
  if (!currentUser) {
    console.log("❌ You must be logged in to create permission requests");
    return;
  }
  
  console.log("=== Sample Permission Request Generator ===");
  
  const teacherName = currentUser.email.split('@')[0];
  const targetGrade = prompt("Enter target grade (e.g., 10):");
  const targetClass = prompt("Enter target class (e.g., A):");
  
  if (!targetGrade || !targetClass) {
    console.log("❌ Invalid grade or class");
    return;
  }
  
  // Create a date for yesterday
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  const targetDate = prompt(`Enter target date (default: ${yesterdayStr})`, yesterdayStr);
  const reason = prompt("Enter reason for permission request:", "Teacher is on leave");
  
  createPermissionRequest(
    currentUser.uid,
    currentUser.email,
    teacherName,
    parseInt(targetGrade),
    targetClass,
    targetDate,
    reason
  );
};

// Log instructions on how to use these functions
console.log("=== Sample Data Generators ===");
console.log("Run one of these functions:");
console.log("1. generateSampleStudents() - Creates sample students");
console.log("2. generateSamplePermissionRequests() - Creates sample permission requests (must be logged in as teacher)"); 