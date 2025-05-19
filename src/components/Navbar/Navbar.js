import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ref, onValue, get } from 'firebase/database';
import { database } from '../../firebase';
import { FaBell } from 'react-icons/fa';
import { toast } from 'react-toastify';

function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!currentUser) return;

    // Listen for join requests in user's groups
    const userGroupsRef = ref(database, `groups`);
    const unsubscribe = onValue(userGroupsRef, async (snapshot) => {
      if (snapshot.exists()) {
        const groups = snapshot.val();
        const userGroups = Object.entries(groups).filter(([_, group]) => 
          group.members && group.members[currentUser.uid]?.role === 'admin'
        );

        const allNotifications = [];
        let unread = 0;

        // Check each group for join requests
        for (const [groupId, group] of userGroups) {
          if (group.joinRequests) {
            const requests = Object.entries(group.joinRequests)
              .filter(([_, request]) => request.status === 'pending')
              .map(([requestId, request]) => ({
                id: requestId,
                type: 'join_request',
                groupId,
                groupName: group.name,
                userName: request.userName,
                message: request.message,
                timestamp: request.timestamp,
                read: false
              }));
            allNotifications.push(...requests);
            unread += requests.length;
          }
        }

        // Check for user's own join requests
        const userRequestsRef = ref(database, `groups`);
        const userRequestsSnapshot = await get(userRequestsRef);
        if (userRequestsSnapshot.exists()) {
          const groups = userRequestsSnapshot.val();
          Object.entries(groups).forEach(([groupId, group]) => {
            if (group.joinRequests) {
              const userRequest = Object.entries(group.joinRequests)
                .find(([_, request]) => request.userId === currentUser.uid);
              
              if (userRequest) {
                const [requestId, request] = userRequest;
                if (request.status === 'accepted' || request.status === 'declined') {
                  allNotifications.push({
                    id: requestId,
                    type: 'request_response',
                    groupId,
                    groupName: group.name,
                    status: request.status,
                    timestamp: request.respondedAt || request.timestamp,
                    read: false
                  });
                  unread++;
                }
              }
            }
          });
        }

        // Sort notifications by timestamp
        allNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setNotifications(allNotifications);
        setUnreadCount(unread);
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleNotificationClick = (notification) => {
    // Mark as read
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    // Navigate based on notification type
    if (notification.type === 'join_request') {
      navigate(`/groups/${notification.groupId}`);
    } else if (notification.type === 'request_response') {
      navigate(`/groups/${notification.groupId}`);
      if (notification.status === 'accepted') {
        toast.success(`Your request to join ${notification.groupName} was accepted!`);
      } else {
        toast.error(`Your request to join ${notification.groupName} was declined.`);
      }
    }
  };

  return (
    <nav className="bg-white dark:bg-ios-dark-elevated shadow-sm dark:shadow-md border-b border-ios-gray5 dark:border-ios-dark-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex items-center">
              <span className="text-ios-large-title font-sf-pro text-black dark:text-white">
                StudyGroup
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {currentUser ? (
              <>
                {/* Notification Bell */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="ios-button dark:bg-ios-teal dark:hover:bg-teal-700 transition-colors rounded-full p-2"
                  >
                    <FaBell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-ios-dark-elevated rounded-xl shadow-lg border border-ios-gray5 dark:border-ios-dark-border z-50">
                      <div className="p-4 border-b border-ios-gray5 dark:border-ios-dark-border">
                        <h3 className="text-ios-headline font-medium dark:text-white">Notifications</h3>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map(notification => (
                            <button
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification)}
                              className={`w-full text-left p-4 border-b border-ios-gray5 dark:border-ios-dark-border hover:bg-ios-gray6 dark:hover:bg-ios-dark-secondary transition-colors ${
                                !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                              }`}
                            >
                              {notification.type === 'join_request' ? (
                                <div>
                                  <p className="text-ios-body font-medium dark:text-white">
                                    New join request for {notification.groupName}
                                  </p>
                                  <p className="text-ios-footnote text-ios-gray dark:text-gray-400 mt-1">
                                    From: {notification.userName}
                                  </p>
                                  {notification.message && (
                                    <p className="text-ios-footnote text-ios-gray dark:text-gray-400 mt-1">
                                      "{notification.message}"
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <div>
                                  <p className="text-ios-body font-medium dark:text-white">
                                    Your request to join {notification.groupName} was {notification.status}
                                  </p>
                                </div>
                              )}
                              <p className="text-ios-caption text-ios-gray dark:text-gray-500 mt-1">
                                {new Date(notification.timestamp).toLocaleString()}
                              </p>
                            </button>
                          ))
                        ) : (
                          <div className="p-4 text-center text-ios-gray dark:text-gray-400">
                            No notifications
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Link
                  to="/profile"
                  className="ios-button dark:bg-ios-teal dark:hover:bg-teal-700 transition-colors"
                >
                  Profile
                </Link>
                <button
                  onClick={logout}
                  className="ios-button-outline"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="ios-button dark:bg-ios-teal dark:hover:bg-teal-700 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="ios-button-outline"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar; 