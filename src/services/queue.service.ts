import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

// TODO: Replace with secure environment variables for production
const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379;

// Create a new connection in every instance
const connection = new IORedis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: null // Required for BullMQ
});

// Create a new queue
export const complianceQueue = new Queue('compliance-checks', { connection });

/**
 * Adds a new compliance check job to the queue.
 * @param {object} jobData The data for the job.
 * @param {string} jobId The unique ID for the job.
 * @returns {Promise<void>}
 */
export const addComplianceJob = async (jobData: object, jobId: string) => {
  await complianceQueue.add('check-repo', jobData, { jobId });
};

// In a real worker service, you would create a worker like this:
/*
const worker = new Worker('compliance-checks', async job => {
  // Process the job
  console.log('Processing job:', job.data);
}, { connection });

worker.on('completed', job => {
  console.log(`${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
  console.log(`${job.id} has failed with ${err.message}`);
});
*/
