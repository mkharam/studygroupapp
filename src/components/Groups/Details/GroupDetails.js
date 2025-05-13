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

const mapContainerStyle = {
  height: "100%",
  width: "100%"
};

// Custom marker options for Google Maps
const markerOptions = {
  icon: {
    url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
    scaledSize: { width: 40, height: 40 }
  }
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
      
      // Changed from messages/${groupId} to chats/${groupId}
      const messagesRef = ref(database, `chats/${groupId}`);
      await push(messagesRef, messageData);
      
      setJoiningGroup(false);
    } catch (error) {
      console.error('Error joining group:', error);
      setError('Failed to join group. Please try again.');
      setJoiningGroup(false);
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
                    {joiningGroup ? 'Joining...' : (group.memberCount >= group.maxMembers ? 'Group Full' : 'Join Group')}
                  </button>
                )
              )}
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
                {loadError && (
                  <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                    <p className="text-red-500 dark:text-red-400">Error loading map: {loadError.message}</p>
                  </div>
                )}
                
                {!isLoaded ? (
                  <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                    <svg className="animate-spin h-8 w-8 text-ios-blue dark:text-ios-teal" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                ) : (
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={{ lat: group.coordinates.lat, lng: group.coordinates.lng }}
                    zoom={15}
                    options={{ 
                      fullscreenControl: false,
                      mapTypeId: window.google?.maps?.MapTypeId.ROADMAP
                    }}
                  >
                    <Marker
                      position={{ lat: group.coordinates.lat, lng: group.coordinates.lng }}
                      icon={window.google?.maps ? {
                        url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
                        scaledSize: new window.google.maps.Size(40, 40)
                      } : undefined}
                    >
                      <InfoWindow position={{ lat: group.coordinates.lat, lng: group.coordinates.lng }}>
                        <div className="text-center">
                          <strong>{group.name}</strong>
                          {group.location && <p>{group.location}</p>}
                          {group.meetingTime && <p>Meeting at: {group.meetingTime}</p>}
                        </div>
                      </InfoWindow>
                    </Marker>
                  </GoogleMap>
                )}
              </div>
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
            </div>
          )}
          
          {/* Group Discussion */}
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
            {currentUser && userIsMember() ? (
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
            ) : currentUser ? (
              <div className="p-4 text-center border-t border-ios-gray5 dark:border-ios-dark-border">
                <p className="dark:text-gray-300">Join this group to participate in the discussion</p>
                <button
                  onClick={handleJoinGroup}
                  disabled={joiningGroup || group.memberCount >= group.maxMembers}
                  className={`ios-button mt-2 dark:bg-ios-teal dark:hover:bg-teal-700 transition-colors ${group.memberCount >= group.maxMembers ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {joiningGroup ? 'Joining...' : (group.memberCount >= group.maxMembers ? 'Group Full' : 'Join Group')}
                </button>
              </div>
            ) : (
              <div className="p-4 text-center border-t border-ios-gray5 dark:border-ios-dark-border">
                <p className="dark:text-gray-300">Log in to participate in group discussions</p>
                <button
                  onClick={() => navigate('/login', { state: { from: { pathname: `/groups/${groupId}` } } })}
                  className="ios-button mt-2 dark:bg-ios-teal dark:hover:bg-teal-700 transition-colors"
                >
                  Log In
                </button>
              </div>
            )}
          </div>
          
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
    </div>
  );
}

export default GroupDetails;