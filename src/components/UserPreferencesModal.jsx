import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

const EVENT_CATEGORIES = [
  'Family & Kids',
  'Sports & Recreation',
  'Arts & Culture',
  'Music & Concerts',
  'Food & Dining',
  'Community',
  'Education',
  'Business & Networking',
  'Health & Wellness',
  'Seasonal & Holiday'
];

const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 
  'Friday', 'Saturday', 'Sunday'
];

const PRICE_RANGES = [
  { value: 'free', label: 'Free Only', icon: '🎁' },
  { value: 'budget', label: 'Budget ($0-25)', icon: '💵' },
  { value: 'moderate', label: 'Moderate ($25-50)', icon: '💰' },
  { value: 'premium', label: 'Premium ($50+)', icon: '💎' },
  { value: 'any', label: 'Any Price', icon: '🌟' }
];

function UserPreferencesComponent({ userId, onSave, onClose }) {
  const [preferences, setPreferences] = useState({
    preferred_categories: [],
    excluded_categories: [],
    preferred_locations: [],
    max_distance_km: 25,
    has_children: false,
    children_ages: [],
    preferred_price_range: 'any',
    max_event_cost: null,
    preferred_days: [],
    notification_enabled: true,
    notification_frequency: 'weekly'
  });

  const [activeSection, setActiveSection] = useState('categories');
  const [saving, setSaving] = useState(false);
  const [newChildAge, setNewChildAge] = useState('');

  // Toggle category preference
  const toggleCategory = (category) => {
    if (preferences.preferred_categories.includes(category)) {
      setPreferences({
        ...preferences,
        preferred_categories: preferences.preferred_categories.filter(c => c !== category)
      });
    } else {
      setPreferences({
        ...preferences,
        preferred_categories: [...preferences.preferred_categories, category],
        excluded_categories: preferences.excluded_categories.filter(c => c !== category)
      });
    }
  };

  // Toggle excluded category
  const toggleExcludedCategory = (category) => {
    if (preferences.excluded_categories.includes(category)) {
      setPreferences({
        ...preferences,
        excluded_categories: preferences.excluded_categories.filter(c => c !== category)
      });
    } else {
      setPreferences({
        ...preferences,
        excluded_categories: [...preferences.excluded_categories, category],
        preferred_categories: preferences.preferred_categories.filter(c => c !== category)
      });
    }
  };

  // Toggle preferred day
  const toggleDay = (day) => {
    if (preferences.preferred_days.includes(day)) {
      setPreferences({
        ...preferences,
        preferred_days: preferences.preferred_days.filter(d => d !== day)
      });
    } else {
      setPreferences({
        ...preferences,
        preferred_days: [...preferences.preferred_days, day]
      });
    }
  };

  // Add child age
  const addChildAge = () => {
    const age = parseInt(newChildAge);
    if (!isNaN(age) && age >= 0 && age <= 18) {
      setPreferences({
        ...preferences,
        has_children: true,
        children_ages: [...preferences.children_ages, age].sort((a, b) => a - b)
      });
      setNewChildAge('');
    }
  };

  // Remove child age
  const removeChildAge = (age) => {
    const newAges = preferences.children_ages.filter(a => a !== age);
    setPreferences({
      ...preferences,
      children_ages: newAges,
      has_children: newAges.length > 0
    });
  };

  // Handle save
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(preferences);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50">
        <h2 className="text-xl font-bold text-gray-900">Personalize Your Experience</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-white/50 transition-colors"
        >
          <XMarkIcon className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-gray-50 p-4 overflow-y-auto">
          <nav className="space-y-2">
            {[
              { id: 'categories', label: 'Event Categories', icon: '🎭' },
              { id: 'family', label: 'Family Settings', icon: '👨‍👩‍👧‍👦' },
              { id: 'budget', label: 'Budget', icon: '💰' },
              { id: 'schedule', label: 'Schedule', icon: '📅' },
              { id: 'location', label: 'Location', icon: '📍' },
              { id: 'notifications', label: 'Notifications', icon: '🔔' }
            ].map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  activeSection === section.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <span className="text-lg">{section.icon}</span>
                <span className="text-sm font-medium">{section.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Categories Section */}
          {activeSection === 'categories' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Event Categories</h3>
              <p className="text-sm text-gray-600 mb-6">
                Select categories you're interested in. You can also exclude categories you never want to see.
              </p>

              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">I'm interested in:</h4>
                <div className="grid grid-cols-2 gap-3">
                  {EVENT_CATEGORIES.map(category => (
                    <button
                      key={category}
                      onClick={() => toggleCategory(category)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        preferences.preferred_categories.includes(category)
                          ? 'border-green-500 bg-green-50'
                          : preferences.excluded_categories.includes(category)
                          ? 'border-gray-200 bg-gray-50 opacity-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{category}</span>
                        {preferences.preferred_categories.includes(category) && (
                          <CheckIcon className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Never show me:</h4>
                <div className="grid grid-cols-2 gap-3">
                  {EVENT_CATEGORIES.map(category => (
                    <button
                      key={category}
                      onClick={() => toggleExcludedCategory(category)}
                      disabled={preferences.preferred_categories.includes(category)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        preferences.excluded_categories.includes(category)
                          ? 'border-red-500 bg-red-50'
                          : preferences.preferred_categories.includes(category)
                          ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{category}</span>
                        {preferences.excluded_categories.includes(category) && (
                          <XMarkIcon className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Family Section */}
          {activeSection === 'family' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Family Settings</h3>
              <p className="text-sm text-gray-600 mb-6">
                Help us find family-friendly events perfect for your children's ages.
              </p>

              <div className="mb-6">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={preferences.has_children}
                    onChange={(e) => setPreferences({ ...preferences, has_children: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600"
                  />
                  <span className="font-medium">I have children</span>
                </label>
              </div>

              {preferences.has_children && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Children's Ages:</h4>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {preferences.children_ages.map(age => (
                      <span
                        key={age}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        {age} years
                        <button
                          onClick={() => removeChildAge(age)}
                          className="ml-1 hover:text-blue-900"
                        >
                          <XMarkIcon className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      max="18"
                      value={newChildAge}
                      onChange={(e) => setNewChildAge(e.target.value)}
                      placeholder="Add age"
                      className="px-3 py-2 border border-gray-300 rounded-lg w-32"
                    />
                    <button
                      onClick={addChildAge}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Budget Section */}
          {activeSection === 'budget' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Budget Preferences</h3>
              <p className="text-sm text-gray-600 mb-6">
                Set your budget preferences for events and activities.
              </p>

              <div className="space-y-3">
                {PRICE_RANGES.map(range => (
                  <button
                    key={range.value}
                    onClick={() => setPreferences({ ...preferences, preferred_price_range: range.value })}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left flex items-center justify-between ${
                      preferences.preferred_price_range === range.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{range.icon}</span>
                      <span className="font-medium">{range.label}</span>
                    </div>
                    {preferences.preferred_price_range === range.value && (
                      <CheckIcon className="w-5 h-5 text-blue-600" />
                    )}
                  </button>
                ))}
              </div>

              {preferences.preferred_price_range !== 'free' && preferences.preferred_price_range !== 'any' && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum price per event ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={preferences.max_event_cost || ''}
                    onChange={(e) => setPreferences({ 
                      ...preferences, 
                      max_event_cost: e.target.value ? parseFloat(e.target.value) : null 
                    })}
                    placeholder="No limit"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              )}
            </div>
          )}

          {/* Schedule Section */}
          {activeSection === 'schedule' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Preferred Days</h3>
              <p className="text-sm text-gray-600 mb-6">
                Select the days when you're most likely to attend events.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {DAYS_OF_WEEK.map(day => (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      preferences.preferred_days.includes(day)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{day}</span>
                      {preferences.preferred_days.includes(day) && (
                        <CheckIcon className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Location Section */}
          {activeSection === 'location' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Location Preferences</h3>
              <p className="text-sm text-gray-600 mb-6">
                Set how far you're willing to travel for events.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum distance
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={preferences.max_distance_km}
                    onChange={(e) => setPreferences({ 
                      ...preferences, 
                      max_distance_km: parseInt(e.target.value) 
                    })}
                    className="flex-1"
                  />
                  <span className="font-medium text-blue-600 w-20 text-right">
                    {preferences.max_distance_km} km
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Section */}
          {activeSection === 'notifications' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Notification Settings</h3>
              <p className="text-sm text-gray-600 mb-6">
                Control how we notify you about new events.
              </p>

              <div className="space-y-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={preferences.notification_enabled}
                    onChange={(e) => setPreferences({ 
                      ...preferences, 
                      notification_enabled: e.target.checked 
                    })}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600"
                  />
                  <span className="font-medium">Enable notifications</span>
                </label>

                {preferences.notification_enabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notification frequency
                    </label>
                    <select
                      value={preferences.notification_frequency}
                      onChange={(e) => setPreferences({ 
                        ...preferences, 
                        notification_frequency: e.target.value 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}

export default UserPreferencesComponent;