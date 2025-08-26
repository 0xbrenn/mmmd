// src/services/openai.js - Simplified version without OpenAI API
import { eventService, personalListingService } from './supabase';
import { format, parseISO, isToday, isTomorrow, isThisWeek, isWeekend } from 'date-fns';

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

// Simple keyword-based parser
function parseQuery(query) {
  const lowerQuery = query.toLowerCase();
  const filters = {
    dateRange: null,
    isFree: false,
    categories: [],
    keywords: []
  };

  // Date parsing
  if (lowerQuery.includes('today')) {
    filters.dateRange = 'today';
  } else if (lowerQuery.includes('tomorrow')) {
    filters.dateRange = 'tomorrow';
  } else if (lowerQuery.includes('weekend') || lowerQuery.includes('this weekend')) {
    filters.dateRange = 'this_weekend';
  } else if (lowerQuery.includes('this week') || lowerQuery.includes('week')) {
    filters.dateRange = 'this_week';
  } else if (lowerQuery.includes('next week')) {
    filters.dateRange = 'next_week';
  }

  // Free events
  if (lowerQuery.includes('free')) {
    filters.isFree = true;
  }

  // Categories
  EVENT_CATEGORIES.forEach(category => {
    const catLower = category.toLowerCase();
    if (lowerQuery.includes(catLower) || 
        (catLower.includes('&') && lowerQuery.includes(catLower.split('&')[0].trim()))) {
      filters.categories.push(category);
    }
  });

  // Special keywords
  if (lowerQuery.includes('family') || lowerQuery.includes('kids') || lowerQuery.includes('children')) {
    if (!filters.categories.includes('Family & Kids')) {
      filters.categories.push('Family & Kids');
    }
  }
  if (lowerQuery.includes('music') || lowerQuery.includes('concert') || lowerQuery.includes('live')) {
    if (!filters.categories.includes('Music & Concerts')) {
      filters.categories.push('Music & Concerts');
    }
  }
  if (lowerQuery.includes('food') || lowerQuery.includes('dining') || lowerQuery.includes('restaurant')) {
    if (!filters.categories.includes('Food & Dining')) {
      filters.categories.push('Food & Dining');
    }
  }

  // Extract remaining words as keywords
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'what', 'whats', 'happening', 'events', 'activities', 'things', 'do', 'near', 'me', 'lethbridge'];
  const words = lowerQuery.split(/\s+/).filter(word => 
    word.length > 2 && !commonWords.includes(word)
  );
  filters.keywords = words;

  return filters;
}

// Generate a friendly response based on results
function generateResponse(events, listings, query, filters) {
  const totalResults = events.length + listings.length;

  if (totalResults === 0) {
    return "I couldn't find any events or activities matching your search. Try broadening your criteria or check back later for new events!";
  }

  let response = "";
  
  // Date context
  if (filters.dateRange === 'today') {
    response = `Here's what's happening today in Lethbridge:\n\n`;
  } else if (filters.dateRange === 'this_weekend') {
    response = `Here are some great events happening this weekend:\n\n`;
  } else if (filters.dateRange === 'this_week') {
    response = `Check out these events happening this week:\n\n`;
  } else {
    response = `I found ${totalResults} ${totalResults === 1 ? 'event' : 'events'} for you:\n\n`;
  }

  // Add context about the search
  if (filters.isFree) {
    response += "🎉 All of these are FREE events!\n\n";
  }
  if (filters.categories.length > 0) {
    response += `📍 Focusing on: ${filters.categories.join(', ')}\n\n`;
  }

  // Summarize top events
  if (events.length > 0) {
    const topEvents = events.slice(0, 3);
    topEvents.forEach((event, index) => {
      const eventDate = parseISO(event.start_date);
      let dateStr = format(eventDate, 'MMM d');
      if (isToday(eventDate)) dateStr = 'Today';
      if (isTomorrow(eventDate)) dateStr = 'Tomorrow';
      
      response += `${index + 1}. **${event.title}** - ${dateStr} at ${format(eventDate, 'h:mm a')}\n`;
      response += `   📍 ${event.location}${event.is_free ? ' • FREE' : ` • $${event.cost}`}\n\n`;
    });
    
    if (events.length > 3) {
      response += `...and ${events.length - 3} more events!\n\n`;
    }
  }

  // Add listings if any
  if (listings.length > 0) {
    response += "\n🏠 Community Listings:\n";
    listings.slice(0, 2).forEach(listing => {
      response += `• ${listing.title} - ${listing.category}\n`;
    });
  }

  return response;
}

// Main AI service
export const aiService = {
  async searchEvents(query, userId = null) {
    try {
      console.log('AI Search Query:', query);
      
      // Parse the query
      const filters = parseQuery(query);
      console.log('Parsed filters:', filters);

      // Search for events
      const searchParams = {
        dateRange: filters.dateRange,
        isFree: filters.isFree
      };

      let events = await eventService.searchEvents(searchParams);
      
      // Filter by categories if specified
      if (filters.categories.length > 0) {
        events = events.filter(event => 
          filters.categories.includes(event.category)
        );
      }

      // Filter by keywords in title/description
      if (filters.keywords.length > 0) {
        events = events.filter(event => {
          const searchText = `${event.title} ${event.description}`.toLowerCase();
          return filters.keywords.some(keyword => searchText.includes(keyword));
        });
      }

      // Get personal listings
      let listings = [];
      try {
        listings = await personalListingService.getListings();
        
        // Filter listings by keywords
        if (filters.keywords.length > 0) {
          listings = listings.filter(listing => {
            const searchText = `${listing.title} ${listing.description}`.toLowerCase();
            return filters.keywords.some(keyword => searchText.includes(keyword));
          });
        }
      } catch (error) {
        console.error('Error loading listings:', error);
      }

      // Generate response
      const response = generateResponse(events, listings, query, filters);

      return {
        message: response,
        events: events.slice(0, 10), // Limit to 10 events
        personalListings: listings.slice(0, 5), // Limit to 5 listings
        filters: filters,
        totalResults: events.length + listings.length
      };
    } catch (error) {
      console.error('AI search error:', error);
      return {
        message: "I'm having trouble searching for events right now. Please try again or browse events directly.",
        events: [],
        personalListings: [],
        filters: {},
        totalResults: 0
      };
    }
  },

  // Helper method to format event for display
  formatEvent(event) {
    const date = parseISO(event.start_date);
    return {
      ...event,
      formattedDate: format(date, 'MMM d, yyyy'),
      formattedTime: format(date, 'h:mm a'),
      isToday: isToday(date),
      isTomorrow: isTomorrow(date),
      isThisWeek: isThisWeek(date)
    };
  }
};