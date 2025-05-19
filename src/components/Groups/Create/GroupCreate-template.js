import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link, useLocation as useRouteLocation } from 'react-router-dom';
import { ref, push, set, get } from 'firebase/database';
import { database } from '../../../firebase';
import { useAuth } from '../../../context/AuthContext';
import { useMajorsModules } from '../../../context/MajorsModulesContext';
import { useGoogleMaps } from '../../../context/GoogleMapsContext';
import { 
  FaBook, 
  FaMapMarkerAlt, 
  FaClock,
  FaArrowLeft,
  FaPlus,
  FaInfoCircle,
  FaGraduationCap,
  FaRegCalendarAlt
} from 'react-icons/fa';
import { allStudyLocations } from '../../../data/surreyLocations';
import SmallMapView from '../../Map/SmallMapView';
import MapControls from '../../Map/MapControls';
import EnhancedMarker from '../../Map/EnhancedMarker';
import { getMarkerIconForCategory } from '../../Map/customMarkers';

// Define map container style
const mapContainerStyle = {
  width: '100%',
  height: '300px',
};

function GroupCreate() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useRouteLocation();
  const { isLoaded, loadError } = useGoogleMaps();
  const initialModuleCode = searchParams.get('moduleCode');
  const { majors, modules, departments, loading: majorsModulesLoading } = useMajorsModules();
  
  // Form states
  const [name, setName] = useState('');
  const [moduleCode, setModuleCode] = useState(initialModuleCode || '');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [meetingLocation, setMeetingLocation] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [maxMembers, setMaxMembers] = useState(10);
  const [useLocation, setUseLocation] = useState(false);
  const [coordinates, setCoordinates] = useState(null);
  const [visibility, setVisibility] = useState('public');
  const [userPosition, setUserPosition] = useState(null);
  const [selectedMajor, setSelectedMajor] = useState('');
  const [filteredModules, setFilteredModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [isLocationHelpVisible, setIsLocationHelpVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [studyLocations, setStudyLocations] = useState([]);
  const [selectedPredefinedLocation, setSelectedPredefinedLocation] = useState(null);
  const [userModules, setUserModules] = useState([]);
  const [userModuleDetails, setUserModuleDetails] = useState([]);
  const [locationSearch, setLocationSearch] = useState('');
  const [showInfoWindow, setShowInfoWindow] = useState(null);
  const [mapType, setMapType] = useState('roadmap');
  const [showAllModules, setShowAllModules] = useState(false);
  const [useDatepicker, setUseDatepicker] = useState(false);
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTimeHour, setMeetingTimeHour] = useState('15');
  const [meetingTimeMinute, setMeetingTimeMinute] = useState('00');
  const [meetingTimeAmPm, setMeetingTimeAmPm] = useState('PM');
  const [addToCalendar, setAddToCalendar] = useState(true);
  const [recurringMeeting, setRecurringMeeting] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState('weekly');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Handle map location selection
  const handleLocationSelect = (position) => {
    if (!position || typeof position.lat === 'undefined' || typeof position.lng === 'undefined') {
      console.error('Invalid position received:', position);
      return;
    }
    
    setCoordinates({
      lat: position.lat,
      lng: position.lng
    });
    
    // Clear any pre-selected location
    setSelectedPredefinedLocation(null);
  };

  // Handle predefined location selection
  const handlePredefinedLocation = (spot) => {
    setCoordinates({
      lat: spot.location.lat,
      lng: spot.location.lng
    });
    setSelectedPredefinedLocation(spot);
    setMeetingLocation(spot.name);
  };

  const handleMarkerClick = (spot) => {
    setShowInfoWindow(spot.id);
    setCoordinates({ lat: spot.location.lat, lng: spot.location.lng });
    setMeetingLocation(spot.name);
  };

  const toggleMapType = () => {
    setMapType((prevType) => (prevType === 'roadmap' ? 'satellite' : 'roadmap'));
  };

  // All the existing useEffect hooks and other functions would go here
  // ...

  return (
    <div className="min-h-screen bg-ios-gray6 dark:bg-ios-dark-bg px-4 py-6 transition-colors duration-200">
      {/* All your JSX goes here */}
      {/* ... */}
      
      {/* This is the Map section that needs fixing */}
      {useLocation && (
        <div className="mt-4 mb-4 border rounded-ios overflow-hidden dark:border-ios-dark-border">
          <div className="search-bar mb-2">
            <input
              type="text"
              placeholder="Search for study spots..."
              value={locationSearch}
              onChange={handleSearchChange}
              className="ios-input w-full dark:bg-ios-dark-secondary dark:border-ios-dark-border dark:text-ios-dark-text"
            />
          </div>
          
          {/* Enhanced Map View */}
          {isLoaded && !loadError && (
            <div style={{ height: '350px', width: '100%' }}>
              <SmallMapView 
                center={coordinates || { lat: 51.242, lng: -0.589 }}
                zoom={15}
                mapType={mapType}
                markers={filteredStudySpots.map(spot => ({
                  id: spot.id,
                  position: { lat: spot.location.lat, lng: spot.location.lng },
                  title: spot.name,
                  category: spot.category || 'study',
                  description: spot.description,
                  isSelected: selectedPredefinedLocation?.id === spot.id
                }))}
                selectedLocation={coordinates}
                onMapClick={(e) => {
                  if (e && typeof e.lat !== 'undefined' && typeof e.lng !== 'undefined') {
                    // Position already processed by SmallMapView
                    handleLocationSelect(e);
                  } else if (e && e.latLng && typeof e.latLng.lat === 'function' && typeof e.latLng.lng === 'function') {
                    // Raw Google Maps event
                    handleLocationSelect({ lat: e.latLng.lat(), lng: e.latLng.lng() });
                  } else {
                    console.error('Invalid map click event:', e);
                  }
                }}
                onMarkerClick={(marker) => {
                  const spot = filteredStudySpots.find(s => s.id === marker.id);
                  if (spot) handleMarkerClick(spot);
                }}
                showControls={true}
                onMapTypeChange={toggleMapType}
                allowUserLocation={true}
              />
            </div>
          )}
          {loadError && (
            <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
              <p className="text-red-500 dark:text-red-400">Error loading map: {loadError.message}</p>
            </div>
          )}
        </div>
      )}
      
      {/* Rest of your component... */}
    </div>
  );
}

export default GroupCreate;
