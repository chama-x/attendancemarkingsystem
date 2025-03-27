// This script will ONLY create students for grades 1, 5, 10, and 12
// Copy and paste the entire content into your browser console

const createStudentsOnly = async () => {
  console.log("Starting to create students for grades 1, 5, 10, and 12...");
  
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
    
    let totalStudents = 0;
    
    // Create students for each grade and class
    for (const grade of grades) {
      for (const className of classes) {
        console.log(`Adding students to Grade ${grade}${className}...`);
        const studentsRef = db.ref(`students/grade${grade}${className}`);
        
        // Add students to this class
        for (let i = 0; i < 12; i++) {
          const student = students[i % students.length];
          const formattedIndex = `${grade}${className}${student.index}`;
          
          await studentsRef.push().set({
            name: student.name,
            index: formattedIndex
          });
          
          totalStudents++;
        }
        
        console.log(`Added 12 students to Grade ${grade}${className}`);
      }
    }
    
    console.log("\nStudent Creation Summary:");
    console.log(`- Created ${totalStudents} students across ${grades.length * classes.length} classes`);
    console.log("Student indices follow the pattern: {grade}{class}{number}");
    console.log("Example: 1A001, 5B003, etc.");
    
    return true;
  } catch (error) {
    console.error("Error creating students:", error);
    return false;
  }
};

// Run the function
createStudentsOnly().then(result => {
  if (result) {
    console.log("✅ Student creation completed successfully!");
  } else {
    console.log("❌ Student creation failed. See errors above.");
  }
}); 