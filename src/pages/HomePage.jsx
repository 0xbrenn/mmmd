// src/pages/HomePage.jsx
import React, { useState, useRef, useEffect } from 'react';
import { aiService, EVENT_CATEGORIES } from '../services/openai';
import { eventService } from '../services/supabase';
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
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

function HomePage({ user }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hey there! 👋 I'm your Lethbridge AI assistant. Ask me about events happening in our city - whether you're looking for family activities, concerts, sports, or anything else happening around town!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Prevent initial scroll to input
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    // Add user message
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const result = await aiService.searchEvents(input);
      
      const assistantMessage = {
        role: 'assistant',
        content: result.message,
        events: result.events,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
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
    "Events for kids under 5",
    "Live music tonight",
    "Outdoor activities this week"
  ];

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
          Your AI-powered guide to local events, activities, and experiences
        </p>
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
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                        : 'bg-white text-gray-800 shadow-md border border-gray-100'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    
                    {/* Show event cards if available */}
                    {message.events && message.events.length > 0 && (
                      <div className="mt-4 space-y-3">
                        {message.events.slice(0, 3).map((event) => (
                          <EventCard 
                            key={event.id} 
                            event={event} 
                            compact 
                            onSelect={setSelectedEvent}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex justify-start animate-fadeIn">
                  <div className="bg-white px-5 py-3 rounded-2xl shadow-md border border-gray-100">
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

            {/* Quick Prompts */}
            <div className="px-6 py-3 border-t border-gray-100 bg-white">
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(prompt)}
                    className="text-xs px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-all hover:scale-105"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="p-6 bg-white border-t border-gray-100">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about events in Lethbridge..."
                  className="flex-1 px-5 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 hover:shadow-lg"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Sponsored Events / Ad Space */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl shadow-xl p-6 border border-purple-200">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold flex items-center">
                <SparklesIcon className="w-5 h-5 mr-2 text-purple-600" />
                Featured Events
              </h3>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                Sponsored
              </span>
            </div>
            
            <div className="space-y-4">
              {/* Placeholder for sponsored events */}
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 text-center border-2 border-dashed border-purple-300">
                <BuildingOfficeIcon className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">
                  Advertise Your Event Here
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Get premium placement and reach more attendees
                </p>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all text-sm font-medium"
                >
                  Learn More →
                </Link>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
              Starting at $25/week
            </p>
          </div>

          {/* Categories */}
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
            <h3 className="text-lg font-semibold mb-4">Browse by Category</h3>
            <div className="flex flex-wrap gap-2">
              {EVENT_CATEGORIES.slice(0, 6).map((category) => (
                <span
                  key={category}
                  className="px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm hover:bg-white/30 cursor-pointer transition-all hover:scale-105"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>

          {/* Quick Stats - Social Proof */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              Lethbridge AI Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Events</span>
                <span className="font-semibold text-gray-900">127</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Monthly Users</span>
                <span className="font-semibold text-gray-900">2,840</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Partner Businesses</span>
                <span className="font-semibold text-gray-900">45</span>
              </div>
            </div>
          </div>
        </div>
      </div>

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

// EventCard component - defined outside HomePage
function EventCard({ event, compact = false, onSelect }) {
  const handleClick = async () => {
    try {
      // Increment view count
      if (eventService.incrementViewCount) {
        await eventService.incrementViewCount(event.id);
      }
      
      // Open the modal with event details
      if (onSelect) {
        onSelect(event);
      }
    } catch (error) {
      console.error('Error handling event click:', error);
      // Still open the modal even if view count fails
      if (onSelect) {
        onSelect(event);
      }
    }
  };

  if (compact) {
    return (
      <div 
        onClick={handleClick}
        className="bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-gray-100 hover:shadow-md transition-all cursor-pointer hover:border-purple-300"
      >
        <h4 className="font-medium text-sm text-gray-900">{event.title}</h4>
        <p className="text-xs text-gray-600 mt-1">
          {format(parseISO(event.start_date), 'MMM d, h:mm a')} • {event.location}
        </p>
        <p className="text-xs text-purple-600 mt-2 font-medium">Click for details →</p>
      </div>
    );
  }

  return (
    <div 
      onClick={handleClick}
      className="group border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer hover:border-purple-200 bg-white"
    >
      <h4 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
        {event.title}
      </h4>
      
      <div className="mt-3 space-y-2 text-sm text-gray-600">
        <div className="flex items-center">
          <CalendarIcon className="w-4 h-4 mr-2 text-gray-400" />
          {format(parseISO(event.start_date), 'EEEE, MMMM d')}
        </div>
        <div className="flex items-center">
          <MapPinIcon className="w-4 h-4 mr-2 text-gray-400" />
          {event.location}
        </div>
        <div className="flex items-center">
          {event.is_free ? (
            <span className="text-green-600 font-medium">Free Event</span>
          ) : (
            <>
              <CurrencyDollarIcon className="w-4 h-4 mr-2 text-gray-400" />
              ${event.cost}
            </>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          {event.category}
        </span>
        {event.age_min > 0 && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <UserGroupIcon className="w-3 h-3 mr-1" />
            Ages {event.age_min}+
          </span>
        )}
      </div>
    </div>
  );
}

// EventDetailsModal component - defined outside HomePage
function EventDetailsModal({ event, onClose }) {
  const [closing, setClosing] = useState(false);

  if (!event) return null;

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 ${closing ? 'animate-fadeOut' : 'animate-fadeIn'}`}>
      <div className={`bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl ${closing ? 'animate-scaleOut' : 'animate-scaleIn'}`}>
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
          
          <h2 className="text-2xl font-bold pr-12">{event.title}</h2>
          <p className="text-blue-100 mt-2">{event.category}</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          {event.description && (
            <div>
              <h3 className="text-lg font-semibold mb-2">About this event</h3>
              <p className="text-gray-600">{event.description}</p>
            </div>
          )}

          {/* Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start">
                <CalendarIcon className="w-5 h-5 mr-3 text-purple-600 mt-0.5" />
                <div>
                  <p className="font-medium">Date & Time</p>
                  <p className="text-sm text-gray-600">
                    {format(parseISO(event.start_date), 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-sm text-gray-600">
                    {format(parseISO(event.start_date), 'h:mm a')}
                    {event.end_date && ` - ${format(parseISO(event.end_date), 'h:mm a')}`}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <MapPinIcon className="w-5 h-5 mr-3 text-purple-600 mt-0.5" />
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-sm text-gray-600">{event.location}</p>
                  {event.address && (
                    <p className="text-sm text-gray-600">{event.address}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start">
                <CurrencyDollarIcon className="w-5 h-5 mr-3 text-purple-600 mt-0.5" />
                <div>
                  <p className="font-medium">Price</p>
                  <p className="text-sm text-gray-600">
                    {event.is_free ? 'Free Event' : `$${event.cost} per person`}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <UserGroupIcon className="w-5 h-5 mr-3 text-purple-600 mt-0.5" />
                <div>
                  <p className="font-medium">Age Range</p>
                  <p className="text-sm text-gray-600">
                    {event.age_min === 0 && event.age_max === 99 
                      ? 'All ages welcome'
                      : `Ages ${event.age_min} - ${event.age_max}`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {event.tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            {event.website_url && (
              <a
                href={event.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all text-center"
              >
                Visit Event Website
              </a>
            )}
            <button
              onClick={handleClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;