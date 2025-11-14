import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getGithubClient } from '@/lib/github';

export async function GET() {
  const session = await getSession();

  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    console.log('Fetching repositories...');
    console.log('GitHub App ID:', process.env.GITHUB_APP_ID);
    console.log('Installation ID:', process.env.GITHUB_APP_INSTALLATION_ID);
    
    const octokit = getGithubClient();
    const { data } = await octokit.request('GET /installation/repositories');
    console.log('Found repositories:', data.repositories?.length || 0);
    
    if (data.repositories && data.repositories.length > 0) {
      console.log('Repository names:', data.repositories.map((r: any) => r.full_name));
    }
    
    return NextResponse.json({ repositories: data.repositories || [] });
  } catch (error: any) {
    console.error('Error fetching repositories:', error.message);
    console.error('Error status:', error.status);
    console.error('Error details:', error.response?.data || error);
    
    // Return empty array instead of error so UI doesn't break
    return NextResponse.json({ 
      repositories: [],
      error: error.message,
      needsInstallation: true 
    });
  }
}
