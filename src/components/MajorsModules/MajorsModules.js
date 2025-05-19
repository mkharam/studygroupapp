import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMajorsModules } from '../../context/MajorsModulesContext';
import { useAuth } from '../../context/AuthContext';
import { fetchGroupsByModule } from '../../firebase';
import { FaFilter, FaSearch, FaStar, FaChevronDown, FaChevronUp, FaGraduationCap } from 'react-icons/fa';

const MajorsModules = () => {
  const { departments, majors, modules, loading } = useMajorsModules();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get query parameters
  const initialTab = searchParams.get('tab') || 'majors';
  const initialModuleCode = searchParams.get('moduleCode');
  const initialMajorCode = searchParams.get('majorCode');

  // State
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMajor, setSelectedMajor] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [majorModules, setMajorModules] = useState([]);
  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [view, setView] = useState('list');
  const [expandedFaculty, setExpandedFaculty] = useState(null);
  const [expandedDepartment, setExpandedDepartment] = useState(null);
  const [categorizedMajors, setCategorizedMajors] = useState({});
  const [categorizedModules, setCategorizedModules] = useState({});
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    level: 'all',
    year: 'all',
    semester: 'all'
  });
  const [favoriteModules, setFavoriteModules] = useState([]);
  const [favoriteModulesMap, setFavoriteModulesMap] = useState({});
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('name');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});

  // Set initial selections based on URL params
  useEffect(() => {
    if (initialMajorCode && !selectedMajor) {
      const major = majors.find(m => m.code === initialMajorCode);
      if (major) {
        setSelectedMajor(major);
        setView('details');
        setActiveTab('majors');
      }
    }
    
    if (initialModuleCode && !selectedModule) {
      const module = modules.find(m => m.code === initialModuleCode);
      if (module) {
        setSelectedModule(module);
        setView('details');
        setActiveTab('modules');
      }
    }
  }, [initialMajorCode, initialModuleCode, majors, modules, selectedMajor, selectedModule]);

  // Load favorite modules from user profile if available
  useEffect(() => {
    if (userProfile?.favoriteModules) {
      setFavoriteModules(userProfile.favoriteModules);
      
      // Create a map for quick access
      const favMap = {};
      userProfile.favoriteModules.forEach(moduleCode => {
        favMap[moduleCode] = true;
      });
      setFavoriteModulesMap(favMap);
    }
  }, [userProfile]);

  // Categorize majors by faculty and department
  useEffect(() => {
    if (loading || !majors.length || !departments.length) return;
    
    const categorized = {};
    
    departments.forEach(faculty => {
      categorized[faculty.code] = {
        name: faculty.name,
        departments: {}
      };
      
      faculty.departments.forEach(dept => {
        categorized[faculty.code].departments[dept.code] = {
          name: dept.name,
          majors: majors.filter(major => major.department === dept.code)
        };
      });
    });
    
    setCategorizedMajors(categorized);
    
    // If user has faculty set, expand it by default
    if (userProfile?.faculty && !initialLoadDone) {
      setExpandedFaculty(userProfile.faculty);
      
      // If user has department set, expand it as well
      if (userProfile?.department) {
        setExpandedDepartment(userProfile.department);
      }
      setInitialLoadDone(true);
    }
  }, [majors, departments, loading, userProfile, initialLoadDone]);

  // Categorize modules by department
  useEffect(() => {
    if (loading || !modules.length || !majors.length) return;
    
    const categorized = {
      favorites: {
        name: "Your Favorites",
        modules: []
      },
      byDepartment: {}
    };
    
    // Group modules by department
    modules.forEach(module => {
      if (!module.programs) return;
      
      // Check if this is a favorite module
      if (favoriteModulesMap[module.code]) {
        categorized.favorites.modules.push(module);
      }
      
      // Find departments for this module's programs
      const programDepartments = new Set();
      module.programs.forEach(programCode => {
        const major = majors.find(m => m.code === programCode);
        if (major && major.department) {
          programDepartments.add(major.department);
        }
      });
      
      // Add module to each department's list
      programDepartments.forEach(deptCode => {
        if (!categorized.byDepartment[deptCode]) {
          const dept = departments
            .flatMap(f => f.departments)
            .find(d => d.code === deptCode);
          
          if (dept) {
            categorized.byDepartment[deptCode] = {
              name: dept.name,
              modules: []
            };
          } else {
            categorized.byDepartment[deptCode] = {
              name: "Unknown Department",
              modules: []
            };
          }
        }
        
        categorized.byDepartment[deptCode].modules.push(module);
      });
    });
    
    // Sort modules within each category
    if (categorized.favorites.modules.length > 0) {
      categorized.favorites.modules.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    Object.keys(categorized.byDepartment).forEach(deptCode => {
      categorized.byDepartment[deptCode].modules.sort((a, b) => a.name.localeCompare(b.name));
    });
    
    setCategorizedModules(categorized);
  }, [modules, majors, departments, loading, favoriteModulesMap]);

  // Filter majors based on user's faculty/department if available
  useEffect(() => {
    if (loading) return;

    let filtered = [...majors];

    // If user has faculty or department set, prioritize those majors
    if (userProfile?.faculty || userProfile?.department) {
      filtered = majors.sort((a, b) => {
        // First sort by department match
        if (userProfile?.department) {
          const aDepartmentMatch = a.department === userProfile.department ? -1 : 0;
          const bDepartmentMatch = b.department === userProfile.department ? -1 : 0;
          if (aDepartmentMatch !== bDepartmentMatch) return bDepartmentMatch - aDepartmentMatch;
        }
        
        // Then sort by faculty match
        if (userProfile?.faculty) {
          const aFacultyMatch = a.faculty === userProfile.faculty ? -1 : 0;
          const bFacultyMatch = b.faculty === userProfile.faculty ? -1 : 0;
          return bFacultyMatch - aFacultyMatch;
        }
        
        return 0;
      });
    }

    setCategorizedMajors(prev => ({
      ...prev,
      searchResults: filtered
    }));
  }, [majors, userProfile, loading]);

  // Filter modules based on user's department if available
  useEffect(() => {
    if (loading) return;

    let filtered = [...modules];

    // Apply year, level and semester filters
    if (filterOptions.year !== 'all') {
      filtered = filtered.filter(module => {
        const yearMatch = module.code.match(/[A-Z]+(\d)/);
        return yearMatch && yearMatch[1] === filterOptions.year;
      });
    }
    
    if (filterOptions.level !== 'all') {
      filtered = filtered.filter(module => {
        if (filterOptions.level === 'undergraduate') {
          const level = parseInt(module.code.match(/[A-Z]+(\d)/)?.[1] || '0');
          return level >= 1 && level <= 3;
        } else if (filterOptions.level === 'postgraduate') {
          const level = parseInt(module.code.match(/[A-Z]+(\d)/)?.[1] || '0');
          return level >= 5;
        }
        return true;
      });
    }
    
    if (filterOptions.semester !== 'all') {
      filtered = filtered.filter(module => {
        // Module codes often end with something like "S1" or "S2" for semester
        return module.code.includes(`S${filterOptions.semester}`);
      });
    }

    // If user has a department set, prioritize modules from that department
    if (userProfile?.department) {
      const departmentMajors = majors.filter(major => major.department === userProfile.department);
      const departmentModuleCodes = new Set();

      departmentMajors.forEach(major => {
        const majorModules = modules.filter(module => module.programs?.includes(major.code));
        majorModules.forEach(module => departmentModuleCodes.add(module.code));
      });

      // Sort modules so department modules appear first
      filtered = filtered.sort((a, b) => {
        const aInDepartment = departmentModuleCodes.has(a.code) ? -1 : 0;
        const bInDepartment = departmentModuleCodes.has(b.code) ? -1 : 0;
        return bInDepartment - aInDepartment;
      });
    }

    setCategorizedModules(prev => ({
      ...prev,
      searchResults: filtered
    }));
  }, [modules, majors, userProfile, loading, filterOptions]);

  // Handle search across both majors and modules
  useEffect(() => {
    if (loading) return;
    
    if (!searchTerm.trim()) {
      // Reset to default filtered lists
      if (activeTab === 'majors') {
        let filtered = [...majors];
        
        if (userProfile?.faculty || userProfile?.department) {
          filtered = majors.sort((a, b) => {
            if (userProfile?.department) {
              const aDepartmentMatch = a.department === userProfile.department ? -1 : 0;
              const bDepartmentMatch = b.department === userProfile.department ? -1 : 0;
              if (aDepartmentMatch !== bDepartmentMatch) return bDepartmentMatch - aDepartmentMatch;
            }
            
            if (userProfile?.faculty) {
              const aFacultyMatch = a.faculty === userProfile.faculty ? -1 : 0;
              const bFacultyMatch = b.faculty === userProfile.faculty ? -1 : 0;
              return bFacultyMatch - aFacultyMatch;
            }
            
            return 0;
          });
        }
        
        setCategorizedMajors(prev => ({
          ...prev,
          searchResults: filtered
        }));
      } else if (activeTab === 'modules') {
        let filtered = [...modules];
        
        // Apply filters
        if (filterOptions.year !== 'all') {
          filtered = filtered.filter(module => {
            const yearMatch = module.code.match(/[A-Z]+(\d)/);
            return yearMatch && yearMatch[1] === filterOptions.year;
          });
        }
        
        if (filterOptions.level !== 'all') {
          filtered = filtered.filter(module => {
            if (filterOptions.level === 'undergraduate') {
              const level = parseInt(module.code.match(/[A-Z]+(\d)/)?.[1] || '0');
              return level >= 1 && level <= 3;
            } else if (filterOptions.level === 'postgraduate') {
              const level = parseInt(module.code.match(/[A-Z]+(\d)/)?.[1] || '0');
              return level >= 5;
            }
            return true;
          });
        }
        
        if (filterOptions.semester !== 'all') {
          filtered = filtered.filter(module => {
            return module.code.includes(`S${filterOptions.semester}`);
          });
        }
        
        if (userProfile?.department) {
          const departmentMajors = majors.filter(major => major.department === userProfile.department);
          const departmentModuleCodes = new Set();
          
          departmentMajors.forEach(major => {
            const majorModules = modules.filter(module => module.programs?.includes(major.code));
            majorModules.forEach(module => departmentModuleCodes.add(module.code));
          });
          
          filtered = filtered.sort((a, b) => {
            const aInDepartment = departmentModuleCodes.has(a.code) ? -1 : 0;
            const bInDepartment = departmentModuleCodes.has(b.code) ? -1 : 0;
            return bInDepartment - aInDepartment;
          });
        }
        
        setCategorizedModules(prev => ({
          ...prev,
          searchResults: filtered
        }));
      }
      return;
    }

    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    
    if (activeTab === 'majors' || activeTab === 'all') {
      // Search by major name or code
      const matchedMajors = majors.filter(
        major => major.name.toLowerCase().includes(lowerCaseSearchTerm) || 
                major.code.toLowerCase().includes(lowerCaseSearchTerm)
      );
      setCategorizedMajors(prev => ({
        ...prev,
        searchResults: matchedMajors
      }));
    }
    
    if (activeTab === 'modules' || activeTab === 'all') {
      // Search by module name or code
      const matchedModules = modules.filter(
        module => module.name.toLowerCase().includes(lowerCaseSearchTerm) || 
                module.code.toLowerCase().includes(lowerCaseSearchTerm)
      );
      setCategorizedModules(prev => ({
        ...prev,
        searchResults: matchedModules
      }));
    }
  }, [searchTerm, activeTab, majors, modules, userProfile, loading, filterOptions]);

  // Load modules when selecting a major
  useEffect(() => {
    if (!selectedMajor) return;

    const modulesForMajor = modules.filter(module => 
      module.programs && module.programs.includes(selectedMajor.code)
    );
    
    setMajorModules(modulesForMajor);
  }, [selectedMajor, modules]);

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

  // Update URL when tab or selections change
  useEffect(() => {
    const params = new URLSearchParams();
    
    params.set('tab', activeTab);
    
    if (activeTab === 'majors' && selectedMajor) {
      params.set('majorCode', selectedMajor.code);
    } else if (activeTab === 'modules' && selectedModule) {
      params.set('moduleCode', selectedModule.code);
    }
    
    setSearchParams(params);
  }, [activeTab, selectedMajor, selectedModule, setSearchParams]);

  // Remove the quick access useEffect
  useEffect(() => {
    if (!modules.length || !userProfile) return;
    
    // Get user's department modules
    const departmentModules = modules.filter(module => {
      if (!userProfile.department) return false;
      const departmentMajors = majors.filter(major => major.department === userProfile.department);
      return module.programs?.some(program => 
        departmentMajors.some(major => major.code === program)
      );
    });
    
    // Get user's favorite modules
    const favoriteModules = modules.filter(module => 
      favoriteModulesMap[module.code]
    );
    
    // Update categorized modules with department and favorite modules
    setCategorizedModules(prev => ({
      ...prev,
      departmentModules,
      favoriteModules
    }));
  }, [modules, majors, userProfile, favoriteModulesMap]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setView('list');
    setSelectedMajor(null);
    setSelectedModule(null);
  };

  const handleSelectMajor = (major) => {
    setSelectedMajor(major);
    setView('details');
  };

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
    setSelectedMajor(null);
    setSelectedModule(null);
    setView('list');
  };
  
  // Toggle faculty expansion
  const toggleFaculty = (facultyCode) => {
    setExpandedFaculty(expandedFaculty === facultyCode ? null : facultyCode);
    // Close any open department when changing faculty
    setExpandedDepartment(null);
  };
  
  // Toggle department expansion
  const toggleDepartment = (departmentCode) => {
    setExpandedDepartment(expandedDepartment === departmentCode ? null : departmentCode);
  };

  // Get department and faculty names for a major
  const getDepartmentInfo = (major) => {
    const departmentName = departments
      .flatMap(faculty => faculty.departments)
      .find(dep => dep.code === major.department)?.name || 'Unknown Department';
      
    const facultyName = departments
      .find(faculty => faculty.code === major.faculty)?.name || 'Unknown Faculty';
      
    return { departmentName, facultyName };
  };

  // Get program names for a module
  const getProgramsForModule = (moduleCode) => {
    const modulePrograms = modules.find(m => m.code === moduleCode)?.programs || [];
    return modulePrograms
      .map(programCode => majors.find(m => m.code === programCode)?.name || '')
      .filter(Boolean)
      .join(', ');
  };
  
  // Toggle favorite module
  const toggleFavoriteModule = (moduleCode) => {
    // Implementation would need to be connected to user profile in Firebase
    console.log(`Toggle favorite for ${moduleCode}`);
    
    // Optimistic UI update
    if (favoriteModulesMap[moduleCode]) {
      const newFavorites = favoriteModules.filter(code => code !== moduleCode);
      setFavoriteModules(newFavorites);
      setFavoriteModulesMap(prev => {
        const updated = {...prev};
        delete updated[moduleCode];
        return updated;
      });
    } else {
      const newFavorites = [...favoriteModules, moduleCode];
      setFavoriteModules(newFavorites);
      setFavoriteModulesMap(prev => ({
        ...prev,
        [moduleCode]: true
      }));
    }
  };
  
  // Render filter options for modules
  const renderFilterOptions = () => {
    return (
      <div className={`absolute top-full right-0 mt-2 bg-white dark:bg-ios-dark-elevated shadow-lg rounded-xl p-4 z-10 w-64 transition-all duration-200 ${filterMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <h3 className="font-medium mb-3 dark:text-ios-dark-text">Filter Modules</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-ios-gray dark:text-ios-dark-text-secondary text-sm mb-1">Level</label>
            <select 
              value={filterOptions.level}
              onChange={(e) => setFilterOptions({...filterOptions, level: e.target.value})}
              className="ios-input w-full text-sm dark:bg-ios-dark-secondary dark:border-ios-dark-border dark:text-ios-dark-text"
            >
              <option value="all">All Levels</option>
              <option value="undergraduate">Undergraduate</option>
              <option value="postgraduate">Postgraduate</option>
            </select>
          </div>
          
          <div>
            <label className="block text-ios-gray dark:text-ios-dark-text-secondary text-sm mb-1">Year</label>
            <select 
              value={filterOptions.year}
              onChange={(e) => setFilterOptions({...filterOptions, year: e.target.value})}
              className="ios-input w-full text-sm dark:bg-ios-dark-secondary dark:border-ios-dark-border dark:text-ios-dark-text"
            >
              <option value="all">All Years</option>
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3">Year 3</option>
              <option value="4">Year 4+</option>
            </select>
          </div>
          
          <div>
            <label className="block text-ios-gray dark:text-ios-dark-text-secondary text-sm mb-1">Semester</label>
            <select 
              value={filterOptions.semester}
              onChange={(e) => setFilterOptions({...filterOptions, semester: e.target.value})}
              className="ios-input w-full text-sm dark:bg-ios-dark-secondary dark:border-ios-dark-border dark:text-ios-dark-text"
            >
              <option value="all">All Semesters</option>
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4 flex justify-between">
          <button 
            onClick={() => {
              setFilterOptions({level: 'all', year: 'all', semester: 'all'});
            }}
            className="text-sm text-ios-blue dark:text-ios-teal hover:underline"
          >
            Reset
          </button>
          <button 
            onClick={() => setFilterMenuOpen(false)}
            className="ios-button text-sm px-4"
          >
            Apply
          </button>
        </div>
      </div>
    );
  };

  // Add new function for sorting modules
  const sortModules = (modulesToSort) => {
    return [...modulesToSort].sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'code') {
        return a.code.localeCompare(b.code);
      } else if (sortBy === 'year') {
        const aYear = parseInt(a.code.match(/[A-Z]+(\d)/)?.[1] || '0');
        const bYear = parseInt(b.code.match(/[A-Z]+(\d)/)?.[1] || '0');
        return aYear - bYear;
      }
      return 0;
    });
  };

  // Add new function to handle section expansion
  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ios-gray6 dark:bg-ios-dark-bg p-4 transition-colors duration-200">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-ios-large-title font-sf-pro text-black dark:text-ios-dark-text mb-4">
          Academic Directory
        </h1>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-ios-dark-elevated ios-card shadow-sm rounded-xl mb-6 overflow-hidden">
          <div className="flex">
            <button 
              className={`py-3 px-4 flex-1 text-center font-medium ${activeTab === 'majors' ? 'text-ios-blue dark:text-ios-teal border-b-2 border-ios-blue dark:border-ios-teal' : 'text-ios-gray dark:text-ios-dark-text-secondary'}`}
              onClick={() => handleTabChange('majors')}
            >
              Programs
            </button>
            <button 
              className={`py-3 px-4 flex-1 text-center font-medium ${activeTab === 'modules' ? 'text-ios-blue dark:text-ios-teal border-b-2 border-ios-blue dark:border-ios-teal' : 'text-ios-gray dark:text-ios-dark-text-secondary'}`}
              onClick={() => handleTabChange('modules')}
            >
              Modules
            </button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 flex items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400 dark:text-ios-dark-text-tertiary" />
            </div>
            <input
              type="text"
              placeholder={activeTab === 'majors' ? 'Search programs/majors...' : 'Search modules...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ios-input w-full pl-10 dark:bg-ios-dark-secondary dark:border-ios-dark-border dark:text-ios-dark-text"
            />
          </div>

          {activeTab === 'modules' && (
            <div className="relative">
              <button 
                className="ios-button-outline p-2 dark:border-ios-dark-border dark:text-ios-dark-text"
                onClick={() => setFilterMenuOpen(!filterMenuOpen)}
                aria-label="Filter options"
              >
                <FaFilter />
              </button>
              {renderFilterOptions()}
            </div>
          )}
        </div>

        {/* Hint text about prioritized results */}
        {(userProfile?.department || userProfile?.faculty) && activeTab === 'majors' && view === 'list' && (
          <p className="text-ios-subhead text-ios-gray dark:text-ios-dark-text-tertiary mt-1 mb-4">
            {userProfile?.department ? 'Showing programs from your department first' : 'Showing programs from your faculty first'}
          </p>
        )}
        
        {userProfile?.department && activeTab === 'modules' && view === 'list' && (
          <p className="text-ios-subhead text-ios-gray dark:text-ios-dark-text-tertiary mt-1 mb-4">
            Showing modules relevant to your department first
          </p>
        )}

        {view === 'details' && (
          <div className="mb-4">
            <button 
              className="flex items-center text-ios-blue dark:text-ios-teal mb-4"
              onClick={handleBackToList}
            >
              <svg className="w-5 h-5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {activeTab === 'majors' ? 'Back to All Programs' : 'Back to All Modules'}
            </button>
          </div>
        )}

        {/* Majors List View - Categorized */}
        {activeTab === 'majors' && view === 'list' && !searchTerm && (
          <div className="space-y-4">
            {Object.keys(categorizedMajors).map(facultyCode => {
              const faculty = categorizedMajors[facultyCode];
              const isExpanded = expandedFaculty === facultyCode;
              
              // Highlight if this is user's faculty
              const isUserFaculty = userProfile?.faculty === facultyCode;
              
              return (
                <div 
                  key={facultyCode} 
                  className={`bg-white dark:bg-ios-dark-elevated ios-card shadow-sm rounded-xl overflow-hidden transition-all duration-200 ${isUserFaculty ? 'border-l-4 border-ios-blue dark:border-ios-teal' : ''}`}
                >
                  <button 
                    onClick={() => toggleFaculty(facultyCode)}
                    className="w-full py-4 px-4 flex justify-between items-center hover:bg-ios-gray6 dark:hover:bg-ios-dark-secondary transition-colors text-left"
                  >
                    <div>
                      <h2 className="font-medium dark:text-ios-dark-text">{faculty.name}</h2>
                      <p className="text-ios-subhead text-ios-gray dark:text-ios-dark-text-secondary">
                        {Object.keys(faculty.departments).reduce((total, deptCode) => {
                          return total + faculty.departments[deptCode].majors.length;
                        }, 0)} programs
                      </p>
                    </div>
                    {isExpanded ? <FaChevronUp className="text-ios-gray dark:text-ios-dark-text-secondary" /> : <FaChevronDown className="text-ios-gray dark:text-ios-dark-text-secondary" />}
                  </button>
                  
                  {isExpanded && (
                    <div className="border-t border-ios-gray6 dark:border-ios-dark-border">
                      {Object.keys(faculty.departments).map(deptCode => {
                        const dept = faculty.departments[deptCode];
                        const isDepartmentExpanded = expandedDepartment === deptCode;
                        
                        // Highlight if this is user's department
                        const isUserDepartment = userProfile?.department === deptCode;
                        
                        return (
                          <div key={deptCode} className={`border-b last:border-b-0 border-ios-gray6 dark:border-ios-dark-border ${isUserDepartment ? 'bg-ios-blue bg-opacity-5 dark:bg-opacity-10' : ''}`}>
                            <button 
                              onClick={() => toggleDepartment(deptCode)}
                              className="w-full py-3 px-4 flex justify-between items-center hover:bg-ios-gray6 dark:hover:bg-ios-dark-secondary transition-colors text-left"
                            >
                              <div className="flex items-center">
                                {isUserDepartment && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-ios-blue dark:bg-ios-teal mr-2"></span>
                                )}
                                <div>
                                  <h3 className="font-medium dark:text-ios-dark-text">{dept.name}</h3>
                                  <p className="text-xs text-ios-gray dark:text-ios-dark-text-secondary">
                                    {dept.majors.length} programs
                                  </p>
                                </div>
                              </div>
                              {isDepartmentExpanded ? <FaChevronUp className="text-ios-gray dark:text-ios-dark-text-secondary" /> : <FaChevronDown className="text-ios-gray dark:text-ios-dark-text-secondary" />}
                            </button>
                            
                            {isDepartmentExpanded && dept.majors.length > 0 && (
                              <ul className="divide-y divide-ios-gray6 dark:divide-ios-dark-border bg-ios-gray6 dark:bg-ios-dark-secondary">
                                {dept.majors.map(major => (
                                  <li 
                                    key={major.code} 
                                    className="px-4 py-3 hover:bg-ios-gray4 dark:hover:bg-ios-dark-tertiary transition-colors cursor-pointer"
                                    onClick={() => handleSelectMajor(major)}
                                  >
                                    <p className="font-medium dark:text-ios-dark-text">{major.name}</p>
                                    <p className="text-sm text-ios-gray dark:text-ios-dark-text-secondary">{major.code}</p>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Modules List View - Categorized */}
        {activeTab === 'modules' && view === 'list' && !searchTerm && (
          <div className="space-y-4">
            {/* Quick Filters */}
            <div className="flex items-center justify-between bg-white dark:bg-ios-dark-elevated ios-card shadow-sm rounded-xl p-3">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-ios-blue bg-opacity-10 text-ios-blue dark:bg-ios-teal dark:bg-opacity-10 dark:text-ios-teal' : 'text-ios-gray dark:text-ios-dark-text-secondary'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-ios-blue bg-opacity-10 text-ios-blue dark:bg-ios-teal dark:bg-opacity-10 dark:text-ios-teal' : 'text-ios-gray dark:text-ios-dark-text-secondary'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="ios-input text-sm dark:bg-ios-dark-secondary dark:border-ios-dark-border dark:text-ios-dark-text"
                >
                  <option value="name">Name</option>
                  <option value="code">Code</option>
                  <option value="year">Year</option>
                </select>
                <button
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className={`p-2 rounded-lg ${showFavoritesOnly ? 'bg-yellow-400 bg-opacity-10 text-yellow-400' : 'text-ios-gray dark:text-ios-dark-text-secondary'}`}
                >
                  <FaStar className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Favorites Section */}
            {categorizedModules.favorites?.modules.length > 0 && !showFavoritesOnly && (
              <div className="bg-white dark:bg-ios-dark-elevated ios-card shadow-sm rounded-xl overflow-hidden">
                <button 
                  onClick={() => toggleSection('favorites')}
                  className="w-full px-4 py-2 flex justify-between items-center hover:bg-ios-gray6 dark:hover:bg-ios-dark-secondary"
                >
                  <div className="flex items-center">
                    <FaStar className="text-yellow-400 mr-2" />
                    <span className="font-medium dark:text-ios-dark-text">Favorites</span>
                  </div>
                  {expandedSections.favorites ? <FaChevronUp /> : <FaChevronDown />}
                </button>
                {expandedSections.favorites && (
                  <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-3 gap-2 p-3" : "divide-y divide-ios-gray6 dark:divide-ios-dark-border"}>
                    {sortModules(categorizedModules.favorites.modules).map(module => (
                      <div 
                        key={module.code} 
                        className={viewMode === 'grid' ? 
                          "p-2 bg-ios-gray6 dark:bg-ios-dark-secondary rounded-lg hover:shadow transition-shadow cursor-pointer" :
                          "p-3 hover:bg-ios-gray6 dark:hover:bg-ios-dark-secondary transition-colors cursor-pointer"
                        }
                        onClick={() => handleSelectModule(module)}
                      >
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium dark:text-ios-dark-text line-clamp-1">{module.name}</p>
                            <p className="text-sm text-ios-gray dark:text-ios-dark-text-secondary">{module.code}</p>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavoriteModule(module.code);
                            }}
                            className="text-yellow-400"
                          >
                            <FaStar className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Department Sections */}
            {Object.entries(categorizedModules.byDepartment || {}).map(([deptCode, dept]) => {
              const isUserDepartment = userProfile?.department === deptCode;
              let modulesToShow = dept.modules;
              
              // Apply filters
              if (filterOptions.year !== 'all') {
                modulesToShow = modulesToShow.filter(module => {
                  const yearMatch = module.code.match(/[A-Z]+(\d)/);
                  return yearMatch && yearMatch[1] === filterOptions.year;
                });
              }
              
              if (filterOptions.level !== 'all') {
                modulesToShow = modulesToShow.filter(module => {
                  const level = parseInt(module.code.match(/[A-Z]+(\d)/)?.[1] || '0');
                  if (filterOptions.level === 'undergraduate') {
                    return level >= 1 && level <= 3;
                  } else if (filterOptions.level === 'postgraduate') {
                    return level >= 5;
                  }
                  return true;
                });
              }
              
              if (filterOptions.semester !== 'all') {
                modulesToShow = modulesToShow.filter(module => 
                  module.code.includes(`S${filterOptions.semester}`)
                );
              }
              
              if (showFavoritesOnly) {
                modulesToShow = modulesToShow.filter(module => 
                  favoriteModulesMap[module.code]
                );
              }
              
              if (modulesToShow.length === 0) return null;
              
              return (
                <div key={deptCode} className={`group ${isUserDepartment ? 'bg-ios-blue-50 dark:bg-ios-teal dark:bg-opacity-5' : ''}`}>
                  <div className="bg-white dark:bg-ios-dark-elevated ios-card shadow-sm rounded-xl overflow-hidden">
                    <button 
                      onClick={() => toggleSection(deptCode)}
                      className="w-full px-4 py-2 flex justify-between items-center hover:bg-ios-gray6 dark:hover:bg-ios-dark-secondary"
                    >
                      <div className="flex items-center">
                        {isUserDepartment && (
                          <span className="w-1.5 h-1.5 rounded-full bg-ios-blue dark:bg-ios-teal mr-2"></span>
                        )}
                        <span className="font-medium dark:text-ios-dark-text">{dept.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-ios-gray dark:text-ios-dark-text-tertiary">{modulesToShow.length}</span>
                        {expandedSections[deptCode] ? <FaChevronUp /> : <FaChevronDown />}
                      </div>
                    </button>
                    {expandedSections[deptCode] && (
                      <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-3 gap-2 p-3" : "divide-y divide-ios-gray6 dark:divide-ios-dark-border"}>
                        {sortModules(modulesToShow).map(module => (
                          <div 
                            key={module.code} 
                            className={viewMode === 'grid' ? 
                              "p-2 bg-ios-gray6 dark:bg-ios-dark-secondary rounded-lg hover:shadow transition-shadow cursor-pointer" :
                              "p-3 hover:bg-ios-gray6 dark:hover:bg-ios-dark-secondary transition-colors cursor-pointer"
                            }
                            onClick={() => handleSelectModule(module)}
                          >
                            <div className="flex justify-between">
                              <div>
                                <p className="font-medium dark:text-ios-dark-text line-clamp-1">{module.name}</p>
                                <p className="text-sm text-ios-gray dark:text-ios-dark-text-secondary">{module.code}</p>
                              </div>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavoriteModule(module.code);
                                }}
                                className={favoriteModulesMap[module.code] ? "text-yellow-400" : "text-ios-gray4 dark:text-ios-dark-text-tertiary"}
                              >
                                <FaStar className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Search Results View */}
        {view === 'list' && searchTerm && (
          <div className="bg-white dark:bg-ios-dark-elevated ios-card shadow-sm rounded-xl overflow-hidden">
            <h2 className="px-4 py-3 font-medium border-b border-ios-gray6 dark:border-ios-dark-border dark:text-ios-dark-text">
              Search Results
            </h2>
            {activeTab === 'majors' && categorizedMajors.searchResults?.length > 0 ? (
              <ul className="divide-y divide-gray-100 dark:divide-ios-dark-border">
                {categorizedMajors.searchResults.map(major => {
                  const { departmentName, facultyName } = getDepartmentInfo(major);
                  return (
                    <li 
                      key={major.code} 
                      className="p-4 hover:bg-ios-gray6 dark:hover:bg-ios-dark-secondary transition-colors cursor-pointer"
                      onClick={() => handleSelectMajor(major)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium dark:text-ios-dark-text">{major.name}</p>
                          <p className="text-sm text-ios-gray dark:text-ios-dark-text-secondary mb-1">{major.code}</p>
                          <p className="text-xs text-ios-gray dark:text-ios-dark-text-tertiary">{departmentName}</p>
                          <p className="text-xs text-ios-gray dark:text-ios-dark-text-tertiary">{facultyName}</p>
                        </div>
                        <svg className="w-5 h-5 text-ios-gray dark:text-ios-dark-text-tertiary flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a 1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : activeTab === 'modules' && categorizedModules.searchResults?.length > 0 ? (
              <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-3 gap-2 p-3" : "divide-y divide-ios-gray6 dark:divide-ios-dark-border"}>
                {sortModules(categorizedModules.searchResults).map(module => (
                  <div 
                    key={module.code} 
                    className={viewMode === 'grid' ? 
                      "p-2 bg-ios-gray6 dark:bg-ios-dark-secondary rounded-lg hover:shadow transition-shadow cursor-pointer" :
                      "p-3 hover:bg-ios-gray6 dark:hover:bg-ios-dark-secondary transition-colors cursor-pointer"
                    }
                    onClick={() => handleSelectModule(module)}
                  >
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium dark:text-ios-dark-text line-clamp-1">{module.name}</p>
                        <p className="text-sm text-ios-gray dark:text-ios-dark-text-secondary">{module.code}</p>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavoriteModule(module.code);
                        }}
                        className={favoriteModulesMap[module.code] ? "text-yellow-400" : "text-ios-gray4 dark:text-ios-dark-text-tertiary"}
                      >
                        <FaStar className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-ios-gray dark:text-ios-dark-text-secondary mb-2">No results found</p>
                <p className="text-sm text-ios-gray dark:text-ios-dark-text-tertiary">Try a different search term</p>
              </div>
            )}
          </div>
        )}

        {/* Major Details View */}
        {activeTab === 'majors' && view === 'details' && selectedMajor && (
          <div>
            <div className="bg-white dark:bg-ios-dark-elevated ios-card shadow-sm rounded-xl p-4 mb-6">
              <h2 className="text-ios-headline font-sf-pro-text font-semibold mb-4 dark:text-ios-dark-text">{selectedMajor.name}</h2>
              <div className="mb-4">
                <div className="flex items-center mb-4">
                  <FaGraduationCap className="text-ios-blue dark:text-ios-teal mr-2" />
                  <p className="font-medium dark:text-ios-dark-text">{selectedMajor.code}</p>
                </div>
                
                {(() => {
                  const { departmentName, facultyName } = getDepartmentInfo(selectedMajor);
                  return (
                    <div className="bg-ios-gray6 dark:bg-ios-dark-secondary rounded-lg p-4">
                      <p className="mb-2 dark:text-ios-dark-text"><span className="font-medium">Department:</span> {departmentName}</p>
                      <p className="mb-2 dark:text-ios-dark-text"><span className="font-medium">Faculty:</span> {facultyName}</p>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="bg-white dark:bg-ios-dark-elevated ios-card shadow-sm rounded-xl p-4">
              <div className="flex items-center mb-4">
                <h2 className="text-ios-headline font-sf-pro-text font-semibold dark:text-ios-dark-text">Modules</h2>
                <span className="ml-2 bg-ios-gray6 dark:bg-ios-dark-secondary text-ios-gray dark:text-ios-dark-text-secondary text-xs px-2 py-0.5 rounded-full">
                  {majorModules.length}
                </span>
              </div>
              
              {majorModules.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {majorModules.map((module) => (
                    <div 
                      key={module.code} 
                      className="p-3 border border-ios-gray4 dark:border-ios-dark-border rounded-lg hover:bg-ios-gray6 dark:hover:bg-ios-dark-secondary transition-colors cursor-pointer"
                      onClick={() => {
                        setActiveTab('modules');
                        handleSelectModule(module);
                      }}
                    >
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium dark:text-ios-dark-text line-clamp-2">{module.name}</p>
                          <p className="text-sm text-ios-gray dark:text-ios-dark-text-secondary">{module.code}</p>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavoriteModule(module.code);
                          }}
                          className={favoriteModulesMap[module.code] ? "text-yellow-400" : "text-ios-gray4 dark:text-ios-dark-text-tertiary"}
                        >
                          <FaStar />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center">
                  <p className="text-ios-gray dark:text-ios-dark-text-tertiary">No modules found for this program.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Module Details View */}
        {activeTab === 'modules' && view === 'details' && selectedModule && (
          <div>
            <div className="bg-white dark:bg-ios-dark-elevated ios-card shadow-sm rounded-xl p-4 mb-6">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-ios-headline font-sf-pro-text font-semibold dark:text-ios-dark-text">{selectedModule.name}</h2>
                <button 
                  onClick={() => toggleFavoriteModule(selectedModule.code)}
                  className={`${favoriteModulesMap[selectedModule.code] ? "text-yellow-400" : "text-ios-gray4 dark:text-ios-dark-text-tertiary"} p-1`}
                >
                  <FaStar size={20} />
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-xl font-mono mb-2 dark:text-ios-dark-text">{selectedModule.code}</p>
                
                <div className="bg-ios-gray6 dark:bg-ios-dark-secondary rounded-lg p-4 mb-4">
                  <p className="mb-4 dark:text-ios-dark-text">
                    <span className="font-medium">Programs:</span> {getProgramsForModule(selectedModule.code) || 'None'}
                  </p>
                
                  {selectedModule.description && (
                    <div className="mb-4">
                      <p className="font-medium mb-1 dark:text-ios-dark-text">Description:</p>
                      <p className="text-ios-gray dark:text-ios-dark-text-secondary">{selectedModule.description}</p>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <button
                    onClick={handleCreateGroup}
                    className="ios-button w-full flex items-center justify-center"
                  >
                    Create Study Group for this Module
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-ios-dark-elevated ios-card shadow-sm rounded-xl p-4">
              <h2 className="text-ios-headline font-sf-pro-text font-semibold mb-4 dark:text-ios-dark-text">Study Groups</h2>
              
              {groupsLoading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 dark:border-ios-teal"></div>
                </div>
              ) : groups.length > 0 ? (
                <ul className="divide-y divide-gray-100 dark:divide-ios-dark-border">
                  {groups.map((group) => (
                    <li 
                      key={group.id} 
                      className="py-3 px-2 hover:bg-ios-gray6 dark:hover:bg-ios-dark-secondary transition-colors cursor-pointer"
                      onClick={() => navigate(`/groups/${group.id}`)}
                    >
                      <p className="font-medium dark:text-ios-dark-text">{group.name}</p>
                      <p className="text-sm text-ios-gray dark:text-ios-dark-text-secondary">
                        {group.memberCount || 0} {group.memberCount === 1 ? 'member' : 'members'}
                      </p>
                      {group.location && (
                        <p className="text-xs text-ios-gray dark:text-ios-dark-text-tertiary mt-1">{group.location}</p>
                      )}
                      {group.topic && (
                        <p className="text-xs italic text-ios-gray dark:text-ios-dark-text-tertiary mt-1">"{group.topic}"</p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-6 text-center">
                  <p className="text-ios-gray dark:text-ios-dark-text-secondary mb-3">No study groups found for this module.</p>
                  <p className="text-sm text-ios-gray dark:text-ios-dark-text-tertiary mb-4">Be the first to create a study group!</p>
                  <button
                    onClick={handleCreateGroup}
                    className="ios-button-outline text-ios-blue dark:text-ios-teal dark:border-ios-teal"
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

export default MajorsModules;