import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMajorsModules } from '../../context/MajorsModulesContext';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, database } from '../../firebase';
import { FaSearch, FaGraduationCap, FaBuilding } from 'react-icons/fa';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedMajor, setSelectedMajor] = useState('');
  const [majorSearchTerm, setMajorSearchTerm] = useState('');
  const [year, setYear] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = account details, 2 = academic details
  const [majorOptions, setMajorOptions] = useState([]);
  const [acceptTerms, setAcceptTerms] = useState(false); // Added state for terms acceptance
  
  const authContext = useAuth();
  const { departments, majors, modules, loading: dataLoading } = useMajorsModules();
  const navigate = useNavigate();

  const departmentOptions = selectedFaculty 
    ? departments.find(faculty => faculty.code === selectedFaculty)?.departments || []
    : [];

  useEffect(() => {
    if (selectedMajor) {
      setSelectedMajor('');
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
  }, [selectedDepartment, majors]);

  const filteredMajors = majorOptions.filter(major => 
    majorSearchTerm.trim() === '' || 
    major.name.toLowerCase().includes(majorSearchTerm.toLowerCase()) ||
    major.code.toLowerCase().includes(majorSearchTerm.toLowerCase())
  );

  const associateModulesWithUser = async (userId, majorCode) => {
    try {
      const majorModules = modules.filter(module => 
        module.programs && module.programs.includes(majorCode)
      );
      
      const modulesObject = {};
      majorModules.forEach(module => {
        modulesObject[module.code] = {
          addedAt: new Date().toISOString(),
          notes: ''
        };
      });
      
      if (Object.keys(modulesObject).length > 0) {
        const userModulesRef = ref(database, `users/${userId}/modules`);
        await set(userModulesRef, modulesObject);
        console.log(`Associated ${Object.keys(modulesObject).length} modules with user`);
      }
    } catch (error) {
      console.error("Error associating modules with user:", error);
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setError('');
    
    if (step === 1) {
      handleNextStep();
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
      
      const userRef = ref(database, `users/${userCredential.user.uid}`);
      await set(userRef, {
        name: name.trim(), // Ensure name is not empty
        email: email,
        faculty: selectedFaculty,
        department: selectedDepartment,
        majorCode: selectedMajor,
        majorName: majorDetails ? majorDetails.name : '',
        year: year,
        createdAt: new Date().toISOString(),
        acceptedTerms: true, // Record that the user accepted terms
        acceptedPrivacyPolicy: true, // Record that the user accepted privacy policy
        acceptedTermsAt: new Date().toISOString(), // Record when the user accepted terms
        hasSeenWelcome: false // For showing welcome modal on first login
      });
      
      if (selectedMajor) {
        await associateModulesWithUser(userCredential.user.uid, selectedMajor);
      }
      
      // Always redirect to home page after registration
      navigate('/');
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
      )}

      <div className="mb-4">
        <label htmlFor="majorSearch" className="block text-ios-gray font-sf-pro-text text-ios-subhead mb-1">
          Major/Program
        </label>
        <div className="relative mb-2">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <FaSearch className="text-ios-gray" />
          </div>
          <input
            id="majorSearch"
            type="text"
            value={majorSearchTerm}
            onChange={(e) => setMajorSearchTerm(e.target.value)}
            className="ios-input w-full pl-10"
            placeholder="Search for your major"
            disabled={loading}
          />
        </div>

        {filteredMajors.length > 0 ? (
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
            {selectedDepartment ? (
              <>No majors found. <button 
                type="button" 
                className="text-ios-blue underline" 
                onClick={() => setSelectedDepartment('')}
              >
                Clear department filter
              </button></>
            ) : (
              "No majors found matching your search."
            )}
          </p>
        )}
        
        {selectedMajor && (
          <p className="text-xs text-ios-blue mt-2">
            <FaGraduationCap className="inline-block mr-1" />
            Your relevant modules will be automatically added to your profile
          </p>
        )}
      </div>

      <div className="mb-6">
        <label htmlFor="year" className="block text-ios-gray font-sf-pro-text text-ios-subhead mb-1">
          Year of Study
        </label>
        <select
          id="year"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="ios-input w-full"
          disabled={loading}
        >
          <option value="">Select Year of Study</option>
          <option value="1">First Year</option>
          <option value="2">Second Year</option>
          <option value="3">Third Year</option>
          <option value="4">Fourth Year</option>
          <option value="5+">Fifth Year or Higher</option>
        </select>
        <p className="text-xs text-ios-gray mt-1">
          This helps us filter module suggestions based on your year of study.
        </p>
      </div>

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
      <div className="min-h-screen bg-ios-gray6 flex flex-col justify-center items-center px-4 py-12">
        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-ios-blue rounded-full mb-4"></div>
        <p className="text-ios-gray">Loading academic data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ios-gray6 flex flex-col justify-center px-4 py-12">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-ios-large-title font-sf-pro mb-2 text-black">Create Account</h1>
          <p className="text-ios-subhead text-ios-gray">Join StudyGroupApp to find study partners</p>
        </div>
        
        <div className="bg-white ios-card shadow-sm p-6 mb-4">
          <div className="flex mb-6">
            <div className={`flex-1 text-center pb-2 border-b-2 ${step === 1 ? 'border-ios-blue font-medium text-ios-blue' : 'border-ios-gray5 text-ios-gray'}`}>
              Account
            </div>
            <div className={`flex-1 text-center pb-2 border-b-2 ${step === 2 ? 'border-ios-blue font-medium text-ios-blue' : 'border-ios-gray5 text-ios-gray'}`}>
              Academic
            </div>
          </div>

          {error && !error.includes('Name') && !error.includes('Email') && !error.includes('Password') && !error.includes('Passwords') && (
            <div className="bg-red-100 border border-red-200 text-ios-red rounded-ios p-3 mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} aria-label="Registration form">
            {step === 1 ? renderAccountDetailsStep() : renderAcademicDetailsStep()}
          </form>
        </div>
        
        <div className="text-center">
          <p className="text-ios-subhead text-ios-gray">
            Already have an account?{' '}
            <Link to="/login" className="text-ios-blue">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;