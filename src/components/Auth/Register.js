import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMajorsModules } from '../../context/MajorsModulesContext';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, database } from '../../firebase';
import { FaBuilding } from 'react-icons/fa';
import RegisterMajorSelection from './RegisterMajorSelection';
import RegisterModuleSelection from './RegisterModuleSelection';

function Register() {const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedMajor, setSelectedMajor] = useState('');
  const [majorSearchTerm, setMajorSearchTerm] = useState('');
  const [selectedModules, setSelectedModules] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = account details, 2 = academic details
  const [majorOptions, setMajorOptions] = useState([]);
  const [acceptTerms, setAcceptTerms] = useState(false); // Added state for terms acceptance
  
  const { departments, majors, modules, loading: dataLoading } = useMajorsModules();
  const navigate = useNavigate();

  const departmentOptions = selectedFaculty 
    ? departments.find(faculty => faculty.code === selectedFaculty)?.departments || []
    : [];
  useEffect(() => {
    // Only reset selectedMajor when department changes, not on every render
    if (selectedMajor && selectedDepartment) {
      // Check if the currently selected major belongs to the selected department
      const majorBelongsToDepartment = majors.some(major => 
        major.code === selectedMajor && 
        (
          major.department === selectedDepartment || 
          (major.departmentCode === selectedDepartment) ||
          (Array.isArray(major.departments) && major.departments.includes(selectedDepartment))
        )
      );
      
      // Only reset if the major doesn't belong to the selected department
      if (!majorBelongsToDepartment) {
        setSelectedMajor('');
      }
    }
    
    if (!selectedDepartment) {
      setMajorOptions(majors);
      return;
    }
    
    const filteredMajors = majors.filter(major => {
      return (
        major.department === selectedDepartment || 
        (major.departmentCode === selectedDepartment) ||
        (Array.isArray(major.departments) && major.departments.includes(selectedDepartment))
      );
    });
    
    setMajorOptions(filteredMajors.length ? filteredMajors : majors);
  }, [selectedDepartment, majors, selectedMajor]);

  const filteredMajors = majorOptions.filter(major => 
    majorSearchTerm.trim() === '' || 
    major.name.toLowerCase().includes(majorSearchTerm.toLowerCase()) ||
    major.code.toLowerCase().includes(majorSearchTerm.toLowerCase())
  );  const associateModulesWithUser = async (userId, majorCode, userSelectedModules = []) => {
    try {
      if (!majorCode) {
        console.warn("No major code provided for associateModulesWithUser");
        return;
      }

      console.log(`Importing modules for major code: ${majorCode}`);
      
      // Get all modules for the selected major, filtering out COM1001 and COM1002
      const majorModules = modules.filter(module => { 
        // Always filter out COM1001 and COM1002
        if (module.code === 'COM1001' || module.code === 'COM1002') {
          console.log(`Explicitly filtering out ${module.code} as requested by user`);
          return false;
        }
        
        return module.programs && Array.isArray(module.programs) && module.programs.includes(majorCode);
      });
      
      if (majorModules.length === 0) {
        console.warn(`No modules found for major code: ${majorCode}`);
        return;
      }
      
      const modulesObject = {};
      
      // Group modules by year
      const modulesByYear = {};
      
      // First, organize modules by year
      majorModules.forEach(module => {
        const moduleYear = module.year ? parseInt(module.year) : 1;
        if (!modulesByYear[moduleYear]) {
          modulesByYear[moduleYear] = [];
        }
        modulesByYear[moduleYear].push(module);
      });
      
      // Find the earliest year that has modules (typically year 1)
      const earliestYear = Object.keys(modulesByYear).length > 0 
        ? Math.min(...Object.keys(modulesByYear).map(Number))
        : 1;
      
      console.log(`Found ${majorModules.length} total modules, with ${modulesByYear[earliestYear]?.length || 0} first-year modules.`);
      
      // Count skipped COM modules for debugging
      let skippedComModulesCount = 0;
        // Process and add modules to user profile
      majorModules.forEach(module => {
        const moduleYear = module.year ? parseInt(module.year) : 1;
        const isFirstYearModule = moduleYear === earliestYear;
        const isCoreModule = module.required === true || module.core === true;
        const isUserSelected = userSelectedModules.includes(module.code);
        
        // Skip COM modules entirely unless they belong to the user's major or were manually selected
        const isComModule = module.code.startsWith('COM');
        // Ensure module.programs is an array before checking if it includes majorCode
        const belongsToUserMajor = module.programs && 
                                  Array.isArray(module.programs) && 
                                  module.programs.includes(majorCode);
        
        // Only process this module if:
        // 1. It's NOT a COM module, OR
        // 2. It's a COM module that belongs to the user's major, OR
        // 3. It's a COM module that was manually selected by the user
        if (!isComModule || belongsToUserMajor || isUserSelected) {
          modulesObject[module.code] = {
            addedAt: new Date().toISOString(),
            notes: '',
            enrolled: true,
            // Add tracking fields to help with filtering
            isComModule: isComModule,
            belongsToMajor: belongsToUserMajor,
            manuallyAdded: isUserSelected,
            // Favoriting logic:
            // 1. All user-selected modules are favorites
            // 2. All core/required modules are favorites
            // 3. All first-year modules are favorites if there are 8 or fewer
            // 4. Only core first-year modules are favorites if there are more than 8
            favorite: isUserSelected || 
                      (module.core === true || module.required === true) ||
                      (isFirstYearModule && modulesByYear[earliestYear].length <= 8) ||
                      (isFirstYearModule && isCoreModule)
          };
        } else {
          skippedComModulesCount++;
          console.log(`Skipping COM module ${module.code} that doesn't belong to major ${majorCode}`);
        }
      });
      
      // Add any manually selected modules that aren't part of the major
      // This allows for electives or modules from other programs
      const nonMajorSelectedModules = userSelectedModules.filter(
        code => !majorModules.some(module => module.code === code)
      );
      
      nonMajorSelectedModules.forEach(moduleCode => {
        const moduleData = modules.find(m => m.code === moduleCode);
        
        if (moduleData) {
          modulesObject[moduleCode] = {
            addedAt: new Date().toISOString(),
            notes: '',
            enrolled: true,
            favorite: true, // User-selected modules are always favorites
            fromOtherProgram: true // Mark these as from another program
          };
        }
      });
      
      const totalModules = Object.keys(modulesObject).length;
      const favoriteModules = Object.values(modulesObject).filter(m => m.favorite).length;
      const manuallySelectedCount = nonMajorSelectedModules.length;
      
      console.log(`Module Processing Results:
        - COM modules skipped: ${skippedComModulesCount}
        - Total modules associated: ${totalModules}
        - Favorite modules: ${favoriteModules}
        - Manually selected non-major modules: ${manuallySelectedCount}`);
      
      if (totalModules > 0) {
        const userModulesRef = ref(database, `users/${userId}/modules`);
        await set(userModulesRef, modulesObject);
        console.log(`Associated ${totalModules} modules with user. Marked ${favoriteModules} as favorites. Added ${manuallySelectedCount} manually selected non-major modules.`);
      }
        // Create a structured result with all necessary properties
      // to avoid errors in Dashboard component
      return {
        totalModules,
        favoriteModules,
        manuallySelectedCount,
        addedModules: Object.keys(modulesObject),
        existingModules: [],
        failedModules: []
      };
    } catch (error) {
      console.error("Error associating modules with user:", error);
      return null;
    }
  };

  const handleNextStep = () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    
    if (!password) {
      setError('Password is required');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (!acceptTerms) {
      setError('You must agree to the Terms and Privacy Policy');
      return;
    }

    setError('');
    setStep(2);
  };

  const handlePreviousStep = () => {
    setStep(1);
  };  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setError('');
    
    if (step === 1) {
      handleNextStep();
      return;
    }
    
    // Make major selection mandatory
    if (!selectedMajor) {
      setError('Please select a major to continue. This is required for your module recommendations.');
      return;
    }
    
    try {
      setLoading(true);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      await updateProfile(userCredential.user, {
        displayName: name
      });
      
      // Find the selected major's full details
      const majorDetails = majors.find(m => m.code === selectedMajor);
      if (!majorDetails) {
        setError('Major selection error. Please try again.');
        setLoading(false);
        return;
      }
      
      const userRef = ref(database, `users/${userCredential.user.uid}`);
      await set(userRef, {
        name: name.trim(),
        email: email,
        faculty: selectedFaculty,
        department: selectedDepartment,
        majorCode: selectedMajor,
        majorName: majorDetails.name,
        createdAt: new Date().toISOString(),
        acceptedTerms: true,
        acceptedPrivacyPolicy: true,
        acceptedTermsAt: new Date().toISOString(),
        hasSeenWelcome: false,
        profileComplete: true // Mark profile as complete since major is selected
      });      // Import modules based on selected major and user-selected modules
      const importResult = await associateModulesWithUser(userCredential.user.uid, selectedMajor, selectedModules);
      
      // Create a fallback module stats object if the import returns null
      const moduleStats = importResult || {
        totalModules: 0,
        favoriteModules: 0,
        manuallySelectedCount: 0,
        addedModules: [],
        existingModules: [],
        failedModules: []
      };      // Redirect directly to MyModules with module import success message
      // Use replace: true to prevent back navigation to registration
      navigate('/my-modules', {
        replace: true, // Add replace: true to completely replace the history entry
        state: { 
          newRegistration: true,
          showModuleImportSuccess: true,
          moduleStats: moduleStats,
          modulesImported: true,  // Add this flag to trigger module loading in MyModules
          fromRegistration: true  // Add this flag to skip profile redirection
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        setError('Email is already in use');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email format');
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak');
      } else {
        setError('Failed to create account. Please try again.');
      }
      
      setLoading(false);
    }
  };

  const renderAccountDetailsStep = () => (
    <>
      <div className="mb-4">
        <label htmlFor="name" className="block text-ios-gray font-sf-pro-text text-ios-subhead mb-1">
          Full Name*
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`ios-input w-full ${error && error.includes('Name') ? 'border-ios-red' : ''}`}
          placeholder="John Smith"
          disabled={loading}
          required
          aria-invalid={!!error && error.includes('Name')}
          aria-describedby="name-error"
        />
        {error && error.includes('Name') && (
          <p id="name-error" className="text-ios-red text-ios-footnote mt-1">
            {error}
          </p>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="email" className="block text-ios-gray font-sf-pro-text text-ios-subhead mb-1">
          Email*
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`ios-input w-full ${error && error.includes('Email') ? 'border-ios-red' : ''}`}
          placeholder="your.email@surrey.ac.uk"
          disabled={loading}
          required
          aria-invalid={!!error && error.includes('Email')}
          aria-describedby="email-error"
        />
        {error && error.includes('Email') && (
          <p id="email-error" className="text-ios-red text-ios-footnote mt-1">
            {error}
          </p>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="password" className="block text-ios-gray font-sf-pro-text text-ios-subhead mb-1">
          Password*
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`ios-input w-full ${error && error.includes('Password') && !error.includes('Passwords') ? 'border-ios-red' : ''}`}
          placeholder="••••••••"
          disabled={loading}
          required
          aria-invalid={!!error && error.includes('Password') && !error.includes('Passwords')}
          aria-describedby="password-error"
        />
        {error && error.includes('Password') && !error.includes('Passwords') && (
          <p id="password-error" className="text-ios-red text-ios-footnote mt-1">
            {error}
          </p>
        )}
        <p className="text-ios-footnote text-ios-gray mt-1">
          Must be at least 6 characters
        </p>
      </div>

      <div className="mb-6">
        <label htmlFor="confirmPassword" className="block text-ios-gray font-sf-pro-text text-ios-subhead mb-1">
          Confirm Password*
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={`ios-input w-full ${error && error.includes('Passwords') ? 'border-ios-red' : ''}`}
          placeholder="••••••••"
          disabled={loading}
          required
          aria-invalid={!!error && error.includes('Passwords')}
          aria-describedby="confirmPassword-error"
        />
        {error && error.includes('Passwords') && (
          <p id="confirmPassword-error" className="text-ios-red text-ios-footnote mt-1">
            {error}
          </p>
        )}
      </div>

      <div className="mb-6">
        <div className="flex items-start mb-3">
          <div className="flex items-center h-5">
            <input
              id="terms"
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="w-4 h-4 border border-ios-gray5 rounded focus:ring-ios-blue text-ios-blue"
              required
              aria-invalid={!!error && error.includes('Terms')}
              aria-describedby="terms-error"
            />
          </div>
          <label htmlFor="terms" className="ml-2 text-sm text-ios-gray">
            I agree to the <Link to="/terms" className="text-ios-blue hover:underline" target="_blank" rel="noopener noreferrer">Terms of Service</Link> and <Link to="/privacy-policy" className="text-ios-blue hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</Link>*
          </label>
        </div>
        {error && error.includes('Terms') && (
          <p id="terms-error" className="text-ios-red text-ios-footnote mb-4">
            {error}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={handleNextStep}
        className="ios-button w-full transition-transform duration-150 active:scale-95"
        disabled={loading}
      >
        Next: Academic Information
      </button>
    </>
  );

  const renderAcademicDetailsStep = () => (
    <>
      <div className="mb-4">
        <label htmlFor="faculty" className="block text-ios-gray font-sf-pro-text text-ios-subhead mb-1">
          Faculty
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <FaBuilding className="text-ios-gray" />
          </div>
          <select
            id="faculty"
            value={selectedFaculty}
            onChange={(e) => {
              setSelectedFaculty(e.target.value);
              setSelectedDepartment('');
            }}
            className="ios-input w-full pl-10"
            disabled={loading || dataLoading}
          >
            <option value="">Select a Faculty</option>
            {departments.map((faculty) => (
              <option key={faculty.code} value={faculty.code}>
                {faculty.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedFaculty && (
        <div className="mb-4">
          <label htmlFor="department" className="block text-ios-gray font-sf-pro-text text-ios-subhead mb-1">
            School/Department
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <FaBuilding className="text-ios-gray" />
            </div>
            <select
              id="department"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="ios-input w-full pl-10"
              disabled={loading || dataLoading}
            >
              <option value="">Select a Department</option>
              {departmentOptions.map((department) => (
                <option key={department.code} value={department.code}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}      <RegisterMajorSelection 
        majorSearchTerm={majorSearchTerm}
        setMajorSearchTerm={setMajorSearchTerm}
        selectedMajor={selectedMajor}
        setSelectedMajor={setSelectedMajor}
        majors={majors}
        filteredMajors={filteredMajors}
        error={error}
        loading={loading}
      />
      
      {selectedMajor && (
        <RegisterModuleSelection
          selectedMajor={selectedMajor}
          modules={modules}
          selectedModules={selectedModules}
          setSelectedModules={setSelectedModules}
          loading={loading}
          error={error}
        />
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-2">
        <button
          type="button"
          onClick={handlePreviousStep}
          className="ios-button-secondary sm:flex-1 transition-transform duration-150 active:scale-95"
          disabled={loading}
        >
          Back
        </button>
        <button
          type="submit"
          className="ios-button sm:flex-1 flex items-center justify-center transition-transform duration-150 active:scale-95"
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            'Create Account'
          )}
        </button>
      </div>
      <p className="text-center text-xs text-ios-gray">
        You can update these details later in your profile
      </p>
    </>
  );

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-ios-gray6 dark:bg-ios-dark flex flex-col justify-center items-center px-4 py-12">
        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-ios-blue rounded-full mb-4"></div>
        <p className="text-ios-gray">Loading academic data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-white dark:bg-ios-dark-bg transition-colors duration-200">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-ios-large-title font-sf-pro mb-2 text-black dark:text-ios-dark-text">Create Account</h1>
          <p className="text-ios-subhead text-ios-gray dark:text-ios-dark-text-secondary">Join StudyGroupApp to find study partners</p>
        </div>
        <div className="bg-white dark:bg-ios-dark-elevated ios-card shadow-sm p-6 mb-4 dark:border-ios-dark-border">
          <div className="flex mb-6">
            <div className={`flex-1 text-center pb-2 border-b-2 ${step === 1 ? 'border-ios-blue font-medium text-ios-blue dark:text-ios-teal dark:border-ios-teal' : 'border-ios-gray5 text-ios-gray dark:text-ios-dark-text-secondary dark:border-ios-dark-border'}`}>Account</div>
            <div className={`flex-1 text-center pb-2 border-b-2 ${step === 2 ? 'border-ios-blue font-medium text-ios-blue dark:text-ios-teal dark:border-ios-teal' : 'border-ios-gray5 text-ios-gray dark:text-ios-dark-text-secondary dark:border-ios-dark-border'}`}>Academic</div>
          </div>
          {error && !error.includes('Name') && !error.includes('Email') && !error.includes('Password') && !error.includes('Passwords') && (
            <div className="bg-red-100 border border-red-200 text-ios-red rounded-ios p-3 mb-4 dark:bg-ios-dark-elevated dark:border-ios-red-dark dark:text-ios-red">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} aria-label="Registration form">
            {step === 1 ? renderAccountDetailsStep() : renderAcademicDetailsStep()}
          </form>
        </div>
        <div className="text-center">
          <p className="text-ios-subhead text-ios-gray dark:text-ios-dark-text-secondary">
            Already have an account?{' '}
            <Link to="/login" className="text-ios-blue dark:text-ios-teal">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;