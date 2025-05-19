import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMajorsModules } from '../../context/MajorsModulesContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const MajorsList = () => {
  const { departments, majors, modules, loading } = useMajorsModules();
  const { userProfile } = useAuth();
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMajors, setFilteredMajors] = useState([]);
  const [selectedMajor, setSelectedMajor] = useState(null);
  const [majorModules, setMajorModules] = useState([]);
  const [view, setView] = useState('list'); // 'list' or 'details'
  const [selectedYear, setSelectedYear] = useState('');
  const [groupedModules, setGroupedModules] = useState({});
  const navigate = useNavigate();

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

    setFilteredMajors(filtered);
  }, [majors, userProfile, loading]);

  // Handle search
  useEffect(() => {
    if (loading) return;
    
    if (!searchTerm.trim()) {
      // Reset to default filtered list
      let filtered = [...majors];
      
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
      
      setFilteredMajors(filtered);
      return;
    }

    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    
    // Search by major name or code
    const matched = majors.filter(
      major => major.name.toLowerCase().includes(lowerCaseSearchTerm) || 
              major.code.toLowerCase().includes(lowerCaseSearchTerm)
    );
    
    setFilteredMajors(matched);
  }, [searchTerm, majors, userProfile, loading]);

  // Load modules when selecting a major
  useEffect(() => {
    if (!selectedMajor) return;

    const modulesForMajor = modules.filter(module => 
      module.programs && module.programs.includes(selectedMajor.code)
    );
    
    setMajorModules(modulesForMajor);

    // Group modules by year
    const grouped = modulesForMajor.reduce((acc, module) => {
      const year = module.year || 'Unknown';
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(module);
      return acc;
    }, {});
    
    setGroupedModules(grouped);
  }, [selectedMajor, modules]);

  const handleSelectMajor = (major) => {
    setSelectedMajor(major);
    setView('details');
  };

  const handleBackToList = () => {
    setSelectedMajor(null);
    setSelectedYear('');
    setView('list');
  };

  const handleSelectModule = (moduleCode) => {
    navigate(`/modules?code=${moduleCode}`);
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

  // Filter modules based on selected year
  const filteredModules = selectedYear 
    ? majorModules.filter(module => module.year === parseInt(selectedYear))
    : majorModules;

  if (loading) {
    return (
      <div className={`flex justify-center items-center min-h-screen ${theme === 'dark' ? 'bg-ios-gray-dark text-white' : 'bg-ios-gray6'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-ios-gray-dark text-white' : 'bg-ios-gray6'} p-4`}>
      <div className="max-w-4xl mx-auto">
        <h1 className={`text-ios-large-title font-sf-pro ${theme === 'dark' ? 'text-white' : 'text-black'} mb-4`}>
          {view === 'list' ? 'All Programs' : 'Program Details'}
        </h1>

        {view === 'list' && (
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search programs/majors by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`ios-input w-full pl-10 ${theme === 'dark' ? 'bg-ios-gray3-dark border-ios-gray3-dark text-white placeholder-ios-gray2-dark' : ''}`}
              />
              <svg className={`w-5 h-5 absolute left-3 top-3 ${theme === 'dark' ? 'text-ios-gray2-dark' : 'text-gray-400'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {(userProfile?.department || userProfile?.faculty) && (
              <p className={`text-ios-subhead ${theme === 'dark' ? 'text-ios-gray2-dark' : 'text-ios-gray'} mt-2`}>
                {userProfile?.department ? 'Showing programs from your department first' : 'Showing programs from your faculty first'}
              </p>
            )}
          </div>
        )}

        {view === 'details' && (
          <div className="mb-4">
            <button 
              className={`flex items-center ${theme === 'dark' ? 'text-ios-blue-dark' : 'text-ios-blue'} mb-4`}
              onClick={handleBackToList}
            >
              <svg className="w-5 h-5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Back to All Programs
            </button>
          </div>
        )}

        {/* Majors List View */}
        {view === 'list' && (
          <div className={`${theme === 'dark' ? 'bg-ios-gray2-dark border border-ios-gray-dark' : 'bg-white'} ios-card shadow-sm rounded-xl overflow-hidden`}>
            {filteredMajors.length > 0 ? (
              <ul className={`divide-y ${theme === 'dark' ? 'divide-ios-gray-dark' : 'divide-gray-100'}`}>
                {filteredMajors.map(major => {
                  const { departmentName, facultyName } = getDepartmentInfo(major);
                  return (
                    <li 
                      key={major.code} 
                      className={`p-4 ${theme === 'dark' ? 'hover:bg-ios-gray-dark' : 'hover:bg-ios-gray6'} transition-colors cursor-pointer`}
                      onClick={() => handleSelectMajor(major)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className={`font-medium ${theme === 'dark' ? 'text-white' : ''}`}>{major.name}</p>
                          <div className="flex items-center mt-1 mb-2">
                            <span className={`text-sm px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-ios-gray-dark text-ios-gray2-dark' : 'bg-ios-gray6 text-ios-gray'}`}>
                              {major.code}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className={`text-xs px-2 py-1 rounded-md ${theme === 'dark' ? 'bg-ios-gray3-dark text-ios-gray2-dark' : 'bg-ios-gray5 text-ios-gray'}`}>
                              {departmentName}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-md ${theme === 'dark' ? 'bg-ios-blue-dark bg-opacity-30 text-ios-blue-dark' : 'bg-ios-blue bg-opacity-10 text-ios-blue'}`}>
                              {facultyName}
                            </span>
                          </div>
                        </div>
                        <svg className={`w-5 h-5 ${theme === 'dark' ? 'text-ios-gray2-dark' : 'text-ios-gray'} flex-shrink-0`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="p-8 text-center">
                <p className={`${theme === 'dark' ? 'text-ios-gray2-dark' : 'text-ios-gray'} mb-2`}>No programs found</p>
                {searchTerm && <p className={`text-sm ${theme === 'dark' ? 'text-ios-gray2-dark' : 'text-ios-gray'}`}>Try a different search term</p>}
              </div>
            )}
          </div>
        )}

        {/* Major Details View */}
        {view === 'details' && selectedMajor && (
          <div>
            <div className={`${theme === 'dark' ? 'bg-ios-gray2-dark border border-ios-gray-dark' : 'bg-white'} ios-card shadow-sm rounded-xl p-4 mb-6`}>
              <h2 className={`text-ios-headline font-sf-pro-text font-semibold mb-4 ${theme === 'dark' ? 'text-white' : ''}`}>{selectedMajor.name}</h2>
              
              <div className="flex items-center mb-4">
                <span className={`text-sm px-3 py-1 rounded-full font-medium ${theme === 'dark' ? 'bg-ios-blue-dark bg-opacity-30 text-ios-blue-dark' : 'bg-ios-blue bg-opacity-10 text-ios-blue'}`}>
                  {selectedMajor.code}
                </span>
              </div>

              <div className={`p-4 rounded-lg mb-4 ${theme === 'dark' ? 'bg-ios-gray3-dark' : 'bg-ios-gray6'}`}>
                {(() => {
                  const { departmentName, facultyName } = getDepartmentInfo(selectedMajor);
                  return (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-y-2 gap-x-6 mb-2">
                        <div>
                          <p className={`text-xs uppercase ${theme === 'dark' ? 'text-ios-gray2-dark' : 'text-ios-gray'} mb-1`}>Department</p>
                          <p className={`font-medium ${theme === 'dark' ? 'text-white' : ''}`}>{departmentName}</p>
                        </div>
                        <div>
                          <p className={`text-xs uppercase ${theme === 'dark' ? 'text-ios-gray2-dark' : 'text-ios-gray'} mb-1`}>Faculty</p>
                          <p className={`font-medium ${theme === 'dark' ? 'text-white' : ''}`}>{facultyName}</p>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Module year filter */}
            <div className={`${theme === 'dark' ? 'bg-ios-gray2-dark border border-ios-gray-dark' : 'bg-white'} ios-card shadow-sm rounded-xl p-4 mb-6`}>
              <div className="flex flex-wrap items-center justify-between mb-4">
                <h2 className={`text-ios-headline font-sf-pro-text font-semibold ${theme === 'dark' ? 'text-white' : ''}`}>Modules by Year</h2>
                
                <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                  <label htmlFor="yearFilter" className={`text-sm ${theme === 'dark' ? 'text-ios-gray2-dark' : 'text-ios-gray'}`}>
                    Filter by year:
                  </label>
                  <select
                    id="yearFilter"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className={`ios-input text-sm py-1 ${theme === 'dark' ? 'bg-ios-gray3-dark border-ios-gray3-dark text-white' : 'bg-white'}`}
                  >
                    <option value="">All Years</option>
                    {Object.keys(groupedModules).sort().map(year => (
                      <option key={year} value={year}>Year {year}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedYear ? (
                  // If year is selected, show modules for that year
                  filteredModules.length > 0 ? (
                    filteredModules.map((module) => (
                      <div
                        key={module.code}
                        onClick={() => handleSelectModule(module.code)}
                        className={`p-4 rounded-lg cursor-pointer ${theme === 'dark' ? 'bg-ios-gray3-dark hover:bg-ios-gray-dark' : 'bg-ios-gray6 hover:bg-ios-gray5'} transition-colors`}
                      >
                        <h3 className={`font-medium ${theme === 'dark' ? 'text-white' : ''}`}>{module.name}</h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className={`text-xs px-2 py-1 rounded-md ${theme === 'dark' ? 'bg-ios-gray-dark text-ios-gray2-dark' : 'bg-white text-ios-gray'}`}>
                            {module.code}
                          </span>
                          {module.credits && (
                            <span className={`text-xs px-2 py-1 rounded-md ${theme === 'dark' ? 'bg-ios-blue-dark bg-opacity-30 text-ios-blue-dark' : 'bg-ios-blue bg-opacity-10 text-ios-blue'}`}>
                              {module.credits} credits
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 py-6 text-center">
                      <p className={`${theme === 'dark' ? 'text-ios-gray2-dark' : 'text-ios-gray'}`}>No modules found for Year {selectedYear}.</p>
                    </div>
                  )
                ) : (
                  // If no year is selected, show modules grouped by year
                  Object.keys(groupedModules).sort().map(year => (
                    <div
                      key={year}
                      className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-ios-gray3-dark' : 'bg-ios-gray6'}`}
                    >
                      <h3 className={`font-medium mb-3 ${theme === 'dark' ? 'text-white' : ''}`}>Year {year}</h3>
                      <div className="space-y-2">
                        {groupedModules[year].slice(0, 3).map(module => (
                          <div
                            key={module.code}
                            onClick={() => handleSelectModule(module.code)} 
                            className={`p-2 rounded cursor-pointer ${theme === 'dark' ? 'hover:bg-ios-gray-dark' : 'hover:bg-white'} transition-colors`}
                          >
                            <p className={`text-sm font-medium truncate ${theme === 'dark' ? 'text-white' : ''}`}>{module.name}</p>
                            <p className={`text-xs ${theme === 'dark' ? 'text-ios-gray2-dark' : 'text-ios-gray'}`}>{module.code}</p>
                          </div>
                        ))}
                        {groupedModules[year].length > 3 && (
                          <button
                            onClick={() => setSelectedYear(year)}
                            className={`text-sm ${theme === 'dark' ? 'text-ios-blue-dark' : 'text-ios-blue'} mt-1`}
                          >
                            +{groupedModules[year].length - 3} more modules
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Detailed modules list */}
            <div className={`${theme === 'dark' ? 'bg-ios-gray2-dark border border-ios-gray-dark' : 'bg-white'} ios-card shadow-sm rounded-xl p-4`}>
              <h2 className={`text-ios-headline font-sf-pro-text font-semibold mb-4 ${theme === 'dark' ? 'text-white' : ''}`}>
                {selectedYear ? `Year ${selectedYear} Modules` : 'All Modules'}
              </h2>
              
              {filteredModules.length > 0 ? (
                <ul className={`divide-y ${theme === 'dark' ? 'divide-ios-gray-dark' : 'divide-gray-100'}`}>
                  {filteredModules.map((module) => (
                    <li 
                      key={module.code} 
                      className={`py-3 px-2 ${theme === 'dark' ? 'hover:bg-ios-gray-dark' : 'hover:bg-ios-gray6'} transition-colors cursor-pointer`}
                      onClick={() => handleSelectModule(module.code)}
                    >
                      <p className={`font-medium ${theme === 'dark' ? 'text-white' : ''}`}>{module.name}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className={`text-xs ${theme === 'dark' ? 'text-ios-gray2-dark' : 'text-ios-gray'}`}>{module.code}</span>
                        {module.semester && (
                          <span className={`text-xs px-2 py-0.5 rounded ${theme === 'dark' ? 'bg-ios-gray3-dark text-ios-gray2-dark' : 'bg-ios-gray6 text-ios-gray'}`}>
                            Semester {module.semester}
                          </span>
                        )}
                        {module.credits && (
                          <span className={`text-xs px-2 py-0.5 rounded ${theme === 'dark' ? 'bg-ios-blue-dark bg-opacity-30 text-ios-blue-dark' : 'bg-ios-blue bg-opacity-10 text-ios-blue'}`}>
                            {module.credits} credits
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-6 text-center">
                  <p className={`${theme === 'dark' ? 'text-ios-gray2-dark' : 'text-ios-gray'}`}>
                    {selectedYear 
                      ? `No modules found for Year ${selectedYear}.` 
                      : 'No modules found for this program.'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MajorsList;