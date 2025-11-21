
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function main() {
  // Get the latest check run ID
  const latestCheck = await prisma.checkRun.findFirst({
    orderBy: { createdAt: 'desc' },
  });

  if (!latestCheck) {
    console.log('No check runs found');
    return;
  }

  console.log(`Testing query for CheckRun ID: ${latestCheck.id}`);

  // Exact query from app/api/v1/checks/[id]/route.ts
  const checkRun = await prisma.checkRun.findUnique({
    where: { id: latestCheck.id },
    select: {
      id: true,
      repositoryId: true,
      owner: true,
      repo: true,
      branchName: true,
      status: true,
      checkType: true,
      issues: true, // This selects the entire JSON blob
      errorType: true,
      errorMessage: true,
      errorDetails: true,
      createdAt: true,
      completedAt: true,
    },
  });

  if (!checkRun) {
    console.log('Check run not found via findUnique');
    return;
  }

  const issues = (checkRun.issues as any[]) || [];
  
  if (issues.length > 0) {
    console.log('First issue keys:', Object.keys(issues[0]));
    console.log('First issue AI data:', {
      hasLoc: !!issues[0].aiPinpointLocation,
      hasFix: !!issues[0].aiSuggestedFix
    });
    console.log('First issue full content:', JSON.stringify(issues[0], null, 2));
  } else {
    console.log('No issues found in check run');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
