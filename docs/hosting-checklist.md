# Hosting Deployment Checklist

This checklist ensures your Themis app is properly configured for production hosting.

## ✅ Pre-Deployment Checklist

### 1. Environment Variables Configuration

**Required Environment Variables:**
```bash
# Database (Production PostgreSQL)
DATABASE_URL="postgresql://username:password@host:port/database"

# Session Security
SESSION_SECRET="your-secure-32-character-secret-key"

# App URL (CRITICAL - Replace with your actual domain)
NEXT_PUBLIC_APP_URL="https://your-actual-domain.com"

# GitHub OAuth App
GITHUB_CLIENT_ID="your_github_oauth_client_id"
GITHUB_CLIENT_SECRET="your_github_oauth_client_secret"

# GitHub App (Optional - for enhanced features)
GITHUB_APP_ID="your_github_app_id"
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nyour_private_key_here\n-----END RSA PRIVATE KEY-----"
GITHUB_APP_INSTALLATION_ID="your_installation_id"

# AI Service
GEMINI_API_KEY="your_gemini_api_key"

# Environment
NODE_ENV="production"
```

### 2. GitHub OAuth App Setup

**CRITICAL: Update OAuth App URLs**

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Select your OAuth App
3. Update these URLs:
   - **Homepage URL**: `https://your-actual-domain.com`
   - **Authorization callback URL**: `https://your-actual-domain.com/api/v1/auth/github/callback`

### 3. GitHub App Setup (Optional)

If using GitHub App features:

1. Update `docs/github-app-manifest.json`:
   ```json
   {
     "url": "https://your-actual-domain.com",
     "redirect_url": "https://your-actual-domain.com/api/v1/auth/github/callback",
     "setup_url": "https://your-actual-domain.com/api/v1/github/setup",
     "callback_urls": [
       "https://your-actual-domain.com/api/v1/auth/github/callback"
     ]
   }
   ```

2. Create new GitHub App with updated manifest

### 4. Database Setup

**Production Database Requirements:**
- PostgreSQL 12+ recommended
- Ensure connection pooling is configured
- Run migrations: `npx prisma migrate deploy`
- Generate client: `npx prisma generate`

### 5. Build Verification

```bash
# Test build locally
npm run build
npm start

# Verify no hardcoded localhost URLs
grep -r "localhost" --exclude-dir=node_modules .
grep -r "127.0.0.1" --exclude-dir=node_modules .
```

## 🚀 Platform-Specific Deployment

### Vercel Deployment

1. **Environment Variables**: Add all required env vars in Vercel dashboard
2. **Database**: Use Vercel Postgres or external PostgreSQL
3. **Domain**: Configure custom domain in Vercel settings
4. **Build Command**: `npm run build` (default)
5. **Install Command**: `npm install` (default)

### Netlify Deployment

1. **Environment Variables**: Add in Netlify dashboard
2. **Build Command**: `npm run build`
3. **Publish Directory**: `.next`
4. **Functions**: Enable Next.js runtime

### Railway Deployment

1. **Environment Variables**: Set in Railway dashboard
2. **Database**: Use Railway PostgreSQL addon
3. **Domain**: Configure custom domain
4. **Auto-deploy**: Connect GitHub repository

### Docker Deployment

```dockerfile
# Use the provided Dockerfile (if exists) or create one
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔍 Post-Deployment Verification

### 1. Health Checks

- [ ] App loads at your domain
- [ ] GitHub OAuth login works
- [ ] Database connections successful
- [ ] AI compliance checks functional

### 2. Test Critical Flows

```bash
# Test OAuth flow
curl -I https://your-domain.com/api/v1/auth/github/login

# Test API endpoints
curl -H "x-api-key: your-api-key" https://your-domain.com/api/v1/repositories
```

### 3. Monitor Logs

Check for these common issues:
- Database connection errors
- Missing environment variables
- OAuth callback mismatches
- AI API rate limits

## 🛠️ Troubleshooting

### Common Issues

**1. OAuth Callback Mismatch**
```
Error: redirect_uri_mismatch
```
**Fix**: Ensure `NEXT_PUBLIC_APP_URL` matches your GitHub OAuth app callback URL

**2. Database Connection Failed**
```
Error: Can't reach database server
```
**Fix**: Verify `DATABASE_URL` and network connectivity

**3. Session Errors**
```
Error: Session secret required
```
**Fix**: Set `SESSION_SECRET` to a secure 32+ character string

**4. AI API Errors**
```
Error: Invalid API key
```
**Fix**: Verify `GEMINI_API_KEY` is correctly set

## 📋 Final Checklist

Before going live:

- [ ] All environment variables set correctly
- [ ] GitHub OAuth URLs updated to production domain
- [ ] Database migrations applied
- [ ] SSL certificate configured
- [ ] Custom domain configured
- [ ] Health checks passing
- [ ] Error monitoring setup (optional)
- [ ] Backup strategy in place (optional)

## 🔒 Security Notes

- Never commit `.env` files to version control
- Use strong, unique `SESSION_SECRET`
- Enable HTTPS in production
- Regularly rotate API keys
- Monitor for security vulnerabilities

## 📞 Support

If you encounter issues:
1. Check the logs for specific error messages
2. Verify all environment variables are set
3. Test OAuth flow manually
4. Check database connectivity
5. Review GitHub app/OAuth app settings