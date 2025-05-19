import React from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';

/**
 * A simplified map view component for displaying in smaller containers
 * like dashboards or sidebars
 */
const SmallMapView = ({ 
  center = { lat: 51.242, lng: -0.589 }, // Default to University of Surrey
  zoom = 15,
  height = '200px',
  markers = [],
  onMarkerClick = () => {},
  mapType = 'roadmap'
}) => {
  const mapContainerStyle = {
    width: '100%',
    height: height,
    borderRadius: '8px',
    overflow: 'hidden'
  };

  const mapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    styles: document.documentElement.classList.contains('dark') ? [
      {
        featureType: 'all',
        elementType: 'all',
        stylers: [
          { invert_lightness: true },
          { saturation: 10 },
          { lightness: 30 },
          { gamma: 0.5 },
          { hue: '#4357B2' }
        ]
      }
    ] : []
  };

  return (
    <div className="small-map-container">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={zoom}
        options={mapOptions}
        mapTypeId={mapType}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            onClick={() => onMarkerClick(marker)}
            icon={{
              url: marker.icon || 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
              scaledSize: new window.google.maps.Size(32, 32)
            }}
          />
        ))}
      </GoogleMap>
    </div>
  );
};

export default SmallMapView;
