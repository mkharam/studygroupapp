// Sample data for testing Firebase integration
// Import this file and call loadTestData() in development to populate test data

import { ref, set, update } from "firebase/database";
import { database } from "./firebase";

export const testStudySpots = [
  {
    id: "spot1",
    name: "University Library",
    category: "Library",
    description: "Main university library with quiet study spaces",
    features: ["Quiet", "Wi-Fi", "Power outlets", "Computers"],
    rating: 4.8,
    location: {
      lat: 51.242,
      lng: -0.589
    }
  },
  {
    id: "spot2",
    name: "The Hive Coffee Shop",
    category: "Cafe",
    description: "Cozy coffee shop with good Wi-Fi and plenty of seating",
    features: ["Food", "Wi-Fi", "Coffee", "Group tables"],
    rating: 4.6,
    location: {
      lat: 51.243,
      lng: -0.587
    }
  },
  {
    id: "spot3",
    name: "PATS Building",
    category: "Academic Building",
    description: "Computer science building with many open labs",
    features: ["Computers", "Quiet", "24/7 Access"],
    rating: 4.5,
    location: {
      lat: 51.244,
      lng: -0.590
    }
  }
];

export const testModules = {
  "COM1001": {
    name: "Programming Fundamentals",
    department: "Computer Science",
    description: "Introduction to programming concepts using Python"
  },
  "COM1002": {
    name: "Data Structures and Algorithms",
    department: "Computer Science",
    description: "Fundamental algorithms and data structures"
  },
  "COM2001": {
    name: "Web Application Development",
    department: "Computer Science",
    description: "Development of modern web applications and services"
  },
  "BUS1001": {
    name: "Introduction to Business",
    department: "Business School",
    description: "Foundational business concepts and principles"
  }
};

// Function to load test data into Firebase
export const loadTestData = async (userId) => {
  if (!userId) {
    console.error("No user ID provided for test data");
    return false;
  }
  
  try {
    // Load study spots
    for (const spot of testStudySpots) {
      await set(ref(database, `studySpots/${spot.id}`), {
        name: spot.name,
        category: spot.category,
        description: spot.description,
        features: spot.features,
        rating: spot.rating,
        location: spot.location
      });
    }
    console.log("Study spots test data loaded");
    
    // Load modules
    await set(ref(database, 'modules'), testModules);
    console.log("Modules test data loaded");
    
    // Set user favorites
    await update(ref(database, `users/${userId}/modules`), {
      "COM1001": {
        enrolled: true,
        favorite: true
      },
      "COM1002": {
        enrolled: true,
        favorite: true
      },
      "COM2001": {
        enrolled: true,
        favorite: false
      },
      "BUS1001": {
        enrolled: true,
        favorite: false
      }
    });
    console.log("User modules test data loaded");
    
    return true;
  } catch (error) {
    console.error("Error loading test data:", error);
    return false;
  }
};

// Usage example: 
// import { loadTestData } from './firebase-test';
// loadTestData(currentUser.uid);