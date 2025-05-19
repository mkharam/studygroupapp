import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaPlay, FaPause, FaUndo, FaCoffee, FaBook, FaBell, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

/**
 * StudyTimer Component
 * 
 * A Pomodoro Technique timer for effective study sessions.
 * Features:
 * - 25-minute focused study sessions
 * - 5-minute short breaks
 * - 15-minute long breaks after every 4 study sessions
 * - Sound notifications
 * - Session tracking
 */
const StudyTimer = () => {
  // Timer states
  const [mode, setMode] = useState('study'); // 'study', 'shortBreak', 'longBreak'
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds for study
  const [isActive, setIsActive] = useState(false);
  const [completedIntervals, setCompletedIntervals] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Audio references
  const timerEndSound = useRef(null);
  const timerTickSound = useRef(null);
  
  // Initialize audio when component mounts
  useEffect(() => {
    timerEndSound.current = new Audio('/sounds/timer-end.mp3');
    timerTickSound.current = new Audio('/sounds/timer-tick.mp3');
    
    // Clean up on unmount
    return () => {
      timerEndSound.current = null;
      timerTickSound.current = null;
    };
  }, []);
  
  // Handle timer completion
  const handleTimerComplete = useCallback(() => {
    // Play sound notification if enabled
    if (soundEnabled) {
      timerEndSound.current?.play().catch(() => {
        // Silently handle audio playback errors
      });
    }
    
    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      const notificationTitle = mode === 'study' 
        ? 'Study session completed! Take a break.' 
        : 'Break time over! Back to studying.';
        
      new Notification(notificationTitle, {
        body: 'Your timer has ended.',
        icon: '/logo192.png'
      });
    }
    
    // Update completed intervals and switch modes
    if (mode === 'study') {
      const newCompletedIntervals = completedIntervals + 1;
      setCompletedIntervals(newCompletedIntervals);
      
      // After every 4 study sessions, take a long break
      if (newCompletedIntervals % 4 === 0) {
        switchMode('longBreak');
      } else {
        switchMode('shortBreak');
      }
    } else {
      // After break, go back to study mode
      switchMode('study');
    }
  }, [mode, completedIntervals, soundEnabled]);
  
  // Timer countdown effect
  useEffect(() => {
    if (isActive) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isActive, handleTimerComplete]);
  
  // Switch between modes (study, short break, long break)
  const switchMode = (newMode) => {
    setIsActive(false);
    setMode(newMode);
    
    // Set appropriate time for each mode
    switch (newMode) {
      case 'study':
        setTimeLeft(25 * 60); // 25 minutes
        break;
      case 'shortBreak':
        setTimeLeft(5 * 60); // 5 minutes
        break;
      case 'longBreak':
        setTimeLeft(15 * 60); // 15 minutes
        break;
      default:
        setTimeLeft(25 * 60);
    }
  };
  
  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Toggle timer start/pause
  const toggleTimer = () => {
    setIsActive(!isActive);
  };
  
  // Reset the timer
  const resetTimer = () => {
    setIsActive(false);
    
    // Reset to appropriate time based on current mode
    switch (mode) {
      case 'study':
        setTimeLeft(25 * 60);
        break;
      case 'shortBreak':
        setTimeLeft(5 * 60);
        break;
      case 'longBreak':
        setTimeLeft(15 * 60);
        break;
      default:
        setTimeLeft(25 * 60);
    }
  };
  
  // Request notification permission
  const requestNotificationPermission = () => {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications');
    } else if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  };
  
  // Toggle sound
  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };
  
  // Determine button colors based on mode
  const getButtonColor = () => {
    switch (mode) {
      case 'study':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'shortBreak':
        return 'bg-green-500 hover:bg-green-600';
      case 'longBreak':
        return 'bg-purple-500 hover:bg-purple-600';
      default:
        return 'bg-blue-500 hover:bg-blue-600';
    }
  };
  
  // Get title and icon based on current mode
  const getModeInfo = () => {
    switch (mode) {
      case 'study':
        return { title: 'Focus Time', icon: <FaBook className="mr-2" /> };
      case 'shortBreak':
        return { title: 'Short Break', icon: <FaCoffee className="mr-2" /> };
      case 'longBreak':
        return { title: 'Long Break', icon: <FaCoffee className="mr-2" /> };
      default:
        return { title: 'Focus Time', icon: <FaBook className="mr-2" /> };
    }
  };
  
  const modeInfo = getModeInfo();
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 dark:bg-gray-800">
      {/* Timer Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center dark:text-white">
          {modeInfo.icon} {modeInfo.title}
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={requestNotificationPermission}
            className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
            title="Enable notifications"
          >
            <FaBell />
          </button>
          <button
            onClick={toggleSound}
            className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
            title={soundEnabled ? "Mute sounds" : "Enable sounds"}
          >
            {soundEnabled ? <FaVolumeUp /> : <FaVolumeMute />}
          </button>
        </div>
      </div>
      
      {/* Timer Display */}
      <div className="flex flex-col items-center mb-4">
        <div className="text-6xl font-bold mb-4 dark:text-white">
          {formatTime(timeLeft)}
        </div>
        
        {/* Progress Indicator - # Completed / 4 */}
        <div className="flex items-center space-x-1 mb-4">
          {[...Array(4)].map((_, i) => (
            <div 
              key={i}
              className={`w-3 h-3 rounded-full ${
                i < (completedIntervals % 4) 
                  ? 'bg-blue-500 dark:bg-blue-400' 
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            ></div>
          ))}
          <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
            Set {Math.floor(completedIntervals / 4) + 1}
          </span>
        </div>
      </div>
      
      {/* Control Buttons */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={toggleTimer}
          className={`${getButtonColor()} text-white px-6 py-2 rounded-md flex items-center justify-center transition-colors`}
        >
          {isActive ? <FaPause className="mr-1" /> : <FaPlay className="mr-1" />}
          {isActive ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={resetTimer}
          className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-6 py-2 rounded-md flex items-center justify-center transition-colors"
        >
          <FaUndo className="mr-1" />
          Reset
        </button>
      </div>
      
      {/* Mode Selector */}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => switchMode('study')}
          className={`flex-1 py-2 border-b-2 transition-colors ${
            mode === 'study' 
              ? 'border-blue-500 text-blue-500' 
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Focus
        </button>
        <button
          onClick={() => switchMode('shortBreak')}
          className={`flex-1 py-2 border-b-2 transition-colors ${
            mode === 'shortBreak' 
              ? 'border-green-500 text-green-500' 
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Short Break
        </button>
        <button
          onClick={() => switchMode('longBreak')}
          className={`flex-1 py-2 border-b-2 transition-colors ${
            mode === 'longBreak' 
              ? 'border-purple-500 text-purple-500' 
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Long Break
        </button>
      </div>
      
      {/* Timer Tips */}
      <div className="mt-6 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pomodoro Technique Tips:</h3>
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-4">
          <li>Focus completely during study sessions</li>
          <li>Use short breaks to stretch or grab a drink</li>
          <li>Use long breaks to rest your mind properly</li>
          <li>Track your completed sessions to measure productivity</li>
        </ul>
      </div>
    </div>
  );
};

export default StudyTimer;