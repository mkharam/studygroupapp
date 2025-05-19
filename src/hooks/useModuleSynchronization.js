import { useEffect, useState, useRef } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { database } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useMajorsModules } from '../context/MajorsModulesContext';

/**
 * Utility function to get a more descriptive name for a module
 * when the actual name isn't available
 * 
 * @param {string} moduleCode - The module code
 * @returns {string} - A descriptive name for the module
 */
const getDescriptiveModuleName = (moduleCode) => {
  const deptCode = moduleCode.substring(0, 3);
  const moduleNumber = moduleCode.substring(3);
  
  // Department name mapping
  const deptNames = {
    'COM': 'Computer Science',
    'MAN': 'Management',
    'ECO': 'Economics',
    'ENG': 'Engineering',
    'MAT': 'Mathematics',
    'PHY': 'Physics',
    'CHE': 'Chemistry',
    'BIO': 'Biology',
    'PSY': 'Psychology',
    'SOC': 'Sociology',
    'POL': 'Politics',
    'LAW': 'Law',
    'HIS': 'History',
    'LIT': 'Literature',
    'LAN': 'Languages',
    'MUS': 'Music',
    'ART': 'Art',
    'BUS': 'Business',
    'ACC': 'Accounting'
  };
  
  const deptName = deptNames[deptCode] || deptCode;
  return `${deptName} Module ${moduleNumber}`;
};

/**
 * Custom hook to handle module synchronization across components.
 * Ensures consistent filtering of COM1001 and COM1002 modules.
 * 
 * @param {Object} currentUser - The current user object
 * @param {Array} contextModules - Module data from context
 * @returns {Object} - Module data and helper functions
 */
const useModuleSynchronization = () => {
  const { currentUser } = useAuth();
  const { modules: contextModules } = useMajorsModules();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userModules, setUserModules] = useState([]);
  const [favoriteModules, setFavoriteModules] = useState([]);
  
  // Track filtered modules
  const filteredOutModuleRef = useRef({
    'COM1001': true,
    'COM1002': true
  });

  // Load modules from database
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const userModulesRef = ref(database, `users/${currentUser.uid}/modules`);
    
    // Set up listener for real-time updates
    const unsubscribe = onValue(userModulesRef, (snapshot) => {
      try {
        if (snapshot.exists()) {
          const modulesData = snapshot.val();
          console.log("Module sync: Module data loaded:", Object.keys(modulesData).length);
          
          // Apply consistent filtering
          const userModulesList = Object.entries(modulesData)
            .filter(([moduleCode]) => {
              // Always filter out COM1001 and COM1002
              if (moduleCode === 'COM1001' || moduleCode === 'COM1002') {
                console.log(`Module sync: Filtering out ${moduleCode}`);
                filteredOutModuleRef.current[moduleCode] = true;
                return false;
              }
              
              // Keep any modules that aren't explicitly filtered
              return !filteredOutModuleRef.current[moduleCode];
            })
            .map(([moduleCode, moduleData]) => {
              // Find module in the context
              const contextModule = contextModules?.find(m => m.code === moduleCode);              return {
                code: moduleCode,
                name: contextModule?.name || moduleCode,
                title: contextModule?.name || getDescriptiveModuleName(moduleCode),
                department: contextModule?.department || '',
                description: contextModule?.description || '',
                favorite: moduleData.favorite || false,
                addedAt: moduleData.addedAt,
                manuallyAdded: moduleData.manuallyAdded || false,
                fromOtherProgram: moduleData.fromOtherProgram || false,
              };
            });
          
          // Set all modules
          setUserModules(userModulesList);
          
          // Update favorite modules
          const favorites = userModulesList.filter(module => module.favorite === true);
          console.log("Module sync: Filtered favorite modules:", favorites.length);
          setFavoriteModules(favorites);
        } else {
          console.log("Module sync: No modules found for user");
          setUserModules([]);
          setFavoriteModules([]);
        }
      } catch (error) {
        console.error("Module sync: Error processing modules data:", error);
        setError("Failed to load modules");
      } finally {
        setLoading(false);
      }
    }, {
      onError: (error) => {
        console.error("Module sync: Error fetching modules:", error);
        setError("Failed to load modules");
        setLoading(false);
      }
    });
    
    // Clean up listener on unmount
    return () => unsubscribe();
  }, [currentUser, contextModules]);

  // Function to toggle favorite status
  const toggleFavorite = async (moduleCode, currentStatus) => {
    if (!currentUser) return;
    
    try {
      // Update in Firebase
      const moduleRef = ref(database, `users/${currentUser.uid}/modules/${moduleCode}`);
      await update(moduleRef, {
        favorite: !currentStatus
      });
      
      console.log(`Module sync: Toggled favorite status for ${moduleCode} to ${!currentStatus}`);
      
      // Track filtered out modules so we don't show them even if they're favorited
      if (moduleCode === 'COM1001' || moduleCode === 'COM1002') {
        console.log(`Module sync: ${moduleCode} will remain filtered out despite favorite status`);
        filteredOutModuleRef.current[moduleCode] = true;
      }
      
      // The real-time listener will handle state updates
    } catch (error) {
      console.error("Module sync: Error updating favorite status:", error);
      setError("Failed to update favorite status");
    }
  };

  return {
    userModules,
    favoriteModules,
    loading,
    error,
    toggleFavorite,
    filteredOutModuleRef
  };
};

export default useModuleSynchronization;
