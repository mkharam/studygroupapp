import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation as useRouterLocation } from 'react-router-dom';
import { ref, push, set } from 'firebase/database';
import { database } from '../../../firebase';
import { useAuth } from '../../../context/AuthContext';
import { useMajorsModules } from '../../../context/MajorsModulesContext';
import { useGoogleMaps } from '../../../context/GoogleMapsContext';
import { 
  FaBook, 
  FaMapMarkerAlt, 
  FaArrowLeft,
  FaInfoCircle,
  FaRegCalendarAlt
} from 'react-icons/fa';
import { allStudyLocations } from '../../../data/surreyLocations';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';

// Map container style
const mapContainerStyle = {
  width: '100%',
  height: '300px',
};

function GroupCreate() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useRouterLocation();
  const { isLoaded, loadError } = useGoogleMaps();
  const { modules } = useMajorsModules();
  
  // Get module code from URL if coming from MyModules
  const initialModuleCode = searchParams.get('moduleCode');
  
  // Form states
  const [name, setName] = useState('');
  const [moduleCode, setModuleCode] = useState(initialModuleCode || '');
  const [description, setDescription] = useState('');
  const [meetingLocation, setMeetingLocation] = useState('');
  const [maxMembers, setMaxMembers] = useState(10);
  const [coordinates, setCoordinates] = useState(null);
  const [visibility, setVisibility] = useState('public');
  const [selectedModule, setSelectedModule] = useState(null);
  const [useLocation, setUseLocation] = useState(false);
  const [isLocationHelpVisible, setIsLocationHelpVisible] = useState(false);
  const [studyLocations, setStudyLocations] = useState([]);
  const [filteredStudyLocations, setFilteredStudyLocations] = useState([]);
  const [locationSearch, setLocationSearch] = useState('');
  const [mapType, setMapType] = useState('roadmap');
  const [selectedPredefinedLocation, setSelectedPredefinedLocation] = useState(null);
  const [showInfoWindow, setShowInfoWindow] = useState(null);

  // Calendar and meeting states
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTimeHour, setMeetingTimeHour] = useState('15');
  const [meetingTimeMinute, setMeetingTimeMinute] = useState('00');
  const [meetingTimeAmPm, setMeetingTimeAmPm] = useState('PM');
  const [addToCalendar, setAddToCalendar] = useState(true);
  const [recurringMeeting, setRecurringMeeting] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState('weekly');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [isPrivate, setIsPrivate] = useState(false);

  // Check if location data passed from MapView
  useEffect(() => {
    if (location.state?.location) {
      const { coordinates, address } = location.state.location;
      if (coordinates) {
        console.log('Location coordinates received from MapView:', coordinates);
        setCoordinates(coordinates);
        setUseLocation(true);
      }
      if (address) {
        console.log('Location address received from MapView:', address);
        setMeetingLocation(address);
      }
      
      // If we're coming directly from the map, let's auto-set to step 2 
      // to skip the basic info if we already have a module selected
      if (moduleCode && modules.find(m => m.code === moduleCode)) {
        console.log('Module already selected, skipping to location step');
        if (currentStep === 1) {
          setCurrentStep(2);
        }
      }
    }
  }, [location.state, moduleCode, modules, currentStep]);
  
  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { state: { from: { pathname: '/groups/create' } } });
    }
  }, [currentUser, navigate]);
  
  // Load study locations from data
  useEffect(() => {
    setStudyLocations(allStudyLocations);
    setFilteredStudyLocations(allStudyLocations);
  }, []);
    // Set pre-selected module when initialModuleCode is provided
  useEffect(() => {
    if (initialModuleCode && modules && modules.length > 0) {
      console.log('Module code received from MyModules:', initialModuleCode);
      const foundModule = modules.find(m => m.code === initialModuleCode);
      if (foundModule) {
        setSelectedModule(foundModule);
        // Auto-generate group name based on module
        setName(`${foundModule.name} Study Group`);
        // Create a more comprehensive description
        setDescription(`A study group for ${foundModule.code}: ${foundModule.name}. Join us to prepare for assignments, exams, and collaborate on coursework. We'll share notes, practice questions, and support each other throughout the semester.`);
      }
    }
  }, [initialModuleCode, modules]);
  
  // Add effect to handle location selected from MapPage
  useEffect(() => {
    if (location.state && location.state.location) {
      const { lat, lng, address } = location.state.location;
      setCoordinates({ lat, lng });
      setMeetingLocation(address || `${lat}, ${lng}`);
    }
  }, [location.state]);
  
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
  const handleLocationToggle = () => {
    const newState = !useLocation;
    setUseLocation(newState);
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
        
        // Update name suggestion
        if (!name || name === `${selectedModule?.name} Study Group`) {
          setName(`${foundModule.name} Study Group`);
        }
        
        // Update description suggestion with more comprehensive text
        if (!description || description === `A study group for ${selectedModule?.code}: ${selectedModule?.name}. Join us to prepare for assignments, exams, and collaborate on coursework.`) {
          setDescription(`A study group for ${foundModule.code}: ${foundModule.name}. Join us to prepare for assignments, exams, and collaborate on coursework. We'll share notes, practice questions, and support each other throughout the semester.`);
        }
      }
    } else {
      setSelectedModule(null);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      navigate('/login', { state: { from: { pathname: '/groups/create' } } });
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Format time for database
      const formattedTime = formatTimeFor24Hour();
      
      // Create group data object
      const groupData = {
        name,
        moduleCode,
        moduleName: selectedModule?.name || '',
        description,
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString(),
        maxMembers: parseInt(maxMembers),
        isPrivate: isPrivate,
        memberCount: 1,
        members: {
          [currentUser.uid]: {
            role: 'admin',
            joinedAt: new Date().toISOString(),
            name: userProfile?.name || currentUser.displayName || 'User'
          }
        }
      };
      
      // Add meeting date if specified
      if (meetingDate) {
        groupData.meetingDate = meetingDate;
      }
      
      // Add location only if specified
      if (meetingLocation) {
        groupData.location = meetingLocation;
      }
      
      // Add coordinates if using location
      if (useLocation && coordinates) {
        groupData.coordinates = coordinates;
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
      const groupId = newGroupRef.key;
      
      // Log the group data before saving
      console.log('Creating group with data:', groupData);
      
      await set(newGroupRef, groupData);
      
      // If we have a meeting date and want to add to calendar, create a meeting
      if (meetingDate && addToCalendar) {
        try {
          const meetingsRef = ref(database, 'meetings');
          
          // Create meeting data
          const meetingData = {
            title: name,
            date: meetingDate,
            time: formattedTime,
            groupId,
            groupName: name,
            moduleCode,
            moduleName: selectedModule?.name || '',
            createdBy: currentUser.uid,
            createdAt: new Date().toISOString(),
            participants: {
              [currentUser.uid]: true
            },
            note: description.substring(0, 200) // First 200 chars of description
          };
          
          // Add location only if specified
          if (meetingLocation) {
            meetingData.location = meetingLocation;
          }
          
          // Add coordinates if using location
          if (useLocation && coordinates) {
            meetingData.coordinates = coordinates;
          }
          
          // Create the meeting
          const newMeetingRef = push(meetingsRef);
          await set(newMeetingRef, meetingData);
          
          // If this is a recurring meeting, create additional meetings
          if (recurringMeeting) {
            const baseDate = new Date(meetingDate);
            
            // Determine end date (default to 3 months from start if not specified)
            const endDate = recurrenceEndDate ? new Date(recurrenceEndDate) : new Date(baseDate);
            if (!recurrenceEndDate) {
              endDate.setMonth(endDate.getMonth() + 3);
            }
            
            // Calculate interval for recurrence pattern
            let dayInterval = 7; // default to weekly
            switch (recurrencePattern) {
              case 'daily':
                dayInterval = 1;
                break;
              case 'weekly':
                dayInterval = 7;
                break;
              case 'biweekly':
                dayInterval = 14;
                break;
              case 'monthly':
                dayInterval = 30;
                break;
              default:
                dayInterval = 7; // Default to weekly
                break;
            }
            
            // Create recurring meetings
            const nextDate = new Date(baseDate);
            nextDate.setDate(nextDate.getDate() + dayInterval); // Start with second occurrence
            
            while (nextDate <= endDate) {
              const recurringMeetingData = {
                ...meetingData,
                date: nextDate.toISOString().split('T')[0],
                isRecurring: true,
                recurrencePattern: recurrencePattern,
                originalMeetingId: newMeetingRef.key
              };
              
              // Add recurring meeting to database
              const recurringMeetingRef = push(meetingsRef);
              await set(recurringMeetingRef, recurringMeetingData);
              
              // Move to next occurrence
              nextDate.setDate(nextDate.getDate() + dayInterval);
            }
          }
        } catch (error) {
          console.error('Error creating meeting:', error);
          // Don't fail the group creation if meeting creation fails
        }
      }
      
      // Show success
      const calendarMessage = meetingDate && addToCalendar 
        ? recurringMeeting 
          ? ` with ${recurrencePattern} study sessions added to your calendar` 
          : ' with a study session added to your calendar'
        : '';
        
      const locationMessage = useLocation && coordinates
        ? ' Your group location has been marked on the campus map.'
        : '';
        
      setSuccess(`Study group "${name}" for ${selectedModule?.code} created successfully!${calendarMessage}${locationMessage} You can view and manage your group from the dashboard.`);
      
      // Navigate to the new group after a short delay
      setTimeout(() => {
        navigate(`/groups/${groupId}`);
      }, 3000);
    } catch (error) {
      console.error('Error creating group:', error);
      setError('Failed to create group. Please try again.');
      setLoading(false);
    }
  };
  
  // Filter study spots by search term
  useEffect(() => {
    const filtered = studyLocations.filter((spot) => {
      const searchTerm = locationSearch.toLowerCase();
      return (
        spot.name.toLowerCase().includes(searchTerm) ||
        (spot.features && spot.features.some((feature) => feature.toLowerCase().includes(searchTerm)))
      );
    });
    setFilteredStudyLocations(filtered);
  }, [locationSearch, studyLocations]);
  
  const handleSearchChange = (e) => {
    setLocationSearch(e.target.value);
  };
    const handleMarkerClick = (spot) => {
    setShowInfoWindow(spot.id);
    setCoordinates({ lat: spot.location.lat, lng: spot.location.lng });
    setMeetingLocation(spot.name);
  };
  
  // Change map type between roadmap and satellite
  const toggleMapType = () => {
    setMapType((prevType) => (prevType === 'roadmap' ? 'satellite' : 'roadmap'));
  };
  
  // Format time for 24 hour format
  const formatTimeFor24Hour = () => {
    let hour = parseInt(meetingTimeHour);
    
    // Convert to 24-hour format if PM
    if (meetingTimeAmPm === 'PM' && hour < 12) {
      hour += 12;
    }
    
    // Handle 12 AM case
    if (meetingTimeAmPm === 'AM' && hour === 12) {
      hour = 0;
    }
    
    return `${hour.toString().padStart(2, '0')}:${meetingTimeMinute}`;
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
    
    // Remove location validation since it's now optional
    if (useLocation && coordinates) {
      // Only validate coordinates if location sharing is enabled
      if (!coordinates.lat || !coordinates.lng) {
        setError('Please select a valid location on the map');
        return false;
      }
    }
    
    if (meetingDate) {
      // Validate meeting date is not in the past
      const selectedDate = new Date(meetingDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        setError('Meeting date cannot be in the past');
        return false;
      }
      
      // Additional validation for recurring meetings
      if (recurringMeeting) {
        if (recurrenceEndDate) {
          const endDate = new Date(recurrenceEndDate);
          
          if (endDate < selectedDate) {
            setError('Recurrence end date must be after the first meeting date');
            return false;
          }
          
          // Ensure end date isn't more than a year away for performance reasons
          const oneYearLater = new Date(today);
          oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
          
          if (endDate > oneYearLater) {
            setError('Recurrence end date cannot be more than one year in the future');
            return false;
          }
        }
        
        // If daily recurrence pattern, check if there will be too many meetings
        if (recurrencePattern === 'daily') {
          const endDate = recurrenceEndDate ? new Date(recurrenceEndDate) : new Date(selectedDate);
          if (!recurrenceEndDate) {
            endDate.setMonth(endDate.getMonth() + 3); // Default 3 months
          }
          
          const diffTime = Math.abs(endDate - selectedDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
          
          if (diffDays > 60) {
            setError('Daily recurrence pattern can only be used for a maximum of 60 days');
            return false;
          }
        }
      }
    }
    
    return true;
  };
  
  // Move to next step
  const handleNextStep = () => {
    setCurrentStep(currentStep + 1);
  };
  
  // Move to previous step
  const handlePreviousStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const onMapClick = (e) => {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode(
      { location: { lat: e.latLng.lat(), lng: e.latLng.lng() } },
      (results, status) => {
        if (status === "OK" && results[0]) {
          setCoordinates({
            lat: e.latLng.lat(),
            lng: e.latLng.lng(),
            name: results[0].formatted_address,
            address: results[0].formatted_address,
            placeId: results[0].place_id
          });
          setMeetingLocation(results[0].formatted_address);
        }
      }
    );
  };

  // Add effect to handle userProfile changes
  useEffect(() => {
    if (!userProfile) {
      console.log('Waiting for user profile to load...');
    }
  }, [userProfile]);

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-ios-gray6 dark:bg-ios-dark-bg px-4 py-6 transition-colors duration-200">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-ios-blue dark:text-ios-teal hover:underline"
          >
            <FaArrowLeft className="mr-2" /> Back
          </button>
        </div>
        
        <h1 className="text-ios-largetitle font-sf-pro-display font-semibold text-black dark:text-ios-dark-text mb-2">
          Create a Study Group
        </h1>
        
        <p className="text-ios-subhead text-ios-gray dark:text-ios-dark-text-secondary mb-6">
          Form a group to study together with your classmates
        </p>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900 dark:bg-opacity-20 p-4 rounded-ios mb-6 border border-red-200 dark:border-red-800">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 dark:bg-green-900 dark:bg-opacity-20 p-4 rounded-ios mb-6 border border-green-200 dark:border-green-800">
            <p className="text-green-600 dark:text-green-400">{success}</p>
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
            {currentStep === 1 && (
              <div className="space-y-4">
                <h2 className="text-ios-headline font-medium dark:text-ios-dark-text mb-4">
                  Basic Information
                </h2>
                
                {/* Group Name */}
                <div>
                  <label htmlFor="name" className="block text-ios-gray dark:text-ios-dark-text-secondary font-sf-pro-text text-ios-subhead mb-1">
                    Group Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="ios-input w-full dark:bg-ios-dark-secondary dark:border-ios-dark-border dark:text-ios-dark-text"
                    placeholder="e.g., Web Development Study Group"
                    disabled={loading}
                    required
                  />
                </div>
                
                {/* Module Selection */}
                <div>
                  <label htmlFor="moduleCode" className="block text-ios-gray dark:text-ios-dark-text-secondary font-sf-pro-text text-ios-subhead mb-1">
                    Module
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
                      disabled={loading || initialModuleCode}
                      required
                    >
                      <option value="">Select a module</option>
                      {modules && userProfile && (
                        <>
                          {/* User's Major Modules */}
                          <optgroup label="Your Modules">
                            {modules
                              .filter(module => module.programs?.includes(userProfile.majorCode))
                              .sort((a, b) => a.code.localeCompare(b.code))
                              .map(module => (
                        <option key={module.code} value={module.code}>
                          {module.code}: {module.name}
                        </option>
                      ))}
                          </optgroup>
                          
                          {/* Other Modules */}
                          <optgroup label="Other Modules">
                            {modules
                              .filter(module => !module.programs?.includes(userProfile.majorCode))
                              .sort((a, b) => a.code.localeCompare(b.code))
                              .map(module => (
                                <option key={module.code} value={module.code}>
                                  {module.code}: {module.name}
                                </option>
                              ))}
                          </optgroup>
                        </>
                      )}
                    </select>
                  </div>
                </div>
                
                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-ios-gray dark:text-ios-dark-text-secondary font-sf-pro-text text-ios-subhead mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="ios-input w-full h-24 resize-none dark:bg-ios-dark-secondary dark:border-ios-dark-border dark:text-ios-dark-text"
                    placeholder="Describe your study group's goals, what you'll be studying, etc."
                    disabled={loading}
                    required
                  />
                </div>
                
                {/* Max Members */}
                <div>
                  <label htmlFor="maxMembers" className="block text-ios-gray dark:text-ios-dark-text-secondary font-sf-pro-text text-ios-subhead mb-1">
                    Maximum Members
                  </label>
                  <input
                    id="maxMembers"
                    type="number"
                    min="2"
                    max="50"
                    value={maxMembers}
                    onChange={(e) => setMaxMembers(parseInt(e.target.value))}
                    className="ios-input w-full dark:bg-ios-dark-secondary dark:border-ios-dark-border dark:text-ios-dark-text"
                    disabled={loading}
                  />
                </div>
                
                {/* Private Group Toggle */}
                <div className="mb-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                      type="checkbox"
                      checked={isPrivate}
                      onChange={(e) => {
                        console.log('Setting isPrivate to:', e.target.checked);
                        setIsPrivate(e.target.checked);
                      }}
                      className="ios-checkbox"
                      />
                    <span className="text-ios-body dark:text-white">Make this a private group (requires admin approval to join)</span>
                    </label>
                  <p className="text-ios-footnote text-ios-gray dark:text-gray-400 mt-1">
                    Private groups require admin approval for new members to join. This helps maintain a focused study environment.
                  </p>
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
            
            {currentStep === 2 && (
              <div className="space-y-4">
                <h2 className="text-ios-headline font-medium dark:text-ios-dark-text mb-4">
                  Meeting Details
                </h2>
                
                <div>
                  <label htmlFor="meetingLocation" className="block text-ios-gray dark:text-ios-dark-text-secondary font-sf-pro-text text-ios-subhead mb-1">
                    Meeting Location (Optional)
                  </label>
                  <div className="relative flex items-center gap-2">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <FaMapMarkerAlt className="text-ios-gray dark:text-ios-dark-text-tertiary" />
                    </div>
                    <input
                      id="meetingLocation"
                      type="text"
                      value={meetingLocation}
                      onChange={(e) => setMeetingLocation(e.target.value)}
                      className="ios-input w-full pl-10 dark:bg-ios-dark-secondary dark:border-ios-dark-border dark:text-ios-dark-text"
                      placeholder="e.g., Library, Room 204 (Optional)"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="ml-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded"
                      onClick={() => navigate('/map/select')}
                      disabled={loading}
                    >
                      Choose on Map
                    </button>
                  </div>
                </div>
                
                {/* Location Sharing Toggle */}
                <div className="bg-ios-gray6 dark:bg-ios-dark-secondary p-4 rounded-lg mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="flex items-center">
                        <h3 className="text-ios-body font-medium dark:text-ios-dark-text">Add Meeting Location to Map (Optional)</h3>
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
                        Show your meeting spot on the map (optional)
                      </p>
                      {isLocationHelpVisible && (
                        <div className="bg-ios-blue-50 dark:bg-ios-dark-secondary border dark:border-ios-dark-border text-ios-blue dark:text-ios-teal p-2 rounded mt-1 text-xs">
                          Your study group will be visible on the map, making it easier for people to find you. This is optional and can be added later.
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
                        {/* Map View */}
                      {isLoaded && !loadError && (
                        <div style={mapContainerStyle}>
                          <GoogleMap
                            mapContainerStyle={mapContainerStyle}
                            center={coordinates || { lat: 51.242, lng: -0.589 }} // University of Surrey coordinates
                            zoom={15}
                            options={{
                              mapTypeId: mapType,
                              mapTypeControl: true,
                              streetViewControl: false,
                              fullscreenControl: false,
                              zoomControlOptions: {
                                position: window.google?.maps?.ControlPosition?.RIGHT_CENTER
                              }
                            }}
                            onClick={onMapClick}
                          >
                            {/* Map type control */}
                            <div className="absolute top-2 right-2 bg-white dark:bg-ios-dark-secondary rounded-md shadow-md z-10">
                              <button 
                                onClick={toggleMapType}
                                className="p-2 text-ios-blue dark:text-ios-teal rounded-md" 
                                title={mapType === 'roadmap' ? 'Switch to satellite view' : 'Switch to map view'}
                              >
                                {mapType === 'roadmap' ? 'Satellite' : 'Map'}
                              </button>
                            </div>

                            {/* Predefined study spots */}
                            {filteredStudyLocations.map((spot) => (
                              <Marker
                                key={spot.id}
                                position={{
                                  lat: spot.location.lat,
                                  lng: spot.location.lng
                                }}
                                onClick={() => handleMarkerClick(spot)}
                                icon={{
                                  url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                                  scaledSize: new window.google.maps.Size(32, 32)
                                }}
                              >
                                {showInfoWindow === spot.id && (
                                  <InfoWindow onCloseClick={() => setShowInfoWindow(null)}>
                                    <div>
                                      <h3 className="font-bold">{spot.name}</h3>
                                      <p className="text-sm">{spot.category}</p>
                                      {spot.features && (
                                        <div className="mt-1">
                                          <p className="text-xs text-gray-600">Features:</p>
                                          <ul className="text-xs">
                                            {spot.features.map((feature, idx) => (
                                              <li key={idx}>• {feature}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                      <button
                                        onClick={() => {
                                          handlePredefinedLocation(spot);
                                          setShowInfoWindow(null);
                                        }}
                                        className="mt-2 bg-ios-blue text-white px-2 py-1 rounded text-xs"
                                      >
                                        Select This Location
                                      </button>
                                    </div>
                                  </InfoWindow>
                                )}
                              </Marker>
                            ))}
                            
                            {/* Selected location marker */}
                            {coordinates && (
                              <Marker
                                position={coordinates}
                                icon={{
                                  url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
                                  scaledSize: new window.google.maps.Size(40, 40)
                                }}
                              />
                            )}
                          </GoogleMap>
                        </div>
                      )}
                      
                      {loadError && (
                        <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                          <p className="text-red-500 dark:text-red-400">
                            Error loading map: {loadError.message}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                  {/* Meeting Date and Calendar Options */}
                <div className="mt-6 space-y-4">
                  <div className="border border-gray-300 dark:border-gray-600 p-4 rounded-lg space-y-4">                    <div className="flex items-center justify-between">
                      <h3 className="text-md font-medium flex items-center">
                        <FaRegCalendarAlt className="mr-2 text-ios-blue dark:text-ios-teal" />
                        Schedule Study Sessions
                      </h3>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="enableCalendar"
                          checked={meetingDate !== ''}
                          onChange={(e) => {
                            if (!e.target.checked) {
                              setMeetingDate('');
                            } else {
                              // Set default to tomorrow
                              const tomorrow = new Date();
                              tomorrow.setDate(tomorrow.getDate() + 1);
                              setMeetingDate(tomorrow.toISOString().split('T')[0]);
                            }
                          }}
                          className="sr-only"
                          disabled={loading}
                        />
                        <label
                          htmlFor="enableCalendar"
                          className={`block overflow-hidden h-6 rounded-full w-12 cursor-pointer transition-colors duration-200 ease-in ${
                            meetingDate !== '' ? 'bg-ios-blue dark:bg-ios-teal' : 'bg-ios-gray4 dark:bg-ios-dark-tertiary'
                          }`}
                        >
                          <span
                            className={`block h-6 w-6 rounded-full bg-white shadow transform transition-transform duration-200 ease-in ${
                              meetingDate !== '' ? 'translate-x-6' : 'translate-x-0'
                            }`}
                          ></span>
                        </label>
                      </div>
                    </div>
                      {/* Only show date fields if calendar is enabled */}
                    {meetingDate !== '' && (
                      <div className="space-y-4">
                        <div className="bg-ios-gray6 dark:bg-ios-dark-secondary p-3 rounded-md">
                          <p className="text-xs text-ios-gray dark:text-ios-dark-text-secondary mb-2">
                            Scheduled study sessions will appear in your dashboard calendar and other group members can join these sessions. These calendar events help everyone coordinate attendance.
                          </p>
                        </div>
                        
                        <div>
                          <label htmlFor="meetingDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            First Meeting Date
                          </label>
                          <input
                            type="date"
                            id="meetingDate"
                            value={meetingDate}
                            onChange={(e) => setMeetingDate(e.target.value)}
                            className="ios-input w-full dark:bg-ios-dark-secondary dark:border-ios-dark-border dark:text-ios-dark-text"
                            min={new Date().toISOString().split('T')[0]} // Can't select dates in the past
                            disabled={loading}
                          />
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="addToCalendar"
                            checked={addToCalendar}
                            onChange={(e) => setAddToCalendar(e.target.checked)}
                            className="h-4 w-4 text-ios-blue focus:ring-ios-blue border-gray-300 rounded dark:border-gray-600 dark:bg-ios-dark-secondary"
                          />
                          <label htmlFor="addToCalendar" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                            Add study sessions to dashboard calendar
                          </label>
                        </div>
                          <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="recurringMeeting"
                            checked={recurringMeeting}
                            onChange={(e) => setRecurringMeeting(e.target.checked)}
                            className="h-4 w-4 text-ios-blue focus:ring-ios-blue border-gray-300 rounded dark:border-gray-600 dark:bg-ios-dark-secondary"
                          />
                          <label htmlFor="recurringMeeting" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                            Create recurring study sessions
                          </label>
                        </div>
                        
                        {recurringMeeting && (
                          <div className="pl-6 border-l-2 border-ios-blue dark:border-ios-teal space-y-3">
                            <div className="bg-gray-50 dark:bg-ios-dark-secondary p-2 rounded text-xs text-gray-500 dark:text-gray-400">
                              Recurring sessions will be visible in the dashboard calendar for all group members.
                            </div>
                          
                            <div>
                              <label htmlFor="recurrencePattern" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Repeat Frequency
                              </label>
                              <select
                                id="recurrencePattern"
                                value={recurrencePattern}
                                onChange={(e) => setRecurrencePattern(e.target.value)}
                                className="ios-input w-full dark:bg-ios-dark-secondary dark:border-ios-dark-border dark:text-ios-dark-text"
                                disabled={loading}
                              >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="biweekly">Bi-weekly</option>
                                <option value="monthly">Monthly</option>
                              </select>
                            </div>
                            
                            <div>
                              <label htmlFor="recurrenceEndDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                End Date (optional)
                              </label>
                              <input
                                type="date"
                                id="recurrenceEndDate"
                                value={recurrenceEndDate}
                                onChange={(e) => setRecurrenceEndDate(e.target.value)}
                                className="ios-input w-full dark:bg-ios-dark-secondary dark:border-ios-dark-border dark:text-ios-dark-text"
                                min={meetingDate} // Can't be before the start date
                                disabled={loading}
                              />
                              <p className="text-xs text-ios-gray dark:text-ios-dark-text-secondary mt-1">
                                If not specified, recurring sessions will be created for 3 months
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Time Picker Component */}
                <div className="mt-3">
                  <label className="block text-ios-gray dark:text-ios-dark-text-secondary font-sf-pro-text text-ios-subhead mb-1">
                    Specific Meeting Time
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label htmlFor="meetingTimeHour" className="sr-only">Hour</label>
                      <select
                        id="meetingTimeHour"
                        value={meetingTimeHour}
                        onChange={(e) => setMeetingTimeHour(e.target.value)}
                        className="ios-input w-full dark:bg-ios-dark-secondary dark:border-ios-dark-border dark:text-ios-dark-text"
                        disabled={loading}
                      >
                        {[...Array(12)].map((_, i) => (
                          <option key={i} value={(i === 0 ? 12 : i).toString()}>
                            {i === 0 ? 12 : i}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="meetingTimeMinute" className="sr-only">Minute</label>
                      <select
                        id="meetingTimeMinute"
                        value={meetingTimeMinute}
                        onChange={(e) => setMeetingTimeMinute(e.target.value)}
                        className="ios-input w-full dark:bg-ios-dark-secondary dark:border-ios-dark-border dark:text-ios-dark-text"
                        disabled={loading}
                      >
                        {['00', '15', '30', '45'].map((min) => (
                          <option key={min} value={min}>
                            {min}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="meetingTimeAmPm" className="sr-only">AM/PM</label>
                      <select
                        id="meetingTimeAmPm"
                        value={meetingTimeAmPm}
                        onChange={(e) => setMeetingTimeAmPm(e.target.value)}
                        className="ios-input w-full dark:bg-ios-dark-secondary dark:border-ios-dark-border dark:text-ios-dark-text"
                        disabled={loading}
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-xs text-ios-gray dark:text-ios-dark-text-tertiary mt-1">
                    This time will be added to the calendar if a meeting date is selected
                  </p>
                </div>
                
                <div className="pt-6 flex justify-between">
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    className="text-ios-blue dark:text-ios-teal hover:underline"
                    disabled={loading}
                  >
                    &larr; Back
                  </button>
                  <button
                    type="submit"
                    className="ios-button px-6"
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create Group'}
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