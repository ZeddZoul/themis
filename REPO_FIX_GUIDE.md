# Repository Loading Fix Guide

## Problem
Repos API returns 200 OK but with empty repositories array after Cloud Run deployment.

## Root Cause
The GitHub OAuth login was not requesting any scopes, so the access token only had minimal permissions and couldn't access the user's installation repositories.

## Changes Made

### 1. Fixed OAuth Scopes (`app/api/v1/auth/github/login/route.ts`)
Added required OAuth scopes to the GitHub authorization URL:
- `repo` - Access to private repositories
- `read:user` - Read user profile data  
- `user:email` - Access to user email addresses

### 2. Enhanced Debug Logging (`app/api/v1/repositories/route.ts`)
Added comprehensive logging to track:
- Session user object
- Installation lookup process
- Repository fetch responses
- Error details

### 3. Created Debug Endpoint (`app/api/v1/debug/session/route.ts`)
New endpoint to test:
- Session state
- Access token validity
- GitHub API connectivity
- Installation status

## Deployment Steps

### Option 1: Quick Deploy (Recommended)
```bash
./quick-deploy-fix.sh
```

### Option 2: Manual Deploy
```bash
gcloud run deploy themis-checker \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production"
```

## Testing Steps

### 1. Re-authenticate
**IMPORTANT**: Existing users must logout and login again to get a new access token with proper scopes.

1. Visit your app
2. Click logout
3. Login again - you'll see GitHub asking for more permissions
4. Approve the permissions

### 2. Test Debug Endpoint
Visit: `https://your-app-url.run.app/api/v1/debug/session`

Expected response:
```json
{
  "isLoggedIn": true,
  "hasAccessToken": true,
  "githubApiTest": {
    "success": true,
    "login": "your-username"
  },
  "installation": {
    "success": true,
    "installationId": 12345
  }
}
```

### 3. Test Repos Loading
1. Go to `/dashboard/repos`
2. Repos should now load successfully

### 4. Check Logs
```bash
gcloud run services logs read themis-checker --region=us-central1 --limit=50
```

Look for:
- `[DEBUG] Session user object:` - Should show access token present
- `[DEBUG] Found installation ID:` - Should show your installation ID
- `[DEBUG] Total repositories fetched:` - Should show count > 0

## Troubleshooting

### Still No Repos After Re-login?

1. **Check Debug Endpoint**
   ```bash
   curl https://your-app-url.run.app/api/v1/debug/session
   ```

2. **Verify GitHub App Installation**
   - Go to GitHub Settings > Applications > Installed GitHub Apps
   - Ensure your app is installed and has repository access

3. **Check OAuth App Settings**
   - Go to GitHub Settings > Developer settings > OAuth Apps
   - Verify callback URL matches: `https://your-app-url.run.app/api/v1/auth/github/callback`

4. **Check Environment Variables**
   ```bash
   gcloud run services describe themis-checker --region=us-central1 --format="value(spec.template.spec.containers[0].env)"
   ```

### Error: "needsInstallation: true"
This means the GitHub App is not installed. User should:
1. Visit `/install-app`
2. Install the GitHub App
3. Grant repository access

### Error: "githubApiTest.success: false"
The access token is invalid or expired:
1. Logout and login again
2. Check if GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET are correct

## Why This Happened

When deploying to Cloud Run, the OAuth flow worked but without requesting scopes, GitHub only granted minimal "public read" access. This meant:
- ✅ OAuth login succeeded
- ✅ Session was created
- ✅ Access token was stored
- ❌ Access token couldn't read installation repositories
- ❌ API returned empty array instead of error

The fix ensures proper scopes are requested during OAuth, giving the access token permission to read installation repositories.

## Prevention

Always specify OAuth scopes explicitly in the authorization URL. Never rely on default scopes.

## Additional Notes

- The debug endpoint should be removed or protected in production
- Consider adding scope validation in the callback handler
- Monitor logs for any permission-related errors
