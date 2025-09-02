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
      // Force page reload to clear all state
      window.location.reload();
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
                  <div className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50">
                    {profile?.avatar_url ? (
                      <img
                        className="h-8 w-8 rounded-full"
                        src={profile.avatar_url}
                        alt={profile.display_name}
                      />
                    ) : (
                      <UserCircleIcon className="h-8 w-8 text-gray-400" />
                    )}
                    <span className="hidden md:block text-gray-700">
                      {profile?.display_name || user.email?.split('@')[0] || 'Account'}
                    </span>
                  </div>
                </button>
                
                {showDropdown && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5">
                    <div className="px-4 py-2 text-xs text-gray-500 border-b">
                      {user.email}
                    </div>
                    
                    {profile?.profile_type === 'business' ? (
                      <Link
                        to="/dashboard"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowDropdown(false)}
                      >
                        <ChartBarIcon className="w-4 h-4 mr-3" />
                        Dashboard
                      </Link>
                    ) : (
                      <Link
                        to="/listings"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowDropdown(false)}
                      >
                        <TagIcon className="w-4 h-4 mr-3" />
                        My Listings
                      </Link>
                    )}
                    
                    <Link
                      to="/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowDropdown(false)}
                    >
                      <CogIcon className="w-4 h-4 mr-3" />
                      Settings
                    </Link>
                    
                    <div className="border-t">
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

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      console.log('Initializing auth...');
      
      try {
        // Direct session check without waiting
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('Session error:', error);
          // Don't block on error, just proceed
          setLoading(false);
          setAuthInitialized(true);
          return;
        }
        
        if (session?.user) {
          console.log('Session found:', session.user.email);
          setUser(session.user);
          
          // Load profile asynchronously
          profileService.getProfile(session.user.id)
            .then(userProfile => {
              if (mounted && userProfile) {
                setProfile(userProfile);
                console.log('Profile loaded:', userProfile.display_name);
              }
            })
            .catch(profileError => {
              console.error('Profile load error:', profileError);
              // Try to create profile if it doesn't exist
              profileService.createProfile({
                user_id: session.user.id,
                display_name: session.user.email?.split('@')[0] || 'User',
                profile_type: 'personal'
              })
              .then(newProfile => {
                if (mounted && newProfile) {
                  setProfile(newProfile);
                }
              })
              .catch(createError => {
                console.error('Profile creation error:', createError);
              });
            });
        } else {
          console.log('No session found');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        // Always set loading to false
        if (mounted) {
          setLoading(false);
          setAuthInitialized(true);
        }
      }
    };

    // Initialize immediately
    initializeAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (!mounted) return;
        
        switch (event) {
          case 'SIGNED_IN':
          case 'TOKEN_REFRESHED':
          case 'USER_UPDATED':
            if (session?.user) {
              setUser(session.user);
              // Load profile asynchronously
              profileService.getProfile(session.user.id)
                .then(userProfile => {
                  if (mounted) setProfile(userProfile);
                })
                .catch(error => {
                  console.error('Profile load error on auth change:', error);
                });
            }
            break;
            
          case 'SIGNED_OUT':
            setUser(null);
            setProfile(null);
            break;
            
          case 'INITIAL_SESSION':
            // This is fired when the session is restored from storage
            if (session?.user) {
              setUser(session.user);
              profileService.getProfile(session.user.id)
                .then(userProfile => {
                  if (mounted) setProfile(userProfile);
                })
                .catch(error => {
                  console.error('Profile load error on initial session:', error);
                });
            }
            break;
        }
      }
    );

    // Add timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Auth initialization timeout - forcing load complete');
        setLoading(false);
        setAuthInitialized(true);
      }
    }, 3000); // 3 second timeout

    // Cleanup
    return () => {
      mounted = false;
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, []);

  // Periodic session validation
  useEffect(() => {
    if (!authInitialized) return;

    const validateSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session validation error:', error);
          return;
        }
        
        // If we have a session but no user state, restore it
        if (session?.user && !user) {
          console.log('Restoring lost session');
          setUser(session.user);
          const userProfile = await profileService.getProfile(session.user.id);
          setProfile(userProfile);
        } else if (!session && user) {
          // Session expired
          console.log('Session expired');
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('Session validation error:', error);
      }
    };

    // Validate on visibility change
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        validateSession();
      }
    };
    
    // Validate on focus
    const handleFocus = () => {
      validateSession();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    // Initial validation
    validateSession();
    
    // Periodic validation every 30 seconds
    const interval = setInterval(validateSession, 30000);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, authInitialized]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Toaster position="top-right" />
        <Navigation user={user} profile={profile} />
        
        <main>
          <Routes>
            <Route path="/" element={<HomePage user={user} profile={profile} />} />
            <Route path="/events" element={<EventsPage user={user} />} />
            <Route path="/community" element={<PersonalListingsPage user={user} profile={profile} />} />
            <Route path="/listings" element={<PersonalListingsPage user={user} profile={profile} />} />
            
            <Route
              path="/auth"
              element={user ? <Navigate to="/" replace /> : <AuthPage />}
            />
            
            <Route
              path="/dashboard"
              element={
                user && profile?.profile_type === 'business' ? (
                  <DashboardPage user={user} profile={profile} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            
            <Route
              path="/settings"
              element={
                user ? (
                  <ProfileSettingsPage user={user} profile={profile} />
                ) : (
                  <Navigate to="/auth" replace />
                )
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;