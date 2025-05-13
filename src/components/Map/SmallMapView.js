import React, { useEffect, useRef } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { useGoogleMaps } from '../../context/GoogleMapsContext';
import { useTheme } from '../../context/ThemeContext';

// Default center for Surrey University
const defaultCenter = {
  lat: 51.242,
  lng: -0.589,
};

const markerIcons = {
  spot: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
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

// Light mode basic styling
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

const SmallMapView = ({ spots = [], height = "200px" }) => {
  const { isLoaded, loadError } = useGoogleMaps();
  const { theme } = useTheme();
  const mapRef = useRef(null);

  const containerStyle = {
    width: '100%',
    height: height,
    borderRadius: '8px',
    overflow: 'hidden'
  };

  // Center the map to show all markers when the spots change
  useEffect(() => {
    if (isLoaded && mapRef.current && spots.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      
      spots.forEach(spot => {
        if (spot.location?.lat && spot.location?.lng) {
          bounds.extend({
            lat: spot.location.lat,
            lng: spot.location.lng
          });
        }
      });
      
      // Only adjust bounds if we have valid locations
      if (!bounds.isEmpty()) {
        mapRef.current.fitBounds(bounds);
        
        // If we only have one marker, zoom in a bit
        if (spots.length === 1) {
          mapRef.current.setZoom(16);
        }
      }
    }
  }, [isLoaded, spots]);

  const onMapLoad = (map) => {
    mapRef.current = map;
  };

  if (!isLoaded) {
    return (
      <div style={containerStyle} className="bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={containerStyle} className="bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <p className="text-red-500">Error loading map</p>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={spots.length > 0 && spots[0].location ? 
        { lat: spots[0].location.lat, lng: spots[0].location.lng } : 
        defaultCenter
      }
      zoom={14}
      options={{
        styles: theme === 'dark' ? darkMapStyle : lightMapStyle,
        fullscreenControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        zoomControl: true,
        zoomControlOptions: {
          position: 7 // RIGHT_TOP
        },
        scrollwheel: false,
        disableDoubleClickZoom: true,
        clickableIcons: false
      }}
      onLoad={onMapLoad}
    >
      {spots.map((spot) => (
        spot.location?.lat && spot.location?.lng && (
          <Marker
            key={spot.id}
            position={{
              lat: spot.location.lat,
              lng: spot.location.lng
            }}
            icon={{
              url: markerIcons.spot,
              scaledSize: isLoaded ? new window.google.maps.Size(30, 30) : null
            }}
            title={spot.name}
          />
        )
      ))}
    </GoogleMap>
  );
};

export default SmallMapView;