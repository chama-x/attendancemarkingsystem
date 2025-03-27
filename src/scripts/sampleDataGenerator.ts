import { ref, set, push } from "firebase/database";
import { database } from "../firebaseConfig";

// Sample data for student names and indices
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

/**
 * Adds sample students to a class
 * @param grade Grade level (number)
 * @param className Class name (A, B, etc)
 * @param count Number of students to add
 */
export const addSampleStudents = async (grade: number, className: string, count: number = 3) => {
  try {
    const studentsRef = ref(database, `students/grade${grade}${className}`);
    
    // Generate an offset to get different students for different classes
    const offset = ((grade % 4) * 3 + (className.charCodeAt(0) - 65) * 3) % sampleStudentData.length;
    
    // Add students
    for (let i = 0; i < count; i++) {
      const studentIndex = (offset + i) % sampleStudentData.length;
      const student = sampleStudentData[studentIndex];
      
      // Customize the index for the grade and class
      const customIndex = `${grade}${className}${student.index.substring(4)}`;
      
      await push(studentsRef, {
        name: student.name,
        index: customIndex
      });
    }
    
    console.log(`Added ${count} sample students to Grade ${grade}${className}`);
    return true;
  } catch (error) {
    console.error("Error adding sample students:", error);
    return false;
  }
};

/**
 * Generate sample students for multiple classes
 * @param grades Array of grades
 * @param classes Array of class names
 * @param studentsPerClass Number of students per class
 */
export const generateSampleData = async (
  grades: number[] = [10, 11, 12, 13],
  classes: string[] = ["A", "B", "C"],
  studentsPerClass: number = 3
) => {
  console.log("Starting sample data generation...");
  
  for (const grade of grades) {
    for (const className of classes) {
      await addSampleStudents(grade, className, studentsPerClass);
    }
  }
  
  console.log("Sample data generation completed!");
};

// This function can be exported to run in the browser console
export const consoleSampleDataGenerator = () => {
  const script = `
  // Function to add sample students
  const addSampleStudents = async (grade, className, count = 3) => {
    try {
      const db = firebase.database();
      const studentsRef = db.ref(\`students/grade\${grade}\${className}\`);
      
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
      
      // Generate an offset to get different students for different classes
      const offset = ((grade % 4) * 3 + (className.charCodeAt(0) - 65) * 3) % sampleStudentData.length;
      
      // Add students
      for (let i = 0; i < count; i++) {
        const studentIndex = (offset + i) % sampleStudentData.length;
        const student = sampleStudentData[studentIndex];
        
        // Customize the index for the grade and class
        const customIndex = \`\${grade}\${className}\${student.index.substring(4)}\`;
        
        await studentsRef.push({
          name: student.name,
          index: customIndex
        });
      }
      
      console.log(\`Added \${count} sample students to Grade \${grade}\${className}\`);
      return true;
    } catch (error) {
      console.error("Error adding sample students:", error);
      return false;
    }
  };

  // Function to generate sample data for multiple classes
  const generateSampleData = async (
    grades = [10, 11, 12, 13],
    classes = ["A", "B", "C"],
    studentsPerClass = 3
  ) => {
    console.log("Starting sample data generation...");
    
    for (const grade of grades) {
      for (const className of classes) {
        await addSampleStudents(grade, className, studentsPerClass);
      }
    }
    
    console.log("Sample data generation completed!");
  };

  // Run the generator
  generateSampleData();
  `;
  
  console.log("Copy and paste the following code into your Chrome console when on the app page:");
  console.log(script);
  
  return script;
}; 