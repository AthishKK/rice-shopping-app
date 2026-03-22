# MongoDB Atlas Cluster Check

## Step 1: Login to MongoDB Atlas
1. Go to https://cloud.mongodb.com/
2. Login with your account
3. Select your project

## Step 2: Check Cluster Status
1. Look for "Cluster0" in your dashboard
2. Status should be "Active" (green)
3. If it shows "Paused" - click "Resume"

## Step 3: Check Network Access
1. Click "Network Access" in left sidebar
2. Check if your IP is whitelisted
3. Add current IP or use 0.0.0.0/0 (allow all) for testing

## Step 4: Check Database User
1. Click "Database Access" in left sidebar  
2. Verify user "Athish" exists
3. Check password is correct: 9047564020
4. Ensure user has "readWrite" permissions

## Step 5: Get Connection String
1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string
4. Replace <password> with: 9047564020

## If cluster is paused or doesn't exist:
- Create a new free cluster
- Set up database user
- Configure network access
- Get new connection string