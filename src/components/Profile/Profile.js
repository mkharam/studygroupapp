import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { associateModulesWithUser } from '../../utils/catalogueTransformer';
import { useMajorsModules } from '../../context/MajorsModulesContext';

const Profile = () => {
  const { currentUser, userProfile, updateUserProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { majors, modules, departments, loading: majorsLoading } = useMajorsModules();
  
  // Check if we're coming from My Modules page with a request to select major
  const showMajorAlert = location.state?.showMajorAlert;
  
  // Form states
  const [name, setName] = useState('');
  const [major, setMajor] = useState('');
  const [bio, setBio] = useState('');
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(false);
  
  // Filter majors based on search term
  const filteredMajors = searchTerm
    ? majors.filter(major => 
        major.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        major.code.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : majors;
  
  // Populate form with existing user profile data
  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      setMajor(userProfile.majorCode || '');
      setBio(userProfile.bio || '');
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
    
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle profile update
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
        return;
    }

    try {
        setLoading(true);
        setUpdateSuccess(false);

        // Get previous major to check if it changed
        const previousMajor = userProfile?.majorCode || '';
        const majorChanged = major !== previousMajor;

        const profileData = {
            name: name.trim() || 'User',
            bio: bio.trim() || ''
        };

        if (major && typeof major === 'string') {
            profileData.majorCode = major;
            const selectedMajor = majors.find(m => m.code === major);
            if (selectedMajor) {
                profileData.majorName = selectedMajor.name;
            }
        }

        await updateUserProfile(profileData);
        setUpdateSuccess(true);

        // Only update modules if major has changed
        if (majorChanged && major) {
            // Pass the modules list to the function
            await associateModulesWithUser(currentUser.uid, major, modules);
        }

        // If we came from My Modules and selected a major, redirect back after update
        if (showMajorAlert && major) {
            setTimeout(() => {
                navigate('/my-modules');
            }, 1500);
        }
    } catch (error) {
        console.error('Error updating profile:', error);
    } finally {
        setLoading(false);
    }
  };
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
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
        
        {/* Major Selection Alert - Show when redirected from My Modules */}
        {showMajorAlert && !major && (
          <div className="bg-yellow-100 dark:bg-yellow-800 border border-yellow-200 dark:border-yellow-700 text-yellow-700 dark:text-yellow-100 flex items-center rounded-ios p-3 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>Please select your major to continue viewing your modules</span>
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
            
            {/* Success Message */}
            {updateSuccess && (
              <div className="mb-6 bg-green-100 dark:bg-green-800 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-100 rounded-ios p-3">
                Profile updated successfully!
              </div>
            )}

            {/* Name Field */}
            <div className="mb-6">
              <label htmlFor="name" className="block text-ios-subhead font-medium text-black dark:text-ios-dark-text mb-2">
                Name
                </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white dark:bg-ios-dark-secondary border border-ios-gray5 dark:border-ios-dark-border text-black dark:text-ios-dark-text focus:ring-2 focus:ring-ios-blue dark:focus:ring-ios-teal focus:border-transparent"
                placeholder="Enter your name"
                disabled={loading}
              />
            </div>
            
            {/* Bio Field */}
            <div className="mb-6">
              <label htmlFor="bio" className="block text-ios-subhead font-medium text-black dark:text-ios-dark-text mb-2">
                Bio
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white dark:bg-ios-dark-secondary border border-ios-gray5 dark:border-ios-dark-border text-black dark:text-ios-dark-text focus:ring-2 focus:ring-ios-blue dark:focus:ring-ios-teal focus:border-transparent"
                placeholder="Tell us about yourself"
                rows="4"
                disabled={loading}
              />
            </div>

            {/* Major Selection */}
            <div className="mb-6">
              <label htmlFor="majorSearch" className="block text-ios-subhead font-medium text-black dark:text-ios-dark-text mb-2">
                Major
              </label>
                <div className="relative">
                  <input
                  type="text"
                    id="majorSearch"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white dark:bg-ios-dark-secondary border border-ios-gray5 dark:border-ios-dark-border text-black dark:text-ios-dark-text focus:ring-2 focus:ring-ios-blue dark:focus:ring-ios-teal focus:border-transparent"
                  placeholder="Search for your major"
                    disabled={loading}
                  />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-ios-gray dark:text-ios-dark-text-secondary hover:text-ios-gray-dark dark:hover:text-ios-dark-text"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  </button>
                )}
                </div>
              {searchTerm && filteredMajors.length > 0 && (
                <div className="mt-2 max-h-60 overflow-y-auto rounded-lg border border-ios-gray5 dark:border-ios-dark-border bg-white dark:bg-ios-dark-secondary">
                  {filteredMajors.map(majorOption => (
                    <button
                      key={majorOption.code}
                      type="button" 
                      onClick={() => {
                        setMajor(majorOption.code);
                        setSearchTerm('');
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-ios-gray6 dark:hover:bg-ios-dark-border focus:bg-ios-gray6 dark:focus:bg-ios-dark-border"
                    >
                      <div className="font-medium text-black dark:text-ios-dark-text">{majorOption.name}</div>
                      <div className="text-sm text-ios-gray dark:text-ios-dark-text-secondary">{majorOption.code}</div>
                    </button>
                  ))}
                  </div>
                )}
            </div>

            {/* Selected Major Info */}
            {major && (
              <div className="mb-6 p-4 rounded-lg bg-ios-gray6 dark:bg-ios-dark-secondary">
                <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-medium text-black dark:text-ios-dark-text">
                      {majors.find(m => m.code === major)?.name}
                    </h3>
                    <p className="text-sm text-ios-gray dark:text-ios-dark-text-secondary">
                      {getMajorInfo(major).departmentName} • {getMajorInfo(major).facultyName}
                  </p>
                </div>
                <button 
                  type="button"
                    onClick={() => setMajor('')}
                    className="text-ios-red dark:text-ios-red-400 hover:text-ios-red-dark dark:hover:text-ios-red-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
              </div>
            </div>
            )}
            
            {/* Submit Button */}
            <div className="flex justify-between items-center">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-ios-blue dark:bg-ios-teal text-white rounded-lg hover:bg-ios-blue-dark dark:hover:bg-ios-teal-dark transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
                <button
                  type="button"
                  onClick={handleLogout}
                className="text-ios-red dark:text-ios-red-400 hover:text-ios-red-dark dark:hover:text-ios-red-300"
                >
                  Sign Out
                </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;