# Authentication Setup Instructions

## 1. MongoDB Atlas Setup

1. Go to MongoDB Atlas (https://cloud.mongodb.com/)
2. Create/Login to your account
3. Create a new cluster or use existing
4. Go to Database Access → Add New Database User
5. Create a user with username: `Athish` and set a password
6. Go to Network Access → Add IP Address → Allow access from anywhere (0.0.0.0/0)
7. Update the backend/.env file:
   ```
   MONGODB_URI=mongodb+srv://Athish:YOUR_ACTUAL_PASSWORD@cluster0.j8egj2x.mongodb.net/?appName=Cluster0
   ```

## 2. Google OAuth Setup

1. Go to Google Cloud Console (https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client IDs
5. Set Application type: Web application
6. Add Authorized JavaScript origins:
   - http://localhost:3000
   - http://localhost:3001
7. Add Authorized redirect URIs:
   - http://localhost:3000
   - http://localhost:3001
8. Copy the Client ID and update files:

   **Backend (.env):**
   ```
   GOOGLE_CLIENT_ID=your_google_client_id_here
   ```

   **Frontend (.env):**
   ```
   REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here
   ```

## 3. JWT Secret Setup

Update backend/.env:
```
JWT_SECRET=your_super_secret_jwt_key_make_it_long_and_random_123456789
```

## 4. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

## 5. Test the Complete Flow

1. **Signup Flow:**
   - Go to http://localhost:3000/signup
   - Fill all fields
   - Click "Create Account"
   - Should redirect to login with success message

2. **Login Flow:**
   - Enter email/password → Should login and redirect to home
   - Try Google login → Should work with Google popup

3. **Protected Routes:**
   - Try accessing /cart without login → Should redirect to login
   - Login and try /cart → Should work

4. **Logout:**
   - Click user dropdown → Logout → Should clear session

## 6. Database Collections

The app will automatically create these collections:
- `users` - User accounts and profiles

## 7. Environment Files Summary

**backend/.env:**
```
MONGODB_URI=mongodb+srv://Athish:YOUR_PASSWORD@cluster0.j8egj2x.mongodb.net/?appName=Cluster0
JWT_SECRET=your_super_secret_jwt_key_make_it_long_and_random_123456789
GOOGLE_CLIENT_ID=your_google_client_id_here
PORT=5000
```

**frontend/.env:**
```
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here
REACT_APP_API_URL=http://localhost:5000
```