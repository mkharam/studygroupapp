import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './context/AuthContext';
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
import MapView from './Map';
import MapPage from './components/Maps/MapPage';
import Profile from './components/Profile/Profile';
import Dashboard from './components/Dashboard/Dashboard';
import { StudyTimer } from './components/Study'; // Import StudyTimer component
import PrivacyPolicy from './components/Privacy/PrivacyPolicy'; // Import Privacy Policy component
import PrivacyNotice from './components/Privacy/PrivacyNotice'; // Import Privacy Notice component
import Terms from './components/Privacy/Terms'; // Import Terms component

// Set React Router future flags globally to address warnings
if (typeof window !== 'undefined') {
  window.ROUTER_FUTURE_FLAGS = {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  };
}

function App() {
  return (
    <AuthProvider>
      <MajorsModulesProvider>
        <ThemeProvider>
          <GoogleMapsProvider>
            <div className="min-h-screen bg-ios-gray6 dark:bg-ios-dark-bg font-sf-pro-text transition-colors duration-200">
              <NavBar />
              <div className="pt-4 pb-20"> {/* Added bottom padding for mobile navigation */}
                <Routes>
                  {/* Home & Authentication */}
                  <Route path="/" element={<Dashboard />} />
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
                  <Route path="/my-modules" element={<MyModules />} />                  {/* Maps & Profile */}
                  <Route path="/map" element={<MapView />} />
                  <Route path="/maps" element={<MapPage />} />
                  <Route path="/profile" element={<Profile />} />
                  
                  {/* Study Tools */}
                  <Route path="/study-timer" element={<StudyTimer />} />
                    {/* Privacy & Terms */}
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/privacy-notice" element={<PrivacyNotice />} />
                  <Route path="/terms" element={<Terms />} />
                  
                  {/* Admin Route - Redirect to home for now */}
                  <Route path="/admin" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
              {/* Add the Mobile Navigation Bar */}
              <MobileNavBar />
            </div>
          </GoogleMapsProvider>
        </ThemeProvider>
      </MajorsModulesProvider>    </AuthProvider>
  );
}

export default App;