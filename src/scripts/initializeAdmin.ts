import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set, get } from "firebase/database";
import { auth, database } from "../firebaseConfig";

/**
 * This script will create an admin user in Firebase Authentication
 * and add the user to the Realtime Database with admin role.
 * 
 * NOTE: This should only be run once to set up the initial admin.
 */
export async function createAdminUser(email: string, password: string) {
  try {
    // Check if admin already exists in database
    const usersRef = ref(database, "users");
    const usersSnapshot = await get(usersRef);
    
    if (usersSnapshot.exists()) {
      const usersData = usersSnapshot.val();
      const admins = Object.values(usersData).filter((user: any) => user.role === "admin");
      
      if (admins.length > 0) {
        console.log("Admin user already exists. No need to create another.");
        return;
      }
    }
    
    // Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Add admin role to user in database
    await set(ref(database, `users/${user.uid}`), {
      role: "admin",
      email: email,
    });
    
    console.log("Admin user created successfully!");
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
}

// Example: uncomment and call this function once to create an admin
// createAdminUser("admin@school.lk", "admin123"); 