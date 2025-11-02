# Supabase Setup Guide

This guide will help you set up Supabase as the backend for your disaster management system.

## Overview

The system now uses Supabase instead of MongoDB for:
- User authentication (citizens, government officials, rescue center staff)
- Real-time data storage (rescue centers, guests, disaster statistics)
- Row-level security for multi-role access control
- Offline-first architecture with local storage fallback

## Quick Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Choose a strong database password
4. Wait for the project to be set up (usually takes 1-2 minutes)

### 2. Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy your **Project URL** (looks like: `https://abcdefghij.supabase.co`)
3. Copy your **anon public** key (long JWT token starting with `eyJ...`)

### 3. Configure Environment Variables

1. Copy the `.env.example` file to `.env` in your project root:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and replace the placeholder values:
   ```env
   VITE_SUPABASE_URL=https://your-actual-project-url.supabase.co
   VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
   ```

### 4. Set Up the Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `/supabase/migrations/001_initial_schema.sql`
3. Paste it in the SQL Editor and click **Run**
4. This will create all necessary tables, triggers, and security policies

### 5. Add Seed Data (Optional)

1. Copy the contents of `/supabase/seed.sql`
2. Paste it in the SQL Editor and click **Run**
3. This will add demo rescue centers and test users

## Database Schema

The system creates these main tables:

### `rescue_centers`
- Stores rescue center information (location, capacity, supplies)
- Automatically updates capacity when guests are added/removed
- Includes real-time supply level tracking

### `guests`
- Stores guest registration information
- Links to rescue centers via foreign key
- Includes medical conditions, emergency contacts, and special needs

### `users`
- Stores user authentication and role information
- Supports three roles: citizen, government, rescue_center
- Links rescue center staff to their assigned centers

## Security Features

The system includes Row Level Security (RLS) policies:

- **Citizens**: Can view all rescue centers, manage their own guest records
- **Government**: Full read/write access to all data
- **Rescue Center Staff**: Can manage guests and update their assigned center

## Real-time Features

The system supports real-time updates for:
- Rescue center capacity changes
- New guest registrations
- Supply level updates
- Cross-platform synchronization

## Offline Support

If Supabase is unavailable, the system automatically:
- Falls back to localStorage for data persistence
- Uses demo data for testing
- Syncs changes when connection is restored
- Maintains full functionality offline

## Troubleshooting

### Environment Variables Not Working
- Make sure your `.env` file is in the project root
- Restart your development server after changing `.env`
- Check that variable names start with `VITE_`

### Database Connection Errors
- Verify your Supabase URL and key are correct
- Check that your Supabase project is active (not paused)
- Ensure you've run the database migration script

### Permission Errors
- Make sure RLS policies are set up correctly
- Check that users have the right roles assigned
- Verify the database schema was created properly

## Migration from MongoDB

If you were previously using MongoDB:

1. The system automatically detects Supabase configuration
2. All existing localStorage data remains compatible
3. The API interfaces remain the same
4. No changes needed to your application code

## Development vs Production

### Development
- Use the demo credentials for testing
- The system works offline with demo data
- All features available without Supabase setup

### Production
- **Must** configure real Supabase credentials
- Set up proper authentication flows
- Configure custom domain (optional)
- Set up database backups
- Monitor usage and performance

## Support

For issues with:
- **Supabase**: Check their [documentation](https://supabase.com/docs) or [community](https://github.com/supabase/supabase/discussions)
- **This integration**: Check the application logs and ensure all setup steps were followed

The system logs helpful messages about Supabase configuration status to the browser console.