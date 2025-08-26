import React, { useState, useEffect } from 'react';
import { personalListingService } from '../services/supabase';
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
  EyeIcon
} from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';

const LISTING_TYPES = [
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
  { value: 'in_app', label: 'In-App Message' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' }
];

function PersonalListingsPage({ user }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');

  // Load listings from database on component mount
  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    setLoading(true);
    try {
      const data = await personalListingService.getListings();
      setListings(data || []);
    } catch (error) {
      console.error('Error loading listings:', error);
      toast.error('Failed to load listings');
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter listings
  const filteredListings = listings.filter(listing => {
    if (filter !== 'all' && listing.listing_type !== filter) return false;
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
      setListings(listings.filter(l => l.id !== id));
      toast.success('Listing deleted successfully');
    } catch (error) {
      console.error('Error deleting listing:', error);
      toast.error('Failed to delete listing');
    }
  };

  const handleSave = async (formData) => {
    try {
      if (editingListing) {
        // Update existing listing
        const updated = await personalListingService.updateListing(editingListing.id, formData);
        setListings(listings.map(l => l.id === editingListing.id ? updated : l));
        toast.success('Listing updated successfully');
      } else {
        // Create new listing with required fields
        const newListing = await personalListingService.createListing({
          ...formData,
          user_id: user.id,
          category: 'community', // Add default category
          is_active: true,
          images: formData.images || [],
          contact_method: formData.contact_method || 'in_app'
        });
        
        // Add the new listing with profile info
        const listingWithProfile = {
          ...newListing,
          profiles: {
            display_name: user.email?.split('@')[0] || 'User',
            avatar_url: null
          }
        };
        
        setListings([listingWithProfile, ...listings]);
        toast.success('Listing created successfully');
      }
      setShowModal(false);
      setEditingListing(null);
    } catch (error) {
      console.error('Error saving listing:', error);
      toast.error(error.message || 'Failed to save listing');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Community Listings</h1>
        <p className="text-gray-600">
          Discover garage sales, meetups, study groups, and local community events
        </p>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search listings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <TagIcon className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
            </div>

            {/* Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Types</option>
              {LISTING_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>

            {/* View Mode */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Create Button */}
          {user && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Listing
            </button>
          )}
        </div>
      </div>

      {/* Listings */}
      {filteredListings.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <HomeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No listings found</h3>
          <p className="text-gray-600">
            {searchTerm || filter !== 'all' 
              ? 'Try adjusting your search or filters'
              : user ? 'Be the first to create a community listing!' : 'Sign in to create a listing'
            }
          </p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredListings.map(listing => (
            <ListingCard
              key={listing.id}
              listing={listing}
              viewMode={viewMode}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isOwner={user?.id === listing.user_id}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <CreateListingModal
          listing={editingListing}
          onClose={() => {
            setShowModal(false);
            setEditingListing(null);
          }}
          onSave={handleSave}
          user={user}
        />
      )}
    </div>
  );
}

// Listing Card Component
function ListingCard({ listing, viewMode, onEdit, onDelete, isOwner }) {
  const listingType = LISTING_TYPES.find(t => t.value === listing.listing_type);

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-3xl">{listingType?.icon || '📌'}</div>
          <div>
            <h3 className="font-semibold text-gray-900">{listing.title}</h3>
            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
              <span className="flex items-center gap-1">
                <CalendarIcon className="w-4 h-4" />
                {format(parseISO(listing.start_date), 'MMM d')}
              </span>
              <span className="flex items-center gap-1">
                <MapPinIcon className="w-4 h-4" />
                {listing.location}
              </span>
              <span className="flex items-center gap-1">
                <EyeIcon className="w-4 h-4" />
                {listing.view_count} views
              </span>
            </div>
          </div>
        </div>
        {isOwner && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(listing)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(listing.id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
      {listing.images && listing.images.length > 0 ? (
        <img
          src={listing.images[0]}
          alt={listing.title}
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-2">{listingType?.icon || '📌'}</div>
            <span className="text-sm text-gray-500">{listingType?.label}</span>
          </div>
        </div>
      )}

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2">{listing.title}</h3>
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {listing.description}
        </p>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <CalendarIcon className="w-4 h-4" />
            <span>
              {format(parseISO(listing.start_date), 'MMM d, h:mm a')}
              {listing.end_date && ` - ${format(parseISO(listing.end_date), 'h:mm a')}`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <MapPinIcon className="w-4 h-4" />
            <span className="line-clamp-1">{listing.location}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium">
                {listing.profiles?.display_name?.charAt(0) || 'U'}
              </span>
            </div>
            <span className="text-sm text-gray-600">
              {listing.profiles?.display_name || 'Community Member'}
            </span>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <EyeIcon className="w-4 h-4" />
            {listing.view_count || 0}
          </div>
        </div>

        {isOwner && (
          <div className="mt-3 pt-3 border-t flex justify-end gap-2">
            <button
              onClick={() => onEdit(listing)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(listing.id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Create/Edit Modal
function CreateListingModal({ listing, onClose, onSave, user }) {
  const [formData, setFormData] = useState({
    title: listing?.title || '',
    description: listing?.description || '',
    listing_type: listing?.listing_type || 'garage_sale',
    location: listing?.location || '',
    address: listing?.address || '',
    start_date: listing?.start_date ? listing.start_date.slice(0, 16) : '',
    end_date: listing?.end_date ? listing.end_date.slice(0, 16) : '',
    contact_method: listing?.contact_method || 'in_app',
    images: listing?.images || []
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.location || !formData.start_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {listing ? 'Edit Listing' : 'Create New Listing'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="e.g., Huge Garage Sale This Weekend!"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Describe your listing..."
              />
            </div>

            {/* Listing Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {LISTING_TYPES.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, listing_type: type.value })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.listing_type === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-2xl mb-1">{type.icon}</div>
                    <div className="text-sm font-medium">{type.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location *
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="e.g., 123 Main Street, Lethbridge"
              />
            </div>

            {/* Date & Time */}
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

            {/* Contact Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Method
              </label>
              <div className="grid grid-cols-3 gap-3">
                {CONTACT_METHODS.map(method => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, contact_method: method.value })}
                    className={`p-2 rounded-lg border-2 transition-all text-center ${
                      formData.contact_method === method.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <span className="text-sm font-medium">{method.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Images
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 cursor-pointer">
                <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Image upload coming soon
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG up to 10MB
                </p>
              </div>
            </div>

            {/* Form Actions */}
            <div className="mt-6 flex justify-end gap-3">
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
                {listing ? 'Update Listing' : 'Create Listing'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default PersonalListingsPage;