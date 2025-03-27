// Sample Data Generators for the School Attendance System
// This file serves as a central hub for all data generation scripts

// Import sample data generator functions
import { addSampleStudents, generateSampleData } from './sampleDataGenerator';
import { bulkGenerateSampleData, getSimplifiedScript } from './bulkSampleGenerator';

// Export all generators 
export {
  addSampleStudents,
  generateSampleData,
  bulkGenerateSampleData,
  getSimplifiedScript
};

// Console message for when this script is directly loaded
console.log('===== Sample Data Generators Loaded =====');
console.log('Available methods:');
console.log('- addSampleStudents(grade, className, count) - Add students to a specific class');
console.log('- generateSampleData() - Generate sample data for multiple classes');
console.log('- bulkGenerateSampleData() - Create teachers and students for grades 1, 5, 10, and 12');
console.log('');
console.log('For direct console use, see the files in src/scripts/');

/**
 * For easier console usage, you can copy and paste from the following scripts:
 * 
 * 1. For bulk generation of teachers and students (grades 1, 5, 10, 12):
 *    src/scripts/consoleSampleGenerator.js
 * 
 * 2. For adding individual students to a specific class:
 *    src/scripts/sampleDataGenerator.ts -> Student section
 */ 