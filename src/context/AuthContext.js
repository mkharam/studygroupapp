import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { ref, get, set, update } from 'firebase/database';
import { auth, database } from '../firebase';

// Create auth context
const AuthContext = createContext();

// Hook to use the auth context
export function useAuth() {
  return useContext(AuthContext);
}

// Auth provider component
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Register a new user
  const register = async (email, password, name, faculty = '', department = '') => {
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      await updateProfile(userCredential.user, {
        displayName: name
      });
      
      // Create user profile in database
      const userRef = ref(database, `users/${userCredential.user.uid}`);
      await set(userRef, {
        name: name,
        email: email,
        faculty: faculty,
        department: department,
        createdAt: new Date().toISOString()
      });
      
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  };
  
  // Login existing user
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  };
  
  // Logout user
  const logout = () => {
    return signOut(auth);
  };
  
  // Update user profile
  const updateUserProfile = async (profileData) => {
    try {
      if (!currentUser) throw new Error('No authenticated user');
      
      // Ensure we have a valid uid string
      if (!currentUser.uid || typeof currentUser.uid !== 'string') {
        console.error('Invalid user ID:', currentUser);
        throw new Error('Invalid user ID format');
      }
      
      // Update in database
      const userRef = ref(database, `users/${currentUser.uid}`);
      await update(userRef, {
        ...profileData,
        updatedAt: new Date().toISOString()
      });
      
      // Refresh user profile data
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        setUserProfile(snapshot.val());
      }
      
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setLoading(false); // Ensure loading state is updated

      if (user) {
        try {
          const userRef = ref(database, `users/${user.uid}`);
          const snapshot = await get(userRef);
          if (snapshot.exists()) {
            setUserProfile(snapshot.val());
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        setUserProfile(null);
      }
    });

    return unsubscribe;
  }, []);

  // Context value
  const value = {
    currentUser,
    userProfile,
    loading,
    register,
    login,
    logout,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children} {/* Ensure children are rendered only after loading is complete */}
    </AuthContext.Provider>
  );
}