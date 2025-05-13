import catalogueData from '../surrey_catalogue.json';
import { ref, set } from 'firebase/database';
import { database } from '../firebase';

/**
 * Transforms surrey_catalogue.json data into separate departments, majors, and modules arrays
 * to match the app's existing data structure
 */
const transformCatalogueData = () => {
  // Initialize the output objects
  const departments = [];
  const majors = [];
  const modules = [];
  
  // Keep track of unique module codes
  const moduleCodeTracker = new Set();
  // Keep track of department codes we generate
  const departmentCodeMap = {};
  let departmentCodeCounter = 1;
  
  // Iterate through each faculty
  Object.entries(catalogueData).forEach(([facultyName, facultyData], facultyIndex) => {
    // Skip "Uncategorized Faculty"
    if (facultyName === "Uncategorized Faculty") return;
    
    // Create faculty code from first letter of each word
    const facultyCode = facultyName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase();
    
    const facultyObj = {
      code: facultyCode,
      name: facultyName,
      departments: []
    };
    
    // Iterate through each department in faculty
    Object.entries(facultyData).forEach(([departmentName, departmentData]) => {
      // Skip "Uncategorized School"
      if (departmentName === "Uncategorized School") return;
      
      // Create department code or use existing if available
      let departmentCode;
      if (departmentCodeMap[departmentName]) {
        departmentCode = departmentCodeMap[departmentName];
      } else {
        // Get the first letters of words or use a sequential code
        departmentCode = departmentName
          .split(' ')
          .map(word => word.charAt(0))
          .join('')
          .toUpperCase();
        
        // Ensure code is unique by appending a number if needed
        if (departmentCodeMap[departmentCode]) {
          departmentCode = `DEPT${departmentCodeCounter++}`;
        }
        
        departmentCodeMap[departmentName] = departmentCode;
      }
      
      facultyObj.departments.push({
        code: departmentCode,
        name: departmentName
      });
      
      // Iterate through each program/major in department
      Object.entries(departmentData).forEach(([programName, programModules]) => {
        // Extract the program code from the name (e.g., "Program Name (CODE)")
        let programCode = "";
        const codeMatch = programName.match(/\(([^)]+)\)$/);
        if (codeMatch && codeMatch[1]) {
          programCode = codeMatch[1];
        } else {
          // Generate a code if none found
          programCode = `PROG${majors.length + 1}`;
        }
        
        // Clean up the program name by removing the code portion if present
        const cleanProgramName = programName.replace(/\s*\([^)]+\)$/, '').trim();
        
        // Add major to majors array
        majors.push({
          code: programCode,
          name: cleanProgramName,
          department: departmentCode,
          faculty: facultyCode
        });
        
        // Process modules for this program
        programModules.forEach((moduleData) => {
          const moduleCode = moduleData.module_code || `MOD${modules.length + 1}`;
          const moduleTitle = moduleData.module_title;
          
          // Only add module if we haven't seen this code before
          if (!moduleCodeTracker.has(moduleCode) && moduleTitle) {
            moduleCodeTracker.add(moduleCode);
            modules.push({
              code: moduleCode,
              name: moduleTitle,
              programs: [programCode]
            });
          } else if (moduleTitle) {
            // If module exists, add this program to its programs array
            const existingModule = modules.find(m => m.code === moduleCode);
            if (existingModule && !existingModule.programs.includes(programCode)) {
              existingModule.programs.push(programCode);
            }
          }
        });
      });
    });
    
    departments.push(facultyObj);
  });
  
  return {
    departments,
    majors, 
    modules
  };
};

// Add named export for associateModulesWithUser
export const associateModulesWithUser = async (userId, majorCode, modules) => {
    try {
        const majorModules = modules.filter(module => 
            module.programs && module.programs.includes(majorCode)
        );
        
        const modulesObject = {};
        majorModules.forEach(module => {
            modulesObject[module.code] = {
                addedAt: new Date().toISOString(),
                notes: ''
            };
        });
        
        if (Object.keys(modulesObject).length > 0) {
            const userModulesRef = ref(database, `users/${userId}/modules`);
            await set(userModulesRef, modulesObject);
            console.log(`Associated ${Object.keys(modulesObject).length} modules with user`);
        }
    } catch (error) {
        console.error("Error associating modules with user:", error);
    }
};

export default transformCatalogueData;