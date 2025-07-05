# Supabase Setup for TaskMore

This document provides the complete setup instructions for the Supabase backend used by TaskMore.

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  profilePic TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);
```

## Row Level Security (RLS) Policies

### Users Table Policies
- Users can view their own profile
- Users can update their own profile  
- Users can insert their own profile (for new sign-ups)

## Authentication Setup

1. **Enable Google OAuth** in Supabase Dashboard
2. **Configure redirect URLs** to include your app's domain
3. **Set up the user creation trigger** to automatically create user profiles

## Environment Variables

Add these to your `.env` file:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Complete Setup Script

Run the complete setup script in `database/complete_setup.sql` to create all tables, policies, and triggers.

## Notes

- The application now focuses on personal goal tracking without social features
- User profiles are simplified to just name and profile picture
- All authentication is handled through Google OAuth

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `taskmore`
   - Database Password: (generate a strong password)
   - Region: (choose closest to your users)
5. Click "Create new project"

## Step 2: Enable Google OAuth

1. In your Supabase dashboard, go to **Authentication** > **Providers**
2. Find **Google** and click "Enable"
3. You'll need to create a Google OAuth application:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google+ API
   - Go to **Credentials** > **Create Credentials** > **OAuth 2.0 Client IDs**
   - Set application type to "Web application"
   - Add authorized redirect URIs:
     - `https://your-project-ref.supabase.co/auth/v1/callback`
     - `http://localhost:5173/auth/callback` (for development)
4. Copy the Client ID and Client Secret to Supabase
5. Save the configuration

## Step 3: Database Setup

Run the complete setup script in your Supabase SQL editor:

```sql
-- Enable the uuid-ossp extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS users CASCADE;

-- Create users table with auth.users reference
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  profilePic TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users table policies
-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (for new sign-ups)
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Log the incoming user data for debugging
  RAISE LOG 'Creating user profile for: % with avatar: %', 
    new.email, 
    new.raw_user_meta_data->>'avatar_url';
    
  INSERT INTO public.users (id, name, profilePic)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'avatar_url', null)
  );
  
  RAISE LOG 'User profile created successfully for: %', new.email;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

## Step 4: Environment Variables

Create a `.env` file in your project root:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

You can find these values in your Supabase dashboard under **Settings** > **API**.

## Step 5: Test the Setup

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Test Authentication**:
   - Go to Settings page
   - Click "Login with Google"
   - Complete the OAuth flow
   - Verify you're signed in

3. **Test Profile Management**:
   - Click on your profile in Settings
   - Edit your name and profile picture
   - Save changes
   - Verify changes persist

## Troubleshooting

### Common Issues

1. **OAuth redirect errors**:
   - Verify redirect URLs in Google Cloud Console
   - Check Supabase OAuth configuration
   - Ensure HTTPS for production

2. **Database permission errors**:
   - Verify RLS policies are enabled
   - Check user authentication status
   - Review policy conditions

3. **Profile not created**:
   - Check the trigger function
   - Verify auth.users table has data
   - Review function logs in Supabase

### Verification Queries

Check if tables exist:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'users';
```

Check RLS policies:
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users';
```

## Production Considerations

1. **Security**:
   - Review all RLS policies
   - Test authentication flows thoroughly
   - Verify data isolation

2. **Performance**:
   - Monitor query performance
   - Add indexes as needed
   - Review connection pooling

3. **Monitoring**:
   - Set up error tracking
   - Monitor authentication success rates
   - Track database performance 