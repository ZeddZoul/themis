# Free Deployment Guide - Vercel + Neon

## 100% Free Forever Solution

Deploy your Themis Checker app completely free using:
- **Vercel** - Free Next.js hosting
- **Neon** - Free PostgreSQL database

## Step 1: Set Up Neon Database (2 minutes)

1. Go to https://neon.tech
2. Sign up with GitHub (free, no credit card)
3. Create a new project: "themis-checker"
4. Copy your connection string:
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb
   ```

## Step 2: Deploy to Vercel (3 minutes)

### Option A: Via Vercel Dashboard (Easiest)

1. Go to https://vercel.com
2. Sign up with GitHub
3. Click "Add New Project"
4. Import your GitHub repository
5. Configure environment variables:
   - `DATABASE_URL` - Your Neon connection string
   - `SESSION_SECRET` - Random 32+ character string
   - `GITHUB_APP_ID` - Your GitHub App ID
   - `GITHUB_APP_PRIVATE_KEY` - Your private key
   - `GITHUB_CLIENT_ID` - OAuth client ID
   - `GITHUB_CLIENT_SECRET` - OAuth secret
   - `GEMINI_API_KEY` - Your Gemini key
   - `NEXTAUTH_URL` - Leave empty (auto-set by Vercel)
6. Click "Deploy"

### Option B: Via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Set environment variables
vercel env add DATABASE_URL
vercel env add SESSION_SECRET
vercel env add GITHUB_APP_ID
vercel env add GITHUB_APP_PRIVATE_KEY
vercel env add GITHUB_CLIENT_ID
vercel env add GITHUB_CLIENT_SECRET
vercel env add GEMINI_API_KEY

# Deploy to production
vercel --prod
```

## Step 3: Run Database Migrations

```bash
# Set your DATABASE_URL locally
export DATABASE_URL="your-neon-connection-string"

# Run migrations
npx prisma migrate deploy

# Or generate and push schema
npx prisma db push
```

## Step 4: Update GitHub App URLs

After deployment, update your GitHub App settings:
- Homepage URL: `https://your-app.vercel.app`
- Callback URL: `https://your-app.vercel.app/api/auth/callback/github`
- Webhook URL: `https://your-app.vercel.app/api/webhooks/github`

## Free Tier Limits

### Vercel Free Tier
- ✅ 100GB bandwidth/month
- ✅ Unlimited deployments
- ✅ Automatic HTTPS
- ✅ Custom domains
- ✅ Serverless functions (100GB-hours)
- ⚠️ 10 second function timeout
- ⚠️ 1024MB function memory

### Neon Free Tier
- ✅ 0.5GB storage
- ✅ Unlimited queries
- ✅ Auto-scales to zero
- ✅ Point-in-time restore (7 days)
- ⚠️ 1 project
- ⚠️ 10 branches

## Configuration for Vercel

Create `vercel.json`:

```json
{
  "buildCommand": "prisma generate && next build",
  "devCommand": "next dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "DATABASE_URL": "@database-url",
    "SESSION_SECRET": "@session-secret",
    "GITHUB_APP_ID": "@github-app-id",
    "GITHUB_APP_PRIVATE_KEY": "@github-app-private-key",
    "GITHUB_CLIENT_ID": "@github-client-id",
    "GITHUB_CLIENT_SECRET": "@github-client-secret",
    "GEMINI_API_KEY": "@gemini-api-key"
  }
}
```

## Alternative: Railway (Free $5/month)

If you prefer an all-in-one solution:

1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Add PostgreSQL database (included)
6. Set environment variables
7. Deploy!

**Railway includes:**
- Web hosting
- PostgreSQL database
- $5 free credit/month
- No credit card needed initially

## Cost Comparison

| Solution | Cost | Database | Bandwidth |
|----------|------|----------|-----------|
| **Vercel + Neon** | $0 | 0.5GB | 100GB/mo |
| **Railway** | $0* | Unlimited | Fair use |
| **Render** | $0** | 90 days free | Fair use |
| **Cloud Run + Cloud SQL** | ~$12/mo | 10GB | Unlimited |

*$5 credit/month, then pay-as-you-go
**Free tier spins down after inactivity

## Monitoring & Logs

### Vercel
```bash
# View logs
vercel logs

# View deployments
vercel ls
```

### Neon
- Dashboard: https://console.neon.tech
- View queries, connections, storage usage

## Upgrading Later

When you outgrow free tier:

**Vercel Pro:** $20/month
- Unlimited bandwidth
- Advanced analytics
- Team collaboration

**Neon Pro:** $19/month
- 10GB storage
- Unlimited projects
- Better performance

## Troubleshooting

### Build fails on Vercel
```bash
# Ensure Prisma generates before build
# Add to package.json:
"scripts": {
  "build": "prisma generate && next build"
}
```

### Database connection fails
- Check Neon connection string is correct
- Ensure DATABASE_URL is set in Vercel
- Verify database is not suspended (free tier auto-suspends)

### Function timeout
- Vercel free tier has 10s timeout
- Optimize long-running operations
- Consider upgrading for 60s timeout

## Best Practices

1. **Use connection pooling** - Neon supports it natively
2. **Optimize queries** - Free tier has limited resources
3. **Monitor usage** - Check Vercel and Neon dashboards
4. **Set up alerts** - Get notified before hitting limits
5. **Cache aggressively** - Reduce database queries

## You're All Set! 🎉

Your app is now running completely free with:
- ✅ Production-ready hosting
- ✅ PostgreSQL database
- ✅ Automatic deployments
- ✅ HTTPS included
- ✅ No credit card required

Deploy command:
```bash
vercel --prod
```

That's it! 🚀
