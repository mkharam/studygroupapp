import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMajorsModules } from '../../context/MajorsModulesContext';
import { useTheme } from '../../context/ThemeContext';
import { associateModulesWithUser } from '../../utils/catalogueTransformer';

function Profile() {
  const { currentUser, userProfile, updateUserProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { majors, modules, departments, loading: majorsLoading } = useMajorsModules();
  const { theme } = useTheme();
  
  // Check if we're coming from My Modules page with a request to select major
  const showMajorAlert = location.state?.showMajorAlert;
  const activeSection = location.state?.section || 'personal';
  
  // Form states
  const [name, setName] = useState('');
  const [major, setMajor] = useState('');
  const [bio, setBio] = useState('');
  const [year, setYear] = useState('');
  const [locationSharing, setLocationSharing] = useState(false);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [modulePreviewExpanded, setModulePreviewExpanded] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [selectedModuleYear, setSelectedModuleYear] = useState('');
  const [majorSelectionHighlighted, setMajorSelectionHighlighted] = useState(showMajorAlert);
  
  // Filter majors based on search term
  const filteredMajors = searchTerm
    ? majors.filter(major => 
        major.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        major.code.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : majors;

  // Get modules based on selected major and year
  const relevantModules = modules.filter(module => {
    if (!major && !year) return false;
    
    const majorMatch = !major || (module.programs && module.programs.includes(major));
    const yearMatch = !selectedModuleYear 
      ? (!year || module.year === parseInt(year))
      : module.year === parseInt(selectedModuleYear);
    
    return majorMatch && yearMatch;
  }).slice(0, modulePreviewExpanded ? 20 : 5);
  
  // Group modules by year for the preview section
  const modulesByYear = modules
    .filter(module => major && module.programs && module.programs.includes(major))
    .reduce((acc, module) => {
      const year = module.year || 'Unknown';
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(module);
      return acc;
    }, {});
  
  // Populate form with existing user profile data
  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      setMajor(userProfile.majorCode || '');
      setBio(userProfile.bio || '');
      setYear(userProfile.year || '');
      setLocationSharing(userProfile.locationSharing || false);
    }
  }, [userProfile]);

  // When coming from My Modules, automatically scroll to major selection
  useEffect(() => {
    if (showMajorAlert && !major) {
      // Focus on major search input after a short delay to ensure rendering
      setTimeout(() => {
        const majorSearchElement = document.getElementById('majorSearch');
        if (majorSearchElement) {
          majorSearchElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          majorSearchElement.focus();
        }
      }, 500);
    }
  }, [showMajorAlert, major]);
  
  // Validate form fields
  const validateForm = () => {
    const newErrors = {};
    
    // Validate name (required)
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    // Validate bio (optional but limit length)
    if (bio.trim().length > 500) {
      newErrors.bio = 'Bio must be less than 500 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle profile update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setUpdateSuccess(false);

    if (!validateForm()) {
        return;
    }

    try {
        setLoading(true);

        // Get previous major to check if it changed
        const previousMajor = userProfile?.majorCode || '';
        const majorChanged = major !== previousMajor;

        const profileData = {
            name: name.trim() || 'User',
            bio: bio.trim() || '',
            year: year || '',
            locationSharing: Boolean(locationSharing)
        };

        if (major && typeof major === 'string') {
            profileData.majorCode = major;
            const selectedMajor = majors.find(m => m.code === major);
            if (selectedMajor) {
                profileData.majorName = selectedMajor.name;
            }
        }

        await updateUserProfile(profileData);

        // Only update modules if major has changed
        if (majorChanged && major) {
            // Pass the modules list to the function
            await associateModulesWithUser(currentUser.uid, major, modules);
        }

        setUpdateSuccess(true);
        
        // If we came from My Modules and selected a major, redirect back after update
        if (showMajorAlert && major) {
            setTimeout(() => {
                navigate('/my-modules');
            }, 1500);
        } else {
            // Clear success message after 3 seconds
            setTimeout(() => {
                setUpdateSuccess(false);
            }, 3000);
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        setErrors({ submit: 'Failed to update profile.' });
    } finally {
        setLoading(false);
    }
  };
  
  // Handle logout with confirmation
  const handleLogout = async () => {
    setShowLogoutModal(true);
  };
  
  // Confirm logout action
  const confirmLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      setErrors({ submit: 'Failed to log out' });
    } finally {
      setShowLogoutModal(false);
    }
  };
  
  // Get department and faculty info for a major
  const getMajorInfo = (majorCode) => {
    const majorData = majors.find(m => m.code === majorCode);
    if (!majorData) return { departmentName: 'Unknown', facultyName: 'Unknown' };
    
    const departmentName = departments
      .flatMap(faculty => faculty.departments)
      .find(dep => dep.code === majorData.department)?.name || 'Unknown Department';
      
    const facultyName = departments
      .find(faculty => faculty.code === majorData.faculty)?.name || 'Unknown Faculty';
      
    return { departmentName, facultyName };
  };
  
  // Redirect if not logged in
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-ios-gray6 dark:bg-ios-dark-bg text-black dark:text-white flex flex-col justify-center items-center px-4 py-12">
        <p className="text-ios-headline mb-4">You need to be logged in to view your profile.</p>
        <button
          onClick={() => navigate('/login')}
          className="ios-button bg-ios-blue dark:bg-ios-blue-dark text-white px-6 py-2 rounded-md"
        >
          Sign In
        </button>
      </div>
    );
  }

  if (majorsLoading) {
    return (
      <div className="min-h-screen bg-ios-gray6 dark:bg-ios-dark-bg text-black dark:text-white flex flex-col justify-center items-center px-4 py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ios-blue dark:border-ios-blue-dark"></div>
        <p className="text-ios-subhead mt-4">Loading profile data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ios-gray6 dark:bg-ios-dark-bg text-black dark:text-white px-4 py-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-ios-large-title font-sf-pro text-black dark:text-white mb-6">Profile</h1>
        
        {/* Success Message */}
        {updateSuccess && (
          <div className="bg-green-100 dark:bg-green-800 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-100 flex items-center rounded-ios p-3 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Profile updated successfully!</span>
            {showMajorAlert && major && (
              <span className="ml-1">Redirecting to My Modules...</span>
            )}
          </div>
        )}
        
        {/* Major Selection Alert - Show when redirected from My Modules */}
        {showMajorAlert && !major && !updateSuccess && (
          <div className="bg-yellow-100 dark:bg-yellow-800 border border-yellow-200 dark:border-yellow-700 text-yellow-700 dark:text-yellow-100 flex items-center rounded-ios p-3 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>Please select your major to continue viewing your modules</span>
          </div>
        )}
        
        {/* General Error Message */}
        {errors.submit && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-100 flex items-center rounded-ios p-3 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{errors.submit}</span>
          </div>
        )}
        
        {/* Profile Form */}
        <div className="bg-white dark:bg-ios-dark-elevated rounded-ios shadow-sm border border-ios-gray5 dark:border-ios-dark-border p-6 mb-6">
          <form onSubmit={handleSubmit}>
            {/* Profile Picture (Placeholder for future implementation) */}
            <div className="flex flex-col items-center mb-8">
              <div className="h-24 w-24 rounded-full bg-ios-gray4 dark:bg-ios-dark-secondary flex items-center justify-center mb-3 overflow-hidden">
                {userProfile?.photoURL ? (
                  <img 
                    src={userProfile.photoURL} 
                    alt={userProfile.name || 'User'} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-ios-gray dark:text-ios-dark-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </div>
              <button
                type="button"
                className="text-ios-blue dark:text-ios-teal text-ios-subhead hover:underline"
                disabled={loading}
              >
                Change Profile Picture
              </button>
            </div>
            
            {/* Name */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="name" className="block text-ios-gray dark:text-ios-dark-text-secondary font-sf-pro-text text-ios-subhead">
                  Name<span className="text-ios-red dark:text-red-400 ml-1">*</span>
                </label>
                {errors.name && (
                  <span className="text-ios-red dark:text-red-400 text-xs">{errors.name}</span>
                )}
              </div>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full rounded-md py-2 px-3 bg-white dark:bg-ios-dark-secondary border border-ios-gray5 dark:border-ios-dark-border text-black dark:text-ios-dark-text focus:ring-2 focus:ring-ios-blue dark:focus:ring-ios-teal focus:border-transparent
                ${errors.name ? 'border-ios-red dark:border-red-500 focus:ring-ios-red dark:focus:ring-red-500' : ''}`}
                placeholder="Your name"
                disabled={loading}
                required
              />
            </div>
            
            {/* Email (read-only) */}
            <div className="mb-6">
              <label htmlFor="email" className="block text-ios-gray dark:text-ios-dark-text-secondary font-sf-pro-text text-ios-subhead mb-1">
                Email
              </label>
              <div className="relative rounded-md py-2 px-3 bg-ios-gray6 dark:bg-ios-dark-secondary border border-ios-gray5 dark:border-ios-dark-border text-ios-gray dark:text-ios-dark-text-secondary flex items-center">
                <input
                  id="email"
                  type="email"
                  value={currentUser.email}
                  className="w-full bg-transparent border-none focus:ring-0 text-ios-gray dark:text-ios-dark-text-secondary"
                  disabled
                />
                <span className="absolute right-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-ios-gray dark:text-ios-dark-text-secondary" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </span>
              </div>
              <p className="text-xs text-ios-gray dark:text-ios-dark-text-secondary mt-1">
                Email cannot be changed.
              </p>
            </div>

            {/* Year of Study */}
            <div className="mb-6">
              <label htmlFor="year" className="block text-ios-gray dark:text-ios-dark-text-secondary font-sf-pro-text text-ios-subhead mb-1">
                Year of Study
              </label>
              <select
                id="year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full rounded-md py-2 px-3 bg-white dark:bg-ios-dark-secondary border border-ios-gray5 dark:border-ios-dark-border text-black dark:text-ios-dark-text focus:ring-2 focus:ring-ios-blue dark:focus:ring-ios-teal focus:border-transparent appearance-none pr-8"
                disabled={loading}
                style={{
                  WebkitAppearance: "none",
                  MozAppearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23999' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 0.5rem center",
                  backgroundSize: "1.5em 1.5em",
                }}
              >
                <option value="">Select your year</option>
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4 / Final Year</option>
                <option value="5">Postgraduate</option>
              </select>
              <p className="text-xs text-ios-gray dark:text-ios-dark-text-secondary mt-1">
                This helps us filter module suggestions based on your year of study.
              </p>
            </div>
            
            {/* Major Selection with Search - Highlighted when coming from My Modules */}
            <div className={`mb-6 ${majorSelectionHighlighted ? 'ring-2 ring-offset-2 ring-ios-blue dark:ring-ios-teal p-4 rounded-lg transition-all duration-300' : ''}`}>
              <label htmlFor="majorSearch" className="block text-ios-gray dark:text-ios-dark-text-secondary font-sf-pro-text text-ios-subhead mb-1">
                Major {showMajorAlert && !major && <span className="text-ios-red dark:text-red-400 ml-1">*</span>}
              </label>
              <div className="relative">
                <div className="relative">
                  <input
                    id="majorSearch"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full rounded-md py-2 pl-10 px-3 mb-2 bg-white dark:bg-ios-dark-secondary border border-ios-gray5 dark:border-ios-dark-border text-black dark:text-ios-dark-text focus:ring-2 focus:ring-ios-blue dark:focus:ring-ios-teal focus:border-transparent
                    ${showMajorAlert && !major ? 'border-ios-blue dark:border-ios-teal' : ''}`}
                    placeholder={showMajorAlert ? "Select your major to continue..." : "Search for your major..."}
                    disabled={loading}
                  />
                  <svg className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-ios-gray dark:text-ios-dark-text-secondary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                {/* Selected major display */}
                {major && (
                  <div className="flex items-center justify-between py-3 px-4 mb-2 rounded-lg bg-ios-blue bg-opacity-10 dark:bg-ios-teal dark:bg-opacity-10 border border-ios-blue border-opacity-20 dark:border-ios-teal dark:border-opacity-20">
                    <div className="flex-grow">
                      <p className="font-medium text-ios-body text-ios-blue dark:text-ios-teal">
                        {majors.find(m => m.code === major)?.name || major}
                      </p>
                      <p className="text-xs text-ios-gray dark:text-ios-dark-text-secondary">
                        {major} • {getMajorInfo(major).departmentName}
                      </p>
                    </div>
                    <button
                      type="button" 
                      onClick={() => {
                        setMajor('');
                        setSearchTerm('');
                      }}
                      className="ml-2 rounded-full p-1 text-ios-gray hover:bg-ios-gray6 dark:text-ios-dark-text-secondary dark:hover:bg-ios-dark-secondary"
                      aria-label="Remove major"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
                
                {/* Dropdown for majors */}
                {searchTerm && !loading && (
                  <div className="absolute z-10 w-full mt-1 rounded-lg shadow-lg max-h-60 overflow-y-auto bg-white dark:bg-ios-dark-elevated border border-ios-gray6 dark:border-ios-dark-border">
                    {filteredMajors.length > 0 ? (
                      filteredMajors.map((m) => (
                        <button
                          key={m.code}
                          type="button"
                          className="block w-full text-left px-4 py-3 border-b border-ios-gray6 dark:border-ios-dark-border last:border-0 hover:bg-ios-gray6 dark:hover:bg-ios-dark-secondary"
                          onClick={() => {
                            setMajor(m.code);
                            setSearchTerm('');
                          }}
                        >
                          <p className="font-medium text-black dark:text-ios-dark-text">{m.name}</p>
                          <div className="flex items-center mt-1">
                            <span className="text-xs px-2 py-0.5 rounded-full mr-2 bg-ios-gray6 dark:bg-ios-dark-secondary text-ios-gray dark:text-ios-dark-text-secondary">
                              {m.code}
                            </span>
                            <span className="text-xs text-ios-gray dark:text-ios-dark-text-secondary">
                              {getMajorInfo(m.code).departmentName}
                            </span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-center">
                        <p className="text-ios-gray dark:text-ios-dark-text-secondary">
                          No majors found matching "{searchTerm}"
                        </p>
                        <p className="text-xs mt-1 text-ios-gray dark:text-ios-dark-text-secondary">
                          Try a different search term
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <p className="text-xs text-ios-gray dark:text-ios-dark-text-secondary mt-1">
                {showMajorAlert && !major 
                  ? "You need to select a major to view your modules" 
                  : "Your major helps us recommend relevant study groups and modules."}
              </p>
            </div>

            {/* Bio */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="bio" className="block text-ios-gray dark:text-ios-dark-text-secondary font-sf-pro-text text-ios-subhead">
                  Bio
                </label>
                <div className="flex items-center">
                  {errors.bio && (
                    <span className="text-ios-red dark:text-red-400 text-xs mr-2">{errors.bio}</span>
                  )}
                  <span className={`text-xs ${bio.length > 500 ? 'text-ios-red dark:text-red-400' : 'text-ios-gray dark:text-ios-dark-text-secondary'}`}>
                    {bio.length}/500
                  </span>
                </div>
              </div>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className={`w-full rounded-md py-2 px-3 min-h-[120px] bg-white dark:bg-ios-dark-secondary border border-ios-gray5 dark:border-ios-dark-border text-black dark:text-ios-dark-text focus:ring-2 focus:ring-ios-blue dark:focus:ring-ios-teal focus:border-transparent
                ${errors.bio ? 'border-ios-red dark:border-red-500 focus:ring-ios-red dark:focus:ring-red-500' : ''}`}
                placeholder="Tell us a bit about yourself..."
                disabled={loading}
              />
              <p className="text-xs text-ios-gray dark:text-ios-dark-text-secondary mt-1">
                Share your academic interests, study habits, or anything else that might help potential study partners get to know you.
              </p>
            </div>

            {/* Location Sharing */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="locationSharing" className="text-black dark:text-ios-dark-text font-sf-pro-text text-ios-body">
                    Share my location
                  </label>
                  <p className="text-xs text-ios-gray dark:text-ios-dark-text-secondary mt-1">
                    Allow others to see your location for nearby study group suggestions.
                  </p>
                </div>
                <button 
                  type="button"
                  onClick={() => setLocationSharing(!locationSharing)}
                  className={`relative inline-flex ${locationSharing ? 'bg-green-500 dark:bg-green-600' : 'bg-ios-gray4 dark:bg-ios-dark-secondary'}
                  flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200`}
                  disabled={loading}
                  role="switch"
                  aria-checked={locationSharing}
                >
                  <span className="sr-only">Toggle location sharing</span>
                  <span
                    aria-hidden="true"
                    className={`${locationSharing ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                  />
                </button>
              </div>
            </div>
            
            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <button
                type="submit"
                className={`flex items-center justify-center px-6 py-2 rounded-md bg-ios-blue hover:bg-ios-blue-dark dark:bg-ios-teal dark:hover:bg-ios-teal-dark text-white transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </>
                ) : showMajorAlert && !major ? (
                  'Save & Continue to Modules'
                ) : (
                  'Update Profile'
                )}
              </button>
              {!showMajorAlert && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-6 py-2 rounded-md bg-ios-gray6 hover:bg-ios-gray5 dark:bg-ios-dark-secondary dark:hover:bg-ios-dark-border text-ios-gray dark:text-ios-dark-text-secondary border border-ios-gray5 dark:border-ios-dark-border transition-colors"
                  disabled={loading}
                >
                  Sign Out
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Modules Preview Section */}
        {major && (
          <div className="bg-white dark:bg-ios-dark-elevated border border-ios-gray5 dark:border-ios-dark-border shadow-sm rounded-xl p-6 mb-6">
            <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
              <div>
                <h2 className="text-ios-headline font-semibold text-black dark:text-ios-dark-text">
                  {majors.find(m => m.code === major)?.name || ''} Modules
                </h2>
                <p className="text-ios-subhead mt-1 text-ios-gray dark:text-ios-dark-text-secondary">
                  {getMajorInfo(major).departmentName}, {getMajorInfo(major).facultyName}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={selectedModuleYear}
                  onChange={(e) => setSelectedModuleYear(e.target.value)}
                  className="rounded-md py-1 px-3 text-sm bg-white dark:bg-ios-dark-secondary border border-ios-gray5 dark:border-ios-dark-border text-black dark:text-ios-dark-text focus:ring-2 focus:ring-ios-blue dark:focus:ring-ios-teal focus:border-transparent appearance-none pr-8"
                  style={{
                    WebkitAppearance: "none",
                    MozAppearance: "none",
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23999' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 0.5rem center",
                    backgroundSize: "1.5em 1.5em",
                  }}
                >
                  <option value="">All Years</option>
                  {Object.keys(modulesByYear).sort().map(year => (
                    <option key={year} value={year}>Year {year}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {selectedModuleYear ? (
              // Year-specific modules view
              <div>
                <h3 className="text-ios-body font-semibold mb-3 text-ios-gray dark:text-ios-dark-text-secondary">
                  Year {selectedModuleYear} Modules
                </h3>
                {modulesByYear[selectedModuleYear] && modulesByYear[selectedModuleYear].length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {modulesByYear[selectedModuleYear].map(module => (
                      <div 
                        key={module.code}
                        className="bg-ios-gray6 dark:bg-ios-dark-secondary hover:bg-ios-gray5 dark:hover:bg-ios-dark-border rounded-lg p-3 cursor-pointer transition-colors"
                        onClick={() => navigate(`/modules?code=${module.code}`)}
                      >
                        <h3 className="text-ios-body font-medium text-black dark:text-ios-dark-text">
                          {module.name}
                        </h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="text-xs px-2 py-1 rounded bg-white dark:bg-ios-dark-bg text-ios-gray dark:text-ios-dark-text-secondary">
                            {module.code}
                          </span>
                          {module.credits && (
                            <span className="text-xs px-2 py-1 rounded bg-ios-blue bg-opacity-10 dark:bg-ios-teal dark:bg-opacity-10 text-ios-blue dark:text-ios-teal">
                              {module.credits} credits
                            </span>
                          )}
                          {module.semester && (
                            <span className="text-xs px-2 py-1 rounded bg-white dark:bg-ios-dark-bg text-ios-gray dark:text-ios-dark-text-secondary">
                              Sem {module.semester}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-lg text-center bg-ios-gray6 dark:bg-ios-dark-secondary">
                    <p className="text-ios-gray dark:text-ios-dark-text-secondary">
                      No modules found for Year {selectedModuleYear}.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              // Modules by year preview
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.keys(modulesByYear).sort().map(year => (
                  <div
                    key={year}
                    className="bg-ios-gray6 dark:bg-ios-dark-secondary rounded-lg p-4"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-medium text-black dark:text-ios-dark-text">Year {year}</h3>
                      <span className="text-xs px-2 py-1 rounded-full bg-white dark:bg-ios-dark-bg text-ios-gray dark:text-ios-dark-text-secondary">
                        {modulesByYear[year].length} modules
                      </span>
                    </div>
                    <div className="space-y-2">
                      {modulesByYear[year].slice(0, 3).map(module => (
                        <div
                          key={module.code}
                          onClick={() => navigate(`/modules?code=${module.code}`)}
                          className="p-2 rounded cursor-pointer hover:bg-white dark:hover:bg-ios-dark-border transition-colors"
                        >
                          <p className="text-sm font-medium truncate text-black dark:text-ios-dark-text">{module.name}</p>
                          <p className="text-xs text-ios-gray dark:text-ios-dark-text-secondary">{module.code}</p>
                        </div>
                      ))}
                      {modulesByYear[year].length > 3 && (
                        <button
                          onClick={() => setSelectedModuleYear(year)}
                          className="text-sm text-ios-blue dark:text-ios-teal mt-1 hover:underline"
                        >
                          +{modulesByYear[year].length - 3} more modules
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-ios-gray6 dark:border-ios-dark-border">
              <button
                onClick={() => navigate('/modules')}
                className="text-sm text-ios-blue dark:text-ios-teal flex items-center hover:underline"
              >
                <span>Browse all modules</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l-4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}
        
        {/* Logout confirmation modal */}
        {showLogoutModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="max-w-sm w-full rounded-xl bg-white dark:bg-ios-dark-elevated shadow-xl p-6">
              <div className="text-center mb-4">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-ios-red bg-opacity-10 dark:bg-ios-dark-secondary mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-ios-red dark:text-ios-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <h3 className="text-ios-title font-semibold text-black dark:text-ios-dark-text">Sign Out</h3>
                <p className="mt-2 text-ios-gray dark:text-ios-dark-text-secondary">
                  Are you sure you want to sign out? You'll need to sign in again to access your account.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={confirmLogout}
                  className="flex-1 px-4 py-2 rounded-md bg-ios-red hover:bg-ios-red-dark dark:bg-ios-red-dark dark:hover:bg-red-800 text-white transition-colors"
                >
                  Sign Out
                </button>
                <button
                  type="button"
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 px-4 py-2 rounded-md bg-ios-gray6 hover:bg-ios-gray5 dark:bg-ios-dark-secondary dark:hover:bg-ios-dark-border text-ios-gray dark:text-ios-dark-text-secondary transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;