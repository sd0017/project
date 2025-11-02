// Supabase configuration using the safe ENV utility
import { ENV } from '../env';

// Supabase configuration object
export const supabaseConfig = {
  url: ENV.SUPABASE_URL,
  anonKey: ENV.SUPABASE_ANON_KEY,
  
  // Check if Supabase is properly configured
  isConfigured: function() {
    return ENV.isSupabaseConfigured();
  }
};

// Environment setup instructions
export const SETUP_INSTRUCTIONS = `
To enable Supabase integration, you need to:

1. Create a Supabase project at https://supabase.com
2. Get your project URL and anon key from the project settings
3. Set environment variables:
   - VITE_SUPABASE_URL=your-project-url
   - VITE_SUPABASE_ANON_KEY=your-anon-key

4. Run the database migrations:
   - Execute the SQL in /supabase/migrations/001_initial_schema.sql
   - Optionally run the seed data from /supabase/seed.sql

Until then, the system will run in offline mode with demo data.
`;

// Log configuration status only in development
if (typeof console !== 'undefined') {
  if (!supabaseConfig.isConfigured()) {
    console.log('🔧 Supabase Configuration: Running in offline mode');
    console.log('💡 To enable real-time backend, configure your Supabase credentials');
  } else {
    console.log('✅ Supabase Configuration: Connected to backend');
  }
}