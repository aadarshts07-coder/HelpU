/**
 * Standalone BullMQ Background Worker for HELP U
 * Run with: npm run worker
 */
const { Worker } = require('bullmq');
const IORedis = require('ioredis');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
console.log('----------------------------------------------------');
console.log('🤖 HELP U Playwright Background Worker Initializing');
console.log(`Connecting to Redis: ${redisUrl}`);
console.log('----------------------------------------------------');

try {
  const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

  const worker = new Worker(
    'helpu-applications',
    async (job) => {
      console.log(`[Worker] Processing Job Application ID: ${job.id}`);
      const { job: jobData, profile, settings } = job.data;
      console.log(`[Worker] Candidate: ${profile.name} -> ${jobData.title} at ${jobData.company}`);

      // Dynamically load runner
      const { executePlaywrightApplication } = require('../dist/workers/playwrightRunner');
      const result = await executePlaywrightApplication(jobData, profile, settings);
      console.log(`[Worker] Job ${job.id} completed with status: ${result.status}`);
      return result;
    },
    { connection, concurrency: 2 }
  );

  worker.on('completed', (job) => {
    console.log(`✅ [Worker] Application ${job.id} processed successfully!`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ [Worker] Application ${job?.id} failed:`, err);
  });

  console.log('🚀 HELP U Worker is actively listening for jobs in queue "helpu-applications"...');
} catch (err) {
  console.warn('⚠️ Could not connect to standalone Redis server:', err.message);
  console.log('💡 Note: The Next.js web application includes built-in async execution fallback, so all automated applications work directly even when Redis is not running!');
}
