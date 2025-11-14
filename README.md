# Themis Checker

Automated compliance checking for Apple App Store and Google Play Store policies.

## Features

- 🔍 Automated compliance scanning for mobile app repositories
- 📋 Detailed reports with actionable solutions
- 🔒 Secure read-only access via GitHub App
- 📊 Check history and tracking
- 🎯 Support for both Apple App Store and Google Play Store policies

## Tech Stack

- **Frontend**: Next.js 14, React, TailwindCSS
- **Backend**: NestJS, Prisma, PostgreSQL
- **Auth**: GitHub OAuth + GitHub App
- **Monorepo**: pnpm workspaces

## Prerequisites

- Node.js 18+
- PostgreSQL
- pnpm
- GitHub account

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up PostgreSQL

```bash
createdb themis_checker
```

### 3. Configure GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Create a new OAuth App:
   - Homepage URL: `http://localhost:3000`
   - Callback URL: `http://localhost:3001/api/v1/auth/github/callback`
3. Copy Client ID and Client Secret

### 4. Configure GitHub App

1. Go to https://github.com/settings/apps
2. Create a new GitHub App:
   - Homepage URL: `http://localhost:3000`
   - Callback URL: `http://localhost:3001/api/v1/auth/github/callback`
   - Webhook: Disable for development
   - Permissions:
     - Repository Contents: Read-only
     - Repository Metadata: Read-only
3. Generate and download private key
4. Install the app on your repositories
5. Note the App ID and Installation ID

### 5. Configure Environment Variables

Create `apps/api/.env`:

```env
DATABASE_URL="postgresql://YOUR_USERNAME@localhost:5432/themis_checker"
SESSION_SECRET="your-secret-key"
GITHUB_CLIENT_ID="your-oauth-client-id"
GITHUB_CLIENT_SECRET="your-oauth-client-secret"
GITHUB_APP_ID="your-app-id"
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GITHUB_APP_INSTALLATION_ID="your-installation-id"
```

### 6. Run Database Migrations

```bash
cd apps/api
npx prisma generate
npx prisma migrate dev --name init
```

### 7. Start the Application

Terminal 1 - API:
```bash
cd apps/api
pnpm start:dev
```

Terminal 2 - Web:
```bash
pnpm dev
```

### 8. Access the Application

- Frontend: http://localhost:3000
- API: http://localhost:3001

## Usage

1. Navigate to http://localhost:3000
2. Click "Get Started" and sign in with GitHub
3. Select a repository from your dashboard
4. Choose the compliance check type (Apple, Google, or Both)
5. Review the compliance report with issues and solutions

## Project Structure

```
.
├── apps/
│   ├── api/          # NestJS backend
│   │   ├── src/
│   │   │   ├── auth/       # Authentication
│   │   │   ├── checks/     # Compliance checks
│   │   │   ├── compliance/ # Compliance logic
│   │   │   ├── github/     # GitHub integration
│   │   │   ├── prisma/     # Database
│   │   │   └── user/       # User management
│   │   └── prisma/
│   │       └── schema.prisma
│   └── web/          # Next.js frontend
│       ├── app/            # App router pages
│       └── components/     # React components
└── package.json
```

## API Endpoints

- `GET /api/v1/auth/github/login` - Initiate GitHub OAuth
- `GET /api/v1/auth/github/callback` - OAuth callback
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/user/me` - Get current user
- `GET /api/v1/repositories` - List user repositories
- `POST /api/v1/checks` - Run compliance check
- `GET /api/v1/repositories/:repoId/reports` - Get check history

## Development

### Run Tests
```bash
pnpm test
```

### Lint
```bash
pnpm lint
```

### Build
```bash
pnpm build
```

## License

UNLICENSED - Private project for hackathon
