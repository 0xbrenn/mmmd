// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { authService, profileService } from './services/supabase';
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
  BellIcon
} from '@heroicons/react/24/outline';

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserAndProfile();
  }, []);

  const loadUserAndProfile = async () => {
    try {
      // Check for current user
      const currentUser = await authService.getUser();
      setUser(currentUser);

      if (currentUser) {
        // Load user profile
        const userProfile = await profileService.getProfile(currentUser.id);
        setProfile(userProfile);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const userProfile = await profileService.getProfile(session.user.id);
        setProfile(userProfile);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Lethbridge AI...</p>
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
              user ? <ProfileSettingsPage user={user} profile={profile} /> : <Navigate to="/auth" />
            } />
            <Route path="/auth" element={<AuthPage />} />
          </Routes>
        </main>

        <Footer />
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

// Enhanced Navigation Component
function Navigation({ user, profile }) {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(false);

  const handleSignOut = async () => {
    await authService.signOut();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">LA</span>
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">Lethbridge AI</span>
                <span className="hidden sm:block text-xs text-gray-600">Your Local Assistant</span>
              </div>
            </Link>

            <div className="hidden md:flex items-center ml-10 space-x-8">
              <Link
                to="/events"
                className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors"
              >
                <CalendarIcon className="w-5 h-5" />
                <span>Events</span>
              </Link>
              
              <Link
                to="/listings"
                className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors"
              >
                <TagIcon className="w-5 h-5" />
                <span>Community</span>
              </Link>

              {user && profile?.profile_type === 'business' && (
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <BuildingOfficeIcon className="w-5 h-5" />
                  <span>Dashboard</span>
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Notifications */}
                <button className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors">
                  <BellIcon className="w-6 h-6" />
                  {hasNotifications && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {profile?.display_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="hidden md:block text-sm font-medium text-gray-700">
                      {profile?.display_name || 'Account'}
                    </span>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 border">
                      <div className="px-4 py-2 border-b">
                        <p className="text-sm font-medium text-gray-900">
                          {profile?.display_name}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            profile?.profile_type === 'business' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-purple-100 text-purple-700'
                          }`}>
                            {profile?.profile_type === 'business' ? 'Business' : 'Personal'} Account
                          </span>
                        </div>
                      </div>

                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <UserCircleIcon className="w-4 h-4 mr-2" />
                        Profile Settings
                      </Link>

                      {profile?.profile_type === 'personal' && (
                        <Link
                          to="/listings?my=true"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <HomeIcon className="w-4 h-4 mr-2" />
                          My Listings
                        </Link>
                      )}

                      {profile?.profile_type === 'business' && (
                        <>
                          <Link
                            to="/dashboard?tab=ai"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <SparklesIcon className="w-4 h-4 mr-2" />
                            AI Assistant
                          </Link>
                          <Link
                            to="/dashboard?tab=analytics"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <ChartBarIcon className="w-4 h-4 mr-2" />
                            Analytics
                          </Link>
                        </>
                      )}

                      <div className="border-t mt-2 pt-2">
                        <button
                          onClick={handleSignOut}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link
                to="/auth"
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all shadow-md hover:shadow-lg"
              >
                <UserCircleIcon className="w-4 h-4 mr-1.5" />
                Sign In / Sign Up
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">LA</span>
              </div>
              <span className="font-semibold">Lethbridge AI</span>
            </div>
            <p className="text-sm text-gray-400">
              Your AI-powered local assistant for events, community connections, and business discovery.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Powered by Anthropic Claude
            </p>
          </div>

          {/* Features */}
          <div>
            <h4 className="font-semibold mb-4">Features</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link to="/events" className="hover:text-white transition-colors">
                  Business Events
                </Link>
              </li>
              <li>
                <Link to="/listings" className="hover:text-white transition-colors">
                  Community Listings
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  AI Business Agents
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Personalized Recommendations
                </a>
              </li>
            </ul>
          </div>

          {/* For Businesses */}
          <div>
            <h4 className="font-semibold mb-4">For Businesses</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link to="/auth" className="hover:text-white transition-colors">
                  Create Business Account
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Pricing Plans
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  AI Agent Setup
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Success Stories
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Community Guidelines
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-xs text-gray-500">
              © 2024 Lethbridge AI. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white">
                <span className="sr-only">Facebook</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <span className="sr-only">Twitter</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default App;