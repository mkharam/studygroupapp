import React, { createContext, useContext, useState } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';

// Google Maps API Key
const GOOGLE_MAPS_API_KEY = 'AIzaSyA6Tx4cbx7PVbUcVMDm-ETHRro0pinTAQw';

// Libraries to load with the API
const libraries = ['places'];

// Create context
const GoogleMapsContext = createContext(null);

// Provider component
export const GoogleMapsProvider = ({ children }) => {
  // Use the hook from @react-google-maps/api to load the API
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
    // This prevents multiple instances of the script from being loaded
    // by using a unique ID for the script element
    id: 'google-map-script'
  });

  // Value to be provided to consuming components
  const value = {
    isLoaded,
    loadError
  };

  return (
    <GoogleMapsContext.Provider value={value}>
      {children}
    </GoogleMapsContext.Provider>
  );
};

// Custom hook for consuming the context
export const useGoogleMaps = () => {
  const context = useContext(GoogleMapsContext);
  if (!context) {
    throw new Error('useGoogleMaps must be used within a GoogleMapsProvider');
  }
  return context;
};