import React, { useState, useEffect } from 'react';
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

// Mock data for demonstration
const mockListings = [
  {
    id: '1',
    title: 'Huge Garage Sale - Everything Must Go!',
    description: 'Moving overseas, selling furniture, electronics, books, toys, and household items. Great deals!',
    listing_type: 'garage_sale',
    location: '123 Maple Street, Lethbridge',
    start_date: '2024-03-15T08:00:00',
    end_date: '2024-03-16T16:00:00',
    images: ['https://example.com/image1.jpg'],
    view_count: 45,
    is_active: true,
    moderation_status: 'approved',
    profiles: {
      display_name: 'Sarah Johnson',
      avatar_url: null
    }
  },
  {
    id: '2',
    title: 'Weekly Book Club Meeting',
    description: 'Join our friendly book club! This week we\'re discussing "The Great Gatsby". New members welcome!',
    listing_type: 'book_club',
    location: 'Lethbridge Public Library',
    start_date: '2024-03-20T18:30:00',
    end_date: '2024-03-20T20:00:00',
    images: [],
    view_count: 23,
    is_active: true,
    moderation_status: 'approved',
    profiles: {
      display_name: 'Book Lovers Group',
      avatar_url: null
    }
  }
];

function PersonalListingsPage({ user }) {
  const [listings, setListings] = useState(mockListings);
  const [showModal, setShowModal] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid or list

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

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      setListings(listings.filter(l => l.id !== id));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Community Listings</h1>
        <p className="text-gray-600">
          Discover garage sales, meetups, and community events in Lethbridge
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Search listings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
              />
              <TagIcon className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            {/* Type Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Types</option>
              {LISTING_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded ${
                  viewMode === 'grid' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded ${
                  viewMode === 'list' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600'
                }`}
              >
                List
              </button>
            </div>

            {/* Create Button */}
            {user && (
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Create Listing</span>
              </button>
            )}
          </div>
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
              : 'Be the first to create a community listing!'
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
          onSave={(newListing) => {
            if (editingListing) {
              setListings(listings.map(l => 
                l.id === editingListing.id ? { ...l, ...newListing } : l
              ));
            } else {
              setListings([...listings, { 
                ...newListing, 
                id: Date.now().toString(),
                view_count: 0,
                is_active: true,
                moderation_status: 'pending'
              }]);
            }
            setShowModal(false);
            setEditingListing(null);
          }}
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
            {listing.view_count}
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

// Create/Edit Listing Modal
function CreateListingModal({ listing, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: listing?.title || '',
    description: listing?.description || '',
    listing_type: listing?.listing_type || 'garage_sale',
    location: listing?.location || '',
    address: listing?.address || '',
    start_date: listing?.start_date || '',
    end_date: listing?.end_date || '',
    contact_method: listing?.contact_method || 'in_app',
    contact_info: listing?.contact_info || '',
    images: listing?.images || []
  });

  const handleSubmit = () => {
    // Validation
    if (!formData.title || !formData.location || !formData.start_date) {
      alert('Please fill in all required fields');
      return;
    }

    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {listing ? 'Edit Listing' : 'Create Community Listing'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., Huge Garage Sale - Everything Must Go!"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Listing Type *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {LISTING_TYPES.map(type => (
                  <button
                    key={type.value}
                    onClick={() => setFormData({ ...formData, listing_type: type.value })}
                    className={`p-3 rounded-lg border-2 transition-all text-left flex items-center gap-3 ${
                      formData.listing_type === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <span className="text-2xl">{type.icon}</span>
                    <span className="text-sm font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Describe your listing..."
              />
            </div>

            {/* Location */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location Name *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., My House, Community Center"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="123 Main St"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                  Click to upload images
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG up to 10MB
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {listing ? 'Update Listing' : 'Create Listing'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PersonalListingsPage;