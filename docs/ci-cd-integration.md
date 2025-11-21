# CI/CD Integration

Themis can be integrated into your CI/CD pipeline to automatically check your mobile app repositories for compliance on every pull request.

## Prerequisites

1.  **Themis Instance**: You need a running instance of Themis.
2.  **API Key**: Generate an API Key for your user (currently manual database entry).

## GitHub Actions Integration

You can use our provided script or create a custom workflow step.

### 1. Add the Script

Copy `scripts/ci-check.ts` to your repository (or keep it in the Themis repo if you are running checks from there).

### 2. Configure Secrets

Add the following secrets to your GitHub repository:
- `THEMIS_API_KEY`: Your API Key
- `THEMIS_APP_URL`: The URL of your Themis instance (e.g., `https://themis.yourcompany.com`)

### 3. Create Workflow

Create `.github/workflows/compliance.yml`:

```yaml
name: Compliance Check

on: [pull_request]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm install -g ts-node node-fetch

      - name: Run Themis Check
        run: npx ts-node scripts/ci-check.ts
        env:
          THEMIS_API_KEY: ${{ secrets.THEMIS_API_KEY }}
          THEMIS_APP_URL: ${{ secrets.THEMIS_APP_URL }}
          THEMIS_CHECK_TYPE: 'MOBILE_PLATFORMS'
```

## API Key Generation

Currently, API keys must be generated manually by an administrator.
Ask your admin to generate a key and associate it with your user account.
