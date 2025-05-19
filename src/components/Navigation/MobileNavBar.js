import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FaHome,
  FaUsers,
  FaBook,
  FaMapMarkerAlt,
  FaUser
} from 'react-icons/fa';

const MobileNavBar = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  
  // Don't show mobile navigation on login/register pages
  if (!currentUser || location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }
    // Navigation items
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: FaHome },
    { path: '/groups', label: 'Groups', icon: FaUsers },
    { path: '/my-modules', label: 'Modules', icon: FaBook },
    { path: '/map', label: 'Map', icon: FaMapMarkerAlt },
    { path: '/profile', label: 'Profile', icon: FaUser }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-ios-dark-elevated border-t border-ios-gray5 dark:border-ios-dark-border sm:hidden shadow-top pb-safe-area">
      <div className="flex justify-around">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex flex-1 flex-col items-center py-2 px-1
              ${isActive 
                ? 'text-ios-blue dark:text-ios-teal' 
                : 'text-ios-gray dark:text-ios-dark-text-secondary'}
            `}
          >
            {({ isActive }) => (
              <>
                <item.icon className={`text-xl ${isActive ? 'transform scale-110' : ''}`} />
                <span className="text-xs mt-1">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default MobileNavBar;