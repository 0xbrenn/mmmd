// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { authService, profileService, supabase } from './services/supabase';
import HomePage from './pages/HomePage';
import EventsPage from './pages/EventsPage';
import PersonalListingsPage from './pages/PersonalListingsPage';
import DashboardPage from './pages/DashboardPage';
import AuthPage from './pages/AuthPage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import { 
  UserCircleIcon, 
  CalendarIcon, 
  BuildingOfficeIcon,
  HomeIcon,
  CogIcon,
  SparklesIcon,
  TagIcon,
  BellIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

// Navigation component - moved inside to use hooks properly
function Navigation({ user, profile }) {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex items-center">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1.5 rounded-lg font-bold text-lg">
                LA
              </div>
              <span className="ml-3 text-xl font-semibold text-gray-900">
                Lethbridge AI
              </span>
            </Link>
            
            <div className="hidden sm:ml-8 sm:flex sm:space-x-6">
              <Link
                to="/events"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                <CalendarIcon className="w-4 h-4 mr-1" />
                Events
              </Link>
              <Link
                to="/community"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                <UserCircleIcon className="w-4 h-4 mr-1" />
                Community
              </Link>
            </div>
          </div>
          
          <div className="flex items-center">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium">
                    {profile?.display_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="ml-2 text-gray-700 font-medium hidden sm:block">
                    {profile?.display_name || 'Account'}
                  </span>
                </button>
                
                {showDropdown && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowDropdown(false)}
                      >
                        <CogIcon className="w-4 h-4 mr-3" />
                        Settings
                      </Link>
                      {profile?.profile_type === 'business' && (
                        <Link
                          to="/dashboard"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowDropdown(false)}
                        >
                          <ChartBarIcon className="w-4 h-4 mr-3" />
                          Dashboard
                        </Link>
                      )}
                      <Link
                        to="/listings"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowDropdown(false)}
                      >
                        <TagIcon className="w-4 h-4 mr-3" />
                        My Listings
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                      >
                        <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/auth"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                Sign In / Sign Up
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Initialize auth state with better session handling
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get the session first - more reliable than getUser
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          if (mounted) {
            setLoading(false);
            setAuthInitialized(true);
          }
          return;
        }

        if (session?.user && mounted) {
          setUser(session.user);
          // Try to load profile with retry logic
          let retries = 3;
          let profileLoaded = false;
          
          while (retries > 0 && !profileLoaded) {
            try {
              const userProfile = await profileService.getProfile(session.user.id);
              if (mounted && userProfile) {
                setProfile(userProfile);
                profileLoaded = true;
              }
            } catch (profileError) {
              console.error(`Profile load attempt ${4 - retries} failed:`, profileError);
              retries--;
              if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
              }
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        if (mounted) {
          setLoading(false);
          setAuthInitialized(true);
        }
      }
    };

    initializeAuth();

    // Set up auth state listener with better error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (!mounted) return;
        
        // Handle specific auth events
        switch (event) {
          case 'SIGNED_IN':
            setUser(session?.user ?? null);
            if (session?.user) {
              try {
                const userProfile = await profileService.getProfile(session.user.id);
                if (mounted) setProfile(userProfile);
              } catch (error) {
                console.error('Profile load error:', error);
                if (mounted) setProfile(null);
              }
            }
            break;
            
          case 'SIGNED_OUT':
            setUser(null);
            setProfile(null);
            break;
            
          case 'TOKEN_REFRESHED':
            console.log('Token refreshed successfully');
            // Re-validate session
            if (session?.user) {
              setUser(session.user);
            }
            break;
            
          case 'USER_UPDATED':
            setUser(session?.user ?? null);
            break;
            
          default:
            // For any other event, update user state
            setUser(session?.user ?? null);
            if (session?.user && !profile) {
              try {
                const userProfile = await profileService.getProfile(session.user.id);
                if (mounted) setProfile(userProfile);
              } catch (error) {
                console.error('Profile load error:', error);
              }
            }
        }
      }
    );

    // Cleanup
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Add periodic session check to handle token expiry
  useEffect(() => {
    if (!authInitialized) return;

    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Session check error:', error);
          setUser(null);
          setProfile(null);
          return;
        }
        
        // If we have a session but no user state, restore it
        if (session?.user && !user) {
          console.log('Restoring user from session check');
          setUser(session.user);
          try {
            const userProfile = await profileService.getProfile(session.user.id);
            setProfile(userProfile);
          } catch (profileError) {
            console.error('Profile restoration error:', profileError);
          }
        } else if (!session && user) {
          // Session expired but we still have user state
          console.log('Session expired, clearing user state');
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('Session validation error:', error);
      }
    };

    // Check session every 30 seconds
    const interval = setInterval(checkSession, 30000);
    
    // Also check on visibility change
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkSession();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, authInitialized]);

  // Add timeout fallback with better error handling
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!authInitialized) {
        console.warn('Auth initialization timeout - forcing load');
        setLoading(false);
        setAuthInitialized(true);
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timeout);
  }, [authInitialized]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Lethbridge AI...</p>
          <p className="mt-2 text-xs text-gray-400">Initializing session...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <Navigation user={user} profile={profile} />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<HomePage user={user} profile={profile} />} />
            <Route path="/events" element={<EventsPage user={user} profile={profile} />} />
            <Route path="/listings" element={<PersonalListingsPage user={user} profile={profile} />} />
            <Route path="/dashboard" element={
              user && profile?.profile_type === 'business' ? 
                <DashboardPage user={user} profile={profile} /> : 
                <Navigate to="/auth" />
            } />
            <Route path="/profile" element={
              user ? 
                <ProfileSettingsPage user={user} profile={profile} /> : 
                <Navigate to="/auth" />
            } />
            <Route path="/auth" element={
              !user ? 
                <AuthPage /> : 
                <Navigate to="/" />
            } />
          </Routes>
        </main>
        
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;