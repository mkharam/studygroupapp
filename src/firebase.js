// Firebase SDK imports
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase, ref as dbRef, query, orderByChild, equalTo, get, set, push, update, remove } from "firebase/database";
import { getStorage, ref, getDownloadURL } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBRqVlH7N81a2houYO9WZogzwOVolgFHSE",
    authDomain: "study-group-app-surrey.firebaseapp.com",
    databaseURL: "https://study-group-app-surrey-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "study-group-app-surrey",
    storageBucket: "study-group-app-surrey.firebasestorage.app",
    messagingSenderId: "816725330083",
    appId: "1:816725330083:web:59fc84e0010d61bbad1716",
    measurementId: "G-1PVPVPKYW9"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);

export const fetchMajors = async () => {
  const majorsRef = ref(storage, 'majors.json');
  const url = await getDownloadURL(majorsRef);
  const response = await fetch(url);
  return response.json();
};

export const fetchModules = async () => {
  const modulesRef = ref(storage, 'modules.json');
  const url = await getDownloadURL(modulesRef);
  const response = await fetch(url);
  return response.json();
};

export const fetchGroupsByModule = async (moduleCode) => {
  try {
    if (!moduleCode) {
      console.error('No module code provided to fetchGroupsByModule');
      return [];
    }

    const groupsRef = dbRef(database, 'groups');
    const moduleQuery = query(groupsRef, orderByChild('moduleCode'), equalTo(moduleCode));
    
    const snapshot = await get(moduleQuery);
    
    if (snapshot.exists()) {
      const groupsData = snapshot.val();
      // Convert to array and add ID to each group
      const groupsArray = Object.entries(groupsData).map(([id, group]) => ({
        id,
        ...group,
      }));
      return groupsArray;
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error fetching groups by module:', error);
    throw new Error('Failed to fetch groups for this module');
  }
};

// Fetch all groups
export const fetchAllGroups = async () => {
  try {
    const groupsRef = dbRef(database, 'groups');
    const snapshot = await get(groupsRef);
    
    if (snapshot.exists()) {
      const groupsData = snapshot.val();
      // Convert to array and add ID to each group
      const groupsArray = Object.entries(groupsData).map(([id, group]) => ({
        id,
        ...group,
        memberCount: group.members ? Object.keys(group.members).length : 0
      }));
      
      // Sort by creation date (newest first)
      groupsArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      return groupsArray;
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error fetching all groups:', error);
    throw new Error('Failed to fetch groups');
  }
};

// Fetch a single group by ID
export const fetchGroupById = async (groupId) => {
  try {
    if (!groupId) {
      throw new Error('No group ID provided');
    }
    
    const groupRef = dbRef(database, `groups/${groupId}`);
    const snapshot = await get(groupRef);
    
    if (snapshot.exists()) {
      const groupData = snapshot.val();
      return {
        id: groupId,
        ...groupData
      };
    } else {
      throw new Error('Study group not found');
    }
  } catch (error) {
    console.error('Error fetching group details:', error);
    throw new Error('Failed to fetch group details');
  }
};

// Join a group
export const joinGroup = async (groupId, userId, userData) => {
  try {
    if (!groupId || !userId) {
      throw new Error('Group ID and user ID are required');
    }
    
    // First check if the group exists and is not full
    const groupRef = dbRef(database, `groups/${groupId}`);
    const groupSnapshot = await get(groupRef);
    
    if (!groupSnapshot.exists()) {
      throw new Error('Study group not found');
    }
    
    const groupData = groupSnapshot.val();
    if (groupData.memberCount >= groupData.maxMembers) {
      throw new Error('This group is already full');
    }
    
    // Add user as a member
    const memberData = {
      role: 'member',
      joinedAt: new Date().toISOString(),
      ...userData
    };
    
    // Update the group data
    const memberPath = `groups/${groupId}/members/${userId}`;
    await set(dbRef(database, memberPath), memberData);
    
    // Update member count
    await update(dbRef(database, `groups/${groupId}`), {
      memberCount: (groupData.memberCount || 0) + 1,
      updatedAt: new Date().toISOString()
    });
    
    // Add system message
    const messageData = {
      type: 'system',
      content: `${userData.name || 'A new user'} joined the group.`,
      timestamp: new Date().toISOString()
    };
    
    const messagesRef = dbRef(database, `chats/${groupId}`);
    await push(messagesRef, messageData);
    
    return true;
  } catch (error) {
    console.error('Error joining group:', error);
    throw error;
  }
};

// Leave a group
export const leaveGroup = async (groupId, userId, userName) => {
  try {
    if (!groupId || !userId) {
      throw new Error('Group ID and user ID are required');
    }
    
    // Check if the group exists
    const groupRef = dbRef(database, `groups/${groupId}`);
    const groupSnapshot = await get(groupRef);
    
    if (!groupSnapshot.exists()) {
      throw new Error('Study group not found');
    }
    
    const groupData = groupSnapshot.val();
    
    // Check if user is a member
    if (!groupData.members || !groupData.members[userId]) {
      throw new Error('You are not a member of this group');
    }
    
    // Check if user is the last admin
    if (groupData.members[userId].role === 'admin') {
      const adminCount = Object.values(groupData.members).filter(
        member => member.role === 'admin'
      ).length;
      
      if (adminCount <= 1) {
        throw new Error("You're the last admin. Please make someone else an admin first or delete the group.");
      }
    }
    
    // Remove user from members
    const memberPath = `groups/${groupId}/members/${userId}`;
    await remove(dbRef(database, memberPath));
    
    // Update member count
    await update(dbRef(database, `groups/${groupId}`), {
      memberCount: Math.max(0, (groupData.memberCount || 0) - 1),
      updatedAt: new Date().toISOString()
    });
    
    // Add system message
    const messageData = {
      type: 'system',
      content: `${userName || 'A user'} left the group.`,
      timestamp: new Date().toISOString()
    };
    
    const messagesRef = dbRef(database, `chats/${groupId}`);
    await push(messagesRef, messageData);
    
    return true;
  } catch (error) {
    console.error('Error leaving group:', error);
    throw error;
  }
};

// Delete a group
export const deleteGroup = async (groupId, userId) => {
  try {
    if (!groupId || !userId) {
      throw new Error('Group ID and user ID are required');
    }
    
    // Check if the group exists
    const groupRef = dbRef(database, `groups/${groupId}`);
    const groupSnapshot = await get(groupRef);
    
    if (!groupSnapshot.exists()) {
      throw new Error('Study group not found');
    }
    
    const groupData = groupSnapshot.val();
    
    // Check if user is an admin
    if (!groupData.members || 
        !groupData.members[userId] || 
        groupData.members[userId].role !== 'admin') {
      throw new Error('Only group admins can delete the group');
    }
    
    // Delete the group data
    await remove(dbRef(database, `groups/${groupId}`));
    
    // Also delete associated chat messages
    await remove(dbRef(database, `chats/${groupId}`));
    
    return true;
  } catch (error) {
    console.error('Error deleting group:', error);
    throw error;
  }
};

export { app, auth, database, storage };