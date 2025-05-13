import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GoogleMap, 
  InfoWindow, 
  MarkerClusterer,
  Marker,
  StandaloneSearchBox,
  OverlayView
} from '@react-google-maps/api';
import { ref, onValue } from 'firebase/database';
import { database } from '../../firebase';
import { useTheme } from '../../context/ThemeContext';
import { useGoogleMaps } from '../../context/GoogleMapsContext';
import { allStudyLocations } from '../../data/surreyLocations';
import { 
  FaFilter, 
  FaLocationArrow, 
  FaBuilding, 
  FaUsers, 
  FaCoffee, 
  FaUniversity,
  FaBookOpen,
  FaUmbrellaBeach,
  FaList,
  FaMapMarkedAlt,
  FaTimes,
  FaInfoCircle,
  FaExclamationTriangle,
  FaSatellite,
  FaMap,
  FaSearch,
  FaPlus,
  FaCheck,
  FaStar,
  FaBook,
  FaClock,
  FaLayerGroup
} from 'react-icons/fa';

const containerStyle = {
  width: '100%',
  height: 'calc(100vh - 80px)', // Increased height for better desktop experience
  borderRadius: '8px',          // Add rounded corners for better desktop aesthetics
  overflow: 'hidden'            // Ensure content stays within the rounded borders
};

const defaultCenter = {
  lat: 51.242,
  lng: -0.589,
};

// Define map control styles constants since they're not exported from the library
const mapTypeControlStyle = {
  DEFAULT: 0,
  HORIZONTAL_BAR: 1,
  DROPDOWN_MENU: 2,
  INSET: 3,
  INSET_LARGE: 4
};

// Dark mode map style
const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3948" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }],
  },
];

// Light mode basic styling for map
const lightMapStyle = [
  {
    featureType: 'poi.business',
    elementType: 'labels',
    stylers: [{ visibility: 'on' }]
  },
  {
    featureType: 'poi.school',
    elementType: 'labels',
    stylers: [{ visibility: 'on' }]
  }
];

// Marker icons
const markerIcons = {
  user: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
  spot: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
  group: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
  library: 'http://maps.google.com/mapfiles/ms/icons/purple-dot.png',
  cafe: 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
  academic_building: 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png',
  study_hub: 'http://maps.google.com/mapfiles/ms/icons/pink-dot.png',
  public_library: 'http://maps.google.com/mapfiles/ms/icons/purple-dot.png',
  outdoor: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
  other: 'http://maps.google.com/mapfiles/ms/icons/ltblue-dot.png'
};

// Add label styles for map markers in satellite mode
const markerLabelStyle = {
  color: '#ffffff',
  fontWeight: 'bold',
  fontSize: '14px',
  textShadow: '0px 0px 3px #000000, 0px 0px 5px #000000',
  backgroundColor: 'rgba(0,0,0,0.4)',
  padding: '2px 5px',
  borderRadius: '3px',
  whiteSpace: 'nowrap'
};

function MapView() {
  const { theme } = useTheme();
  const { isLoaded, loadError } = useGoogleMaps();
  const navigate = useNavigate();
  const [studySpots, setStudySpots] = useState([]);
  const [groups, setGroups] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [filters, setFilters] = useState({
    showGroups: true,
    showLibraries: true,
    showCafes: true,
    showAcademicBuildings: true,
    showStudyHubs: true,
    showOutdoor: true,
    showOther: true
  });
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [showLocationsList, setShowLocationsList] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [mapType, setMapType] = useState('roadmap'); // State to track map type (roadmap or satellite)
  const [locationSelectionMode, setLocationSelectionMode] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [searchBox, setSearchBox] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showLabelsInSatellite, setShowLabelsInSatellite] = useState(true);
  const [activeInfoWindow, setActiveInfoWindow] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(false);

  const hasCenteredOnUser = useRef(false);
  const hasAttemptedGeolocation = useRef(false);
  const isMounted = useRef(true);
  const mapRef = useRef(null);
  const infoWindowsRef = useRef({});

  // Use useMemo to create a stable mapKey that truly only changes once per session
  const mapKey = useMemo(() => {
    if (typeof window !== 'undefined' && !window.googleMapsInitialized) {
      window.googleMapsInitialized = true;
      return `map-instance-${new Date().getTime()}`;
    }
    return "persistent-map-key";
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Improved centerOnUserLocation function to better handle permissions and errors
  const centerOnUserLocation = useCallback(() => {
    if (loadingLocation) return;

    setLoadingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      setLoadingLocation(false);
      return;
    }

    const handleSuccess = (position) => {
      if (!isMounted.current) return;

      const { latitude, longitude } = position.coords;
      const newLocation = {
        lat: latitude,
        lng: longitude,
      };

      setUserLocation(newLocation);

      if (mapRef.current) {
        mapRef.current.panTo(newLocation);
        mapRef.current.setZoom(16);
      }

      setLoadingLocation(false);
    };

    const handleError = (error) => {
      if (!isMounted.current) return;

      console.error('Error getting location:', error);

      let errorMessage;
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "Location permission denied. Please enable location services for this site.";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = "Location information is unavailable. Please try again later.";
          break;
        case error.TIMEOUT:
          errorMessage = "Request to get location timed out. Please try again.";
          break;
        default:
          errorMessage = "An unknown error occurred while trying to get your location.";
      }

      setLocationError(errorMessage);
      setLoadingLocation(false);
    };

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options);
  }, [loadingLocation]);

  // Initialize user location when component mounts
  useEffect(() => {
    if (!userLocation && navigator.geolocation) {
      centerOnUserLocation();
    }

    return () => {
      isMounted.current = false;
    };
  }, [userLocation, centerOnUserLocation]);

  // Function to handle map load and save the map reference
  const handleMapLoad = useCallback((mapInstance) => {
    mapRef.current = mapInstance;

    const savedPosition = sessionStorage.getItem('mapPosition');
    if (savedPosition) {
      try {
        const position = JSON.parse(savedPosition);
        mapInstance.setCenter({ lat: position.lat, lng: position.lng });
        mapInstance.setZoom(position.zoom || 15);
      } catch (e) {
        console.error("Error parsing saved map position:", e);
      }
    } else if (userLocation) {
      mapInstance.setCenter(userLocation);
      mapInstance.setZoom(16);
    }
  }, [userLocation]);

  // Load and save map state to session storage
  useEffect(() => {
    if (!window.googleMapsInitialized) {
      window.googleMapsInitialized = true;
    }

    const savedFilters = sessionStorage.getItem('mapFilters');
    const savedSelectedMarker = sessionStorage.getItem('mapSelectedMarker');
    const savedMapType = sessionStorage.getItem('mapType');

    if (savedMapType && isMounted.current) {
      setMapType(savedMapType);
    }

    if (savedFilters && isMounted.current) {
      try {
        const parsedFilters = JSON.parse(savedFilters);
        setFilters(prev => {
          return JSON.stringify(prev) !== savedFilters ? parsedFilters : prev;
        });
      } catch (e) {
        console.error("Error parsing saved filters:", e);
      }
    }

    if (savedSelectedMarker && isMounted.current) {
      try {
        const parsedMarker = JSON.parse(savedSelectedMarker);
        setSelectedMarker(prev => {
          return JSON.stringify(prev) !== savedSelectedMarker ? parsedMarker : prev;
        });
      } catch (e) {
        console.error("Error parsing saved selected marker:", e);
      }
    }

    const saveMapState = () => {
      if (mapRef.current && isMounted.current) {
        const center = mapRef.current.getCenter();
        if (center) {
          const position = {
            lat: center.lat(),
            lng: center.lng(),
            zoom: mapRef.current.getZoom()
          };
          sessionStorage.setItem('mapPosition', JSON.stringify(position));
        }

        if (selectedMarker) {
          sessionStorage.setItem('mapSelectedMarker', JSON.stringify(selectedMarker));
        }

        sessionStorage.setItem('mapFilters', JSON.stringify(filters));
        sessionStorage.setItem('mapType', mapType);
      }
    };

    window.addEventListener('beforeunload', saveMapState);

    return () => {
      window.removeEventListener('beforeunload', saveMapState);
      saveMapState();
    };
  }, [filters, selectedMarker, mapType]);

  // Fetch study spots from static data and groups from Firebase - only run once on mount
  useEffect(() => {
    setStudySpots(allStudyLocations);

    const groupsRef = ref(database, 'groups');
    const unsubscribe = onValue(groupsRef, (snapshot) => {
      if (snapshot.exists() && isMounted.current) {
        const groupsData = snapshot.val();
        const groupsArray = Object.entries(groupsData).map(([id, group]) => ({ id, ...group }));
        setGroups(groupsArray);
      }
    });

    return () => unsubscribe();
  }, []);

  // This useEffect had undefined dependencies causing issues
  useEffect(() => {
    if (!navigator.geolocation && !hasAttemptedGeolocation.current) {
      setLocationError("Geolocation is not supported by your browser.");
      hasAttemptedGeolocation.current = true;
    } else if (!userLocation && !hasAttemptedGeolocation.current) {
      centerOnUserLocation();
      hasAttemptedGeolocation.current = true;
    } else if (userLocation && mapRef.current && !hasCenteredOnUser.current) {
      mapRef.current.panTo(userLocation);
      mapRef.current.setZoom(16);
      hasCenteredOnUser.current = true;
    }
  }, [userLocation, centerOnUserLocation]);

  // Find nearby study spots based on user location
  const findNearbySpots = useCallback(() => {
    if (!userLocation) {
      centerOnUserLocation();
      return;
    }

    if (mapRef.current) {
      mapRef.current.setCenter(userLocation);
      mapRef.current.setZoom(16);

      const nearbyFilter = {
        ...filters,
        showCafes: true,
        showLibraries: true,
        showAcademicBuildings: true
      };

      setFilters(nearbyFilter);
    }
  }, [userLocation, centerOnUserLocation, filters]);

  // Function to apply category-based filtering
  const getFilteredSpots = () => {
    return studySpots.filter(spot => {
      if (!filters.showLibraries && (spot.category === 'library' || spot.category === 'public_library')) return false;
      if (!filters.showCafes && spot.category === 'cafe') return false;
      if (!filters.showAcademicBuildings && spot.category === 'academic_building') return false;
      if (!filters.showStudyHubs && spot.category === 'study_hub') return false;
      if (!filters.showOutdoor && spot.category === 'outdoor') return false;
      if (!filters.showOther && spot.category === 'other') return false;

      if (locationSearch.trim() !== '') {
        const searchTerm = locationSearch.toLowerCase();
        return (
          spot.name.toLowerCase().includes(searchTerm) || 
          spot.description?.toLowerCase().includes(searchTerm) ||
          spot.features?.some(feature => feature.toLowerCase().includes(searchTerm))
        );
      }

      return true;
    });
  };

  // Function to apply filters to groups
  const getFilteredGroups = () => {
    if (!filters.showGroups) return [];

    if (locationSearch.trim() !== '') {
      const searchTerm = locationSearch.toLowerCase();
      return groups.filter(group => 
        group.name?.toLowerCase().includes(searchTerm) || 
        group.topic?.toLowerCase().includes(searchTerm) ||
        group.moduleCode?.toLowerCase().includes(searchTerm)
      );
    }

    return groups;
  };

  // Toggle filter options
  const toggleFilter = (filterName) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  // Toggle map type between roadmap and satellite
  const toggleMapType = () => {
    const newMapType = mapType === 'roadmap' ? 'satellite' : 'roadmap';
    setMapType(newMapType);
    
    // If switching to satellite, ensure labels are visible
    if (newMapType === 'satellite' && !showLabelsInSatellite) {
      setShowLabelsInSatellite(true);
    }
  };

  // Toggle labels visibility in satellite mode
  const toggleLabelsVisibility = () => {
    setShowLabelsInSatellite(!showLabelsInSatellite);
  };

  // Get appropriate icon for a study spot based on its category
  const getSpotIcon = (spot) => {
    return markerIcons[spot.category] || markerIcons.spot;
  };

  // Get color class based on category for list view
  const getCategoryColor = (category) => {
    switch(category) {
      case 'library':
      case 'public_library':
        return 'bg-purple-500';
      case 'cafe':
        return 'bg-yellow-500';
      case 'academic_building':
        return 'bg-orange-500';
      case 'study_hub':
        return 'bg-pink-500';
      case 'outdoor':
        return 'bg-green-500';
      default:
        return 'bg-blue-300';
    }
  };

  // Function to handle marker click with improved reference handling
  const handleMarkerClick = (item, type) => {
    // Close any existing info window
    setSelectedMarker(null);
    
    // Short delay to ensure the previous window is closed first
    setTimeout(() => {
      setSelectedMarker({ ...item, type });
      setActiveInfoWindow(`${type}-${item.id}`);
  
      if (mapRef.current) {
        const position = type === 'spot' 
          ? { lat: item.location.lat, lng: item.location.lng }
          : { lat: item.coordinates.lat, lng: item.coordinates.lng };
  
        mapRef.current.panTo(position);
      }
    }, 50);
  };

  // Function to get the category display name
  const getCategoryDisplayName = (category) => {
    switch(category) {
      case 'library':
        return 'Library';
      case 'public_library':
        return 'Public Library';
      case 'cafe':
        return 'Café';
      case 'academic_building':
        return 'Academic Building';
      case 'study_hub':
        return 'Study Hub';
      case 'outdoor':
        return 'Outdoor Space';
      default:
        return category?.charAt(0).toUpperCase() + category?.slice(1) || 'Study Spot';
    }
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    switch(category) {
      case 'library':
      case 'public_library':
        return <FaBookOpen />;
      case 'cafe':
        return <FaCoffee />;
      case 'academic_building':
        return <FaUniversity />;
      case 'study_hub':
        return <FaBuilding />;
      case 'outdoor':
        return <FaUmbrellaBeach />;
      case 'other':
        return <FaBuilding />;
      default:
        return <FaMapMarkedAlt />;
    }
  };

  // Function to handle map click when in location selection mode
  const handleMapClick = useCallback((event) => {
    if (locationSelectionMode) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      
      setSelectedLocation({ lat, lng });
      
      // Get address using reverse geocoding
      if (window.google && window.google.maps) {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === "OK" && results[0]) {
            setSelectedAddress(results[0].formatted_address);
          } else {
            setSelectedAddress(`Location (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
          }
        });
      } else {
        setSelectedAddress(`Location (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
      }
    }
  }, [locationSelectionMode]);

  // Function to confirm location selection and navigate to group creation
  const confirmLocationSelection = () => {
    if (selectedLocation) {
      // Navigate to group creation with the selected location coordinates and address
      navigate('/groups/create', { 
        state: { 
          location: {
            coordinates: selectedLocation,
            address: selectedAddress
          }
        } 
      });
    }
  };

  // Function to toggle location selection mode
  const toggleLocationSelectionMode = () => {
    setLocationSelectionMode(prev => !prev);
    if (!locationSelectionMode) {
      // Reset any previous selection when entering selection mode
      setSelectedLocation(null);
      setSelectedAddress('');
    }
  };

  // Function to cancel location selection mode
  const cancelLocationSelection = () => {
    setLocationSelectionMode(false);
    setSelectedLocation(null);
    setSelectedAddress('');
  };

  // Function to handle search box load
  const onSearchBoxLoad = (ref) => {
    setSearchBox(ref);
  };

  // Function to handle places changed in search box
  const onPlacesChanged = () => {
    if (searchBox) {
      const places = searchBox.getPlaces();
      if (places && places.length > 0) {
        const place = places[0];
        const location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        };
        
        // If in location selection mode, set the selected location
        if (locationSelectionMode) {
          setSelectedLocation(location);
          setSelectedAddress(place.formatted_address || place.name);
        } else {
          // Otherwise just pan to the location
          if (mapRef.current) {
            mapRef.current.panTo(location);
            mapRef.current.setZoom(16);
          }
        }
        
        // Clear search results
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }
  };

  // Function to search locations by name
  const handleSearchInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.length >= 2) {
      // Search through study spots
      const filteredSpots = allStudyLocations.filter(spot => 
        spot.name.toLowerCase().includes(query.toLowerCase()) ||
        (spot.description && spot.description.toLowerCase().includes(query.toLowerCase())) ||
        (spot.features && spot.features.some(feature => feature.toLowerCase().includes(query.toLowerCase())))
      ).slice(0, 5); // Limit to 5 results
      
      // Search through groups
      const filteredGroups = groups.filter(group => 
        (group.name && group.name.toLowerCase().includes(query.toLowerCase())) ||
        (group.topic && group.topic.toLowerCase().includes(query.toLowerCase()))
      ).slice(0, 3); // Limit to 3 results
      
      setSearchResults([...filteredSpots, ...filteredGroups]);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  // Handle selecting a search result
  const handleSearchResultClick = (result) => {
    setSearchQuery('');
    setShowSearchResults(false);
    
    // If it's a study spot
    if (result.location) {
      if (mapRef.current) {
        mapRef.current.panTo({
          lat: result.location.lat,
          lng: result.location.lng
        });
        mapRef.current.setZoom(17);
      }
      handleMarkerClick(result, 'spot');
    } 
    // If it's a group
    else if (result.coordinates) {
      if (mapRef.current) {
        mapRef.current.panTo({
          lat: result.coordinates.lat,
          lng: result.coordinates.lng
        });
        mapRef.current.setZoom(17);
      }
      handleMarkerClick(result, 'group');
    }
  };

  // Function to geocode an address using Google Maps Geocoder
  const geocodeAddress = useCallback((address) => {
    if (isLoaded && window.google) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address }, (results, status) => {
        if (status === "OK" && results[0]) {
          const location = results[0].geometry.location;
          const lat = location.lat();
          const lng = location.lng();
          
          if (mapRef.current) {
            mapRef.current.panTo({ lat, lng });
            mapRef.current.setZoom(16);
          }
          
          // If in selection mode, also set the selected location
          if (locationSelectionMode) {
            setSelectedLocation({ lat, lng });
            setSelectedAddress(results[0].formatted_address);
          }
        }
      });
    }
  }, [isLoaded, locationSelectionMode]);

  return (
    <div className="relative min-h-screen">
      {/* Location Error Banner - show if there's a location error */}
      {locationError && (
        <div className="fixed top-0 left-0 right-0 bg-red-500 text-white p-2 z-50">
          <div className="container mx-auto flex items-center">
            <FaExclamationTriangle className="mr-2" />
            <p className="flex-1 text-sm">{locationError}</p>
            <button 
              onClick={() => setLocationError(null)} 
              className="text-white hover:text-red-100"
              aria-label="Dismiss"
            >
              <FaTimes />
            </button>
          </div>
        </div>
      )}
      
      {/* Location selection mode banner */}
      {locationSelectionMode && (
        <div className="fixed top-0 left-0 right-0 bg-blue-500 text-white p-2 z-50">
          <div className="container mx-auto flex items-center">
            <div className="mr-2">
              <FaLocationArrow />
            </div>
            <p className="flex-1 text-sm">
              {selectedLocation 
                ? `Selected: ${selectedAddress}` 
                : 'Click on the map to select a location for your study group'}
            </p>
            {selectedLocation ? (
              <div className="flex gap-2">
                <button 
                  onClick={confirmLocationSelection}
                  className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 transition-colors flex items-center gap-1"
                >
                  <FaCheck size={14} />
                  <span>Confirm</span>
                </button>
                <button 
                  onClick={cancelLocationSelection}
                  className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button 
                onClick={cancelLocationSelection}
                className="text-white hover:text-red-100"
                aria-label="Cancel"
              >
                <FaTimes />
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Desktop Layout with Sidebar */}
      <div className="hidden lg:flex h-[calc(100vh-80px)]">
        {/* Sidebar for desktop */}
        <div className="w-96 bg-white dark:bg-ios-dark-elevated border-r border-gray-200 dark:border-ios-dark-border overflow-y-auto p-4">
          <h1 className="text-xl font-bold mb-4 dark:text-ios-dark-text">Study Locations</h1>
          
          {/* Search box */}
          <div className="mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search for study locations..."
                className="w-full px-4 py-2 pl-10 pr-10 bg-white dark:bg-ios-dark-secondary dark:text-ios-dark-text dark:border-ios-dark-border border rounded-md"
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
              />
              {locationSearch && (
                <button 
                  className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-500"
                  onClick={() => setLocationSearch('')}
                >
                  <FaTimes />
                </button>
              )}
            </div>
          </div>
          
          {/* Filters */}
          <div className="mb-6 p-3 bg-gray-50 dark:bg-ios-dark-secondary rounded-lg">
            <h3 className="font-medium mb-2 dark:text-ios-dark-text">Filter Locations</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-1 text-sm dark:text-ios-dark-text">
                <input 
                  type="checkbox" 
                  checked={filters.showGroups} 
                  onChange={() => toggleFilter('showGroups')} 
                />
                <FaUsers className="text-red-500" /> Study Groups
              </label>
              
              <label className="flex items-center gap-1 text-sm dark:text-ios-dark-text">
                <input 
                  type="checkbox" 
                  checked={filters.showLibraries} 
                  onChange={() => toggleFilter('showLibraries')} 
                />
                <FaBookOpen className="text-purple-500" /> Libraries
              </label>
              
              <label className="flex items-center gap-1 text-sm dark:text-ios-dark-text">
                <input 
                  type="checkbox" 
                  checked={filters.showCafes} 
                  onChange={() => toggleFilter('showCafes')} 
                />
                <FaCoffee className="text-yellow-500" /> Cafés
              </label>

              <label className="flex items-center gap-1 text-sm dark:text-ios-dark-text">
                <input 
                  type="checkbox" 
                  checked={filters.showAcademicBuildings} 
                  onChange={() => toggleFilter('showAcademicBuildings')} 
                />
                <FaUniversity className="text-orange-500" /> Academic Buildings
              </label>

              <label className="flex items-center gap-1 text-sm dark:text-ios-dark-text">
                <input 
                  type="checkbox" 
                  checked={filters.showStudyHubs} 
                  onChange={() => toggleFilter('showStudyHubs')} 
                />
                <FaBuilding className="text-pink-500" /> Study Hubs
              </label>

              <label className="flex items-center gap-1 text-sm dark:text-ios-dark-text">
                <input 
                  type="checkbox" 
                  checked={filters.showOutdoor} 
                  onChange={() => toggleFilter('showOutdoor')} 
                />
                <FaUmbrellaBeach className="text-green-500" /> Outdoor Spaces
              </label>
            </div>
          </div>
          
          {/* Location list */}
          <div className="space-y-4">
            {getFilteredSpots().length === 0 && filters.showGroups && getFilteredGroups().length === 0 && (
              <p className="text-center py-4 dark:text-ios-dark-text-secondary">No locations match your filters</p>
            )}
            
            {/* Study Locations */}
            {getFilteredSpots().length > 0 && (
              <div className="mb-4">
                <h3 className="font-medium mb-2 dark:text-ios-dark-text">Study Spaces ({getFilteredSpots().length})</h3>
                <div className="space-y-3">
                  {getFilteredSpots().map(spot => (
                    <div 
                      key={spot.id}
                      className={`bg-white dark:bg-ios-dark-secondary border dark:border-ios-dark-border shadow-sm rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow ${selectedMarker?.id === spot.id ? 'ring-2 ring-blue-500 dark:ring-ios-teal' : ''}`}
                      onClick={() => handleMarkerClick(spot, 'spot')}
                    >
                      <div className="flex items-start">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${getCategoryColor(spot.category)}`}>
                          {getCategoryIcon(spot.category)}
                        </div>
                        
                        <div className="ml-2 flex-1">
                          <h3 className="font-medium dark:text-ios-dark-text text-sm">{spot.name}</h3>
                          <p className="text-xs text-gray-600 dark:text-ios-dark-text-secondary">
                            {getCategoryDisplayName(spot.category)}
                          </p>
                          
                          {spot.features && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {spot.features.slice(0, 2).map((feature, idx) => (
                                <span 
                                  key={idx}
                                  className="text-xs bg-gray-100 dark:bg-ios-dark-elevated dark:text-ios-dark-text-secondary px-1.5 py-0.5 rounded"
                                >
                                  {feature}
                                </span>
                              ))}
                              {spot.features.length > 2 && (
                                <span className="text-xs text-gray-500 dark:text-ios-dark-text-tertiary">
                                  +{spot.features.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Study Groups */}
            {filters.showGroups && getFilteredGroups().length > 0 && (
              <div>
                <h3 className="font-medium mb-2 dark:text-ios-dark-text">Active Groups ({getFilteredGroups().length})</h3>
                <div className="space-y-3">
                  {getFilteredGroups().map(group => (
                    group.coordinates?.lat && group.coordinates?.lng && (
                      <div 
                        key={group.id}
                        className={`bg-white dark:bg-ios-dark-secondary border dark:border-ios-dark-border shadow-sm rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow ${selectedMarker?.id === group.id ? 'ring-2 ring-blue-500 dark:ring-ios-teal' : ''}`}
                        onClick={() => handleMarkerClick(group, 'group')}
                      >
                        <div className="flex items-start">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white bg-red-500">
                            <FaUsers />
                          </div>
                          
                          <div className="ml-2">
                            <h3 className="font-medium dark:text-ios-dark-text text-sm">{group.name}</h3>
                            {group.moduleCode && (
                              <p className="text-xs text-gray-600 dark:text-ios-dark-text-secondary">
                                {group.moduleCode}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Map area - desktop */}
        <div className="flex-1 relative">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={{width: '100%', height: '100%'}}
              center={userLocation || defaultCenter}
              zoom={15}
              options={{
                styles: theme === 'dark' ? darkMapStyle : lightMapStyle,
                fullscreenControl: false,
                mapTypeControl: true,
                mapTypeControlOptions: {
                  style: mapTypeControlStyle.HORIZONTAL_BAR,
                  position: 7, // RIGHT_TOP
                  mapTypeIds: ['roadmap', 'satellite', 'hybrid']
                },
                streetViewControl: true,
                mapTypeId: mapType,
                zoomControl: true,
                zoomControlOptions: {
                  position: 3 // RIGHT_CENTER
                }
              }}
              onLoad={handleMapLoad}
              onClick={handleMapClick}
            >
              {/* Search Box */}
              <div className="absolute top-4 left-4 right-4 w-auto max-w-md z-10">
                <div className="relative">
                  <StandaloneSearchBox
                    onLoad={onSearchBoxLoad}
                    onPlacesChanged={onPlacesChanged}
                  >
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search for locations or study groups..."
                        value={searchQuery}
                        onChange={handleSearchInputChange}
                        className="w-full px-10 py-3 bg-white dark:bg-ios-dark-secondary text-black dark:text-ios-dark-text border border-gray-300 dark:border-ios-dark-border rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-ios-teal"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaSearch className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      </div>
                      {searchQuery && (
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setShowSearchResults(false);
                          }}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                        >
                          <FaTimes className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </StandaloneSearchBox>
                  
                  {/* Search Results Dropdown */}
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-ios-dark-secondary border border-gray-200 dark:border-ios-dark-border rounded-lg shadow-lg overflow-hidden z-20">
                      <div className="max-h-60 overflow-y-auto">
                        {searchResults.map((result, index) => (
                          <div
                            key={result.id || index}
                            className="border-b border-gray-100 dark:border-ios-dark-border last:border-0 hover:bg-blue-50 dark:hover:bg-ios-dark-elevated transition-colors cursor-pointer"
                            onClick={() => handleSearchResultClick(result)}
                          >
                            <div className="p-3">
                              <div className="flex items-center">
                                {/* Icon based on type */}
                                <div className={`mr-3 rounded-full w-8 h-8 flex items-center justify-center ${
                                  result.coordinates 
                                    ? 'bg-red-500' 
                                    : result.category === 'library' || result.category === 'public_library'
                                    ? 'bg-purple-500'
                                    : result.category === 'cafe'
                                    ? 'bg-yellow-500'
                                    : 'bg-blue-500'
                                } text-white`}>
                                  {result.coordinates ? (
                                    <FaUsers size={14} />
                                  ) : result.category === 'library' || result.category === 'public_library' ? (
                                    <FaBookOpen size={14} />
                                  ) : result.category === 'cafe' ? (
                                    <FaCoffee size={14} />
                                  ) : (
                                    <FaMapMarkedAlt size={14} />
                                  )}
                                </div>
                                <div>
                                  <p className="text-gray-900 dark:text-ios-dark-text font-medium">{result.name}</p>
                                  <p className="text-gray-500 dark:text-ios-dark-text-secondary text-sm">
                                    {result.coordinates 
                                      ? result.moduleCode || 'Study Group'
                                      : result.category 
                                        ? getCategoryDisplayName(result.category)
                                        : 'Location'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* User Location Marker */}
              {userLocation && (
                <Marker
                  position={userLocation}
                  icon={{
                    url: markerIcons.user,
                    scaledSize: new window.google.maps.Size(40, 40)
                  }}
                  zIndex={1000}
                />
              )}

              {/* Selected Location Marker for Group Creation */}
              {locationSelectionMode && selectedLocation && (
                <Marker
                  position={selectedLocation}
                  animation={window.google?.maps?.Animation.DROP}
                  icon={{
                    url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
                    scaledSize: new window.google.maps.Size(40, 40)
                  }}
                  zIndex={900}
                />
              )}

              {/* Study Spots Markers with clustering */}
              {!locationSelectionMode && (
                <MarkerClusterer
                  options={{
                    imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
                    minimumClusterSize: 3,
                    gridSize: 50
                  }}
                >
                  {(clusterer) => (
                    <>
                      {/* Study Spots */}
                      {getFilteredSpots().map((spot) => (
                        spot.location?.lat && spot.location?.lng && (
                          <React.Fragment key={spot.id}>
                            <Marker
                              position={{
                                lat: spot.location.lat,
                                lng: spot.location.lng
                              }}
                              icon={{
                                url: getSpotIcon(spot),
                                scaledSize: new window.google.maps.Size(30, 30)
                              }}
                              onClick={() => handleMarkerClick(spot, 'spot')}
                              clusterer={clusterer}
                              zIndex={800}
                            />
                            
                            {/* Add visible labels in satellite mode */}
                            {mapType !== 'roadmap' && showLabelsInSatellite && (
                              <OverlayView
                                position={{
                                  lat: spot.location.lat,
                                  lng: spot.location.lng
                                }}
                                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                                getPixelPositionOffset={(width, height) => ({
                                  x: -(width / 2),
                                  y: -height - 35
                                })}
                              >
                                <div style={markerLabelStyle} className="pointer-events-none">
                                  {spot.name}
                                </div>
                              </OverlayView>
                            )}
                          </React.Fragment>
                        )
                      ))}
                      
                      {/* Group Markers */}
                      {filters.showGroups && getFilteredGroups().map((group) => (
                        group.coordinates?.lat && group.coordinates?.lng && (
                          <React.Fragment key={group.id}>
                            <Marker
                              position={{
                                lat: group.coordinates.lat,
                                lng: group.coordinates.lng
                              }}
                              icon={{
                                url: markerIcons.group,
                                scaledSize: new window.google.maps.Size(30, 30)
                              }}
                              onClick={() => handleMarkerClick(group, 'group')}
                              clusterer={clusterer}
                              zIndex={700}
                            />
                            
                            {/* Add visible labels for groups in satellite mode */}
                            {mapType !== 'roadmap' && showLabelsInSatellite && (
                              <OverlayView
                                position={{
                                  lat: group.coordinates.lat,
                                  lng: group.coordinates.lng
                                }}
                                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                                getPixelPositionOffset={(width, height) => ({
                                  x: -(width / 2),
                                  y: -height - 35
                                })}
                              >
                                <div style={markerLabelStyle} className="pointer-events-none">
                                  {group.name}
                                </div>
                              </OverlayView>
                            )}
                          </React.Fragment>
                        )
                      ))}
                    </>
                  )}
                </MarkerClusterer>
              )}

              {/* Custom Info Window for selected marker - Redesigned for better appearance */}
              {selectedMarker && !locationSelectionMode && (
                <InfoWindow
                  position={
                    selectedMarker.type === 'spot'
                      ? { 
                          lat: selectedMarker.location.lat, 
                          lng: selectedMarker.location.lng 
                        }
                      : { 
                          lat: selectedMarker.coordinates.lat, 
                          lng: selectedMarker.coordinates.lng 
                        }
                  }
                  onCloseClick={() => setSelectedMarker(null)}
                  options={{
                    maxWidth: 320,
                    pixelOffset: new window.google.maps.Size(0, -30),
                    disableAutoPan: false
                  }}
                >
                  <div className="p-3 bg-white dark:bg-ios-dark-secondary rounded-md max-w-xs">
                    {/* InfoWindow Header */}
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-base text-gray-900 dark:text-ios-dark-text">{selectedMarker.name}</h3>
                    </div>
                    
                    {selectedMarker.type === 'spot' ? (
                      <div>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {getCategoryIcon(selectedMarker.category)}
                          <span className="ml-1">{getCategoryDisplayName(selectedMarker.category)}</span>
                        </div>
                        
                        {selectedMarker.description && (
                          <p className="text-sm mt-1 text-gray-700 dark:text-gray-300">{selectedMarker.description}</p>
                        )}
                        
                        {selectedMarker.features && selectedMarker.features.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium mb-1 text-gray-500 dark:text-gray-400">Features:</p>
                            <div className="flex flex-wrap gap-1">
                              {selectedMarker.features.map((feature, idx) => (
                                <span 
                                  key={idx} 
                                  className="text-xs bg-blue-50 text-blue-600 dark:bg-ios-dark-elevated dark:text-ios-teal px-2 py-1 rounded-full"
                                >
                                  {feature}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex justify-center mt-3">
                          <button 
                            onClick={() => {
                              navigate('/groups/create', { 
                                state: { 
                                  location: {
                                    coordinates: {
                                      lat: selectedMarker.location.lat, 
                                      lng: selectedMarker.location.lng
                                    },
                                    address: selectedMarker.name
                                  }
                                } 
                              });
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white w-full px-3 py-2 rounded-md text-sm flex items-center justify-center gap-1 transition-colors"
                          >
                            <FaPlus size={12} />
                            <span>Create Group Here</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center mb-1">
                          <FaUsers className="text-red-500 mr-1" size={14} />
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {selectedMarker.memberCount || 0} member{(selectedMarker.memberCount || 0) > 1 ? 's' : ''}
                          </span>
                        </div>
                        
                        {selectedMarker.moduleCode && (
                          <div className="flex items-center mb-1">
                            <FaBook className="text-blue-500 mr-1" size={14} />
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              {selectedMarker.moduleCode}
                            </span>
                          </div>
                        )}
                        
                        {selectedMarker.location && (
                          <div className="flex items-center mb-1">
                            <FaMapMarkedAlt className="text-green-500 mr-1" size={14} />
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              {selectedMarker.location}
                            </span>
                          </div>
                        )}
                        
                        {selectedMarker.meetingTime && (
                          <div className="flex items-center mb-2">
                            <FaClock className="text-yellow-500 mr-1" size={14} />
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              {selectedMarker.meetingTime}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex justify-center mt-3">
                          <button 
                            onClick={() => navigate(`/groups/${selectedMarker.id}`)}
                            className="bg-blue-500 hover:bg-blue-600 text-white w-full px-3 py-2 rounded-md text-sm transition-colors"
                          >
                            View Group Details
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </InfoWindow>
              )}

              {/* InfoWindow for selected location when in selection mode */}
              {locationSelectionMode && selectedLocation && (
                <InfoWindow
                  position={selectedLocation}
                  onCloseClick={() => {
                    setSelectedLocation(null);
                    setSelectedAddress('');
                  }}
                  options={{
                    maxWidth: 300,
                    pixelOffset: new window.google.maps.Size(0, -30)
                  }}
                >
                  <div className="p-3 bg-white dark:bg-ios-dark-secondary rounded-md max-w-xs">
                    <h3 className="font-medium text-base text-gray-900 dark:text-ios-dark-text">Selected Location</h3>
                    <p className="text-sm mt-1 text-gray-700 dark:text-gray-300">{selectedAddress}</p>
                    <div className="flex justify-center mt-3 gap-2">
                      <button 
                        onClick={confirmLocationSelection}
                        className="bg-green-500 hover:bg-green-600 text-white flex-1 px-3 py-2 rounded-md text-sm flex items-center justify-center gap-1 transition-colors"
                      >
                        <FaCheck size={14} />
                        <span>Create Group Here</span>
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedLocation(null);
                          setSelectedAddress('');
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md text-sm transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-ios-dark-secondary">
              {loadError ? (
                <div className="text-center text-red-500 dark:text-red-400 p-4">
                  <p className="font-medium mb-2">Error loading Google Maps</p>
                  <p className="text-sm">{loadError.message}</p>
                </div>
              ) : (
                <div className="w-10 h-10 border-4 border-blue-500 dark:border-ios-teal border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile Layout */}
      <div className="lg:hidden">
        {/* Mobile Map and Controls */}
        {/* ... similar implementation to desktop but optimized for mobile ... */}
      </div>
      
      {/* Floating Controls - same for both mobile and desktop */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-2">
        {/* Create Group button */}
        <button 
          onClick={toggleLocationSelectionMode}
          className={`${
            locationSelectionMode 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-green-600 dark:bg-ios-green hover:bg-green-700 dark:hover:bg-opacity-90'
          } text-white p-3 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
          aria-label={locationSelectionMode ? 'Cancel location selection' : 'Select location for study group'}
          title={locationSelectionMode ? 'Cancel location selection' : 'Select location for study group'}
        >
          {locationSelectionMode ? <FaTimes className="w-6 h-6" /> : <FaPlus className="w-6 h-6" />}
        </button>

        <button 
          onClick={centerOnUserLocation}
          disabled={loadingLocation}
          className="bg-blue-600 dark:bg-ios-blue text-white p-3 rounded-full shadow-lg hover:bg-blue-700 dark:hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          aria-label="Center on my location"
          title="Center on my location"
        >
          {loadingLocation ? (
            <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <FaLocationArrow className="w-6 h-6" />
          )}
        </button>

        <button 
          onClick={toggleMapType}
          className="bg-blue-600 dark:bg-ios-blue text-white p-3 rounded-full shadow-lg hover:bg-blue-700 dark:hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          aria-label={mapType === 'roadmap' ? 'Switch to satellite view' : 'Switch to map view'}
          title={mapType === 'roadmap' ? 'Switch to satellite view' : 'Switch to map view'}
        >
          {mapType === 'roadmap' ? (
            <FaSatellite className="w-6 h-6" />
          ) : (
            <FaMap className="w-6 h-6" />
          )}
        </button>
        
        <button 
          onClick={findNearbySpots}
          className="bg-green-600 dark:bg-ios-green text-white p-3 rounded-full shadow-lg hover:bg-green-700 dark:hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          aria-label="Find nearby locations"
          title="Find nearby study locations"
        >
          <FaFilter className="w-6 h-6" />
        </button>
        
        <button 
          onClick={() => setShowLocationsList(prev => !prev)} 
          className="bg-gray-100 dark:bg-ios-dark-secondary text-gray-800 dark:text-ios-dark-text p-3 rounded-full shadow-lg hover:bg-gray-200 dark:hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 lg:hidden"
          aria-label="Show locations list"
          title="Show locations list"
        >
          <FaList className="w-6 h-6" />
        </button>
        
        <button 
          onClick={() => setShowInfoModal(true)}
          className="bg-gray-100 dark:bg-ios-dark-secondary text-gray-800 dark:text-ios-dark-text p-3 rounded-full shadow-lg hover:bg-gray-200 dark:hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          aria-label="Show info"
          title="Show information"
        >
          <FaInfoCircle className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}

export default MapView;










