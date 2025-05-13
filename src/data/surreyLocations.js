// Surrey University study locations data
// This file contains study locations for the University of Surrey campus

export const allStudyLocations = [
  // Libraries
  {
    id: 'lib-1',
    name: 'Library (Main Building)',
    category: 'library',
    description: 'The main university library with multiple floors of study spaces',
    location: { lat: 51.2433, lng: -0.5892 },  // Accurate coordinates for Surrey University Library
    features: ['Quiet study', 'Group spaces', 'Computers', 'Printers', 'Wifi', 'Accessible'],
    openingHours: '24/7 during exam period, 8am-10pm otherwise',
    popularTimes: {
      morning: 'Medium',
      afternoon: 'High',
      evening: 'High'
    },
    noise: 'Quiet',
    powerOutlets: 'Plenty',
    capacity: 'Large'
  },
  {
    id: 'lib-2',
    name: 'Library Learning Centre',
    category: 'library',
    description: 'Dedicated learning center with various study spaces',
    location: { lat: 51.2430, lng: -0.5894 },  // Accurate coordinates for Library Learning Centre
    features: ['Group study', 'Bookable rooms', 'Computers', 'Whiteboards', 'Wifi', 'Accessible'],
    openingHours: '8am-10pm',
    popularTimes: {
      morning: 'Low',
      afternoon: 'High',
      evening: 'Medium'
    },
    noise: 'Low to Medium',
    powerOutlets: 'Plenty',
    capacity: 'Medium'
  },

  // Academic Buildings
  {
    id: 'ac-1',
    name: 'Lecture Theatre Building',
    category: 'academic_building',
    description: 'Open study areas near lecture theatres',
    location: { lat: 51.2422, lng: -0.5906 },  // Accurate coordinates for Lecture Theatre Building
    features: ['Open spaces', 'Limited computers', 'Wifi', 'Accessible'],
    openingHours: '7am-9pm',
    popularTimes: {
      morning: 'Medium',
      afternoon: 'High',
      evening: 'Low'
    },
    noise: 'Medium',
    powerOutlets: 'Limited',
    capacity: 'Medium'
  },
  {
    id: 'ac-2',
    name: 'Stag Hill - PATS Building',
    category: 'academic_building',
    description: 'Arts and humanities building with study areas',
    location: { lat: 51.2418, lng: -0.5928 },  // Accurate coordinates for PATS Building
    features: ['Open spaces', 'Quiet corners', 'Wifi', 'Accessible'],
    openingHours: '8am-6pm',
    popularTimes: {
      morning: 'Low',
      afternoon: 'Medium',
      evening: 'Low'
    },
    noise: 'Low',
    powerOutlets: 'Some',
    capacity: 'Small'
  },
  {
    id: 'ac-3',
    name: 'School of Computer Science',
    category: 'academic_building',
    description: 'Computer labs and study spaces for computing students',
    location: { lat: 51.2427, lng: -0.5912 },  // Accurate coordinates for School of Computer Science
    features: ['Computer labs', 'Specialized software', 'Wifi', 'Accessible'],
    openingHours: '8am-10pm',
    popularTimes: {
      morning: 'Medium',
      afternoon: 'High',
      evening: 'Medium'
    },
    noise: 'Low to Medium',
    powerOutlets: 'Plenty',
    capacity: 'Medium'
  },
  {
    id: 'ac-4',
    name: 'Business School',
    category: 'academic_building',
    description: 'Modern facilities with plenty of study spaces',
    location: { lat: 51.2425, lng: -0.5890 },  // Updated coordinates for Business School
    features: ['Group study', 'Quiet areas', 'Computers', 'Wifi', 'Accessible'],
    openingHours: '8am-8pm',
    popularTimes: {
      morning: 'Medium',
      afternoon: 'High',
      evening: 'Medium'
    },
    noise: 'Low',
    powerOutlets: 'Many',
    capacity: 'Large'
  },
  {
    id: 'ac-5',
    name: 'Engineering Building',
    category: 'academic_building',
    description: 'Labs and study spaces for engineering students',
    location: { lat: 51.2428, lng: -0.5918 },  // Accurate coordinates for Engineering Building
    features: ['Labs', 'Technical equipment', 'Wifi', 'Accessible'],
    openingHours: '8am-8pm',
    popularTimes: {
      morning: 'Medium',
      afternoon: 'High',
      evening: 'Low'
    },
    noise: 'Medium',
    powerOutlets: 'Many',
    capacity: 'Medium'
  },

  // Cafes
  {
    id: 'cafe-1',
    name: 'Lakeside Coffee',
    category: 'cafe',
    description: 'Relaxed cafe environment with lake views',
    location: { lat: 51.2413, lng: -0.5878 },  // Accurate coordinates for Lakeside Coffee
    features: ['Coffee', 'Food', 'Wifi', 'Lake views', 'Outdoor seating'],
    openingHours: '8am-6pm',
    popularTimes: {
      morning: 'High',
      afternoon: 'Medium',
      evening: 'Low'
    },
    noise: 'Medium to High',
    powerOutlets: 'Limited',
    capacity: 'Small'
  },
  {
    id: 'cafe-2',
    name: 'Student Union Café',
    category: 'cafe',
    description: 'Busy cafe in the heart of student activity',
    location: { lat: 51.2422, lng: -0.5887 },  // Accurate coordinates for Student Union Café
    features: ['Coffee', 'Food', 'Wifi', 'Events', 'Accessible'],
    openingHours: '8am-8pm',
    popularTimes: {
      morning: 'Medium',
      afternoon: 'High',
      evening: 'Medium'
    },
    noise: 'High',
    powerOutlets: 'Some',
    capacity: 'Medium'
  },
  {
    id: 'cafe-3',
    name: 'Hillside Coffee',
    category: 'cafe',
    description: 'Quiet cafe with good study atmosphere',
    location: { lat: 51.2430, lng: -0.5892 },  // Accurate coordinates for Hillside Coffee
    features: ['Coffee', 'Snacks', 'Wifi', 'Quiet', 'Accessible'],
    openingHours: '8am-7pm',
    popularTimes: {
      morning: 'Medium',
      afternoon: 'Medium',
      evening: 'Low'
    },
    noise: 'Low',
    powerOutlets: 'Many',
    capacity: 'Small'
  },

  // Outdoor Spaces
  {
    id: 'out-1',
    name: 'Lake Study Area',
    category: 'outdoor',
    description: 'Beautiful outdoor seating area near the lake',
    location: { lat: 51.2408, lng: -0.5875 },  // Accurate coordinates for Lake Study Area
    features: ['Outdoor seating', 'Lake views', 'Wifi coverage', 'Natural setting'],
    openingHours: '24/7 (weather dependent)',
    popularTimes: {
      morning: 'Low',
      afternoon: 'High',
      evening: 'Low'
    },
    noise: 'Medium',
    powerOutlets: 'None',
    capacity: 'Medium'
  },

  // Add more Surrey campus locations as needed
  {
    id: 'out-2',
    name: 'Thomas Telford Garden',
    category: 'outdoor',
    description: 'Peaceful garden area with benches and tables',
    location: { lat: 51.2427, lng: -0.5901 },  // Accurate coordinates for campus garden
    features: ['Outdoor seating', 'Green space', 'Wifi coverage', 'Natural setting'],
    openingHours: '24/7 (weather dependent)',
    popularTimes: {
      morning: 'Low',
      afternoon: 'Medium',
      evening: 'Low'
    },
    noise: 'Low',
    powerOutlets: 'None',
    capacity: 'Small'
  },
  {
    id: 'com-1',
    name: 'Innovation for Health Building',
    category: 'academic_building',
    description: 'State-of-the-art research facility with student study spaces',
    location: { lat: 51.2415, lng: -0.5908 },  // Accurate coordinates for Innovation for Health
    features: ['Modern spaces', 'Research facilities', 'Wifi', 'Accessible'],
    openingHours: '8am-6pm',
    popularTimes: {
      morning: 'Medium',
      afternoon: 'Medium',
      evening: 'Low'
    },
    noise: 'Low',
    powerOutlets: 'Many',
    capacity: 'Medium'
  }
];

// Categorized locations for easier filtering
export const libraryLocations = allStudyLocations.filter(spot => spot.category === 'library');
export const academicLocations = allStudyLocations.filter(spot => spot.category === 'academic_building');
export const cafeLocations = allStudyLocations.filter(spot => spot.category === 'cafe');
export const outdoorLocations = allStudyLocations.filter(spot => spot.category === 'outdoor');

// Helper functions
export const getLocationById = (id) => allStudyLocations.find(spot => spot.id === id);

export const getLocationsByFeature = (feature) => {
  return allStudyLocations.filter(spot => 
    spot.features && spot.features.some(f => 
      f.toLowerCase().includes(feature.toLowerCase())
    )
  );
};

export const getQuietLocations = () => {
  return allStudyLocations.filter(spot => 
    spot.noise && (spot.noise.toLowerCase().includes('quiet') || spot.noise.toLowerCase().includes('low'))
  );
};

export const getLocationsWithPower = () => {
  return allStudyLocations.filter(spot => 
    spot.powerOutlets && 
    (spot.powerOutlets.toLowerCase().includes('plenty') || 
     spot.powerOutlets.toLowerCase().includes('many'))
  );
};

export default allStudyLocations;