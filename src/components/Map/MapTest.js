import React from 'react';
import { GoogleMap, LoadScript } from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = 'AIzaSyA6Tx4cbx7PVbUcVMDm-ETHRro0pinTAQw';

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const center = {
  lat: 51.242, 
  lng: -0.589
};

function MapTest() {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={15}
        >
          {/* Add controls and markers here as needed */}
        </GoogleMap>
      </LoadScript>
    </div>
  );
}

export default MapTest;