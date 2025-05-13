import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ref, onValue, get, query, orderByChild } from 'firebase/database';
import { database } from '../../../firebase';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { FaUserFriends, FaSearch, FaChevronRight, FaFilter, FaTimes, FaGlobe, FaLock, FaUniversity, FaPlus } from 'react-icons/fa';

function GroupList() {
  const { currentUser, userProfile } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Get any query parameters
  const searchParams = new URLSearchParams(location.search);
  const moduleFromUrl = searchParams.get('module');

  // State for groups and filtering
  const [groups, setGroups] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModule, setFilterModule] = useState(moduleFromUrl || '');
  const [filterMyGroups, setFilterMyGroups] = useState(false);
  const [visibilityFilter, setVisibilityFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [groupsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  
  // Optimized group fetching with better error handling
  useEffect(() => {
    setLoading(true);
    setError('');

    // Create optimized query using orderByChild for createdAt to get newest groups first
    const groupsRef = ref(database, 'groups');
    const groupsQuery = query(groupsRef, orderByChild('createdAt'));
    
    const unsubscribe = onValue(groupsQuery, 
      (snapshot) => {
        if (snapshot.exists()) {
          const groupsData = snapshot.val();
          
          // Convert to array and add ID to each group
          let groupsArray = Object.entries(groupsData).map(([id, group]) => ({
            id,
            ...group,
            memberCount: group.members ? Object.keys(group.members).length : 0
          }));
          
          // Sort by creation date (newest first)
          groupsArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          
          setGroups(groupsArray);
        } else {
          setGroups([]);
        }
        setLoading(false);
      }, 
      (error) => {
        console.error('Error fetching groups:', error);
        setError('Failed to load groups. Please try again later.');
        setLoading(false);
      }
    );
    
    // Cleanup subscription
    return () => unsubscribe();
  }, []);
  
  // Fetch modules for filtering using memoized callback
  const fetchModules = useCallback(async () => {
    try {
      const modulesRef = ref(database, 'modules');
      const snapshot = await get(modulesRef);
      
      if (snapshot.exists()) {
        const modulesData = snapshot.val();
        
        const modulesArray = Object.entries(modulesData).map(([code, moduleData]) => ({
          code,
          ...moduleData
        }));
        
        modulesArray.sort((a, b) => a.code.localeCompare(b.code));
        setModules(modulesArray);
      }
    } catch (error) {
      console.error('Error fetching modules:', error);
      // Don't set the main error state, just log it since this is a secondary feature
    }
  }, []);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);
  
  // Apply filters with visibility logic for better performance
  const getFilteredGroups = useCallback(() => {
    return groups.filter(group => {
      // Filter by search query - case insensitive search against multiple fields
      const matchesQuery = !searchQuery || 
        (group.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) || 
        (group.topic?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
        (group.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
        (group.moduleCode?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
      
      // Filter by module
      const matchesModule = !filterModule || group.moduleCode === filterModule;
      
      // Filter by my groups
      const isGroupMember = currentUser && group.members && group.members[currentUser.uid];
      const matchesMyGroups = !filterMyGroups || isGroupMember;
      
      // Filter by visibility with proper fallbacks
      let matchesVisibility = true;
      if (visibilityFilter !== 'all') {
        if (visibilityFilter === 'invite-only') {
          // For invite-only, only show if user is a member
          matchesVisibility = isGroupMember;
        } else {
          // For other visibility filters, match the exact type
          matchesVisibility = (group.visibility || 'public') === visibilityFilter;
        }
      } else {
        // When showing all, respect visibility rules
        if ((group.visibility === 'invite-only' || group.visibility === 'major-only') && !isGroupMember) {
          if (group.visibility === 'major-only') {
            // For major-only, check if user has same major as group creator
            const creatorMember = group.members ? Object.values(group.members).find(member => member.role === 'admin') : null;
            const creatorMajorCode = creatorMember?.majorCode;
            matchesVisibility = userProfile?.majorCode && creatorMajorCode && userProfile.majorCode === creatorMajorCode;
          } else {
            // For invite-only, only members can see
            matchesVisibility = false;
          }
        }
      }
      
      return matchesQuery && matchesModule && matchesMyGroups && matchesVisibility;
    });
  }, [groups, searchQuery, filterModule, filterMyGroups, visibilityFilter, currentUser, userProfile]);
  
  const filteredGroups = getFilteredGroups();
  
  // Calculate pagination
  useEffect(() => {
    setTotalPages(Math.ceil(filteredGroups.length / groupsPerPage));
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [filteredGroups, groupsPerPage]);
  
  // Get current page groups
  const indexOfLastGroup = currentPage * groupsPerPage;
  const indexOfFirstGroup = indexOfLastGroup - groupsPerPage;
  const currentGroups = filteredGroups.slice(indexOfFirstGroup, indexOfLastGroup);
  
  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  // Handle creating a new group
  const handleCreateGroup = () => {
    if (currentUser) {
      navigate('/groups/create');
    } else {
      navigate('/login', { state: { from: '/groups/create', message: 'Please log in to create a study group' } });
    }
  };
  
  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setFilterModule('');
    setFilterMyGroups(false);
    setVisibilityFilter('all');
  };

  // Format timestamp for display with error handling
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffMins < 60) {
        return diffMins <= 1 ? '1 minute ago' : `${diffMins} minutes ago`;
      } else if (diffHours < 24) {
        return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
      } else if (diffDays < 7) {
        return diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch (err) {
      console.error('Error formatting timestamp:', err);
      return 'Date error';
    }
  };
  
  // Get visibility badge style and text
  const getVisibilityBadge = (visibility) => {
    switch(visibility || 'public') { // Default to public if undefined
      case 'public':
        return {
          icon: <FaGlobe />,
          color: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:bg-opacity-30 dark:text-blue-300",
          text: 'Public'
        };
      case 'major-only':
        return {
          icon: <FaUniversity />,
          color: "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:bg-opacity-30 dark:text-purple-300",
          text: 'Major Only'
        };
      case 'invite-only':
        return {
          icon: <FaLock />,
          color: "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:bg-opacity-30 dark:text-amber-300",
          text: 'Invite Only'
        };
      default:
        return {
          icon: <FaGlobe />,
          color: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
          text: 'Unknown'
        };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header with Create Button */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Study Groups</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Connect with peers and study together</p>
          </div>
          <button
            onClick={handleCreateGroup}
            className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            <FaPlus className="mr-2" />
            Create New Group
          </button>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900 dark:bg-opacity-30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg p-4 mb-6 flex items-center">
            <FaTimes className="text-red-500 mr-3" />
            <span>{error}</span>
            <button 
              className="ml-auto text-red-500 hover:text-red-700 dark:hover:text-red-300"
              onClick={() => setError('')}
              aria-label="Dismiss error"
            >
              <FaTimes />
            </button>
          </div>
        )}
        
        {/* Search & Filter Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
          {/* Search */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="Search for groups by name, topic, or module code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>
          
          {/* Filter Toggle */}
          <div className="px-4 py-3 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                <FaFilter className="mr-1.5" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
              {(filterModule || filterMyGroups || visibilityFilter !== 'all') && (
                <button 
                  onClick={resetFilters}
                  className="ml-4 text-sm text-gray-500 dark:text-gray-400 hover:underline"
                >
                  Reset filters
                </button>
              )}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {filteredGroups.length} {filteredGroups.length === 1 ? 'group' : 'groups'} found
            </div>
          </div>
          
          {/* Expanded Filters */}
          {showFilters && (
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
              {/* Module Filter */}
              <div>
                <label htmlFor="module" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Module
                </label>
                <select
                  id="module"
                  value={filterModule}
                  onChange={(e) => setFilterModule(e.target.value)}
                  className="block w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 text-gray-900 dark:text-white"
                >
                  <option value="">All Modules</option>
                  {modules.map(module => (
                    <option key={module.code} value={module.code}>
                      {module.code}: {module.name || module.title}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Visibility Filter */}
              <div>
                <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Visibility
                </label>
                <select
                  id="visibility"
                  value={visibilityFilter}
                  onChange={(e) => setVisibilityFilter(e.target.value)}
                  className="block w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 text-gray-900 dark:text-white"
                >
                  <option value="all">All Groups</option>
                  <option value="public">Public Groups</option>
                  <option value="major-only">Major-Only Groups</option>
                  {currentUser && <option value="invite-only">Invite-Only Groups</option>}
                </select>
              </div>
              
              {/* My Groups Toggle */}
              {currentUser && (
                <div className="flex items-center mt-6">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterMyGroups}
                      onChange={() => setFilterMyGroups(!filterMyGroups)}
                      className="sr-only"
                    />
                    <div className={`relative inline-block w-10 h-6 transition-colors duration-300 ease-in-out rounded-full ${filterMyGroups ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                      <div className={`absolute left-1 top-1 w-4 h-4 transition-transform duration-300 ease-in-out transform bg-white rounded-full ${filterMyGroups ? 'translate-x-4' : 'translate-x-0'}`}></div>
                    </div>
                    <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Show only my groups
                    </span>
                  </label>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Group Cards */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 dark:border-blue-400"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading study groups...</p>
          </div>
        ) : filteredGroups.length > 0 ? (
          <div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-4">
              {currentGroups.map(group => {
                const visibilityBadge = getVisibilityBadge(group.visibility);
                const isGroupMember = currentUser && group.members && group.members[currentUser.uid];
                
                return (
                  <Link
                    key={group.id}
                    to={`/groups/${group.id}`}
                    className="group block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-400 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                  >
                    {/* Group header with module code badge */}
                    <div className="p-5">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {group.name}
                          </h3>
                          <div className="flex items-center mt-1 space-x-1">
                            {group.moduleCode && (
                              <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-blue-50 dark:bg-blue-900 dark:bg-opacity-30 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                                {group.moduleCode}
                              </span>
                            )}
                            <span className="text-gray-500 dark:text-gray-400 text-sm">
                              • {formatTimestamp(group.createdAt)}
                            </span>
                          </div>
                        </div>
                        
                        {/* Member count badge */}
                        <div className="flex items-center px-2.5 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                          <FaUserFriends className="mr-1.5" />
                          {group.memberCount || 0}
                        </div>
                      </div>
                    
                      {/* Group description */}
                      {group.description && (
                        <p className="mt-3 text-gray-600 dark:text-gray-300 text-sm line-clamp-2">{group.description}</p>
                      )}
                      
                      {/* Tags and badges */}
                      <div className="flex flex-wrap items-center gap-2 mt-4">
                        {/* Visibility badge */}
                        <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs ${visibilityBadge.color}`}>
                          <span className="mr-1">{visibilityBadge.icon}</span>
                          <span>{visibilityBadge.text}</span>
                        </div>
                        
                        {/* Member badge */}
                        {isGroupMember && (
                          <div className="inline-flex items-center bg-green-100 dark:bg-green-900 dark:bg-opacity-30 text-green-700 dark:text-green-300 rounded-full px-3 py-1 text-xs">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>Member</span>
                          </div>
                        )}
                        
                        {/* Topic tags */}
                        {group.topic && (
                          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                            <span>#{group.topic}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Card footer */}
                    <div className="px-5 py-3 bg-gray-50 dark:bg-gray-750 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">View details</span>
                      <FaChevronRight className="text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400" />
                    </div>
                  </Link>
                );
              })}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <nav className="flex items-center space-x-1" aria-label="Pagination">
                  {/* Previous Page */}
                  <button
                    onClick={() => paginate(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-3 py-2 rounded-md border text-sm font-medium
                      ${currentPage === 1 
                        ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750'}`}
                  >
                    <span className="sr-only">Previous</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {/* Page Numbers */}
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNumber = index + 1;
                    const isVisible = pageNumber === 1 || 
                                      pageNumber === totalPages || 
                                      Math.abs(pageNumber - currentPage) <= 1;
                    
                    if (isVisible) {
                      return (
                        <button
                          key={index}
                          onClick={() => paginate(pageNumber)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium
                            ${currentPage === pageNumber
                              ? 'z-10 bg-blue-600 dark:bg-blue-500 border-blue-500 dark:border-blue-600 text-white'
                              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750'}`}
                        >
                          {pageNumber}
                        </button>
                      );
                    } else if (
                      (pageNumber === currentPage - 2 && currentPage > 3) ||
                      (pageNumber === currentPage + 2 && currentPage < totalPages - 2)
                    ) {
                      return (
                        <span
                          key={index}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                  
                  {/* Next Page */}
                  <button
                    onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-3 py-2 rounded-md border text-sm font-medium
                      ${currentPage === totalPages 
                        ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750'}`}
                  >
                    <span className="sr-only">Next</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4-4a1 1 0 010 1.414l-4-4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="inline-flex items-center justify-center bg-blue-100 dark:bg-blue-900 dark:bg-opacity-30 p-4 rounded-full mb-5">
                <FaUserFriends className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No study groups found</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                {searchQuery || filterModule || filterMyGroups || visibilityFilter !== 'all' ? 
                  "We couldn't find any study groups matching your filters. Try adjusting your search criteria or create a new group." : 
                  "There are no study groups available yet. Be the first to create one and invite your classmates!"}
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <button onClick={handleCreateGroup} className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors">
                  <FaPlus className="inline-block mr-2" />
                  Create a Group
                </button>
                {(searchQuery || filterModule || filterMyGroups || visibilityFilter !== 'all') && (
                  <button onClick={resetFilters} className="py-2.5 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                    <FaTimes className="inline-block mr-2" />
                    Reset Filters
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Create Group FAB for mobile */}
      <div className="fixed right-6 bottom-24 sm:hidden z-50">
        <button 
          onClick={handleCreateGroup}
          className="bg-blue-600 dark:bg-blue-500 text-white p-4 rounded-full shadow-lg flex items-center justify-center"
          aria-label="Create New Group"
        >
          <FaPlus />
        </button>
      </div>
    </div>
  );
}

export default GroupList;