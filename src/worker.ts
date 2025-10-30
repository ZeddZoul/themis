import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { cloneRepository, segmentCriticalFiles, cleanupRepository } from './services/repo.service';
import { performComplianceAnalysis } from './services/gemini.service';
import { saveComplianceReport } from './services/firestore.service';

// TODO: Replace with secure environment variables for production
const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379;

const connection = new IORedis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: null,
});

// Define the job processing function
const processJob = async (job: Job) => {
    // We need appId and userId for Firestore paths, which would be in the job data.
    const { repoUrl, encryptedToken, branch, commitHash, appId, userId } = job.data;
    let tempDir: string | null = null;

    if (!appId || !userId) {
        throw new Error(`Job ${job.id} is missing critical data: appId or userId.`);
    }

    try {
        console.log(`Starting job ${job.id}: Cloning ${repoUrl}`);
        const { tempDir: newTempDir } = await cloneRepository(repoUrl, encryptedToken, branch, commitHash);
        tempDir = newTempDir;

        console.log(`Job ${job.id}: Segmenting critical files in ${tempDir}`);
        const criticalFiles = await segmentCriticalFiles(tempDir);
        console.log(`Job ${job.id}: Found ${criticalFiles.length} critical files.`);

        console.log(`Job ${job.id}: Starting Gemini analysis...`);
        const report = await performComplianceAnalysis(criticalFiles);
        console.log(`Job ${job.id}: Gemini analysis complete. App status: ${report.app_status}`);

        console.log(`Job ${job.id}: Saving report to Firestore...`);
        await saveComplianceReport(appId, userId, job.id, report);

        console.log(`Job ${job.id} completed and report saved.`);
    } catch (error) {
    console.error(`Job ${job.id} failed:`, error);
    // Re-throw the error to let BullMQ handle the job failure
    throw error;
  } finally {
    if (tempDir) {
      console.log(`Job ${job.id}: Starting cleanup for ${tempDir}`);
      await cleanupRepository(tempDir);
    }
  }
};

// Create the worker
const worker = new Worker('compliance-checks', processJob, {
  connection,
  concurrency: 5, // Process up to 5 jobs concurrently
  limiter: {
    max: 10, // Max 10 jobs
    duration: 1000, // per second
  },
});

console.log('Worker is listening for jobs...');

worker.on('completed', (job) => {
  console.log(`Worker completed job ${job.id}`);
});

worker.on('failed', (job, err) => {
  console.error(`Worker failed job ${job.id} with error: ${err.message}`);
});
