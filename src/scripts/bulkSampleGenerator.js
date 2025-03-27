// Bulk Sample Data Generator for School Attendance System
// This script generates sample data for teachers and students for grades 1, 5, 10, and 12
// Copy and paste this into your browser console when logged in as admin

const bulkGenerateSampleData = async () => {
  console.log("Starting bulk sample data generation...");
  
  // Helper function to get Firebase database reference
  const getDatabase = () => {
    if (typeof firebase !== 'undefined' && firebase.database) {
      return firebase.database();
    } else if (window.firebase && window.firebase.database) {
      return window.firebase.database();
    } else {
      throw new Error("Firebase database not found");
    }
  };
  
  // Sample student data
  const sampleStudentData = [
    { name: "Amal Perera", index: "001" },
    { name: "Kamala Silva", index: "002" },
    { name: "Nimal Fernando", index: "003" },
    { name: "Sunil Rajapaksa", index: "004" },
    { name: "Dilshan Wijeratne", index: "005" },
    { name: "Priyanka Jayawardena", index: "006" },
    { name: "Kasun Mendis", index: "007" },
    { name: "Shani Gunawardena", index: "008" },
    { name: "Lalith Bandara", index: "009" },
    { name: "Malini Seneviratne", index: "010" },
    { name: "Tharushi Karunaratne", index: "011" },
    { name: "Ajith Kumara", index: "012" },
  ];
  
  try {
    const db = getDatabase();
    
    // Grades and classes to generate
    const grades = [1, 5, 10, 12];
    const classes = ["A", "B", "C"];
    
    // 1. First generate teachers for each grade and class
    const teacherCreationPromises = [];
    const teacherEmails = [];
    
    for (const grade of grades) {
      for (const className of classes) {
        const teacherEmail = `teacher.grade${grade}${className}@school.com`;
        teacherEmails.push({ grade, className, email: teacherEmail });
        
        // Generate a unique ID for the teacher
        const teacherId = `teacher_${grade}${className}_${Date.now()}`;
        const teacherRef = db.ref(`users/${teacherId}`);
        
        // Create teacher record
        const teacherPromise = teacherRef.set({
          email: teacherEmail,
          role: "teacher",
          grade: grade,
          class: className
        });
        
        teacherCreationPromises.push(teacherPromise);
        console.log(`Created teacher for Grade ${grade}${className}: ${teacherEmail}`);
      }
    }
    
    // Wait for all teacher creation to complete
    await Promise.all(teacherCreationPromises);
    console.log("All teachers created successfully!");
    
    // 2. Now generate students for each grade and class
    const studentCreationPromises = [];
    
    for (const grade of grades) {
      for (const className of classes) {
        const studentsRef = db.ref(`students/grade${grade}${className}`);
        
        // Add multiple students to each class
        for (let i = 0; i < 12; i++) {
          const studentIndex = i % sampleStudentData.length;
          const student = sampleStudentData[studentIndex];
          
          // Format the index with grade, class and padded number
          const formattedIndex = `${grade}${className}${student.index}`;
          
          // Generate a new student record
          const newStudentRef = studentsRef.push();
          const studentPromise = newStudentRef.set({
            name: student.name,
            index: formattedIndex
          });
          
          studentCreationPromises.push(studentPromise);
        }
        
        console.log(`Added 12 students to Grade ${grade}${className}`);
      }
    }
    
    // Wait for all student creation to complete
    await Promise.all(studentCreationPromises);
    console.log("All students created successfully!");
    
    // Print summary
    console.log("\nSample Data Generation Summary:");
    console.log(`- Created ${teacherEmails.length} teachers for grades 1, 5, 10, 12`);
    console.log(`- Created 144 students (12 students in each of 12 classes)`);
    console.log("\nTeacher Emails:");
    teacherEmails.forEach(t => console.log(`- ${t.email} (Grade ${t.grade}${t.className})`));
    
    return "Sample data generation completed!";
  } catch (error) {
    console.error("Error generating sample data:", error);
    return "Error generating sample data. Check console for details.";
  }
};

// Add to window to call manually
window.bulkGenerateSampleData = bulkGenerateSampleData;

// Log instructions
console.log("Sample data generator loaded!");
console.log("Run bulkGenerateSampleData() to create sample teachers and students for grades 1, 5, 10, and 12");

// Alternative simplified method for direct copying
const generateSampleData = () => {
  const script = `
  // Simple function to generate teachers and students
  const generateSampleData = async () => {
    console.log("Starting sample data generation...");
    
    try {
      const db = firebase.database();
      const grades = [1, 5, 10, 12];
      const classes = ["A", "B", "C"];
      
      // Sample names
      const names = [
        "Amal Perera", "Kamala Silva", "Nimal Fernando", "Sunil Rajapaksa",
        "Dilshan Wijeratne", "Priyanka Jayawardena", "Kasun Mendis", "Shani Gunawardena",
        "Lalith Bandara", "Malini Seneviratne", "Tharushi Karunaratne", "Ajith Kumara"
      ];
      
      // Create teachers
      for (const grade of grades) {
        for (const className of classes) {
          const teacherEmail = \`teacher.grade\${grade}\${className}@school.com\`;
          const teacherId = \`teacher_\${grade}\${className}_\${Date.now()}\`;
          
          await db.ref(\`users/\${teacherId}\`).set({
            email: teacherEmail,
            role: "teacher",
            grade: grade,
            class: className
          });
          
          console.log(\`Created teacher for Grade \${grade}\${className}\`);
          
          // Create students for this class
          for (let i = 0; i < 12; i++) {
            const studentName = names[i % names.length];
            const formattedIndex = \`\${grade}\${className}\${(i+1).toString().padStart(3, '0')}\`;
            
            await db.ref(\`students/grade\${grade}\${className}\`).push().set({
              name: studentName,
              index: formattedIndex
            });
          }
          
          console.log(\`Added 12 students to Grade \${grade}\${className}\`);
        }
      }
      
      console.log("Sample data generation completed!");
      return true;
    } catch (error) {
      console.error("Error:", error);
      return false;
    }
  };
  
  // Run the function
  generateSampleData();
  `;
  
  console.log("Copy and paste the following code into your browser console:");
  console.log(script);
  
  return script;
};

// Also expose the simplified version
window.getSimplifiedScript = generateSampleData; 