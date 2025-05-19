import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ref, onValue, set, push, get, update, remove } from 'firebase/database';
import { database } from '../../../firebase';
import { useAuth } from '../../../context/AuthContext';
import { useGoogleMaps } from '../../../context/GoogleMapsContext';
import { 
  GoogleMap, 
  Marker, 
  InfoWindow 
} from '@react-google-maps/api';
import { toast } from 'react-toastify';
import { FaTrash, FaCog, FaBell, FaCheck, FaTimes, FaUserPlus } from 'react-icons/fa';

const mapContainerStyle = {
  height: "100%",
  width: "100%"
};

const defaultCenter = {
  lat: 1.3521, // Default to Singapore
  lng: 103.8198
};

const mapOptions = {
  fullscreenControl: false,
  mapTypeControl: false,
  streetViewControl: false,
  zoomControl: true,
  gestureHandling: 'cooperative'
};

function GroupDetails() {
  const { groupId } = useParams();
  const { currentUser, userProfile } = useAuth();
  const { isLoaded, loadError } = useGoogleMaps();
  const navigate = useNavigate();
  
  // State for group data
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [module, setModule] = useState(null);
  const [joiningGroup, setJoiningGroup] = useState(false);
  const [leavingGroup, setLeavingGroup] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRequestMessageModal, setShowRequestMessageModal] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);
  const [joinRequests, setJoinRequests] = useState([]);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [hasNewRequests, setHasNewRequests] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // References
  const messagesEndRef = useRef(null);
  
  // Fetch group data
  useEffect(() => {
    const fetchGroup = () => {
      try {
        // Reference to the group data
        const groupRef = ref(database, `groups/${groupId}`);
        
        // Listen for real-time updates
        const unsubscribe = onValue(groupRef, async (snapshot) => {
          if (snapshot.exists()) {
            const groupData = snapshot.val();
            
            // Add id to group data
            setGroup({
              id: groupId,
              ...groupData
            });
            
            // Fetch module data
            if (groupData.moduleCode) {
              const moduleRef = ref(database, `modules/${groupData.moduleCode}`);
              const moduleSnapshot = await get(moduleRef);
              
              if (moduleSnapshot.exists()) {
                setModule({
                  code: groupData.moduleCode,
                  ...moduleSnapshot.val()
                });
              }
            }
            
            setLoading(false);
          } else {
            setError('Study group not found');
            setLoading(false);
          }
        }, (error) => {
          console.error('Error fetching group:', error);
          setError('Failed to load study group. Please try again.');
          setLoading(false);
        });
        
        return () => unsubscribe();
      } catch (error) {
        console.error('Error in fetchGroup:', error);
        setError('Failed to load study group. Please try again.');
        setLoading(false);
      }
    };
    
    if (groupId) {
      fetchGroup();
    }
  }, [groupId]);
  
  // Fetch messages
  useEffect(() => {
    if (!groupId) return;
    
    // Changed from `messages/${groupId}` to `chats/${groupId}` to match the path used in send message
    const messagesRef = ref(database, `chats/${groupId}`);
    
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      try {
        if (snapshot.exists()) {
          const messagesData = snapshot.val();
          
          // Convert to array and add IDs
          const messagesArray = Object.entries(messagesData).map(([id, message]) => ({
            id,
            ...message
          }));
          
          // Sort by timestamp (oldest first)
          messagesArray.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          
          setMessages(messagesArray);
        } else {
          setMessages([]);
        }
      } catch (error) {
        console.error('Error processing messages:', error);
      }
    });
    
    return () => unsubscribe();
  }, [groupId]);
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Check if user is a member
  const userIsMember = () => {
    return (
      group?.members && 
      currentUser && 
      Object.keys(group.members).includes(currentUser.uid)
    );
  };
  
  // Check if user is admin
  const userIsAdmin = () => {
    return (
      group?.members && 
      currentUser && 
      group.members[currentUser.uid]?.role === 'admin'
    );
  };
  
  // Join group handler
  const handleJoinGroup = async () => {
    if (!currentUser) {
      navigate('/login', { state: { from: { pathname: `/groups/${groupId}` } } });
      return;
    }
    
    try {
      setJoiningGroup(true);
      
      // Check if group is full
      if (group.memberCount >= group.maxMembers) {
        setError('This group is already full');
        setJoiningGroup(false);
        return;
      }

      // Check if group is private
      if (group.isPrivate === true) {
        setShowRequestMessageModal(true);
        setJoiningGroup(false);
        return;
      }
      
      // Add user to members
      const memberData = {
        role: 'member',
        joinedAt: new Date().toISOString(),
        name: userProfile?.name || currentUser.displayName || 'User'
      };
      
      // Update the group data
      const memberPath = `groups/${groupId}/members/${currentUser.uid}`;
      await set(ref(database, memberPath), memberData);
      
      // Update member count
      await update(ref(database, `groups/${groupId}`), {
        memberCount: (group.memberCount || 0) + 1,
        updatedAt: new Date().toISOString()
      });
      
      // Add system message
      const messageData = {
        type: 'system',
        content: `${userProfile?.name || currentUser.displayName || 'A new user'} joined the group.`,
        timestamp: new Date().toISOString()
      };
      
      const messagesRef = ref(database, `chats/${groupId}`);
      await push(messagesRef, messageData);
      
      setJoiningGroup(false);
    } catch (error) {
      console.error('Error joining group:', error);
      setError('Failed to join group. Please try again.');
      setJoiningGroup(false);
    }
  };
  
  // Add the request message modal
  const handleSendJoinRequest = async () => {
    if (!requestMessage.trim()) {
      toast.error('Please enter a message with your request');
      return;
    }

    try {
      setSendingRequest(true);
      
      // Check if user already has a pending request
      const existingRequestRef = ref(database, `groups/${groupId}/joinRequests`);
      const existingRequestSnapshot = await get(existingRequestRef);
      
      if (existingRequestSnapshot.exists()) {
        const requests = existingRequestSnapshot.val();
        const userRequest = Object.values(requests).find(
          request => request.userId === currentUser.uid && request.status === 'pending'
        );
        
        if (userRequest) {
          toast.error('You already have a pending request to join this group');
          setSendingRequest(false);
          return;
        }
      }
      
      const requestData = {
        userId: currentUser.uid,
        userName: userProfile?.name || currentUser.displayName || 'User',
        message: requestMessage.trim(),
        status: 'pending',
        timestamp: new Date().toISOString()
      };

      // Add the request to the database
      const newRequestRef = await push(ref(database, `groups/${groupId}/joinRequests`), requestData);
      
      // Close the modal and show success message
      setShowRequestMessageModal(false);
      setRequestMessage('');
      toast.success('Join request sent successfully! The group admin will review your request.');

      // Add a system message to notify admins
      const messageData = {
        type: 'system',
        content: `New join request from ${requestData.userName}`,
        timestamp: new Date().toISOString(),
        requestId: newRequestRef.key
      };

      const messagesRef = ref(database, `chats/${groupId}`);
      await push(messagesRef, messageData);

    } catch (error) {
      console.error('Error sending join request:', error);
      toast.error('Failed to send join request. Please try again.');
    } finally {
      setSendingRequest(false);
    }
  };
  
  // Leave group handler
  const handleLeaveGroup = async () => {
    if (!currentUser || !userIsMember()) return;
    
    try {
      setLeavingGroup(true);
      
      // If user is the last admin, prevent leaving
      if (userIsAdmin()) {
        const adminCount = Object.values(group.members).filter(
          member => member.role === 'admin'
        ).length;
        
        if (adminCount <= 1) {
          setError("You're the last admin. Please make someone else an admin first or delete the group.");
          setLeavingGroup(false);
          return;
        }
      }
      
      // Remove user from members
      const memberPath = `groups/${groupId}/members/${currentUser.uid}`;
      await remove(ref(database, memberPath));
      
      // Update member count
      await update(ref(database, `groups/${groupId}`), {
        memberCount: Math.max(0, (group.memberCount || 0) - 1),
        updatedAt: new Date().toISOString()
      });
      
      // Add system message
      const messageData = {
        type: 'system',
        content: `${userProfile?.name || currentUser.displayName || 'A user'} left the group.`,
        timestamp: new Date().toISOString()
      };
      
      // Changed from messages/${groupId} to chats/${groupId}
      const messagesRef = ref(database, `chats/${groupId}`);
      await push(messagesRef, messageData);
      
      setLeavingGroup(false);
    } catch (error) {
      console.error('Error leaving group:', error);
      setError('Failed to leave group. Please try again.');
      setLeavingGroup(false);
    }
  };
  
  // Send message handler
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !currentUser) {
      return;
    }
    
    // Verify user is a member before attempting to send a message
    if (!userIsMember()) {
      toast.error('You must be a member of this group to send messages');
      return;
    }
    
    try {
      setSendingMessage(true);
      
      // Create message data
      const messageData = {
        type: 'user',
        content: newMessage.trim(),
        timestamp: new Date().toISOString(),
        userId: currentUser.uid,
        userName: userProfile?.name || currentUser.displayName || 'User'
      };
      
      // Add message to database
      const messagesRef = ref(database, `chats/${groupId}`);
      
      // Double-check membership by querying the database directly
      const memberRef = ref(database, `groups/${groupId}/members/${currentUser.uid}`);
      const memberSnapshot = await get(memberRef);
      
      if (!memberSnapshot.exists()) {
        throw new Error('You are not a member of this group');
      }
      
      await push(messagesRef, messageData);
      
      // Update group last activity
      await update(ref(database, `groups/${groupId}`), {
        lastActivity: new Date().toISOString()
      });
      
      // Clear input
      setNewMessage('');
      setSendingMessage(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(`Failed to send message: ${error.message}`);
      setSendingMessage(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Format time for messages
  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Add delete group handler
  const handleDeleteGroup = async () => {
    if (!userIsAdmin()) return;
    
    try {
      setIsDeleting(true);
      
      // Delete group data
      await remove(ref(database, `groups/${groupId}`));
      
      // Delete group chat
      await remove(ref(database, `chats/${groupId}`));
      
      // Navigate back to groups list
      navigate('/groups');
    } catch (error) {
      console.error('Error deleting group:', error);
      setError('Failed to delete group. Please try again.');
      setIsDeleting(false);
    }
  };

  // Add this after the existing useEffect hooks
  useEffect(() => {
    if (!groupId || !userIsAdmin()) return;

    const requestsRef = ref(database, `groups/${groupId}/joinRequests`);
    const unsubscribe = onValue(requestsRef, (snapshot) => {
      if (snapshot.exists()) {
        const requests = Object.entries(snapshot.val()).map(([id, request]) => ({
          id,
          ...request
        }));
        const pendingRequests = requests.filter(request => request.status === 'pending');
        setJoinRequests(pendingRequests);
        
        // Set notification state if there are new requests
        if (pendingRequests.length > 0) {
          setHasNewRequests(true);
          // Show notification if modal is not open
          if (!showRequestsModal) {
            toast.info(`${pendingRequests.length} new join request${pendingRequests.length > 1 ? 's' : ''}`, {
              position: "bottom-right",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            });
          }
        }
      } else {
        setJoinRequests([]);
        setHasNewRequests(false);
      }
    });

    return () => unsubscribe();
  }, [groupId, userIsAdmin(), showRequestsModal]);

  // Add these new handlers
  const handleAcceptRequest = async (requestId, userId) => {
    try {
      const request = joinRequests.find(r => r.id === requestId);
      if (!request) return;

      // Add user to members
      const memberData = {
        role: 'member',
        joinedAt: new Date().toISOString(),
        name: request.userName || 'User'
      };

      // Update the group data
      const memberPath = `groups/${groupId}/members/${userId}`;
      await set(ref(database, memberPath), memberData);

      // Update member count
      await update(ref(database, `groups/${groupId}`), {
        memberCount: (group.memberCount || 0) + 1,
        updatedAt: new Date().toISOString()
      });

      // Update request status
      await update(ref(database, `groups/${groupId}/joinRequests/${requestId}`), {
        status: 'accepted',
        respondedAt: new Date().toISOString()
      });

      // Add system message
      const messageData = {
        type: 'system',
        content: `${memberData.name} joined the group.`,
        timestamp: new Date().toISOString()
      };

      const messagesRef = ref(database, `chats/${groupId}`);
      await push(messagesRef, messageData);

      toast.success('Request accepted successfully');
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error('Failed to accept request');
    }
  };

  const handleDeclineRequest = async (requestId) => {
    try {
      const request = joinRequests.find(r => r.id === requestId);
      if (!request) return;

      await update(ref(database, `groups/${groupId}/joinRequests/${requestId}`), {
        status: 'declined',
        respondedAt: new Date().toISOString()
      });

      // Add system message
      const messageData = {
        type: 'system',
        content: `Join request from ${request.userName} was declined.`,
        timestamp: new Date().toISOString()
      };

      const messagesRef = ref(database, `chats/${groupId}`);
      await push(messagesRef, messageData);

      toast.success('Request declined');
    } catch (error) {
      console.error('Error declining request:', error);
      toast.error('Failed to decline request');
    }
  };

  // Add this function to handle map load
  const onMapLoad = React.useCallback((map) => {
    setMapLoaded(true);
    setMapError(null);
  }, []);

  // Add this function to handle map error
  const onMapError = React.useCallback((error) => {
    console.error('Map error:', error);
    setMapError('Failed to load map');
  }, []);

  return (
    <div className="min-h-screen bg-ios-gray6 dark:bg-ios-dark-bg text-black dark:text-white transition-colors duration-200">
      {/* Error message */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900 dark:bg-opacity-30 border border-red-200 dark:border-red-800 text-ios-red dark:text-red-300 p-3 mb-4 mx-4 mt-4 rounded-ios">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="h-screen flex items-center justify-center">
          <svg className="animate-spin h-8 w-8 text-ios-blue dark:text-ios-teal" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : group ? (
        <div className="p-4 max-w-3xl mx-auto">
          {/* Back button */}
          <div className="mb-4">
            <Link to="/groups" className="text-ios-blue dark:text-ios-teal flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Back to Groups
            </Link>
          </div>
          
          {/* Group header */}
          <div className="bg-white dark:bg-ios-dark-elevated ios-card shadow-sm dark:shadow-md p-4 mb-4 rounded-xl border border-ios-gray5 dark:border-ios-dark-border transition-colors">
            <div className="flex justify-between">
              <div>
                <h1 className="text-ios-large-title font-sf-pro text-black dark:text-white transition-colors">{group.name}</h1>
                {group.topic && <p className="text-ios-subhead text-ios-gray dark:text-gray-400 mt-1 transition-colors">"{group.topic}"</p>}
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Delete button for admins */}
                {userIsAdmin() && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="ios-button-destructive dark:bg-red-700 dark:hover:bg-red-800 transition-colors flex items-center"
                    disabled={isDeleting}
                  >
                    <FaTrash className="mr-2" />
                    {isDeleting ? 'Deleting...' : 'Delete Group'}
                  </button>
                )}
                
                {/* Join/Leave button */}
                {currentUser && (
                  userIsMember() ? (
                    <button
                      onClick={handleLeaveGroup}
                      disabled={leavingGroup}
                      className="ios-button-destructive dark:bg-red-700 dark:hover:bg-red-800 transition-colors"
                    >
                      {leavingGroup ? 'Leaving...' : 'Leave Group'}
                    </button>
                  ) : (
                    <button
                      onClick={handleJoinGroup}
                      disabled={joiningGroup || group.memberCount >= group.maxMembers}
                      className={`ios-button ${group.memberCount >= group.maxMembers ? 'opacity-50 cursor-not-allowed' : ''} dark:bg-ios-teal dark:hover:bg-teal-700 transition-colors`}
                    >
                      {joiningGroup ? 'Joining...' : (
                        group.memberCount >= group.maxMembers ? 'Group Full' : 
                        group.isPrivate === true ? 'Request to Join' : 'Join Group'
                      )}
                    </button>
                  )
                )}
              </div>
            </div>
            
            {/* Module info */}
            {group.moduleCode && (
              <div className="mt-3 text-ios-headline font-medium dark:text-gray-200 transition-colors">
                {group.moduleCode}
                {module && `: ${module.title}`}
              </div>
            )}
            
            {/* Stats */}
            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 text-ios-subhead text-ios-gray dark:text-gray-400 transition-colors">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span>
                  {group.memberCount} / {group.maxMembers} members
                </span>
              </div>
              
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Created {formatDate(group.createdAt)}</span>
              </div>
              
              {group.meetingTime && (
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{group.meetingTime}</span>
                </div>
              )}
              
              {group.location && (
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{group.location}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Add this after the group header section and before the group description */}
          {userIsAdmin() && (
            <div className="fixed bottom-4 right-4 z-40">
              <div className="relative">
                <button
                  onClick={() => {
                    setShowRequestsModal(true);
                    setHasNewRequests(false);
                  }}
                  className={`ios-button dark:bg-ios-teal dark:hover:bg-teal-700 transition-colors rounded-full p-3 shadow-lg ${
                    hasNewRequests ? 'animate-bounce' : ''
                  }`}
                >
                  <FaBell className="h-6 w-6" />
                  {joinRequests.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {joinRequests.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}
          
          {/* Group Description */}
          <div className="bg-white dark:bg-ios-dark-elevated ios-card shadow-sm dark:shadow-md p-4 mb-4 rounded-xl border border-ios-gray5 dark:border-ios-dark-border transition-colors">
            <h2 className="text-ios-headline font-medium mb-2 dark:text-white">About this Group</h2>
            <p className="text-ios-body whitespace-pre-wrap dark:text-gray-300">{group.description}</p>
          </div>
          
          {/* Location Map */}
          {group.coordinates && (
            <div className="bg-white dark:bg-ios-dark-elevated ios-card shadow-sm dark:shadow-md p-4 mb-4 rounded-xl border border-ios-gray5 dark:border-ios-dark-border transition-colors">
              <h2 className="text-ios-headline font-medium mb-2 dark:text-white">Meeting Location</h2>
              <div className="mt-2 rounded-ios overflow-hidden border border-ios-gray5 dark:border-ios-dark-border" style={{ height: "250px" }}>
                {loadError ? (
                  <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                    <p className="text-red-500 dark:text-red-400">Error loading map: {loadError.message}</p>
                  </div>
                ) : !isLoaded ? (
                  <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                    <svg className="animate-spin h-8 w-8 text-ios-blue dark:text-ios-teal" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                ) : (
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={group.coordinates || defaultCenter}
                    zoom={15}
                    options={mapOptions}
                    onLoad={onMapLoad}
                    onError={onMapError}
                  >
                    {mapLoaded && !mapError && group.coordinates && (
                      <Marker
                        position={group.coordinates}
                        animation={window.google?.maps?.Animation?.DROP}
                      >
                        <InfoWindow>
                          <div className="text-center p-2">
                            <strong className="text-ios-body font-medium">{group.name}</strong>
                            {group.location && (
                              <p className="text-ios-footnote text-ios-gray dark:text-gray-400 mt-1">
                                {group.location}
                              </p>
                            )}
                            {group.meetingTime && (
                              <p className="text-ios-footnote text-ios-gray dark:text-gray-400">
                                Meeting at: {group.meetingTime}
                              </p>
                            )}
                          </div>
                        </InfoWindow>
                      </Marker>
                    )}
                  </GoogleMap>
                )}
              </div>
              {group.coordinates && (
                <div className="mt-2">
                  <Link 
                    to={`/map?lat=${group.coordinates.lat}&lng=${group.coordinates.lng}&groupId=${group.id}`} 
                    className="text-ios-blue dark:text-ios-teal text-ios-subhead font-semibold flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    View on Full Map
                  </Link>
                </div>
              )}
            </div>
          )}
          
          {/* Group Discussion - Only show to members */}
          {userIsMember() ? (
            <div className="bg-white dark:bg-ios-dark-elevated ios-card shadow-sm dark:shadow-md rounded-xl border border-ios-gray5 dark:border-ios-dark-border mb-4 transition-colors">
              <h2 className="text-ios-headline font-medium p-4 border-b border-ios-gray5 dark:border-ios-dark-border dark:text-white">Group Discussion</h2>
              
              {/* Messages */}
              <div className="max-h-96 overflow-y-auto p-4 space-y-3">
                {messages.length > 0 ? (
                  messages.map(message => (
                    <div
                      key={message.id}
                      className={`${
                        message.type === 'system'
                          ? 'text-center text-ios-gray dark:text-gray-400 italic text-ios-footnote py-1'
                          : message.userId === currentUser?.uid
                          ? 'flex flex-col items-end'
                          : 'flex flex-col items-start'
                      }`}
                    >
                      {message.type === 'system' ? (
                        <span>{message.content}</span>
                      ) : (
                        <>
                          <div className="flex items-center mb-1">
                            <span className="text-ios-footnote text-ios-gray dark:text-gray-400">
                              {message.userId === currentUser?.uid ? 'You' : message.userName}
                            </span>
                            <span className="text-ios-caption text-ios-gray dark:text-gray-500 ml-2">
                              {formatMessageTime(message.timestamp)}
                            </span>
                          </div>
                          <div
                            className={`max-w-xs sm:max-w-sm rounded-ios py-2 px-3 ${
                              message.userId === currentUser?.uid
                                ? 'bg-ios-blue dark:bg-teal-700 text-white rounded-tr-none'
                                : 'bg-ios-gray5 dark:bg-gray-700 dark:text-white rounded-tl-none'
                            }`}
                          >
                            <p className="text-ios-body whitespace-pre-wrap">{message.content}</p>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center text-ios-gray dark:text-gray-400 py-8">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Message Input */}
              <div className="p-3 border-t border-ios-gray5 dark:border-ios-dark-border">
                <form onSubmit={handleSendMessage} className="flex items-center">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="ios-input flex-1 mr-2 dark:bg-ios-dark-secondary dark:border-ios-dark-border dark:text-white"
                    disabled={sendingMessage}
                  />
                  <button
                    type="submit"
                    className="ios-button dark:bg-ios-teal dark:hover:bg-teal-700 transition-colors"
                    disabled={!newMessage.trim() || sendingMessage}
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-ios-dark-elevated ios-card shadow-sm dark:shadow-md rounded-xl border border-ios-gray5 dark:border-ios-dark-border mb-4 transition-colors p-4">
              <div className="text-center">
                <h2 className="text-ios-headline font-medium mb-2 dark:text-white">Private Discussion</h2>
                <p className="text-ios-body text-ios-gray dark:text-gray-400 mb-4">
                  Join this group to view and participate in the discussion
                </p>
                {currentUser ? (
                  <button
                    onClick={handleJoinGroup}
                    disabled={joiningGroup || group.memberCount >= group.maxMembers}
                    className={`ios-button ${group.memberCount >= group.maxMembers ? 'opacity-50 cursor-not-allowed' : ''} dark:bg-ios-teal dark:hover:bg-teal-700 transition-colors`}
                  >
                    {joiningGroup ? 'Joining...' : (
                      group.memberCount >= group.maxMembers ? 'Group Full' : 
                      group.isPrivate === true ? 'Request to Join' : 'Join Group'
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/login', { state: { from: { pathname: `/groups/${groupId}` } } })}
                    className="ios-button dark:bg-ios-teal dark:hover:bg-teal-700 transition-colors"
                  >
                    Log In to Join
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* Members list */}
          <div className="bg-white dark:bg-ios-dark-elevated ios-card shadow-sm dark:shadow-md p-4 mb-4 rounded-xl border border-ios-gray5 dark:border-ios-dark-border transition-colors">
            <h2 className="text-ios-headline font-medium mb-3 dark:text-white">Members ({group.memberCount || 0})</h2>
            <div className="space-y-3">
              {group.members && Object.entries(group.members).map(([userId, member]) => (
                <div key={userId} className="flex items-center justify-between p-2 rounded-lg hover:bg-ios-gray6 dark:hover:bg-ios-dark-secondary transition-colors">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-400 dark:from-teal-500 dark:to-blue-600 rounded-full flex items-center justify-center text-white font-medium mr-3">
                      {member.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="flex items-center">
                        <span className="text-ios-body font-medium dark:text-white">{member.name || 'Unknown User'}</span>
                        {member.role === 'admin' && (
                          <span className="ml-2 bg-ios-gray5 dark:bg-gray-700 text-ios-gray dark:text-gray-300 text-ios-caption px-2 py-0.5 rounded-full">Admin</span>
                        )}
                        {userId === currentUser?.uid && (
                          <span className="ml-2 text-ios-blue dark:text-ios-teal text-ios-caption">(You)</span>
                        )}
                      </div>
                      <div className="text-ios-footnote text-ios-gray dark:text-gray-400">
                        Joined {formatDate(member.joinedAt)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 text-center">
          <p className="dark:text-white">Study group not found</p>
          <Link to="/groups" className="ios-button mt-4 dark:bg-ios-teal dark:hover:bg-teal-700 transition-colors">
            Back to Groups
          </Link>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-ios-dark-elevated p-6 rounded-xl max-w-md w-full mx-4">
            <h3 className="text-ios-headline font-medium mb-4 dark:text-white">Delete Group</h3>
            <p className="text-ios-body text-ios-gray dark:text-gray-400 mb-6">
              Are you sure you want to delete this group? This action cannot be undone and all group data, including messages, will be permanently deleted.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="ios-button-outline"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteGroup}
                className="ios-button-destructive dark:bg-red-700 dark:hover:bg-red-800"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Group'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Requests Modal */}
      {showRequestsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-ios-dark-elevated p-6 rounded-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-ios-headline font-medium dark:text-white">Join Requests</h3>
              <button
                onClick={() => setShowRequestsModal(false)}
                className="text-ios-gray dark:text-gray-400 hover:text-ios-blue dark:hover:text-ios-teal"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {joinRequests.length > 0 ? (
                joinRequests.map(request => (
                  <div key={request.id} className="border-b border-ios-gray5 dark:border-ios-dark-border pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium dark:text-white">{request.userName}</p>
                        <p className="text-ios-footnote text-ios-gray dark:text-gray-400">
                          Requested {formatDate(request.timestamp)}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAcceptRequest(request.id, request.userId)}
                          className="ios-button dark:bg-ios-teal dark:hover:bg-teal-700 transition-colors flex items-center"
                        >
                          <FaCheck className="mr-1" />
                          Accept
                        </button>
                        <button
                          onClick={() => handleDeclineRequest(request.id)}
                          className="ios-button-destructive dark:bg-red-700 dark:hover:bg-red-800 transition-colors flex items-center"
                        >
                          <FaTimes className="mr-1" />
                          Decline
                        </button>
                      </div>
                    </div>
                    {request.message && (
                      <p className="text-ios-body text-ios-gray dark:text-gray-400 mt-2">
                        "{request.message}"
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-ios-gray dark:text-gray-400">
                  <FaBell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No pending join requests</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Request Message Modal */}
      {showRequestMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-ios-dark-elevated p-6 rounded-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-ios-headline font-medium dark:text-white">Request to Join</h3>
              <button
                onClick={() => setShowRequestMessageModal(false)}
                className="text-ios-gray dark:text-gray-400 hover:text-ios-blue dark:hover:text-ios-teal"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-ios-body text-ios-gray dark:text-gray-400 mb-2">
                Why do you want to join this group?
              </label>
              <textarea
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                placeholder="Tell the group admin why you want to join..."
                className="ios-input w-full h-32 dark:bg-ios-dark-secondary dark:border-ios-dark-border dark:text-white"
                disabled={sendingRequest}
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRequestMessageModal(false)}
                className="ios-button-outline"
                disabled={sendingRequest}
              >
                Cancel
              </button>
              <button
                onClick={handleSendJoinRequest}
                className="ios-button dark:bg-ios-teal dark:hover:bg-teal-700 transition-colors flex items-center"
                disabled={sendingRequest || !requestMessage.trim()}
              >
                <FaUserPlus className="mr-2" />
                {sendingRequest ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add notification bell for users */}
      {currentUser && !userIsAdmin() && (
        <div className="fixed bottom-4 right-4 z-40">
          <div className="relative">
            <button
              onClick={() => {
                // Check for pending requests
                const userRequestsRef = ref(database, `groups/${groupId}/joinRequests`);
                get(userRequestsRef).then((snapshot) => {
                  if (snapshot.exists()) {
                    const requests = snapshot.val();
                    const userRequest = Object.values(requests).find(
                      request => request.userId === currentUser.uid
                    );
                    if (userRequest) {
                      if (userRequest.status === 'pending') {
                        toast.info('Your join request is still pending review');
                      } else if (userRequest.status === 'accepted') {
                        toast.success('Your join request was accepted!');
                      } else if (userRequest.status === 'declined') {
                        toast.error('Your join request was declined');
                      }
                    }
                  }
                });
              }}
              className="ios-button dark:bg-ios-teal dark:hover:bg-teal-700 transition-colors rounded-full p-3 shadow-lg"
            >
              <FaBell className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default GroupDetails;