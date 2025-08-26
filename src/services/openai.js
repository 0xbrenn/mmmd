// src/services/openai.js
import { eventService } from './supabase';
import { format, parseISO, isWithinInterval, addDays } from 'date-fns';

// Note: In production, you should proxy API calls through your backend
// For development/demo purposes, we'll use the API key directly with a warning
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

if (!OPENAI_API_KEY || OPENAI_API_KEY === 'placeholder-key') {
  console.warn('⚠️ OpenAI API key not found. AI features will not work.');
}

// Categories for events
export const EVENT_CATEGORIES = [
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

// Direct API calls to OpenAI
async function callOpenAI(messages, options = {}) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 300,
        ...options
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw error;
  }
}

// Parse user query to extract intent and filters
async function parseUserQuery(query) {
  const systemPrompt = `You are an AI assistant for Lethbridge, Alberta. Parse the user's query about local events and extract:
  1. Date/time preferences (today, this weekend, next week, specific dates)
  2. Event categories from this list: ${EVENT_CATEGORIES.join(', ')}
  3. Age requirements (if mentioned, especially for children)
  4. Budget preferences (free events, price range)
  5. Location preferences within Lethbridge
  
  Return a JSON object with these filters. Be smart about interpreting queries like "something fun for my 3 year old" or "free activities this weekend".
  
  Example response format:
  {
    "dateRange": "this_weekend",
    "categories": ["Family & Kids"],
    "ageRange": 3,
    "isFree": true
  }`;

  try {
    const response = await callOpenAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: query }
    ], {
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response);
  } catch (error) {
    console.error('Error parsing query:', error);
    return {};
  }
}

// Filter events based on parsed query
function filterEvents(events, filters) {
  return events.filter(event => {
    // Date filtering
    if (filters.dateRange) {
      const eventDate = parseISO(event.start_date);
      const now = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          if (!isWithinInterval(eventDate, { 
            start: now, 
            end: addDays(now, 1) 
          })) return false;
          break;
        case 'this_weekend':
          const weekendStart = addDays(now, (6 - now.getDay()) % 7);
          const weekendEnd = addDays(weekendStart, 2);
          if (!isWithinInterval(eventDate, { 
            start: weekendStart, 
            end: weekendEnd 
          })) return false;
          break;
        case 'next_week':
          if (!isWithinInterval(eventDate, { 
            start: now, 
            end: addDays(now, 7) 
          })) return false;
          break;
      }
    }

    // Category filtering
    if (filters.categories && filters.categories.length > 0) {
      if (!filters.categories.includes(event.category)) return false;
    }

    // Age filtering
    if (filters.ageRange !== undefined) {
      if (event.age_min > filters.ageRange || event.age_max < filters.ageRange) {
        return false;
      }
    }

    // Price filtering
    if (filters.isFree && !event.is_free) return false;
    if (filters.maxPrice !== undefined && event.cost > filters.maxPrice) return false;

    return true;
  });
}

// Generate natural language response
async function generateEventResponse(events, originalQuery) {
  if (events.length === 0) {
    return "I couldn't find any events matching your criteria. Try broadening your search or checking back later for new events!";
  }

  const eventDescriptions = events.slice(0, 5).map(event => 
    `- ${event.title} at ${event.location} on ${format(parseISO(event.start_date), 'EEEE, MMMM d at h:mm a')}. ${event.is_free ? 'Free event!' : `Cost: ${event.cost}`}`
  ).join('\n');

  const systemPrompt = `You are a friendly AI assistant for Lethbridge, Alberta. 
  Create a natural, conversational response about these local events based on the user's query.
  Be helpful, enthusiastic, and include practical details like times, costs, and locations.
  If events are good for families or specific age groups, mention that.`;

  try {
    const response = await callOpenAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `User asked: "${originalQuery}"\n\nHere are the matching events:\n${eventDescriptions}\n\nProvide a friendly, helpful response.` }
    ], {
      temperature: 0.7,
      max_tokens: 300
    });

    return response;
  } catch (error) {
    console.error('Error generating response:', error);
    return `I found ${events.length} events for you:\n${eventDescriptions}`;
  }
}

// Main AI service
export const aiService = {
  async searchEvents(query) {
    try {
      // Parse the user's natural language query
      const filters = await parseUserQuery(query);
      console.log('Parsed filters:', filters);

      // Get all upcoming events from Supabase
      const allEvents = await eventService.searchEvents({});

      // Filter events based on parsed criteria
      const matchingEvents = filterEvents(allEvents, filters);

      // Generate a natural language response
      const response = await generateEventResponse(matchingEvents, query);

      return {
        message: response,
        events: matchingEvents,
        filters: filters
      };
    } catch (error) {
      console.error('AI search error:', error);
      return {
        message: "I'm having trouble searching for events right now. Please try again later.",
        events: [],
        error: error.message
      };
    }
  },

  // Generate event suggestions based on user preferences
  async getSuggestions(userPreferences) {
    const prompt = `Based on these preferences: ${JSON.stringify(userPreferences)}, 
    suggest 3 types of events in Lethbridge that would be interesting.`;

    try {
      const response = await callOpenAI([
        { role: 'system', content: 'You are a helpful assistant for Lethbridge events.' },
        { role: 'user', content: prompt }
      ], {
        temperature: 0.8,
        max_tokens: 150
      });

      return response;
    } catch (error) {
      console.error('Error generating suggestions:', error);
      return null;
    }
  },

  // Help businesses write better event descriptions
  async enhanceEventDescription(basicInfo) {
    const prompt = `Help write an engaging event description for Lethbridge residents:
    Title: ${basicInfo.title}
    Category: ${basicInfo.category}
    Basic details: ${basicInfo.description}
    
    Create a compelling 2-3 sentence description that would attract attendees.`;

    try {
      const response = await callOpenAI([
        { role: 'system', content: 'You are a creative marketing writer for local events.' },
        { role: 'user', content: prompt }
      ], {
        temperature: 0.7,
        max_tokens: 100
      });

      return response;
    } catch (error) {
      console.error('Error enhancing description:', error);
      return basicInfo.description;
    }
  }
};