import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ref, onValue, get, update, set } from 'firebase/database';
import { database } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import SmallMapView from '../Map/SmallMapView';
import moment from 'moment';
import { 
  FaUserFriends, 
  FaClock, 
  FaMapMarkerAlt, 
  FaBook, 
  FaPlus, 
  FaChevronRight,
  FaSun,
  FaMoon,
  FaBullhorn,
  FaLightbulb,
  FaRegCalendarCheck,
  FaUserGraduate,
  FaExclamation,
  FaTimes,
  FaStar,
  FaArrowRight
} from 'react-icons/fa';

// Test data for development
const testStudySpots = [
  {
    id: "spot1",
    name: "University Library",
    category: "Library",
    description: "Main university library with quiet study spaces",
    features: ["Quiet", "Wi-Fi", "Power outlets"],
    rating: 4.8,
    location: {
      lat: 51.242,
      lng: -0.589
    }
  },
  {
    id: "spot2",
    name: "The Hive Coffee Shop",
    category: "Cafe",
    description: "Cozy coffee shop with good Wi-Fi",
    features: ["Food", "Wi-Fi", "Coffee"],
    rating: 4.6,
    location: {
      lat: 51.243,
      lng: -0.587
    }
  },
  {
    id: "spot3",
    name: "PATS Building",
    category: "Academic Building",
    description: "Computer science building with labs",
    features: ["Computers", "Quiet", "24/7 Access"],
    rating: 4.5,
    location: {
      lat: 51.244,
      lng: -0.590
    }
  }
];

const testModules = {
  "COM1001": {
    name: "Programming Fundamentals",
    department: "Computer Science",
    description: "Introduction to programming concepts"
  },
  "COM1002": {
    name: "Data Structures",
    department: "Computer Science",
    description: "Essential data structures"
  },
  "COM2001": {
    name: "Web Development",
    department: "Computer Science",
    description: "Modern web application development"
  }
};

const Dashboard = () => {
  const { currentUser, userProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State variables
  const [isLoading, setIsLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [favoriteModules, setFavoriteModules] = useState([]);
  const [allUserModules, setAllUserModules] = useState([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [studySpots, setStudySpots] = useState([]);
  const [errors, setErrors] = useState({
    groups: null,
    modules: null,
    meetings: null,
    spots: null
  });
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [studyTips] = useState([
    "Break your study sessions into 25-minute intervals with short breaks in between.",
    "Create a dedicated study space free from distractions.",
    "Try explaining complex concepts to someone else to deepen your understanding.",
    "Use practice tests to identify areas that need more review.",
    "Stay hydrated and take regular breaks to maintain focus.",
    "Create summary notes after each study session to reinforce learning."
  ]);
  const [currentTip] = useState(Math.floor(Math.random() * studyTips.length));
  const [isNewUser, setIsNewUser] = useState(false);
  const [shouldRedirectToModules, setShouldRedirectToModules] = useState(false);

  // Check if user was redirected from registration
  useEffect(() => {
    if (location.state?.newUser) {
      setIsNewUser(true);
      setShowWelcomeModal(true);
      
      // Store the showModules state instead of immediately redirecting
      if (location.state?.showModules) {
        setShouldRedirectToModules(true);
      }
      
      // Clear the location state to prevent showing welcome modal on refresh
      // but do this without losing other important state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  // Handle redirection to modules page for new users who selected a major
  // This will only execute after the welcome modal is closed
  useEffect(() => {
    if (isNewUser && shouldRedirectToModules && !showWelcomeModal) {
      // Add a small delay to ensure smooth transition
      const timer = setTimeout(() => {
        navigate('/my-modules', { replace: true });
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isNewUser, shouldRedirectToModules, showWelcomeModal, navigate]);

  // Load dashboard data
  useEffect(() => {
    if (!currentUser) return;
    
    const loadDashboardData = async () => {
      setIsLoading(true);
      
      try {
        // Load test data for development purposes
        const loadTestData = async () => {
          console.log("Loading test data for development");
          
          // Load test study spots
          for (const spot of testStudySpots) {
            await set(ref(database, `studySpots/${spot.id}`), {
              name: spot.name,
              category: spot.category,
              description: spot.description,
              features: spot.features,
              rating: spot.rating,
              location: spot.location
            });
          }
          console.log("Test study spots loaded");
          
          // Load test modules
          await set(ref(database, 'modules'), testModules);
          console.log("Test modules loaded");
          
          // Set user favorites
          await update(ref(database, `users/${currentUser.uid}/modules`), {
            "COM1001": {
              enrolled: true,
              favorite: true
            },
            "COM1002": {
              enrolled: true,
              favorite: true
            },
            "COM2001": {
              enrolled: true,
              favorite: false
            }
          });
          console.log("Test user modules loaded");
        };
        
        // Uncomment this line to load test data
        await loadTestData();

        // Fetch user's groups
        const groupsRef = ref(database, 'groups');
        onValue(groupsRef, (snapshot) => {
          try {
            if (snapshot.exists()) {
              const groupsData = snapshot.val();
              // Filter groups where user is a member
              const userGroups = Object.entries(groupsData)
                .filter(([_, group]) => 
                  group.members && group.members[currentUser.uid]
                )
                .map(([id, data]) => ({
                  id,
                  ...data
                }));
              
              setGroups(userGroups);
            } else {
              setGroups([]);
            }
          } catch (error) {
            console.error("Error processing groups data:", error);
            setErrors(prev => ({ ...prev, groups: "Failed to load groups" }));
          }
        }, {
          onError: (error) => {
            console.error("Error fetching groups:", error);
            setErrors(prev => ({ ...prev, groups: "Failed to load groups" }));
          }
        });

        // Fetch user's modules with favorite status
        if (userProfile) {
          const userModulesRef = ref(database, `users/${currentUser.uid}/modules`);
          onValue(userModulesRef, async (snapshot) => {
            try {
              if (snapshot.exists()) {
                const modulesData = snapshot.val();
                console.log("User modules data:", modulesData);
                
                const modulesRef = ref(database, 'modules');
                const allModulesSnap = await get(modulesRef);
                
                if (allModulesSnap.exists()) {
                  const allModules = allModulesSnap.val();
                  console.log("All modules data:", allModules);
                  
                  const userModulesList = Object.entries(modulesData).map(([moduleCode, moduleData]) => {
                    return {
                      code: moduleCode,
                      title: allModules[moduleCode]?.name || moduleCode,
                      department: allModules[moduleCode]?.department || '',
                      favorite: moduleData.favorite || false
                    };
                  });
                  
                  // Set all modules
                  setAllUserModules(userModulesList);
                  
                  // Set favorite modules for display
                  const favorites = userModulesList.filter(module => module.favorite === true);
                  console.log("Filtered favorite modules:", favorites);
                  setFavoriteModules(favorites);
                }
              } else {
                console.log("No modules found for user");
                setAllUserModules([]);
                setFavoriteModules([]);
              }
            } catch (error) {
              console.error("Error processing modules data:", error);
              setErrors(prev => ({ ...prev, modules: "Failed to load modules" }));
            }
          }, {
            onError: (error) => {
              console.error("Error fetching modules:", error);
              setErrors(prev => ({ ...prev, modules: "Failed to load modules" }));
            }
          });
        }

        // Fetch upcoming meetings
        const meetingsRef = ref(database, 'meetings');
        onValue(meetingsRef, (snapshot) => {
          try {
            if (snapshot.exists()) {
              const meetingsData = snapshot.val();
              // Filter meetings where user is a participant
              const userMeetings = Object.entries(meetingsData)
                .filter(([_, meeting]) => 
                  meeting.participants && meeting.participants[currentUser.uid]
                )
                .map(([id, data]) => ({
                  id,
                  ...data
                }))
                // Sort by date (upcoming first)
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                // Only show future meetings
                .filter(meeting => new Date(meeting.date) >= new Date());
              
              setUpcomingMeetings(userMeetings);
            } else {
              setUpcomingMeetings([]);
            }
          } catch (error) {
            console.error("Error processing meetings data:", error);
            setErrors(prev => ({ ...prev, meetings: "Failed to load upcoming sessions" }));
          }
        }, {
          onError: (error) => {
            console.error("Error fetching meetings:", error);
            setErrors(prev => ({ ...prev, meetings: "Failed to load upcoming sessions" }));
          }
        });

        // Fetch popular study spots
        const spotsRef = ref(database, 'studySpots');
        onValue(spotsRef, (snapshot) => {
          try {
            if (snapshot.exists()) {
              const spotsData = snapshot.val();
              console.log("Study spots data:", spotsData);
              
              // Get top rated spots
              const popularSpots = Object.entries(spotsData)
                .map(([id, data]) => ({
                  id,
                  ...data
                }))
                // Sort by rating (highest first)
                .sort((a, b) => (b.rating || 0) - (a.rating || 0))
                .slice(0, 3); // Top 3 spots
              
              console.log("Processed popular spots:", popularSpots);
              setStudySpots(popularSpots);
            } else {
              console.log("No study spots found in database");
              setStudySpots([]);
            }
          } catch (error) {
            console.error("Error processing study spots data:", error);
            setErrors(prev => ({ ...prev, spots: "Failed to load study spots" }));
          }
        }, {
          onError: (error) => {
            console.error("Error fetching study spots:", error);
            setErrors(prev => ({ ...prev, spots: "Failed to load study spots" }));
          }
        });

        // Check if we should show welcome modal (first login)
        const userRef = ref(database, `users/${currentUser.uid}`);
        const userSnap = await get(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.val();
          // Only show welcome modal if hasSeenWelcome is explicitly false
          if (userData.hasSeenWelcome === false) {
            setShowWelcomeModal(true);
            // Update user data to mark welcome modal as seen
            await update(userRef, {
              hasSeenWelcome: true
            });
          }
        }

      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [currentUser, userProfile, navigate]);

  // Helper function to get welcome message based on time of day
  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Helper function to get user display name
  const getDisplayName = () => {
    if (userProfile && userProfile.name) return userProfile.name;
    if (currentUser && currentUser.displayName) return currentUser.displayName;
    return "Student";
  };

  // Close welcome modal and update user preference
  const closeWelcomeModal = () => {
    setShowWelcomeModal(false);
    // The useEffect will now handle redirection if needed
    // This ensures the modal is fully closed before any navigation occurs
  };

  // Error message component
  const ErrorMessage = ({ section }) => {
    if (!errors[section]) return null;
    
    return (
      <div className="bg-red-100 dark:bg-red-900 dark:bg-opacity-20 p-3 rounded-lg mb-4 flex items-center">
        <FaExclamation className="text-red-500 mr-2" />
        <p className="text-sm text-red-700 dark:text-red-300">{errors[section]}</p>
      </div>
    );
  };

  // Skeleton loader component for cards
  const SkeletonCard = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
      <div className="flex items-start">
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg mr-3" />
        <div className="flex-1">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-16 pt-4 sm:pb-4 max-w-7xl mx-auto transition-colors duration-200 dark:bg-gray-900">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-500 dark:from-teal-600 dark:to-blue-700 mb-6 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              {getWelcomeMessage()}, {getDisplayName()}!
            </h1>
            <p className="opacity-90 mt-1">
              {moment().format('dddd, MMMM D, YYYY')}
            </p>
          </div>
          <button 
            onClick={toggleTheme}
            className="p-3 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? 
              <FaSun className="text-white text-xl" /> : 
              <FaMoon className="text-white text-xl" />
            }
          </button>
        </div>
        
        {/* Daily Study Tip */}
        <div className="mt-6 bg-white bg-opacity-10 rounded-lg p-3 flex items-start">
          <FaLightbulb className="text-yellow-300 mr-3 mt-1 text-lg flex-shrink-0" />
          <div>
            <p className="font-medium">Daily Tip:</p>
            <p className="text-sm opacity-90">{studyTips[currentTip]}</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="lg:grid lg:grid-cols-3 lg:gap-6 space-y-6 lg:space-y-0">
          {/* Loading skeleton for left column */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              </div>
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 bg-white dark:bg-gray-800 rounded-xl shadow-sm animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>

          {/* Loading skeleton for middle column */}
          <div className="lg:col-span-1 space-y-6">
            <div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="h-32 bg-white dark:bg-gray-800 rounded-xl shadow-sm animate-pulse"></div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              </div>
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 bg-white dark:bg-gray-800 rounded-xl shadow-sm animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>

          {/* Loading skeleton for right column */}
          <div className="lg:col-span-1 space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              </div>
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 bg-white dark:bg-gray-800 rounded-xl shadow-sm animate-pulse"></div>
                ))}
              </div>
            </div>
            <div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
              <div className="h-32 bg-white dark:bg-gray-800 rounded-xl shadow-sm animate-pulse"></div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Rest of the dashboard components */}
          <div className="lg:grid lg:grid-cols-3 lg:gap-6 space-y-6 lg:space-y-0">
            {/* Left column - Quick Actions & Groups */}
            <div className="lg:col-span-1 space-y-6">
              {/* Quick Actions */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold mb-4 dark:text-white">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-4">
                  <Link to="/groups" className="bg-blue-100 dark:bg-blue-900 dark:bg-opacity-30 p-4 rounded-lg flex flex-col items-center justify-center hover:bg-blue-200 dark:hover:bg-opacity-40 transition">
                    <FaUserFriends className="text-3xl text-blue-600 dark:text-blue-400 mb-2" />
                    <span className="font-medium dark:text-white">Find Groups</span>
                  </Link>
                  <Link to="/map" className="bg-green-100 dark:bg-green-900 dark:bg-opacity-30 p-4 rounded-lg flex flex-col items-center justify-center hover:bg-green-200 dark:hover:bg-opacity-40 transition">
                    <FaMapMarkerAlt className="text-3xl text-green-600 dark:text-green-400 mb-2" />
                    <span className="font-medium dark:text-white">Campus Map</span>
                  </Link>
                  <Link to="/my-modules" className="bg-purple-100 dark:bg-purple-900 dark:bg-opacity-30 p-4 rounded-lg flex flex-col items-center justify-center hover:bg-purple-200 dark:hover:bg-opacity-40 transition">
                    <FaBook className="text-3xl text-purple-600 dark:text-purple-400 mb-2" />
                    <span className="font-medium dark:text-white">My Modules</span>
                  </Link>
                  <Link to="/study" className="bg-red-100 dark:bg-red-900 dark:bg-opacity-30 p-4 rounded-lg flex flex-col items-center justify-center hover:bg-red-200 dark:hover:bg-opacity-40 transition">
                    <FaClock className="text-3xl text-red-600 dark:text-red-400 mb-2" />
                    <span className="font-medium dark:text-white">Study Timer</span>
                  </Link>
                </div>
              </div>

              {/* My Groups */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold dark:text-white">My Study Groups</h2>
                  <Link to="/groups" className="text-blue-600 dark:text-blue-400 text-sm flex items-center">
                    See All <FaChevronRight className="ml-1 text-xs" />
                  </Link>
                </div>
                
                <ErrorMessage section="groups" />
                
                {!errors.groups && (
                  groups.length > 0 ? (
                    <div className="space-y-3">
                      {groups.map(group => (
                        <Link 
                          key={group.id} 
                          to={`/groups/${group.id}`}
                          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm block hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700 p-4"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-semibold dark:text-white">{group.name}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {group.moduleCode ? `${group.moduleCode} • ` : ''}
                                {group.members ? Object.keys(group.members).length : 0} members
                              </p>
                            </div>
                            <FaChevronRight className="text-gray-400 dark:text-gray-500" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 text-center py-8">
                      <div className="bg-gray-100 dark:bg-gray-700 inline-flex p-3 rounded-full mb-3">
                        <FaUserFriends className="text-gray-500 dark:text-gray-400 text-2xl" />
                      </div>
                      <p className="dark:text-gray-300">You haven't joined any groups yet</p>
                      <Link to="/groups" className="bg-blue-600 text-white py-2 px-4 rounded-md inline-block mt-3 hover:bg-blue-700 transition-colors">
                        Explore Groups
                      </Link>
                    </div>
                  )
                )}
              </div>
            </div>
            
            {/* Middle column - Upcoming Meetings & Modules */}
            <div className="lg:col-span-1 space-y-6">
              {/* Upcoming Meetings */}
              <div>
                <h2 className="text-lg font-semibold mb-2 dark:text-white">Upcoming Sessions</h2>
                
                <ErrorMessage section="meetings" />
                
                {!errors.meetings && (
                  upcomingMeetings.length > 0 ? (
                    <div className="space-y-3">
                      {upcomingMeetings.map(meeting => (
                        <div 
                          key={meeting.id} 
                          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4"
                        >
                          <div className="flex items-start">
                            <div className="bg-blue-100 dark:bg-blue-900 dark:bg-opacity-30 p-2 rounded-lg mr-3 flex-shrink-0">
                              <FaRegCalendarCheck className="text-blue-600 dark:text-blue-400 text-xl" />
                            </div>
                            
                            <div className="flex-1">
                              <h3 className="font-semibold dark:text-white">{meeting.title}</h3>
                              <p className="text-gray-600 dark:text-gray-400 text-sm">
                                {meeting.groupName && `${meeting.groupName} • `}
                                {moment(meeting.date).format('MMM D, YYYY')} at {meeting.time || ''}
                              </p>
                              
                              {meeting.location && (
                                <div className="mt-2 flex items-center text-sm">
                                  <FaMapMarkerAlt className="text-red-500 dark:text-red-400 mr-1 text-xs" />
                                  <span className="text-gray-600 dark:text-gray-400">{meeting.location}</span>
                                </div>
                              )}
                            </div>
                            
                            {meeting.groupId && (
                              <Link 
                                to={`/groups/${meeting.groupId}`}
                                className="border border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 text-xs px-3 py-1 ml-2 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900 dark:hover:bg-opacity-20 transition-colors"
                              >
                                View
                              </Link>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 text-center py-8">
                      <div className="bg-gray-100 dark:bg-gray-700 inline-flex p-3 rounded-full mb-3">
                        <FaClock className="text-gray-500 dark:text-gray-400 text-2xl" />
                      </div>
                      <p className="dark:text-gray-300">No upcoming study sessions</p>
                      <Link to="/groups/create" className="bg-blue-600 text-white py-2 px-4 rounded-md inline-block mt-3 hover:bg-blue-700 transition-colors">
                        Plan a Session
                      </Link>
                    </div>
                  )
                )}
              </div>

              {/* Favorite Modules - Updated from My Modules */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold dark:text-white">
                    <FaStar className="inline-block text-yellow-500 mr-1" />
                    Favorite Modules
                  </h2>
                  <Link to="/my-modules" className="text-blue-600 dark:text-blue-400 text-sm flex items-center">
                    Manage <FaChevronRight className="ml-1 text-xs" />
                  </Link>
                </div>
                
                <ErrorMessage section="modules" />
                
                {!errors.modules && (
                  favoriteModules.length > 0 ? (
                    <div className="space-y-3">
                      {favoriteModules.slice(0, 3).map((module) => (
                        <div 
                          key={module.code} 
                          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-yellow-300 dark:border-yellow-500 p-4"
                        >
                          <div className="flex items-start">
                            <div className="bg-yellow-100 dark:bg-yellow-900 dark:bg-opacity-30 p-2 rounded-lg mr-3 flex-shrink-0">
                              <FaStar className="text-yellow-500 text-xl" />
                            </div>
                          
                            <div className="flex-1">
                              <h3 className="font-semibold dark:text-white">
                                {module.code} {module.title && `- ${module.title}`}
                              </h3>
                              {module.department && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {module.department}
                                </p>
                              )}
                            </div>
                            
                            <Link 
                              to={`/groups?module=${module.code}`}
                              className="border border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 text-xs px-3 py-1 whitespace-nowrap rounded-md hover:bg-blue-50 dark:hover:bg-blue-900 dark:hover:bg-opacity-20 transition-colors"
                            >
                              <div className="flex items-center">
                                <FaUserFriends className="mr-1" /> 
                                <span>Find Groups</span>
                              </div>
                            </Link>
                          </div>
                        </div>
                      ))}
                      
                      {favoriteModules.length > 3 && (
                        <p className="text-center text-gray-600 dark:text-gray-400">
                          +{favoriteModules.length - 3} more favorites
                        </p>
                      )}
                    </div>
                  ) : allUserModules.length > 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 text-center py-6">
                      <div className="bg-yellow-100 dark:bg-yellow-900 dark:bg-opacity-30 inline-flex p-3 rounded-full mb-3">
                        <FaStar className="text-yellow-500 text-2xl" />
                      </div>
                      <p className="dark:text-gray-300 px-4 mb-3">You don't have any favorite modules yet</p>
                      <Link to="/my-modules" className="bg-blue-600 text-white py-2 px-4 rounded-md inline-block hover:bg-blue-700 transition-colors">
                        Add Favorites
                      </Link>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 text-center py-6">
                      <div className="bg-gray-100 dark:bg-gray-700 inline-flex p-3 rounded-full mb-3">
                        <FaBook className="text-gray-500 dark:text-gray-400 text-2xl" />
                      </div>
                      <p className="dark:text-gray-300 px-4 mb-3">You haven't added any modules yet</p>
                      <Link to="/my-modules" className="bg-blue-600 text-white py-2 px-4 rounded-md inline-block hover:bg-blue-700 transition-colors">
                        Add Modules
                      </Link>
                    </div>
                  )
                )}
              </div>
            </div>
            
            {/* Right column - Study Spots & Announcements */}
            <div className="lg:col-span-1 space-y-6">
              {/* Study Spots Near You */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold dark:text-white">Popular Study Spots</h2>
                  <Link to="/map" className="text-blue-600 dark:text-blue-400 text-sm flex items-center">
                    View Map <FaChevronRight className="ml-1 text-xs" />
                  </Link>
                </div>
                
                <ErrorMessage section="spots" />
                
                {!errors.spots && studySpots.length > 0 && (
                  <div className="space-y-4">
                    {/* Added small map view */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <SmallMapView spots={studySpots} height="180px" />
                    </div>

                    {studySpots.map(spot => (
                      <Link
                        key={spot.id}
                        to="/map" 
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm block hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700 p-4"
                      >
                        <div className="flex items-start">
                          <div className="bg-green-100 dark:bg-green-900 dark:bg-opacity-30 p-2 rounded-lg mr-3 flex-shrink-0">
                            <FaMapMarkerAlt className="text-green-600 dark:text-green-400 text-xl" />
                          </div>
                          
                          <div>
                            <h3 className="font-semibold dark:text-white">{spot.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {spot.category || 'Study Spot'}
                            </p>
                            {spot.features && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {spot.features.slice(0, 3).map((feature, index) => (
                                  <span 
                                    key={index} 
                                    className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full"
                                  >
                                    {feature}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}

                    <Link to="/map" className="bg-green-50 dark:bg-green-900 dark:bg-opacity-20 text-green-700 dark:text-green-400 rounded-xl border border-green-200 dark:border-green-800 p-3 flex items-center justify-center hover:bg-green-100 dark:hover:bg-opacity-30 transition-colors">
                      <span className="font-medium mr-1">Explore All Study Spots</span>
                      <FaArrowRight className="ml-1" />
                    </Link>
                  </div>
                )}

                {!errors.spots && studySpots.length === 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 text-center py-8">
                    <div className="bg-gray-100 dark:bg-gray-700 inline-flex p-3 rounded-full mb-3">
                      <FaMapMarkerAlt className="text-gray-500 dark:text-gray-400 text-2xl" />
                    </div>
                    <p className="dark:text-gray-300">No study spots found</p>
                    <Link to="/map" className="bg-blue-600 text-white py-2 px-4 rounded-md inline-block mt-3 hover:bg-blue-700 transition-colors">
                      Explore Map
                    </Link>
                  </div>
                )}
              </div>
              
              {/* Announcements */}
              <div>
                <h2 className="text-lg font-semibold mb-4 dark:text-white">Announcements</h2>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-start">
                    <div className="bg-yellow-100 dark:bg-yellow-900 dark:bg-opacity-30 p-2 rounded-lg mr-3 flex-shrink-0">
                      <FaBullhorn className="text-yellow-600 dark:text-yellow-400 text-xl" />
                    </div>
                    
                    <div>
                      <h3 className="font-semibold dark:text-white">New App Features!</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        We've enhanced the map with a new sidebar for desktop users. Try it out to find study spots more easily!
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-400 mt-3 cursor-pointer">
                        Read More
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Create Group FAB for mobile */}
      <div className="fixed right-6 bottom-24 sm:hidden z-50">
        <Link 
          to="/groups/create" 
          className="bg-blue-600 dark:bg-blue-500 text-white p-4 rounded-full shadow-lg flex items-center justify-center"
          aria-label="Create New Group"
        >
          <FaPlus />
        </Link>
      </div>

      {/* Welcome Modal */}
      {showWelcomeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 max-w-lg w-full rounded-xl shadow-xl">
            <div className="bg-gradient-to-r from-blue-600 to-teal-500 rounded-t-xl p-6 text-white">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold">Welcome to StudyGroup</h2>
                <button onClick={closeWelcomeModal} className="text-white hover:opacity-80">
                  <FaTimes />
                </button>
              </div>
              <p className="mt-2 opacity-90">Your new study companion at Surrey University</p>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-blue-100 dark:bg-blue-900 dark:bg-opacity-30 p-3 rounded-full mr-3">
                    <FaUserFriends className="text-blue-600 dark:text-blue-400 text-xl" />
                  </div>
                  <div>
                    <h3 className="font-semibold dark:text-white">Join Study Groups</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Connect with classmates and study together for better results.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-purple-100 dark:bg-purple-900 dark:bg-opacity-30 p-3 rounded-full mr-3">
                    <FaBook className="text-purple-600 dark:text-purple-400 text-xl" />
                  </div>
                  <div>
                    <h3 className="font-semibold dark:text-white">Track Your Modules</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Organize your courses and find related study materials.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-green-100 dark:bg-green-900 dark:bg-opacity-30 p-3 rounded-full mr-3">
                    <FaMapMarkerAlt className="text-green-600 dark:text-green-400 text-xl" />
                  </div>
                  <div>
                    <h3 className="font-semibold dark:text-white">Find Study Spots</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Discover the best places to study across campus and nearby.</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <button onClick={closeWelcomeModal} className="bg-blue-600 text-white px-8 py-2 rounded-md hover:bg-blue-700 transition-colors">
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;