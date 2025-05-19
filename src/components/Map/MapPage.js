import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, Marker, Autocomplete, InfoWindow } from '@react-google-maps/api';
import { useGoogleMaps } from '../../context/GoogleMapsContext';
import { allStudyLocations } from '../../data/surreyLocations';
import { ref, onValue } from 'firebase/database';
import { database } from '../../firebase';
import { 
  FaFilter, 
  FaWifi, 
  FaPowerOff, 
  FaVolumeMute, 
  FaUsers, 
  FaLocationArrow,
  FaClock,
  FaSearch,
  FaTimes,
  FaPlus,
  FaUserFriends,
  FaChevronDown,
  FaChevronUp,
  FaSpinner
} from 'react-icons/fa';
import { getMarkerIconForCategory, getUserLocationMarkerStyle } from './customMarkers';

const containerStyle = {
  width: '100%',
  height: '100vh',
};

const defaultCenter = {
  lat: 51.2422, // University of Surrey coordinates
  lng: -0.5892,
};

const LocationInfoBox = ({ location, onClose, onCreateGroup, isCustomLocation = false }) => {
  const [placeDetails, setPlaceDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!location?.placeId) {
      setIsLoading(false);
      return;
    }

    const service = new window.google.maps.places.PlacesService(document.createElement('div'));
    service.getDetails(
      { placeId: location.placeId, fields: ['name', 'formatted_address', 'opening_hours', 'rating', 'photos', 'website'] },
      (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          setPlaceDetails(place);
        }
        setIsLoading(false);
      }
    );
  }, [location?.placeId]);

  if (isLoading) {
    return (
      <div className="p-4 min-w-[300px] max-w-[400px] bg-white dark:bg-ios-dark-elevated rounded-lg shadow-lg">
        <div className="flex items-center justify-center py-4">
          <FaSpinner className="animate-spin text-2xl text-ios-blue dark:text-ios-teal" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 min-w-[300px] max-w-[400px] bg-white dark:bg-ios-dark-elevated rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-lg text-gray-900 dark:text-ios-dark-text">
            {location.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-ios-dark-text-secondary">
            {placeDetails?.formatted_address || location.address}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-ios-dark-secondary rounded-full transition-colors"
        >
          <FaTimes className="text-gray-500 dark:text-ios-dark-text-tertiary" />
        </button>
      </div>

      {/* Category and Rating */}
      <div className="flex items-center justify-between mb-3">
        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full capitalize">
          {location.category?.replace('_', ' ') || 'Study Location'}
        </span>
        {placeDetails?.rating && (
          <div className="flex items-center text-yellow-500">
            <span className="mr-1">{placeDetails.rating}</span>
            <span className="text-xs text-gray-600 dark:text-ios-dark-text-secondary">/ 5</span>
          </div>
        )}
      </div>

      {/* Features */}
      {location.features && location.features.length > 0 && (
        <div className="mb-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-ios-dark-text mb-2">Features</h4>
          <div className="flex flex-wrap gap-2">
            {location.features.map((feature, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 dark:bg-ios-dark-secondary text-gray-700 dark:text-ios-dark-text text-xs rounded-full flex items-center"
              >
                {feature === 'Wifi' && <FaWifi className="mr-1" />}
                {feature === 'Power Outlets' && <FaPowerOff className="mr-1" />}
                {feature === 'Quiet' && <FaVolumeMute className="mr-1" />}
                {feature === 'Group Study' && <FaUsers className="mr-1" />}
                {feature}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Opening Hours */}
      <div className="mb-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-ios-dark-text mb-2">Opening Hours</h4>
        <div className="flex items-center text-sm text-gray-600 dark:text-ios-dark-text-secondary">
          <FaClock className="mr-2" />
          <span>{location.openingHours || (placeDetails?.opening_hours?.isOpen() ? 'Open Now' : 'Closed')}</span>
        </div>
      </div>

      {/* Noise Level */}
      {location.noise && (
        <div className="mb-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-ios-dark-text mb-2">Noise Level</h4>
          <div className="flex items-center text-sm text-gray-600 dark:text-ios-dark-text-secondary">
            <FaVolumeMute className="mr-2" />
            <span className="capitalize">{location.noise}</span>
          </div>
        </div>
      )}

      {/* Active Groups */}
      {!isCustomLocation && location.activeGroups > 0 && (
        <div className="mb-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-ios-dark-text mb-2">Active Study Groups</h4>
          <div className="flex items-center text-sm text-gray-600 dark:text-ios-dark-text-secondary">
            <FaUserFriends className="mr-2" />
            <span>{location.activeGroups} active groups</span>
          </div>
        </div>
      )}

      {/* Website Link */}
      {placeDetails?.website && (
        <div className="mb-3">
          <a
            href={placeDetails.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-ios-blue dark:text-ios-teal hover:underline"
          >
            Visit Website
          </a>
        </div>
      )}

      {/* Create Group Button */}
      <button
        onClick={() => onCreateGroup(location)}
        className="w-full mt-3 bg-ios-blue dark:bg-ios-teal text-white px-4 py-2 rounded-lg hover:bg-blue-600 dark:hover:bg-teal-600 transition-colors flex items-center justify-center"
      >
        <FaPlus className="mr-2" />
        Create Study Group Here
      </button>
    </div>
  );
};

const MapPage = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [autocomplete, setAutocomplete] = useState(null);
  const searchInputRef = useRef(null);
  const { isLoaded, loadError } = useGoogleMaps();
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);
  
  // State for filters and sidebar
  const [showSidebar, setShowSidebar] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all',
    features: [],
    noise: 'all',
    powerOutlets: 'all',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeGroups, setActiveGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showGroups, setShowGroups] = useState(true);
  const [expandedFilters, setExpandedFilters] = useState({
    category: true,
    features: true,
    noise: true,
    powerOutlets: true
  });
  const [map, setMap] = useState(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mapBounds, setMapBounds] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Fetch active groups
  useEffect(() => {
    const groupsRef = ref(database, 'groups');
    const unsubscribe = onValue(groupsRef, (snapshot) => {
      if (snapshot.exists()) {
        const groupsData = snapshot.val();
        // Filter active groups with location data
        const groups = Object.entries(groupsData)
          .filter(([_, group]) => 
            group.status !== 'archived' && 
            group.coordinates && 
            group.coordinates.lat && 
            group.coordinates.lng
          )
          .map(([id, group]) => ({
            id,
            ...group,
            memberCount: group.members ? Object.keys(group.members).length : 0
          }));
        setActiveGroups(groups);
      } else {
        setActiveGroups([]);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Dark mode map styles
  const darkMapStyles = [
    {
      elementType: "geometry",
      stylers: [{ color: "#242f3e" }]
    },
    {
      elementType: "labels.text.stroke",
      stylers: [{ color: "#242f3e" }]
    },
    {
      elementType: "labels.text.fill",
      stylers: [{ color: "#746855" }]
    },
    {
      featureType: "administrative.locality",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }]
    },
    {
      featureType: "poi",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }]
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: "#263c3f" }]
    },
    {
      featureType: "poi.park",
      elementType: "labels.text.fill",
      stylers: [{ color: "#6b9a76" }]
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#38414e" }]
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: "#212a37" }]
    },
    {
      featureType: "road",
      elementType: "labels.text.fill",
      stylers: [{ color: "#9ca5b3" }]
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#746855" }]
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [{ color: "#1f2835" }]
    },
    {
      featureType: "road.highway",
      elementType: "labels.text.fill",
      stylers: [{ color: "#f3d19c" }]
    },
    {
      featureType: "transit",
      elementType: "geometry",
      stylers: [{ color: "#2f3948" }]
    },
    {
      featureType: "transit.station",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }]
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#17263c" }]
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [{ color: "#515c6d" }]
    },
    {
      featureType: "water",
      elementType: "labels.text.stroke",
      stylers: [{ color: "#17263c" }]
    }
  ];

  // Light mode map styles
  const lightMapStyles = [
    {
      featureType: "all",
      elementType: "labels.text.fill",
      stylers: [{ color: "#7c7c7c" }]
    },
    {
      featureType: "all",
      elementType: "labels.text.stroke",
      stylers: [{ color: "#ffffff" }]
    },
    {
      featureType: "landscape",
      elementType: "geometry",
      stylers: [{ color: "#f5f5f5" }]
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#e9e9e9" }]
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [{ color: "#9e9e9e" }]
    }
  ];

  // Get user's current location with enhanced error handling
  const getUserLocation = useCallback(() => {
    setIsLocating(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(userPos);
        setMapCenter(userPos);
        setIsLocating(false);
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location services.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
          default:
            errorMessage = 'An unknown error occurred.';
        }
        setLocationError(errorMessage);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, []);

  // Filter locations based on current filters
  const filteredLocations = allStudyLocations.filter(spot => {
    if (!spot) return false;
    if (filters.category !== 'all' && spot.category !== filters.category) return false;
    if (filters.features.length > 0 && !filters.features.every(f => spot.features?.includes(f))) return false;
    if (filters.noise !== 'all' && !spot.noise?.toLowerCase().includes(filters.noise.toLowerCase())) return false;
    if (filters.powerOutlets !== 'all' && !spot.powerOutlets?.toLowerCase().includes(filters.powerOutlets.toLowerCase())) return false;
    if (searchTerm && !spot.name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const onMapClick = useCallback((e) => {
    if (!e.latLng) return;
    
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode(
      { location: { lat: e.latLng.lat(), lng: e.latLng.lng() } },
      (results, status) => {
        if (status === "OK" && results[0]) {
          // Check if this location matches any of our study spots
          const matchingSpot = allStudyLocations.find(spot => 
            spot.location.lat === e.latLng.lat() && 
            spot.location.lng === e.latLng.lng()
          );

          if (matchingSpot) {
            setSelectedLocation(matchingSpot);
            setSelected(null);
          } else {
            setSelected({
              lat: e.latLng.lat(),
              lng: e.latLng.lng(),
              name: results[0].formatted_address,
              address: results[0].formatted_address,
              placeId: results[0].place_id
            });
            setSelectedLocation(null);
          }
          setShowCreateGroup(true);
        }
      }
    );
  }, []);

  const onPlaceChanged = () => {
    if (!autocomplete) return;
    
    const place = autocomplete.getPlace();
    if (place?.geometry?.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      setMapCenter({ lat, lng });
      setSelected({ 
        lat, 
        lng, 
        name: place.name || 'Selected Location',
        address: place.formatted_address || 'Custom Location',
        placeId: place.place_id
      });
      setSelectedLocation(null);
      setShowCreateGroup(true);
    }
  };

  const handleLocationClick = (spot) => {
    if (!spot) return;
    setSelectedLocation(spot);
    setMapCenter(spot.location);
    setSelected(null);
    setShowCreateGroup(true);
  };

  const handleCreateGroup = (location) => {
    if (!location) return;
    
    const locationData = {
      coordinates: location.location || { lat: location.lat, lng: location.lng },
      name: location.name || 'Custom Location',
      address: location.address || location.name || 'Selected Location',
      placeId: location.placeId
    };

    navigate('/groups/create', { 
      state: { 
        location: locationData,
        fromMap: true
      }
    });
  };

  const clearSearch = () => {
    setSearchTerm('');
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
    }
  };

  const onMapLoad = useCallback((map) => {
    console.log('Map loaded');
    setMap(map);
    setIsMapLoaded(true);
    setIsInitialLoad(true);

    // Set initial load to false after animation
    setTimeout(() => {
      setIsInitialLoad(false);
    }, 1000);
  }, []);

  // Update map bounds when markers change
  useEffect(() => {
    if (!map || !isMapLoaded) return;

    try {
      console.log('Updating map bounds');
      const bounds = new window.google.maps.LatLngBounds();
      let hasMarkers = false;
      
      // Add study locations to bounds
      filteredLocations.forEach(spot => {
        if (spot.location) {
          bounds.extend(spot.location);
          hasMarkers = true;
          console.log('Added study location to bounds:', spot.name, spot.location);
        }
      });

      // Add active groups to bounds
      if (showGroups) {
        activeGroups.forEach(group => {
          if (group.coordinates) {
            bounds.extend(group.coordinates);
            hasMarkers = true;
            console.log('Added group to bounds:', group.name, group.coordinates);
          }
        });
      }

      // Add user location to bounds if available
      if (userLocation) {
        bounds.extend(userLocation);
        hasMarkers = true;
        console.log('Added user location to bounds:', userLocation);
      }

      // If no markers, use default center
      if (!hasMarkers) {
        bounds.extend(defaultCenter);
        console.log('No markers found, using default center');
      }

      // Only update bounds if they've changed
      const newBounds = bounds.toJSON();
      if (JSON.stringify(newBounds) !== JSON.stringify(mapBounds)) {
        // Set a timeout to ensure the map is ready
        setTimeout(() => {
          // Add padding to bounds
          const padding = {
            top: 50,
            right: 50,
            bottom: 50,
            left: showSidebar ? 400 : 50
          };
          
          map.fitBounds(bounds, padding);
          setMapBounds(newBounds);
          console.log('Map bounds updated:', newBounds);
        }, 100);
      }
    } catch (error) {
      console.error('Error updating map bounds:', error);
    }
  }, [map, isMapLoaded, filteredLocations, activeGroups, userLocation, showGroups, showSidebar, mapBounds]);

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-ios-dark-bg">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800 dark:text-ios-dark-text mb-2">Error Loading Map</h2>
          <p className="text-gray-600 dark:text-ios-dark-text-secondary">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  if (!isLoaded || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-ios-dark-bg">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-ios-blue dark:text-ios-teal mx-auto mb-4" />
          <p className="text-gray-600 dark:text-ios-dark-text-secondary">Loading Map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-ios-dark-bg overflow-hidden">
      {/* Sidebar */}
      <div 
        className={`fixed top-0 left-0 h-full w-96 bg-white dark:bg-ios-dark-elevated shadow-lg transition-transform duration-300 ease-in-out z-20 ${
          showSidebar ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 flex-none">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-ios-dark-text">Study Locations</h2>
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-ios-dark-secondary rounded-full transition-colors"
            >
              <FaFilter className="text-gray-600 dark:text-ios-dark-text" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border rounded-lg bg-white dark:bg-ios-dark-secondary dark:border-ios-dark-border dark:text-ios-dark-text focus:ring-2 focus:ring-blue-500 dark:focus:ring-ios-teal focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <FaTimes className="text-gray-400 hover:text-gray-600 dark:hover:text-ios-dark-text" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="space-y-2">
            {/* Category Filter */}
            <div className="bg-gray-50 dark:bg-ios-dark-secondary rounded-lg">
              <button
                onClick={() => setExpandedFilters(prev => ({ ...prev, category: !prev.category }))}
                className="w-full px-4 py-2 flex justify-between items-center"
              >
                <span className="font-medium text-gray-700 dark:text-ios-dark-text">Category</span>
                {expandedFilters.category ? <FaChevronUp /> : <FaChevronDown />}
              </button>
              {expandedFilters.category && (
                <div className="px-4 pb-3">
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-white dark:bg-ios-dark-secondary dark:border-ios-dark-border dark:text-ios-dark-text focus:ring-2 focus:ring-blue-500 dark:focus:ring-ios-teal focus:border-transparent"
                  >
                    <option value="all">All Categories</option>
                    <option value="library">Libraries</option>
                    <option value="academic_building">Academic Buildings</option>
                    <option value="cafe">Cafes</option>
                    <option value="outdoor">Outdoor Spaces</option>
                  </select>
                </div>
              )}
            </div>

            {/* Features Filter */}
            <div className="bg-gray-50 dark:bg-ios-dark-secondary rounded-lg">
              <button
                onClick={() => setExpandedFilters(prev => ({ ...prev, features: !prev.features }))}
                className="w-full px-4 py-2 flex justify-between items-center"
              >
                <span className="font-medium text-gray-700 dark:text-ios-dark-text">Features</span>
                {expandedFilters.features ? <FaChevronUp /> : <FaChevronDown />}
              </button>
              {expandedFilters.features && (
                <div className="px-4 pb-3 space-y-2">
                  {['Wifi', 'Power Outlets', 'Quiet', 'Group Study'].map(feature => (
                    <label key={feature} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={filters.features.includes(feature)}
                        onChange={(e) => {
                          const newFeatures = e.target.checked
                            ? [...filters.features, feature]
                            : filters.features.filter(f => f !== feature);
                          setFilters({ ...filters, features: newFeatures });
                        }}
                        className="rounded text-blue-500 dark:text-ios-teal focus:ring-blue-500 dark:focus:ring-ios-teal"
                      />
                      <span className="text-sm text-gray-700 dark:text-ios-dark-text">{feature}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Noise Level Filter */}
            <div className="bg-gray-50 dark:bg-ios-dark-secondary rounded-lg">
              <button
                onClick={() => setExpandedFilters(prev => ({ ...prev, noise: !prev.noise }))}
                className="w-full px-4 py-2 flex justify-between items-center"
              >
                <span className="font-medium text-gray-700 dark:text-ios-dark-text">Noise Level</span>
                {expandedFilters.noise ? <FaChevronUp /> : <FaChevronDown />}
              </button>
              {expandedFilters.noise && (
                <div className="px-4 pb-3">
                  <select
                    value={filters.noise}
                    onChange={(e) => setFilters({ ...filters, noise: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-white dark:bg-ios-dark-secondary dark:border-ios-dark-border dark:text-ios-dark-text focus:ring-2 focus:ring-blue-500 dark:focus:ring-ios-teal focus:border-transparent"
                  >
                    <option value="all">All Noise Levels</option>
                    <option value="quiet">Quiet</option>
                    <option value="moderate">Moderate</option>
                    <option value="busy">Busy</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Location List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {filteredLocations.map(spot => (
            <div
              key={spot.id}
              onClick={() => handleLocationClick(spot)}
              className={`p-3 border-b border-gray-200 dark:border-ios-dark-border cursor-pointer transition-colors ${
                selectedLocation?.id === spot.id 
                  ? 'bg-blue-50 dark:bg-ios-blue dark:bg-opacity-10' 
                  : 'hover:bg-gray-50 dark:hover:bg-ios-dark-secondary'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-ios-dark-text">{spot.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-ios-dark-text-secondary capitalize">{spot.category.replace('_', ' ')}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {spot.features.includes('Wifi') && <FaWifi className="text-gray-500 dark:text-ios-dark-text-tertiary" />}
                  {spot.features.includes('Power Outlets') && <FaPowerOff className="text-gray-500 dark:text-ios-dark-text-tertiary" />}
                  {spot.noise.toLowerCase().includes('quiet') && <FaVolumeMute className="text-gray-500 dark:text-ios-dark-text-tertiary" />}
                  {spot.features.includes('Group Study') && <FaUsers className="text-gray-500 dark:text-ios-dark-text-tertiary" />}
                </div>
              </div>
              <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-ios-dark-text-tertiary">
                <FaClock className="mr-1" />
                <span>{spot.openingHours}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Map Container */}
      <div className={`flex-1 relative transition-all duration-300 ease-in-out ${
        showSidebar ? 'ml-96' : 'ml-0'
      }`}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={mapCenter}
          zoom={16}
          onClick={onMapClick}
          onLoad={onMapLoad}
          options={{
            styles: document.documentElement.classList.contains('dark') ? darkMapStyles : lightMapStyles,
            disableDefaultUI: true,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            gestureHandling: 'greedy',
            maxZoom: 18,
            minZoom: 12,
            zoomControlOptions: {
              position: window.google.maps.ControlPosition.RIGHT_CENTER
            }
          }}
        >
          {/* Location Markers */}
          {isMapLoaded && filteredLocations.map(spot => {
            console.log('Rendering marker for:', spot.name, spot.location);
            return (
              <Marker
                key={spot.id}
                position={spot.location}
                onClick={() => handleLocationClick(spot)}
                icon={{
                  url: getMarkerIconForCategory(spot.category),
                  scaledSize: new window.google.maps.Size(32, 32),
                  animation: isInitialLoad ? window.google.maps.Animation.DROP : null
                }}
                zIndex={selectedLocation?.id === spot.id ? 1000 : 1}
                visible={true}
                clickable={true}
                draggable={false}
              >
                {selectedLocation?.id === spot.id && (
                  <InfoWindow
                    position={spot.location}
                    onCloseClick={() => setSelectedLocation(null)}
                  >
                    <LocationInfoBox
                      location={spot}
                      onClose={() => setSelectedLocation(null)}
                      onCreateGroup={handleCreateGroup}
                    />
                  </InfoWindow>
                )}
              </Marker>
            );
          })}

          {/* Active Group Markers */}
          {isMapLoaded && showGroups && activeGroups.map(group => {
            console.log('Rendering group marker for:', group.name, group.coordinates);
            return (
              <Marker
                key={group.id}
                position={group.coordinates}
                onClick={() => setSelectedGroup(group)}
                icon={{
                  url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                  scaledSize: new window.google.maps.Size(32, 32),
                  animation: isInitialLoad ? window.google.maps.Animation.DROP : null
                }}
                zIndex={selectedGroup?.id === group.id ? 1000 : 1}
                visible={true}
                clickable={true}
                draggable={false}
              >
                {selectedGroup?.id === group.id && (
                  <InfoWindow
                    position={group.coordinates}
                    onCloseClick={() => setSelectedGroup(null)}
                  >
                    <LocationInfoBox
                      location={group}
                      onClose={() => setSelectedGroup(null)}
                      onCreateGroup={handleCreateGroup}
                    />
                  </InfoWindow>
                )}
              </Marker>
            );
          })}

          {/* User Location Marker */}
          {isMapLoaded && userLocation && (
            <Marker
              position={userLocation}
              icon={getUserLocationMarkerStyle()}
              visible={true}
              clickable={false}
              draggable={false}
            />
          )}

          {/* Custom Location Marker */}
          {isMapLoaded && selected && (
            <Marker
              position={selected}
              icon={{
                url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
                scaledSize: new window.google.maps.Size(40, 40)
              }}
              visible={true}
              clickable={true}
              draggable={false}
            >
              <InfoWindow
                position={selected}
                onCloseClick={() => setSelected(null)}
              >
                <LocationInfoBox
                  location={selected}
                  onClose={() => setSelected(null)}
                  onCreateGroup={handleCreateGroup}
                  isCustomLocation={true}
                />
              </InfoWindow>
            </Marker>
          )}
        </GoogleMap>

        {/* Search Box */}
        <div className={`absolute top-4 z-10 transition-all duration-300 ease-in-out ${
          showSidebar ? 'left-4' : 'left-4'
        }`}>
          <Autocomplete
            onLoad={setAutocomplete}
            onPlaceChanged={onPlaceChanged}
            restrictions={{ country: "gb" }}
            types={['establishment', 'geocode']}
          >
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search for a location"
                ref={searchInputRef}
                className="w-64 pl-10 pr-4 py-2 border rounded-lg shadow-lg bg-white dark:bg-ios-dark-elevated dark:border-ios-dark-border dark:text-ios-dark-text focus:ring-2 focus:ring-blue-500 dark:focus:ring-ios-teal focus:border-transparent"
              />
            </div>
          </Autocomplete>
        </div>

        {/* Map Controls */}
        <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
          {/* My Location Button */}
          <button
            onClick={getUserLocation}
            disabled={isLocating}
            className={`bg-white dark:bg-ios-dark-elevated p-3 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-ios-dark-secondary transition-colors ${
              isLocating ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title="Find my location"
          >
            <FaLocationArrow className={`text-gray-600 dark:text-ios-dark-text ${isLocating ? 'animate-spin' : ''}`} />
          </button>

          {/* Toggle Groups Button */}
          <button
            onClick={() => setShowGroups(!showGroups)}
            className={`p-3 rounded-lg shadow-lg transition-colors ${
              showGroups 
                ? 'bg-ios-blue dark:bg-ios-teal text-white' 
                : 'bg-white dark:bg-ios-dark-elevated text-gray-600 dark:text-ios-dark-text hover:bg-gray-50 dark:hover:bg-ios-dark-secondary'
            }`}
            title={showGroups ? "Hide study groups" : "Show study groups"}
          >
            <FaUserFriends />
          </button>

          {/* Toggle Sidebar Button */}
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="bg-white dark:bg-ios-dark-elevated p-3 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-ios-dark-secondary transition-colors"
            title={showSidebar ? "Hide filters" : "Show filters"}
          >
            <FaFilter className="text-gray-600 dark:text-ios-dark-text" />
          </button>
        </div>

        {/* Create Group Button */}
        {(showCreateGroup || selected) && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
            <button
              onClick={() => handleCreateGroup(selectedLocation || selected)}
              className="flex items-center space-x-2 bg-ios-blue dark:bg-ios-teal text-white px-6 py-3 rounded-lg shadow-lg hover:bg-blue-600 dark:hover:bg-teal-600 transition-colors font-medium"
            >
              <FaPlus />
              <span>Create Study Group at {selectedLocation?.name || selected?.name || 'Selected Location'}</span>
            </button>
          </div>
        )}

        {/* Location Error Message */}
        {locationError && (
          <div className="absolute bottom-4 left-4 z-10 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 px-4 py-2 rounded-lg shadow-lg">
            {locationError}
          </div>
        )}
      </div>
    </div>
  );
};

export default MapPage; 