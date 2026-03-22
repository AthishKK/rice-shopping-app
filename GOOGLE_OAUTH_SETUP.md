# Google OAuth Setup Guide

## Step 1: Get Google Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API:
   - Go to "APIs & Services" → "Library"
   - Search "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Name: "Rice Shopping App"
   - Authorized JavaScript origins:
     - http://localhost:3000
     - http://localhost:3001
   - Authorized redirect URIs:
     - http://localhost:3000
     - http://localhost:3001
5. Copy the Client ID

## Step 2: Update Environment Files

**Frontend (.env):**
```
REACT_APP_GOOGLE_CLIENT_ID=your_actual_google_client_id_here
```

**Backend (.env):**
```
GOOGLE_CLIENT_ID=your_actual_google_client_id_here
```

## Step 3: Test Real Google OAuth

After setup, the Google button will:
1. Show Google account selection popup
2. Let you choose from your Gmail accounts
3. Return real user data (name, email, profile picture)
4. Create account automatically if first time

## Temporary Mock vs Real OAuth

**Current (Mock):**
- Uses fake data: "Google Test User" / "testuser@gmail.com"
- No account selection
- Works without setup

**Real OAuth (After setup):**
- Shows your actual Google accounts
- Account selection popup
- Real user data from Google
- Requires Google Client ID