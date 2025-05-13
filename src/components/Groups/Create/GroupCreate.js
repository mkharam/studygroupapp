import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link, useLocation as useRouteLocation } from 'react-router-dom';
import { ref, push, set, get } from 'firebase/database';
import { database } from '../../../firebase';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { useMajorsModules } from '../../../context/MajorsModulesContext';
import { useGoogleMaps } from '../../../context/GoogleMapsContext';
import { 
  FaBook, 
  FaMapMarkerAlt, 
  FaClock,
  FaUser,
  FaArrowLeft,
  FaPlus,
  FaInfoCircle,
  FaGraduationCap
} from 'react-icons/fa';
import { allStudyLocations } from '../../../data/surreyLocations';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = "AIzaSyA6Tx4cbx7PVbUcVMDm-ETHRro0pinTAQw";

// Define map container style
const mapContainerStyle = {
  width: '100%',
  height: '300px',
};

function GroupCreate() {
  const { currentUser, userProfile } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useRouteLocation();
  const { isLoaded, loadError } = useGoogleMaps();
  const initialModuleCode = searchParams.get('moduleCode');
  const { majors, modules, departments, loading: majorsModulesLoading } = useMajorsModules();
  
  // Form states
  const [name, setName] = useState('');
  const [moduleCode, setModuleCode] = useState(initialModuleCode || '');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [meetingLocation, setMeetingLocation] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [maxMembers, setMaxMembers] = useState(10);
  const [useLocation, setUseLocation] = useState(false);
  const [coordinates, setCoordinates] = useState(null);
  const [visibility, setVisibility] = useState('public');
  const [userPosition, setUserPosition] = useState(null);
  const [selectedMajor, setSelectedMajor] = useState('');
  const [filteredModules, setFilteredModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [isLocationHelpVisible, setIsLocationHelpVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [studyLocations, setStudyLocations] = useState([]);
  const [selectedPredefinedLocation, setSelectedPredefinedLocation] = useState(null);
  const [userModules, setUserModules] = useState([]);
  const [userModuleDetails, setUserModuleDetails] = useState([]);
  const [locationSearch, setLocationSearch] = useState('');
  const [showInfoWindow, setShowInfoWindow] = useState(null);
  const [mapType, setMapType] = useState('roadmap');
  const [showAllModules, setShowAllModules] = useState(false);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check if location data passed from MapView
  useEffect(() => {
    if (location.state?.location) {
      const { coordinates, address } = location.state.location;
      if (coordinates) {
        setCoordinates(coordinates);
        setUseLocation(true);
      }
      if (address) {
        setMeetingLocation(address);
      }
      
      // If we have coordinates from MapView, automatically move to step 2
      setCurrentStep(2);
    }
  }, [location.state]);
  
  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { state: { from: { pathname: '/groups/create' } } });
    }
  }, [currentUser, navigate]);
  
  // Load study locations from our data
  useEffect(() => {
    setStudyLocations(allStudyLocations);
  }, []);

  // Get user's current location if permissions are available
  useEffect(() => {
    const surreyCampus = [51.242, -0.589]; // Moved inside useEffect
    if (userProfile?.locationSharing) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserPosition([latitude, longitude]);
        },
        (err) => {
          console.error('Geolocation error:', err);
          // Fall back to Surrey campus location
          setUserPosition(surreyCampus);
        }
      );
    } else {
      // Default to Surrey campus
      setUserPosition(surreyCampus);
    }
  }, [userProfile]);

  // Get user's major and modules from profile
  useEffect(() => {
    if (!currentUser || !userProfile) return;
    
    // Set user's major if available in their profile
    if (userProfile?.majorCode) {
      setSelectedMajor(userProfile.majorCode);
    }
    
    // Fetch user's modules from database
    const fetchUserModules = async () => {
      try {
        const userModulesRef = ref(database, `users/${currentUser.uid}/modules`);
        const snapshot = await get(userModulesRef);
        
        if (snapshot.exists()) {
          const modulesData = snapshot.val();
          const userModuleCodes = Object.keys(modulesData);
          setUserModules(userModuleCodes);
          
          // Match module codes with full module details
          const moduleDetailsList = userModuleCodes
            .map(code => {
              const moduleDetail = modules.find(m => m.code === code);
              return moduleDetail || null;
            })
            .filter(Boolean);
          
          setUserModuleDetails(moduleDetailsList);
          
          // If no initial module is specified and user has modules, suggest the first one
          if (!initialModuleCode && userModuleCodes.length > 0 && !moduleCode) {
            setModuleCode(userModuleCodes[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching user modules:", error);
      }
    };
    
    if (modules.length > 0) {
      fetchUserModules();
    }
  }, [currentUser, userProfile, initialModuleCode, moduleCode, modules]);

  // Filter modules based on selected major
  useEffect(() => {
    if (majorsModulesLoading) return;
    
    if (!selectedMajor) {
      setFilteredModules(modules);
      return;
    }
    
    const modulesForMajor = modules.filter(module => 
      module.programs && module.programs.includes(selectedMajor)
    );
    
    setFilteredModules(modulesForMajor);
  }, [selectedMajor, modules, majorsModulesLoading]);

  // Find selected module data
  useEffect(() => {
    if (moduleCode && modules.length > 0) {
      const foundModule = modules.find(m => m.code === moduleCode);
      setSelectedModule(foundModule || null);
      
      // Set default group name based on module if name is empty
      if (foundModule && !name) {
        setName(`${foundModule.name} Study Group`);
      }
    }
  }, [moduleCode, modules, name]);

  // Set selected major based on module's programs if a module is pre-selected
  useEffect(() => {
    if (initialModuleCode && modules.length > 0 && !selectedMajor) {
      const module = modules.find(m => m.code === initialModuleCode);
      if (module && module.programs && module.programs.length > 0) {
        // Use the first program associated with this module
        setSelectedMajor(module.programs[0]);
      }
    }
  }, [initialModuleCode, modules, selectedMajor]);
  
  // Handle map location selection
  const handleLocationSelect = (position) => {
    setCoordinates({
      lat: position.lat,
      lng: position.lng
    });
    
    // Clear any pre-selected location
    setSelectedPredefinedLocation(null);
  };

  // Handle predefined location selection
  const handlePredefinedLocation = (spot) => {
    setCoordinates({
      lat: spot.location.lat,
      lng: spot.location.lng
    });
    setSelectedPredefinedLocation(spot);
    setMeetingLocation(spot.name);
  };
  
  // Handle location toggle
  const handleLocationToggle = async () => {
    const newState = !useLocation;
    setUseLocation(newState);
    
    // If turning on location and no coordinates set yet, use user's position if available
    if (newState && !coordinates && userPosition) {
      setCoordinates({
        lat: userPosition[0],
        lng: userPosition[1]
      });
    }
  };

  // Handle module change
  const handleModuleChange = (e) => {
    const selectedCode = e.target.value;
    setModuleCode(selectedCode);
    
    // Find module's details
    if (selectedCode) {
      const foundModule = modules.find(m => m.code === selectedCode);
      if (foundModule) {
        setSelectedModule(foundModule);
        
        // Update name suggestion if empty
        if (!name || name === `${selectedModule?.name} Study Group`) {
          setName(`${foundModule.name} Study Group`);
        }
      }
    } else {
      setSelectedModule(null);
    }
  };

  // Handle major change
  const handleMajorChange = (e) => {
    const majorCode = e.target.value;
    setSelectedMajor(majorCode);
    
    // Reset module selection if changing major
    if (moduleCode) {
      const currentModule = modules.find(m => m.code === moduleCode);
      if (currentModule && majorCode && !currentModule.programs.includes(majorCode)) {
        setModuleCode('');
        setSelectedModule(null);
      }
    }
  };

  // Move to next step
  const handleNextStep = () => {
    // Validate current step
    if (currentStep === 1) {
      if (!name.trim() || !moduleCode || !description.trim()) {
        setError('Please fill in all required fields before continuing');
        return;
      }
    }
    
    setCurrentStep(currentStep + 1);
    setError('');
  };

  // Move to previous step
  const handlePreviousStep = () => {
    setCurrentStep(currentStep - 1);
    setError('');
  };
  
  // Form validation
  const validateForm = () => {
    if (!name.trim()) {
      setError('Group name is required');
      return false;
    }
    
    if (!moduleCode) {
      setError('Please select a module');
      return false;
    }
    
    if (!description.trim()) {
      setError('Description is required');
      return false;
    }
    
    if (useLocation && !coordinates) {
      setError('Please select a location on the map');
      return false;
    }
    
    return true;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset error
    setError('');
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Create group object
      const groupData = {
        name: name.trim(),
        moduleCode,
        moduleName: selectedModule ? selectedModule.name : '',
        description: description.trim(),
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        visibility: visibility,
        members: {
          [currentUser.uid]: {
            role: 'admin',
            joinedAt: new Date().toISOString(),
            name: userProfile?.name || currentUser.displayName || 'User'
          }
        },
        memberCount: 1,
        maxMembers: parseInt(maxMembers) || 10
      };
      
      // Add optional fields if they exist
      if (topic.trim()) {
        groupData.topic = topic.trim();
      }
      
      if (meetingLocation.trim()) {
        groupData.location = meetingLocation.trim();
      }
      
      if (meetingTime.trim()) {
        groupData.meetingTime = meetingTime.trim();
      }
      
      // Add coordinates if using location
      if (useLocation && coordinates) {
        groupData.coordinates = coordinates;
      }

      // Add major information if available
      if (selectedMajor) {
        groupData.majorCode = selectedMajor;
        const majorData = majors.find(m => m.code === selectedMajor);
        if (majorData) {
          groupData.majorName = majorData.name;
        }
      }

      // Add selected location information if available
      if (selectedPredefinedLocation) {
        groupData.locationDetails = {
          id: selectedPredefinedLocation.id,
          category: selectedPredefinedLocation.category,
          features: selectedPredefinedLocation.features
        };
      }
      
      // Push group to database
      const groupsRef = ref(database, 'groups');
      const newGroupRef = push(groupsRef);
      await set(newGroupRef, groupData);
      
      // Show success
      setSuccess('Study group created successfully!');

      // Navigate to the new group after a short delay
      setTimeout(() => {
        navigate(`/groups/${newGroupRef.key}`);
      }, 1000);
    } catch (error) {
      console.error('Error creating group:', error);
      setError('Failed to create group. Please try again.');
      setLoading(false);
    }
  };

  // Helper to get department name for a major
  const getDepartmentForMajor = (majorCode) => {
    const major = majors.find(m => m.code === majorCode);
    if (!major) return '';
    
    const departmentCode = major.department;
    let departmentName = '';
    
    departments.forEach(faculty => {
      faculty.departments.forEach(department => {
        if (department.code === departmentCode) {
          departmentName = department.name;
        }
      });
    });
    
    return departmentName;
  };

  // Helper to get major name from code
  const getMajorName = (majorCode) => {
    const major = majors.find(m => m.code === majorCode);
    return major?.name || majorCode;
  };

  // Filter study spots by search term
  const filteredStudySpots = studyLocations.filter((spot) => {
    const searchTerm = locationSearch.toLowerCase();
    return (
      spot.name.toLowerCase().includes(searchTerm) ||
      (spot.features && spot.features.some((feature) => feature.toLowerCase().includes(searchTerm)))
    );
  });

  const handleSearchChange = (e) => {
    setLocationSearch(e.target.value);
  };

  const handleMarkerClick = (spot) => {
    setShowInfoWindow(spot.id);
    setCoordinates({ lat: spot.location.lat, lng: spot.location.lng });
    setMeetingLocation(spot.name);
  };

  const toggleMapType = () => {
    setMapType((prevType) => (prevType === 'roadmap' ? 'satellite' : 'roadmap'));
  };

  if (majorsModulesLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen dark:bg-ios-dark-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ios-blue dark:border-ios-teal"></div>
      </div>
    );
  }

  // Render step indicators
  const renderStepIndicators = () => {
    return (
      <div className="flex items-center justify-center mb-6">
        <div className={`h-2 w-2 md:w-3 md:h-3 rounded-full ${currentStep === 1 ? 'bg-ios-blue dark:bg-ios-teal' : 'bg-ios-gray4 dark:bg-ios-dark-secondary'}`}></div>
        <div className={`h-0.5 w-5 md:w-8 ${currentStep >= 2 ? 'bg-ios-blue dark:bg-ios-teal' : 'bg-ios-gray4 dark:bg-ios-dark-secondary'}`}></div>
        <div className={`h-2 w-2 md:w-3 md:h-3 rounded-full ${currentStep === 2 ? 'bg-ios-blue dark:bg-ios-teal' : 'bg-ios-gray4 dark:bg-ios-dark-secondary'}`}></div>
        <div className={`h-0.5 w-5 md:w-8 ${currentStep >= 3 ? 'bg-ios-blue dark:bg-ios-teal' : 'bg-ios-gray4 dark:bg-ios-dark-secondary'}`}></div>
        <div className={`h-2 w-2 md:w-3 md:h-3 rounded-full ${currentStep === 3 ? 'bg-ios-blue dark:bg-ios-teal' : 'bg-ios-gray4 dark:bg-ios-dark-secondary'}`}></div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-ios-gray6 dark:bg-ios-dark-bg px-4 py-6 transition-colors duration-200">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center mb-4">
          <button 
            onClick={() => navigate(-1)}
            className="mr-3 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-ios-dark-secondary transition-colors"
            aria-label="Go back"
          >
            <FaArrowLeft className="text-ios-blue dark:text-ios-teal" />
          </button>
          <h1 className="text-ios-title2 font-sf-pro text-black dark:text-ios-dark-text">Create Study Group</h1>
        </div>

        {renderStepIndicators()}
        
        {/* Success Message */}
        {success && (
          <div className="bg-green-100 border border-green-200 text-ios-green rounded-ios p-3 mb-4">
            {success}
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-200 text-ios-red rounded-ios p-3 mb-4">
            {error}
          </div>
        )}
        
        {/* Location Quick Info - Show if location was passed from MapView */}
        {location.state?.location && coordinates && (
          <div className="bg-ios-blue bg-opacity-5 dark:bg-opacity-20 ios-card dark:bg-ios-dark-elevated dark:border-ios-dark-border shadow-sm p-4 mb-4">
            <h2 className="text-ios-title3 font-sf-pro text-ios-blue dark:text-ios-teal mb-1">Location Selected</h2>
            <p className="text-ios-body font-medium dark:text-ios-dark-text">{meetingLocation}</p>
            <p className="text-ios-subhead text-ios-gray dark:text-ios-dark-text-secondary">
              Coordinates: {coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)}
            </p>
          </div>
        )}
        
        {/* Module Quick Info */}
        {selectedModule && (
          <div className="bg-ios-blue bg-opacity-5 dark:bg-opacity-20 ios-card dark:bg-ios-dark-elevated dark:border-ios-dark-border shadow-sm p-4 mb-4">
            <h2 className="text-ios-title3 font-sf-pro text-ios-blue dark:text-ios-teal mb-1">Creating a group for:</h2>
            <p className="text-ios-body font-medium dark:text-ios-dark-text">{selectedModule.name}</p>
            <p className="text-ios-subhead text-ios-gray dark:text-ios-dark-text-secondary">{selectedModule.code}</p>
          </div>
        )}
        
        {/* Form */}
        <div className="bg-white dark:bg-ios-dark-elevated ios-card dark:border-ios-dark-border shadow-sm p-6 mb-4 transition-colors duration-200">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h2 className="text-ios-headline font-medium dark:text-ios-dark-text mb-4">Basic Information</h2>
                
                {/* Group Name */}
                <div>
                  <label htmlFor="name" className="block text-ios-gray dark:text-ios-dark-text-secondary font-sf-pro-text text-ios-subhead mb-1">
                    Group Name*
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="ios-input w-full dark:bg-ios-dark-secondary dark:border-ios-dark-border dark:text-ios-dark-text"
                    placeholder="e.g., Data Structures Study Group"
                    disabled={loading}
                    required
                  />
                </div>

                {/* Major Selection - Show user's major by default */}
                <div>
                  <label htmlFor="major" className="block text-ios-gray dark:text-ios-dark-text-secondary font-sf-pro-text text-ios-subhead mb-1">
                    Program/Major
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <FaGraduationCap className="text-ios-gray dark:text-ios-dark-text-tertiary" />
                    </div>
                    {userProfile?.majorCode && !initialModuleCode ? (
                      <div className="ios-input w-full pl-10 dark:bg-ios-dark-secondary dark:border-ios-dark-border dark:text-ios-dark-text flex items-center">
                        <span className="mr-2">{getMajorName(userProfile.majorCode)}</span>
                        <span className="text-xs bg-ios-blue bg-opacity-10 dark:bg-ios-dark-tertiary px-2 py-0.5 rounded-full text-ios-blue dark:text-ios-teal">Your Major</span>
                      </div>
                    ) : (
                      <select
                        id="major"
                        value={selectedMajor}
                        onChange={handleMajorChange}
                        className="ios-input w-full pl-10 dark:bg-ios-dark-secondary dark:border-ios-dark-border dark:text-ios-dark-text"
                        disabled={loading || !!initialModuleCode}
                      >
                        <option value="">All Programs</option>
                        {majors.map((major) => (
                          <option key={major.code} value={major.code}>
                            {major.name} - {getDepartmentForMajor(major.code)}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  {initialModuleCode && (
                    <p className="text-ios-footnote text-ios-gray dark:text-ios-dark-text-tertiary mt-1">
                      Program pre-selected based on module
                    </p>
                  )}
                </div>
                
                {/* Module Selection - Show user's modules by default */}
                <div>
                  <label htmlFor="moduleCode" className="block text-ios-gray dark:text-ios-dark-text-secondary font-sf-pro-text text-ios-subhead mb-1">
                    Module*
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <FaBook className="text-ios-gray dark:text-ios-dark-text-tertiary" />
                    </div>
                    <select
                      id="moduleCode"
                      value={moduleCode}
                      onChange={handleModuleChange}
                      className="ios-input w-full pl-10 dark:bg-ios-dark-secondary dark:border-ios-dark-border dark:text-ios-dark-text"
                      disabled={loading || !!initialModuleCode}
                      required
                    >
                      <option value="">-- Select a Module --</option>
                      
                      {/* User's modules */}
                      {userModuleDetails.length > 0 && (
                        <optgroup label="Your Modules">
                          {userModuleDetails.map(module => (
                            <option key={`user-${module.code}`} value={module.code}>
                              {module.name} ({module.code})
                            </option>
                          ))}
                        </optgroup>
                      )}
                      
                      {/* Show option to see all modules */}
                      {!showAllModules && userModuleDetails.length > 0 && (
                        <option value="" disabled>
                          -------- Show all modules --------
                        </option>
                      )}
                      
                      {/* All modules for the selected major */}
                      {(showAllModules || userModuleDetails.length === 0) && (selectedMajor ? filteredModules : modules).length > 0 && (
                        <optgroup label={userModuleDetails.length ? "All Modules" : (selectedMajor ? `Modules for ${getMajorName(selectedMajor)}` : "All Modules")}>
                          {(selectedMajor ? filteredModules : modules).map(module => (
                            !userModules.includes(module.code) && (
                              <option key={module.code} value={module.code}>
                                {module.name} ({module.code})
                              </option>
                            )
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    {initialModuleCode ? (
                      <p className="text-ios-footnote text-ios-gray dark:text-ios-dark-text-tertiary">
                        Module pre-selected from previous page
                      </p>
                    ) : (
                      <>
                        <button 
                          type="button"
                          onClick={() => setShowAllModules(!showAllModules)}
                          className="text-ios-footnote text-ios-blue dark:text-ios-teal hover:underline"
                        >
                          {showAllModules ? "Show only my modules" : "Show all modules"}
                        </button>
                        {userModuleDetails.length === 0 && (
                          <Link to="/modules" className="text-ios-footnote text-ios-blue dark:text-ios-teal hover:underline">
                            Add modules to your profile
                          </Link>
                        )}
                      </>
                    )}
                  </div>
                </div>
                
                {/* Study Topic */}
                <div>
                  <label htmlFor="topic" className="block text-ios-gray dark:text-ios-dark-text-secondary font-sf-pro-text text-ios-subhead mb-1">
                    Study Topic (optional)
                  </label>
                  <input
                    id="topic"
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="ios-input w-full dark:bg-ios-dark-secondary dark:border-ios-dark-border dark:text-ios-dark-text"
                    placeholder="e.g., Final Exam Review, Assignment 3"
                    disabled={loading}
                  />
                </div>
                
                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-ios-gray dark:text-ios-dark-text-secondary font-sf-pro-text text-ios-subhead mb-1">
                    Description*
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="ios-input w-full h-24 resize-none dark:bg-ios-dark-secondary dark:border-ios-dark-border dark:text-ios-dark-text"
                    placeholder="Describe your study group's goals, what you'll be studying, etc."
                    disabled={loading}
                    required
                  />
                </div>
                
                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="ios-button px-6"
                    disabled={loading}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Meeting Details */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h2 className="text-ios-headline font-medium dark:text-ios-dark-text mb-4">Meeting Details</h2>
                
                <div>
                  <label htmlFor="meetingLocation" className="block text-ios-gray dark:text-ios-dark-text-secondary font-sf-pro-text text-ios-subhead mb-1">
                    Meeting Location
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <FaMapMarkerAlt className="text-ios-gray dark:text-ios-dark-text-tertiary" />
                    </div>
                    <input
                      id="meetingLocation"
                      type="text"
                      value={meetingLocation}
                      onChange={(e) => setMeetingLocation(e.target.value)}
                      className="ios-input w-full pl-10 dark:bg-ios-dark-secondary dark:border-ios-dark-border dark:text-ios-dark-text"
                      placeholder="e.g., Library, Room 204"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Study spot suggestions */}
                <div className="mb-4">
                  <h3 className="text-ios-subhead font-medium text-ios-gray dark:text-ios-dark-text-secondary mb-2">Suggested Locations:</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {filteredStudySpots.map((spot) => (
                      <button
                        key={spot.id}
                        type="button"
                        onClick={() => handlePredefinedLocation(spot)}
                        className={`text-left p-2 border rounded-md hover:bg-ios-blue-50 dark:hover:bg-ios-dark-secondary transition-colors ${
                          selectedPredefinedLocation?.id === spot.id 
                            ? 'border-ios-blue dark:border-ios-teal bg-ios-blue-50 dark:bg-opacity-10' 
                            : 'border-ios-gray4 dark:border-ios-dark-border dark:text-ios-dark-text-secondary'
                        }`}
                      >
                        <p className="font-medium dark:text-ios-dark-text">{spot.name}</p>
                        <p className="text-xs text-ios-gray dark:text-ios-dark-text-tertiary">
                          {spot.category && spot.category.charAt(0).toUpperCase() + spot.category.slice(1).replace('_', ' ')}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="meetingTime" className="block text-ios-gray dark:text-ios-dark-text-secondary font-sf-pro-text text-ios-subhead mb-1">
                    Meeting Time
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <FaClock className="text-ios-gray dark:text-ios-dark-text-tertiary" />
                    </div>
                    <input
                      id="meetingTime"
                      type="text"
                      value={meetingTime}
                      onChange={(e) => setMeetingTime(e.target.value)}
                      className="ios-input w-full pl-10 dark:bg-ios-dark-secondary dark:border-ios-dark-border dark:text-ios-dark-text"
                      placeholder="e.g., Tuesdays at 6pm, or December 15 at 3pm"
                      disabled={loading}
                    />
                  </div>
                </div>
                
                {/* Location Sharing Toggle */}
                <div className="bg-ios-gray6 dark:bg-ios-dark-secondary p-4 rounded-lg mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="flex items-center">
                        <h3 className="text-ios-body font-medium dark:text-ios-dark-text">Add Meeting Location to Map</h3>
                        <button 
                          type="button"
                          onClick={() => setIsLocationHelpVisible(!isLocationHelpVisible)}
                          className="ml-1 text-ios-blue dark:text-ios-teal"
                          aria-label="Show Location Help"
                        >
                          <FaInfoCircle size={16} />
                        </button>
                      </div>
                      <p className="text-ios-footnote text-ios-gray dark:text-ios-dark-text-tertiary">
                        Show your meeting spot on the map
                      </p>
                      {isLocationHelpVisible && (
                        <div className="bg-ios-blue-50 dark:bg-ios-dark-secondary border dark:border-ios-dark-border text-ios-blue dark:text-ios-teal p-2 rounded mt-1 text-xs">
                          Your study group will be visible on the map, making it easier for people to find you.
                        </div>
                      )}
                    </div>
                    <div className="relative inline-block w-12 align-middle select-none">
                      <input
                        type="checkbox"
                        name="useLocation"
                        id="useLocation"
                        checked={useLocation}
                        onChange={handleLocationToggle}
                        className="hidden"
                        disabled={loading}
                      />
                      <label
                        htmlFor="useLocation"
                        className={`block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-200 ease-in ${
                          useLocation ? 'bg-ios-blue dark:bg-ios-teal' : 'bg-ios-gray4 dark:bg-ios-dark-tertiary'
                        }`}
                      >
                        <span
                          className={`block h-6 w-6 rounded-full bg-white shadow transform transition-transform duration-200 ease-in ${
                            useLocation ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        ></span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Map for Choosing Location */}
                  {useLocation && (
                    <div className="mt-4 mb-4 border rounded-ios overflow-hidden dark:border-ios-dark-border">
                      <div className="search-bar mb-2">
                        <input
                          type="text"
                          placeholder="Search for study spots..."
                          value={locationSearch}
                          onChange={handleSearchChange}
                          className="ios-input w-full dark:bg-ios-dark-secondary dark:border-ios-dark-border dark:text-ios-dark-text"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={toggleMapType}
                        className="ios-button mb-2"
                      >
                        {mapType === 'roadmap' ? 'Switch to Satellite' : 'Switch to Roadmap'}
                      </button>
                      
                      {/* Only render map when API is loaded */}
                      {isLoaded && !loadError && (
                        <GoogleMap
                          mapContainerStyle={mapContainerStyle}
                          center={coordinates || { lat: 51.242, lng: -0.589 }}
                          zoom={15}
                          options={{
                            mapTypeId: mapType,
                            mapTypeControl: true,
                          }}
                          onClick={(e) => handleLocationSelect({ lat: e.latLng.lat(), lng: e.latLng.lng() })}
                        >
                          {/* Marker for selected location */}
                          {coordinates && (
                            <Marker
                              position={coordinates}
                              icon={{
                                url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
                                scaledSize: isLoaded ? new window.google.maps.Size(40, 40) : undefined
                              }}
                            />
                          )}

                          {/* Display study locations on the map */}
                          {filteredStudySpots.map((spot) => (
                            <Marker
                              key={spot.id}
                              position={{ lat: spot.location.lat, lng: spot.location.lng }}
                              onClick={() => handleMarkerClick(spot)}
                              icon={{
                                url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                                scaledSize: isLoaded ? new window.google.maps.Size(30, 30) : undefined
                              }}
                            >
                              {showInfoWindow === spot.id && (
                                <InfoWindow
                                  position={{ lat: spot.location.lat, lng: spot.location.lng }}
                                  onCloseClick={() => setShowInfoWindow(null)}
                                >
                                  <div>
                                    <h4>{spot.name}</h4>
                                    <p>{spot.description}</p>
                                  </div>
                                </InfoWindow>
                              )}
                            </Marker>
                          ))}
                        </GoogleMap>
                      )}
                      {loadError && (
                        <div className="bg-red-100 text-red-500 p-4 rounded text-center">
                          Error loading Google Maps: {loadError.message}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    className="ios-button-outline dark:border-ios-dark-tertiary dark:text-ios-dark-text"
                    disabled={loading}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="ios-button"
                    disabled={loading}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Group Settings */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h2 className="text-ios-headline font-medium dark:text-ios-dark-text mb-4">Group Settings</h2>

                {/* Visibility Settings */}
                <div>
                  <label className="block text-ios-gray dark:text-ios-dark-text-secondary font-sf-pro-text text-ios-subhead mb-2">
                    Group Visibility
                  </label>
                  <div className="space-y-3 mt-2">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="visibility-public"
                        name="visibility"
                        value="public"
                        checked={visibility === 'public'}
                        onChange={() => setVisibility('public')}
                        className="w-4 h-4 text-ios-blue focus:ring-ios-blue dark:text-ios-teal dark:focus:ring-ios-teal"
                        disabled={loading}
                      />
                      <label htmlFor="visibility-public" className="ml-2 block text-ios-body dark:text-ios-dark-text">
                        <span className="font-medium">Public</span>
                        <p className="text-ios-footnote text-ios-gray dark:text-ios-dark-text-secondary">Anyone can see and join this group</p>
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="visibility-major"
                        name="visibility"
                        value="major-only"
                        checked={visibility === 'major-only'}
                        onChange={() => setVisibility('major-only')}
                        className="w-4 h-4 text-ios-blue focus:ring-ios-blue dark:text-ios-teal dark:focus:ring-ios-teal"
                        disabled={loading}
                      />
                      <label htmlFor="visibility-major" className="ml-2 block text-ios-body dark:text-ios-dark-text">
                        <span className="font-medium">Major Only</span>
                        <p className="text-ios-footnote text-ios-gray dark:text-ios-dark-text-secondary">Only students in your major can see and join</p>
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="visibility-invite"
                        name="visibility"
                        value="invite-only"
                        checked={visibility === 'invite-only'}
                        onChange={() => setVisibility('invite-only')}
                        className="w-4 h-4 text-ios-blue focus:ring-ios-blue dark:text-ios-teal dark:focus:ring-ios-teal"
                        disabled={loading}
                      />
                      <label htmlFor="visibility-invite" className="ml-2 block text-ios-body dark:text-ios-dark-text">
                        <span className="font-medium">Invite Only</span>
                        <p className="text-ios-footnote text-ios-gray dark:text-ios-dark-text-secondary">Hidden from search; only those with a link can join</p>
                      </label>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="maxMembers" className="block text-ios-gray dark:text-ios-dark-text-secondary font-sf-pro-text text-ios-subhead mb-1">
                    Maximum Members
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <FaUser className="text-ios-gray dark:text-ios-dark-text-tertiary" />
                    </div>
                    <select
                      id="maxMembers"
                      value={maxMembers}
                      onChange={(e) => setMaxMembers(parseInt(e.target.value))}
                      className="ios-input w-full pl-10 dark:bg-ios-dark-secondary dark:border-ios-dark-border dark:text-ios-dark-text"
                      disabled={loading}
                    >
                      {[...Array(20)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1} {i === 0 ? 'member' : 'members'}
                        </option>
                      ))}
                      <option value={50}>50 members</option>
                      <option value={100}>100 members</option>
                    </select>
                  </div>
                </div>

                {/* Preview of key details */}
                <div className="bg-ios-gray6 dark:bg-ios-dark-secondary p-4 rounded-lg mt-6">
                  <h3 className="font-medium mb-2 dark:text-ios-dark-text">Group Summary</h3>
                  <ul className="space-y-2 text-ios-subhead">
                    <li className="flex gap-2">
                      <span className="font-medium dark:text-ios-dark-text">Name:</span>
                      <span className="text-ios-gray dark:text-ios-dark-text-secondary">{name}</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-medium dark:text-ios-dark-text">Module:</span>
                      <span className="text-ios-gray dark:text-ios-dark-text-secondary">{moduleCode} - {selectedModule?.name}</span>
                    </li>
                    {topic && (
                      <li className="flex gap-2">
                        <span className="font-medium dark:text-ios-dark-text">Topic:</span>
                        <span className="text-ios-gray dark:text-ios-dark-text-secondary">{topic}</span>
                      </li>
                    )}
                    {meetingLocation && (
                      <li className="flex gap-2">
                        <span className="font-medium dark:text-ios-dark-text">Location:</span>
                        <span className="text-ios-gray dark:text-ios-dark-text-secondary">{meetingLocation}</span>
                      </li>
                    )}
                    {meetingTime && (
                      <li className="flex gap-2">
                        <span className="font-medium dark:text-ios-dark-text">Meeting Time:</span>
                        <span className="text-ios-gray dark:text-ios-dark-text-secondary">{meetingTime}</span>
                      </li>
                    )}
                  </ul>
                </div>
                
                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    className="ios-button-outline dark:border-ios-dark-tertiary dark:text-ios-dark-text"
                    disabled={loading}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="ios-button flex items-center gap-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <>
                        <FaPlus size={12} />
                        <span>Create Group</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default GroupCreate;