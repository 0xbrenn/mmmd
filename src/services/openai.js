// src/services/openai.js
import { eventService, preferencesService, personalListingService } from './supabase';
import { format, parseISO, isWithinInterval, addDays } from 'date-fns';

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

// Categories for personal listings
export const PERSONAL_LISTING_CATEGORIES = [
  'Garage Sale',
  'Estate Sale',
  'Moving Sale',
  'Community Event',
  'Meetup',
  'Study Group',
  'Book Club',
  'Sports Team',
  'Hobby Group',
  'Other'
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
        model: options.model || 'gpt-3.5-turbo',
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

// Enhanced query parser with personal listings support
async function parseUserQuery(query, includePersonalListings = true) {
  const systemPrompt = `You are an AI assistant for Lethbridge, Alberta. Parse the user's query about local events and activities and extract:
  1. Date/time preferences (today, this weekend, next week, specific dates)
  2. Event categories from this list: ${EVENT_CATEGORIES.join(', ')}
  3. Personal listing types from this list: ${PERSONAL_LISTING_CATEGORIES.join(', ')}
  4. Whether they want business events, personal listings, or both
  5. Age requirements (if mentioned, especially for children)
  6. Budget preferences (free events, price range)
  7. Location preferences within Lethbridge
  8. Keywords that might indicate garage sales or community events
  
  Return a JSON object with these filters. Be smart about interpreting queries like:
  - "garage sales this weekend" -> personal listings of type garage sale
  - "family activities" -> could include both events and community meetups
  - "something for my 3 year old" -> age requirement
  - If the query mentions searching for something specific, always include personal listings
  
  Example response format:
  {
    "dateRange": "this_weekend",
    "eventCategories": ["Family & Kids"],
    "personalListingTypes": ["Garage Sale"],
    "includeBusinessEvents": true,
    "includePersonalListings": true,
    "ageRange": 3,
    "isFree": true,
    "keywords": ["garage", "sale"]
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
    // Fallback: extract keywords manually if OpenAI fails
    const words = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    return {
      includeBusinessEvents: true,
      includePersonalListings: true,
      keywords: words
    };
  }
}

// Filter events based on parsed query
function filterEvents(events, filters) {
  return events.filter(event => {
    // Date filtering
    if (filters.dateRange && event.start_date) {
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
    if (filters.eventCategories && filters.eventCategories.length > 0) {
      if (!filters.eventCategories.includes(event.category)) return false;
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

    // Keyword filtering
    if (filters.keywords && filters.keywords.length > 0) {
      const searchText = `${event.title} ${event.description || ''}`.toLowerCase();
      if (!filters.keywords.some(keyword => 
        searchText.includes(keyword.toLowerCase())
      )) return false;
    }

    return true;
  });
}

// Filter personal listings
function filterPersonalListings(listings, filters) {
  return listings.filter(listing => {
    // Date filtering - only if listing has a date
    if (filters.dateRange && listing.start_date) {
      const listingDate = parseISO(listing.start_date);
      const now = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          if (!isWithinInterval(listingDate, { 
            start: now, 
            end: addDays(now, 1) 
          })) return false;
          break;
        case 'this_weekend':
          const weekendStart = addDays(now, (6 - now.getDay()) % 7);
          const weekendEnd = addDays(weekendStart, 2);
          if (!isWithinInterval(listingDate, { 
            start: weekendStart, 
            end: weekendEnd 
          })) return false;
          break;
        case 'next_week':
          if (!isWithinInterval(listingDate, { 
            start: now, 
            end: addDays(now, 7) 
          })) return false;
          break;
      }
    }

    // Category filtering (personal listings use category field)
    if (filters.personalListingTypes && filters.personalListingTypes.length > 0) {
      const listingCategory = listing.category?.toLowerCase() || '';
      if (!filters.personalListingTypes.some(type => 
        listingCategory.includes(type.toLowerCase())
      )) return false;
    }

    // Keyword filtering
    if (filters.keywords && filters.keywords.length > 0) {
      const searchText = `${listing.title} ${listing.description || ''}`.toLowerCase();
      const hasKeyword = filters.keywords.some(keyword => 
        searchText.includes(keyword.toLowerCase())
      );
      if (!hasKeyword) return false;
    }

    return true;
  });
}

// Generate natural language response for combined results
async function generateCombinedResponse(events, personalListings, originalQuery) {
  const totalResults = events.length + personalListings.length;
  
  if (totalResults === 0) {
    return "I couldn't find any events or activities matching your criteria. Try broadening your search or checking back later for new listings!";
  }

  let contentDescription = "";

  // Add events
  if (events.length > 0) {
    const eventDescriptions = events.slice(0, 3).map(event => 
      `- ${event.title} at ${event.location} on ${format(parseISO(event.start_date), 'EEEE, MMMM d at h:mm a')}. ${event.is_free ? 'Free event!' : `Cost: $${event.cost}`}`
    ).join('\n');
    contentDescription += `Business Events:\n${eventDescriptions}\n\n`;
  }

  // Add personal listings
  if (personalListings.length > 0) {
    const listingDescriptions = personalListings.slice(0, 3).map(listing => {
      const dateStr = listing.start_date 
        ? ` on ${format(parseISO(listing.start_date), 'EEEE, MMMM d')}`
        : '';
      const locationStr = listing.location ? ` at ${listing.location}` : '';
      return `- ${listing.title}${locationStr}${dateStr}. Type: ${listing.category}`;
    }).join('\n');
    contentDescription += `Community Listings:\n${listingDescriptions}`;
  }

  const systemPrompt = `You are a friendly AI assistant for Lethbridge, Alberta. 
  Create a natural, conversational response about these local events and listings based on the user's query.
  Be helpful, enthusiastic, and include practical details like times, costs, and locations.
  Distinguish between business events and community listings when appropriate.
  If there are family-friendly options, mention that.`;

  try {
    const response = await callOpenAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `User asked: "${originalQuery}"\n\nHere's what I found:\n${contentDescription}\n\nProvide a friendly, helpful response.` }
    ], {
      temperature: 0.7,
      max_tokens: 400
    });

    return response;
  } catch (error) {
    console.error('Error generating response:', error);
    // Fallback response if OpenAI fails
    return `I found ${totalResults} activities for you:\n\n${contentDescription}`;
  }
}

// Main AI service with enhanced features
export const aiService = {
  async searchEvents(query, userId = null) {
    try {
      // Get user preferences if available
      let userPreferences = null;
      if (userId) {
        userPreferences = await preferencesService.getPreferences(userId);
      }

      // Parse the user's natural language query
      const filters = await parseUserQuery(query);
      console.log('Parsed filters:', filters);

      let matchingEvents = [];
      let matchingListings = [];

      // Get business events if requested
      if (filters.includeBusinessEvents !== false) {
        const allEvents = await eventService.searchEvents({});
        console.log('Fetched all events:', allEvents);
        matchingEvents = filterEvents(allEvents, filters);
        console.log('Matched events after filtering:', matchingEvents);
      }

      // Get personal listings if requested or if there are keywords
      if (filters.includePersonalListings || 
          filters.personalListingTypes?.length > 0 || 
          filters.keywords?.length > 0) {
        try {
          const allListings = await personalListingService.getListings();
          console.log('Fetched all listings:', allListings);
          matchingListings = filterPersonalListings(allListings, filters);
          console.log('Matched listings after filtering:', matchingListings);
        } catch (error) {
          console.error('Error fetching personal listings:', error);
        }
      }

      // Apply user preferences
      if (userPreferences) {
        // Filter by preferred categories
        if (userPreferences.preferred_categories?.length > 0) {
          matchingEvents = matchingEvents.filter(event => 
            userPreferences.preferred_categories.includes(event.category)
          );
        }

        // Filter by max distance
        // TODO: Implement distance filtering when geolocation is added
      }

      // Generate a natural language response
      const response = await generateCombinedResponse(
        matchingEvents,
        matchingListings,
        query
      );

      // Track interaction if user is logged in
      if (userId && (matchingEvents.length > 0 || matchingListings.length > 0)) {
        // Track views for top results
        const topEventIds = matchingEvents.slice(0, 3).map(e => e.id);
        for (const eventId of topEventIds) {
          await preferencesService.trackInteraction(userId, eventId, 'view');
        }
      }

      return {
        message: response,
        events: matchingEvents,
        personalListings: matchingListings,
        filters: filters,
        totalResults: matchingEvents.length + matchingListings.length
      };
    } catch (error) {
      console.error('AI search error:', error);
      return {
        message: "I'm having trouble searching for events right now. Please try again later.",
        events: [],
        personalListings: [],
        error: error.message
      };
    }
  },

  // Generate personalized event suggestions
  async generateSuggestions(userId) {
    try {
      const preferences = await preferencesService.getPreferences(userId);
      const recommendations = await preferencesService.getRecommendations(userId);
      
      if (!preferences) {
        return "Tell me what kind of events you're interested in, and I can provide personalized suggestions!";
      }

      const prompt = `Based on these user preferences:
      - Preferred categories: ${preferences.preferred_categories?.join(', ') || 'None specified'}
      - Has children: ${preferences.has_children ? `Yes (ages: ${preferences.children_ages?.join(', ')})` : 'No'}
      - Budget preference: ${preferences.preferred_price_range || 'Any'}
      - Preferred days: ${preferences.preferred_days?.join(', ') || 'Any'}
      
      Suggest 3 specific types of events in Lethbridge they would enjoy.`;

      const response = await callOpenAI([
        { role: 'system', content: 'You are a helpful assistant for Lethbridge events.' },
        { role: 'user', content: prompt }
      ], {
        temperature: 0.8,
        max_tokens: 200
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
    Basic details: ${basicInfo.description || 'No description provided'}
    
    Create a compelling 2-3 sentence description that would attract attendees. 
    Include what makes this event special and who would enjoy it.
    Keep it concise and engaging.`;

    try {
      const response = await callOpenAI([
        { role: 'system', content: 'You are a creative marketing writer for local events. Write engaging, concise descriptions.' },
        { role: 'user', content: prompt }
      ], {
        temperature: 0.7,
        max_tokens: 150
      });

      return response;
    } catch (error) {
      console.error('Error enhancing description:', error);
      return basicInfo.description || '';
    }
  },

  // Generate tags for better searchability
  async generateEventTags(eventData) {
    const prompt = `Generate 5-8 relevant tags for this event:
    Title: ${eventData.title}
    Category: ${eventData.category}
    Description: ${eventData.description}
    
    Return only a comma-separated list of lowercase tags that would help people find this event.`;

    try {
      const response = await callOpenAI([
        { role: 'system', content: 'You are a tagging expert. Generate relevant, searchable tags.' },
        { role: 'user', content: prompt }
      ], {
        temperature: 0.5,
        max_tokens: 50
      });

      return response.split(',').map(tag => tag.trim().toLowerCase());
    } catch (error) {
      console.error('Error generating tags:', error);
      return [];
    }
  },

  // Analyze event performance and provide insights
  async analyzeEventPerformance(eventData, viewCount, interactionData) {
    const prompt = `Analyze this event's performance and provide actionable insights:
    Event: ${eventData.title} (${eventData.category})
    Views: ${viewCount}
    User interactions: ${JSON.stringify(interactionData)}
    
    Provide 3-4 specific recommendations to improve attendance and engagement.`;

    try {
      const response = await callOpenAI([
        { role: 'system', content: 'You are a local event marketing expert. Provide specific, actionable insights.' },
        { role: 'user', content: prompt }
      ], {
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        max_tokens: 200
      });

      return response;
    } catch (error) {
      console.error('Error analyzing event:', error);
      return null;
    }
  },

  // Generate event ideas based on trends
  async generateEventIdeas(businessCategory, currentEvents, seasonalContext) {
    const prompt = `Generate creative event ideas for a ${businessCategory} business in Lethbridge:
    Current season/context: ${seasonalContext}
    They've previously hosted: ${currentEvents.map(e => e.title).join(', ')}
    
    Suggest 3 unique event ideas that would attract local customers. 
    Consider Lethbridge's community interests and demographics.`;

    try {
      const response = await callOpenAI([
        { role: 'system', content: 'You are a creative event planner familiar with Lethbridge, Alberta.' },
        { role: 'user', content: prompt }
      ], {
        temperature: 0.8,
        max_tokens: 250
      });

      return response;
    } catch (error) {
      console.error('Error generating event ideas:', error);
      return null;
    }
  }
};