// Migration script for attendance data
// Copy and paste this into the browser console

const migrateAttendanceData = async () => {
  console.log("Starting attendance data migration...");
  
  // Helper function to get a reference to the database
  const getDatabase = () => {
    if (typeof firebase !== 'undefined' && firebase.database) {
      return firebase.database();
    } else if (window.firebase && window.firebase.database) {
      return window.firebase.database();
    } else {
      throw new Error("Firebase database not found");
    }
  };
  
  try {
    const db = getDatabase();
    
    // Step 1: Find all grades and classes that have attendance records
    const attendanceRef = db.ref('attendance');
    const snapshot = await attendanceRef.once('value');
    const data = snapshot.val() || {};
    
    // Keep track of migration status
    const migrationStatus = {
      total: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0
    };
    
    // Step 2: For each grade/class, find all dates with attendance records
    for (const gradeKey in data) {
      // Skip if it's not a grade (numeric) key
      if (!/^\d+$/.test(gradeKey)) continue;
      
      const grade = parseInt(gradeKey);
      const classes = data[grade];
      
      for (const className in classes) {
        console.log(`Processing Grade ${grade}${className}...`);
        const dates = classes[className];
        
        for (const date in dates) {
          migrationStatus.total++;
          console.log(`  Migrating data for ${date}...`);
          
          try {
            // Get the attendance data for this date
            const dateData = dates[date];
            
            // Skip if already migrated or not valid
            if (!dateData) {
              console.log(`  Skipped ${date}: No data found`);
              migrationStatus.skipped++;
              continue;
            }
            
            // Check if data exists in new format
            const newPathRef = db.ref(`attendance/grade${grade}${className}/${date}`);
            const newPathSnapshot = await newPathRef.once('value');
            
            if (newPathSnapshot.exists()) {
              console.log(`  Skipped ${date}: Already migrated`);
              migrationStatus.skipped++;
              continue;
            }
            
            // Step 3: Get students for this grade/class
            const studentsRef = db.ref(`students/grade${grade}${className}`);
            const studentsSnapshot = await studentsRef.once('value');
            const studentsData = studentsSnapshot.val() || {};
            
            // Convert students to a usable format
            const students = Object.entries(studentsData).map(([id, data]) => ({
              id,
              name: data.name,
              index: data.index || ''
            }));
            
            // Step 4: Prepare the new format data
            const newFormatData = {};
            
            for (const studentId in dateData) {
              const oldStatus = dateData[studentId];
              const student = students.find(s => s.id === studentId);
              
              if (student) {
                // Convert boolean status to string format
                const status = typeof oldStatus === 'boolean' 
                  ? (oldStatus ? 'present' : 'absent') 
                  : (oldStatus.status || 'unknown');
                
                newFormatData[studentId] = {
                  studentName: student.name,
                  studentIndex: student.index,
                  status: status,
                  timestamp: new Date().getTime()
                };
              }
            }
            
            // Step 5: Save to new format path
            await newPathRef.set(newFormatData);
            console.log(`  ✅ Migrated ${date} successfully`);
            migrationStatus.succeeded++;
            
          } catch (error) {
            console.error(`  ❌ Error migrating ${date}:`, error);
            migrationStatus.failed++;
          }
        }
      }
    }
    
    console.log("\nMigration Summary:");
    console.log(`Total records: ${migrationStatus.total}`);
    console.log(`Successfully migrated: ${migrationStatus.succeeded}`);
    console.log(`Failed: ${migrationStatus.failed}`);
    console.log(`Skipped (already migrated): ${migrationStatus.skipped}`);
    
  } catch (error) {
    console.error("Migration failed:", error);
  }
};

// Add a function to run on demand
window.migrateAttendanceData = migrateAttendanceData;
console.log("Migration script loaded. Run migrateAttendanceData() to start migration.");

// Uncomment to run immediately:
// migrateAttendanceData(); 