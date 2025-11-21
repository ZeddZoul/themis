import { Octokit } from 'octokit';
import { createAppAuth } from '@octokit/auth-app';

/**
 * Creates an authenticated GitHub client using GitHub App credentials.
 * 
 * Required permissions:
 * - Contents: Read (to access repository files)
 * - Metadata: Read (to access repository information)
 * 
 * For setup instructions, see: docs/github-app-setup.md
 */
export function getGithubClient(accessToken?: string) {
  if (accessToken) {
    return new Octokit({
      auth: accessToken,
    });
  }

  const hasGithubConfig = process.env.GITHUB_APP_ID && process.env.GITHUB_APP_PRIVATE_KEY;

  if (hasGithubConfig) {
    return new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: process.env.GITHUB_APP_ID,
        privateKey: (process.env.GITHUB_APP_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        installationId: process.env.GITHUB_APP_INSTALLATION_ID,
      },
    });
  } else {
    return new Octokit();
  }
}

export async function getFileContent(
  owner: string,
  repo: string,
  path: string,
  branch?: string,
  accessToken?: string
): Promise<string | null> {
  try {
    const octokit = getGithubClient(accessToken);
    const { data: content }: any = await octokit.request(
      'GET /repos/{owner}/{repo}/contents/{path}',
      { owner, repo, path, ref: branch }
    );
    return Buffer.from(content.content, 'base64').toString('utf-8');
  } catch (error) {
    console.error(`[GitHub] Error fetching ${path}:`, error);
    return null;
  }
}

export async function getRepoBranches(
  owner: string,
  repo: string
): Promise<Array<{ name: string; protected: boolean }>> {
  try {
    const octokit = getGithubClient();
    const { data: branches } = await octokit.request(
      'GET /repos/{owner}/{repo}/branches',
      { owner, repo, per_page: 100 }
    );
    return branches.map((branch: any) => ({
      name: branch.name,
      protected: branch.protected,
    }));
  } catch (error) {
    console.error('Error fetching branches:', error);
    return [];
  }
}

export async function getDefaultBranch(
  owner: string,
  repo: string
): Promise<string> {
  try {
    const octokit = getGithubClient();
    const { data: repository } = await octokit.request(
      'GET /repos/{owner}/{repo}',
      { owner, repo }
    );
    return repository.default_branch || 'main';
  } catch (error) {
    console.error('Error fetching default branch:', error);
    return 'main';
  }
}
