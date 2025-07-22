import cron from 'node-cron';
import { 
  cleanupExpiredAccessTokens,
  cleanupExpiredRefreshTokens,
  cleanupRevokedTokens,
  cleanupInactiveSessions,
  cleanupOverusedTokens,
  cleanupAllTokens,
  getTokenStats
} from '../utils/tokenCleanup.js';

let cleanupJobs = [];

// Initialize cleanup schedulers
export const initializeCleanupSchedulers = () => {
  console.log('Initializing token cleanup schedulers...');

  // Cleanup expired access tokens every hour
  const accessTokenCleanup = cron.schedule('0 * * * *', async () => {
    console.log('Running scheduled access token cleanup...');
    const stats = await getTokenStats();
    if (stats) {
      console.log('Before cleanup:', stats);
    }
    
    const cleaned = await cleanupExpiredAccessTokens();
    
    const newStats = await getTokenStats();
    if (newStats) {
      console.log('After cleanup:', newStats);
    }
  }, {
    scheduled: false,
    timezone: "UTC"
  });

  // Cleanup expired refresh tokens every 24 hours
  const refreshTokenCleanup = cron.schedule('0 0 * * *', async () => {
    console.log('Running scheduled refresh token cleanup...');
    const stats = await getTokenStats();
    if (stats) {
      console.log('Before cleanup:', stats);
    }
    
    const cleaned = await cleanupExpiredRefreshTokens();
    
    const newStats = await getTokenStats();
    if (newStats) {
      console.log('After cleanup:', newStats);
    }
  }, {
    scheduled: false,
    timezone: "UTC"
  });

  // Cleanup revoked tokens every 12 hours
  const revokedTokenCleanup = cron.schedule('0 */12 * * *', async () => {
    console.log('Running scheduled revoked token cleanup...');
    await cleanupRevokedTokens();
  }, {
    scheduled: false,
    timezone: "UTC"
  });

  // Cleanup inactive sessions every 6 hours
  const sessionCleanup = cron.schedule('0 */6 * * *', async () => {
    console.log('Running scheduled session cleanup...');
    await cleanupInactiveSessions();
  }, {
    scheduled: false,
    timezone: "UTC"
  });

  // Cleanup overused tokens every 24 hours
  const overusedTokenCleanup = cron.schedule('30 0 * * *', async () => {
    console.log('Running scheduled overused token cleanup...');
    await cleanupOverusedTokens();
  }, {
    scheduled: false,
    timezone: "UTC"
  });

  // Comprehensive cleanup every week (Sunday at 2 AM)
  const comprehensiveCleanup = cron.schedule('0 2 * * 0', async () => {
    console.log('Running comprehensive weekly cleanup...');
    const result = await cleanupAllTokens();
    console.log('Weekly cleanup completed:', result);
  }, {
    scheduled: false,
    timezone: "UTC"
  });

  // Store job references
  cleanupJobs = [
    accessTokenCleanup, 
    refreshTokenCleanup, 
    revokedTokenCleanup,
    sessionCleanup, 
    overusedTokenCleanup,
    comprehensiveCleanup
  ];

  // Start all jobs
  accessTokenCleanup.start();
  refreshTokenCleanup.start();
  revokedTokenCleanup.start();
  sessionCleanup.start();
  overusedTokenCleanup.start();
  comprehensiveCleanup.start();

  console.log('Token cleanup schedulers initialized:');
  console.log('- Access tokens: Every hour');
  console.log('- Refresh tokens: Every 24 hours');
  console.log('- Revoked tokens: Every 12 hours');
  console.log('- Sessions: Every 6 hours');
  console.log('- Overused tokens: Every 24 hours (00:30)');
  console.log('- Comprehensive cleanup: Every Sunday at 2 AM');
};

// Stop all cleanup schedulers
export const stopCleanupSchedulers = () => {
  console.log('Stopping cleanup schedulers...');
  cleanupJobs.forEach(job => {
    if (job) {
      job.stop();
    }
  });
  cleanupJobs = [];
};

// Manual cleanup trigger
export const triggerManualCleanup = async () => {
  console.log('Starting manual cleanup...');
  
  const stats = await getTokenStats();
  console.log('Before manual cleanup:', stats);
  
  const [accessCleaned, refreshCleaned, revokedCleaned, sessionCleaned, overusedCleaned] = await Promise.all([
    cleanupExpiredAccessTokens(),
    cleanupExpiredRefreshTokens(),
    cleanupRevokedTokens(),
    cleanupInactiveSessions(),
    cleanupOverusedTokens()
  ]);
  
  const newStats = await getTokenStats();
  console.log('After manual cleanup:', newStats);
  
  return {
    accessTokensCleaned: accessCleaned,
    refreshTokensCleaned: refreshCleaned,
    revokedTokensCleaned: revokedCleaned,
    sessionsCleaned: sessionCleaned,
    overusedTokensCleaned: overusedCleaned,
    beforeStats: stats,
    afterStats: newStats
  };
};

// Trigger comprehensive cleanup manually
export const triggerComprehensiveCleanup = async () => {
  console.log('Starting comprehensive manual cleanup...');
  
  const stats = await getTokenStats();
  console.log('Before comprehensive cleanup:', stats);
  
  const result = await cleanupAllTokens();
  
  const newStats = await getTokenStats();
  console.log('After comprehensive cleanup:', newStats);
  
  return {
    ...result,
    beforeStats: stats,
    afterStats: newStats
  };
};

// Get current token statistics
export const getCleanupStats = async () => {
  try {
    const stats = await getTokenStats();
    return stats;
  } catch (error) {
    console.error('Error getting cleanup stats:', error);
    return null;
  }
};

// Check if schedulers are running
export const getSchedulerStatus = () => {
  return {
    initialized: cleanupJobs.length > 0,
    activeJobs: cleanupJobs.length,
    jobs: cleanupJobs.map((job, index) => ({
      index,
      running: job ? job.running : false
    }))
  };
};