import React from 'react';
import { FaGraduationCap, FaSearch, FaTimes } from 'react-icons/fa';

// This component handles the major selection UI during registration
function RegisterMajorSelection({ 
  majorSearchTerm, 
  setMajorSearchTerm, 
  selectedMajor, 
  setSelectedMajor,
  majors,
  filteredMajors,
  error,
  loading 
}) {
  return (
    <div className="mb-4">
      <label htmlFor="majorSearch" className="block text-ios-gray font-sf-pro-text text-ios-subhead mb-1">
        Major/Program <span className="text-ios-red">*</span>
      </label>      <div className="relative mb-2">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          {selectedMajor ? <FaGraduationCap className="text-ios-blue" /> : <FaSearch className="text-ios-gray" />}
        </div>
        <input
          id="majorSearch"
          type="text"
          value={selectedMajor ? (majors.find(m => m.code === selectedMajor)?.name || "Major selected") : majorSearchTerm}
          onChange={(e) => !selectedMajor && setMajorSearchTerm(e.target.value)}
          className={`ios-input w-full pl-10 ${selectedMajor ? 'border-green-400 bg-green-50 dark:bg-green-900 dark:bg-opacity-20 dark:border-green-700' : error && error.includes('major') ? 'border-ios-red' : ''}`}
          placeholder={selectedMajor ? "Major selected" : "Search for your major (e.g. Computer Science)"}
          disabled={loading}
          readOnly={selectedMajor}
          required
        />
        {selectedMajor && (
          <div className="absolute inset-y-0 right-2 flex items-center">
            <button 
              type="button"
              onClick={() => setSelectedMajor('')}
              className="text-ios-gray hover:text-ios-red p-1"
              aria-label="Clear major selection"
            >
              <FaTimes className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      
      {error && error.includes('major') && (
        <p className="text-ios-red text-xs mb-2">
          {error}
        </p>
      )}
      
      <p className="text-xs text-ios-gray mt-1 mb-2">
        <strong>Required:</strong> Your major is needed to automatically import relevant modules to your account.
        {selectedMajor && <span className="text-green-600 font-medium"> (Major selected)</span>}
      </p>

      {selectedMajor && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 border border-blue-200 dark:border-blue-800 rounded-md mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FaGraduationCap className="text-ios-blue mr-2" />
              <div>
                <div className="font-medium text-black dark:text-white">
                  {majors.find(m => m.code === selectedMajor)?.name || selectedMajor}
                </div>
                <div className="text-xs text-ios-gray">{selectedMajor}</div>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => setSelectedMajor('')}
              className="text-ios-gray hover:text-ios-red"
              aria-label="Remove selected major"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* Only show major list if no major is selected or user is searching */}
      {(!selectedMajor || majorSearchTerm) && (
        filteredMajors.length > 0 ? (
          <div className="max-h-60 overflow-y-auto bg-white border border-ios-gray5 rounded-md">
            {filteredMajors.map(major => (
              <div
                key={major.code}
                className={`p-3 cursor-pointer hover:bg-ios-gray6 flex items-center ${selectedMajor === major.code ? 'bg-ios-blue bg-opacity-10 border-l-4 border-ios-blue' : ''}`}
                onClick={() => setSelectedMajor(major.code)}
              >
                <FaGraduationCap className={`mr-2 ${selectedMajor === major.code ? 'text-ios-blue' : 'text-ios-gray'}`} />
                <div>
                  <div className="font-medium">{major.name}</div>
                  <div className="text-xs text-ios-gray">{major.code}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-ios-gray text-sm py-2">
            {majorSearchTerm ? "No majors found matching your search." : "Start typing to search for your major."}
          </p>
        )
      )}
        {selectedMajor && (
        <div className="bg-green-50 dark:bg-green-900 dark:bg-opacity-20 border border-green-200 dark:border-green-800 rounded-md p-3 mt-2">
          <p className="text-sm text-green-700 dark:text-green-400 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Your core modules will be automatically imported and marked as favorites
          </p>
          <p className="text-xs text-green-600 dark:text-green-500 mt-1 pl-5">
            You can select additional modules below
          </p>
        </div>
      )}
    </div>
  );
}

export default RegisterMajorSelection;
