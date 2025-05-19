// Custom marker icons for different categories
export const getMarkerIconForCategory = (category) => {
  const baseUrl = 'https://maps.google.com/mapfiles/ms/icons/';
  
  switch (category.toLowerCase()) {
    case 'library':
      return `${baseUrl}blue-dot.png`;
    case 'cafe':
      return `${baseUrl}green-dot.png`;
    case 'academic building':
      return `${baseUrl}purple-dot.png`;
    case 'study room':
      return `${baseUrl}yellow-dot.png`;
    case 'computer lab':
      return `${baseUrl}orange-dot.png`;
    case 'outdoor':
      return `${baseUrl}ltblue-dot.png`;
    default:
      return `${baseUrl}blue-dot.png`;
  }
};

// Custom marker options for different states
export const getMarkerOptions = (type, isSelected = false) => {
  if (!window.google || !window.google.maps) return null;
  
  const baseSize = isSelected ? 40 : 32;
  
  return {
    url: getMarkerIconForCategory(type),
    scaledSize: new window.google.maps.Size(baseSize, baseSize),
    animation: isSelected ? window.google.maps.Animation.BOUNCE : null
  };
};

// Custom marker styles for dark mode
export const getDarkModeMarkerStyle = () => {
  if (!window.google || !window.google.maps) return null;
  
  return {
    path: window.google.maps.SymbolPath.CIRCLE,
    scale: 8,
    fillColor: "#4B5563",
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 2,
  };
};

// Custom marker styles for user location
export const getUserLocationMarkerStyle = () => {
  if (!window.google || !window.google.maps) return null;
  
  return {
    path: window.google.maps.SymbolPath.CIRCLE,
    scale: 10,
    fillColor: "#4285F4",
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 2,
  };
}; 