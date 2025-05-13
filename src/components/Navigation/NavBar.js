import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  FaUser,
  FaSignOutAlt,
  FaSignInAlt,
  FaUserPlus,
  FaBook,
  FaUsers,
  FaSun,
  FaMoon,
  FaChevronDown,
  FaMapMarkedAlt,
  FaHome,
  FaGraduationCap,
  FaClock
} from 'react-icons/fa';

function NavBar() {
  const { currentUser, logout, userProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    // Close profile menu when main menu is toggled
    if (profileMenuOpen) setProfileMenuOpen(false);
  };
  
  const toggleProfileMenu = () => {
    setProfileMenuOpen(!profileMenuOpen);
  };
  
  const handleLogout = async () => {
    setShowLogoutModal(true);
    setProfileMenuOpen(false);
  };
  
  const confirmLogout = async () => {
    try {
      await logout();
      setShowLogoutModal(false);
      navigate('/login');
    } catch (error) {
      console.error("Failed to logout", error);
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white dark:bg-ios-dark-elevated border-b border-ios-gray6 dark:border-ios-dark-border shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center">
                <div className="bg-ios-blue dark:bg-ios-teal rounded-md p-1.5 mr-2">
                  <FaBook className="h-4 w-4 text-white" />
                </div>
                <span className="font-sf-pro text-ios-headline dark:text-ios-dark-text font-medium">StudyGroup</span>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden sm:ml-6 sm:flex space-x-4">
              <Link 
                to="/" 
                className={`flex items-center px-3 py-2 text-ios-body rounded-md ${isActive('/') 
                  ? 'text-ios-blue dark:text-ios-teal font-medium' 
                  : 'text-ios-gray dark:text-ios-dark-text-secondary hover:text-ios-blue dark:hover:text-ios-teal'}`}
              >
                <FaHome className="mr-2 h-4 w-4" />
                Home
              </Link>
              <Link 
                to="/groups" 
                className={`flex items-center px-3 py-2 text-ios-body rounded-md ${isActive('/groups') 
                  ? 'text-ios-blue dark:text-ios-teal font-medium' 
                  : 'text-ios-gray dark:text-ios-dark-text-secondary hover:text-ios-blue dark:hover:text-ios-teal'}`}
              >
                <FaUsers className="mr-2 h-4 w-4" />
                Study Groups
              </Link>
              {currentUser && (
                <>
                  <Link 
                    to="/my-modules" 
                    className={`flex items-center px-3 py-2 text-ios-body rounded-md ${isActive('/my-modules') 
                      ? 'text-ios-blue dark:text-ios-teal font-medium' 
                      : 'text-ios-gray dark:text-ios-dark-text-secondary hover:text-ios-blue dark:hover:text-ios-teal'}`}
                  >
                    <FaGraduationCap className="mr-2 h-4 w-4" />
                    My Modules
                  </Link>
                  <Link 
                    to="/study-timer" 
                    className={`flex items-center px-3 py-2 text-ios-body rounded-md ${isActive('/study-timer') 
                      ? 'text-ios-blue dark:text-ios-teal font-medium' 
                      : 'text-ios-gray dark:text-ios-dark-text-secondary hover:text-ios-blue dark:hover:text-ios-teal'}`}
                  >
                    <FaClock className="mr-2 h-4 w-4" />
                    Study Timer
                  </Link>
                </>
              )}
              <Link 
                to="/modules" 
                className={`flex items-center px-3 py-2 text-ios-body rounded-md ${isActive('/modules') 
                  ? 'text-ios-blue dark:text-ios-teal font-medium' 
                  : 'text-ios-gray dark:text-ios-dark-text-secondary hover:text-ios-blue dark:hover:text-ios-teal'}`}
              >
                <FaBook className="mr-2 h-4 w-4" />
                Modules
              </Link>
              <Link 
                to="/map" 
                className={`flex items-center px-3 py-2 text-ios-body rounded-md ${isActive('/map') 
                  ? 'text-ios-blue dark:text-ios-teal font-medium' 
                  : 'text-ios-gray dark:text-ios-dark-text-secondary hover:text-ios-blue dark:hover:text-ios-teal'}`}
              >
                <FaMapMarkedAlt className="mr-2 h-4 w-4" />
                Map
              </Link>
            </div>
          </div>

          {/* Right section - mobile menu toggle, theme toggle & user profile */}
          <div className="flex items-center">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-ios-gray dark:text-ios-dark-text-secondary hover:bg-ios-gray6 dark:hover:bg-ios-dark-secondary transition-colors mr-1"
              aria-label={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === 'dark' ? (
                <FaSun className="h-5 w-5 text-ios-teal" />
              ) : (
                <FaMoon className="h-5 w-5 text-ios-blue" />
              )}
            </button>

            {/* User Navigation */}
            {currentUser ? (
              <div className="ml-3 relative">
                <div>
                  <button
                    onClick={toggleProfileMenu}
                    className="flex items-center max-w-xs text-sm rounded-full focus:outline-none"
                    id="user-menu"
                    aria-label="User menu"
                    aria-haspopup="true"
                  >
                    <div className="bg-ios-blue dark:bg-ios-teal rounded-full p-2 text-white">
                      <FaUser className="h-4 w-4" />
                    </div>
                    <div className="ml-2 hidden sm:block text-left">
                      <div className="text-ios-headline font-medium text-ios-black dark:text-ios-dark-text">
                        {userProfile?.name || currentUser.displayName || 'User'}
                      </div>
                      <div className="text-ios-footnote text-ios-gray dark:text-ios-dark-text-secondary">
                        {userProfile?.major || 'Student'}
                      </div>
                    </div>
                    <FaChevronDown className="ml-2 h-4 w-4 text-ios-gray dark:text-ios-dark-text-secondary" />
                  </button>
                </div>
                {profileMenuOpen && (
                  <div
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-ios shadow-lg bg-white dark:bg-ios-dark-elevated border border-ios-gray6 dark:border-ios-dark-border ring-1 ring-black ring-opacity-5 z-50"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu"
                  >
                    <div className="py-1" role="none">
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-ios-body text-ios-black dark:text-ios-dark-text hover:bg-ios-gray6 dark:hover:bg-ios-dark-secondary transition-colors"
                        role="menuitem"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <FaUser className="mr-3 h-4 w-4 text-ios-blue dark:text-ios-teal" />
                        Your Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center px-4 py-2 text-ios-body text-ios-black dark:text-ios-dark-text hover:bg-ios-gray6 dark:hover:bg-ios-dark-secondary transition-colors"
                        role="menuitem"
                      >
                        <FaSignOutAlt className="mr-3 h-4 w-4 text-ios-red" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="text-ios-blue dark:text-ios-teal hover:text-opacity-80 flex items-center px-3 py-2"
                >
                  <FaSignInAlt className="mr-1 h-4 w-4" />
                  <span className="hidden sm:inline">Sign in</span>
                </Link>
                <Link
                  to="/register"
                  className="bg-ios-blue dark:bg-ios-teal hover:bg-opacity-90 text-white rounded-md px-3 py-2 flex items-center"
                >
                  <FaUserPlus className="mr-1 h-4 w-4" />
                  <span className="hidden sm:inline">Register</span>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="flex sm:hidden ml-3">
              <button
                onClick={toggleMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-ios-gray dark:text-ios-dark-text-secondary hover:text-ios-blue dark:hover:text-ios-teal hover:bg-ios-gray6 dark:hover:bg-ios-dark-secondary focus:outline-none"
              >
                <span className="sr-only">Open main menu</span>
                <svg
                  className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                <svg
                  className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`sm:hidden ${isMenuOpen ? 'block' : 'hidden'}`}>
        <div className="pt-2 pb-3 space-y-1">
          <Link
            to="/"
            className={`flex items-center px-3 py-2 text-ios-body rounded-md ${isActive('/') ? 'bg-ios-blue dark:bg-ios-teal bg-opacity-10 text-ios-blue dark:text-ios-teal font-medium' : 'text-ios-gray dark:text-ios-dark-text-secondary'}`}
            onClick={() => setIsMenuOpen(false)}
          >
            <FaHome className="mr-3 h-4 w-4" />
            Home
          </Link>
          <Link
            to="/groups"
            className={`flex items-center px-3 py-2 text-ios-body rounded-md ${isActive('/groups') ? 'bg-ios-blue dark:bg-ios-teal bg-opacity-10 text-ios-blue dark:text-ios-teal font-medium' : 'text-ios-gray dark:text-ios-dark-text-secondary'}`}
            onClick={() => setIsMenuOpen(false)}
          >
            <FaUsers className="mr-3 h-4 w-4" />
            Study Groups
          </Link>
          {currentUser && (
            <>
              <Link
                to="/my-modules"
                className={`flex items-center px-3 py-2 text-ios-body rounded-md ${isActive('/my-modules') ? 'bg-ios-blue dark:bg-ios-teal bg-opacity-10 text-ios-blue dark:text-ios-teal font-medium' : 'text-ios-gray dark:text-ios-dark-text-secondary'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                <FaGraduationCap className="mr-3 h-4 w-4" />
                My Modules
              </Link>
              <Link
                to="/study-timer"
                className={`flex items-center px-3 py-2 text-ios-body rounded-md ${isActive('/study-timer') ? 'bg-ios-blue dark:bg-ios-teal bg-opacity-10 text-ios-blue dark:text-ios-teal font-medium' : 'text-ios-gray dark:text-ios-dark-text-secondary'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                <FaClock className="mr-3 h-4 w-4" />
                Study Timer
              </Link>
            </>
          )}
          <Link
            to="/modules"
            className={`flex items-center px-3 py-2 text-ios-body rounded-md ${isActive('/modules') ? 'bg-ios-blue dark:bg-ios-teal bg-opacity-10 text-ios-blue dark:text-ios-teal font-medium' : 'text-ios-gray dark:text-ios-dark-text-secondary'}`}
            onClick={() => setIsMenuOpen(false)}
          >
            <FaBook className="mr-3 h-4 w-4" />
            Modules
          </Link>
          <Link
            to="/map"
            className={`flex items-center px-3 py-2 text-ios-body rounded-md ${isActive('/map') ? 'bg-ios-blue dark:bg-ios-teal bg-opacity-10 text-ios-blue dark:text-ios-teal font-medium' : 'text-ios-gray dark:text-ios-dark-text-secondary'}`}
            onClick={() => setIsMenuOpen(false)}
          >
            <FaMapMarkedAlt className="mr-3 h-4 w-4" />
            Map
          </Link>
        </div>
      </div>
      
      {/* Logout confirmation modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`max-w-sm w-full rounded-xl ${theme === 'dark' ? 'bg-ios-dark-elevated' : 'bg-white'} shadow-xl p-6`}>
            <div className="text-center mb-4">
              <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${theme === 'dark' ? 'bg-ios-dark-secondary' : 'bg-ios-red bg-opacity-10'} mb-4`}>
                <FaSignOutAlt className={`h-6 w-6 ${theme === 'dark' ? 'text-ios-teal' : 'text-ios-red'}`} />
              </div>
              <h3 className={`text-ios-title font-semibold ${theme === 'dark' ? 'text-ios-dark-text' : ''}`}>Sign Out</h3>
              <p className={`mt-2 ${theme === 'dark' ? 'text-ios-dark-text-secondary' : 'text-ios-gray'}`}>
                Are you sure you want to sign out? You'll need to sign in again to access your account.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={confirmLogout}
                className={`ios-button flex-1 ${theme === 'dark' ? 'bg-ios-red-dark' : 'bg-ios-red'} text-white`}
              >
                Sign Out
              </button>
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className={`ios-button flex-1 ${theme === 'dark' ? 'bg-ios-dark-secondary text-ios-dark-text-secondary' : 'bg-ios-gray6 text-ios-gray'}`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default NavBar;