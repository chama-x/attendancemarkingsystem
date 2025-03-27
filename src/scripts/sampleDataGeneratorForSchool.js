// Sample Data Generator for Grades 1, 5, 10, 12
// Copy and paste this into your browser console

const generateSampleData = async () => {
  console.log("Starting to generate sample data for grades 1, 5, 10, 12...");

  // Check if Firebase is available
  if (typeof firebase === 'undefined') {
    console.error("Firebase not found. Make sure you're logged in and on the application page.");
    return;
  }

  const db = firebase.database();
  
  // Sample student names (Sri Lankan names)
  const studentNames = [
    "Amal Perera", "Kamala Silva", "Nimal Fernando", "Sunil Rajapaksa",
    "Dilshan Wijeratne", "Priyanka Jayawardena", "Kasun Mendis", "Shani Gunawardena",
    "Lalith Bandara", "Malini Seneviratne", "Tharushi Karunaratne", "Ajith Kumara",
    "Sampath Rathnayake", "Chaminda Vaas", "Dilrukshi Dias", "Hiruni Jayasuriya",
    "Chathura Seneviratne", "Nilmini Dissanayake", "Hasitha Gunathilaka", "Sachini Nipunika",
    "Dinesh Chandimal", "Sameera Liyanage", "Thilini Perera", "Sandun Weerakoon",
    "Mahela Fernando", "Achini Kulasooriya", "Kavinda Tissera", "Nipuni Weerasinghe",
    "Lasith Gamage", "Damith Asanka"
  ];
  
  // Define grades and classes
  const grades = [1, 5, 10, 12];
  const classes = ["A", "B", "C"];
  
  // Track progress
  const progress = {
    teachersAdded: 0,
    studentsAdded: 0,
    errors: 0
  };

  // 1. Generate Teachers
  console.log("Generating teachers...");
  for (const grade of grades) {
    for (const className of classes) {
      try {
        const teacherEmail = `teacher.grade${grade}${className}@school.com`;
        const teacherData = {
          email: teacherEmail,
          role: "teacher",
          grade: grade,
          class: className
        };
        
        // Generate a unique key for the teacher
        const teacherKey = `teacher_grade${grade}${className}_${Date.now()}`;
        await db.ref(`users/${teacherKey}`).set(teacherData);
        
        console.log(`✅ Added teacher for Grade ${grade}${className}: ${teacherEmail}`);
        progress.teachersAdded++;
      } catch (error) {
        console.error(`❌ Error adding teacher for Grade ${grade}${className}:`, error);
        progress.errors++;
      }
    }
  }

  // 2. Generate Students
  console.log("\nGenerating students...");
  for (const grade of grades) {
    for (const className of classes) {
      try {
        // Reference to the grade-class
        const classRef = db.ref(`students/grade${grade}${className}`);
        
        // Add 5 students to this class
        for (let i = 1; i <= 5; i++) {
          // Pick a random name from the list
          const randomIndex = Math.floor(Math.random() * studentNames.length);
          const studentName = studentNames[randomIndex];
          
          // Generate a student index (e.g., 01A001 for Grade 1 Class A Student 1)
          const paddedGrade = grade.toString().padStart(2, '0');
          const paddedIndex = i.toString().padStart(3, '0');
          const studentIndex = `${paddedGrade}${className}${paddedIndex}`;
          
          // Student data
          const studentData = {
            name: studentName,
            index: studentIndex
          };
          
          // Create student record
          await classRef.push(studentData);
          progress.studentsAdded++;
        }
        
        console.log(`✅ Added 5 students to Grade ${grade}${className}`);
      } catch (error) {
        console.error(`❌ Error adding students to Grade ${grade}${className}:`, error);
        progress.errors++;
      }
    }
  }

  // Summary
  console.log("\n----- SUMMARY -----");
  console.log(`Teachers added: ${progress.teachersAdded} (expected: ${grades.length * classes.length})`);
  console.log(`Students added: ${progress.studentsAdded} (expected: ${grades.length * classes.length * 5})`);
  if (progress.errors > 0) {
    console.log(`Errors encountered: ${progress.errors}`);
  } else {
    console.log("All data generated successfully! ✨");
  }
};

// Make it available globally for ease of use
window.generateSampleData = generateSampleData;

console.log("Sample data generator loaded.");
console.log("Run generateSampleData() to create sample teachers and students.");
console.log("This will create:");
console.log("- 12 teachers (one for each combination of grades 1,5,10,12 and classes A,B,C)");
console.log("- 60 students (5 per class across all grade/class combinations)"); 