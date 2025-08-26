// src/services/supabase.js - Complete Fixed Version
import { createClient } from '@supabase/supabase-js';

// Get environment variables with fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// Validation
if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
  console.error('Missing VITE_SUPABASE_URL environment variable. Using placeholders.');
}
if (!supabaseAnonKey || supabaseAnonKey === 'placeholder-key') {
  console.error('Missing VITE_SUPABASE_ANON_KEY environment variable. Using placeholders.');
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

// ===== ERROR HANDLER UTILITY =====
const handleError = (operation, error, throwError = true) => {
  console.error(`${operation} error:`, error);
  if (throwError) throw error;
  return null;
};

// ===== AUTH SERVICES =====
export const authService = {
  async signUp(email, password, metadata = {}) {
    try {
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
    } catch (error) {
      return handleError('Sign up', error);
    }
  },

  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      return handleError('Sign in', error);
    }
  },

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      return handleError('Sign out', error);
    }
  },

  async getUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error && error.message !== 'Auth session missing!') {
        console.error('Get user error:', error);
      }
      
      return user || null;
    } catch (error) {
      console.error('Unexpected error getting user:', error);
      return null;
    }
  },

  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    } catch (error) {
      return handleError('Get session', error, false);
    }
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// ===== PROFILE SERVICES =====
export const profileService = {
  async getProfile(userId) {
    if (!userId) return null;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      return handleError('Get profile', error, false);
    }
  },

  async createProfile(profileData) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return handleError('Create profile', error);
    }
  },

  async updateProfile(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return handleError('Update profile', error);
    }
  },

  async checkListingLimit(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('active_listings_count, max_listings_allowed')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      
      return {
        canCreate: data ? data.active_listings_count < data.max_listings_allowed : false,
        current: data?.active_listings_count || 0,
        limit: data?.max_listings_allowed || 5
      };
    } catch (error) {
      return handleError('Check listing limit', error);
    }
  }
};

// ===== BUSINESS SERVICES =====
export const businessService = {
  async getBusinesses() {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select(`
          *,
          subscription_tier:subscription_tier_id(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      return handleError('Get businesses', error, false) || [];
    }
  },

  async createBusiness(businessData) {
    try {
      const { data: freeTier } = await supabase
        .from('business_subscription_tiers')
        .select('id')
        .eq('name', 'free')
        .single();

      const { data, error } = await supabase
        .from('businesses')
        .insert([{
          ...businessData,
          subscription_tier_id: freeTier?.id
        }])
        .select(`
          *,
          subscription_tier:subscription_tier_id(*)
        `)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return handleError('Create business', error);
    }
  },

  async updateBusiness(id, updates) {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          subscription_tier:subscription_tier_id(*)
        `)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return handleError('Update business', error);
    }
  },

  async getBusinessEvents(businessId) {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('business_id', businessId)
        .order('start_date', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      return handleError('Get business events', error, false) || [];
    }
  },

  async getBusinessAnalytics(businessId) {
    try {
      const { data: events } = await supabase
        .from('events')
        .select('view_count')
        .eq('business_id', businessId);

      const { data: aiAgent } = await supabase
        .from('business_ai_agents')
        .select('monthly_queries_used, monthly_queries_limit')
        .eq('business_id', businessId)
        .single();

      const totalViews = events?.reduce((sum, event) => sum + (event.view_count || 0), 0) || 0;
      const averageViews = events?.length > 0 ? Math.round(totalViews / events.length) : 0;

      return {
        totalEvents: events?.length || 0,
        totalViews,
        averageViews,
        aiAgent
      };
    } catch (error) {
      return {
        totalEvents: 0,
        totalViews: 0,
        averageViews: 0,
        aiAgent: null
      };
    }
  }
};

// ===== EVENT SERVICES =====
export const eventService = {
  async searchEvents(searchParams = {}) {
    try {
      let query = supabase
        .from('events')
        .select('*')
        .eq('is_approved', true);

      // Text search
      if (searchParams.query) {
        query = query.or(`title.ilike.%${searchParams.query}%,description.ilike.%${searchParams.query}%`);
      }

      // Category filter
      if (searchParams.category) {
        query = query.eq('category', searchParams.category);
      }

      // Date range filters
      if (searchParams.dateRange) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (searchParams.dateRange) {
          case 'today':
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            query = query.gte('start_date', today.toISOString())
                        .lt('start_date', tomorrow.toISOString());
            break;
            
          case 'tomorrow':
            const dayAfterTomorrow = new Date(today);
            dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
            const tomorrowStart = new Date(today);
            tomorrowStart.setDate(tomorrowStart.getDate() + 1);
            query = query.gte('start_date', tomorrowStart.toISOString())
                        .lt('start_date', dayAfterTomorrow.toISOString());
            break;
            
          case 'this_week':
            const weekEnd = new Date(today);
            weekEnd.setDate(weekEnd.getDate() + (7 - today.getDay()));
            query = query.gte('start_date', today.toISOString())
                        .lte('start_date', weekEnd.toISOString());
            break;
            
          case 'this_weekend':
            const dayOfWeek = today.getDay();
            const daysUntilFriday = dayOfWeek <= 5 ? 5 - dayOfWeek : 0;
            const friday = new Date(today);
            friday.setDate(friday.getDate() + daysUntilFriday);
            friday.setHours(18, 0, 0, 0);
            
            const sunday = new Date(friday);
            sunday.setDate(sunday.getDate() + 2);
            sunday.setHours(23, 59, 59, 999);
            
            query = query.gte('start_date', friday.toISOString())
                        .lte('start_date', sunday.toISOString());
            break;
        }
      }

      // Cost filters
      if (searchParams.isFree) {
        query = query.eq('is_free', true);
      } else if (searchParams.maxCost) {
        query = query.lte('cost', searchParams.maxCost);
      }

      // Featured/Promoted filters
      if (searchParams.promoted) {
        query = query.eq('promoted', true);
      }
      if (searchParams.featured) {
        query = query.eq('featured', true);
      }

      // Sort and limit
      query = query.order('start_date', { ascending: true });
      if (searchParams.limit) {
        query = query.limit(searchParams.limit);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching events:', error);
      return [];
    }
  },

  async getEvents(filters = {}) {
    return this.searchEvents(filters);
  },

  async createEvent(eventData) {
    try {
      const { data, error } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return handleError('Create event', error);
    }
  },

  async updateEvent(id, updates) {
    try {
      const { data, error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return handleError('Update event', error);
    }
  },

  async deleteEvent(id) {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      return handleError('Delete event', error);
    }
  },

  async incrementViewCount(eventId) {
    try {
      const { error } = await supabase.rpc('increment_view_count', { 
        event_id: eventId 
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  },

  async getPersonalizedEvents(userId, limit = 10) {
    try {
      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      let query = supabase
        .from('events')
        .select('*')
        .eq('is_approved', true)
        .gte('start_date', new Date().toISOString());

      if (preferences) {
        if (preferences.preferred_categories?.length > 0) {
          query = query.in('category', preferences.preferred_categories);
        }
        if (preferences.max_event_cost) {
          query = query.lte('cost', preferences.max_event_cost);
        }
      }

      query = query.order('start_date', { ascending: true }).limit(limit);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting personalized events:', error);
      return [];
    }
  }
};

// ===== PERSONAL LISTING SERVICES =====
export const personalListingService = {
  async createListing(listingData, userId) {
    try {
      const limitCheck = await profileService.checkListingLimit(userId);
      if (!limitCheck.canCreate) {
        throw new Error(`Listing limit reached (${limitCheck.current}/${limitCheck.limit})`);
      }

      const { data, error } = await supabase
        .from('personal_listings')
        .insert([{
          ...listingData,
          user_id: userId
        }])
        .select()
        .single();
      
      if (error) throw error;

      await supabase.rpc('increment_listing_count', { user_id: userId });
      
      return data;
    } catch (error) {
      return handleError('Create listing', error);
    }
  },

  async getListings() {
    try {
      const { data, error } = await supabase
        .from('personal_listings')
        .select('*')
        .eq('is_active', true)
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting listings:', error);
      return [];
    }
  },

  async getUserListings(userId) {
    try {
      const { data, error } = await supabase
        .from('personal_listings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      return handleError('Get user listings', error, false) || [];
    }
  },

  async updateListing(id, updates) {
    try {
      const { data, error } = await supabase
        .from('personal_listings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return handleError('Update listing', error);
    }
  },

  async deleteListing(id, userId) {
    try {
      const { error } = await supabase
        .from('personal_listings')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      await supabase.rpc('decrement_listing_count', { user_id: userId });
    } catch (error) {
      return handleError('Delete listing', error);
    }
  }
};

// ===== SUBSCRIPTION SERVICES =====
export const subscriptionService = {
  async getTiers() {
    try {
      const { data, error } = await supabase
        .from('business_subscription_tiers')
        .select('*')
        .order('price_monthly', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      return handleError('Get subscription tiers', error, false) || [];
    }
  },

  async getCurrentSubscription(businessId) {
    try {
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
    } catch (error) {
      return handleError('Get current subscription', error, false);
    }
  }
};

// ===== PREFERENCES SERVICES =====
export const preferencesService = {
  async getPreferences(userId) {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      return handleError('Get preferences', error, false);
    }
  },

  async updatePreferences(userId, preferences) {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          ...preferences
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return handleError('Update preferences', error);
    }
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
      
      if (error && error.code !== '23505') throw error;
      return data;
    } catch (error) {
      console.error('Error tracking interaction:', error);
      return null;
    }
  }
};

// ===== AI AGENT SERVICES =====
export const aiAgentService = {
  async getAgentConfig(businessId) {
    try {
      const { data, error } = await supabase
        .from('business_ai_agents')
        .select('*')
        .eq('business_id', businessId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      return handleError('Get AI agent config', error, false);
    }
  },

  async createAgentConfig(businessId, config) {
    try {
      const { data, error } = await supabase
        .from('business_ai_agents')
        .insert([{ business_id: businessId, ...config }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return handleError('Create AI agent config', error);
    }
  },

  async updateAgentConfig(businessId, updates) {
    try {
      const { data, error } = await supabase
        .from('business_ai_agents')
        .update(updates)
        .eq('business_id', businessId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return handleError('Update AI agent config', error);
    }
  }
};

// ===== IMAGE SERVICES =====
export const imageService = {
  async uploadImage(file, bucket = 'event-images') {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      return handleError('Upload image', error);
    }
  },

  async deleteImage(url, bucket = 'event-images') {
    try {
      const urlParts = url.split('/');
      const fileName = urlParts[urlParts.length - 1];

      const { error } = await supabase.storage
        .from(bucket)
        .remove([fileName]);

      if (error) throw error;
    } catch (error) {
      return handleError('Delete image', error, false);
    }
  }
};

// ===== MESSAGE SERVICES =====
export const messageService = {
  async getOrCreateConversation(listingId, user1Id, user2Id) {
    try {
      const { data, error } = await supabase.rpc('get_or_create_conversation', {
        p_listing_id: listingId,
        p_user1_id: user1Id,
        p_user2_id: user2Id
      });

      if (error) throw error;
      return data;
    } catch (error) {
      return handleError('Get or create conversation', error);
    }
  },

  async sendMessage(conversationId, senderId, recipientId, listingId, content) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          conversation_id: conversationId,
          sender_id: senderId,
          recipient_id: recipientId,
          listing_id: listingId,
          content: content
        }])
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      return data;
    } catch (error) {
      return handleError('Send message', error);
    }
  },

  async getConversationMessages(conversationId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id(id, display_name, avatar_url),
          recipient:recipient_id(id, display_name, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      return handleError('Get conversation messages', error, false) || [];
    }
  },

  async getUserConversations(userId) {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          listing:listing_id(id, title),
          participant_1:participant_1_id(id, display_name, avatar_url),
          participant_2:participant_2_id(id, display_name, avatar_url),
          messages(count)
        `)
        .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`)
        .eq('is_active', true)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      return handleError('Get user conversations', error, false) || [];
    }
  },

  async markMessagesRead(conversationId, userId) {
    try {
      const { error } = await supabase.rpc('mark_messages_read', {
        p_conversation_id: conversationId,
        p_user_id: userId
      });

      if (error) throw error;
    } catch (error) {
      return handleError('Mark messages read', error, false);
    }
  },

  async getUnreadCount(userId) {
    try {
      const { data, error } = await supabase.rpc('get_unread_count', {
        p_user_id: userId
      });

      if (error) throw error;
      return data || 0;
    } catch (error) {
      return handleError('Get unread count', error, false) || 0;
    }
  }
};

// ===== INTERACTION SERVICE =====
export const interactionService = {
  async createInteraction(eventId, userId, type) {
    try {
      const { data, error } = await supabase
        .from('user_interactions')
        .insert([{
          event_id: eventId,
          user_id: userId,
          interaction_type: type
        }])
        .select()
        .single();
      
      if (error && error.code !== '23505') throw error;
      return data;
    } catch (error) {
      return handleError('Create interaction', error, false);
    }
  }
};

// ===== EXPORT ALL SERVICES =====
export default {
  supabase,
  authService,
  profileService,
  businessService,
  eventService,
  personalListingService,
  subscriptionService,
  preferencesService,
  aiAgentService,
  imageService,
  messageService,
  interactionService
};