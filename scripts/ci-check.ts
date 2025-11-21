#!/usr/bin/env node

/**
 * Themis CI/CD Check Script
 * 
 * Usage:
 *   export THEMIS_API_KEY="your_api_key"
 *   export THEMIS_APP_URL="https://your-themis-instance.com"
 *   npx ts-node scripts/ci-check.ts
 */

// Native fetch is used in Node 18+

const API_KEY = process.env.THEMIS_API_KEY;
const APP_URL = process.env.THEMIS_APP_URL || 'http://localhost:3000';
const REPO = process.env.GITHUB_REPOSITORY; // "owner/repo"
const BRANCH = process.env.GITHUB_REF_NAME || 'main';
const CHECK_TYPE = process.env.THEMIS_CHECK_TYPE || 'MOBILE_PLATFORMS';

if (!API_KEY) {
  console.error('Error: THEMIS_API_KEY environment variable is required');
  process.exit(1);
}

if (!REPO) {
  console.error('Error: GITHUB_REPOSITORY environment variable is required (e.g. "owner/repo")');
  process.exit(1);
}

const [owner, repoName] = REPO.split('/');

async function runCheck() {
  console.log(`🚀 Starting Themis compliance check for ${owner}/${repoName}@${BRANCH}...`);

  try {
    // 1. Trigger Check
    const triggerResponse = await fetch(`${APP_URL}/api/v1/checks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY!,
      },
      body: JSON.stringify({
        owner,
        repo: repoName,
        branchName: BRANCH,
        checkType: CHECK_TYPE,
      }),
    });

    if (!triggerResponse.ok) {
      const error = await triggerResponse.text();
      throw new Error(`Failed to trigger check: ${triggerResponse.status} ${error}`);
    }

    const triggerData = await triggerResponse.json();
    const checkRunId = triggerData.checkRunId;
    console.log(`✅ Check started! ID: ${checkRunId}`);
    console.log(`📊 View results at: ${APP_URL}/check/results/${checkRunId}`);

    // 2. Poll for completion
    let status = 'IN_PROGRESS';
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes (5s interval)

    while (status === 'IN_PROGRESS' || status === 'PENDING') {
      if (attempts >= maxAttempts) {
        throw new Error('Check timed out');
      }

      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s
      attempts++;

      const statusResponse = await fetch(`${APP_URL}/api/v1/checks/${checkRunId}`, {
        headers: { 'x-api-key': API_KEY! },
      });

      if (!statusResponse.ok) {
        console.warn('Warning: Failed to fetch status, retrying...');
        continue;
      }

      const statusData = await statusResponse.json();
      status = statusData.status;
      
      process.stdout.write('.');
    }

    console.log('\n');

    // 3. Report Results
    const finalResponse = await fetch(`${APP_URL}/api/v1/checks/${checkRunId}`, {
      headers: { 'x-api-key': API_KEY! },
    });
    const finalData = await finalResponse.json();

    if (status === 'FAILED') {
      console.error('❌ Check failed to complete!');
      console.error(`Error: ${finalData.errorMessage}`);
      process.exit(1);
    }

    console.log('🏁 Analysis Complete!');
    console.log('----------------------------------------');
    console.log(`Total Issues: ${finalData.summary.totalIssues}`);
    console.log(`🚨 High Severity: ${finalData.summary.highSeverity}`);
    console.log(`⚠️ Medium Severity: ${finalData.summary.mediumSeverity}`);
    console.log(`ℹ️ Low Severity: ${finalData.summary.lowSeverity}`);
    console.log('----------------------------------------');

    // Fail build if high severity issues exist
    if (finalData.summary.highSeverity > 0) {
      console.error('❌ Build failed: Critical/High severity issues found.');
      process.exit(1);
    }

    console.log('✅ Check passed!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

runCheck();
