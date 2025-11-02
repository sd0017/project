// Simple environment configuration that works across all build systems

export const ENV = {
  // Supabase configuration (defaults to offline mode)
  SUPABASE_URL: 'https://your-project-ref.supabase.co',
  SUPABASE_ANON_KEY: 'your-anon-key',
  
  // Check if we're in production mode
  isProd: false,
  
  // Check if Supabase is configured
  isSupabaseConfigured() {
    return this.SUPABASE_URL !== 'https://your-project-ref.supabase.co' && 
           this.SUPABASE_ANON_KEY !== 'your-anon-key';
  }
};

// Override with actual environment variables if available
// This approach avoids build-time issues
if (typeof window === 'undefined') {
  // Server-side or build-time - use safe defaults
  console.log('Running in offline mode with demo data');
} else {
  // Client-side - environment variables would be injected here in production
  console.log('ResQ Reach Platform initialized');
}