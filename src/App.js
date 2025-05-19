import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MajorsModulesProvider } from './context/MajorsModulesContext';
import { ThemeProvider } from './context/ThemeContext';
import { GoogleMapsProvider } from './context/GoogleMapsContext';

// Component imports
import NavBar from './components/Navigation/NavBar';
import MobileNavBar from './components/Navigation/MobileNavBar';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import GroupList from './components/Groups/List/GroupList';
import GroupCreate from './components/Groups/Create/GroupCreate';
import GroupDetails from './components/Groups/Details/GroupDetails';
import MajorsModules from './components/MajorsModules/MajorsModules';
import MyModules from './components/Modules/MyModules';
import Profile from './components/Profile/Profile';
import { StudyTimer } from './components/Study'; // Import StudyTimer component
import PrivacyPolicy from './components/Privacy/PrivacyPolicy'; // Import Privacy Policy component
import PrivacyNotice from './components/Privacy/PrivacyNotice'; // Import Privacy Notice component
import Terms from './components/Privacy/Terms'; // Import Terms component
import HomePage from './components/HomePage'; // Import the HomePage component
import Dashboard from './components/Dashboard/Dashboard'; // Corrected import path for Dashboard component
import MapPage from './components/Map/MapPage'; // Import MapPage

// Set React Router future flags globally to address warnings
if (typeof window !== 'undefined') {
  window.ROUTER_FUTURE_FLAGS = {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  };
}

function App() {
  const { currentUser } = useAuth(); // Use AuthContext to get current user

  return (
    <AuthProvider>
      <MajorsModulesProvider>
        <ThemeProvider>
          <GoogleMapsProvider>
            <div className="min-h-screen bg-ios-gray6 dark:bg-ios-dark-bg font-sf-pro-text transition-colors duration-200">
              <NavBar />
              <div className="pt-4 pb-20"> {/* Added bottom padding for mobile navigation */}
                <Routes>
                  {/* Conditional Routing */}
                  <Route path="/" element={currentUser ? <Dashboard /> : <HomePage />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  
                  {/* Groups */}
                  <Route path="/groups" element={<GroupList />} />
                  <Route path="/groups/create" element={<GroupCreate />} />
                  <Route path="/groups/:groupId" element={<GroupDetails />} />
                  
                  {/* Academic Structure - Unified Page */}
                  <Route path="/academics" element={<MajorsModules />} />
                  <Route path="/majors-modules" element={<Navigate to="/academics" replace />} />
                  
                  {/* Redirect old routes to the new unified page */}
                  <Route path="/majors" element={<Navigate to="/academics?tab=majors" replace />} />
                  <Route path="/modules" element={<Navigate to="/academics?tab=modules" replace />} />
                  <Route path="/my-modules" element={<MyModules />} />
                  
                  {/* Maps & Profile */}
                  <Route path="/map" element={<MapPage />} />
                  <Route path="/profile" element={<Profile />} />
                  
                  {/* Study Tools */}
                  <Route path="/study-timer" element={<StudyTimer />} />
                  
                  {/* Privacy & Terms */}
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/privacy-notice" element={<PrivacyNotice />} />
                  <Route path="/terms" element={<Terms />} />
                  
                  {/* Admin Route - Add a placeholder or redirect based on your needs */}
                  <Route path="/admin" element={<AdminPlaceholder />} />

                  {/* Map Page */}
                  <Route path="/map/select" element={<MapPage />} />
                </Routes>
              </div>
              {/* Add the Mobile Navigation Bar */}
              <MobileNavBar />
            </div>
          </GoogleMapsProvider>
        </ThemeProvider>
      </MajorsModulesProvider>
    </AuthProvider>
  );
}

// Temporary Admin placeholder component
// Replace this with your actual admin component when ready
function AdminPlaceholder() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <p className="mb-4">This admin section is currently under development.</p>
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
        <p className="font-bold">Note</p>
        <p>Only authorized administrators should access this area.</p>
      </div>
      <a href="/" className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded">
        Return to Home
      </a>
    </div>
  );
}

export default App;
