# Themis Checker

Automated compliance checking for mobile app repositories. Themis Checker analyzes your repositories for compliance with Apple App Store and Google Play Store requirements, including privacy policies, terms of service, and other mandatory documentation.

## Features

- 🔍 **Automated Compliance Analysis** - Scans repositories for required compliance documents
- 🤖 **AI-Powered Insights** - Uses Gemini AI to analyze document quality and completeness
- 📊 **Dashboard & Reports** - View compliance status across all your repositories
- 🔒 **Privacy-Focused** - Read-only access, code never stored or used for training
- 📱 **Mobile Responsive** - Works seamlessly on desktop and mobile devices
- ⚡ **Fast & Efficient** - Optimized performance with smart caching

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL database
- GitHub account
- Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/themis-checker.git
   cd themis-checker
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and configure:
   - Database connection
   - GitHub OAuth credentials
   - GitHub App credentials (see [GitHub App Setup](#github-app-setup))
   - Gemini API key

4. **Set up the database**
   ```bash
   pnpm prisma migrate dev
   ```

5. **Run the development server**
   ```bash
   pnpm dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## GitHub App Setup

Themis Checker requires a GitHub App to access your repositories. The app needs the following permissions:

- **Contents: Read** - Access repository files for compliance analysis
- **Metadata: Read** - Access basic repository information

### Quick Setup

1. Follow the detailed guide: [docs/github-app-setup.md](docs/github-app-setup.md)
2. Use the manifest template: [docs/github-app-manifest.json](docs/github-app-manifest.json)
3. Configure environment variables with your App ID, private key, and installation ID

### Required Permissions

The GitHub App must have these permissions configured:

| Permission | Access Level | Purpose |
|------------|--------------|---------|
| Contents | Read | Access repository files (privacy policies, terms, etc.) |
| Metadata | Read | Access repository information (name, owner, visibility) |

**Important**: The app only requests read-only access and never modifies your code.

## Configuration

### Environment Variables

See `.env.example` for all required environment variables:

```bash
# Database
DATABASE_URL="postgresql://username@localhost:5432/themis_checker"

# Session
SESSION_SECRET="your-secret-key-at-least-32-characters-long"

# GitHub OAuth App
GITHUB_CLIENT_ID="your_github_oauth_client_id"
GITHUB_CLIENT_SECRET="your_github_oauth_client_secret"

# GitHub App (see docs/github-app-setup.md)
GITHUB_APP_ID="your_github_app_id"
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GITHUB_APP_INSTALLATION_ID="your_installation_id"

# Gemini AI
GEMINI_API_KEY="your_gemini_api_key"
NODE_ENV="production"
```

## Usage

### Running Compliance Checks

1. **Log in** with your GitHub account
2. **Install the GitHub App** on your repositories
3. **Navigate to Repositories** to see your available repos
4. **Select a repository** and click "Run Check"
5. **View results** with detailed compliance analysis

### Understanding Results

Compliance checks analyze:
- Privacy policy presence and quality
- Terms of service documentation
- App Store specific requirements
- Play Store specific requirements
- Data collection disclosures

Results are categorized by severity:
- 🔴 **Critical** - Must be fixed before submission
- 🟡 **Warning** - Should be addressed
- 🟢 **Pass** - Meets requirements

## Development

### Project Structure

```
themis-checker/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   └── ...
├── components/            # React components
│   ├── dashboard/         # Dashboard-specific components
│   ├── layout/            # Layout components
│   └── ui/                # Reusable UI components
├── lib/                   # Utility libraries
│   ├── hooks/             # Custom React hooks
│   ├── compliance.ts      # Compliance analysis logic
│   ├── github.ts          # GitHub API client
│   └── ...
├── prisma/                # Database schema
├── docs/                  # Documentation
└── scripts/               # Validation scripts
```

### Running Tests

```bash
# Run all validation scripts
pnpm validate

# Run specific validations
pnpm validate:query        # TanStack Query integration
pnpm validate:ui           # UI components
pnpm validate:performance  # Performance optimizations
pnpm validate:a11y         # Accessibility features
```

### Building for Production

```bash
# Build the application
pnpm build

# Analyze bundle size
pnpm analyze

# Check bundle size limits
pnpm check-bundle-size
```

## Documentation

- **[GitHub App Setup](docs/github-app-setup.md)** - Complete guide for GitHub App configuration
- **[Testing & Validation](docs/testing-validation.md)** - Manual testing procedures
- **[Performance Monitoring](docs/performance-monitoring.md)** - Performance tracking setup
- **[Bundle Analysis](docs/bundle-analysis.md)** - Bundle size optimization
- **[Caching Strategy](docs/caching-strategy.md)** - Data caching with TanStack Query

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: GitHub OAuth
- **API Integration**: GitHub REST API, Gemini AI
- **State Management**: TanStack Query
- **Styling**: Tailwind CSS
- **Deployment**: Vercel (recommended)

## Security

- ✅ Read-only GitHub access
- ✅ Secure session management
- ✅ Environment variable protection
- ✅ No code storage or training usage
- ✅ HTTPS required in production

See [docs/github-app-setup.md](docs/github-app-setup.md) for security best practices.

## Performance

Target metrics:
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.5s
- Cumulative Layout Shift (CLS): < 0.1

See [docs/performance-monitoring.md](docs/performance-monitoring.md) for details.

## Accessibility

All components meet WCAG 2.1 AA compliance:
- ✅ Keyboard accessible
- ✅ Screen reader compatible
- ✅ Proper color contrast
- ✅ Touch targets ≥ 44x44px
- ✅ Semantic HTML

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[Your License Here]

## Support

For issues or questions:
1. Check the [documentation](docs/)
2. Review [GitHub App Setup Guide](docs/github-app-setup.md)
3. Open an issue on GitHub

---

**Built with ❤️ for mobile app developers**
