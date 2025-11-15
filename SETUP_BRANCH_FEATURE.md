# Branch Feature Setup Guide

## ⚠️ Important: Restart Required

After implementing the branch-specific checks feature, you need to **restart the Next.js development server** for the new API routes to be recognized.

## Steps to Complete Setup

### 1. Restart Development Server

```bash
# Stop the current dev server (Ctrl+C)
# Then restart it
npm run dev
# or
yarn dev
# or
pnpm dev
```

### 2. Verify Routes Are Working

After restart, check that these endpoints work:

- `GET /api/v1/branches/[owner]/[repo]` - Should return branches
- `GET /api/v1/checks/history/[owner]/[repo]` - Should return check history

### 3. Test the Feature

1. **Navigate to Repositories page** (`/dashboard/repos`)
2. **Check branch selector** - Should show branches for each repo
3. **Select a branch** - Dropdown should work
4. **Run a check** - Should complete successfully
5. **Click repo card** - Should navigate to check history
6. **View check history** - Should show all checks with branches
7. **Click a check** - Should show detailed results with branch name

## Troubleshooting

### If branch selector shows "Loading..." forever:

1. Check browser console for errors
2. Verify the API route exists: `app/api/v1/branches/[owner]/[repo]/route.ts`
3. Restart dev server
4. Check that GitHub API credentials are valid

### If you see 404 errors for branches endpoint:

- **Solution**: Restart the Next.js dev server
- Next.js App Router requires restart to pick up new dynamic route segments
- **Note**: Route was moved to `/api/v1/branches/` to avoid conflicts with existing `/api/v1/repositories/[repoId]/` routes

### If branches show but checks fail:

1. Check that `branchName` field exists in database:
   ```bash
   npx prisma studio
   # Check CheckRun table for branchName column
   ```

2. If missing, run migration:
   ```bash
   npx prisma db push
   ```

## Expected Behavior

### Repository Card
- Shows branch selector next to status badge
- Defaults to repository's default branch
- Lists all branches in dropdown
- Protected branches show badge

### Check History Page
- Accessible by clicking repo card
- Shows all checks for that repository
- Displays: Date, Branch, Platform, Status, Issues
- Sorted by most recent first
- Each check is clickable

### Check Results Page
- Shows repository name and branch
- Displays all compliance issues
- Grouped by severity

## API Endpoints

All new endpoints are authenticated and require a valid session:

- `GET /api/v1/branches/[owner]/[repo]`
  - Returns: `{ branches: Branch[], defaultBranch: string }`

- `GET /api/v1/checks/history/[owner]/[repo]`
  - Returns: `{ checks: CheckRun[] }`

- `POST /api/v1/checks`
  - Body: `{ repoId: number, checkType: string, branchName?: string }`
  - Returns: Check results

## Database Schema

The `CheckRun` table now includes:
- `branchName` (String, default: "main")
- Index on `[owner, repo]` for efficient queries

## Notes

- Branch selector has fallback to "main" if API fails
- All checks are tied to a specific branch
- Recent checks take precedence (sorted by date DESC)
- Check history shows all checks across all branches
