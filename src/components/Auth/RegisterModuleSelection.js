import React, { useState, useEffect } from 'react';
import { FaBook, FaSearch, FaStar, FaRegStar } from 'react-icons/fa';

function RegisterModuleSelection({ 
  selectedMajor, 
  modules,
  selectedModules,
  setSelectedModules,
  loading,
  error 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredModules, setFilteredModules] = useState([]);
  const [majorModules, setMajorModules] = useState([]);
  const [expandedSection, setExpandedSection] = useState(null);
  // Group modules by year when major is selected
  useEffect(() => {
    if (!selectedMajor || !modules || modules.length === 0) {
      setMajorModules([]);
      return;
    }    // Get modules associated with the selected major, filtering COM modules appropriately
    const modulesForMajor = modules.filter(module => {
      // Skip COM modules unless they are explicitly for the major
      if (module.code.startsWith('COM')) {
        // Extra validation that this COM module belongs to major
        const explicitlyInMajor = module.programs && 
               Array.isArray(module.programs) && 
               module.programs.includes(selectedMajor) &&
               // Check for additional metadata that confirms it belongs to major
               (module.majorSpecific === true ||
                (module.departments && module.departments.includes(selectedMajor.split('-')[0])));
                
        if (!explicitlyInMajor) {
          console.log(`Registration: Filtering out COM module ${module.code} - not explicitly for major ${selectedMajor}`);
          return false;
        }
      }
      
      // Include all non-COM modules that belong to the major
      return module.programs && module.programs.includes(selectedMajor);
    });
    
    console.log(`Filtered ${modulesForMajor.length} modules for major ${selectedMajor}`);
    
    // Group modules by year
    const groupedModules = {};
    
    modulesForMajor.forEach(module => {
      const moduleYear = module.year ? parseInt(module.year) : 1;
      if (!groupedModules[moduleYear]) {
        groupedModules[moduleYear] = [];
      }
      groupedModules[moduleYear].push(module);
    });
    
    setMajorModules(groupedModules);
    
    // Auto-select first-year modules if any
    if (groupedModules[1] && groupedModules[1].length > 0) {
      const coreFirstYearModules = groupedModules[1].filter(
        module => module.required === true || module.core === true
      );
      
      // If there are core modules, select those by default
      if (coreFirstYearModules.length > 0) {
        const moduleCodeArray = coreFirstYearModules.map(module => module.code);
        setSelectedModules(prev => [...new Set([...prev, ...moduleCodeArray])]);
      }
    }
    
  }, [selectedMajor, modules, setSelectedModules]);
  // Filter modules based on search term
  useEffect(() => {
    if (!searchTerm.trim() || !modules || modules.length === 0 || !selectedMajor) {
      setFilteredModules([]);
      return;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    
    const filtered = modules.filter(module => {
      // Basic search match
      const matchesSearch = 
        module.name?.toLowerCase().includes(lowerSearchTerm) ||
        module.code?.toLowerCase().includes(lowerSearchTerm);
      
      if (!matchesSearch) {
        return false;
      }
      
      // Special handling for COM modules - only include if they belong to this major
      const isComModule = module.code.startsWith('COM');
      
      if (isComModule) {
        // Ensure the module's programs is an array that includes the major
        return module.programs && 
               Array.isArray(module.programs) && 
               module.programs.includes(selectedMajor);
      }
      
      // Include all non-COM modules that match the search
      return true;
    });
    
    setFilteredModules(filtered);
  }, [searchTerm, modules, selectedMajor]);

  // Toggle a module's selection
  const toggleModuleSelection = (moduleCode) => {
    setSelectedModules(prevSelected => {
      if (prevSelected.includes(moduleCode)) {
        return prevSelected.filter(code => code !== moduleCode);
      } else {
        return [...prevSelected, moduleCode];
      }
    });
  };

  // Expand or collapse a year section
  const toggleSection = (year) => {
    if (expandedSection === year) {
      setExpandedSection(null);
    } else {
      setExpandedSection(year);
    }
  };

  if (!selectedMajor) {
    return (
      <div className="mb-4">
        <p className="text-ios-gray text-sm">
          Please select a major to see available modules
        </p>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <label htmlFor="moduleSearch" className="block text-ios-gray font-sf-pro-text text-ios-subhead mb-1">
        Select Your Modules
      </label>
      
      <div className="relative mb-2">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <FaSearch className="text-ios-gray" />
        </div>
        <input
          id="moduleSearch"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="ios-input w-full pl-10"
          placeholder="Search for modules (optional)"
          disabled={loading}
        />
      </div>
      
      <div className="text-xs text-ios-gray mt-1 mb-3">
        <p className="mb-1">
          <strong>Core modules</strong> will be automatically added to your favorites.
        </p>
        <p>
          Select additional modules that you're taking or interested in.
        </p>
      </div>
      
      {/* Search results */}
      {searchTerm.trim() && filteredModules.length > 0 && (
        <div className="border border-ios-gray5 rounded-md bg-white dark:bg-ios-dark-elevated mb-4 max-h-60 overflow-y-auto">
          <div className="p-2 bg-ios-gray6 dark:bg-ios-dark-secondary text-xs font-medium">
            Search Results
          </div>
          {filteredModules.map(module => (
            <div
              key={module.code}
              className="p-3 border-b border-ios-gray5 dark:border-ios-dark-border flex items-center justify-between cursor-pointer hover:bg-ios-gray6 dark:hover:bg-ios-dark-secondary transition-colors"
              onClick={() => toggleModuleSelection(module.code)}
            >
              <div className="flex items-center">
                <FaBook className="mr-2 text-ios-gray" />
                <div>
                  <div className="font-medium text-sm">{module.name}</div>
                  <div className="text-xs text-ios-gray">{module.code}</div>
                </div>
              </div>
              <div>
                {selectedModules.includes(module.code) ? (
                  <FaStar className="text-yellow-500" />
                ) : (
                  <FaRegStar className="text-ios-gray" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No search results message */}
      {searchTerm.trim() && filteredModules.length === 0 && (
        <div className="p-3 border border-ios-gray5 rounded-md bg-white dark:bg-ios-dark-elevated mb-4 text-ios-gray text-sm">
          No modules found matching your search.
        </div>
      )}
      
      {/* Major module sections */}
      {Object.keys(majorModules).length > 0 ? (
        <div className="border border-ios-gray5 rounded-md bg-white dark:bg-ios-dark-elevated max-h-72 overflow-y-auto">
          {Object.keys(majorModules).sort((a, b) => parseInt(a) - parseInt(b)).map(year => (
            <div key={year} className="border-b border-ios-gray5 dark:border-ios-dark-border last:border-b-0">
              <div 
                className="p-3 flex justify-between items-center cursor-pointer hover:bg-ios-gray6 dark:hover:bg-ios-dark-secondary transition-colors"
                onClick={() => toggleSection(year)}
              >
                <div className="font-medium">
                  Year {year} Modules <span className="text-xs text-ios-gray ml-1">({majorModules[year].length})</span>
                </div>
                <div className="text-ios-gray">
                  {expandedSection === year ? '▲' : '▼'}
                </div>
              </div>
              
              {expandedSection === year && (
                <div className="p-2 bg-ios-gray6 dark:bg-ios-dark-secondary">
                  {majorModules[year].map(module => (
                    <div
                      key={module.code}
                      className={`p-2 rounded-md mb-1 last:mb-0 flex items-center justify-between cursor-pointer hover:bg-white dark:hover:bg-ios-dark-elevated transition-colors ${
                        module.core || module.required ? 'bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20' : ''
                      }`}
                      onClick={() => toggleModuleSelection(module.code)}
                    >
                      <div className="flex items-center">
                        <FaBook className={`mr-2 ${module.core || module.required ? 'text-ios-blue' : 'text-ios-gray'}`} />
                        <div>
                          <div className="font-medium text-sm flex items-center">
                            {module.name}
                            {(module.core || module.required) && (
                              <span className="ml-1 text-xs px-1.5 py-0.5 bg-ios-blue text-white rounded-full">Core</span>
                            )}
                          </div>
                          <div className="text-xs text-ios-gray">{module.code}</div>
                        </div>
                      </div>
                      <div>
                        {selectedModules.includes(module.code) ? (
                          <FaStar className="text-yellow-500" />
                        ) : (
                          <FaRegStar className="text-ios-gray" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-3 border border-ios-gray5 rounded-md bg-white dark:bg-ios-dark-elevated text-ios-gray text-sm">
          {selectedMajor ? 'No modules found for this major.' : 'Select a major to see available modules.'}
        </div>
      )}
      
      {selectedModules.length > 0 && (
        <div className="mt-3 p-3 bg-green-50 dark:bg-green-900 dark:bg-opacity-20 border border-green-200 dark:border-green-800 rounded-md">
          <div className="font-medium text-sm text-green-700 dark:text-green-400">
            {selectedModules.length} module{selectedModules.length !== 1 ? 's' : ''} selected
          </div>
          <p className="text-xs text-green-600 dark:text-green-500 mt-1">
            These modules will be added to your profile and marked as favorites
          </p>
        </div>
      )}
      
      {error && error.includes('module') && (
        <p className="text-ios-red text-xs mt-2">
          {error}
        </p>
      )}
    </div>
  );
}

export default RegisterModuleSelection;
