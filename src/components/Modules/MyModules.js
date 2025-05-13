import React, { useState, useEffect } from 'react';
import { ref, get, update } from 'firebase/database';
import { database } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { useMajorsModules } from '../../context/MajorsModulesContext';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaGraduationCap, FaBook, FaArrowRight, FaUser, FaUserGraduate, FaStar } from 'react-icons/fa';

function MyModules() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const { modules, loading: contextLoading } = useMajorsModules();
  
  const [userModules, setUserModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedModule, setExpandedModule] = useState(null);
  const [redirecting, setRedirecting] = useState(false);
  const [updatingFavorite, setUpdatingFavorite] = useState(false);
  
  // Automatically redirect to profile page if no major is selected
  useEffect(() => {
    if (!loading && !contextLoading && userProfile) {
      if (!userProfile.majorCode && !redirecting) {
        const timer = setTimeout(() => {
          navigate('/profile', { state: { showMajorAlert: true } });
        }, 1500); // Give user 1.5 seconds to see the message before redirecting

        setRedirecting(true);
        return () => clearTimeout(timer);
      }
    } else if (!userProfile && !redirecting) {
      console.warn('User profile not loaded. Redirecting to profile page.');
      navigate('/profile', { state: { showMajorAlert: true } });
      setRedirecting(true);
    }
  }, [loading, contextLoading, userProfile, navigate, redirecting]);
  
  useEffect(() => {
    const fetchUserModules = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }
      
      try {
        const userModulesRef = ref(database, `users/${currentUser.uid}/modules`);
        const snapshot = await get(userModulesRef);
        
        if (snapshot.exists()) {
          // Get user's module data
          const modulesData = snapshot.val();
          
          // Match with module details from context
          if (modules.length > 0) {
            const userModuleDetails = Object.keys(modulesData).map(moduleCode => {
              const moduleDetail = modules.find(m => m.code === moduleCode);
              return moduleDetail ? {
                ...moduleDetail,
                userNotes: modulesData[moduleCode].notes || '',
                addedAt: modulesData[moduleCode].addedAt,
                favorite: modulesData[moduleCode].favorite || false, // Extract favorite status
              } : null;
            }).filter(module => module !== null);
            
            // Sort modules - favorites first, then alphabetically by name
            userModuleDetails.sort((a, b) => {
              if (a.favorite && !b.favorite) return -1;
              if (!a.favorite && b.favorite) return 1;
              return a.name.localeCompare(b.name);
            });
            
            setUserModules(userModuleDetails);
          }
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user modules:", error);
        setLoading(false);
      }
    };
    
    if (!contextLoading && modules.length > 0) {
      fetchUserModules();
    }
  }, [currentUser, modules, contextLoading]);
  
  // Handle toggling favorite status
  const toggleFavorite = async (moduleCode, currentStatus) => {
    if (!currentUser || updatingFavorite) return;
    
    try {
      setUpdatingFavorite(true);
      
      // Update in Firebase
      const moduleRef = ref(database, `users/${currentUser.uid}/modules/${moduleCode}`);
      await update(moduleRef, {
        favorite: !currentStatus
      });
      
      // Update in local state
      setUserModules(prevModules => {
        const updatedModules = prevModules.map(module => 
          module.code === moduleCode 
            ? { ...module, favorite: !currentStatus } 
            : module
        );
        
        // Sort to move new favorites to the top
        return updatedModules.sort((a, b) => {
          if (a.favorite && !b.favorite) return -1;
          if (!a.favorite && b.favorite) return 1;
          return a.name.localeCompare(b.name);
        });
      });
      
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

  if (loading || contextLoading) {
    return (
      <div className="flex justify-center items-center h-screen dark:bg-ios-dark-bg transition-colors duration-200">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ios-blue dark:border-ios-teal"></div>
      </div>
    );
  }

  // Check if user has a major selected in their profile
  const noMajorSelected = !userProfile?.majorCode;

  return (
    <div className="min-h-screen bg-ios-gray6 dark:bg-ios-dark-bg px-4 py-6 transition-colors duration-200">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-ios-largetitle font-sf-pro-display font-semibold text-black dark:text-ios-dark-text mb-2 transition-colors duration-200">
          My Modules
        </h1>
        
        <p className="text-ios-subhead text-ios-gray dark:text-ios-dark-text-secondary mb-6 transition-colors duration-200">
          View and manage your enrolled modules
        </p>
        
        {noMajorSelected ? (
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
              >
                <div className="flex justify-between items-center p-4">
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
                    <div>
                      <h3 className="text-ios-body font-medium text-black dark:text-ios-dark-text transition-colors duration-200">
                        {module.name}
                      </h3>
                      <p className="text-ios-subhead text-ios-gray dark:text-ios-dark-text-secondary transition-colors duration-200">
                        {module.code}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <button 
                      onClick={() => toggleFavorite(module.code, module.favorite)}
                      className={`mr-3 p-2 rounded-full focus:outline-none ${updatingFavorite ? 'opacity-50' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
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
                    
                    <div className="flex justify-end">
                      <button 
                        onClick={() => handleCreateGroupClick(module.code)}
                        className="ios-button-secondary flex items-center text-sm"
                      >
                        <FaPlus className="mr-2" />
                        Create Study Group
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            <div className="flex justify-end">
              <button 
                onClick={handleAddModuleClick}
                className="ios-button flex items-center mt-2"
              >
                <FaPlus className="mr-2" />
                Add More Modules
              </button>
            </div>
          </div>
        )}
        
        {userModules.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded-ios text-sm">
            <p className="text-ios-gray dark:text-ios-dark-text-secondary">
              <FaStar className="inline-block text-yellow-500 mr-1" /> 
              Tip: Favorite modules will always appear at the top of your list for easier access.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyModules;