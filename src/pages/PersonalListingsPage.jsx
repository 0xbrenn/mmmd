import React, { useState, useEffect } from 'react';
import { personalListingService, imageService } from '../services/supabase';
import toast from 'react-hot-toast';
import { 
  HomeIcon, 
  TagIcon, 
  CalendarIcon,
  MapPinIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PhotoIcon,
  XMarkIcon,
  EyeIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftIcon,
  EnvelopeIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';

// Main listing types that match database constraint
const LISTING_TYPES = [
  { value: 'offer', label: 'Offering', icon: '🏷️' },
  { value: 'request', label: 'Looking For', icon: '🔍' },
  { value: 'event', label: 'Event/Activity', icon: '📅' }
];

// Categories for different types of listings
const LISTING_CATEGORIES = [
  { value: 'garage_sale', label: 'Garage Sale', icon: '🏠' },
  { value: 'estate_sale', label: 'Estate Sale', icon: '🏡' },
  { value: 'moving_sale', label: 'Moving Sale', icon: '📦' },
  { value: 'community_event', label: 'Community Event', icon: '👥' },
  { value: 'meetup', label: 'Meetup', icon: '🤝' },
  { value: 'study_group', label: 'Study Group', icon: '📚' },
  { value: 'book_club', label: 'Book Club', icon: '📖' },
  { value: 'sports_team', label: 'Sports Team', icon: '⚽' },
  { value: 'hobby_group', label: 'Hobby Group', icon: '🎨' },
  { value: 'other', label: 'Other', icon: '📌' }
];

const CONTACT_METHODS = [
  { value: 'in_app', label: 'In-App Message', icon: ChatBubbleLeftIcon },
  { value: 'email', label: 'Email', icon: EnvelopeIcon },
  { value: 'phone', label: 'Phone', icon: PhoneIcon }
];

function PersonalListingsPage({ user, profile }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    loadListings();
  }, [user]);

  const loadListings = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const data = await personalListingService.getUserListings(user.id);
      setListings(data || []);
    } catch (error) {
      console.error('Error loading listings:', error);
      toast.error('Failed to load listings');
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = listings.filter(listing => {
    if (filter !== 'all' && listing.category !== filter) return false;
    if (searchTerm && !listing.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !listing.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const handleEdit = (listing) => {
    setEditingListing(listing);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    
    try {
      await personalListingService.deleteListing(id, user.id);
      toast.success('Listing deleted successfully');
      loadListings();
    } catch (error) {
      console.error('Error deleting listing:', error);
      toast.error('Failed to delete listing');
    }
  };

  const handleCreateOrUpdate = async (listingData) => {
    try {
      if (editingListing) {
        await personalListingService.updateListing(editingListing.id, listingData);
        toast.success('Listing updated successfully');
      } else {
        await personalListingService.createListing(listingData, user.id);
        toast.success('Listing created successfully');
      }
      setShowModal(false);
      setEditingListing(null);
      loadListings();
    } catch (error) {
      console.error('Error saving listing:', error);
      toast.error(error.message || 'Failed to save listing');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Listings</h1>
            <p className="mt-2 text-gray-600">
              Create and manage your personal listings, garage sales, and community events
            </p>
          </div>
          <button
            onClick={() => {
              setEditingListing(null);
              setShowModal(true);
            }}
            disabled={!profile || profile.active_listings_count >= profile.max_listings_allowed}
            className={`flex items-center px-4 py-2 rounded-lg ${
              !profile || profile.active_listings_count >= profile.max_listings_allowed
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Create Listing
          </button>
        </div>

        {profile && profile.active_listings_count >= profile.max_listings_allowed && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              You've reached your listing limit ({profile.max_listings_allowed} listings). 
              Delete an existing listing or upgrade your account to create more.
            </p>
          </div>
        )}
      </div>

      {/* Filters and Search */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search listings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Categories</option>
              {LISTING_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
            <div className="flex border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Listings */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <TagIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No listings found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filter !== 'all' 
              ? 'Try adjusting your filters or search term.'
              : 'Create your first listing to get started!'}
          </p>
          {(!searchTerm && filter === 'all') && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PlusIcon className="w-5 h-5 inline mr-2" />
              Create Listing
            </button>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
        }>
          {filteredListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              viewMode={viewMode}
              onEdit={() => handleEdit(listing)}
              onDelete={() => handleDelete(listing.id)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <ListingModal
          listing={editingListing}
          onSave={handleCreateOrUpdate}
          onClose={() => {
            setShowModal(false);
            setEditingListing(null);
          }}
        />
      )}
    </div>
  );
}

// Listing Card Component
function ListingCard({ listing, viewMode, onEdit, onDelete }) {
  const listingType = LISTING_TYPES.find(t => t.value === listing.listing_type);
  const listingCategory = LISTING_CATEGORIES.find(c => c.value === listing.category);
  const contactMethod = CONTACT_METHODS.find(m => m.value === listing.contact_method);
  const ContactIcon = contactMethod?.icon || ChatBubbleLeftIcon;

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{listingCategory?.icon || '📌'}</span>
              <h3 className="text-lg font-semibold text-gray-900">{listing.title}</h3>
              <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700">
                {listingType?.label}
              </span>
              <span className={`px-2 py-1 text-xs rounded-full ${
                listing.is_active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {listing.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-gray-600 mb-3">{listing.description}</p>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              {listing.location && (
                <span className="flex items-center">
                  <MapPinIcon className="w-4 h-4 mr-1" />
                  {listing.location}
                </span>
              )}
              {listing.price !== null && (
                <span className="flex items-center">
                  <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                  {listing.price === 0 ? 'Free' : `$${listing.price}`}
                </span>
              )}
              <span className="flex items-center">
                <ContactIcon className="w-4 h-4 mr-1" />
                {contactMethod?.label}
              </span>
              {listing.start_date && (
                <span className="flex items-center">
                  <CalendarIcon className="w-4 h-4 mr-1" />
                  {format(parseISO(listing.start_date), 'MMM d, yyyy')}
                </span>
              )}
              <span className="flex items-center">
                <EyeIcon className="w-4 h-4 mr-1" />
                {listing.view_count} views
              </span>
            </div>
          </div>
          <div className="flex gap-2 ml-4">
            <button
              onClick={onEdit}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden">
      {/* Image or Icon */}
      <div className="h-48 bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        {listing.images && listing.images.length > 0 ? (
          <img 
            src={listing.images[0].url} 
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-6xl">{listingCategory?.icon || '📌'}</span>
        )}
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 flex-1">{listing.title}</h3>
          <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
            listing.is_active 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {listing.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>

        <p className="text-gray-600 mb-4 line-clamp-2">{listing.description}</p>

        <div className="space-y-2 text-sm text-gray-500">
          {listing.location && (
            <div className="flex items-center">
              <MapPinIcon className="w-4 h-4 mr-2" />
              {listing.location}
            </div>
          )}
          {listing.price !== null && (
            <div className="flex items-center">
              <CurrencyDollarIcon className="w-4 h-4 mr-2" />
              {listing.price === 0 ? 'Free' : `$${listing.price}`}
              {listing.price_type === 'negotiable' && ' (Negotiable)'}
            </div>
          )}
          <div className="flex items-center">
            <ContactIcon className="w-4 h-4 mr-2" />
            {contactMethod?.label}
          </div>
          {listing.start_date && (
            <div className="flex items-center">
              <CalendarIcon className="w-4 h-4 mr-2" />
              {format(parseISO(listing.start_date), 'MMM d, yyyy')}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <span className="text-sm text-gray-500 flex items-center">
            <EyeIcon className="w-4 h-4 mr-1" />
            {listing.view_count} views
          </span>
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Create/Edit Listing Modal
function ListingModal({ listing, onSave, onClose }) {
  const [formData, setFormData] = useState({
    title: listing?.title || '',
    description: listing?.description || '',
    category: listing?.category || 'other',
    listing_type: listing?.listing_type || 'offer',
    price: listing?.price || 0,
    price_type: listing?.price_type || 'fixed',
    location: listing?.location || '',
    contact_method: listing?.contact_method || 'in_app',
    contact_details: listing?.contact_details || {},
    start_date: listing?.start_date || '',
    end_date: listing?.end_date || '',
    is_active: listing?.is_active !== undefined ? listing.is_active : true,
    images: listing?.images || []
  });

  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const imageUrl = await imageService.uploadImage(file, 'listing-images');
      setFormData({
        ...formData,
        images: [...formData.images, { url: imageUrl, caption: '' }]
      });
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (index) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    
    if (!formData.description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    // Update contact details based on contact method
    const updatedFormData = { ...formData };
    if (formData.contact_method === 'email') {
      updatedFormData.contact_details = { email: formData.contact_details.email || '' };
    } else if (formData.contact_method === 'phone') {
      updatedFormData.contact_details = { phone: formData.contact_details.phone || '' };
    }

    onSave(updatedFormData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {listing ? 'Edit Listing' : 'Create New Listing'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="e.g., Moving Sale - Everything Must Go!"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Describe your listing in detail..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Listing Type *
                </label>
                <select
                  value={formData.listing_type}
                  onChange={(e) => setFormData({ ...formData, listing_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {LISTING_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {LISTING_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Location & Timing */}
          <div>
            <h3 className="text-lg font-medium mb-4">Location & Timing</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="e.g., 123 Main St, Lethbridge"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div>
            <h3 className="text-lg font-medium mb-4">Pricing</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price Type
                  </label>
                  <select
                    value={formData.price_type}
                    onChange={(e) => setFormData({ ...formData, price_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="fixed">Fixed Price</option>
                    <option value="negotiable">Negotiable</option>
                    <option value="free">Free</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-medium mb-4">Contact Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Method
                </label>
                <select
                  value={formData.contact_method}
                  onChange={(e) => setFormData({ ...formData, contact_method: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {CONTACT_METHODS.map(method => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>

              {formData.contact_method === 'email' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={formData.contact_details.email || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      contact_details: { ...formData.contact_details, email: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="your-email@example.com"
                  />
                </div>
              )}

              {formData.contact_method === 'phone' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.contact_details.phone || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      contact_details: { ...formData.contact_details, phone: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="(555) 123-4567"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Images */}
          <div>
            <h3 className="text-lg font-medium mb-4">Images</h3>
            <div className="space-y-4">
              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.url}
                        alt={`Listing image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <PhotoIcon className="w-8 h-8 mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      {uploadingImage ? 'Uploading...' : 'Click to upload image'}
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage || formData.images.length >= 5}
                  />
                </label>
              </div>
              
              {formData.images.length >= 5 && (
                <p className="text-sm text-gray-500 text-center">
                  Maximum 5 images allowed
                </p>
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-600"
              />
              <span className="ml-2 text-sm text-gray-700">
                Active listing (visible to others)
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {listing ? 'Update Listing' : 'Create Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PersonalListingsPage;