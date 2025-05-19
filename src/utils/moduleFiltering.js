/**
 * Utility functions for handling module filtering consistently across the app
 */

/**
 * List of modules that should always be filtered out
 */
export const ALWAYS_FILTERED_MODULES = ['COM1001', 'COM1002'];

/**
 * Check if a module should be filtered out
 * @param {string} moduleCode - The module code to check
 * @returns {boolean} - True if the module should be filtered out
 */
export function shouldFilterModule(moduleCode) {
  // Check against our always-filtered module list
  return ALWAYS_FILTERED_MODULES.includes(moduleCode);
}

/**
 * Filter a list of modules based on the filtering rules
 * @param {Array} modules - Array of module objects with 'code' property
 * @param {string} majorCode - Optional major code to check for module relevance
 * @returns {Array} - Filtered array of modules
 */
export function applyModuleFiltering(modules, majorCode = null) {
  if (!modules || !Array.isArray(modules)) {
    return [];
  }
  
  return modules.filter(module => {
    // Always filter out COM1001 and COM1002
    if (shouldFilterModule(module.code)) {
      return false;
    }
    
    // If we have a major code, also filter COM modules that aren't for this major
    if (majorCode && module.code.startsWith('COM')) {
      // Check if the COM module belongs to this major
      const belongsToMajor = module.programs && 
        Array.isArray(module.programs) && 
        module.programs.includes(majorCode);
      
      if (!belongsToMajor) {
        console.log(`Filtering out COM module ${module.code} that has no association to major ${majorCode}`);
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Save filtered modules to localStorage to persist across sessions
 * @param {Object} filteredModules - Object with module codes as keys
 */
export function saveFilteredModulesToStorage(filteredModules) {
  try {
    localStorage.setItem('filteredModules', JSON.stringify(filteredModules));
  } catch (error) {
    console.error('Failed to save filtered modules to storage:', error);
  }
}

/**
 * Load filtered modules from localStorage
 * @returns {Object} - Object with module codes as keys
 */
export function loadFilteredModulesFromStorage() {
  try {
    // Get existing filtered modules
    const stored = localStorage.getItem('filteredModules');
    const filteredModules = stored ? JSON.parse(stored) : {};
    
    // Always ensure our default filtered modules are included
    ALWAYS_FILTERED_MODULES.forEach(moduleCode => {
      filteredModules[moduleCode] = true;
    });
    
    return filteredModules;
  } catch (error) {
    console.error('Failed to load filtered modules from storage:', error);
    
    // Return default filter settings on error
    const defaultFilters = {};
    ALWAYS_FILTERED_MODULES.forEach(moduleCode => {
      defaultFilters[moduleCode] = true;
    });
    
    return defaultFilters;
  }
}
