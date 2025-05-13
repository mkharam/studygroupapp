import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMajorsModules } from '../../context/MajorsModulesContext';
import { useAuth } from '../../context/AuthContext';
import { fetchGroupsByModule, database } from '../../firebase';
import { ref, get } from 'firebase/database';
import { FaUsers } from 'react-icons/fa';

const ModulesList = () => {
  const { modules, majors, departments, loading } = useMajorsModules();
  const { userProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredModules, setFilteredModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedMajor, setSelectedMajor] = useState(null);
  const [majorModules, setMajorModules] = useState([]);
  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [view, setView] = useState('list'); // 'list' or 'details'
  const [modulesPerMajor, setModulesPerMajor] = useState({});
  const [quickFilterMajors, setQuickFilterMajors] = useState([]);
  const [moduleGroupCounts, setModuleGroupCounts] = useState({});
  const [loadingGroupCounts, setLoadingGroupCounts] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize from URL parameters
  useEffect(() => {
    if (loading) return;
    
    const params = new URLSearchParams(location.search);
    const moduleCode = params.get('code');
    const majorCode = params.get('major');
    
    if (majorCode) {
      const major = majors.find(m => m.code === majorCode);
      if (major) {
        setSelectedMajor(major);
      }
    } else if (userProfile?.major) {
      // Set user's major as default if they have one
      const userMajor = majors.find(m => m.code === userProfile.major);
      if (userMajor) {
        setSelectedMajor(userMajor);
      }
    }
    
    if (moduleCode) {
      const module = modules.find(m => m.code === moduleCode);
      if (module) {
        setSelectedModule(module);
        setView('details');
      }
    }
  }, [location.search, modules, majors, loading, userProfile]);

  // Calculate modules per major for better sorting and filtering
  useEffect(() => {
    if (loading) return;
    
    const moduleCountByMajor = {};
    
    // Count modules for each major
    majors.forEach(major => {
      const majorModuleCount = modules.filter(
        module => module.programs && module.programs.includes(major.code)
      ).length;
      
      moduleCountByMajor[major.code] = majorModuleCount;
    });
    
    setModulesPerMajor(moduleCountByMajor);
    
    // Set quick filter majors (top majors by module count)
    const sortedMajorsByModuleCount = [...majors]
      .filter(major => moduleCountByMajor[major.code] > 0)
      .sort((a, b) => moduleCountByMajor[b.code] - moduleCountByMajor[a.code]);
    
    // Show user's major first if it exists, then top 4 majors by module count
    const topMajors = [];
    
    // Add user's major if it exists
    if (userProfile?.major) {
      const userMajor = majors.find(m => m.code === userProfile.major);
      if (userMajor && moduleCountByMajor[userMajor.code] > 0) {
        topMajors.push(userMajor);
      }
    }
    
    // Add top majors by module count (excluding user's major if already added)
    for (const major of sortedMajorsByModuleCount) {
      if (topMajors.length < 5 && !topMajors.some(m => m.code === major.code)) {
        topMajors.push(major);
      }
    }
    
    setQuickFilterMajors(topMajors);
  }, [modules, majors, loading, userProfile]);

  // Group and sort majors by department
  const sortedMajors = React.useMemo(() => {
    if (loading) return [];
    
    // First, get the user's department and faculty
    const userDepartment = userProfile?.department;
    const userFaculty = userProfile?.faculty;
    
    // Sort majors by department (user's department first, then alphabetically)
    return [...majors].sort((a, b) => {
      // Put user's department first
      if (userDepartment) {
        if (a.department === userDepartment && b.department !== userDepartment) return -1;
        if (a.department !== userDepartment && b.department === userDepartment) return 1;
      }
      
      // Put user's faculty second
      if (userFaculty) {
        if (a.faculty === userFaculty && b.faculty !== userFaculty) return -1;
        if (a.faculty !== userFaculty && b.faculty === userFaculty) return 1;
      }
      
      // Then prioritize majors with more modules
      const aModules = modulesPerMajor[a.code] || 0;
      const bModules = modulesPerMajor[b.code] || 0;
      
      if (aModules !== bModules) {
        return bModules - aModules;
      }
      
      // Then sort alphabetically by department, then by name
      if (a.department !== b.department) {
        return a.department.localeCompare(b.department);
      }
      
      return a.name.localeCompare(b.name);
    });
  }, [majors, modulesPerMajor, userProfile, loading]);
  
  // Group majors by department for better organization
  const majorsByDepartment = React.useMemo(() => {
    if (loading) return {};
    
    const grouped = {};
    
    sortedMajors.forEach(major => {
      const departmentCode = major.department;
      
      if (!grouped[departmentCode]) {
        // Find department name
        const department = departments
          .flatMap(faculty => faculty.departments)
          .find(dep => dep.code === departmentCode);
          
        const departmentName = department?.name || 'Other Department';
        
        grouped[departmentCode] = {
          name: departmentName,
          majors: []
        };
      }
      
      grouped[departmentCode].majors.push(major);
    });
    
    // Sort departments by number of modules
    return Object.fromEntries(
      Object.entries(grouped).sort(([deptCodeA, deptA], [deptCodeB, deptB]) => {
        // User's department first
        if (userProfile?.department) {
          if (deptCodeA === userProfile.department && deptCodeB !== userProfile.department) return -1;
          if (deptCodeA !== userProfile.department && deptCodeB === userProfile.department) return 1;
        }
        
        // Then by total module count in department
        const deptAModules = deptA.majors.reduce((sum, major) => sum + (modulesPerMajor[major.code] || 0), 0);
        const deptBModules = deptB.majors.reduce((sum, major) => sum + (modulesPerMajor[major.code] || 0), 0);
        
        if (deptAModules !== deptBModules) {
          return deptBModules - deptAModules;
        }
        
        // Then alphabetically
        return deptA.name.localeCompare(deptB.name);
      })
    );
  }, [sortedMajors, departments, modulesPerMajor, loading, userProfile]);

  // Filter modules based on search term and selected major
  useEffect(() => {
    if (loading) return;
    
    let filtered = [...modules];
    
    // Filter by selected major if one is selected
    if (selectedMajor) {
      filtered = filtered.filter(module => 
        module.programs && module.programs.includes(selectedMajor.code)
      );
      setMajorModules(filtered);
    } else {
      setMajorModules([]);
    }
    
    // Apply search term filtering
    if (searchTerm.trim()) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      
      filtered = filtered.filter(
        module => module.name.toLowerCase().includes(lowerCaseSearchTerm) || 
                 module.code.toLowerCase().includes(lowerCaseSearchTerm)
      );
    }

    // If no major is selected, but user has a department, prioritize modules from that department
    if (!selectedMajor && userProfile?.department) {
      const departmentMajors = majors.filter(major => major.department === userProfile.department);
      const departmentModuleCodes = new Set();

      departmentMajors.forEach(major => {
        const majorModules = modules.filter(module => module.programs && module.programs.includes(major.code));
        majorModules.forEach(module => departmentModuleCodes.add(module.code));
      });

      // Sort modules so department modules appear first
      filtered = filtered.sort((a, b) => {
        const aInDepartment = departmentModuleCodes.has(a.code) ? -1 : 0;
        const bInDepartment = departmentModuleCodes.has(b.code) ? -1 : 0;
        return bInDepartment - aInDepartment;
      });
    }
    
    // Sort modules by year level (extracted from module code if possible)
    filtered = filtered.sort((a, b) => {
      // Try to extract year level from module code (e.g., COM1001 -> 1, COM3505 -> 3)
      const getYearLevel = (code) => {
        const match = code.match(/[A-Z]{3}(\d)/);
        return match ? parseInt(match[1]) : 0;
      };
      
      const aYear = getYearLevel(a.code);
      const bYear = getYearLevel(b.code);
      
      if (aYear !== bYear) {
        return aYear - bYear; // Sort by year level (ascending)
      }
      
      return a.name.localeCompare(b.name); // Then alphabetically
    });
    
    setFilteredModules(filtered);
  }, [searchTerm, modules, majors, selectedMajor, userProfile, loading]);

  // Fetch group counts for modules
  useEffect(() => {
    // Only fetch group counts when modules are loaded and we're in list view
    if (loading || view !== 'list' || filteredModules.length === 0) return;
    
    const fetchGroupCounts = async () => {
      setLoadingGroupCounts(true);
      const counts = {};
      
      try {
        // We'll use a batched approach to avoid too many simultaneous requests
        const moduleCodes = filteredModules.map(module => module.code);
        
        // Get all groups
        const groupsRef = ref(database, 'groups');
        const groupsSnapshot = await get(groupsRef);
        
        if (groupsSnapshot.exists()) {
          const allGroups = groupsSnapshot.val();
          
          // Count groups for each module
          Object.values(allGroups).forEach(group => {
            if (group.moduleCode && moduleCodes.includes(group.moduleCode)) {
              // Only count active groups (not deleted or archived)
              if (!group.status || group.status === 'active') {
                if (!counts[group.moduleCode]) {
                  counts[group.moduleCode] = 0;
                }
                counts[group.moduleCode]++;
              }
            }
          });
        }
        
        setModuleGroupCounts(counts);
      } catch (error) {
        console.error("Error fetching group counts:", error);
      } finally {
        setLoadingGroupCounts(false);
      }
    };
    
    fetchGroupCounts();
  }, [filteredModules, loading, view]);

  // Load groups when selecting a module
  useEffect(() => {
    if (!selectedModule) return;

    setGroupsLoading(true);
    fetchGroupsByModule(selectedModule.code)
      .then((fetchedGroups) => {
        setGroups(fetchedGroups);
        setGroupsLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching groups:', error);
        setGroups([]);
        setGroupsLoading(false);
      });
  }, [selectedModule]);

  const handleSelectModule = (module) => {
    setSelectedModule(module);
    setView('details');
  };

  const handleCreateGroup = () => {
    if (selectedModule) {
      navigate(`/groups/create?moduleCode=${selectedModule.code}`);
    }
  };

  const handleBackToList = () => {
    setSelectedModule(null);
    setView('list');
  };

  const handleMajorSelect = (major) => {
    setSelectedMajor(major);
    // Update URL without reloading
    const params = new URLSearchParams(location.search);
    if (major) {
      params.set('major', major.code);
    } else {
      params.delete('major');
    }
    navigate(`?${params.toString()}`, { replace: true });
  };

  const handleClearMajor = () => {
    setSelectedMajor(null);
    const params = new URLSearchParams(location.search);
    params.delete('major');
    navigate(`?${params.toString()}`, { replace: true });
  };

  // Group modules by year level 
  const modulesByYearLevel = React.useMemo(() => {
    if (!filteredModules.length) return {};
    
    const grouped = {};
    
    filteredModules.forEach(module => {
      // Try to extract year level from module code (e.g., COM1001 -> Year 1)
      const match = module.code.match(/[A-Z]{3}(\d)/);
      const yearLevel = match ? `Year ${match[1]}` : 'Other Modules';
      
      if (!grouped[yearLevel]) {
        grouped[yearLevel] = [];
      }
      
      grouped[yearLevel].push(module);
    });
    
    // Sort each year level's modules alphabetically
    Object.keys(grouped).forEach(year => {
      grouped[year] = grouped[year].sort((a, b) => a.name.localeCompare(b.name));
    });
    
    return grouped;
  }, [filteredModules]);

  // Get program names for a module
  const getProgramsForModule = (moduleCode) => {
    const modulePrograms = modules.find(m => m.code === moduleCode)?.programs || [];
    return modulePrograms
      .map(programCode => majors.find(m => m.code === programCode)?.name || '')
      .filter(Boolean)
      .join(', ');
  };

  // Get department name for a major
  const getDepartmentName = (departmentCode) => {
    const department = departments
      .flatMap(faculty => faculty.departments)
      .find(dep => dep.code === departmentCode);
    return department?.name || 'Unknown Department';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ios-gray6 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-ios-large-title font-sf-pro text-black mb-4">
          {view === 'list' ? 'All Modules' : 'Module Details'}
        </h1>

        {view === 'list' && (
          <>
            {/* Quick Major Filters */}
            {quickFilterMajors.length > 0 && (
              <div className="mb-4 overflow-x-auto">
                <div className="flex space-x-2 pb-1">
                  <button
                    onClick={handleClearMajor}
                    className={`py-2 px-3 rounded-full text-sm flex-shrink-0 transition-colors ${!selectedMajor 
                      ? 'bg-ios-blue text-white' 
                      : 'bg-white text-ios-gray border border-ios-gray4'}`}
                  >
                    All Majors
                  </button>
                  
                  {quickFilterMajors.map(major => (
                    <button
                      key={major.code}
                      onClick={() => handleMajorSelect(major)}
                      className={`py-2 px-3 rounded-full text-sm flex-shrink-0 transition-colors ${
                        selectedMajor?.code === major.code 
                          ? 'bg-ios-blue text-white' 
                          : 'bg-white text-ios-gray border border-ios-gray4'
                      }`}
                    >
                      {major.name}
                      <span className="ml-1 text-xs">
                        ({modulesPerMajor[major.code] || 0})
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Major Selection */}
            <div className="mb-4 bg-white ios-card shadow-sm rounded-xl p-4">
              <div className="flex flex-col mb-2">
                <label htmlFor="major-select" className="text-ios-headline font-medium mb-2">
                  Filter by Program/Major
                </label>
                <div className="relative">
                  <select 
                    id="major-select"
                    value={selectedMajor ? selectedMajor.code : ''}
                    onChange={(e) => {
                      const majorCode = e.target.value;
                      if (!majorCode) {
                        handleClearMajor();
                        return;
                      }
                      
                      const major = majors.find(m => m.code === majorCode);
                      if (major) {
                        handleMajorSelect(major);
                      }
                    }}
                    className="ios-input w-full py-2 pl-3 pr-10 appearance-none"
                  >
                    <option value="">All Majors/Programs</option>
                    {/* Group options by department */}
                    {Object.entries(majorsByDepartment).map(([departmentCode, department]) => (
                      <optgroup key={departmentCode} label={`${department.name} (${department.majors.length})`}>
                        {department.majors.map(major => (
                          <option key={major.code} value={major.code}>
                            {major.name} ({modulesPerMajor[major.code] || 0})
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {selectedMajor && (
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Selected Program: <span className="text-ios-blue">{selectedMajor.name}</span></p>
                    <p className="text-xs text-ios-gray">{getDepartmentName(selectedMajor.department)} · {modulesPerMajor[selectedMajor.code] || 0} modules</p>
                  </div>
                  <button 
                    onClick={handleClearMajor}
                    className="text-ios-blue text-sm hover:text-ios-blue-dark focus:outline-none"
                  >
                    Clear Selection
                  </button>
                </div>
              )}
            </div>

            {/* Search Input */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search modules by name or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="ios-input w-full pl-10"
                />
                <svg className="w-5 h-5 absolute left-3 top-3 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {selectedMajor ? (
                <p className="text-ios-subhead text-ios-gray mt-2">
                  Showing modules for {selectedMajor.name}
                  {filteredModules.length > 0 && ` (${filteredModules.length} ${filteredModules.length === 1 ? 'module' : 'modules'})`}
                </p>
              ) : userProfile?.department && (
                <p className="text-ios-subhead text-ios-gray mt-2">
                  Showing modules relevant to your department first
                </p>
              )}
            </div>
          </>
        )}

        {view === 'details' && (
          <div className="mb-4">
            <button 
              className="flex items-center text-ios-blue mb-4"
              onClick={handleBackToList}
            >
              <svg className="w-5 h-5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293-3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              Back to All Modules
            </button>
          </div>
        )}

        {/* Module List View */}
        {view === 'list' && (
          <>
            {filteredModules.length > 0 ? (
              Object.entries(modulesByYearLevel).length > 1 ? (
                // Group modules by year level if there are multiple year levels
                Object.entries(modulesByYearLevel).sort().map(([yearLevel, modules]) => (
                  <div key={yearLevel} className="mb-6">
                    <h2 className="text-ios-headline font-sf-pro-text font-semibold mb-3 pl-1">
                      {yearLevel} <span className="text-ios-gray text-sm font-normal">({modules.length})</span>
                    </h2>
                    <div className="bg-white ios-card shadow-sm rounded-xl overflow-hidden">
                      <ul className="divide-y divide-gray-100">
                        {modules.map(module => (
                          <li 
                            key={module.code} 
                            className="p-4 hover:bg-ios-gray6 transition-colors cursor-pointer"
                            onClick={() => handleSelectModule(module)}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{module.name}</p>
                                <p className="text-sm text-ios-gray mb-1">{module.code}</p>
                                <p className="text-xs text-ios-gray truncate max-w-xs">
                                  {getProgramsForModule(module.code) || 'No associated programs'}
                                </p>
                              </div>
                              <div className="flex items-center">
                                {moduleGroupCounts[module.code] > 0 && (
                                  <div className="mr-3 flex items-center text-ios-blue rounded-full bg-blue-50 px-2 py-1">
                                    <FaUsers className="mr-1" />
                                    <span>{moduleGroupCounts[module.code]}</span>
                                  </div>
                                )}
                                <svg className="w-5 h-5 text-ios-gray flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4-4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))
              ) : (
                // Simple list if there's only one year level
                <div className="bg-white ios-card shadow-sm rounded-xl overflow-hidden">
                  <ul className="divide-y divide-gray-100">
                    {filteredModules.map(module => (
                      <li 
                        key={module.code} 
                        className="p-4 hover:bg-ios-gray6 transition-colors cursor-pointer"
                        onClick={() => handleSelectModule(module)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{module.name}</p>
                            <p className="text-sm text-ios-gray mb-1">{module.code}</p>
                            <p className="text-xs text-ios-gray truncate max-w-xs">
                              {getProgramsForModule(module.code) || 'No associated programs'}
                            </p>
                          </div>
                          <div className="flex items-center">
                            {moduleGroupCounts[module.code] > 0 && (
                              <div className="mr-3 flex items-center text-ios-blue rounded-full bg-blue-50 px-2 py-1">
                                <FaUsers className="mr-1" />
                                <span>{moduleGroupCounts[module.code]}</span>
                              </div>
                            )}
                            <svg className="w-5 h-5 text-ios-gray flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4-4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            ) : (
              <div className="p-8 text-center bg-white ios-card shadow-sm rounded-xl">
                <p className="text-ios-gray mb-2">No modules found</p>
                {selectedMajor && (
                  <p className="text-sm text-ios-gray mb-3">
                    No modules available for {selectedMajor.name}
                  </p>
                )}
                {searchTerm && <p className="text-sm text-ios-gray">Try a different search term</p>}
                {selectedMajor && (
                  <button
                    onClick={handleClearMajor}
                    className="mt-4 ios-button-outline text-ios-blue"
                  >
                    Clear Major Filter
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* Module Details View */}
        {view === 'details' && selectedModule && (
          <div>
            <div className="bg-white ios-card shadow-sm rounded-xl p-4 mb-6">
              <h2 className="text-ios-headline font-sf-pro-text font-semibold mb-4">{selectedModule.name}</h2>
              <div className="mb-4">
                <p className="mb-2"><span className="font-medium">Module Code:</span> {selectedModule.code}</p>
                <p className="mb-2"><span className="font-medium">Programs:</span> {getProgramsForModule(selectedModule.code) || 'None'}</p>
                {!groupsLoading && groups.length > 0 && (
                  <div className="flex items-center mt-4 bg-blue-50 p-3 rounded-lg">
                    <FaUsers className="text-blue-500 mr-2" />
                    <p className="text-ios-gray">
                      <span className="font-medium text-blue-600">{groups.length}</span> active study {groups.length === 1 ? 'group' : 'groups'} for this module
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <button
                  onClick={handleCreateGroup}
                  className="ios-button w-full flex items-center justify-center"
                >
                  <FaUsers className="mr-2" />
                  Create Study Group for this Module
                </button>
              </div>
            </div>

            <div className="bg-white ios-card shadow-sm rounded-xl p-4">
              <h2 className="text-ios-headline font-sf-pro-text font-semibold mb-4">Study Groups</h2>
              
              {groupsLoading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : groups.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {groups.map((group) => (
                    <li 
                      key={group.id} 
                      className="py-3 px-2 hover:bg-ios-gray6 transition-colors cursor-pointer"
                      onClick={() => navigate(`/groups/${group.id}`)}
                    >
                      <p className="font-medium">{group.name}</p>
                      <p className="text-sm text-ios-gray">
                        {group.memberCount || 0} {group.memberCount === 1 ? 'member' : 'members'}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-6 text-center">
                  <p className="text-ios-gray mb-3">No study groups found for this module.</p>
                  <p className="text-sm text-ios-gray mb-4">Be the first to create a study group!</p>
                  <button
                    onClick={handleCreateGroup}
                    className="ios-button-outline text-ios-blue"
                  >
                    Create the First Group
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModulesList;