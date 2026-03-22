# MongoDB Atlas Setup Guide

## Step 1: Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/atlas
2. Sign up for a free account
3. Create a new cluster (choose the free tier)

## Step 2: Configure Database Access
1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Create a user with username and password
4. Give it "Read and write to any database" permissions

## Step 3: Configure Network Access
1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Choose "Allow Access from Anywhere" (0.0.0.0/0) for development
   Or add your specific IP address for production

## Step 4: Get Connection String
1. Go to "Clusters" and click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string (it looks like):
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/<dbname>?retryWrites=true&w=majority

## Step 5: Update Your .env File
Replace your current MONGO_URI with the Atlas connection string:

```
MONGO_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/rice-shopping-app?retryWrites=true&w=majority
```

## Step 6: Test Connection
Run your backend server and check if it connects successfully.

## Benefits of MongoDB Atlas:
- ✅ Persistent data storage (won't reset on restart)
- ✅ Automatic backups
- ✅ Better performance and reliability
- ✅ Free tier available (512MB storage)
- ✅ Built-in security features
- ✅ Global availability

## Current Issue:
The local MongoDB might be losing data because:
1. It's not properly configured for persistence
2. Data might be stored in memory only
3. Database files might be getting cleared

MongoDB Atlas will solve all these persistence issues.