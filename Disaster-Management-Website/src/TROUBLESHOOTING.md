# Troubleshooting Guide

## Common Issues and Solutions

### Environment Variable Errors

**Error**: `TypeError: Cannot read properties of undefined (reading 'VITE_SUPABASE_URL')`

**Solution**: 
1. The system now includes safe fallbacks for environment variables
2. Create a `.env` file in your project root with your Supabase credentials
3. Use the environment configuration tool in the app's pre-home page
4. The app will work in offline mode if Supabase is not configured

### Connection Timeouts

**Error**: `Message getPage (id: 3) response timed out after 30000ms`

**Solution**:
1. The system now includes connection timeouts (3-10 seconds) to prevent hanging
2. The app automatically falls back to offline mode if Supabase is unavailable
3. Check your internet connection and Supabase project status
4. All features work offline with demo data

### Supabase Setup Issues

**Problem**: Can't connect to Supabase

**Solution**:
1. Verify your Supabase project is active (not paused)
2. Check your URL and API key in the `.env` file
3. Ensure you've run the database migration script
4. Use the configuration panel in the app for step-by-step setup

### Authentication Problems

**Problem**: Login not working

**Solution**:
1. In offline mode, use these demo credentials:
   - Government: Employee ID `GOV001`, Password `password123`
   - Rescue Center: Center ID `RC001`, Password `rescue123`  
   - Citizens: Any email/password combination works in offline mode
2. For Supabase mode, ensure users are created in the database
3. Check the browser console for detailed error messages

### Data Sync Issues

**Problem**: Changes not saving

**Solution**:
1. The system uses offline-first architecture
2. Changes are saved to localStorage immediately
3. Supabase sync happens in the background when available
4. Check the connectivity indicator in the app

## System Status Indicators

The app includes several status indicators:

1. **Supabase Status Card**: Shows if backend is connected
2. **Offline Notice**: Appears when no internet connection
3. **Loading Indicators**: Show when data is being fetched
4. **Toast Notifications**: Confirm when actions complete

## Offline Mode Features

When Supabase is unavailable, the system provides:

- ✅ All core functionality works
- ✅ Demo rescue centers and data
- ✅ Guest registration and management
- ✅ Real-time map interaction
- ✅ Multi-language support
- ✅ Local data persistence
- ✅ Emergency resources and guides

## Getting Help

1. Check the browser console for detailed error messages
2. Use the configuration panel for setup guidance
3. Review the SUPABASE_SETUP.md file for detailed instructions
4. The system logs helpful information about its current state

## Development vs Production

**Development**:
- Works fully offline with demo data
- No Supabase setup required for testing
- All features available immediately

**Production**:
- Requires Supabase configuration for real-time features
- User authentication and data persistence
- Real-time updates across multiple devices