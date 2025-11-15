# Branch-Specific Checks Implementation Plan

## ✅ Completed

1. **Database Schema Updated**
   - Added `branchName` field to CheckRun model
   - Added index for `[owner, repo]`
   - Migrated database

2. **GitHub API Helpers Created**
   - `getRepoBranches()` - Fetch all branches
   - `getDefaultBranch()` - Get default branch
   - Updated `getFileContent()` to accept branch parameter

3. **API Endpoints Created**
   - `/api/v1/repositories/[owner]/[repo]/branches` - Get branches for a repo

4. **Compliance Logic Updated**
   - `analyzeRepositoryCompliance()` accepts `branchName` parameter
   - `fetchRelevantFiles()` uses branch when fetching files
   - `createCheckRun()` stores branch name
   - `analyzeAndPersistCompliance()` accepts and uses branch

5. **Check API Updated**
   - `/api/v1/checks` POST accepts `branchName` parameter
   - Uses provided branch or falls back to default

6. **UI Components Created**
   - `BranchSelector` component with dropdown

## 🚧 Remaining Tasks

### 1. Update RepositoryCard Component
- [ ] Fetch branches for the repository
- [ ] Add BranchSelector to card (same row as status badge)
- [ ] Store selected branch in component state
- [ ] Pass selected branch to `onStartCheck`

### 2. Update Repos Page
- [ ] Update `handleStartCheck` to accept and pass branch parameter
- [ ] Update API call to include `branchName`

### 3. Create Check History Page
- [ ] Create `/checks/[owner]/[repo]/page.tsx`
- [ ] List all checks for that repository
- [ ] Show: Date, Branch, Platform, Issue Count
- [ ] Make each check clickable → navigate to `/check/[checkId]`
- [ ] Sort by date (most recent first)

### 4. Update Check Results Page
- [ ] Display branch name in header
- [ ] Update to show branch information

### 5. Update Latest Check API
- [ ] Modify `/api/v1/checks/latest/[repoFullName]` to prioritize recent checks
- [ ] Consider branch in the query (optional: get latest per branch)

### 6. Create Check History API
- [ ] Create `/api/v1/checks/history/[owner]/[repo]` endpoint
- [ ] Return all checks for a repository
- [ ] Sort by `createdAt DESC`
- [ ] Include pagination

## 📝 Notes

- Branch selector should default to repository's default branch
- Recent checks take precedence over old checks
- Each check is tied to a specific branch
- Check history shows all checks across all branches
