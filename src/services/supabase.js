// src/services/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// Log warning if using placeholders
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('⚠️ Missing Supabase environment variables. Using placeholders. Please add your credentials to .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Event-related functions
export const eventService = {
  // Get all approved events
  async getEvents(filters = {}) {
    let query = supabase
      .from('events')
      .select('*')
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

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get events for AI search
  async searchEvents(params) {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('is_approved', true)
      .gte('start_date', new Date().toISOString())
      .order('start_date', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Create new event
  async createEvent(event) {
    const { data, error } = await supabase
      .from('events')
      .insert([event])
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update event
  async updateEvent(id, updates) {
    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Increment view count
  async incrementViewCount(id) {
    try {
      const { error } = await supabase.rpc('increment_view_count', { event_id: id });
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
  }
};

// Business-related functions
export const businessService = {
  async getBusinesses() {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  },

  async createBusiness(business) {
    const { data, error } = await supabase
      .from('businesses')
      .insert([business])
      .single();
    
    if (error) throw error;
    return data;
  },

  async getBusinessEvents(businessId) {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('business_id', businessId)
      .order('start_date', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};

// Auth functions
export const authService = {
  async signUp(email, password, metadata = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
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
  },

  async getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  }
};