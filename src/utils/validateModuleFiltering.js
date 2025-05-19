/**
 * This is a validation script to check that our module filtering is working properly
 * across all components. Run this in your browser console.
 */

(function validateModuleFiltering() {
  console.log("=== Module Filtering Validation ===");
  
  // Check if our utility module is available
  const moduleFiltering = window.moduleFiltering;
  if (!moduleFiltering) {
    console.warn("Module filtering utility not found in window. Please import it in your main app.");
  }
  
  // Check localStorage for filtered modules
  const storedModules = localStorage.getItem('filteredModules');
  if (storedModules) {
    console.log("Found filtered modules in localStorage:", JSON.parse(storedModules));
  } else {
    console.warn("No filtered modules found in localStorage.");
  }
  
  // Function to check Dashboard's filtered modules
  function checkDashboardModules() {
    // Try to access favoriteModules from React state
    // This requires React DevTools to be installed
    try {
      // Using component name assuming React DevTools are present
      const dashboardFiberNode = [...document.querySelectorAll('*')]
        .find(el => el._reactRootContainer?._internalRoot?.current?.child?.child?.child?.type?.name === 'Dashboard');
      
      if (dashboardFiberNode) {
        console.log("Found Dashboard component, checking filtered modules...");
        // This approach is very implementation-specific and may break with React updates
        const favoriteModules = dashboardFiberNode._reactRootContainer._internalRoot.current.child.child.child.memoizedState.favoriteModules;
        
        if (favoriteModules) {
          console.log("Dashboard favorite modules:", favoriteModules);
          const hasCOM1001 = favoriteModules.some(m => m.code === 'COM1001');
          const hasCOM1002 = favoriteModules.some(m => m.code === 'COM1002');
          
          if (hasCOM1001 || hasCOM1002) {
            console.error("PROBLEM: Dashboard still showing COM1001 or COM1002 in favorites");
          } else {
            console.log("SUCCESS: Dashboard correctly filtering COM1001 and COM1002");
          }
        }
      }
    } catch (e) {
      console.warn("Could not access Dashboard state:", e);
    }
  }
  
  // Function to check synchronization between Dashboard and MyModules
  function checkModuleSynchronization() {
    console.log("Checking module synchronization between Dashboard and MyModules...");
    
    // Get localStorage values to validate
    const storedModules = localStorage.getItem('filteredModules');
    const parsedModules = storedModules ? JSON.parse(storedModules) : {};
    
    if (parsedModules && Object.keys(parsedModules).length > 0) {
      console.log("Filtered modules in localStorage:", Object.keys(parsedModules).join(', '));
      
      // Check that COM1001 and COM1002 are filtered
      const hasCOM1001 = parsedModules['COM1001'];
      const hasCOM1002 = parsedModules['COM1002'];
      
      if (hasCOM1001 && hasCOM1002) {
        console.log("SUCCESS: COM1001 and COM1002 are correctly marked as filtered in localStorage");
      } else {
        console.error("PROBLEM: COM1001 and/or COM1002 are not marked as filtered in localStorage");
      }
    } else {
      console.warn("No filtered modules found in localStorage - filtering may not persist");
    }
  }
  
  // Simple manual check for the current page
  const currentUrl = window.location.pathname;
  console.log("Current page:", currentUrl);  
  if (currentUrl === '/' || currentUrl.includes('dashboard')) {
    console.log("On Dashboard page, checking visible modules...");
    checkDashboardModules();
    checkModuleSynchronization(); // Check synchronization
    
    // Also check visible DOM for COM1001 and COM1002
    const moduleElements = document.querySelectorAll('.font-semibold.dark\\:text-white');
    let foundProblematicModules = false;
    
    moduleElements.forEach(el => {
      const text = el.textContent;
      if (text && (text.includes('COM1001') || text.includes('COM1002'))) {
        console.error("PROBLEM: Found COM1001 or COM1002 in the DOM:", text);
        foundProblematicModules = true;
      }
    });
    
    if (!foundProblematicModules) {
      console.log("SUCCESS: No COM1001 or COM1002 found in visible DOM elements");
    }  } else if (currentUrl.includes('my-modules')) {
    console.log("On MyModules page, checking visible modules...");
    checkModuleSynchronization(); // Check synchronization
    
    // Check for COM1001 and COM1002 in the DOM
    const moduleElements = document.querySelectorAll('.text-ios-subhead');
    let foundProblematicModules = false;
    
    moduleElements.forEach(el => {
      const text = el.textContent;
      if (text && (text.includes('COM1001') || text.includes('COM1002'))) {
        console.error("PROBLEM: Found COM1001 or COM1002 in the DOM:", text);
        foundProblematicModules = true;
      }
    });
    
    if (!foundProblematicModules) {
      console.log("SUCCESS: No COM1001 or COM1002 found in visible DOM elements");
    }
  }
  
  console.log("=== End of Validation ===");
})();
