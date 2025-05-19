import React, { useState, useEffect, useRef } from 'react';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import { handleError } from '../../../utils/errorHandler';

const ChatBox = ({ groupId }) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const messagesEndRef = useRef(null);
  const db = getFirestore();
  
  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Load and subscribe to messages
  useEffect(() => {
    if (!groupId) return;
    
    setLoading(true);
    const messagesRef = collection(db, 'groups', groupId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const messageData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMessages(messageData);
        setLoading(false);
      },
      (err) => {
        handleError(err, "Error fetching messages", setError);
        setLoading(false);
      }
    );
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [groupId, db]);
  
  // Send new message
  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !currentUser) return;
    
    try {
      const messagesRef = collection(db, 'groups', groupId, 'messages');
      await addDoc(messagesRef, {
        text: newMessage.trim(),
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Anonymous User',
        userPhotoURL: currentUser.photoURL || null,
        timestamp: serverTimestamp()
      });
      
      setNewMessage('');
    } catch (err) {
      handleError(err, "Error sending message", setError);
    }
  };
  
  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return '';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };
  
  // Group messages by date
  const groupMessagesByDate = (messages) => {
    const groups = {};
    
    messages.forEach(message => {
      if (!message.timestamp) return;
      
      const date = message.timestamp.toDate().toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  };

  const messagesByDate = groupMessagesByDate(messages);
  
  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm">
      {/* Chat header */}
      <div className="py-3 px-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800">Group Chat</h3>
      </div>
      
      {/* Messages area */}
      <div className="flex-1 p-4 overflow-y-auto" style={{ maxHeight: '400px' }}>
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="ios-loading-spinner"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-4">
            {error}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            No messages yet. Be the first to start the conversation!
          </div>
        ) : (
          Object.entries(messagesByDate).map(([date, msgs]) => (
            <div key={date} className="mb-4">
              <div className="flex justify-center mb-3">
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {new Date(date).toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              </div>
              
              {msgs.map(message => {
                const isCurrentUser = message.userId === currentUser?.uid;
                
                return (
                  <div 
                    key={message.id} 
                    className={`mb-3 flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isCurrentUser && (
                      <div className="flex-shrink-0 mr-2">
                        {message.userPhotoURL ? (
                          <img 
                            src={message.userPhotoURL} 
                            alt={message.userName} 
                            className="h-8 w-8 rounded-full"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-ios-blue flex items-center justify-center text-white font-medium">
                            {message.userName?.[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className={`max-w-[70%]`}>
                      {!isCurrentUser && (
                        <div className="text-xs text-gray-600 ml-1 mb-1">{message.userName}</div>
                      )}
                      
                      <div className={`px-3 py-2 rounded-lg ${
                        isCurrentUser 
                          ? 'bg-ios-blue text-white rounded-tr-none' 
                          : 'bg-gray-100 text-gray-800 rounded-tl-none'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                      </div>
                      
                      <div className={`text-xs text-gray-500 mt-1 ${isCurrentUser ? 'text-right mr-1' : 'ml-1'}`}>
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message input */}
      <form onSubmit={sendMessage} className="border-t border-gray-200 p-3">
        <div className="flex items-end">
          <div className="flex-grow">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-ios-blue focus:border-ios-blue resize-none"
              rows="2"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e);
                }
              }}
            />
            <div className="text-xs text-gray-500 mt-1">Press Enter to send, Shift+Enter for new line</div>
          </div>
          <button 
            type="submit" 
            className="ml-2 mb-1 px-4 py-2 bg-ios-blue text-white rounded-lg hover:bg-blue-600 focus:outline-none disabled:opacity-50"
            disabled={!newMessage.trim()}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatBox;