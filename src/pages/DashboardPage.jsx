// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { businessService, eventService } from '../services/supabase';
import { aiService, EVENT_CATEGORIES } from '../services/openai';
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
  CheckIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

function DashboardPage({ user }) {
  const [activeTab, setActiveTab] = useState('events');
  const [business, setBusiness] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  useEffect(() => {
    loadBusinessData();
  }, [user]);

  const loadBusinessData = async () => {
    try {
      // Check if user has a business
      const businesses = await businessService.getBusinesses();
      const userBusiness = businesses.find(b => b.owner_id === user.id);
      
      if (userBusiness) {
        setBusiness(userBusiness);
        const businessEvents = await businessService.getBusinessEvents(userBusiness.id);
        setEvents(businessEvents);
      }
    } catch (error) {
      console.error('Error loading business data:', error);
      toast.error('Error loading your business data');
    } finally {
      setLoading(false);
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
    } catch (error) {
      toast.error('Error creating business profile');
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
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <BuildingOfficeIcon className="w-8 h-8 text-blue-600" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
              <p className="text-gray-600">{business.category}</p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-gray-500">Subscription</p>
            <p className="text-lg font-semibold capitalize">{business.subscription_tier}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('events')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'events'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <CalendarIcon className="w-4 h-4 inline mr-2" />
              Events
            </button>
            <button
              onClick={() => setActiveTab('promote')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'promote'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <SparklesIcon className="w-4 h-4 inline mr-2" />
              Promote
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'analytics'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ChartBarIcon className="w-4 h-4 inline mr-2" />
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'settings'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <BuildingOfficeIcon className="w-4 h-4 inline mr-2" />
              Settings
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'events' && (
            <EventsTab 
              events={events} 
              business={business}
              onUpdate={loadBusinessData}
            />
          )}
          {activeTab === 'promote' && (
            <PromoteTab 
              events={events} 
              business={business}
              onUpdate={loadBusinessData}
            />
          )}
          {activeTab === 'analytics' && <AnalyticsTab events={events} />}
          {activeTab === 'settings' && (
            <SettingsTab 
              business={business} 
              onUpdate={(updates) => setBusiness({ ...business, ...updates })}
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

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Your Business Profile</h2>
        
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
              <option value="Restaurant">Restaurant</option>
              <option value="Retail">Retail</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Services">Services</option>
              <option value="Non-profit">Non-profit</option>
              <option value="Government">Government</option>
              <option value="Other">Other</option>
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
function EventsTab({ events, business, onUpdate }) {
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Your Events</h3>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Create Event
        </button>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
          <p className="text-gray-600 mb-4">Create your first event to start attracting customers!</p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Create Your First Event
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{event.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <CalendarIcon className="w-4 h-4 mr-1" />
                      {format(parseISO(event.start_date), 'MMM d, yyyy')}
                    </span>
                    <span className="flex items-center">
                      <EyeIcon className="w-4 h-4 mr-1" />
                      {event.view_count || 0} views
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      event.is_free 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {event.is_free ? 'Free' : `${event.cost}`}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => {
                      setEditingEvent(event);
                      setShowModal(true);
                    }}
                    className="p-2 text-gray-600 hover:text-blue-600"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="p-2 text-gray-600 hover:text-red-600"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <EventModal
          event={editingEvent}
          business={business}
          onClose={() => {
            setShowModal(false);
            setEditingEvent(null);
          }}
          onSave={() => {
            setShowModal(false);
            setEditingEvent(null);
            onUpdate();
          }}
        />
      )}
    </div>
  );
}

// Event Modal Component
function EventModal({ event, business, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    location: event?.location || business.address || '',
    address: event?.address || business.address || '',
    start_date: event?.start_date ? format(parseISO(event.start_date), "yyyy-MM-dd'T'HH:mm") : '',
    end_date: event?.end_date ? format(parseISO(event.end_date), "yyyy-MM-dd'T'HH:mm") : '',
    category: event?.category || '',
    is_free: event?.is_free || false,
    cost: event?.cost || 0,
    age_min: event?.age_min || 0,
    age_max: event?.age_max || 99,
    website_url: event?.website_url || business.website || ''
  });
  const [enhancing, setEnhancing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const eventData = {
        ...formData,
        business_id: business.id,
        organizer_id: business.owner_id,
        cost: parseFloat(formData.cost) || 0
      };

      if (event) {
        await eventService.updateEvent(event.id, eventData);
        toast.success('Event updated successfully!');
      } else {
        await eventService.createEvent(eventData);
        toast.success('Event created successfully!');
      }
      onSave();
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {event ? 'Edit Event' : 'Create New Event'}
          </h2>

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
                  className="w-full px-3 py-2 pr-40 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                  placeholder="Describe your event..."
                />
                <button
                  type="button"
                  onClick={handleEnhanceDescription}
                  disabled={enhancing || !formData.title}
                  className="absolute bottom-2 right-2 inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 text-sm disabled:opacity-50 whitespace-nowrap"
                >
                  <SparklesIcon className="w-4 h-4 mr-1" />
                  {enhancing ? 'Enhancing...' : 'Enhance with AI'}
                </button>
              </div>
              {!formData.title && (
                <p className="text-xs text-gray-500 mt-1">Add a title first to enable AI enhancement</p>
              )}
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_free}
                    onChange={(e) => setFormData({ ...formData, is_free: e.target.checked })}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Free Event</span>
                </label>
              </div>

              {!formData.is_free && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              )}
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
                  onChange={(e) => setFormData({ ...formData, age_min: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, age_max: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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

      {/* Current Promotions */}
      <div className="mb-8">
        <h4 className="font-medium text-gray-900 mb-4">Active Promotions</h4>
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
          <p className="text-gray-600 text-center">
            No active promotions yet. Promote an event below to get started!
          </p>
        </div>
      </div>

      {/* Promotion Packages */}
      <div className="mb-8">
        <h4 className="font-medium text-gray-900 mb-4">Promotion Packages</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {promotionPackages.map((pkg) => (
            <div 
              key={pkg.id}
              className={`relative rounded-xl p-6 ${
                pkg.color === 'gradient' 
                  ? 'bg-gradient-to-br from-purple-500 to-blue-600 text-white' 
                  : pkg.color === 'purple'
                  ? 'bg-purple-50 border-2 border-purple-500'
                  : 'bg-blue-50 border border-blue-200'
              }`}
            >
              {pkg.popular && (
                <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white text-xs px-3 py-1 rounded-full">
                  Most Popular
                </span>
              )}
              
              <h5 className={`text-lg font-semibold mb-2 ${
                pkg.color === 'gradient' ? 'text-white' : 'text-gray-900'
              }`}>
                {pkg.name}
              </h5>
              
              <div className="mb-4">
                <span className={`text-3xl font-bold ${
                  pkg.color === 'gradient' ? 'text-white' : 'text-gray-900'
                }`}>
                  ${pkg.price}
                </span>
                <span className={`text-sm ${
                  pkg.color === 'gradient' ? 'text-blue-100' : 'text-gray-600'
                } ml-2`}>
                  / {pkg.duration}
                </span>
              </div>
              
              <ul className="space-y-2 mb-6">
                {pkg.features.map((feature, index) => (
                  <li 
                    key={index}
                    className={`flex items-start text-sm ${
                      pkg.color === 'gradient' ? 'text-blue-50' : 'text-gray-700'
                    }`}
                  >
                    <CheckIcon className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Select Event to Promote */}
      <div>
        <h4 className="font-medium text-gray-900 mb-4">Select an Event to Promote</h4>
        {upcomingEvents.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No upcoming events to promote.</p>
            <p className="text-sm text-gray-500 mt-1">Create an event first, then come back to promote it!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingEvents.map((event) => (
              <div 
                key={event.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
                onClick={() => setSelectedEvent(event)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-semibold text-gray-900">{event.title}</h5>
                    <p className="text-sm text-gray-600 mt-1">
                      {format(parseISO(event.start_date), 'MMM d, yyyy')} • {event.location}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Current views: {event.view_count || 0}
                    </p>
                  </div>
                  <button className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
                    Promote
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Promotion Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold">Promote: {selectedEvent.title}</h3>
                  <p className="text-gray-600">Choose a package to boost your event visibility</p>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {promotionPackages.map((pkg) => (
                  <div 
                    key={pkg.id}
                    className={`relative rounded-xl p-6 ${
                      pkg.color === 'gradient' 
                        ? 'bg-gradient-to-br from-purple-500 to-blue-600 text-white' 
                        : pkg.color === 'purple'
                        ? 'bg-purple-50 border-2 border-purple-500'
                        : 'bg-white border-2 border-gray-200'
                    }`}
                  >
                    <h5 className={`text-lg font-semibold mb-2 ${
                      pkg.color === 'gradient' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {pkg.name}
                    </h5>
                    
                    <div className="mb-4">
                      <span className={`text-2xl font-bold ${
                        pkg.color === 'gradient' ? 'text-white' : 'text-gray-900'
                      }`}>
                        ${pkg.price}
                      </span>
                      <span className={`text-sm ${
                        pkg.color === 'gradient' ? 'text-blue-100' : 'text-gray-600'
                      } ml-1`}>
                        / {pkg.duration}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => handlePromoteEvent(selectedEvent, pkg)}
                      disabled={processingPayment}
                      className={`w-full py-3 rounded-lg font-medium transition-all ${
                        pkg.color === 'gradient'
                          ? 'bg-white text-purple-600 hover:bg-gray-100'
                          : 'bg-purple-600 text-white hover:bg-purple-700'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
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
          </div>
        </div>
      )}
    </div>
  );
}

// Analytics Tab Component
function AnalyticsTab({ events }) {
  const totalViews = events.reduce((sum, event) => sum + (event.view_count || 0), 0);
  const upcomingEvents = events.filter(e => new Date(e.start_date) > new Date()).length;
  const pastEvents = events.length - upcomingEvents;

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
    </div>
  );
}

// Settings Tab Component
function SettingsTab({ business, onUpdate }) {
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

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </form>

      {/* Subscription Section */}
      <div className="mt-8 pt-8 border-t border-gray-200">
        <h4 className="font-medium text-gray-900 mb-4">Subscription Plan</h4>
        <div className="bg-gray-50 rounded-lg p-6">
          <p className="text-sm text-gray-600">Current Plan</p>
          <p className="text-xl font-semibold capitalize mt-1">{business.subscription_tier}</p>
          <p className="text-sm text-gray-600 mt-4">
            Upgrade to Premium for unlimited events, advanced analytics, and priority support.
          </p>
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Upgrade to Premium
          </button>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;