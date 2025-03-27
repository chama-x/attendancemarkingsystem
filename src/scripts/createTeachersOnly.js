// This script will ONLY create teachers for grades 1, 5, 10, and 12
// Copy and paste the entire content into your browser console

const createTeachersOnly = async () => {
  console.log("Starting to create teachers for grades 1, 5, 10, and 12...");
  
  try {
    // Get database reference
    const db = firebase.database();
    
    // Grades and classes to generate
    const grades = [1, 5, 10, 12];
    const classes = ["A", "B", "C"];
    
    // Create teachers for each grade and class
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
        
        // Wait a small amount of time to ensure unique IDs
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log("\nTeacher Creation Summary:");
    console.log(`- Created ${grades.length * classes.length} teachers`);
    console.log("Teacher emails follow the pattern: teacher.grade{grade}{class}@school.com");
    console.log("Example: teacher.grade1A@school.com");
    
    return true;
  } catch (error) {
    console.error("Error creating teachers:", error);
    return false;
  }
};

// Run the function
createTeachersOnly().then(result => {
  if (result) {
    console.log("✅ Teacher creation completed successfully!");
  } else {
    console.log("❌ Teacher creation failed. See errors above.");
  }
}); 