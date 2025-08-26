import React, { useState, useEffect } from 'react';
import { 
  SparklesIcon, 
  ChatBubbleBottomCenterTextIcon,
  CogIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

const PERSONALITY_TYPES = [
  {
    value: 'professional',
    label: 'Professional',
    description: 'Formal and business-like',
    icon: '👔',
    example: 'Good day. I would be happy to assist you with information about our services.'
  },
  {
    value: 'friendly',
    label: 'Friendly',
    description: 'Warm and welcoming',
    icon: '😊',
    example: 'Hi there! I\'m here to help you with anything you need to know about us!'
  },
  {
    value: 'casual',
    label: 'Casual',
    description: 'Relaxed and conversational',
    icon: '🎉',
    example: 'Hey! What can I help you with today?'
  }
];

function BusinessAIAgentSetup({ businessId, businessInfo, currentConfig, onSave, onClose }) {
  const [config, setConfig] = useState({
    agent_name: businessInfo?.name ? `${businessInfo.name} Assistant` : 'Business Assistant',
    agent_personality: 'friendly',
    enabled: false,
    response_style: 'friendly',
    max_response_length: 300,
    business_info: {
      name: businessInfo?.name || '',
      description: businessInfo?.description || '',
      category: businessInfo?.category || '',
      address: businessInfo?.address || '',
      phone: businessInfo?.phone || '',
      email: businessInfo?.email || '',
      website: businessInfo?.website || '',
      operating_hours: {}
    },
    menu_data: {},
    faq_data: [],
    policies: {},
    ...currentConfig
  });

  const [activeTab, setActiveTab] = useState('basics');
  const [testMessage, setTestMessage] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Operating hours template
  const defaultHours = {
    monday: { open: '09:00', close: '17:00', closed: false },
    tuesday: { open: '09:00', close: '17:00', closed: false },
    wednesday: { open: '09:00', close: '17:00', closed: false },
    thursday: { open: '09:00', close: '17:00', closed: false },
    friday: { open: '09:00', close: '17:00', closed: false },
    saturday: { open: '10:00', close: '16:00', closed: false },
    sunday: { open: '10:00', close: '16:00', closed: true }
  };

  useEffect(() => {
    if (!config.business_info.operating_hours || Object.keys(config.business_info.operating_hours).length === 0) {
      setConfig(prev => ({
        ...prev,
        business_info: {
          ...prev.business_info,
          operating_hours: defaultHours
        }
      }));
    }
  }, []);

  // Add FAQ
  const addFAQ = () => {
    setConfig({
      ...config,
      faq_data: [...config.faq_data, { question: '', answer: '' }]
    });
  };

  // Update FAQ
  const updateFAQ = (index, field, value) => {
    const newFAQs = [...config.faq_data];
    newFAQs[index][field] = value;
    setConfig({ ...config, faq_data: newFAQs });
  };

  // Remove FAQ
  const removeFAQ = (index) => {
    setConfig({
      ...config,
      faq_data: config.faq_data.filter((_, i) => i !== index)
    });
  };

  // Test the agent
  const testAgent = async () => {
    if (!testMessage.trim()) return;
    
    setTesting(true);
    setTestResponse('');
    
    // Simulate API call
    setTimeout(() => {
      const responses = {
        professional: "Thank you for your inquiry. Based on the information provided, I can assist you with...",
        friendly: "Great question! I'd be happy to help you with that...",
        casual: "Hey, good question! So here's what I can tell you..."
      };
      
      setTestResponse(responses[config.agent_personality] || "I'm here to help!");
      setTesting(false);
    }, 1500);
  };

  // Validate configuration
  const validateConfig = () => {
    const newErrors = {};
    
    if (!config.agent_name || config.agent_name.length < 3) {
      newErrors.agent_name = 'Agent name must be at least 3 characters';
    }
    
    if (!config.business_info.name) {
      newErrors.business_name = 'Business name is required';
    }
    
    if (config.max_response_length < 50 || config.max_response_length > 1000) {
      newErrors.response_length = 'Response length must be between 50 and 1000';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = async () => {
    if (!validateConfig()) return;
    
    setSaving(true);
    try {
      await onSave(config);
    } finally {
      setSaving(false);
    }
  };

  // Update operating hours
  const updateOperatingHours = (day, field, value) => {
    setConfig({
      ...config,
      business_info: {
        ...config.business_info,
        operating_hours: {
          ...config.business_info.operating_hours,
          [day]: {
            ...config.business_info.operating_hours[day],
            [field]: value
          }
        }
      }
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <SparklesIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">AI Assistant Setup</h2>
              <p className="text-sm text-gray-600">Configure your business AI agent</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {config.enabled ? (
              <span className="flex items-center gap-1 text-green-600 text-sm">
                <CheckCircleIcon className="w-4 h-4" />
                Active
              </span>
            ) : (
              <span className="flex items-center gap-1 text-gray-400 text-sm">
                <ExclamationCircleIcon className="w-4 h-4" />
                Inactive
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex px-6">
          {[
            { id: 'basics', label: 'Basics', icon: CogIcon },
            { id: 'knowledge', label: 'Knowledge Base', icon: ChatBubbleBottomCenterTextIcon },
            { id: 'test', label: 'Test Agent', icon: SparklesIcon }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Basics Tab */}
        {activeTab === 'basics' && (
          <div className="space-y-6">
            {/* Agent Settings */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Agent Settings</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Agent Name
                  </label>
                  <input
                    type="text"
                    value={config.agent_name}
                    onChange={(e) => setConfig({ ...config, agent_name: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      errors.agent_name ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.agent_name && (
                    <p className="text-sm text-red-600 mt-1">{errors.agent_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Response Length
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="50"
                      max="1000"
                      step="50"
                      value={config.max_response_length}
                      onChange={(e) => setConfig({ 
                        ...config, 
                        max_response_length: parseInt(e.target.value) 
                      })}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium text-blue-600 w-20">
                      {config.max_response_length} chars
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Personality Selection */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Agent Personality</h3>
              <div className="grid grid-cols-3 gap-4">
                {PERSONALITY_TYPES.map(personality => (
                  <button
                    key={personality.value}
                    onClick={() => setConfig({ 
                      ...config, 
                      agent_personality: personality.value,
                      response_style: personality.value 
                    })}
                    className={`p-4 rounded-lg border-2 transition-all text-center ${
                      config.agent_personality === personality.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-3xl mb-2">{personality.icon}</div>
                    <div className="font-medium mb-1">{personality.label}</div>
                    <div className="text-xs text-gray-600 mb-3">
                      {personality.description}
                    </div>
                    <div className="text-xs text-gray-500 italic">
                      "{personality.example}"
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Business Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Business Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={config.business_info.name}
                    onChange={(e) => setConfig({
                      ...config,
                      business_info: { ...config.business_info, name: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={config.business_info.category}
                    onChange={(e) => setConfig({
                      ...config,
                      business_info: { ...config.business_info, category: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={config.business_info.description}
                    onChange={(e) => setConfig({
                      ...config,
                      business_info: { ...config.business_info, description: e.target.value }
                    })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={config.business_info.phone}
                    onChange={(e) => setConfig({
                      ...config,
                      business_info: { ...config.business_info, phone: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={config.business_info.email}
                    onChange={(e) => setConfig({
                      ...config,
                      business_info: { ...config.business_info, email: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Operating Hours */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Operating Hours</h3>
              <div className="space-y-2">
                {Object.entries(config.business_info.operating_hours || {}).map(([day, hours]) => (
                  <div key={day} className="flex items-center gap-4 py-2">
                    <div className="w-24 capitalize font-medium text-sm">
                      {day}
                    </div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!hours.closed}
                        onChange={(e) => updateOperatingHours(day, 'closed', !e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Open</span>
                    </label>
                    {!hours.closed && (
                      <>
                        <input
                          type="time"
                          value={hours.open}
                          onChange={(e) => updateOperatingHours(day, 'open', e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                          type="time"
                          value={hours.close}
                          onChange={(e) => updateOperatingHours(day, 'close', e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Knowledge Base Tab */}
        {activeTab === 'knowledge' && (
          <div className="space-y-6">
            {/* FAQs */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Frequently Asked Questions</h3>
                <button
                  onClick={addFAQ}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add FAQ
                </button>
              </div>

              {config.faq_data.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">No FAQs added yet.</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Add common questions to help your AI assistant provide better answers.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {config.faq_data.map((faq, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 space-y-3">
                          <input
                            type="text"
                            value={faq.question}
                            onChange={(e) => updateFAQ(index, 'question', e.target.value)}
                            placeholder="Question"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                          <textarea
                            value={faq.answer}
                            onChange={(e) => updateFAQ(index, 'answer', e.target.value)}
                            placeholder="Answer"
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <button
                          onClick={() => removeFAQ(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Menu/Services */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Menu/Services</h3>
              <textarea
                value={JSON.stringify(config.menu_data, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    setConfig({ ...config, menu_data: parsed });
                  } catch {}
                }}
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                placeholder='Example:
{
  "appetizers": [
    {"name": "Wings", "price": "$12.99", "description": "Buffalo or BBQ"}
  ],
  "mains": [
    {"name": "Burger", "price": "$15.99", "description": "Angus beef with fries"}
  ]
}'
              />
            </div>

            {/* Policies */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Business Policies</h3>
              <textarea
                value={JSON.stringify(config.policies, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    setConfig({ ...config, policies: parsed });
                  } catch {}
                }}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                placeholder='Example:
{
  "cancellation": "24 hours notice required",
  "refunds": "Full refund within 7 days",
  "appointments": "Book online or call"
}'
              />
            </div>
          </div>
        )}

        {/* Test Tab */}
        {activeTab === 'test' && (
          <div>
            <div className="max-w-3xl mx-auto">
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  Test your AI assistant to see how it responds to customer questions.
                  The agent will use the information you've configured.
                </p>
              </div>

              {/* Test Chat Interface */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <SparklesIcon className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium">{config.agent_name}</span>
                  </div>
                </div>

                <div className="h-80 overflow-y-auto p-4 bg-gray-50">
                  {/* Welcome Message */}
                  <div className="flex gap-3 mb-4">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <SparklesIcon className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white rounded-lg p-3 max-w-md">
                      <p className="text-sm">
                        {config.agent_personality === 'professional' 
                          ? `Good day. I'm ${config.agent_name}. How may I assist you today?`
                          : config.agent_personality === 'friendly'
                          ? `Hi there! I'm ${config.agent_name} 👋 What can I help you with today?`
                          : `Hey! I'm ${config.agent_name}. What's up?`
                        }
                      </p>
                    </div>
                  </div>

                  {/* Test Response */}
                  {testResponse && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <SparklesIcon className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-white rounded-lg p-3 max-w-md">
                        <p className="text-sm">{testResponse}</p>
                      </div>
                    </div>
                  )}

                  {testing && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <SparklesIcon className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t bg-white">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && testAgent()}
                      placeholder="Type a test message..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <button
                      onClick={testAgent}
                      disabled={testing || !testMessage.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>

              {/* Test Suggestions */}
              <div className="mt-6">
                <p className="text-sm font-medium text-gray-700 mb-2">Try these questions:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "What are your hours?",
                    "Do you have parking?",
                    "What's on the menu?",
                    "How do I make a reservation?",
                    "What's your cancellation policy?"
                  ].map(question => (
                    <button
                      key={question}
                      onClick={() => setTestMessage(question)}
                      className="px-3 py-1 bg-gray-100 text-sm text-gray-700 rounded-full hover:bg-gray-200"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t bg-gray-50">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300 text-blue-600"
            />
            <span className="font-medium">Enable AI Assistant</span>
          </label>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BusinessAIAgentSetup;