import React from 'react';
import { useMajorsModules } from '../../context/MajorsModulesContext';
import { useAuth } from '../../context/AuthContext';

const ModuleSelect = ({ value, onChange, disabled = false }) => {
  const { modules } = useMajorsModules();
  

  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="ios-input w-full dark:bg-ios-dark-secondary dark:border-ios-dark-border dark:text-ios-dark-text"
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
  );
};

export default ModuleSelect; 