// Copy and paste the ENTIRE content of this file into your browser console
// when logged in as admin to generate sample data for grades 1, 5, 10, and 12

// Simple function to generate teachers and students
const generateSampleData = async () => {
  console.log("Starting sample data generation...");
  
  try {
    // Get database reference
    const db = firebase.database();
    
    // Grades and classes to generate
    const grades = [1, 5, 10, 12];
    const classes = ["A", "B", "C"];
    
    // Sample student data
    const students = [
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
      { name: "Ajith Kumara", index: "012" }
    ];
    
    // Create teachers and students for each grade and class
    for (const grade of grades) {
      for (const className of classes) {
        // Create teacher
        const teacherEmail = `teacher.grade${grade}${className}@school.com`;
        const teacherId = `teacher_${grade}${className}_${Date.now()}`;
        
        await db.ref(`users/${teacherId}`).set({
          email: teacherEmail,
          role: "teacher",
          grade: grade,
          class: className
        });
        
        console.log(`Created teacher for Grade ${grade}${className}: ${teacherEmail}`);
        
        // Create students for this class
        for (let i = 0; i < 12; i++) {
          const student = students[i % students.length];
          const formattedIndex = `${grade}${className}${student.index}`;
          
          await db.ref(`students/grade${grade}${className}`).push().set({
            name: student.name,
            index: formattedIndex
          });
        }
        
        console.log(`Added 12 students to Grade ${grade}${className}`);
      }
    }
    
    console.log("\nSample Data Generation Summary:");
    console.log(`- Created 12 teachers for grades 1, 5, 10, 12`);
    console.log(`- Created 144 students (12 students in each of 12 classes)`);
    console.log("Sample data generation completed successfully!");
    
    return true;
  } catch (error) {
    console.error("Error generating sample data:", error);
    return false;
  }
};

// Run the function
generateSampleData(); 