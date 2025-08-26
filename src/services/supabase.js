// src/services/supabase.js - Updated configuration
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
    flowType: 'implicit'
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


// ===== PROFILE SERVICES =====
export const profileService = {
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(); // Changed from .single() to .maybeSingle()
    
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
      canCreate: data ? data.active_listings_count < data.max_listings_allowed : true,
      current: data?.active_listings_count || 0,
      max: data?.max_listings_allowed || 3
    };
  }
};

// ===== USER PREFERENCES SERVICES =====
export const preferencesService = {
  async getPreferences(userId) {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(); // Changed from .single() to .maybeSingle()
    
    if (error && error.code !== 'PGRST116') {
      console.error('Preferences fetch error:', error);
      throw error;
    }
    return data;
  },

  async updatePreferences(userId, preferences) {
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert([{ user_id: userId, ...preferences }])
      .select()
      .single();
    
    if (error) {
      console.error('Preferences update error:', error);
      throw error;
    }
    return data;
  },

  async trackInteraction(userId, eventId, interactionType, interactionData = {}) {
    const { error } = await supabase
      .from('user_interactions')
      .upsert([{
        user_id: userId,
        event_id: eventId,
        interaction_type: interactionType,
        interaction_data: interactionData
      }]);
    
    if (error) throw error;
  },

  async getRecommendations(userId) {
    // This would be enhanced with ML in production
    const { data: preferences } = await this.getPreferences(userId);
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
      .select(`
        *,
        profiles!user_id (
          display_name,
          avatar_url
        )
      `)
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

    const { data, error } = await query
      .order('start_date', { ascending: true });
    
    if (error) throw error;
    return data;
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

  async updateBusinessTier(businessId, tierName) {
    const { data, error } = await supabase
      .from('businesses')
      .update({ subscription_tier: tierName })
      .eq('id', businessId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// ===== ENHANCED EVENT SERVICES =====
export const eventService = {
  // Get all approved events with images
  async getEvents(filters = {}) {
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
      .gte('start_date', new Date().toISOString())
      .order('start_date', { ascending: true });

    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    if (filters.ageRange) {
      query = query.lte('age_min', filters.ageRange)
        .gte('age_max', filters.ageRange);
    }

    if (filters.isFree) {
      query = query.eq('is_free', true);
    }

    if (filters.featured) {
      query = query.eq('featured', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get events for AI search
  async searchEvents(params) {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        event_images!inner (
          image_url,
          is_primary
        )
      `)
      .eq('is_approved', true)
      .gte('start_date', new Date().toISOString())
      .order('start_date', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Create new event with images
  async createEvent(event, images = []) {
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .insert([event])
      .select()
      .single();
    
    if (eventError) throw eventError;

    // Add images if provided
    if (images.length > 0) {
      const imagePromises = images.map((img, index) => 
        imageService.addEventImage(
          eventData.id, 
          img.url, 
          img.caption || '', 
          index === 0
        )
      );
      
      await Promise.all(imagePromises);
    }

    return eventData;
  },

  // Update event
  async updateEvent(id, updates) {
    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Increment view count
  async incrementViewCount(id) {
    try {
      const { error } = await supabase.rpc('increment_view_count', { 
        event_id: id 
      });
      if (error) console.error('Error incrementing view count:', error);
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  },

  // Delete event
  async deleteEvent(id) {
    const { data, error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return data;
  },

  // Get personalized events
  async getPersonalizedEvents(userId) {
    // Get user preferences
    const preferences = await preferencesService.getPreferences(userId);
    
    if (!preferences) {
      return this.getEvents();
    }

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

    // Apply preference filters
    if (preferences.preferred_categories?.length > 0) {
      query = query.in('category', preferences.preferred_categories);
    }

    if (preferences.max_event_cost) {
      query = query.lte('cost', preferences.max_event_cost);
    }

    const { data, error } = await query
      .order('start_date', { ascending: true })
      .limit(20);
    
    if (error) throw error;
    return data;
  }
};

// ===== ENHANCED BUSINESS SERVICES =====
export const businessService = {
  async getBusinesses() {
    const { data, error } = await supabase
      .from('businesses')
      .select(`
        *,
        business_subscription_tiers (
          display_name,
          ai_agent_enabled,
          analytics_enabled
        )
      `)
      .order('name');
    
    if (error) throw error;
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

  async createBusiness(business) {
    const { data, error } = await supabase
      .from('businesses')
      .insert([business])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getBusinessEvents(businessId) {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        event_images (
          id,
          image_url,
          caption,
          is_primary
        )
      `)
      .eq('business_id', businessId)
      .order('start_date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getBusinessAnalytics(businessId) {
    // Get event analytics
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, view_count, start_date')
      .eq('business_id', businessId);
    
    if (eventsError) throw eventsError;

    // Get interaction analytics
    const eventIds = events.map(e => e.id);
    const { data: interactions, error: interactionsError } = await supabase
      .from('user_interactions')
      .select('event_id, interaction_type, created_at')
      .in('event_id', eventIds);
    
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
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    // Clear local storage to ensure clean logout
    window.localStorage.removeItem('lethbridge-ai-auth');
    // Clear any Supabase-specific storage keys
    const keysToRemove = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith('sb-')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => window.localStorage.removeItem(key));
  },

  async getUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Get user error:', error);
      return null;
    }
    return user;
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
