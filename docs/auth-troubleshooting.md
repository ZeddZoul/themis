# Authentication Troubleshooting Guide

## Common Issue: `error=auth_failed`

If you're seeing `http://localhost:3000/login?error=auth_failed`, this typically means one of the following:

### 1. Missing Environment Variables

Check that your `.env.local` file contains:

```bash
# GitHub OAuth App (Required for login)
GITHUB_CLIENT_ID="your_github_oauth_client_id"
GITHUB_CLIENT_SECRET="your_github_oauth_client_secret"

# Session Secret (Required)
SESSION_SECRET="your-secret-key-at-least-32-characters-long"

# Database (Required)
DATABASE_URL="postgresql://username@localhost:5432/themis_checker"

# GitHub App (Required for repository access)
GITHUB_APP_ID="your_github_app_id"
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
your_private_key_here
-----END RSA PRIVATE KEY-----"
GITHUB_APP_INSTALLATION_ID="your_installation_id"

# Gemini AI (Required for compliance checks)
GEMINI_API_KEY="your_gemini_api_key"
```

### 2. GitHub OAuth App Not Configured

You need TWO separate GitHub configurations:
1. **GitHub OAuth App** - For user authentication (login)
2. **GitHub App** - For repository access

#### Creating a GitHub OAuth App:

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: Themis (Local Dev)
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/v1/auth/github/callback`
4. Click "Register application"
5. Copy the **Client ID** to `GITHUB_CLIENT_ID`
6. Generate a **Client Secret** and copy to `GITHUB_CLIENT_SECRET`

### 3. Database Not Running

Make sure PostgreSQL is running and the database exists:

```bash
# Check if PostgreSQL is running
psql --version

# Create database if it doesn't exist
createdb themis_checker

# Run migrations
npx prisma migrate dev
```

### 4. Checking the Logs

After updating the callback route with better logging, restart your dev server and attempt to login again. Check the terminal for detailed error messages that will show:
- The specific error that occurred
- Which environment variables are missing
- Stack trace for debugging

### 5. Session Secret

Generate a secure session secret:

```bash
# Generate a random 32+ character string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Quick Diagnostic

Run this command to check your environment:

```bash
# Check if required env vars are set
node -e "console.log({
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID ? 'Set' : 'MISSING',
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET ? 'Set' : 'MISSING',
  SESSION_SECRET: process.env.SESSION_SECRET ? 'Set' : 'MISSING',
  DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'MISSING',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'Set' : 'MISSING'
})"
```

## Still Having Issues?

Check the terminal logs after attempting to login. The enhanced error logging will show exactly what's failing.
