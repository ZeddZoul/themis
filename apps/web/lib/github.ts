import { Octokit } from 'octokit';
import { createAppAuth } from '@octokit/auth-app';

export function getGithubClient() {
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
  path: string
): Promise<string | null> {
  try {
    const octokit = getGithubClient();
    const { data: content }: any = await octokit.request(
      'GET /repos/{owner}/{repo}/contents/{path}',
      { owner, repo, path }
    );
    return Buffer.from(content.content, 'base64').toString('utf-8');
  } catch (error) {
    return null;
  }
}
