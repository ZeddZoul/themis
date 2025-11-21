
import { prisma } from '../lib/prisma';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function getLatestCheckRepo() {
  const latestCheck = await prisma.checkRun.findFirst({
    orderBy: { createdAt: 'desc' },
  });

  if (!latestCheck) {
    console.log('No check runs found.');
    return;
  }

  console.log(`Latest Check Run ID: ${latestCheck.id}`);
  console.log(`Repo: ${latestCheck.owner}/${latestCheck.repo}`);
  console.log(`Branch: ${latestCheck.branchName}`);
}

getLatestCheckRepo();
