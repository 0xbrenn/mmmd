// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { businessService, eventService, aiAgentService, imageService, subscriptionService } from '../services/supabase';
import { aiService, EVENT_CATEGORIES } from '../services/openai';
import BusinessAIAgentSetup from '../components/BusinessAIAgentSetup';
import { format, parseISO } from 'date-fns';
import { 
  PlusIcon, 
  CalendarIcon, 
  ChartBarIcon,
  BuildingOfficeIcon,
  PencilIcon,
  TrashIcon,
  SparklesIcon,
  EyeIcon,
  XMarkIcon,
  CheckIcon,
  PhotoIcon,
  CogIcon,
  BanknotesIcon,
  ChatBubbleBottomCenterTextIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

function DashboardPage({ user, profile }) {
  const [activeTab, setActiveTab] = useState('events');
  const [business, setBusiness] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiAgentConfig, setAIAgentConfig] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [subscriptionTiers, setSubscriptionTiers] = useState([]);

  useEffect(() => {
    loadBusinessData();
    loadSubscriptionTiers();
  }, [user]);

  const loadBusinessData = async () => {
    try {
      const businesses = await businessService.getBusinesses();
      const userBusiness = businesses.find(b => b.owner_id === user.id);
      
      if (userBusiness) {
        setBusiness(userBusiness);
        const businessEvents = await businessService.getBusinessEvents(userBusiness.id);
        setEvents(businessEvents);
        
        // Load AI agent config
        const agentConfig = await aiAgentService.getAgentConfig(userBusiness.id);
        setAIAgentConfig(agentConfig);
        
        // Load analytics
        const analyticsData = await businessService.getBusinessAnalytics(userBusiness.id);
        setAnalytics(analyticsData);
      }
    } catch (error) {
      console.error('Error loading business data:', error);
      toast.error('Error loading your business data');
    } finally {
      setLoading(false);
    }
  };

  const loadSubscriptionTiers = async () => {
    try {
      const tiers = await subscriptionService.getTiers();
      setSubscriptionTiers(tiers);
    } catch (error) {
      console.error('Error loading subscription tiers:', error);
    }
  };

  const handleCreateBusiness = async (businessData) => {
    try {
      const newBusiness = await businessService.createBusiness({
        ...businessData,
        owner_id: user.id
      });
      setBusiness(newBusiness);
      toast.success('Business profile created successfully!');
      loadBusinessData();
    } catch (error) {
      toast.error('Error creating business profile');
      console.error('Error:', error);
    }
  };

  const handleAIAgentSave = async (config) => {
    try {
      if (aiAgentConfig) {
        await aiAgentService.updateAgentConfig(business.id, config);
      } else {
        await aiAgentService.createAgentConfig(business.id, config);
      }
      setAIAgentConfig(config);
      toast.success('AI Agent configuration saved successfully!');
      setShowAIModal(false);
    } catch (error) {
      toast.error('Error saving AI Agent configuration');
      console.error('Error:', error);
    }
  };

  const handleUpgradePlan = async (tier) => {
    try {
      await subscriptionService.updateBusinessTier(business.id, tier.tier_name);
      toast.success(`Upgraded to ${tier.display_name} plan!`);
      loadBusinessData();
    } catch (error) {
      toast.error('Error upgrading plan');
      console.error('Error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!business) {
    return <BusinessSetup onSubmit={handleCreateBusiness} />;
  }

  // Get current subscription tier
  const currentTier = subscriptionTiers.find(t => t.tier_name === business.subscription_tier) || subscriptionTiers[0];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Business Header */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {business.logo_url ? (
              <img
                src={business.logo_url}
                alt={business.name}
                className="w-16 h-16 rounded-lg object-cover mr-4"
              />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center mr-4">
                <BuildingOfficeIcon className="w-8 h-8 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
              <p className="text-gray-600">{business.category}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  currentTier.tier_name === 'free' ? 'bg-gray-100 text-gray-800' :
                  currentTier.tier_name === 'basic' ? 'bg-blue-100 text-blue-800' :
                  currentTier.tier_name === 'pro' ? 'bg-purple-100 text-purple-800' :
                  'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800'
                }`}>
                  {currentTier.display_name} Plan
                </span>
                {business.verified_at && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckIcon className="w-3 h-3 mr-1" />
                    Verified
                  </span>
                )}
                {business.ai_agent_enabled && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    <SparklesIcon className="w-3 h-3 mr-1" />
                    AI Enabled
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Events</p>
            <p className="text-2xl font-bold text-gray-900">{events.length}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex -mb-px">
            {[
              { id: 'events', label: 'Events', icon: CalendarIcon },
              { id: 'promote', label: 'Promote', icon: BanknotesIcon },
              { id: 'analytics', label: 'Analytics', icon: ChartBarIcon },
              { id: 'ai-agent', label: 'AI Assistant', icon: ChatBubbleBottomCenterTextIcon },
              { id: 'settings', label: 'Settings', icon: CogIcon }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                disabled={tab.id === 'ai-agent' && !currentTier.ai_agent_enabled}
                className={`group relative min-w-0 flex-1 overflow-hidden py-4 px-4 text-center text-sm font-medium hover:bg-gray-50 focus:z-10 ${
                  activeTab === tab.id 
                    ? 'text-blue-600 border-b-2 border-blue-500' 
                    : 'text-gray-500 hover:text-gray-700'
                } ${tab.id === 'ai-agent' && !currentTier.ai_agent_enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-center">
                  <tab.icon className="w-5 h-5 mr-2" />
                  <span>{tab.label}</span>
                </div>
                {tab.id === 'ai-agent' && !currentTier.ai_agent_enabled && (
                  <span className="absolute -top-1 -right-1 bg-yellow-400 text-xs px-1.5 py-0.5 rounded-full">
                    Pro
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Events Tab */}
          {activeTab === 'events' && (
            <EventsTab 
              events={events} 
              business={business}
              currentTier={currentTier}
              onUpdate={loadBusinessData}
            />
          )}

          {/* Promote Tab */}
          {activeTab === 'promote' && (
            <PromoteTab 
              events={events} 
              business={business}
              onUpdate={loadBusinessData}
            />
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <AnalyticsTab 
              events={events}
              analytics={analytics}
              currentTier={currentTier}
            />
          )}

          {/* AI Agent Tab */}
          {activeTab === 'ai-agent' && (
            currentTier.ai_agent_enabled ? (
              <div>
                {showAIModal ? (
                  <BusinessAIAgentSetup
                    businessId={business.id}
                    businessInfo={business}
                    currentConfig={aiAgentConfig}
                    onSave={handleAIAgentSave}
                    onClose={() => setShowAIModal(false)}
                  />
                ) : (
                  <div>
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-2">AI Business Assistant</h3>
                      <p className="text-gray-600">
                        Your AI assistant can answer customer questions about your business 24/7.
                      </p>
                    </div>

                    {aiAgentConfig ? (
                      <div className="bg-gray-50 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                              <SparklesIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{aiAgentConfig.agent_name}</h4>
                              <p className="text-sm text-gray-600">
                                Status: {aiAgentConfig.enabled ? 
                                  <span className="text-green-600">Active</span> : 
                                  <span className="text-gray-500">Inactive</span>
                                }
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setShowAIModal(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Configure
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div className="bg-white rounded-lg p-4">
                            <p className="text-sm text-gray-600 mb-1">Queries This Month</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {aiAgentConfig.monthly_queries_used} / {aiAgentConfig.monthly_queries_limit}
                            </p>
                          </div>
                          <div className="bg-white rounded-lg p-4">
                            <p className="text-sm text-gray-600 mb-1">Personality</p>
                            <p className="text-lg font-medium text-gray-900 capitalize">
                              {aiAgentConfig.agent_personality}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <SparklesIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Set Up Your AI Assistant
                        </h3>
                        <p className="text-gray-600 mb-6">
                          Create an AI assistant that can answer customer questions about your business.
                        </p>
                        <button
                          onClick={() => setShowAIModal(true)}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Get Started
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <SparklesIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  AI Assistant Requires Pro Plan
                </h3>
                <p className="text-gray-600 mb-6">
                  Upgrade to Pro or Premium to enable your AI business assistant.
                </p>
                <button
                  onClick={() => setActiveTab('settings')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  View Upgrade Options
                </button>
              </div>
            )
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <SettingsTab 
              business={business}
              currentTier={currentTier}
              subscriptionTiers={subscriptionTiers}
              onUpdate={(updates) => {
                setBusiness({ ...business, ...updates });
                loadBusinessData();
              }}
              onUpgrade={handleUpgradePlan}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Business Setup Component
function BusinessSetup({ onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: ''
  });

  const businessCategories = [
    'Restaurant', 'Retail', 'Entertainment', 'Services', 
    'Health & Wellness', 'Education', 'Non-profit', 'Other'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow p-8">
        <div className="text-center mb-8">
          <BuildingOfficeIcon className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Welcome! Let's set up your business profile</h2>
          <p className="text-gray-600 mt-2">This will help customers find and connect with you</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">Select a category</option>
              {businessCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Tell customers about your business..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Business Profile
          </button>
        </form>
      </div>
    </div>
  );
}

// Events Tab Component
function EventsTab({ events, business, currentTier, onUpdate }) {
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const handleDelete = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await eventService.deleteEvent(eventId);
        toast.success('Event deleted successfully');
        onUpdate();
      } catch (error) {
        toast.error('Error deleting event');
      }
    }
  };

  const canCreateMoreEvents = () => {
    if (currentTier.max_events_per_month === -1) return true;
    const thisMonth = new Date().getMonth();
    const eventsThisMonth = events.filter(e => 
      new Date(e.created_at).getMonth() === thisMonth
    ).length;
    return eventsThisMonth < currentTier.max_events_per_month;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Your Events</h3>
        {canCreateMoreEvents() ? (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Create Event
          </button>
        ) : (
          <div className="text-sm text-gray-600">
            Event limit reached for this month
          </div>
        )}
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
          <p className="text-gray-600 mb-4">Create your first event to start attracting customers!</p>
          {canCreateMoreEvents() && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Your First Event
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard 
              key={event.id} 
              event={event} 
              onEdit={() => {
                setEditingEvent(event);
                setShowModal(true);
              }}
              onDelete={() => handleDelete(event.id)}
            />
          ))}
        </div>
      )}

      {showModal && (
        <EventModal
          event={editingEvent}
          business={business}
          currentTier={currentTier}
          onClose={() => {
            setShowModal(false);
            setEditingEvent(null);
          }}
          onSave={onUpdate}
        />
      )}
    </div>
  );
}

// Event Card Component
function EventCard({ event, onEdit, onDelete }) {
  const isUpcoming = new Date(event.start_date) > new Date();
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      {event.event_images && event.event_images[0] ? (
        <img 
          src={event.event_images[0].image_url} 
          alt={event.title}
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
          <CalendarIcon className="w-16 h-16 text-gray-400" />
        </div>
      )}
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-semibold text-gray-900">{event.title}</h4>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            isUpcoming ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {isUpcoming ? 'Upcoming' : 'Past'}
          </span>
        </div>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{event.description}</p>
        
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            <span>{format(parseISO(event.start_date), 'MMM d, yyyy')}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPinIcon className="w-4 h-4" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className={`font-medium ${event.is_free ? 'text-green-600' : 'text-gray-900'}`}>
              {event.is_free ? 'Free' : `$${event.cost}`}
            </span>
            <div className="flex items-center gap-1">
              <EyeIcon className="w-4 h-4" />
              <span>{event.view_count || 0}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t flex gap-2">
          <button
            onClick={onEdit}
            className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="flex-1 px-3 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// Event Modal Component
function EventModal({ event, business, currentTier, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    category: event?.category || '',
    location: event?.location || '',
    address: event?.address || '',
    start_date: event?.start_date || '',
    end_date: event?.end_date || '',
    cost: event?.cost || 0,
    is_free: event?.is_free || false,
    age_min: event?.age_min || 0,
    age_max: event?.age_max || 99,
    website_url: event?.website_url || '',
    images: []
  });
  const [enhancing, setEnhancing] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const eventData = {
        ...formData,
        business_id: business.id,
        organizer_id: business.owner_id
      };

      if (event) {
        await eventService.updateEvent(event.id, eventData);
        toast.success('Event updated successfully!');
      } else {
        await eventService.createEvent(eventData, formData.images);
        toast.success('Event created successfully!');
      }
      onSave();
      onClose();
    } catch (error) {
      toast.error('Error saving event');
      console.error('Error:', error);
    }
  };

  const handleEnhanceDescription = async () => {
    if (!formData.title || !formData.description) {
      toast.error('Please provide a title and basic description first');
      return;
    }

    setEnhancing(true);
    try {
      const enhanced = await aiService.enhanceEventDescription({
        title: formData.title,
        category: formData.category,
        description: formData.description
      });
      setFormData({ ...formData, description: enhanced });
      toast.success('Description enhanced with AI!');
    } catch (error) {
      toast.error('Error enhancing description');
    } finally {
      setEnhancing(false);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length + formData.images.length > currentTier.max_images_per_event) {
      toast.error(`You can only upload ${currentTier.max_images_per_event} images per event`);
      return;
    }

    setUploadingImages(true);
    try {
      const uploadPromises = files.map(file => imageService.uploadImage(file));
      const uploadedUrls = await Promise.all(uploadPromises);
      
      setFormData({
        ...formData,
        images: [...formData.images, ...uploadedUrls.map(url => ({ url, caption: '' }))]
      });
      toast.success('Images uploaded successfully!');
    } catch (error) {
      toast.error('Error uploading images');
      console.error('Error:', error);
    } finally {
      setUploadingImages(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {event ? 'Edit Event' : 'Create New Event'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <div className="relative">
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  maxLength={currentTier.max_event_description_length}
                  className="w-full px-3 py-2 pr-40 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <div className="absolute bottom-2 right-2 flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {formData.description.length}/{currentTier.max_event_description_length}
                  </span>
                  {currentTier.ai_agent_enabled && (
                    <button
                      type="button"
                      onClick={handleEnhanceDescription}
                      disabled={enhancing || !formData.title}
                      className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 text-sm disabled:opacity-50"
                    >
                      <SparklesIcon className="w-4 h-4 mr-1" />
                      {enhancing ? 'Enhancing...' : 'Enhance'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">Select category</option>
                  {EVENT_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location/Venue *
                </label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pricing
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_free}
                    onChange={(e) => setFormData({ ...formData, is_free: e.target.checked, cost: 0 })}
                    className="mr-2"
                  />
                  <span className="text-sm">Free Event</span>
                </label>
                {!formData.is_free && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 w-24"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Age
                </label>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={formData.age_min}
                  onChange={(e) => setFormData({ ...formData, age_min: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Age
                </label>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={formData.age_max}
                  onChange={(e) => setFormData({ ...formData, age_max: parseInt(e.target.value) || 99 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Images (Max {currentTier.max_images_per_event})
              </label>
              <div className="space-y-2">
                {formData.images.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.images.map((img, index) => (
                      <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden">
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              images: formData.images.filter((_, i) => i !== index)
                            });
                          }}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <XMarkIcon className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <label className="block">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 cursor-pointer">
                    <PhotoIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      {uploadingImages ? 'Uploading...' : 'Click to upload images'}
                    </p>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImages || formData.images.length >= currentTier.max_images_per_event}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Website
              </label>
              <input
                type="url"
                value={formData.website_url}
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="https://example.com"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {event ? 'Update Event' : 'Create Event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Promote Tab Component
function PromoteTab({ events, business, onUpdate }) {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  const promotionPackages = [
    {
      id: 'basic',
      name: 'Basic Featured',
      price: 25,
      duration: '1 week',
      features: [
        'Featured placement on homepage',
        'Highlighted in relevant searches',
        'Basic analytics',
        '2x more visibility'
      ],
      color: 'blue'
    },
    {
      id: 'premium',
      name: 'Premium Spotlight',
      price: 50,
      duration: '1 week',
      features: [
        'Top featured placement',
        'Highlighted in ALL searches',
        'Detailed analytics dashboard',
        '5x more visibility',
        'Social media promotion',
        'Email newsletter inclusion'
      ],
      color: 'purple',
      popular: true
    },
    {
      id: 'ultimate',
      name: 'Ultimate Boost',
      price: 100,
      duration: '2 weeks',
      features: [
        'Exclusive top placement',
        'Priority in AI recommendations',
        'Full analytics suite',
        '10x more visibility',
        'Social media campaign',
        'Dedicated email blast',
        'Custom event graphics'
      ],
      color: 'gradient'
    }
  ];

  const handlePromoteEvent = async (event, packageType) => {
    setProcessingPayment(true);
    
    // In production, this would integrate with Stripe or another payment processor
    setTimeout(() => {
      toast.success(`🎉 ${event.title} is now being promoted with ${packageType.name}!`);
      setProcessingPayment(false);
      setSelectedEvent(null);
      onUpdate();
    }, 2000);
  };

  const upcomingEvents = events.filter(e => new Date(e.start_date) > new Date());

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Promote Your Events</h3>
        <p className="text-gray-600">
          Get more attendees by featuring your events prominently across Lethbridge AI
        </p>
      </div>

      {upcomingEvents.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <BanknotesIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming events to promote</h3>
          <p className="text-gray-600">Create an event first, then come back here to promote it!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Select Event */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Select an event to promote:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingEvents.map(event => (
                <div
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedEvent?.id === event.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <h5 className="font-medium text-gray-900">{event.title}</h5>
                  <p className="text-sm text-gray-600 mt-1">
                    {format(parseISO(event.start_date), 'MMM d, yyyy')} at {event.location}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-gray-500">
                      <EyeIcon className="w-4 h-4 inline mr-1" />
                      {event.view_count || 0} views
                    </span>
                    {event.featured && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                        Currently Featured
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Promotion Packages */}
          {selectedEvent && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Choose a promotion package:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {promotionPackages.map(pkg => (
                  <div
                    key={pkg.id}
                    className={`rounded-lg p-6 border-2 ${
                      pkg.popular ? 'border-purple-500 shadow-lg' : 'border-gray-200'
                    }`}
                  >
                    {pkg.popular && (
                      <div className="text-center mb-2">
                        <span className="bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                          MOST POPULAR
                        </span>
                      </div>
                    )}
                    <h5 className="text-lg font-bold text-center mb-2">{pkg.name}</h5>
                    <p className="text-3xl font-bold text-center mb-1">${pkg.price}</p>
                    <p className="text-sm text-gray-600 text-center mb-4">{pkg.duration}</p>
                    <ul className="space-y-2 mb-6">
                      {pkg.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckIcon className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => handlePromoteEvent(selectedEvent, pkg)}
                      disabled={processingPayment}
                      className={`w-full py-2 rounded-lg font-medium transition-colors ${
                        pkg.color === 'gradient'
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                          : pkg.color === 'purple'
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      } disabled:opacity-50`}
                    >
                      {processingPayment ? 'Processing...' : 'Select Package'}
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  💡 <strong>Pro tip:</strong> Events promoted with Premium or Ultimate packages 
                  see an average of 3-5x more attendees!
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Analytics Tab Component
function AnalyticsTab({ events, analytics, currentTier }) {
  const totalViews = events.reduce((sum, event) => sum + (event.view_count || 0), 0);
  const upcomingEvents = events.filter(e => new Date(e.start_date) > new Date()).length;
  const pastEvents = events.length - upcomingEvents;

  if (!currentTier.analytics_enabled) {
    return (
      <div className="text-center py-12">
        <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Analytics Requires Basic Plan or Higher
        </h3>
        <p className="text-gray-600 mb-6">
          Upgrade to see detailed insights about your events and audience.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-6">Event Analytics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Views</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{totalViews}</p>
            </div>
            <EyeIcon className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Upcoming Events</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{upcomingEvents}</p>
            </div>
            <CalendarIcon className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Past Events</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{pastEvents}</p>
            </div>
            <ChartBarIcon className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Top Performing Events */}
      <div>
        <h4 className="font-medium text-gray-900 mb-4">Top Performing Events</h4>
        <div className="space-y-3">
          {events
            .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
            .slice(0, 5)
            .map((event) => (
              <div key={event.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                <div>
                  <p className="font-medium text-gray-900">{event.title}</p>
                  <p className="text-sm text-gray-600">
                    {format(parseISO(event.start_date), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{event.view_count || 0}</p>
                  <p className="text-sm text-gray-600">views</p>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* AI Agent Analytics */}
      {analytics?.aiAgent && (
        <div className="mt-8">
          <h4 className="font-medium text-gray-900 mb-4">AI Assistant Performance</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Monthly Queries</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.aiAgent.monthly_queries_used} / {analytics.aiAgent.monthly_queries_limit}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Query Usage</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round((analytics.aiAgent.monthly_queries_used / analytics.aiAgent.monthly_queries_limit) * 100)}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Settings Tab Component
function SettingsTab({ business, currentTier, subscriptionTiers, onUpdate, onUpgrade }) {
  const [formData, setFormData] = useState({
    name: business.name,
    description: business.description || '',
    category: business.category,
    address: business.address || '',
    phone: business.phone || '',
    email: business.email || '',
    website: business.website || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await businessService.updateBusiness(business.id, formData);
      onUpdate(formData);
      toast.success('Business profile updated successfully!');
    } catch (error) {
      toast.error('Error updating business profile');
      console.error('Error:', error);
    }
  };

  return (
    <div>
      {/* Business Settings */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-6">Business Settings</h3>
        
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save Changes
          </button>
        </form>
      </div>

      {/* Subscription Plans */}
      <div>
        <h3 className="text-lg font-semibold mb-6">Subscription Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {subscriptionTiers.map(tier => (
            <div
              key={tier.id}
              className={`border rounded-lg p-6 ${
                tier.tier_name === currentTier.tier_name 
                  ? 'border-blue-500 bg-blue-50' 
                  : tier.tier_name === 'pro' 
                  ? 'border-purple-500 shadow-lg' 
                  : 'border-gray-200'
              }`}
            >
              {tier.tier_name === currentTier.tier_name && (
                <div className="text-center mb-2">
                  <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    CURRENT PLAN
                  </span>
                </div>
              )}
              {tier.tier_name === 'pro' && tier.tier_name !== currentTier.tier_name && (
                <div className="text-center mb-2">
                  <span className="bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    RECOMMENDED
                  </span>
                </div>
              )}
              <h4 className="text-lg font-bold text-center mb-2">{tier.display_name}</h4>
              <p className="text-3xl font-bold text-center mb-4">
                ${tier.price_monthly}
                <span className="text-sm text-gray-600 font-normal">/month</span>
              </p>
              <ul className="space-y-2 text-sm text-gray-600 mb-6">
                <li>
                  {tier.max_events_per_month === -1 
                    ? '✓ Unlimited events' 
                    : `✓ ${tier.max_events_per_month} events/month`}
                </li>
                {tier.ai_agent_enabled && (
                  <li>✓ AI Business Agent ({tier.ai_queries_per_month} queries)</li>
                )}
                {tier.analytics_enabled && <li>✓ Advanced Analytics</li>}
                {tier.featured_placement && <li>✓ Featured Placement</li>}
                <li>✓ {tier.max_images_per_event} images per event</li>
              </ul>
              {tier.tier_name !== currentTier.tier_name && (
                <button
                  onClick={() => onUpgrade(tier)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {tier.price_monthly > currentTier.price_monthly ? 'Upgrade' : 'Switch'} to {tier.display_name}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;