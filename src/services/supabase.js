// src/services/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('⚠️ Missing Supabase environment variables. Using placeholders.');
}

// Create Supabase client with enhanced configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'lethbridge-ai-auth',
    storage: window.localStorage,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Enhanced session checking
export const checkSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  } catch (error) {
    console.error('Session check failed:', error);
    return null;
  }
};

// Force refresh session
export const refreshSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    return session;
  } catch (error) {
    console.error('Session refresh failed:', error);
    return null;
  }
};

// ===== AUTH SERVICES =====
export const authService = {
  async signUp(email, password, metadata = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: window.location.origin
      }
    });
    
    if (error) throw error;
    return data;
  },

  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  },

  async signOut() {
    // Clear all auth-related storage before signing out
    const keysToRemove = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('lethbridge-ai'))) {
        keysToRemove.push(key);
      }
    }
    
    const { error } = await supabase.auth.signOut();
    
    // Clear storage after signout
    keysToRemove.forEach(key => window.localStorage.removeItem(key));
    
    if (error) throw error;
  },

  async getUser() {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      // No session means no user - this is not an error condition
      if (!session) {
        return null;
      }
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        // Only log if it's not a missing session error
        if (error.message !== 'Auth session missing!') {
          console.error('Get user error:', error);
        }
        return null;
      }
      
      return user;
    } catch (error) {
      console.error('Unexpected error getting user:', error);
      return null;
    }
  },

  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Get session error:', error);
      return null;
    }
    return session;
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// ===== PROFILE SERVICES =====
export const profileService = {
  async getProfile(userId) {
    if (!userId) return null;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Profile fetch error:', error);
      throw error;
    }
    return data;
  },

  async createProfile(profileData) {
    const { data, error } = await supabase
      .from('profiles')
      .insert([profileData])
      .select()
      .single();
    
    if (error) {
      console.error('Profile creation error:', error);
      throw error;
    }
    return data;
  },

  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Profile update error:', error);
      throw error;
    }
    return data;
  },

  async checkListingLimit(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('active_listings_count, max_listings_allowed')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Listing limit check error:', error);
      throw error;
    }
    
    return {
      canCreate: data ? data.active_listings_count < data.max_listings_allowed : false,
      current: data?.active_listings_count || 0,
      limit: data?.max_listings_allowed || 5
    };
  }
};

// ===== EVENT SERVICES =====
export const eventService = {
  async createEvent(eventData, images = []) {
    const { data, error } = await supabase
      .from('events')
      .insert([eventData])
      .select()
      .single();
    
    if (error) throw error;
    
    // Upload images if provided
    if (images.length > 0) {
      await Promise.all(images.map((img, index) => 
        imageService.addEventImage(data.id, img.url, img.caption, index === 0)
      ));
    }
    
    return data;
  },

  async getEvents(filters = {}) {
    let query = supabase
      .from('events')
      .select(`
        *,
        businesses!business_id (
          name,
          logo_url
        )
      `)
      .eq('is_approved', true)
      .gte('end_date', new Date().toISOString());

    // Apply filters
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    
    if (filters.date_from) {
      query = query.gte('start_date', filters.date_from);
    }
    
    if (filters.date_to) {
      query = query.lte('start_date', filters.date_to);
    }
    
    if (filters.is_free !== undefined) {
      query = query.eq('is_free', filters.is_free);
    }
    
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    if (filters.featured) {
      query = query.eq('featured', true);
    }

    const { data, error } = await query
      .order('start_date', { ascending: true })
      .limit(filters.limit || 50);
    
    if (error) throw error;
    return data;
  },

  async getEvent(id) {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        businesses!business_id (
          name,
          logo_url
        ),
        event_images (
          id,
          image_url,
          caption,
          is_primary
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async getUserEvents(userId) {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('organizer_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async updateEvent(id, updates, newImages = []) {
    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Add new images if provided
    if (newImages.length > 0) {
      await Promise.all(newImages.map(img => 
        imageService.addEventImage(id, img.url, img.caption, false)
      ));
    }
    
    return data;
  },

  async deleteEvent(id) {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async incrementViewCount(id) {
    const { error } = await supabase.rpc('increment_view_count', { event_id: id });
    if (error) console.error('Error incrementing view count:', error);
  },

  async getFeaturedEvents() {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        businesses!business_id (
          name,
          logo_url
        )
      `)
      .eq('is_featured', true)
      .eq('is_approved', true)
      .gte('end_date', new Date().toISOString())
      .order('start_date', { ascending: true })
      .limit(6);
    
    if (error) throw error;
    return data;
  },

  // Get personalized events for a user
  async getPersonalizedEvents(userId) {
    try {
      // Get user preferences
      const preferences = await preferencesService.getPreferences(userId);
      
      let query = supabase
        .from('events')
        .select(`
          *,
          event_images (
            id,
            image_url,
            caption,
            is_primary
          ),
          businesses (
            name,
            logo_url
          )
        `)
        .eq('is_approved', true)
        .gte('start_date', new Date().toISOString());

      // Apply preference filters if they exist
      if (preferences && preferences.preferred_categories?.length > 0) {
        query = query.in('category', preferences.preferred_categories);
      }

      if (preferences && preferences.max_event_cost) {
        query = query.lte('cost', preferences.max_event_cost);
      }

      const { data, error } = await query
        .order('start_date', { ascending: true })
        .limit(20);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting personalized events:', error);
      // Fallback to regular events
      return this.getEvents();
    }
  },

  // Search events for AI
  async searchEvents(params) {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        event_images (
          image_url,
          is_primary
        )
      `)
      .eq('is_approved', true)
      .gte('start_date', new Date().toISOString())
      .order('start_date', { ascending: true });
    
    if (error) throw error;
    return data;
  }
};

// ===== BUSINESS SERVICES =====
export const businessService = {
  async createBusiness(businessData) {
    const { data, error } = await supabase
      .from('businesses')
      .insert([businessData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getBusiness(id) {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async getUserBusiness(userId) {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async updateBusiness(id, updates) {
    const { data, error } = await supabase
      .from('businesses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getBusinessEvents(businessId) {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('business_id', businessId)
      .order('start_date', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async getBusinessAnalytics(businessId) {
    // Get events with view counts
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, view_count, start_date')
      .eq('business_id', businessId)
      .order('view_count', { ascending: false });
    
    if (eventsError) throw eventsError;

    // Get user interactions
    const { data: interactions, error: interactionsError } = await supabase
      .from('user_interactions')
      .select('interaction_type, created_at')
      .in('event_id', events.map(e => e.id));
    
    if (interactionsError) throw interactionsError;

    // Get AI agent analytics
    const { data: agentData, error: agentError } = await supabase
      .from('business_ai_agents')
      .select('monthly_queries_used, monthly_queries_limit')
      .eq('business_id', businessId)
      .single();
    
    if (agentError && agentError.code !== 'PGRST116') throw agentError;

    return {
      events,
      interactions,
      aiAgent: agentData
    };
  }
};

// ===== AI SERVICE =====
export const aiService = {
  async enhanceEventDescription(eventData) {
    // This would typically call an AI endpoint
    // For now, returning a placeholder enhanced description
    const enhanced = `${eventData.description}\n\nJoin us for this exciting ${eventData.category} event! ${
      eventData.title
    } promises to be an unforgettable experience for all attendees.`;
    
    return enhanced;
  }
};

// ===== INTERACTION SERVICE =====
export const interactionService = {
  async createInteraction(eventId, userId, type) {
    const { data, error } = await supabase
      .from('user_interactions')
      .insert([{
        event_id: eventId,
        user_id: userId,
        interaction_type: type
      }])
      .select()
      .single();
    
    if (error && error.code !== '23505') throw error; // Ignore duplicate key errors
    return data;
  },

  async getUserInteractions(userId) {
    const { data, error } = await supabase
      .from('user_interactions')
      .select(`
        *,
        events (
          id,
          title,
          start_date,
          category
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};

// ===== RECOMMENDATION SERVICE =====
export const recommendationService = {
  async getRecommendations(userId) {
    // Get user preferences
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get user interactions
    const { data: interactions } = await supabase
      .from('user_interactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    // Simple recommendation logic for now
    const recommendedCategories = preferences?.preferred_categories || [];
    
    return { recommendedCategories, interactions };
  }
};

// ===== PERSONAL LISTINGS SERVICES =====
export const personalListingService = {
  async createListing(listing) {
    const { data, error } = await supabase
      .from('personal_listings')
      .insert([listing])
      .select()
      .single();
    
    if (error) throw error;
    
    // Update listing count
    await supabase.rpc('increment_listing_count', { user_id: listing.user_id });
    
    return data;
  },

  async getListings(filters = {}) {
    let query = supabase
      .from('personal_listings')
      .select('*')
      .eq('is_active', true)
      .eq('moderation_status', 'approved');

    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    if (filters.listing_type) {
      query = query.eq('listing_type', filters.listing_type);
    }

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    // Get listings first
    const { data: listings, error } = await query
      .order('created_at', { ascending: false });
    
    if (error) throw error;

    // If we have listings, fetch profiles separately
    if (listings && listings.length > 0) {
      const userIds = [...new Set(listings.map(l => l.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      // Merge profiles with listings
      const profileMap = {};
      if (profiles) {
        profiles.forEach(p => {
          profileMap[p.user_id] = p;
        });
      }

      return listings.map(listing => ({
        ...listing,
        profiles: profileMap[listing.user_id] || null
      }));
    }
    
    return listings || [];
  },

  async getUserListings(userId) {
    const { data, error } = await supabase
      .from('personal_listings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async updateListing(id, updates) {
    const { data, error } = await supabase
      .from('personal_listings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteListing(id, userId) {
    const { error } = await supabase
      .from('personal_listings')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) throw error;
    
    // Update listing count
    await supabase.rpc('decrement_listing_count', { user_id: userId });
  }
};

// ===== BUSINESS AI AGENT SERVICES =====
export const aiAgentService = {
  async getAgentConfig(businessId) {
    const { data, error } = await supabase
      .from('business_ai_agents')
      .select('*')
      .eq('business_id', businessId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async createAgentConfig(businessId, config) {
    const { data, error } = await supabase
      .from('business_ai_agents')
      .insert([{ business_id: businessId, ...config }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateAgentConfig(businessId, updates) {
    const { data, error } = await supabase
      .from('business_ai_agents')
      .update(updates)
      .eq('business_id', businessId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateKnowledgeBase(businessId, knowledgeType, data) {
    const { error } = await supabase
      .from('business_ai_agents')
      .update({ [knowledgeType]: data })
      .eq('business_id', businessId);
    
    if (error) throw error;
  },

  async trackQuery(businessId) {
    const { error } = await supabase.rpc('increment_ai_queries', { 
      business_id: businessId 
    });
    
    if (error) throw error;
  },

  async checkQueryLimit(businessId) {
    const { data, error } = await supabase
      .from('business_ai_agents')
      .select('monthly_queries_used, monthly_queries_limit')
      .eq('business_id', businessId)
      .single();
    
    if (error) throw error;
    
    return {
      canQuery: data.monthly_queries_used < data.monthly_queries_limit,
      used: data.monthly_queries_used,
      limit: data.monthly_queries_limit
    };
  },

  async saveConversation(businessId, userId, sessionId, messages, tokensUsed) {
    const { data, error } = await supabase
      .from('chat_conversations')
      .insert([{
        business_id: businessId,
        user_id: userId,
        session_id: sessionId,
        messages: messages,
        total_tokens_used: tokensUsed
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getConversations(businessId, dateRange = null) {
    let query = supabase
      .from('chat_conversations')
      .select('*')
      .eq('business_id', businessId);
    
    if (dateRange) {
      query = query
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};

// ===== IMAGE SERVICES =====
export const imageService = {
  async uploadImage(file, bucket = 'event-images') {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  },

  async addEventImage(eventId, imageUrl, caption = '', isPrimary = false) {
    const { data, error } = await supabase
      .from('event_images')
      .insert([{
        event_id: eventId,
        image_url: imageUrl,
        caption: caption,
        is_primary: isPrimary
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getEventImages(eventId) {
    const { data, error } = await supabase
      .from('event_images')
      .select('*')
      .eq('event_id', eventId)
      .eq('moderation_status', 'approved')
      .order('is_primary', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async deleteImage(imageId) {
    const { error } = await supabase
      .from('event_images')
      .delete()
      .eq('id', imageId);
    
    if (error) throw error;
  }
};

// ===== MODERATION SERVICES =====
export const moderationService = {
  async logModeration(contentType, contentId, contentTable, result, action) {
    const { error } = await supabase
      .from('content_moderation_logs')
      .insert([{
        content_type: contentType,
        content_id: contentId,
        content_table: contentTable,
        moderation_result: result,
        action_taken: action
      }]);
    
    if (error) throw error;
  },

  async updateModerationStatus(table, id, status) {
    const { error } = await supabase
      .from(table)
      .update({ moderation_status: status })
      .eq('id', id);
    
    if (error) throw error;
  }
};

// ===== SUBSCRIPTION SERVICES =====
export const subscriptionService = {
  async getTiers() {
    const { data, error } = await supabase
      .from('business_subscription_tiers')
      .select('*')
      .order('price_monthly', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async getCurrentSubscription(businessId) {
    const { data, error } = await supabase
      .from('business_subscriptions')
      .select(`
        *,
        tier:tier_id (*)
      `)
      .eq('business_id', businessId)
      .eq('is_active', true)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async createSubscription(businessId, tierId, paymentData) {
    const { data, error } = await supabase
      .from('business_subscriptions')
      .insert([{
        business_id: businessId,
        tier_id: tierId,
        payment_provider: paymentData.provider,
        external_subscription_id: paymentData.subscriptionId,
        is_active: true,
        current_period_start: new Date().toISOString(),
        current_period_end: paymentData.periodEnd
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    // Update business subscription tier
    await businessService.updateBusiness(businessId, { subscription_tier: tierId });
    
    return data;
  },

  async cancelSubscription(subscriptionId) {
    const { error } = await supabase
      .from('business_subscriptions')
      .update({
        is_active: false,
        cancelled_at: new Date().toISOString()
      })
      .eq('id', subscriptionId);
    
    if (error) throw error;
  }
};

// ===== PREFERENCES SERVICES =====
export const preferencesService = {
  async getPreferences(userId) {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      // Create default preferences if they don't exist
      return {
        user_id: userId,
        preferred_categories: [],
        has_children: false,
        children_ages: [],
        notification_enabled: true
      };
    }
    
    return data;
  },

  async createPreferences(userId, preferences = {}) {
    const defaultPrefs = {
      user_id: userId,
      preferred_categories: [],
      has_children: false,
      children_ages: [],
      notification_enabled: true,
      ...preferences
    };

    const { data, error } = await supabase
      .from('user_preferences')
      .insert([defaultPrefs])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updatePreferences(userId, updates) {
    // Check if preferences exist
    const { data: existing } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!existing) {
      // Create preferences if they don't exist
      return await this.createPreferences(userId, updates);
    }

    // Update existing preferences
    const { data, error } = await supabase
      .from('user_preferences')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async addPreferredCategory(userId, category) {
    const prefs = await this.getPreferences(userId);
    const categories = prefs.preferred_categories || [];
    
    if (!categories.includes(category)) {
      categories.push(category);
      return await this.updatePreferences(userId, {
        preferred_categories: categories
      });
    }
    
    return prefs;
  },

  async removePreferredCategory(userId, category) {
    const prefs = await this.getPreferences(userId);
    const categories = prefs.preferred_categories || [];
    
    const updatedCategories = categories.filter(c => c !== category);
    return await this.updatePreferences(userId, {
      preferred_categories: updatedCategories
    });
  },

  async toggleNotifications(userId) {
    const prefs = await this.getPreferences(userId);
    return await this.updatePreferences(userId, {
      notification_enabled: !prefs.notification_enabled
    });
  },

  async trackInteraction(userId, eventId, interactionType) {
    try {
      const { data, error } = await supabase
        .from('user_interactions')
        .insert([{
          user_id: userId,
          event_id: eventId,
          interaction_type: interactionType
        }])
        .select()
        .single();
      
      if (error && error.code !== '23505') throw error; // Ignore duplicate key errors
      return data;
    } catch (error) {
      console.error('Error tracking interaction:', error);
      return null;
    }
  },

  async getRecommendations(userId) {
    try {
      // Get user preferences
      const preferences = await this.getPreferences(userId);
      
      // Get recent interactions
      const { data: interactions } = await supabase
        .from('user_interactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      // Simple recommendation logic for now
      const recommendedCategories = preferences?.preferred_categories || [];
      
      return { 
        recommendedCategories, 
        interactions: interactions || [] 
      };
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return { recommendedCategories: [], interactions: [] };
    }
  }
};