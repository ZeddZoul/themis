import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getGithubClient } from '@/lib/github';
import { prisma } from '@/lib/prisma';

type RepositoryStatus = 'success' | 'warning' | 'error' | 'none';

interface RepositoryWithStatus {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  private: boolean;
  owner: any;
  html_url: string;
  description: string | null;
  fork: boolean;
  url: string;
  lastCheckStatus: RepositoryStatus;
  lastCheckDate?: Date;
  issueCount?: number;
}

export async function GET(request: Request) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const search = searchParams.get('search') || '';


    
    // 1. Get the App-authenticated client (JWT)
    const appOctokit = getGithubClient();
    
    // 2. Find the installation ID for this user
    // We need to know which installation to query
    let installationId: string | undefined;
    
    console.log('[DEBUG] Fetching repos for user:', session.user?.githubId);

    try {
      let username = session.user?.githubId || '';
      
      // Try to resolve numeric ID to username
      if (username && /^\d+$/.test(username)) {
        try {
          const { data: githubUser } = await appOctokit.request('GET /user/{id}', {
            id: username
          });
          if (githubUser && githubUser.login) {
            username = githubUser.login;
            console.log('[DEBUG] Resolved username:', username);
          }
        } catch (e) {
          console.log('[DEBUG] Could not resolve username from ID, trying ID as username');
        }
      }

      const { data: installation } = await appOctokit.request('GET /users/{username}/installation', {
        username: username,
      });
      
      if (installation && installation.id) {
        installationId = String(installation.id);
        console.log('[DEBUG] Found installation ID:', installationId);
      }
    } catch (error: any) {
      console.log('[DEBUG] Error finding installation:', error.status, error.message);
      if (error.status === 404) {
        // App not installed for this user
        return NextResponse.json({ 
          repositories: [],
          pagination: { total: 0, page: 1, pageSize, totalPages: 0 },
          needsInstallation: true 
        });
      }
      throw error;
    }

    if (!installationId) {
      console.log('[DEBUG] No installation ID found');
      return NextResponse.json({ 
        repositories: [],
        pagination: { total: 0, page: 1, pageSize, totalPages: 0 },
        needsInstallation: true 
      });
    }

    // 3. Get a user-authenticated client
    const userOctokit = getGithubClient(session.user?.accessToken);
    
    // Fetch all repositories (GitHub API paginates at 30 per page)
    let repositories: any[] = [];
    let fetchPage = 1;
    let hasMore = true;
    
    while (hasMore) {
      try {
        console.log(`[DEBUG] Fetching page ${fetchPage} for installation ${installationId}`);
        const { data } = await userOctokit.request('GET /user/installations/{installation_id}/repositories', {
          installation_id: Number(installationId),
          per_page: 100,
          page: fetchPage,
        });
        
        console.log(`[DEBUG] Page ${fetchPage} returned ${data.repositories?.length || 0} repos`);
        repositories = repositories.concat(data.repositories || []);
        
        // Check if there are more pages
        hasMore = data.repositories && data.repositories.length === 100;
        fetchPage++;
        
        // Safety limit to prevent infinite loops
        if (fetchPage > 10) break;
      } catch (err: any) {
        console.error('[DEBUG] Error listing repos:', err.message);
        throw err;
      }
    }
    


    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      repositories = repositories.filter((repo: any) => 
        repo.full_name.toLowerCase().includes(searchLower) ||
        repo.name.toLowerCase().includes(searchLower)
      );
    }

    // Get total count before pagination
    const total = repositories.length;
    const totalPages = Math.ceil(total / pageSize);

    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedRepos = repositories.slice(startIndex, endIndex);

    // Fetch last check status for each repository
    const repositoriesWithStatus: RepositoryWithStatus[] = await Promise.all(
      paginatedRepos.map(async (repo: any) => {
        // Find the latest check run for this repository
        const lastCheckRun = await prisma.checkRun.findFirst({
          where: {
            owner: repo.owner.login,
            repo: repo.name,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        let lastCheckStatus: RepositoryStatus = 'none';
        let lastCheckDate: Date | undefined;
        let issueCount: number | undefined;
        let errorType: string | null | undefined;
        let errorMessage: string | null | undefined;
        let errorDetails: string | null | undefined;

        if (lastCheckRun) {
          lastCheckDate = lastCheckRun.createdAt;

          // Check if the run failed
          if (lastCheckRun.status === 'FAILED') {
            lastCheckStatus = 'error';
            errorType = lastCheckRun.errorType;
            errorMessage = lastCheckRun.errorMessage;
            errorDetails = lastCheckRun.errorDetails;
          } else if (lastCheckRun.status === 'COMPLETED') {
            // Calculate status based on issues
            const issues = lastCheckRun.issues as any;
            if (issues && Array.isArray(issues)) {
              issueCount = issues.length;

              // Determine highest severity
              const hasCritical = issues.some((issue: any) => 
                issue.severity === 'high' || issue.severity === 'critical'
              );
              const hasWarning = issues.some((issue: any) => 
                issue.severity === 'medium' || issue.severity === 'warning'
              );

              if (hasCritical) {
                lastCheckStatus = 'error';
              } else if (hasWarning) {
                lastCheckStatus = 'warning';
              } else if (issues.length === 0) {
                lastCheckStatus = 'success';
              } else {
                lastCheckStatus = 'success'; // Low severity issues still count as success
              }
            } else {
              lastCheckStatus = 'success'; // No issues found
            }
          }
        }

        return {
          ...repo,
          lastCheckStatus,
          lastCheckDate,
          issueCount,
          errorType,
          errorMessage,
          errorDetails,
        };
      })
    );
    
    // Cache repository list for 5 minutes with stale-while-revalidate
    // Repositories don't change frequently, so longer cache is acceptable
    return NextResponse.json({ 
      repositories: repositoriesWithStatus,
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
      },
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600, max-age=120',
      },
    });
  } catch (error: any) {
    console.error('Error fetching repositories:', error.message || 'Unknown error');
    
    // Return empty array instead of error so UI doesn't break
    return NextResponse.json({ 
      repositories: [],
      pagination: {
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
      },
      error: error.message,
      needsInstallation: true 
    });
  }
}
