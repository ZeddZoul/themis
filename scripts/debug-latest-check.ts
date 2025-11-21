
import { prisma } from '../lib/prisma';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function debugLatestCheck() {
  try {
    const latestCheck = await prisma.checkRun.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!latestCheck) {
      console.log('No check runs found.');
      return;
    }

    console.log(`Latest Check Run ID: ${latestCheck.id}`);
    console.log(`Status: ${latestCheck.status}`);
    console.log(`Created At: ${latestCheck.createdAt}`);

    const issues = latestCheck.issues as any[];
    console.log(`Total Issues: ${issues.length}`);

    let aiDataFound = false;
    issues.forEach((issue, index) => {
      console.log(`\nIssue #${index + 1}: ${issue.ruleId}`);
      console.log(`Category: ${issue.category}`);
      console.log(`File: ${issue.file || 'UNDEFINED'}`);
      
      if (issue.aiPinpointLocation) {
        console.log('  ✅ aiPinpointLocation found');
        console.log('  ', JSON.stringify(issue.aiPinpointLocation));
        aiDataFound = true;
      } else {
        console.log('  ❌ aiPinpointLocation MISSING');
      }

      if (issue.aiSuggestedFix) {
        console.log('  ✅ aiSuggestedFix found');
        console.log('  ', JSON.stringify(issue.aiSuggestedFix));
        aiDataFound = true;
      } else {
        console.log('  ❌ aiSuggestedFix MISSING');
      }
    });

    if (!aiDataFound) {
      console.log('\n⚠️ NO AI DATA FOUND IN ANY ISSUE');
    } else {
      console.log('\n✅ AI DATA FOUND IN AT LEAST ONE ISSUE');
    }

  } catch (error) {
    console.error('Error debugging check:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugLatestCheck();
