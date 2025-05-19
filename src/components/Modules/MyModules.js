import React, { useState, useEffect, useRef } from 'react';
import { ref, get } from 'firebase/database';
import { database, fetchGroupsByModule } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { useMajorsModules } from '../../context/MajorsModulesContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaPlus, FaGraduationCap, FaBook, FaArrowRight, FaUser, FaUserGraduate, FaStar, FaCheckCircle, FaTimes } from 'react-icons/fa';
// Import our module filtering utilities
import { shouldFilterModule, loadFilteredModulesFromStorage, saveFilteredModulesToStorage } from '../../utils/moduleFiltering';
import useModuleSynchronization from '../../hooks/useModuleSynchronization';

const MyModules = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { modules, loading: contextLoading } = useMajorsModules();
  
  // Use the module synchronization hook
  const { 
    userModules: syncedModules, 
    loading: syncLoading, 
    toggleFavorite: syncToggleFavorite,
    error: syncError
  } = useModuleSynchronization();
  
  const [userModules, setUserModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedModule, setExpandedModule] = useState(null);
  const [redirecting, setRedirecting] = useState(false);
  const [updatingFavorite, setUpdatingFavorite] = useState(false);
  const [showModuleImportMessage, setShowModuleImportMessage] = useState(false);
  const [profileLoadingAttempts, setProfileLoadingAttempts] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [lastToggledModule, setLastToggledModule] = useState(null);
  const [moduleGroups, setModuleGroups] = useState({});
  const [loadingGroups, setLoadingGroups] = useState({});
  
  // Add a ref to persist the registration state even after the location state is cleared
  // This ensures we never redirect to the profile page after a successful registration
  const fromRegistrationRef = useRef(false);
  const hasLoadedModulesRef = useRef(false);
  // Use our filtering utilities to track filtered modules
  const filteredOutModuleRef = useRef(loadFilteredModulesFromStorage());

  // Check for registration success from location state
  useEffect(() => {
    if ((location.state?.newRegistration && location.state?.showModuleImportSuccess) || 
        (location.state?.modulesImported && location.state?.fromRegistration)) {
      setShowModuleImportMessage(true);
      
      // Set our persistent flag to prevent any future redirects to profile page
      if (location.state?.fromRegistration) {
        console.log("Setting fromRegistrationRef to true - user just registered");
        fromRegistrationRef.current = true;
      }
      
      // Log module import stats if available
      if (location.state?.moduleStats) {
        console.log(`Modules imported: ${location.state.moduleStats.totalModules}`);
        console.log(`Favorite modules: ${location.state.moduleStats.favoriteModules}`);
      }
      
      // Clear the location state after a delay
      const timer = setTimeout(() => {
        navigate(location.pathname, { replace: true });
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [location, navigate]);
  // Check if user has modules or needs to set a major
  useEffect(() => {
    // Skip this check entirely if we're already redirecting
    if (redirecting) {
      return;
    }

    // Skip this check if we're still loading data or in registration flow
    if (loading || 
        contextLoading || 
        location.state?.newRegistration || 
        location.state?.modulesImported ||
        location.state?.fromRegistration ||
        fromRegistrationRef.current ||
        hasLoadedModulesRef.current) {
      console.log("Skipping redirect check due to loading state or registration state");
      return;
    }

    const checkUserModules = async () => {
      try {
        // If user profile is loaded 
        if (userProfile) {
          console.log("User profile loaded, checking for modules", userProfile.majorCode);
          
          // Check if the user already has modules (imported during registration)
          if (currentUser) {
            const userModulesRef = ref(database, `users/${currentUser.uid}/modules`);
            const snapshot = await get(userModulesRef);
            
            // We only redirect to profile if both conditions are true:
            // 1. No modules are found AND
            // 2. No major code is selected
            const hasModules = snapshot.exists() && Object.keys(snapshot.val()).length > 0;
            const hasMajor = userProfile.majorCode && userProfile.majorCode.trim() !== '';
            
            console.log(`Has modules: ${hasModules}, has major: ${hasMajor}`);
            
            if (hasModules) {
              // If user has modules, mark the flag so we don't check again
              hasLoadedModulesRef.current = true;
            }
            
            if (!hasModules && !hasMajor) {
              console.warn('No modules found and no major selected. Redirecting to profile page.');
              setRedirecting(true);
              const timer = setTimeout(() => {
                navigate('/profile', { state: { showMajorAlert: true, source: 'my-modules' } });
              }, 800); // Quick redirection since there's no content to show
              
              return () => clearTimeout(timer);
            }
          }
        } else if (!userProfile && currentUser && !fromRegistrationRef.current) {
          // Only check a limited number of times before giving up
          setProfileLoadingAttempts(prev => prev + 1);
          
          if (profileLoadingAttempts >= 3) {
            console.warn(`User profile still not loaded after ${profileLoadingAttempts} attempts. Stopping redirect checks.`);
            return;
          }
          
          // Don't redirect at all if we have location state from registration
          if (location.state?.fromRegistration || location.state?.modulesImported || location.state?.newRegistration) {
            console.log("Registration detected from location state, skipping profile redirect");
            fromRegistrationRef.current = true;
            return;
          }
          
          // Only redirect if the user is not coming from registration
          console.warn('User profile still not loaded. Waiting longer before redirect...');
            // Wait longer for profile to load before deciding to redirect
          const timer = setTimeout(() => {
            // Double-check we're not in registration flow before redirecting
            // Check multiple flags to ensure we NEVER redirect if coming from registration
            if (!userProfile && !fromRegistrationRef.current && 
                !location.state?.fromRegistration && 
                !location.state?.modulesImported && 
                !location.state?.newRegistration &&
                hasLoadedModulesRef.current === false) {
              console.warn('User profile still not loaded after waiting. Redirecting to profile page.');
              navigate('/profile', { state: { showMajorAlert: true } });
              setRedirecting(true);
            } else {
              console.log("Skipping profile redirect - registration detected or modules already loaded");
            }
          }, 6000); // Reduced timeout
          
          return () => clearTimeout(timer);
        }
      } catch (error) {
        console.error("Error checking user modules:", error);
      }
    };
    
    checkUserModules();
  }, [loading, contextLoading, userProfile, currentUser, navigate, redirecting, location, profileLoadingAttempts]);
  // This useEffect runs whenever the modules from context or currentUser changes
  useEffect(() => {
    const fetchUserModules = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }
      
      try {
        console.log("Fetching modules for user:", currentUser.uid);
        const userModulesRef = ref(database, `users/${currentUser.uid}/modules`);
        const userProfileRef = ref(database, `users/${currentUser.uid}`);
        
        // Get both user's modules and profile data in parallel
        const [moduleSnapshot, profileSnapshot] = await Promise.all([
          get(userModulesRef),
          get(userProfileRef)
        ]);
        
        // Get user's major code from profile
        const userMajor = profileSnapshot.exists() ? profileSnapshot.val().majorCode : null;
        
        if (moduleSnapshot.exists()) {
          // Get user's module data
          const modulesData = moduleSnapshot.val();
          console.log("Found user modules data:", Object.keys(modulesData).length);
          
          // If user has modules, mark our flag to prevent redirect checks
          if (Object.keys(modulesData).length > 0) {
            hasLoadedModulesRef.current = true;
          }
          
          // Match with module details from context
          if (modules && modules.length > 0) {
            console.log("Modules context data available, processing modules");              // Filter out COM modules that don't belong to the user's major
            // unless they were manually marked as favorites
            const filteredModuleCodes = Object.keys(modulesData).filter(moduleCode => {
              // Specifically filter out COM1001 and COM1002 as requested
              if (shouldFilterModule(moduleCode)) {
                console.log(`Explicitly filtering out ${moduleCode} as requested by user`);
                filteredOutModuleRef.current[moduleCode] = true;
                saveFilteredModulesToStorage(filteredOutModuleRef.current);
                return false;
              }
              
              // If it's already in our filtered list, keep it filtered out
              if (filteredOutModuleRef.current[moduleCode]) {
                console.log(`Keeping ${moduleCode} filtered out from previous settings`);
                return false;
              }
              
              // If it's not a COM module, keep it
              if (!moduleCode.startsWith('COM')) {
                return true;
              }
              
              // If the user has explicitly favorited this COM module, keep it
              if (modulesData[moduleCode].favorite === true) {
                return true;
              }
              
              // Find the module in the context data
              const contextModule = modules.find(m => m.code === moduleCode);
              
              // If we have context data for this module, check if it belongs to the user's major
              if (contextModule && contextModule.programs && Array.isArray(contextModule.programs)) {
                return contextModule.programs.includes(userMajor);
              }
              
              // If we don't have context data but the user manually added it, keep it
              if (modulesData[moduleCode].fromOtherProgram === true || 
                  modulesData[moduleCode].manuallyAdded === true) {
                return true;
              }
              
              // For COM modules with no context data that weren't manually selected, filter out
              console.log(`Filtering out COM module ${moduleCode} that doesn't belong to major ${userMajor}`);
              return false;
            });
            
            console.log(`Filtered out ${Object.keys(modulesData).length - filteredModuleCodes.length} irrelevant COM modules`);
            
            const userModuleDetails = filteredModuleCodes.map(moduleCode => {              const moduleDetail = modules.find(m => m.code === moduleCode);
              if (!moduleDetail) {
                // This handles the case where a module isn't found in the context data
                // For example, when a COM module is added but not in the modules list
                // Use console.info instead of warn to reduce console clutter
                if (process.env.NODE_ENV === 'development' && 
                    moduleCode !== 'COM1001' && 
                    moduleCode !== 'COM1002') {
                  console.info(`Creating placeholder for module: ${moduleCode}`);
                }
                
                // Create a more descriptive placeholder for the module
                return {
                  code: moduleCode,
                  name: moduleCode,
                  title: moduleCode.startsWith('COM') ? 
                    `Computer Science Module ${moduleCode.substring(3)}` : 
                    `Module ${moduleCode}`,
                  description: "Module details not available. This could be a COM module or a module that is not in the current database.",
                  userNotes: modulesData[moduleCode].notes || '',
                  addedAt: modulesData[moduleCode].addedAt,
                  favorite: modulesData[moduleCode].favorite || false,
                  manuallyAdded: modulesData[moduleCode].manuallyAdded || false,
                  fromOtherProgram: modulesData[moduleCode].fromOtherProgram || false,
                };
              }
              return {
                ...moduleDetail,
                userNotes: modulesData[moduleCode].notes || '',
                addedAt: modulesData[moduleCode].addedAt,
                favorite: modulesData[moduleCode].favorite || false, // Extract favorite status
                manuallyAdded: modulesData[moduleCode].manuallyAdded || false,
                fromOtherProgram: modulesData[moduleCode].fromOtherProgram || false,
              };
            }).filter(module => module !== null);
              console.log(`Processed ${userModuleDetails.length} modules with details`);
            
            // Sort modules - favorites first, then alphabetically by name
            userModuleDetails.sort((a, b) => {
              if (a.favorite && !b.favorite) return -1;
              if (!a.favorite && b.favorite) return 1;
              return a.code.localeCompare(b.code); // Use code instead of name for more consistent sorting
            });
            setUserModules(userModuleDetails);
          } else {
            console.log("No modules data available in context yet, creating basic module objects");
              // Filter out COM modules that don't belong to the user's major even when using basic objects
            const filteredModuleCodes = Object.keys(modulesData).filter(moduleCode => {
              // Specifically filter out COM1001 and COM1002 as requested
              if (moduleCode === 'COM1001' || moduleCode === 'COM1002') {
                console.log(`Explicitly filtering out ${moduleCode} as requested by user`);
                return false;
              }
              
              // If it's not a COM module, keep it
              if (!moduleCode.startsWith('COM')) {
                return true;
              }
              
              // If the user has explicitly favorited this COM module, keep it
              if (modulesData[moduleCode].favorite === true) {
                return true;
              }
              
              // If we have specific module metadata, use that to decide
              if (modulesData[moduleCode].belongsToMajor === true) {
                return true;
              }
              
              // If it was manually added or from other program, keep it
              if (modulesData[moduleCode].manuallyAdded === true || 
                  modulesData[moduleCode].fromOtherProgram === true) {
                return true;
              }
              
              // Otherwise, filter out COM modules with no explicit authorization
              console.log(`Filtering out COM module ${moduleCode} that has no clear association to major ${userMajor}`);
              return false;
            });
              // If context modules aren't loaded, create basic module objects from the user's data
            const basicModuleDetails = filteredModuleCodes.map(moduleCode => {
              // Try to find module details from context if available
              const contextModule = modules?.find(m => m.code === moduleCode);
              
              return {
                code: moduleCode,
                name: contextModule?.name || moduleCode,
                title: contextModule?.name || (moduleCode.startsWith('COM') ? 
                  `Computer Science Module ${moduleCode.substring(3)}` : 
                  `Module ${moduleCode}`),
                description: contextModule?.description || "Module details will be loaded when available.",
                userNotes: modulesData[moduleCode].notes || '',
                addedAt: modulesData[moduleCode].addedAt,
                favorite: modulesData[moduleCode].favorite || false,
                manuallyAdded: modulesData[moduleCode].manuallyAdded || false,
                fromOtherProgram: modulesData[moduleCode].fromOtherProgram || false,
              };
            });
            
            basicModuleDetails.sort((a, b) => {
              if (a.favorite && !b.favorite) return -1;
              if (!a.favorite && b.favorite) return 1;
              return a.code.localeCompare(b.code);
            });
            
            console.log(`Created ${basicModuleDetails.length} basic module objects`);
            setUserModules(basicModuleDetails);
          }
        } else {
          console.log("No modules found for this user");
          setUserModules([]);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user modules:", error);
        setLoading(false);
      }
    };
    
    // Always fetch modules if user is logged in
    if (currentUser) {
      console.log("Current user detected, fetching modules");
      
      // Force an immediate fetch when coming from registration
      if (location.state?.fromRegistration || location.state?.modulesImported) {
        console.log("Coming from registration, forcing immediate module fetch");
        fetchUserModules();
      } else {
        // Normal module fetch
        fetchUserModules();
      }
    } else {
      setLoading(false);
    }
  }, [currentUser, modules, location.state?.modulesImported, location.state?.fromRegistration]);
  // Update favorite count whenever modules change
  useEffect(() => {
    if (userModules.length > 0) {
      const count = userModules.filter(m => m.favorite).length;
      setFavoriteCount(count);
    }
  }, [userModules]);
  // Handle toggling favorite status
  const toggleFavorite = async (moduleCode, currentStatus) => {
    if (!currentUser || updatingFavorite) return;
    
    try {
      setUpdatingFavorite(true);
      setLastToggledModule(moduleCode);
      
      // Use the synchronized toggle favorite function
      await syncToggleFavorite(moduleCode, currentStatus);
      
      // Track filtered out modules so we don't show them even if they're favorited
      if (shouldFilterModule(moduleCode)) {
        console.log(`Module ${moduleCode} will remain filtered out despite favorite status`);
        filteredOutModuleRef.current[moduleCode] = true;
        saveFilteredModulesToStorage(filteredOutModuleRef.current);
      }
      
      // Clear the last toggled module after animation
      setTimeout(() => {
        setLastToggledModule(null);
      }, 1000);
      
    } catch (error) {
      console.error("Error updating favorite status:", error);
    } finally {
      setUpdatingFavorite(false);
    }
  };
  
  const handleAddModuleClick = () => {
    navigate('/modules');
  };
  
  const handleProfileClick = () => {
    navigate('/profile', { state: { section: 'academic' } });
  };
  
  const handleModuleClick = (moduleCode) => {
    if (expandedModule === moduleCode) {
      setExpandedModule(null);
    } else {
      setExpandedModule(moduleCode);
    }
  };

  const handleCreateGroupClick = (moduleCode) => {
    navigate(`/groups/create?moduleCode=${moduleCode}`);
  };

  // Update userModules with synced data
  useEffect(() => {
    if (syncedModules && syncedModules.length > 0) {
      console.log("MyModules: Updating modules from synchronized data", syncedModules);
      
      // Filter and sort modules to prioritize user's major modules
      const filteredAndSortedModules = syncedModules
        .filter(module => {
          // Skip COM modules unless they are explicitly for the user's major
          if (module.code.startsWith('COM')) {
            return module.programs?.includes(userProfile?.majorCode) && 
                   (module.majorSpecific === true || 
                    (module.departments && module.departments.includes(userProfile?.department)));
          }
          return true;
        })
        .sort((a, b) => {
          // Prioritize modules from user's major
          const aIsUserMajor = a.programs?.includes(userProfile?.majorCode);
          const bIsUserMajor = b.programs?.includes(userProfile?.majorCode);
          
          if (aIsUserMajor && !bIsUserMajor) return -1;
          if (!aIsUserMajor && bIsUserMajor) return 1;
          
          // Then sort by module code
          return a.code.localeCompare(b.code);
        });
      
      setUserModules(filteredAndSortedModules);
      hasLoadedModulesRef.current = true;
    }
    
    if (!syncLoading && loading) {
      console.log("MyModules: Modules synchronization complete, updating loading state");
      setLoading(false);
    }
    
    if (syncError) {
      console.error("MyModules: Sync error occurred:", syncError);
    }
  }, [syncedModules, syncLoading, syncError, loading, userProfile]);

  // Add validation for the synchronization
  useEffect(() => {
    // This will run once after modules are loaded
    if (userModules.length > 0) {
      console.log("MyModules: Validating that modules are synchronized correctly");
      console.log("MyModules: Current modules with favorite status:", 
        userModules.filter(m => m.favorite).map(m => m.code).join(', ')
      );
    }
  }, [userModules]);

  // Add new useEffect to fetch groups for modules
  useEffect(() => {
    const fetchGroupsForModules = async () => {
      if (!userModules.length) return;
      
      const groupsMap = {};
      const loadingMap = {};
      
      for (const module of userModules) {
        loadingMap[module.code] = true;
        setLoadingGroups(prev => ({ ...prev, [module.code]: true }));
        
        try {
          const groups = await fetchGroupsByModule(module.code);
          groupsMap[module.code] = groups;
        } catch (error) {
          console.error(`Error fetching groups for ${module.code}:`, error);
          groupsMap[module.code] = [];
        }
        
        loadingMap[module.code] = false;
        setLoadingGroups(prev => ({ ...prev, [module.code]: false }));
      }
      
      setModuleGroups(groupsMap);
    };
    
    fetchGroupsForModules();
  }, [userModules]);

  if (loading || contextLoading) {
    return (
      <div className="flex justify-center items-center h-screen dark:bg-ios-dark-bg transition-colors duration-200">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ios-blue dark:border-ios-teal"></div>
      </div>
    );
  }

  // Check if user has a major selected in their profile
  const noMajorSelected = !userProfile?.majorCode;

  // If we have modules loaded, don't show the major not selected view
  const shouldShowNoMajorView = noMajorSelected && userModules.length === 0;

  return (
    <div className="min-h-screen bg-ios-gray6 dark:bg-ios-dark-bg px-4 py-6 transition-colors duration-200">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-ios-largetitle font-sf-pro-display font-semibold text-black dark:text-ios-dark-text mb-2 transition-colors duration-200">
              My Modules
            </h1>
            <p className="text-ios-subhead text-ios-gray dark:text-ios-dark-text-secondary transition-colors duration-200">
              View and manage your enrolled modules
            </p>
          </div>
          {userModules.length > 0 && (
            <div className="flex items-center bg-white dark:bg-ios-dark-elevated px-4 py-2 rounded-full shadow-sm">
              <FaStar className="text-yellow-500 mr-2" />
              <span className="text-sm font-medium">
                {favoriteCount} {favoriteCount === 1 ? 'Favorite' : 'Favorites'}
              </span>
            </div>
          )}
        </div>
        
        {showModuleImportMessage && (
          <div className="bg-green-50 dark:bg-green-900 dark:bg-opacity-20 p-4 rounded-lg border border-green-200 dark:border-green-800 mb-6 animate-fadeIn">
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                <FaCheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                  Registration complete! Your modules have been successfully imported.
                </p>
                <p className="mt-1 text-sm text-green-700 dark:text-green-400">
                  {location.state?.moduleStats ? 
                    `${location.state.moduleStats.totalModules} modules imported, ${location.state.moduleStats.favoriteModules} marked as favorites.` : 
                    'Core modules and first-year courses have been automatically marked as favorites.'}
                </p>
                {location.state?.moduleStats?.manuallySelectedCount > 0 && (
                  <p className="mt-1 text-sm text-green-700 dark:text-green-400">
                    Including <span className="font-medium">{location.state.moduleStats.manuallySelectedCount} modules you personally selected</span> during registration.
                </p>
                )}
                <div className="mt-2 text-xs text-green-600 dark:text-green-500 grid grid-cols-2 gap-2">
                  <div className="flex items-center">
                    <FaBook className="mr-1" />
                    <span>Modules are ready for study groups</span>
                  </div>
                  <div className="flex items-center">
                    <FaStar className="mr-1" />
                    <span>Favorite modules appear at the top</span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-green-700 dark:text-green-400 italic">
                  You can add or remove modules from your favorites by using the star icon.
                </p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  type="button"
                  onClick={() => setShowModuleImportMessage(false)}
                  className="inline-flex text-green-500 hover:text-green-700 focus:outline-none"
                  aria-label="Dismiss message"
                >
                  <FaTimes className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
        
        {shouldShowNoMajorView ? (
          <div className="bg-white dark:bg-ios-dark-elevated rounded-ios shadow-sm border border-ios-gray5 dark:border-ios-dark-border p-6 text-center transition-colors duration-200">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-ios-blue bg-opacity-10 dark:bg-opacity-20 flex items-center justify-center mb-4 transition-colors duration-200">
                <FaUserGraduate className="text-ios-blue dark:text-ios-teal text-2xl transition-colors duration-200" />
              </div>
              <h2 className="text-ios-title2 font-sf-pro text-black dark:text-ios-dark-text mb-2 transition-colors duration-200">Major Not Selected</h2>
              <p className="text-ios-body text-ios-gray dark:text-ios-dark-text-secondary mb-6 transition-colors duration-200">
                Please select your major in your profile to see your relevant modules.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
                <button 
                  onClick={handleProfileClick}
                  className="ios-button flex items-center justify-center py-3 w-full"
                >
                  <FaUser className="mr-2" />
                  Update Your Profile
                </button>
                <button 
                  onClick={() => navigate('/academics?tab=majors')}
                  className="ios-button-secondary flex items-center justify-center py-3 w-full"
                >
                  <FaGraduationCap className="mr-2" />
                  Browse Majors
                </button>
              </div>
              {redirecting && (
                <p className="text-ios-footnote text-ios-blue dark:text-ios-teal mt-4 animate-pulse transition-colors duration-200">
                  Redirecting to profile page...
                </p>
              )}
            </div>
          </div>
        ) : userModules.length === 0 ? (
          <div className="bg-white dark:bg-ios-dark-elevated rounded-ios shadow-sm border border-ios-gray5 dark:border-ios-dark-border p-6 text-center transition-colors duration-200">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-ios-blue bg-opacity-10 dark:bg-opacity-20 flex items-center justify-center mb-4 transition-colors duration-200">
                <FaBook className="text-ios-blue dark:text-ios-teal text-2xl transition-colors duration-200" />
              </div>
              <h2 className="text-ios-title2 font-sf-pro text-black dark:text-ios-dark-text mb-2 transition-colors duration-200">No Modules Yet</h2>
              <p className="text-ios-body text-ios-gray dark:text-ios-dark-text-secondary mb-6 transition-colors duration-200">
                You haven't added any modules to your profile yet.
              </p>
              <button 
                onClick={handleAddModuleClick}
                className="ios-button-secondary flex items-center"
              >
                <FaPlus className="mr-2" />
                Browse Modules
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {userModules.map(module => (
              <div 
                key={module.code}
                className={`bg-white dark:bg-ios-dark-elevated rounded-ios shadow-sm border ${module.favorite ? 'border-yellow-400 dark:border-yellow-500' : 'border-ios-gray5 dark:border-ios-dark-border'} overflow-hidden transition-all duration-300 ${expandedModule === module.code ? 'shadow-md' : ''}`}
              >                <div className="flex justify-between items-center p-4">
                  <div 
                    onClick={() => handleModuleClick(module.code)}
                    className="flex items-center flex-1 cursor-pointer"
                  >
                    <div className={`w-10 h-10 rounded-full ${module.favorite ? 'bg-yellow-100 dark:bg-yellow-900 dark:bg-opacity-30' : 'bg-ios-blue bg-opacity-10 dark:bg-opacity-20'} flex items-center justify-center mr-4 transition-colors duration-200`}>
                      {module.favorite ? 
                        <FaStar className="text-yellow-500" /> : 
                        <FaGraduationCap className="text-ios-blue dark:text-ios-teal transition-colors duration-200" />
                      }
                    </div>
                    <div>                      <h3 className="text-ios-body font-medium text-black dark:text-ios-dark-text transition-colors duration-200">
                        {module.name || module.title || module.code}
                        {module.code.startsWith('COM') && (
                          <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-0.5 px-1.5 rounded">
                            CS
                          </span>
                        )}
                      </h3>
                      <p className="text-ios-subhead text-ios-gray dark:text-ios-dark-text-secondary transition-colors duration-200">
                        {module.code}
                        {module.manuallyAdded && (
                          <span className="ml-2 text-xs text-blue-500 dark:text-blue-400">
                            (Manually Added)
                          </span>
                        )}
                        {module.fromOtherProgram && (
                          <span className="ml-2 text-xs text-purple-500 dark:text-purple-400">
                            (Elective)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <button 
                      onClick={() => toggleFavorite(module.code, module.favorite)}
                      className={`mr-3 p-2 rounded-full focus:outline-none transition-all duration-300 ${
                        updatingFavorite && lastToggledModule === module.code 
                          ? 'scale-110' 
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                      disabled={updatingFavorite}
                      aria-label={module.favorite ? "Remove from favorites" : "Add to favorites"}
                      title={module.favorite ? "Remove from favorites" : "Add to favorites"}
                    >
                      <FaStar 
                        className={`${module.favorite ? 'text-yellow-500' : 'text-gray-400 dark:text-gray-600'} transition-colors duration-200`} 
                      />
                    </button>
                    
                    <div 
                      onClick={() => handleModuleClick(module.code)}
                      className={`transform transition-transform duration-300 cursor-pointer ${expandedModule === module.code ? 'rotate-90' : ''}`}
                    >
                      <FaArrowRight className="text-ios-blue dark:text-ios-teal transition-colors duration-200" />
                    </div>
                  </div>
                </div>
                
                {expandedModule === module.code && (
                  <div className="p-4 pt-0 border-t border-ios-gray5 dark:border-ios-dark-border animate-expand-in">
                    {module.description && (
                      <div className="mb-4 bg-ios-gray6 dark:bg-ios-dark-secondary rounded-ios p-3 transition-colors duration-200">
                        <p className="text-ios-footnote text-ios-gray dark:text-ios-dark-text-secondary mb-1 transition-colors duration-200">
                          Description
                        </p>
                        <p className="text-ios-body text-black dark:text-ios-dark-text transition-colors duration-200">
                          {module.description}
                        </p>
                      </div>
                    )}
                    
                    {module.userNotes && (
                      <div className="mb-4 bg-ios-gray6 dark:bg-ios-dark-secondary rounded-ios p-3 transition-colors duration-200">
                        <p className="text-ios-footnote text-ios-gray dark:text-ios-dark-text-secondary mb-1 transition-colors duration-200">
                          Your Notes
                        </p>
                        <p className="text-ios-body text-black dark:text-ios-dark-text transition-colors duration-200">
                          {module.userNotes}
                        </p>
                      </div>
                    )}

                    {/* Study Groups Section */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-ios-footnote font-medium text-ios-gray dark:text-ios-dark-text-secondary">
                          Study Groups
                        </h4>
                        <button 
                          onClick={() => handleCreateGroupClick(module.code)}
                          className="ios-button-secondary flex items-center text-sm"
                        >
                          <FaPlus className="mr-2" />
                          Create Group
                        </button>
                      </div>

                      {loadingGroups[module.code] ? (
                        <div className="flex justify-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-ios-blue dark:border-ios-teal"></div>
                        </div>
                      ) : moduleGroups[module.code]?.length > 0 ? (
                        <div className="space-y-3">
                          {moduleGroups[module.code].map(group => (
                            <div 
                              key={group.id}
                              className="bg-ios-gray6 dark:bg-ios-dark-secondary rounded-lg p-4 transition-all duration-200 hover:shadow-md"
                            >
                              <div className="flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h5 className="font-medium text-ios-body dark:text-ios-dark-text">
                                      {group.name}
                                    </h5>
                                    <div className="flex items-center mt-1 space-x-2">
                                      <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full">
                                        {group.memberCount || 0} members
                                      </span>
                                      {group.maxMembers && (
                                        <span className="text-xs text-ios-gray dark:text-ios-dark-text-secondary">
                                          Max: {group.maxMembers}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => navigate(`/groups/${group.id}`)}
                                    className="ios-button-outline text-sm px-3 py-1.5"
                                  >
                                    View Details
                                  </button>
                                </div>
                                
                                {group.topic && (
                                  <div className="mt-2">
                                    <p className="text-xs text-ios-gray dark:text-ios-dark-text-secondary mb-1">
                                      Topic
                                    </p>
                                    <p className="text-sm text-black dark:text-ios-dark-text">
                                      {group.topic}
                                    </p>
                                  </div>
                                )}
                                
                                {group.description && (
                                  <div className="mt-2">
                                    <p className="text-xs text-ios-gray dark:text-ios-dark-text-secondary mb-1">
                                      Description
                                    </p>
                                    <p className="text-sm text-black dark:text-ios-dark-text line-clamp-2">
                                      {group.description}
                                    </p>
                                  </div>
                                )}
                                
                                {group.schedule && (
                                  <div className="mt-2">
                                    <p className="text-xs text-ios-gray dark:text-ios-dark-text-secondary mb-1">
                                      Schedule
                                    </p>
                                    <p className="text-sm text-black dark:text-ios-dark-text">
                                      {group.schedule}
                                    </p>
                                  </div>
                                )}
                                
                                <div className="mt-3 pt-3 border-t border-ios-gray5 dark:border-ios-dark-border">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs text-ios-gray dark:text-ios-dark-text-secondary">
                                        Created {new Date(group.createdAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => navigate(`/groups/${group.id}`)}
                                      className="text-xs text-ios-blue dark:text-ios-teal hover:underline"
                                    >
                                      View Full Details →
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 bg-ios-gray6 dark:bg-ios-dark-secondary rounded-lg">
                          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-ios-blue bg-opacity-10 dark:bg-opacity-20 flex items-center justify-center">
                            <FaBook className="text-ios-blue dark:text-ios-teal text-xl" />
                          </div>
                          <p className="text-ios-gray dark:text-ios-dark-text-secondary mb-2">
                            No active study groups
                          </p>
                          <p className="text-xs text-ios-gray dark:text-ios-dark-text-tertiary mb-4">
                            Be the first to create a study group for this module
                          </p>
                          <button 
                            onClick={() => handleCreateGroupClick(module.code)}
                            className="ios-button-outline text-sm px-4 py-2"
                          >
                            Create First Group
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {userModules.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded-ios text-sm">
                <div className="flex items-start">
                  <FaStar className="text-yellow-500 mr-2 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-ios-gray dark:text-ios-dark-text-secondary mb-1">
                      Favorite modules appear at the top of your list for easier access.
                    </p>
                    <p className="text-ios-gray dark:text-ios-dark-text-secondary text-xs">
                      Click the star icon to mark a module as favorite. You can use this to prioritize your most important modules.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyModules;