# Supabase Setup for Machine History QR

This guide will help you set up Supabase as the database for your Machine History QR application.

## Step 1: Create a Supabase Project

1. Go to [https://app.supabase.io](https://app.supabase.io) and sign in with your GitHub account
2. Click "New Project"
3. Fill in the project details:
   - Name: `machine-history-qr` (or your preferred name)
   - Database Password: Create a secure password
   - Region: Choose the region closest to your users
4. Click "Create new project"

## Step 2: Set Up Database Schema

1. In your Supabase project, go to the SQL Editor
2. Create a new query
3. Copy and paste the contents of `supabase/schema.sql` from this repository
4. Run the query to create the necessary tables and policies

## Step 3: Get API Credentials

1. In your Supabase project, go to Project Settings > API
2. Copy the following values:
   - Project URL (under "Project Configuration")
   - anon/public key (under "Project API keys")

## Step 4: Update Environment Variables

1. Open the `.env` file in your project
2. Replace the placeholder values with your actual Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

## Step 5: Test the Connection

1. Start your application
2. Try to create a new machine
3. Check the Supabase dashboard to verify that the data is being stored

## Troubleshooting

### Data Not Persisting

- Make sure your environment variables are correctly set
- Check the browser console for any errors
- Verify that the Supabase client is properly initialized

### Authentication Issues

- If you're using authentication, make sure to set up the appropriate auth providers in Supabase
- Check that your RLS policies are correctly configured

### Mobile Issues

- Ensure your mobile app is using the correct API URL
- Check that CORS is properly configured in your Supabase project

## Additional Resources

- [Supabase Documentation](https://supabase.io/docs)
- [Supabase JavaScript Client](https://supabase.io/docs/reference/javascript/introduction)
- [Row Level Security](https://supabase.io/docs/guides/auth/row-level-security) 