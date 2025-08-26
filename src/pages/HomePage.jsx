// src/pages/HomePage.jsx
import React, { useState, useRef, useEffect } from 'react';
import { aiService, EVENT_CATEGORIES } from '../services/openai';
import { eventService, preferencesService } from '../services/supabase';
import { format, parseISO } from 'date-fns';
import { 
  PaperAirplaneIcon, 
  SparklesIcon, 
  CalendarIcon, 
  MapPinIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ArrowRightIcon,
  XMarkIcon,
  BuildingOfficeIcon,
  HomeIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

function HomePage({ user, profile }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hey there! 👋 I'm your Lethbridge AI assistant. Ask me about events happening in our city - whether you're looking for family activities, concerts, sports, garage sales, or anything else happening around town!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [personalizedEvents, setPersonalizedEvents] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadFeaturedEvents();
    if (user) {
      loadPersonalizedEvents();
    }
  }, [user]);

  const loadFeaturedEvents = async () => {
    try {
      const events = await eventService.getEvents({ featured: true });
      setFeaturedEvents(events.slice(0, 3));
    } catch (error) {
      console.error('Error loading featured events:', error);
    }
  };

  const loadPersonalizedEvents = async () => {
    try {
      const events = await eventService.getPersonalizedEvents(user.id);
      setPersonalizedEvents(events.slice(0, 6));
    } catch (error) {
      console.error('Error loading personalized events:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const result = await aiService.searchEvents(input, user?.id);
      
      const assistantMessage = {
        role: 'assistant',
        content: result.message,
        events: result.events,
        personalListings: result.personalListings,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Track interaction if user is logged in
      if (user && result.events.length > 0) {
        const eventId = result.events[0].id;
        await preferencesService.trackInteraction(user.id, eventId, 'view');
      }
    } catch (error) {
      toast.error('Sorry, I had trouble searching for events. Please try again.');
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "What's happening this weekend?",
    "Free family activities",
    "Garage sales near me",
    "Live music tonight",
    "Community meetups"
  ];

  const handleQuickPrompt = (prompt) => {
    setInput(prompt);
    // Automatically submit
    const form = document.getElementById('chat-form');
    form.requestSubmit();
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-10">
        <h1 className="text-5xl font-bold text-gray-900 mb-4 leading-tight">
          Discover What's Happening in{' '}
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Lethbridge
          </span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Your AI-powered guide to local events, activities, and community connections
        </p>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mt-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">50+</div>
            <div className="text-sm text-gray-600">Events This Week</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">20+</div>
            <div className="text-sm text-gray-600">Local Businesses</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">15+</div>
            <div className="text-sm text-gray-600">Community Listings</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chat Interface */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-5">
              <h2 className="text-lg font-semibold flex items-center text-white">
                <SparklesIcon className="w-5 h-5 mr-2" />
                Ask Lethbridge AI
              </h2>
            </div>

            {/* Messages */}
            <div className="h-[500px] overflow-y-auto p-6 space-y-4 bg-gray-50">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-5 py-3 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                        : 'bg-white text-gray-800 shadow-md'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    
                    {/* Show events if available */}
                    {message.events && message.events.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.events.slice(0, 3).map(event => (
                          <div
                            key={event.id}
                            onClick={() => setSelectedEvent(event)}
                            className="bg-gray-50 p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                          >
                            <p className="font-medium text-gray-900 text-sm">{event.title}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                              <span className="flex items-center gap-1">
                                <CalendarIcon className="w-3 h-3" />
                                {format(parseISO(event.start_date), 'MMM d')}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPinIcon className="w-3 h-3" />
                                {event.location}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Show personal listings if available */}
                    {message.personalListings && message.personalListings.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-medium text-gray-700">Community Listings:</p>
                        {message.personalListings.slice(0, 3).map(listing => (
                          <div
                            key={listing.id}
                            className="bg-gray-50 p-3 rounded-lg"
                          >
                            <p className="font-medium text-gray-900 text-sm">{listing.title}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                              <span className="flex items-center gap-1">
                                <HomeIcon className="w-3 h-3" />
                                {listing.listing_type.replace('_', ' ')}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPinIcon className="w-3 h-3" />
                                {listing.location}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white px-5 py-3 rounded-2xl shadow-md">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form id="chat-form" onSubmit={handleSubmit} className="p-4 bg-white border-t">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about events, activities, or things to do..."
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Prompts */}
              <div className="flex flex-wrap gap-2 mt-3">
                {quickPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleQuickPrompt(prompt)}
                    className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                to="/events"
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium">Browse All Events</span>
                </div>
                <ArrowRightIcon className="w-4 h-4 text-gray-400" />
              </Link>
              
              <Link
                to="/listings"
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <TagIcon className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium">Community Listings</span>
                </div>
                <ArrowRightIcon className="w-4 h-4 text-gray-400" />
              </Link>

              {user && profile?.profile_type === 'business' && (
                <Link
                  to="/dashboard"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <BuildingOfficeIcon className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium">Business Dashboard</span>
                  </div>
                  <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                </Link>
              )}
            </div>
          </div>

          {/* Featured Events */}
          {featuredEvents.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Featured Events</h3>
              <div className="space-y-3">
                {featuredEvents.map(event => (
                  <div
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg cursor-pointer hover:from-blue-100 hover:to-purple-100 transition-colors"
                  >
                    <p className="font-medium text-gray-900 text-sm">{event.title}</p>
                    <p className="text-xs text-gray-600 mt-1">{event.location}</p>
                    <p className="text-xs text-blue-600 mt-1">
                      {format(parseISO(event.start_date), 'EEEE, MMM d')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Categories */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Popular Categories</h3>
            <div className="flex flex-wrap gap-2">
              {['Family', 'Music', 'Sports', 'Food', 'Community'].map(category => (
                <Link
                  key={category}
                  to={`/events?category=${category}`}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors text-sm"
                >
                  {category}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Personalized Recommendations */}
      {user && personalizedEvents.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recommended for You</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {personalizedEvents.map(event => (
              <div
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
              >
                {event.event_images && event.event_images[0] ? (
                  <img
                    src={event.event_images[0].image_url}
                    alt={event.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <CalendarIcon className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{event.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{event.location}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-600">
                      {format(parseISO(event.start_date), 'MMM d, h:mm a')}
                    </span>
                    {event.is_free ? (
                      <span className="text-sm font-medium text-green-600">Free</span>
                    ) : (
                      <span className="text-sm font-medium text-gray-700">${event.cost}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}

// Event Details Modal Component
function EventDetailsModal({ event, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="relative">
          {event.event_images && event.event_images[0] ? (
            <img
              src={event.event_images[0].image_url}
              alt={event.title}
              className="w-full h-64 object-cover rounded-t-xl"
            />
          ) : (
            <div className="w-full h-64 bg-gradient-to-br from-blue-100 to-purple-100 rounded-t-xl" />
          )}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{event.title}</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Date & Time</p>
                <p className="font-medium">
                  {format(parseISO(event.start_date), 'EEEE, MMMM d, yyyy')}
                </p>
                <p className="text-sm">{format(parseISO(event.start_date), 'h:mm a')}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <MapPinIcon className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="font-medium">{event.location}</p>
                {event.address && <p className="text-sm">{event.address}</p>}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-2">Description</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-gray-600">Price</p>
              {event.is_free ? (
                <p className="text-lg font-bold text-green-600">Free</p>
              ) : (
                <p className="text-lg font-bold text-gray-900">${event.cost}</p>
              )}
            </div>
            
            {event.age_min > 0 || event.age_max < 99 ? (
              <div>
                <p className="text-sm text-gray-600">Age Range</p>
                <p className="font-medium">
                  {event.age_min}-{event.age_max} years
                </p>
              </div>
            ) : null}
          </div>

          {event.website_url && (
            <a
              href={event.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Learn More
              <ArrowRightIcon className="w-4 h-4 ml-2" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default HomePage;