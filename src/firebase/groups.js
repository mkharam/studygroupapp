import { ref, get, set, push, update } from 'firebase/database';
import { database } from './index';

// Fetch groups for a specific module
export const fetchGroupsByModule = async (moduleCode) => {
  try {
    const groupsRef = ref(database, 'groups');
    const snapshot = await get(groupsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const groups = [];
    snapshot.forEach((childSnapshot) => {
      const group = childSnapshot.val();
      if (group.moduleCode === moduleCode) {
        groups.push({
          id: childSnapshot.key,
          ...group
        });
      }
    });
    
    return groups;
  } catch (error) {
    console.error('Error fetching groups:', error);
    throw error;
  }
};

// Join a study group
export const joinGroup = async (groupId) => {
  try {
    const groupRef = ref(database, `groups/${groupId}`);
    const snapshot = await get(groupRef);
    
    if (!snapshot.exists()) {
      throw new Error('Group not found');
    }
    
    const group = snapshot.val();
    const memberCount = group.memberCount || 0;
    
    // Update member count
    await update(groupRef, {
      memberCount: memberCount + 1
    });
    
    return true;
  } catch (error) {
    console.error('Error joining group:', error);
    throw error;
  }
}; 