# GitHub App Setup and Configuration

This guide provides detailed instructions for setting up and configuring the Themis Checker GitHub App with the correct permissions to access both public and private repositories.

## Overview

The Themis Checker GitHub App requires specific permissions to analyze your repositories for compliance issues. This document outlines the required permissions and provides step-by-step instructions for configuration.

## Required Permissions

### Repository Permissions

The GitHub App requires the following **read-only** permissions:

| Permission | Access Level | Purpose |
|------------|--------------|---------|
| **Contents** | Read | Access repository files (privacy policies, terms of service, etc.) |
| **Metadata** | Read | Access basic repository information (name, owner, visibility) |

### Important Notes

- ✅ **Read-only access**: The app never modifies your code
- ✅ **No write permissions**: Your repositories remain unchanged
- ✅ **Privacy-focused**: Code is analyzed but never stored or used for training
- ✅ **Public and private**: Works with both public and private repositories

## Creating a New GitHub App

If you're setting up the Themis GitHub App for the first time, follow these steps:

### Option A: Using the Manifest (Recommended)

GitHub allows you to create an app from a manifest file for faster setup:

1. Use the manifest template at `docs/github-app-manifest.json`
2. Update the URLs to match your domain
3. Navigate to: `https://github.com/settings/apps/new`
4. Paste the manifest JSON when prompted
5. GitHub will create the app with the correct permissions

### Option B: Manual Setup

### Step 1: Navigate to GitHub App Settings

1. Go to your GitHub account settings
2. Navigate to **Developer settings** → **GitHub Apps**
3. Click **New GitHub App**

### Step 2: Configure Basic Information

Fill in the following fields:

- **GitHub App name**: `themis-checker` (or your preferred name)
- **Homepage URL**: Your application URL (e.g., `https://your-domain.com`)
- **Callback URL**: `https://your-domain.com/api/v1/auth/github/callback`
- **Setup URL**: `https://your-domain.com/api/v1/github/setup`
- **Webhook**: Disable (not required for this app)

### Step 3: Set Repository Permissions

In the **Repository permissions** section, configure:

```
Contents: Read
Metadata: Read
```

**All other permissions should remain at "No access"**

### Step 4: Configure Installation Settings

Under **Where can this GitHub App be installed?**:

- Select **Any account** if you want others to install your app
- Select **Only on this account** if it's for personal use only

### Step 5: Create the App

1. Click **Create GitHub App**
2. Note your **App ID** (you'll need this for configuration)
3. Generate a **private key** and download it securely

## Updating an Existing GitHub App

If you already have a GitHub App but need to update permissions:

### Step 1: Access Your GitHub App

1. Go to **GitHub Settings** → **Developer settings** → **GitHub Apps**
2. Click on your **Themis Checker** app

### Step 2: Update Permissions

1. Scroll to **Repository permissions**
2. Update the following permissions:
   - **Contents**: Change to **Read** (if not already set)
   - **Metadata**: Change to **Read** (if not already set)
3. Click **Save changes**

### Step 3: User Re-authorization

**Important**: When you update permissions, existing installations will need to accept the new permissions:

1. GitHub will notify users of the permission changes
2. Users must approve the new permissions for the app to continue working
3. Until approved, the app will have limited functionality

## Installing the GitHub App

### For Repository Owners

1. Navigate to `https://github.com/apps/themis-checker/installations/new`
2. Select the account where you want to install the app
3. Choose repository access:
   - **All repositories**: Grants access to all current and future repositories
   - **Only select repositories**: Choose specific repositories to analyze

### Recommended: All Repositories

We recommend selecting **All repositories** for the best experience:

- ✅ Automatically includes new repositories
- ✅ No need to manually add repositories later
- ✅ Seamless workflow for compliance checking
- ✅ Still maintains read-only access (no modifications)

### For Users Installing via the App

1. Click **Install GitHub App** in the Themis Checker application
2. You'll be redirected to GitHub
3. Select repositories to grant access
4. Click **Install**
5. You'll be redirected back to the application

## Configuration in Your Application

After creating or updating your GitHub App, configure your application with the credentials:

### Environment Variables

Add the following to your `.env.local` file:

```bash
# GitHub App Configuration
GITHUB_APP_ID="your_app_id_here"
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
your_private_key_here
-----END RSA PRIVATE KEY-----"
GITHUB_APP_INSTALLATION_ID="your_installation_id_here"
```

### Finding Your Installation ID

1. Install the app on your account/organization
2. Go to `https://github.com/settings/installations`
3. Click on your Themis Checker installation
4. The installation ID is in the URL: `https://github.com/settings/installations/{installation_id}`

## Verifying Permissions

### Test Repository Access

After configuration, verify the app can access repositories:

1. Log in to Themis Checker
2. Navigate to the **Repositories** page
3. You should see both public and private repositories listed
4. Try running a compliance check on a private repository

### Expected Behavior

✅ **Success indicators**:
- Both public and private repositories appear in the list
- Compliance checks complete successfully
- File contents are accessible for analysis

❌ **Permission issues**:
- Only public repositories appear
- Error: "Permission denied" or "Unable to access repository"
- Compliance checks fail with 403 errors

## Troubleshooting

### Issue: Cannot Access Private Repositories

**Symptoms**:
- Only public repositories are visible
- 403 Forbidden errors when running checks

**Solutions**:
1. Verify **Contents: Read** permission is set in GitHub App settings
2. Ensure the app is installed on the correct account/organization
3. Check that you selected "All repositories" or included the specific private repository
4. Re-install the app if permissions were recently updated

### Issue: "Missing Required Permissions" Error

**Symptoms**:
- Error message about insufficient permissions
- Cannot read repository files

**Solutions**:
1. Update GitHub App permissions to include **Contents: Read**
2. Save changes in GitHub App settings
3. Users must accept the new permissions
4. Wait for permission approval before retrying

### Issue: Installation ID Not Found

**Symptoms**:
- App cannot authenticate with GitHub
- "Installation not found" errors

**Solutions**:
1. Verify `GITHUB_APP_INSTALLATION_ID` is correct in `.env.local`
2. Check that the app is actually installed on your account
3. Visit `https://github.com/settings/installations` to confirm
4. Reinstall the app if necessary

### Issue: Private Key Format Error

**Symptoms**:
- Authentication fails
- "Invalid private key" errors

**Solutions**:
1. Ensure the private key includes the full header and footer:
   ```
   -----BEGIN RSA PRIVATE KEY-----
   ...
   -----END RSA PRIVATE KEY-----
   ```
2. Use `\n` for newlines in `.env.local` (the app will convert them)
3. Regenerate the private key if it's corrupted

## Security Best Practices

### Protect Your Private Key

- ✅ Never commit the private key to version control
- ✅ Store it securely in environment variables
- ✅ Use `.env.local` for local development (already in `.gitignore`)
- ✅ Use secure secret management in production (e.g., Vercel secrets, AWS Secrets Manager)

### Limit Permissions

- ✅ Only request **Read** access (never Write)
- ✅ Only request permissions you actually need
- ✅ Regularly audit app permissions
- ✅ Remove unused permissions

### Monitor Usage

- ✅ Review GitHub App installation logs
- ✅ Monitor API rate limits
- ✅ Track which repositories are being accessed
- ✅ Audit compliance check history

## Permission Change History

### Current Version (v1.0)

**Required Permissions**:
- Contents: Read
- Metadata: Read

**Rationale**:
- **Contents: Read** - Required to access repository files for compliance analysis (privacy policies, terms of service, etc.)
- **Metadata: Read** - Required to access basic repository information (name, owner, visibility status)

### Future Considerations

If additional features are added, we may need to request:
- **Pull requests: Write** - To create automated compliance reports as PR comments
- **Issues: Write** - To create issues for compliance violations
- **Checks: Write** - To integrate with GitHub Checks API

**Note**: Any permission changes will be documented here and users will be notified.

## Support and Resources

### Documentation

- [GitHub Apps Documentation](https://docs.github.com/en/developers/apps)
- [GitHub App Permissions](https://docs.github.com/en/developers/apps/building-github-apps/setting-permissions-for-github-apps)
- [Installing GitHub Apps](https://docs.github.com/en/developers/apps/managing-github-apps/installing-github-apps)

### Getting Help

If you encounter issues with GitHub App setup:

1. Review this documentation thoroughly
2. Check the troubleshooting section above
3. Verify your environment variables are correct
4. Check application logs for specific error messages
5. Contact support with:
   - Error messages
   - Steps to reproduce
   - GitHub App configuration (without private key)

## Checklist

Use this checklist to ensure proper GitHub App configuration:

- [ ] GitHub App created with correct name and URLs
- [ ] **Contents: Read** permission enabled
- [ ] **Metadata: Read** permission enabled
- [ ] All other permissions set to "No access"
- [ ] Private key generated and downloaded
- [ ] App installed on your account/organization
- [ ] "All repositories" selected (or specific repositories chosen)
- [ ] `GITHUB_APP_ID` added to `.env.local`
- [ ] `GITHUB_APP_PRIVATE_KEY` added to `.env.local`
- [ ] `GITHUB_APP_INSTALLATION_ID` added to `.env.local`
- [ ] Application restarted to load new environment variables
- [ ] Verified both public and private repositories are accessible
- [ ] Successfully ran a compliance check on a private repository

---

**Last Updated**: November 2025  
**Version**: 1.0.0  
**Maintained by**: Themis Checker Team

