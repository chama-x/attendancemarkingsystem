// Minimal Sample Data Generator for Grades 1, 5, 10, 12
// Copy and paste this entire script into your browser console while logged into the app

(async function() {
  console.log("🚀 Starting to generate sample data for grades 1, 5, 10, 12...");

  // Check if Firebase is available
  if (typeof firebase === 'undefined') {
    console.error("❌ Firebase not found. Make sure you're logged in and on the application page.");
    return;
  }

  const db = firebase.database();
  const studentNames = ["Amal Perera", "Kamala Silva", "Nimal Fernando", "Sunil Rajapaksa", "Dilshan Wijeratne", "Priyanka Jayawardena", "Kasun Mendis", "Shani Gunawardena", "Lalith Bandara", "Malini Seneviratne", "Tharushi Karunaratne", "Ajith Kumara", "Sampath Rathnayake", "Chaminda Vaas", "Dilrukshi Dias", "Hiruni Jayasuriya", "Chathura Seneviratne", "Nilmini Dissanayake", "Hasitha Gunathilaka", "Sachini Nipunika", "Dinesh Chandimal", "Sameera Liyanage", "Thilini Perera", "Sandun Weerakoon", "Mahela Fernando", "Achini Kulasooriya", "Kavinda Tissera", "Nipuni Weerasinghe", "Lasith Gamage", "Damith Asanka"];
  const grades = [1, 5, 10, 12];
  const classes = ["A", "B", "C"];
  
  let teachersAdded = 0, studentsAdded = 0, errors = 0;

  // 1. Generate Teachers
  console.log("👨‍🏫 Generating teachers...");
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
        
        const teacherKey = `teacher_grade${grade}${className}_${Date.now()}`;
        await db.ref(`users/${teacherKey}`).set(teacherData);
        
        console.log(`✅ Added teacher for Grade ${grade}${className}: ${teacherEmail}`);
        teachersAdded++;
      } catch (error) {
        console.error(`❌ Error adding teacher for Grade ${grade}${className}:`, error);
        errors++;
      }
    }
  }

  // 2. Generate Students
  console.log("\n👨‍🎓 Generating students...");
  for (const grade of grades) {
    for (const className of classes) {
      try {
        const classRef = db.ref(`students/grade${grade}${className}`);
        
        for (let i = 1; i <= 5; i++) {
          const randomIndex = Math.floor(Math.random() * studentNames.length);
          const studentName = studentNames[randomIndex];
          
          const paddedGrade = grade.toString().padStart(2, '0');
          const paddedIndex = i.toString().padStart(3, '0');
          const studentIndex = `${paddedGrade}${className}${paddedIndex}`;
          
          await classRef.push({
            name: studentName,
            index: studentIndex
          });
          studentsAdded++;
        }
        
        console.log(`✅ Added 5 students to Grade ${grade}${className}`);
      } catch (error) {
        console.error(`❌ Error adding students to Grade ${grade}${className}:`, error);
        errors++;
      }
    }
  }

  // Summary
  console.log("\n📊 ----- SUMMARY -----");
  console.log(`Teachers added: ${teachersAdded} (expected: ${grades.length * classes.length})`);
  console.log(`Students added: ${studentsAdded} (expected: ${grades.length * classes.length * 5})`);
  if (errors > 0) {
    console.log(`⚠️ Errors encountered: ${errors}`);
  } else {
    console.log("✨ All data generated successfully!");
  }
})(); 