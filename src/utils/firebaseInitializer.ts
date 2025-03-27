import { ref, get, set } from "firebase/database";
import { database } from "../firebaseConfig";
import { createAdminUser } from "../scripts/initializeAdmin";

/**
 * Initializes the Firebase database with sample data if it doesn't exist
 */
export async function initializeFirebaseData() {
  try {
    // Create admin user if it doesn't exist
    await createAdminUser("admin@school.com", "admin123");
    
    // Check if we already have data
    const usersRef = ref(database, "users");
    const usersSnapshot = await get(usersRef);
    
    if (usersSnapshot.exists()) {
      const usersData = usersSnapshot.val();
      const teachersExist = Object.values(usersData).some((user: any) => user.role === "teacher");
      
      if (teachersExist) {
        console.log("Firebase data already initialized.");
        return;
      }
    }
    
    // Initialize demo data (optional)
    // For a production app, this would be done through the UI
    // This is just for demo purposes
    
    // Let's check for students data as well
    const studentsRef = ref(database, "students");
    const studentsSnapshot = await get(studentsRef);
    
    if (!studentsSnapshot.exists()) {
      // This is just demo data creation
      // In a real app, this would be done through the UI
      await set(ref(database, "students/grade10A"), {
        "student1": { name: "Nimali Silva" },
        "student2": { name: "Saman Fernando" }
      });
      
      // Add some sample attendance data
      const today = new Date().toISOString().split('T')[0];
      await set(ref(database, `attendance/grade10A/${today}`), {
        "student1": true,
        "student2": false
      });
      
      console.log("Sample student and attendance data initialized.");
    }
    
    console.log("Firebase initialization completed.");
  } catch (error) {
    console.error("Error initializing Firebase data:", error);
  }
} 