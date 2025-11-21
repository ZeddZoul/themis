
import { getFileContent } from '../lib/github';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testGithubFetch() {
  const owner = 'facebook';
  const repo = 'react';
  const file = 'README.md';

  console.log(`Testing fetch for ${owner}/${repo}/${file}...`);
  const content = await getFileContent(owner, repo, file);

  if (content) {
    console.log('✅ Fetch successful!');
    console.log('Content length:', content.length);
  } else {
    console.log('❌ Fetch failed.');
  }
}

testGithubFetch();
